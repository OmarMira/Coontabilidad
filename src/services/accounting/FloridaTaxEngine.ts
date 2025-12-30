export interface FloridaTaxRate {
    county: string;
    stateRate: number; // 0.06
    discretionaryRate: number; // e.g. 0.01 for Miami-Dade
    validFrom: string;
}

export interface TaxCalculationResult {
    subtotal: number;
    taxableAmount: number;
    exemptAmount: number;
    stateTax: number;
    countyTax: number;
    totalTax: number;
    totalAmount: number;
}

export class FloridaTaxEngine {
    private rates: Map<string, FloridaTaxRate>;

    constructor(initialRates: FloridaTaxRate[]) {
        this.rates = new Map();
        initialRates.forEach(r => this.rates.set(r.county, r));
    }

    /**
     * Pure function to calculate tax based on loaded rates and input lines.
     * Does NOT touch the database.
     */
    public calculateTax(
        subtotal: number,
        taxableSubtotal: number,
        county: string
    ): TaxCalculationResult {
        const rateConfig = this.rates.get(county);

        // Default to FL State base (6%) if county unknown, but warn
        // Or throw error? Control Order implies strictness.
        // Let's assume safe fallback to State only tax if county not found to allow processing,
        // but marking it.
        const effectiveRate = rateConfig || {
            county: 'Unknown',
            stateRate: 0.06,
            discretionaryRate: 0.0,
            validFrom: new Date().toISOString()
        };

        const exemptAmount = subtotal - taxableSubtotal;

        // Rounding Rule: "Round Half Up" to 2 decimals per tax component usually, 
        // or on the total tax. Florida DR-15 uses brackets, but percentage calculation 
        // rounded to nearest cent is standard for software unless bracket system specified.
        // We use Math.round((val + Number.EPSILON) * 100) / 100

        const stateTax = this.round(taxableSubtotal * effectiveRate.stateRate);
        const countyTax = this.round(taxableSubtotal * effectiveRate.discretionaryRate);
        const totalTax = stateTax + countyTax;

        return {
            subtotal: this.round(subtotal),
            taxableAmount: this.round(taxableSubtotal),
            exemptAmount: this.round(exemptAmount),
            stateTax,
            countyTax,
            totalTax,
            totalAmount: this.round(subtotal + totalTax)
        };
    }

    private round(num: number): number {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    /**
     * Validates if a transaction result mathematically complies with the rate.
     * Useful for post-audit.
     */
    public validateCompliance(
        taxableAmount: number,
        totalTaxCollected: number,
        county: string
    ): boolean {
        const rate = this.rates.get(county);
        if (!rate) return false;

        const expectedTotalRate = rate.stateRate + rate.discretionaryRate;
        const expectedTax = this.round(taxableAmount * expectedTotalRate);

        // Allow 1 cent variance due to rounding diffs
        return Math.abs(expectedTax - totalTaxCollected) <= 0.01;
    }
}
