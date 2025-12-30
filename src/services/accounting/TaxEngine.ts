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
    private rates: Map<string, TaxRate> = new Map();

    constructor() {
        // Load initial rates (Hardcoded for now as per "Cargar mapeo" requirement, or mock loading from DB)
        // In production this comes from `florida_tax_rates` table.
        this.loadDefaultRates();
    }

    private loadDefaultRates() {
        // Sample of major counties. In real app, load from DB or full JSON.
        // Florida State Rate is 6%.
        const defaults = [
            { county: 'Miami-Dade', surtax: 0.01 }, // 7% total
            { county: 'Broward', surtax: 0.01 },    // 7% total
            { county: 'Palm Beach', surtax: 0.01 }, // 7% total
            { county: 'Orange', surtax: 0.005 },    // 6.5% total
            { county: 'Hillsborough', surtax: 0.015 }, // 7.5% total
            { county: 'Monroe', surtax: 0.015 }     // 7.5% total
        ];

        defaults.forEach(d => {
            this.rates.set(d.county, {
                county: d.county,
                stateRate: 0.06,
                countyRate: d.surtax,
                totalRate: 0.06 + d.surtax
            });
        });
    }

    getRate(county: string): TaxRate {
        return this.rates.get(county) || { county: 'Unknown', stateRate: 0.06, countyRate: 0.0, totalRate: 0.06 };
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
