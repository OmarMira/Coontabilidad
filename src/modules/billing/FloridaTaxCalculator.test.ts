import { describe, it, expect } from 'vitest';
import { FloridaTaxCalculator } from './FloridaTaxCalculator';
import { ZodError } from 'zod';

describe('FloridaTaxCalculator', () => {
    const calculator = new FloridaTaxCalculator();

    describe('Happy Path Calculations', () => {
        it('should correctly calculate tax for Miami-Dade (7.5%)', () => {
            const result = calculator.calculate(100.00, 'Miami-Dade');

            expect(result.subtotal).toBe(100.00);
            expect(result.appliedRate).toBe(0.075);
            expect(result.taxAmount).toBe(7.50);
            expect(result.total).toBe(107.50);
            expect(result.county).toBe('Miami-Dade');
        });

        it('should correctly calculate tax for Broward (7.0%)', () => {
            const result = calculator.calculate(100.00, 'Broward');

            expect(result.appliedRate).toBe(0.07);
            expect(result.taxAmount).toBe(7.00);
            expect(result.total).toBe(107.00);
        });

        it('should correctly calculate tax for Orange (6.5%)', () => {
            const result = calculator.calculate(100.00, 'Orange');

            expect(result.appliedRate).toBe(0.065);
            expect(result.taxAmount).toBe(6.50);
            expect(result.total).toBe(106.50);
        });

        it('should handle decimal subtotals correctly (Rounding)', () => {
            // Miami-Dade 7.5%
            // 150.55 * 0.075 = 11.29125 -> 11.29
            const result = calculator.calculate(150.55, 'Miami-Dade');
            expect(result.taxAmount).toBe(11.29);
            expect(result.total).toBe(161.84);
        });
    });

    describe('Validation & Error Handling', () => {
        it('should throw error for unknown county', () => {
            expect(() => {
                calculator.calculate(100, 'NonExistentCounty');
            }).toThrow(/Configuración de impuestos no encontrada/);
        });

        it('should throw Zod validation error for negative subtotal', () => {
            expect(() => {
                calculator.calculate(-50, 'Miami-Dade');
            }).toThrow(ZodError);
        });

        it('should throw Zod validation error for empty county string', () => {
            expect(() => {
                calculator.calculate(100, '');
            }).toThrow(ZodError);
        });
    });

    describe('Business Rules', () => {
        it('should mark DR-15 as required for valid transactions', () => {
            const result = calculator.calculate(100, 'Miami-Dade');
            expect(result.isDr15Required).toBe(true);
        });

        // Test compliance with FloridaTaxConfigModel static data
        it('should match rates defined in the static config', () => {
            const miamiRate = calculator.getRateForCounty('Miami-Dade');
            expect(miamiRate).toBe(0.075);

            const brevardRate = calculator.getRateForCounty('Brevard');
            expect(brevardRate).toBe(0.07); // 6% base + 1% surtax
        });

        // Additional scenarios to reach 10+
        it('should calculate correctly for Lee county (7.0%)', () => {
            const result = calculator.calculate(200, 'Lee');
            expect(result.taxAmount).toBe(14.00);
            expect(result.total).toBe(214.00);
        });

        it('should calculate correctly for Pinellas county (7.0%)', () => {
            const result = calculator.calculate(50, 'Pinellas');
            expect(result.taxAmount).toBe(3.50);
            expect(result.total).toBe(53.50);
        });

        it('should handle zero subtotal without error', () => {
            const result = calculator.calculate(0, 'Miami-Dade');
            expect(result.taxAmount).toBe(0);
            expect(result.total).toBe(0);
            expect(result.isDr15Required).toBe(false);
        });
    });
});
