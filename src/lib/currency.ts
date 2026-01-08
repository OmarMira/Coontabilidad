/**
 * Currency Utils - AccountExpress V3.0
 * Regla: "Siempre centavos" - No floats en base de datos.
 */

export const CurrencyUtils = {
    /**
     * Convierte un monto visual (float) a centavos internos (integer).
     * @param amount Monto decimal (ej: 100.50)
     * @returns Entero en centavos (ej: 10050)
     */
    toCents: (amount: number): number => {
        return Math.round(amount * 100);
    },

    /**
     * Convierte centavos internos a monto visual (float) para UI.
     * @param cents Entero en centavos (ej: 10050)
     * @returns Monto decimal (ej: 100.50)
     */
    fromCents: (cents: number): number => {
        return cents / 100;
    },

    /**
     * Formatea centavos a string de moneda local.
     * @param cents Entero en centavos
     * @returns String formateado (ej: "$100.50")
     */
    format: (cents: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(cents / 100);
    }
};
