import { describe, it, expect } from 'vitest';
import { normalizeTransaction } from '../TransactionNormalizer';

describe('TransactionNormalizer', () => { // Tests updated to reflect cents conversion
    const config = { strictMode: true, detectNegativesInParens: true };

    describe('Amount Normalization', () => {
        it('should handle standard positive amounts', () => {
            const result = normalizeTransaction('2023-01-01', 'Test', '1000.50', undefined, config);
            expect(result.data?.amount).toBe(100050); // $1000.50 = 100050 cents
        });

        it('should handle negative amounts with minus sign', () => {
            const result = normalizeTransaction('2023-01-01', 'Test', '-50.25', undefined, config);
            expect(result.data?.amount).toBe(-5025); // -$50.25 = -5025 cents
        });

        it('should handle negative amounts in parentheses', () => {
            const result = normalizeTransaction('2023-01-01', 'Test', '(1,500.00)', undefined, config);
            expect(result.data?.amount).toBe(-150000); // -$1500.00 = -150000 cents
        });

        it('should strip currency symbols', () => {
            const result = normalizeTransaction('2023-01-01', 'Test', '$123.45', undefined, config);
            expect(result.data?.amount).toBe(12345); // $123.45 = 12345 cents
        });

        it('should valid strict mode fail on garbage', () => {
            const result = normalizeTransaction('2023-01-01', 'Test', 'abc', undefined, config);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Monto inválido'); // Spanish error message
        });
    });

    describe('Date Normalization', () => {
        it('should convert US date MM/DD/YYYY to ISO', () => {
            // 01/31/2023 -> 2023-01-31
            const result = normalizeTransaction('01/31/2023', 'Test', '100', undefined, config);
            expect(result.data?.transaction_date).toBe('2023-01-31');
        });

        it('should keep already ISO dates', () => {
            const result = normalizeTransaction('2023-12-25', 'Test', '100', undefined, config);
            expect(result.data?.transaction_date).toBe('2023-12-25');
        });

        it('should fail on invalid date in strict mode', () => {
            const result = normalizeTransaction('InvalidDate', 'Test', '100', undefined, config);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Fecha inválida'); // Spanish error message
        });
    });

    describe('Description Sanitization', () => {
        it('should trim and uppercase', () => {
            const result = normalizeTransaction('2023-01-01', '  lower case description  ', '100', undefined, config);
            expect(result.data?.description).toBe('LOWER CASE DESCRIPTION');
        });

        it('should remove excessive whitespace', () => {
            const result = normalizeTransaction('2023-01-01', 'Msg   with   gaps', '100', undefined, config);
            expect(result.data?.description).toBe('MSG WITH GAPS');
        });
    });
});
