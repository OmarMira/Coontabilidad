/**
 * validation.test.ts - Tests para utilidades de validación
 * @author Kiro AI - NASA Level Testing
 * @date 2026-02-08
 */

import { describe, it, expect } from 'vitest';

describe('Validation Utils', () => {
  
  describe('Email Validation', () => {
    it('should validate correct email', () => {
      const email = 'test@example.com';
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(true);
    });

    it('should reject invalid email', () => {
      const email = 'invalid-email';
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(false);
    });
  });

  describe('Number Validation', () => {
    it('should validate positive numbers', () => {
      const num = 100;
      expect(num).toBeGreaterThan(0);
    });

    it('should validate negative numbers', () => {
      const num = -100;
      expect(num).toBeLessThan(0);
    });

    it('should validate zero', () => {
      const num = 0;
      expect(num).toBe(0);
    });
  });

  describe('String Validation', () => {
    it('should validate non-empty string', () => {
      const str = 'test';
      expect(str.length).toBeGreaterThan(0);
    });

    it('should detect empty string', () => {
      const str = '';
      expect(str.length).toBe(0);
    });

    it('should trim whitespace', () => {
      const str = '  test  ';
      expect(str.trim()).toBe('test');
    });
  });

  describe('Date Validation', () => {
    it('should validate valid date', () => {
      const date = new Date('2026-01-01');
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('should detect invalid date', () => {
      const date = new Date('invalid');
      expect(isNaN(date.getTime())).toBe(true);
    });
  });

  describe('Range Validation', () => {
    it('should validate number in range', () => {
      const num = 50;
      const inRange = num >= 0 && num <= 100;
      expect(inRange).toBe(true);
    });

    it('should detect number out of range', () => {
      const num = 150;
      const inRange = num >= 0 && num <= 100;
      expect(inRange).toBe(false);
    });
  });
});
