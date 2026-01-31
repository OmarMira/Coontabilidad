import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { FloridaTaxEngine } from '../accounting/FloridaTaxEngine';

/**
 * DR15ReportGenerator - Florida Sales Tax Report (DR-15)
 * 
 * Generates the Florida Department of Revenue DR-15 report
 * for sales tax filing compliance.
 * 
 * Report includes:
 * - Total taxable sales
 * - Total exempt sales
 * - State tax collected (6%)
 * - County surtax collected (by county)
 * - Total tax due
 * 
 * CRITICAL: All amounts calculated from INTEGER cents (FloridaTaxEngine)
 * Conversion to dollars happens ONLY in final report display
 * 
 * @example
 * const generator = new DR15ReportGenerator(db);
 * const report = generator.generateReport('2026-01', '2026-01-31');
 * // Returns: { totalSales: 100000, stateTax: 6000, countyTax: 500, ... }
 */
interface ReportInvoice {
    id: number;
    invoice_number: string;
    subtotal: number;
    tax: number;
    total: number;
    created_at: string;
    county: string;
    customer_name: string;
}

export class DR15ReportGenerator {
    private taxEngine: FloridaTaxEngine;

    constructor(private db: SQLiteEngine) {
        this.taxEngine = FloridaTaxEngine.getInstance(db);
    }

    /**
     * Generate DR-15 report for a period
     * 
     * @param startDate - Period start date (YYYY-MM-DD)
     * @param endDate - Period end date (YYYY-MM-DD)
     * @returns DR-15 report data
     */
    public async generateReport(startDate: string, endDate: string): Promise<DR15Report> {
        // Ensure tax rates are loaded
        await this.taxEngine.loadRates();

        // Get all posted invoices for the period
        const invoices = await this.db.select(`
            SELECT 
                i.id,
                i.invoice_number,
                i.subtotal,
                i.tax,
                i.total,
                i.created_at,
                c.county,
                c.name as customer_name
            FROM invoices i
            JOIN customers c ON i.customer_id = c.id
            WHERE i.status = 'posted'
            AND DATE(i.created_at) >= ?
            AND DATE(i.created_at) <= ?
            ORDER BY i.created_at
        `, [startDate, endDate]) as unknown as ReportInvoice[];

        // Initialize counters (all in INTEGER cents)
        let totalTaxableSalesCents = 0;
        let totalStateTaxCents = 0;
        let totalCountyTaxCents = 0;

        const countyBreakdown: Map<string, CountyTaxData> = new Map();

        // Process each invoice
        for (const invoice of invoices) {
            const subtotalCents = invoice.subtotal;
            const taxCents = invoice.tax;
            const county = invoice.county;

            // Add to total taxable sales
            totalTaxableSalesCents += subtotalCents;

            // Get tax breakdown from FloridaTaxEngine (Sync if loaded)
            const taxBreakdown = this.taxEngine.getTaxBreakdown(subtotalCents, county);

            totalStateTaxCents += taxBreakdown.stateTaxCents;
            totalCountyTaxCents += taxBreakdown.surtaxCents;

            // Update county breakdown
            if (!countyBreakdown.has(county)) {
                countyBreakdown.set(county, {
                    county,
                    salesCents: 0,
                    stateTaxCents: 0,
                    surtaxCents: 0,
                    totalTaxCents: 0,
                    invoiceCount: 0
                });
            }

            const countyData = countyBreakdown.get(county)!;
            countyData.salesCents += subtotalCents;
            countyData.stateTaxCents += taxBreakdown.stateTaxCents;
            countyData.surtaxCents += taxBreakdown.surtaxCents;
            countyData.totalTaxCents += taxCents;
            countyData.invoiceCount++;
        }

        // Calculate totals
        const totalTaxCents = totalStateTaxCents + totalCountyTaxCents;

        // Verify against invoice tax totals
        // Verify against invoice tax totals
        const invoiceTaxTotal = invoices.reduce((sum: number, inv: ReportInvoice) => sum + inv.tax, 0);
        const discrepancyCents = totalTaxCents - invoiceTaxTotal;

        return {
            periodStart: startDate,
            periodEnd: endDate,
            generatedAt: new Date().toISOString(),

            // Summary (in cents)
            totalTaxableSalesCents,
            totalStateTaxCents,
            totalCountyTaxCents,
            totalTaxCents,

            // Verification
            invoiceTaxTotalCents: invoiceTaxTotal,
            discrepancyCents,
            isAccurate: discrepancyCents === 0,

            // County breakdown
            countyBreakdown: Array.from(countyBreakdown.values()).sort((a, b) =>
                a.county.localeCompare(b.county)
            ),

            // Metadata
            invoiceCount: invoices.length,
            uniqueCounties: countyBreakdown.size
        };
    }

    /**
     * Generate DR-15 report in PDF format
     * 
     * @param startDate - Period start date
     * @param endDate - Period end date
     * @returns PDF blob
     */
    public async generatePDF(startDate: string, endDate: string): Promise<Blob> {
        const report = await this.generateReport(startDate, endDate);

        // TODO: Integrate with jsPDF
        // For now, return a mock blob
        const content = this.formatReportAsText(report);
        return new Blob([content], { type: 'application/pdf' });
    }

    /**
     * Generate DR-15 report in Excel format
     * 
     * @param startDate - Period start date
     * @param endDate - Period end date
     * @returns Excel blob
     */
    public async generateExcel(startDate: string, endDate: string): Promise<Blob> {
        const report = await this.generateReport(startDate, endDate);

        // TODO: Integrate with ExcelJS
        // For now, return a mock blob
        const content = this.formatReportAsCSV(report);
        return new Blob([content], { type: 'text/csv' });
    }

    /**
     * Get next filing deadline
     * 
     * Florida DR-15 is due on the 20th of the following month
     * 
     * @param forMonth - Month to check (YYYY-MM)
     * @returns Filing deadline date
     */
    public getFilingDeadline(forMonth: string): string {
        const [year, month] = forMonth.split('-').map(Number);

        // Next month
        let nextMonth = month + 1;
        let nextYear = year;

        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
        }

        // 20th of next month
        return `${nextYear}-${String(nextMonth).padStart(2, '0')}-20`;
    }

    /**
     * Check if filing is overdue
     * 
     * @param forMonth - Month to check (YYYY-MM)
     * @returns True if overdue
     */
    public isFilingOverdue(forMonth: string): boolean {
        const deadline = new Date(this.getFilingDeadline(forMonth));
        const today = new Date();
        return today > deadline;
    }

    /**
     * Format report as plain text
     * @private
     */
    private formatReportAsText(report: DR15Report): string {
        const centsToDollars = (cents: number) => (cents / 100).toFixed(2);

        let text = `FLORIDA DEPARTMENT OF REVENUE
DR-15 SALES AND USE TAX RETURN (DRAFT)

Period: ${report.periodStart} to ${report.periodEnd}
Generated: ${new Date(report.generatedAt).toLocaleString()}

----------------------------------------
SUMMARY
----------------------------------------
Total Taxable Sales:     $${centsToDollars(report.totalTaxableSalesCents)
            }
State Tax(6%):          $${centsToDollars(report.totalStateTaxCents)}
County Surtax:           $${centsToDollars(report.totalCountyTaxCents)}
----------------------------------------
    TOTAL TAX DUE:           $${centsToDollars(report.totalTaxCents)}

----------------------------------------
    COUNTY BREAKDOWN
----------------------------------------
    `;

        for (const county of report.countyBreakdown) {
            text += `
${county.county} County:
Sales:        $${centsToDollars(county.salesCents)}
  State Tax:    $${centsToDollars(county.stateTaxCents)}
Surtax:       $${centsToDollars(county.surtaxCents)}
  Total Tax:    $${centsToDollars(county.totalTaxCents)}
Invoices:     ${county.invoiceCount}
`;
        }

        text += `
----------------------------------------
    VERIFICATION
----------------------------------------
    Invoice Tax Total:       $${centsToDollars(report.invoiceTaxTotalCents)}
Calculated Tax Total:    $${centsToDollars(report.totalTaxCents)}
Discrepancy:             $${centsToDollars(report.discrepancyCents)}
Status:                  ${report.isAccurate ? '✓ ACCURATE' : '⚠ DISCREPANCY DETECTED'}

Total Invoices:          ${report.invoiceCount}
Counties Covered:        ${report.uniqueCounties}
`;

        return text;
    }

    /**
     * Format report as CSV
     * @private
     */
    private formatReportAsCSV(report: DR15Report): string {
        const centsToDollars = (cents: number) => (cents / 100).toFixed(2);

        let csv = `County, Sales, State Tax, County Surtax, Total Tax, Invoice Count\n`;

        for (const county of report.countyBreakdown) {
            csv += `${county.county}, `;
            csv += `${centsToDollars(county.salesCents)}, `;
            csv += `${centsToDollars(county.stateTaxCents)}, `;
            csv += `${centsToDollars(county.surtaxCents)}, `;
            csv += `${centsToDollars(county.totalTaxCents)}, `;
            csv += `${county.invoiceCount} \n`;
        }

        csv += `\nTOTALS, `;
        csv += `${centsToDollars(report.totalTaxableSalesCents)}, `;
        csv += `${centsToDollars(report.totalStateTaxCents)}, `;
        csv += `${centsToDollars(report.totalCountyTaxCents)}, `;
        csv += `${centsToDollars(report.totalTaxCents)}, `;
        csv += `${report.invoiceCount} \n`;

        return csv;
    }
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface DR15Report {
    periodStart: string;
    periodEnd: string;
    generatedAt: string;

    // Summary (INTEGER cents)
    totalTaxableSalesCents: number;
    totalStateTaxCents: number;
    totalCountyTaxCents: number;
    totalTaxCents: number;

    // Verification
    invoiceTaxTotalCents: number;
    discrepancyCents: number;
    isAccurate: boolean;

    // County breakdown
    countyBreakdown: CountyTaxData[];

    // Metadata
    invoiceCount: number;
    uniqueCounties: number;
}

export interface CountyTaxData {
    county: string;
    salesCents: number;
    stateTaxCents: number;
    surtaxCents: number;
    totalTaxCents: number;
    invoiceCount: number;
}
