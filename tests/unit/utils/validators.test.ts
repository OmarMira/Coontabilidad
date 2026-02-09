/**
 * validators.test.ts - Tests para sistema de validación
 * @author Kiro AI - NASA Level Testing
 * @date 2026-02-08
 */

import { describe, it, expect } from 'vitest';
import {
  required,
  minLength,
  maxLength,
  min,
  max,
  integer,
  positive,
  email,
  ssn,
  ein,
  phone,
  validDate,
  notInPast,
  notInFuture,
  validate,
  validateObject,
  ERROR_CODES
} from '@/utils/validators';

describe('Validators', () => {
  
  describe('required', () => {
    it('should pass for non-empty value', () => {
      const validator = required('field');
      const result = validator('test');
      expect(result).toBeNull();
    });

    it('should fail for null', () => {
      const validator = required('field');
      const result = validator(null);
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.REQUIRED);
    });

    it('should fail for undefined', () => {
      const validator = required('field');
      const result = validator(undefined);
      expect(result).not.toBeNull();
    });

    it('should fail for empty string', () => {
      const validator = required('field');
      const result = validator('');
      expect(result).not.toBeNull();
    });
  });

  describe('minLength', () => {
    it('should pass for valid length', () => {
      const validator = minLength('field', 3);
      const result = validator('test');
      expect(result).toBeNull();
    });

    it('should fail for too short', () => {
      const validator = minLength('field', 5);
      const result = validator('test');
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.TOO_SHORT);
    });
  });

  describe('maxLength', () => {
    it('should pass for valid length', () => {
      const validator = maxLength('field', 10);
      const result = validator('test');
      expect(result).toBeNull();
    });

    it('should fail for too long', () => {
      const validator = maxLength('field', 3);
      const result = validator('test');
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.TOO_LONG);
    });
  });

  describe('min', () => {
    it('should pass for valid value', () => {
      const validator = min('field', 0);
      const result = validator(10);
      expect(result).toBeNull();
    });

    it('should fail for too small', () => {
      const validator = min('field', 10);
      const result = validator(5);
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.TOO_SMALL);
    });
  });

  describe('max', () => {
    it('should pass for valid value', () => {
      const validator = max('field', 100);
      const result = validator(50);
      expect(result).toBeNull();
    });

    it('should fail for too large', () => {
      const validator = max('field', 100);
      const result = validator(150);
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.TOO_LARGE);
    });
  });

  describe('integer', () => {
    it('should pass for integer', () => {
      const validator = integer('field');
      const result = validator(10);
      expect(result).toBeNull();
    });

    it('should fail for decimal', () => {
      const validator = integer('field');
      const result = validator(10.5);
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.NOT_INTEGER);
    });
  });

  describe('positive', () => {
    it('should pass for positive number', () => {
      const validator = positive('field');
      const result = validator(10);
      expect(result).toBeNull();
    });

    it('should fail for zero', () => {
      const validator = positive('field');
      const result = validator(0);
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.NOT_POSITIVE);
    });

    it('should fail for negative', () => {
      const validator = positive('field');
      const result = validator(-10);
      expect(result).not.toBeNull();
    });
  });

  describe('email', () => {
    it('should pass for valid email', () => {
      const validator = email('field');
      const result = validator('test@example.com');
      expect(result).toBeNull();
    });

    it('should fail for invalid email', () => {
      const validator = email('field');
      const result = validator('invalid-email');
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.INVALID_EMAIL);
    });
  });

  describe('ssn', () => {
    it('should pass for valid SSN', () => {
      const validator = ssn('field');
      const result = validator('123-45-6789');
      expect(result).toBeNull();
    });

    it('should fail for invalid SSN', () => {
      const validator = ssn('field');
      const result = validator('123456789');
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.INVALID_SSN);
    });
  });

  describe('ein', () => {
    it('should pass for valid EIN', () => {
      const validator = ein('field');
      const result = validator('12-3456789');
      expect(result).toBeNull();
    });

    it('should fail for invalid EIN', () => {
      const validator = ein('field');
      const result = validator('123456789');
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.INVALID_EIN);
    });
  });

  describe('phone', () => {
    it('should pass for valid phone', () => {
      const validator = phone('field');
      const result = validator('(555) 123-4567');
      expect(result).toBeNull();
    });

    it('should pass for phone with +1', () => {
      const validator = phone('field');
      const result = validator('+1-555-123-4567');
      expect(result).toBeNull();
    });
  });

  describe('validDate', () => {
    it('should pass for valid date', () => {
      const validator = validDate('field');
      const result = validator('2026-01-15');
      expect(result).toBeNull();
    });

    it('should fail for invalid date', () => {
      const validator = validDate('field');
      const result = validator('invalid-date');
      expect(result).not.toBeNull();
      expect(result?.code).toBe(ERROR_CODES.INVALID_DATE);
    });
  });

  describe('validate', () => {
    it('should pass all validations', () => {
      const result = validate('test@example.com', [
        required('email'),
        email('email')
      ]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all errors', () => {
      const result = validate('', [
        required('email'),
        email('email')
      ]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateObject', () => {
    it('should validate entire object', () => {
      const obj = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const result = validateObject(obj, {
        name: [required('name'), minLength('name', 2)],
        email: [required('email'), email('email')],
        age: [required('age'), min('age', 18), max('age', 120)]
      });

      expect(result.isValid).toBe(true);
    });

    it('should collect errors from multiple fields', () => {
      const obj = {
        name: '',
        email: 'invalid',
        age: 10
      };

      const result = validateObject(obj, {
        name: [required('name')],
        email: [email('email')],
        age: [min('age', 18)]
      });

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});
