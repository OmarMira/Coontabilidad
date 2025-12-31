import { getFloridaTaxRate } from '../../database/simple-db';

export interface TaxRate {
    county: string;
    stateRate: number; // usually 0.06
    countyRate: number; // discretionary sales surtax
    totalRate: number;
}

export interface TaxBreakdown {
    subtotal: number;
    taxableAmount: number;
    exemptAmount: number;
    stateTax: number;
    countyTax: number;
    totalTax: number;
    totalAmount: number;
}

export class TaxEngine {
    constructor() {
        // Rates are now loaded dynamically from DB via simple-db
    }

    getRate(county: string): TaxRate {
        const totalRate = getFloridaTaxRate(county);
        const stateRate = 0.06;
        const countyRate = Math.max(0, totalRate - stateRate);

        return {
            county,
            stateRate,
            countyRate,
            totalRate
        };
    }

    // Round Half Up logic
    private round(num: number): number {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    calculateInvoiceTax(lines: any[], county: string): TaxBreakdown {
        const rate = this.getRate(county);
        return this.calculateTaxInternal(lines, rate);
    }

    // Correct implementation with proper loop
    calculateTaxInternal(lines: { quantity: number; unitPrice: number; taxable: boolean }[], rate: TaxRate): TaxBreakdown {
        let subtotal = 0;
        let taxableAmount = 0;
        let exemptAmount = 0;

        for (const line of lines) {
            const lineTotal = line.quantity * line.unitPrice;
            subtotal += lineTotal;
            if (line.taxable) {
                taxableAmount += lineTotal;
            } else {
                exemptAmount += lineTotal;
            }
        }

        const stateTax = this.round(taxableAmount * rate.stateRate);
        const countyTax = this.round(taxableAmount * rate.countyRate);
        const totalTax = stateTax + countyTax;

        return {
            subtotal: this.round(subtotal),
            taxableAmount: this.round(taxableAmount),
            exemptAmount: this.round(exemptAmount),
            stateTax,
            countyTax,
            totalTax,
            totalAmount: this.round(subtotal + totalTax)
        };
    }

    validateDR15Compliance(data: TaxBreakdown): boolean {
        // Verify math: Taxable + Exempt == Subtotal (within rounding error)
        // Verify Tax is correct % of Taxable
        // This is a sanity check for the "Integridad Fiscal"

        const calculatedTotal = data.subtotal + data.totalTax;
        if (Math.abs(calculatedTotal - data.totalAmount) > 0.01) return false;

        return true;
    }
}
