
export class FloridaTaxCalculator {
    // Tasas por condado (Hardcoded por seguridad, pero idealmente vendrían de DB)
    private static COUNTY_RATES: Record<string, number> = {
        'Miami-Dade': 0.01,
        'Broward': 0.01,
        'Palm Beach': 0.01,
        'Orange': 0.005,
        'Hillsborough': 0.015,
        'Duval': 0.015,
        'Pinellas': 0.01
    };

    private static FLORIDA_STATE_RATE = 0.06;

    /**
     * Calcula el impuesto completo para una transacción
     */
    static calculateTax(amount: number, county: string, date: Date = new Date()): {
        stateTax: number;
        countyTax: number;
        totalTax: number;
        effectiveRate: number;
    } {
        // Validar condado
        const countyRate = this.COUNTY_RATES[county] || 0.00; // Default a 0 si no se encuentra (safe fallback)

        // Calcular componentes
        const stateTax = Number((amount * this.FLORIDA_STATE_RATE).toFixed(2));

        // El surtax del condado aplica solo a los primeros $5000 de una compra de propiedad tangible personal
        // Pero para simplificación en este MVP asumiremos regla general plana
        const countyTax = Number((amount * countyRate).toFixed(2));

        const totalTax = Number((stateTax + countyTax).toFixed(2));
        const effectiveRate = this.FLORIDA_STATE_RATE + countyRate;

        return {
            stateTax,
            countyTax,
            totalTax,
            effectiveRate
        };
    }

    /**
     * Valida si la tasa aplicada es correcta
     */
    static validateCompliance(amount: number, taxCharged: number, county: string): boolean {
        const calculated = this.calculateTax(amount, county);
        // Permitir pequeña diferencia por redondeo ($0.01)
        return Math.abs(calculated.totalTax - taxCharged) <= 0.01;
    }
}
