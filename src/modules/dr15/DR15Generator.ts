import { z } from 'zod';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { DR15ReportSchema, type DR15Report, type DR15Breakdown } from './DR15Report.types';
import { FloridaTaxConfigModel } from '../../database/models/FloridaTaxConfig';

export class DR15Generator {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    async generateMonthlyReport(year: number, month: number): Promise<DR15Report> {
        // 1. Zod Validation for Inputs
        const InputSchema = z.object({
            year: z.number().int().min(2000),
            month: z.number().int().min(1).max(12)
        });
        InputSchema.parse({ year, month });

        // 2. Fetch Invoices for Period
        // Using string formatting for date comparison to be safe with SQLite dates
        // Assuming issue_date is 'YYYY-MM-DD'
        const monthStr = month.toString().padStart(2, '0');
        const periodStr = `${year}-${monthStr}`;

        const query = `
      SELECT 
        i.subtotal, 
        i.tax_amount, 
        i.total_amount,
        c.florida_county as county,
        c.tax_exempt
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE strftime('%Y-%m', i.issue_date) = ?
        AND i.status != 'cancelled'
        AND i.status != 'draft'
    `;

        // Execute query
        // Note: SQLiteEngine.select usually returns array of objects.
        const invoices = await this.engine.select(query, [periodStr]);

        // 3. Aggregate Data
        const countyMap = new Map<string, DR15Breakdown>();

        // Initialize standard counties from config to always have them present? 
        // Spec says "Group by county", but usually DR-15 lists all counties where you have nexus.
        // For now, we aggregate based on what we find, or we could preload.
        // Let's rely on data found + ensure 0s for others if needed later. 
        // For this MVP step, we aggregate found data.

        let totalGrossSales = 0;
        let totalTaxableSales = 0;
        let totalTaxCollected = 0;

        for (const inv of invoices) {
            const county = inv.county || 'Unknown';
            // Basic numbers
            const subtotal = Number(inv.subtotal) || 0;
            const taxAmount = Number(inv.tax_amount) || 0;

            let taxable = subtotal;
            if (inv.tax_exempt) {
                taxable = 0;
            } else if (taxAmount === 0 && subtotal > 0) {
                // If tax is 0 and not marked exempt explicitly in customer, 
                // check if invoice implies mock exemption? 
                // For now assume tax_amount > 0 implies taxable.
                // Actually, safer to rely on tax_amount.
                // If tax_amount > 0, it was taxable. If 0, likely exempt or rate 0.
            }

            // Refined Logic:
            // Gross Sales = Subtotal (ignoring tax exempt status, it's still a sale)
            // Taxable Sales = Subtotal if not exempt

            // However, we might have mixed bags. 
            // Ideally we check line items, but we are querying invoices header.
            // If Customer is tax_exempt, whole invoice is exempt.
            // If not, usually taxable.

            const isExempt = !!inv.tax_exempt;
            const gross = subtotal;
            const taxableVal = isExempt ? 0 : subtotal;
            const taxVal = taxAmount;

            // Update Totals
            totalGrossSales += gross;
            totalTaxableSales += taxableVal;
            totalTaxCollected += taxVal;

            // Update Breakdown
            const existing = countyMap.get(county) || {
                county,
                grossSales: 0,
                taxableSales: 0,
                taxCollected: 0
            };

            existing.grossSales += gross;
            existing.taxableSales += taxableVal;
            existing.taxCollected += taxVal;

            countyMap.set(county, existing);
        }

        // 4. Format Output
        const countyBreakdown = Array.from(countyMap.values()).map(c => ({
            county: c.county,
            grossSales: this.round(c.grossSales),
            taxableSales: this.round(c.taxableSales),
            taxCollected: this.round(c.taxCollected)
        }));

        const result = {
            month,
            year,
            generatedAt: new Date(),
            totalGrossSales: this.round(totalGrossSales),
            totalTaxableSales: this.round(totalTaxableSales),
            totalTaxCollected: this.round(totalTaxCollected),
            countyBreakdown
        };

        // 5. Validate Output
        return DR15ReportSchema.parse(result);
    }

    private round(num: number): number {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }
}
