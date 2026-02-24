import { DatabaseService } from '../database/DatabaseService';
import { WorkerOrchestrator } from '../core/workers/WorkerOrchestrator';
import { BasicEncryption } from '../core/security/BasicEncryption';

export interface DR15Report {
    taxpayerInfo: {
        fein: string;
        period: string; // YYYY-MM
    };
    countySummary: {
        code: string;
        sales: number; // cents
        tax: number; // cents
    }[];
    totals: {
        sales: number;
        tax: number;
    };
    verification: {
        checksum: string;
        generatedAt: string;
    };
}

export interface ComplianceAlert {
    id: string;
    title: string;
    dueDate: string; // ISO YYYY-MM-DD
    daysRemaining: number;
    severity: 'info' | 'warning' | 'critical';
    estimatedPenalty?: number;
}

export class TaxReportingService {

    private static orchestrator: WorkerOrchestrator | null = null;

    private static getOrchestrator(): WorkerOrchestrator {
        if (!this.orchestrator) {
            this.orchestrator = new WorkerOrchestrator();
        }
        return this.orchestrator;
    }

    /**
     * Generates the Florida DR-15 Sales and Use Tax Return data.
     */
    static async generateDR15Report(month: number, year: number): Promise<DR15Report> {
        // 1. Define Period
        const periodStr = `${year}-${month.toString().padStart(2, '0')}`;
        const startISO = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
        const endISO = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();

        // 2. Query Transactions (DB Task - main thread)
        const results = await DatabaseService.executeQuery(`
            SELECT county_code, SUM(taxable_amount) as total_sales, SUM(tax_amount) as total_tax 
            FROM tax_transactions 
            WHERE transaction_date >= '${startISO}' AND transaction_date <= '${endISO}'
            GROUP BY county_code
        `);

        const countySummary = results.map(r => ({
            code: r.county_code,
            sales: r.total_sales || 0,
            tax: r.total_tax || 0
        }));

        // 3. Process Report (CPU Task - worker thread)
        const processed = await this.getOrchestrator().executeTask<any>('ACCOUNTING', {
            operation: 'PROCESS_TAX_REPORT',
            countySummary,
            periodStr
        });

        return {
            taxpayerInfo: {
                fein: '20-2026FL',
                period: periodStr
            },
            countySummary,
            totals: {
                sales: processed.totalSales,
                tax: processed.totalTax
            },
            verification: {
                checksum: processed.checksum,
                generatedAt: processed.generatedAt
            }
        };
    }

    /**
     * Placeholder implementation for CIT F-1120.
     */
    static async generateCITReport(fiscalYear: number): Promise<any> {
        return {
            form: 'F-1120',
            fiscalYear,
            status: 'pending_implementation',
            note: 'Requires AssetDepreciationService (Week 1)'
        };
    }



    /**
     * Checks if the Florida tax configuration is present and valid.
     */
    static async hasValidConfiguration(): Promise<{
        valid: boolean;
        counties: number;
        missingCounties: string[]; // Populated if count < 67
        outdatedRates: boolean;
    }> {
        // 1. Check Count
        const rows = await DatabaseService.executeQuery("SELECT county_name FROM florida_tax_rates");
        const count = rows.length;

        // 2. Check Rates (Base Rate must be 6% = 600)
        const badRatesRes = await DatabaseService.executeQuery("SELECT count(*) as c FROM florida_tax_rates WHERE state_rate != 0.06");
        const hasBadRates = badRatesRes[0]?.c > 0;

        const missing: string[] = [];
        if (count < 67) {
            missing.push(`Missing ${67 - count} counties`);
        }

        return {
            valid: count === 67 && !hasBadRates,
            counties: count,
            missingCounties: missing,
            outdatedRates: hasBadRates
        };
    }

    /**
     * Generates compliance alerts for Florida entities.
     * Logic:
     * - Alert if DR-15 due (20th)
     * - Alert if Sunbiz due (May 1)
     * - Alert if CIT due (May 1)
     */
    static async getComplianceAlerts(): Promise<ComplianceAlert[]> {
        const today = new Date();
        const currentYear = today.getFullYear();
        const alerts: ComplianceAlert[] = [];

        const createAlert = (id: string, title: string, dateStr: string, penalty: number): void => {
            const due = new Date(dateStr);
            // Reset times for date-only compare
            const todayReset = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dueReset = new Date(due.getFullYear(), due.getMonth(), due.getDate());

            const diffMs = dueReset.getTime() - todayReset.getTime();
            const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            // Show if within 30 days or overdue (up to 1 year)
            if (daysRemaining > 30 && daysRemaining > -365) return;
            // Or if overdue? Always show overdue.
            // If more than 30 days away, skip.
            if (daysRemaining > 30) return;

            let severity: 'info' | 'warning' | 'critical' = 'info';
            if (daysRemaining < 0) severity = 'critical';
            else if (daysRemaining <= 7) severity = 'warning';

            alerts.push({
                id,
                title,
                dueDate: dateStr,
                daysRemaining,
                severity,
                estimatedPenalty: daysRemaining < 0 ? penalty : 0
            });
        };

        // 1. Sunbiz Annual Report - Due May 1st
        createAlert('sunbiz', 'Sunbiz Annual Report (Florida)', `${currentYear}-05-01`, 400);

        // 2. Unclaimed Property - Due April 30
        createAlert('unclaimed', 'Unclaimed Property Report', `${currentYear}-04-30`, 0);

        // 3. CIT - Due May 1st
        createAlert('cit', 'Florida Corporate Income Tax (F-1120)', `${currentYear}-05-01`, 0);

        // 4. Monthly DR-15 - Due 20th
        // If day <= 20, due is 20th of THIS month (for prev month)
        // If day > 20, due is 20th of NEXT month (for this month)
        let dueMonth = today.getMonth();
        let dueYear = currentYear;

        if (today.getDate() > 20) {
            dueMonth++; // Next month
        }

        if (dueMonth > 11) {
            dueMonth = 0;
            dueYear++;
        }

        const dr15Due = new Date(dueYear, dueMonth, 20);
        const dr15Str = dr15Due.toISOString().split('T')[0];

        // Month name logic
        const reportingMonthIdx = dueMonth === 0 ? 11 : dueMonth - 1;
        const reportingMonthName = new Date(2000, reportingMonthIdx, 1).toLocaleString('default', { month: 'short' });

        createAlert('dr15', `Sales Tax Return (DR-15) - ${reportingMonthName}`, dr15Str, 50);

        return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }
}
