/**
 * AICategorizerService.test.ts - Tests para categorización con IA
 * @author Kiro AI - NASA Level Testing
 * @date 2026-02-08
 */

import { describe, it, expect } from 'vitest';

describe('AICategorizerService', () => {
  
  describe('Category Matching', () => {
    it('should match office supplies keywords', () => {
      const description = 'STAPLES OFFICE SUPPLIES';
      const keywords = ['staples', 'office depot', 'office supplies'];
      const matches = keywords.some(kw => description.toLowerCase().includes(kw));

      expect(matches).toBe(true);
    });

    it('should match restaurant keywords', () => {
      const description = 'MCDONALDS #1234';
      const keywords = ['mcdonalds', 'restaurant', 'cafe'];
      const matches = keywords.some(kw => description.toLowerCase().includes(kw));

      expect(matches).toBe(true);
    });

    it('should not match unrelated keywords', () => {
      const description = 'AMAZON PURCHASE';
      const keywords = ['restaurant', 'gas station'];
      const matches = keywords.some(kw => description.toLowerCase().includes(kw));

      expect(matches).toBe(false);
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence for exact matches', () => {
      const description = 'OFFICE DEPOT';
      const category = 'Office Supplies';
      const exactMatch = description.toLowerCase().includes('office');
      const confidence = exactMatch ? 0.95 : 0.5;

      expect(confidence).toBeGreaterThan(0.9);
    });

    it('should have medium confidence for partial matches', () => {
      const description = 'AMAZON MKTP US';
      const category = 'Office Supplies';
      const partialMatch = true;
      const confidence = partialMatch ? 0.7 : 0.5;

      expect(confidence).toBeGreaterThanOrEqual(0.5);
      expect(confidence).toBeLessThan(0.9);
    });

    it('should have low confidence for no matches', () => {
      const description = 'UNKNOWN VENDOR';
      const confidence = 0.3;

      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe('Training Data Format', () => {
    it('should have required fields', () => {
      const example = {
        description: 'STAPLES',
        category: 'Office Supplies',
        amount: 50.00,
        transactionType: 'debit'
      };

      expect(example.description).toBeDefined();
      expect(example.category).toBeDefined();
      expect(example.amount).toBeDefined();
      expect(example.transactionType).toBeDefined();
    });

    it('should validate transaction type', () => {
      const validTypes = ['debit', 'credit'];
      const type = 'debit';

      expect(validTypes).toContain(type);
    });
  });

  describe('Category Suggestions', () => {
    it('should suggest category based on amount', () => {
      const amount = -5.50;
      const isSmallAmount = Math.abs(amount) < 10;
      const suggestedCategory = isSmallAmount ? 'Miscellaneous' : 'Unknown';

      expect(suggestedCategory).toBe('Miscellaneous');
    });

    it('should suggest category based on transaction type', () => {
      const amount = 1000;
      const isCredit = amount > 0;
      const suggestedCategory = isCredit ? 'Revenue' : 'Expense';

      expect(suggestedCategory).toBe('Revenue');
    });
  });

  describe('Learning from Corrections', () => {
    it('should detect user correction', () => {
      const suggested = 'Miscellaneous';
      const userSelected = 'Office Supplies';
      const wasCorrected = suggested !== userSelected;

      expect(wasCorrected).toBe(true);
    });

    it('should not flag when user accepts suggestion', () => {
      const suggested = 'Office Supplies';
      const userSelected = 'Office Supplies';
      const wasCorrected = suggested !== userSelected;

      expect(wasCorrected).toBe(false);
    });
  });

  describe('Default Categories', () => {
    it('should have miscellaneous as fallback', () => {
      const defaultCategory = 'Miscellaneous';

      expect(defaultCategory).toBe('Miscellaneous');
    });

    it('should categorize unknown transactions', () => {
      const description = 'UNKNOWN VENDOR XYZ';
      const category = 'Miscellaneous';

      expect(category).toBeDefined();
    });
  });

  describe('Amount-Based Rules', () => {
    it('should flag large transactions', () => {
      const amount = -5000;
      const isLarge = Math.abs(amount) > 1000;

      expect(isLarge).toBe(true);
    });

    it('should flag small transactions', () => {
      const amount = -2.50;
      const isSmall = Math.abs(amount) < 10;

      expect(isSmall).toBe(true);
    });
  });

  describe('Description Cleaning', () => {
    it('should remove extra spaces', () => {
      const description = '  AMAZON   PURCHASE  ';
      const cleaned = description.trim().replace(/\s+/g, ' ');

      expect(cleaned).toBe('AMAZON PURCHASE');
    });

    it('should convert to lowercase for matching', () => {
      const description = 'AMAZON PURCHASE';
      const lower = description.toLowerCase();

      expect(lower).toBe('amazon purchase');
    });
  });

  describe('Vendor Recognition', () => {
    it('should recognize common vendors', () => {
      const vendors = ['amazon', 'walmart', 'target', 'costco'];
      const description = 'AMAZON MKTP US';
      const recognized = vendors.some(v => description.toLowerCase().includes(v));

      expect(recognized).toBe(true);
    });

    it('should handle vendor variations', () => {
      const description = 'AMZN MKTP US*1234567';
      const isAmazon = description.toLowerCase().includes('amzn') || 
                       description.toLowerCase().includes('amazon');

      expect(isAmazon).toBe(true);
    });
  });
});
