
import { describe, it, expect } from 'vitest';
import { suggestAccountNumber, validateAccountNumber } from '@/utils/accountingUtils';

describe('accountingUtils', () => {
    describe('suggestAccountNumber', () => {
        it('should suggest a 5-digit number starting with 1 for assets', () => {
            const result = suggestAccountNumber('asset');
            expect(result).toHaveLength(5);
            expect(result.startsWith('1')).toBe(true);
        });

        it('should suggest a 5-digit number starting with 2 for liabilities', () => {
            const result = suggestAccountNumber('liability');
            expect(result).toHaveLength(5);
            expect(result.startsWith('2')).toBe(true);
        });

        it('should suggest a 5-digit number starting with 6 for expenses', () => {
            const result = suggestAccountNumber('expense');
            expect(result).toHaveLength(5);
            expect(result.startsWith('6')).toBe(true);
        });

        it('should return empty string for unknown types', () => {
            const result = suggestAccountNumber('unknown');
            expect(result).toBe('');
        });
    });

    describe('validateAccountNumber', () => {
        it('should return null for valid 5-digit asset number', () => {
            const result = validateAccountNumber('10100', 'asset');
            expect(result).toBeNull();
        });

        it('should return null for valid 4-digit number', () => {
            const result = validateAccountNumber('1010', 'asset');
            expect(result).toBeNull();
        });

        it('should return warning for invalid length', () => {
            const result = validateAccountNumber('101', 'asset');
            expect(result).toBe('Los números GAAP oficiales deben tener 4 o 5 dígitos.');
        });

        it('should return warning for incorrect starting digit', () => {
            const result = validateAccountNumber('20100', 'asset');
            expect(result).toBe("Las cuentas de tipo asset suelen comenzar con '1'.");
        });

        it('should allow 5 for expenses (COGS)', () => {
            const result = validateAccountNumber('50100', 'expense');
            expect(result).toBeNull();
        });

        it('should allow 7 for other income (revenue)', () => {
            const result = validateAccountNumber('70100', 'revenue');
            expect(result).toBeNull();
        });

        it('should return null if number is empty', () => {
            const result = validateAccountNumber('', 'asset');
            expect(result).toBeNull();
        });
    });
});
