/**
 * PayrollProcessor.test.ts
 * 
 * Tests unitarios para PayrollProcessor
 * Verifica procesamiento completo de nómina, validaciones, y cálculos
 * 
 * @author Kiro AI - NASA Level Testing
 * @date 2026-02-08
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PayrollProcessor, type PayrollInput } from '@/services/payroll/PayrollProcessor';

describe('PayrollProcessor', () => {
  let processor: PayrollProcessor;

  beforeEach(() => {
    processor = new PayrollProcessor();
  });

  describe('Input Validation', () => {
    it('should validate regular hours within range', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 80,
        overtimeHours: 0,
        bonuses: 0,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const result = processor.validatePayrollInput(input);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative regular hours', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: -10,
        overtimeHours: 0,
        bonuses: 0,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const result = processor.validatePayrollInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Regular hours must be between 0 and 168');
    });

    it('should reject excessive regular hours', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 200,
        overtimeHours: 0,
        bonuses: 0,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const result = processor.validatePayrollInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Regular hours must be between 0 and 168');
    });

    it('should reject negative overtime hours', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 80,
        overtimeHours: -5,
        bonuses: 0,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const result = processor.validatePayrollInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Overtime hours must be between 0 and 168');
    });

    it('should reject end date before start date', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-15',
        payPeriodEnd: '2026-01-01',
        payDate: '2026-01-20',
        regularHours: 80,
        overtimeHours: 0,
        bonuses: 0,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const result = processor.validatePayrollInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pay period end date must be after start date');
    });

    it('should reject pay date before end date', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-10',
        regularHours: 80,
        overtimeHours: 0,
        bonuses: 0,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const result = processor.validatePayrollInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pay date must be on or after pay period end date');
    });

    it('should reject negative bonuses', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 80,
        overtimeHours: 0,
        bonuses: -100,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const result = processor.validatePayrollInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Bonuses cannot be negative');
    });

    it('should reject negative commissions', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 80,
        overtimeHours: 0,
        bonuses: 0,
        commissions: -50,
        otherDeductions: 0,
        processedBy: 1
      };

      const result = processor.validatePayrollInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Commissions cannot be negative');
    });

    it('should reject negative deductions', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 80,
        overtimeHours: 0,
        bonuses: 0,
        commissions: 0,
        otherDeductions: -25,
        processedBy: 1
      };

      const result = processor.validatePayrollInput(input);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Other deductions cannot be negative');
    });
  });

  describe('Employee Data Validation', () => {
    it('should validate hourly employee with valid rate', () => {
      const employee: any = {
        id: 1,
        pay_type: 'hourly',
        hourly_rate: 15.00,
        filing_status: 'single',
        ssn: '123-45-6789'
      };

      const result = processor.validateEmployeeData(employee);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject hourly employee with rate below minimum wage', () => {
      const employee: any = {
        id: 1,
        pay_type: 'hourly',
        hourly_rate: 5.00,
        filing_status: 'single'
      };

      const result = processor.validateEmployeeData(employee);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Hourly rate must be at least $7.25 (federal minimum wage)');
    });

    it('should reject salaried employee with zero salary', () => {
      const employee: any = {
        id: 1,
        pay_type: 'salaried',
        salary: 0,
        filing_status: 'single'
      };

      const result = processor.validateEmployeeData(employee);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Salary must be greater than 0');
    });

    it('should reject employee without filing status', () => {
      const employee: any = {
        id: 1,
        pay_type: 'hourly',
        hourly_rate: 15.00
      };

      const result = processor.validateEmployeeData(employee);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Filing status is required');
    });

    it('should reject employee with invalid filing status', () => {
      const employee: any = {
        id: 1,
        pay_type: 'hourly',
        hourly_rate: 15.00,
        filing_status: 'invalid_status'
      };

      const result = processor.validateEmployeeData(employee);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid filing status');
    });

    it('should reject employee with invalid SSN format', () => {
      const employee: any = {
        id: 1,
        pay_type: 'hourly',
        hourly_rate: 15.00,
        filing_status: 'single',
        ssn: '123456789'
      };

      const result = processor.validateEmployeeData(employee);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SSN must be in format XXX-XX-XXXX');
    });
  });

  describe('Gross Pay Calculation', () => {
    it('should calculate gross pay for hourly employee with regular hours only', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 80,
        overtimeHours: 0,
        bonuses: 0,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const employee: any = {
        id: 1,
        pay_type: 'hourly',
        hourly_rate: 15.00
      };

      const grossPay = processor.calculateGrossPay(input, employee);

      expect(grossPay).toBe(1200.00); // 80 hours * $15
    });

    it('should calculate gross pay for hourly employee with overtime', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 80,
        overtimeHours: 10,
        bonuses: 0,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const employee: any = {
        id: 1,
        pay_type: 'hourly',
        hourly_rate: 20.00
      };

      const grossPay = processor.calculateGrossPay(input, employee);

      // Regular: 80 * $20 = $1,600
      // Overtime: 10 * $20 * 1.5 = $300
      // Total: $1,900
      expect(grossPay).toBe(1900.00);
    });

    it('should calculate gross pay for salaried employee', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 0,
        overtimeHours: 0,
        bonuses: 0,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const employee: any = {
        id: 1,
        pay_type: 'salaried',
        salary: 60000
      };

      const grossPay = processor.calculateGrossPay(input, employee);

      // Annual salary / 24 pay periods = $60,000 / 24 = $2,500
      expect(grossPay).toBe(2500.00);
    });

    it('should include bonuses in gross pay', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 80,
        overtimeHours: 0,
        bonuses: 500,
        commissions: 0,
        otherDeductions: 0,
        processedBy: 1
      };

      const employee: any = {
        id: 1,
        pay_type: 'hourly',
        hourly_rate: 15.00
      };

      const grossPay = processor.calculateGrossPay(input, employee);

      // Regular: 80 * $15 = $1,200
      // Bonus: $500
      // Total: $1,700
      expect(grossPay).toBe(1700.00);
    });

    it('should include commissions in gross pay', () => {
      const input: PayrollInput = {
        employeeId: 1,
        payPeriodStart: '2026-01-01',
        payPeriodEnd: '2026-01-15',
        payDate: '2026-01-20',
        regularHours: 80,
        overtimeHours: 0,
        bonuses: 0,
        commissions: 300,
        otherDeductions: 0,
        processedBy: 1
      };

      const employee: any = {
        id: 1,
        pay_type: 'hourly',
        hourly_rate: 15.00
      };

      const grossPay = processor.calculateGrossPay(input, employee);

      // Regular: 80 * $15 = $1,200
      // Commission: $300
      // Total: $1,500
      expect(grossPay).toBe(1500.00);
    });
  });

  describe('Net Pay Calculation', () => {
    it('should calculate net pay correctly', () => {
      const grossPay = 5000;
      const taxes: any = {
        socialSecurity: 310,
        medicare: 72.5,
        medicareAdditional: 0,
        federalIncomeTax: 500,
        totalTaxes: 882.5
      };
      const otherDeductions = 100;

      const netPay = processor.calculateNetPay(grossPay, taxes, otherDeductions);

      // $5,000 - $882.50 - $100 = $4,017.50
      expect(netPay).toBe(4017.50);
    });

    it('should not allow negative net pay', () => {
      const grossPay = 100;
      const taxes: any = {
        socialSecurity: 50,
        medicare: 20,
        medicareAdditional: 0,
        federalIncomeTax: 40,
        totalTaxes: 110
      };
      const otherDeductions = 50;

      const netPay = processor.calculateNetPay(grossPay, taxes, otherDeductions);

      // Would be negative, but should return 0
      expect(netPay).toBe(0);
    });

    it('should handle zero deductions', () => {
      const grossPay = 1000;
      const taxes: any = {
        socialSecurity: 62,
        medicare: 14.5,
        medicareAdditional: 0,
        federalIncomeTax: 100,
        totalTaxes: 176.5
      };
      const otherDeductions = 0;

      const netPay = processor.calculateNetPay(grossPay, taxes, otherDeductions);

      // $1,000 - $176.50 = $823.50
      expect(netPay).toBe(823.50);
    });
  });
});
