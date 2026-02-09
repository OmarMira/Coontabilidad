/**
 * TaxBrackets2026.test.ts
 * 
 * Tests unitarios para TaxBrackets2026
 * Verifica constantes de impuestos federales según IRS Publication 15
 * 
 * @author Kiro AI - NASA Level Testing
 * @date 2026-02-08
 */

import { describe, it, expect } from 'vitest';
import { 
  TaxBrackets2026,
  getTaxBrackets,
  getStandardDeduction,
  getMedicareAdditionalThreshold,
  FLORIDA_STATE_TAX_RATE
} from '@/services/payroll/TaxBrackets2026';

describe('TaxBrackets2026', () => {
  
  describe('FICA Rates', () => {
    it('should have correct Social Security rate (6.2%)', () => {
      expect(TaxBrackets2026.SOCIAL_SECURITY_RATE).toBe(0.062);
    });

    it('should have correct Social Security wage base ($168,600)', () => {
      expect(TaxBrackets2026.SOCIAL_SECURITY_WAGE_BASE).toBe(168600);
    });

    it('should have correct Medicare rate (1.45%)', () => {
      expect(TaxBrackets2026.MEDICARE_RATE).toBe(0.0145);
    });

    it('should have correct Additional Medicare rate (0.9%)', () => {
      expect(TaxBrackets2026.ADDITIONAL_MEDICARE_RATE).toBe(0.009);
    });
  });

  describe('Additional Medicare Thresholds', () => {
    it('should have correct threshold for single filers ($200,000)', () => {
      expect(TaxBrackets2026.ADDITIONAL_MEDICARE_THRESHOLD.single).toBe(200000);
    });

    it('should have correct threshold for married filing jointly ($250,000)', () => {
      expect(TaxBrackets2026.ADDITIONAL_MEDICARE_THRESHOLD.married).toBe(250000);
    });

    it('should have correct threshold for married filing separately ($125,000)', () => {
      expect(TaxBrackets2026.ADDITIONAL_MEDICARE_THRESHOLD.married_separate).toBe(125000);
    });

    it('should have correct threshold for head of household ($200,000)', () => {
      expect(TaxBrackets2026.ADDITIONAL_MEDICARE_THRESHOLD.head_of_household).toBe(200000);
    });
  });

  describe('Standard Deductions', () => {
    it('should have correct standard deduction for single ($14,600)', () => {
      expect(TaxBrackets2026.STANDARD_DEDUCTION.single).toBe(14600);
    });

    it('should have correct standard deduction for married filing jointly ($29,200)', () => {
      expect(TaxBrackets2026.STANDARD_DEDUCTION.married).toBe(29200);
    });

    it('should have correct standard deduction for married filing separately ($14,600)', () => {
      expect(TaxBrackets2026.STANDARD_DEDUCTION.married_separate).toBe(14600);
    });

    it('should have correct standard deduction for head of household ($21,900)', () => {
      expect(TaxBrackets2026.STANDARD_DEDUCTION.head_of_household).toBe(21900);
    });

    it('should have married deduction equal to double single deduction', () => {
      const singleDeduction = TaxBrackets2026.STANDARD_DEDUCTION.single;
      const marriedDeduction = TaxBrackets2026.STANDARD_DEDUCTION.married;

      expect(marriedDeduction).toBe(singleDeduction * 2);
    });
  });

  describe('Withholding Allowances', () => {
    it('should have correct allowance amount ($4,800)', () => {
      expect(TaxBrackets2026.ALLOWANCE_AMOUNT).toBe(4800);
    });
  });

  describe('Tax Brackets Structure', () => {
    it('should have 7 tax brackets for single filers', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.single;

      expect(brackets).toHaveLength(7);
    });

    it('should have 7 tax brackets for married filing jointly', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.married;

      expect(brackets).toHaveLength(7);
    });

    it('should have 7 tax brackets for married filing separately', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.married_separate;

      expect(brackets).toHaveLength(7);
    });

    it('should have 7 tax brackets for head of household', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.head_of_household;

      expect(brackets).toHaveLength(7);
    });

    it('should have progressive tax rates (10%, 12%, 22%, 24%, 32%, 35%, 37%)', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.single;
      const rates = brackets.map(b => b.rate);

      expect(rates).toEqual([0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37]);
    });

    it('should have highest bracket with no upper limit', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.single;
      const highestBracket = brackets[brackets.length - 1];

      expect(highestBracket.max).toBeNull();
    });

    it('should have continuous brackets with no gaps', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.single;

      for (let i = 0; i < brackets.length - 1; i++) {
        const currentMax = brackets[i].max;
        const nextMin = brackets[i + 1].min;

        expect(currentMax).toBe(nextMin);
      }
    });
  });

  describe('Helper Functions', () => {
    it('should return correct tax brackets for single', () => {
      const brackets = getTaxBrackets('single');

      expect(brackets).toHaveLength(7);
      expect(brackets[0].rate).toBe(0.10);
    });

    it('should return correct tax brackets for married', () => {
      const brackets = getTaxBrackets('married');

      expect(brackets).toHaveLength(7);
      expect(brackets[0].max).toBe(23200);
    });

    it('should return correct standard deduction for single', () => {
      const deduction = getStandardDeduction('single');

      expect(deduction).toBe(14600);
    });

    it('should return correct standard deduction for married', () => {
      const deduction = getStandardDeduction('married');

      expect(deduction).toBe(29200);
    });

    it('should return correct Medicare threshold for single', () => {
      const threshold = getMedicareAdditionalThreshold('single');

      expect(threshold).toBe(200000);
    });

    it('should return correct Medicare threshold for married', () => {
      const threshold = getMedicareAdditionalThreshold('married');

      expect(threshold).toBe(250000);
    });
  });

  describe('Florida State Tax', () => {
    it('should have zero state income tax rate', () => {
      expect(FLORIDA_STATE_TAX_RATE).toBe(0);
    });
  });

  describe('Tax Bracket Validation', () => {
    it('should have first bracket starting at 0', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.single;

      expect(brackets[0].min).toBe(0);
    });

    it('should have increasing bracket minimums', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.single;

      for (let i = 1; i < brackets.length; i++) {
        expect(brackets[i].min).toBeGreaterThan(brackets[i - 1].min);
      }
    });

    it('should have increasing tax rates', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.single;

      for (let i = 1; i < brackets.length; i++) {
        expect(brackets[i].rate).toBeGreaterThan(brackets[i - 1].rate);
      }
    });

    it('should have all rates between 0 and 1', () => {
      const brackets = TaxBrackets2026.TAX_BRACKETS.single;

      brackets.forEach(bracket => {
        expect(bracket.rate).toBeGreaterThan(0);
        expect(bracket.rate).toBeLessThan(1);
      });
    });
  });
});
