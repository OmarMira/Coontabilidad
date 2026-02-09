/**
 * PayrollTaxCalculator.test.ts
 * 
 * Tests unitarios para PayrollTaxCalculator
 * Verifica cálculos de impuestos federales, FICA, Medicare según IRS Publication 15
 * 
 * @author Kiro AI - NASA Level Testing
 * @date 2026-02-08
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PayrollTaxCalculator, type TaxCalculationInput } from '@/services/payroll/PayrollTaxCalculator';

describe('PayrollTaxCalculator', () => {
  let calculator: PayrollTaxCalculator;

  beforeEach(() => {
    calculator = new PayrollTaxCalculator();
  });

  describe('FICA Tax (Social Security + Medicare)', () => {
    it('should calculate FICA correctly for normal income', () => {
      const input: TaxCalculationInput = {
        grossPay: 1000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateFICA(input);

      // Social Security: 6.2%
      expect(result.socialSecurity).toBeCloseTo(62, 2);
      // Medicare: 1.45%
      expect(result.medicare).toBeCloseTo(14.5, 2);
      // Total FICA
      expect(result.totalFICA).toBeCloseTo(76.5, 2);
    });

    it('should cap Social Security at wage base limit', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 168000, // Near 2026 wage base of $168,600
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateFICA(input);

      // Only $600 should be taxed for SS (168,600 - 168,000)
      expect(result.socialSecurity).toBeCloseTo(37.2, 2);
      // Medicare has no cap
      expect(result.medicare).toBeCloseTo(72.5, 2);
    });

    it('should return 0 SS tax when over wage base', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 170000, // Over wage base
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateFICA(input);

      expect(result.socialSecurity).toBe(0);
      expect(result.medicare).toBeCloseTo(72.5, 2);
    });

    it('should handle zero income', () => {
      const input: TaxCalculationInput = {
        grossPay: 0,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateFICA(input);

      expect(result.socialSecurity).toBe(0);
      expect(result.medicare).toBe(0);
      expect(result.totalFICA).toBe(0);
    });
  });

  describe('Medicare Tax (Regular + Additional)', () => {
    it('should calculate Medicare at 1.45% for normal income', () => {
      const input: TaxCalculationInput = {
        grossPay: 1000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateMedicare(input);

      expect(result.medicare).toBeCloseTo(14.5, 2);
      expect(result.medicareAdditional).toBe(0);
      expect(result.totalMedicare).toBeCloseTo(14.5, 2);
    });

    it('should add 0.9% additional Medicare for high earners (single)', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 199000, // Near $200k threshold for single
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateMedicare(input);

      // Regular Medicare: 5000 * 1.45%
      expect(result.medicare).toBeCloseTo(72.5, 2);
      // Additional Medicare: 4000 * 0.9% (only $4k over threshold)
      expect(result.medicareAdditional).toBeCloseTo(36, 2);
      expect(result.totalMedicare).toBeCloseTo(108.5, 2);
    });

    it('should add 0.9% additional Medicare for high earners (married)', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 249000, // Near $250k threshold for married
        filingStatus: 'married',
        allowances: 2,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateMedicare(input);

      // Regular Medicare: 5000 * 1.45%
      expect(result.medicare).toBeCloseTo(72.5, 2);
      // Additional Medicare: 4000 * 0.9%
      expect(result.medicareAdditional).toBeCloseTo(36, 2);
    });

    it('should handle income entirely over threshold', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 250000, // Well over threshold
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateMedicare(input);

      // Regular Medicare: 5000 * 1.45%
      expect(result.medicare).toBeCloseTo(72.5, 2);
      // Additional Medicare: 5000 * 0.9% (all over threshold)
      expect(result.medicareAdditional).toBeCloseTo(45, 2);
    });
  });

  describe('Federal Income Tax', () => {
    it('should calculate federal tax for single filer', () => {
      const input: TaxCalculationInput = {
        grossPay: 2000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateFederalTax(input);

      expect(result.federalIncomeTax).toBeGreaterThanOrEqual(0);
      expect(result.taxableIncome).toBeGreaterThanOrEqual(0);
      expect(result.annualTax).toBeGreaterThanOrEqual(0);
    });

    it('should calculate federal tax for married filing jointly', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 0,
        filingStatus: 'married',
        allowances: 2,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateFederalTax(input);

      expect(result.federalIncomeTax).toBeGreaterThanOrEqual(0);
      expect(result.taxableIncome).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for very low income after deductions', () => {
      const input: TaxCalculationInput = {
        grossPay: 500,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 2,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateFederalTax(input);

      // With standard deduction and allowances, should be 0
      expect(result.federalIncomeTax).toBe(0);
      expect(result.taxableIncome).toBe(0);
    });

    it('should handle head of household filing status', () => {
      const input: TaxCalculationInput = {
        grossPay: 3000,
        ytdGrossPay: 0,
        filingStatus: 'head_of_household',
        allowances: 2,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateFederalTax(input);

      expect(result.federalIncomeTax).toBeGreaterThanOrEqual(0);
    });

    it('should increase tax with higher income', () => {
      const lowInput: TaxCalculationInput = {
        grossPay: 1000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const highInput: TaxCalculationInput = {
        grossPay: 10000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const lowTax = calculator.calculateFederalTax(lowInput);
      const highTax = calculator.calculateFederalTax(highInput);

      expect(highTax.federalIncomeTax).toBeGreaterThan(lowTax.federalIncomeTax);
    });

    it('should apply additional withholding', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 100,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateFederalTax(input);

      // Should include the additional $100
      expect(result.federalIncomeTax).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Complete Tax Calculation', () => {
    it('should calculate all taxes correctly', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateAllTaxes(input);

      expect(result.socialSecurity).toBeGreaterThan(0);
      expect(result.medicare).toBeGreaterThan(0);
      expect(result.medicareAdditional).toBe(0); // Not over threshold
      expect(result.federalIncomeTax).toBeGreaterThan(0);
      expect(result.totalTaxes).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
    });

    it('should provide detailed breakdown', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 0,
        filingStatus: 'married',
        allowances: 2,
        additionalWithholding: 50,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateAllTaxes(input);

      expect(result.breakdown.socialSecurity.rate).toBe(0.062);
      expect(result.breakdown.medicare.rate).toBe(0.0145);
      expect(result.breakdown.federalIncomeTax.additionalWithholding).toBe(50);
      expect(result.breakdown.federalIncomeTax.annualSalary).toBe(5000 * 26);
    });

    it('should handle high earner with all taxes', () => {
      const input: TaxCalculationInput = {
        grossPay: 10000,
        ytdGrossPay: 200000,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateAllTaxes(input);

      // Should have additional Medicare
      expect(result.medicareAdditional).toBeGreaterThan(0);
      // Should have high federal tax
      expect(result.federalIncomeTax).toBeGreaterThan(1000);
      // Total should be sum of all
      const expectedTotal = 
        result.socialSecurity + 
        result.medicare + 
        result.medicareAdditional + 
        result.federalIncomeTax;
      expect(result.totalTaxes).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero gross pay', () => {
      const input: TaxCalculationInput = {
        grossPay: 0,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateAllTaxes(input);

      expect(result.socialSecurity).toBe(0);
      expect(result.medicare).toBe(0);
      expect(result.medicareAdditional).toBe(0);
      expect(result.federalIncomeTax).toBe(0);
      expect(result.totalTaxes).toBe(0);
    });

    it('should handle very large gross pay', () => {
      const input: TaxCalculationInput = {
        grossPay: 100000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateAllTaxes(input);

      expect(result.totalTaxes).toBeGreaterThan(0);
      expect(result.totalTaxes).toBeLessThan(input.grossPay);
    });

    it('should handle zero allowances', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 0,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateAllTaxes(input);

      expect(result.federalIncomeTax).toBeGreaterThan(0);
    });

    it('should handle many allowances', () => {
      const input: TaxCalculationInput = {
        grossPay: 5000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 10,
        additionalWithholding: 0,
        payPeriod: 'biweekly'
      };

      const result = calculator.calculateAllTaxes(input);

      // With many allowances, federal tax should be reduced significantly
      expect(result.federalIncomeTax).toBeGreaterThanOrEqual(0);
      
      // Compare with fewer allowances - should be less
      const fewAllowancesInput: TaxCalculationInput = {
        ...input,
        allowances: 1
      };
      const fewAllowancesResult = calculator.calculateAllTaxes(fewAllowancesInput);
      
      expect(result.federalIncomeTax).toBeLessThan(fewAllowancesResult.federalIncomeTax);
    });

    it('should handle different pay periods correctly', () => {
      const weeklyInput: TaxCalculationInput = {
        grossPay: 1000,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'weekly'
      };

      const monthlyInput: TaxCalculationInput = {
        grossPay: 4333.33,
        ytdGrossPay: 0,
        filingStatus: 'single',
        allowances: 1,
        additionalWithholding: 0,
        payPeriod: 'monthly'
      };

      const weeklyResult = calculator.calculateAllTaxes(weeklyInput);
      const monthlyResult = calculator.calculateAllTaxes(monthlyInput);

      // Annual salary should be similar (52k vs 52k)
      expect(weeklyResult.breakdown.federalIncomeTax.annualSalary).toBeCloseTo(52000, 0);
      expect(monthlyResult.breakdown.federalIncomeTax.annualSalary).toBeCloseTo(52000, 0);
    });
  });
});
