import { describe, it, expect } from 'vitest';
import { FloridaComplianceValidator } from './FloridaComplianceValidator';

describe('FloridaComplianceValidator', () => {

    it('should validate valid registration numbers', () => {
        // Pseudo valid numbers
        expect(FloridaComplianceValidator.validateRegistrationNumber('78-8012345678-9')).toBe(true);
        expect(FloridaComplianceValidator.validateRegistrationNumber('1234567890123')).toBe(true);
    });

    it('should reject invalid registration numbers', () => {
        expect(FloridaComplianceValidator.validateRegistrationNumber('123')).toBe(false);
        expect(FloridaComplianceValidator.validateRegistrationNumber('')).toBe(false);
    });

    it('should validate correct DR-15 return data', () => {
        const validReturn = {
            period: '2023-10',
            grossSales: 1000,
            exemptSales: 200,
            taxableSales: 800,
            taxCollected: 56, // 7% of 800
            totalTaxDue: 56
        };
        const result = FloridaComplianceValidator.validateDR15Return(validReturn);
        expect(result.success).toBe(true);
    });

    it('should reject invalid DR-15 return data', () => {
        const invalidReturn = {
            period: '2023-13', // Invalid Month
            grossSales: -100, // Negative
            exemptSales: 0,
            taxableSales: 0,
            taxCollected: 0,
            totalTaxDue: 0
        };
        const result = FloridaComplianceValidator.validateDR15Return(invalidReturn);
        expect(result.success).toBe(false);
    });

    it('should check county rate compliance', () => {
        // Miami-Dade is 7% (0.07) in our map
        const result1 = FloridaComplianceValidator.checkCountyRateCompliance('Miami-Dade', 0.07);
        expect(result1.compliant).toBe(true);

        const result2 = FloridaComplianceValidator.checkCountyRateCompliance('Miami-Dade', 0.06);
        expect(result2.compliant).toBe(false);
        expect(result2.message).toContain('lower than expected');

        const result3 = FloridaComplianceValidator.checkCountyRateCompliance('UnknownCounty', 0.06);
        expect(result3.compliant).toBe(true); // >= 6%

        const result4 = FloridaComplianceValidator.checkCountyRateCompliance('UnknownCounty', 0.05);
        expect(result4.compliant).toBe(false); // < 6%
    });
});
