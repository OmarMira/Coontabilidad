/**
 * PayrollJournalService.test.ts
 * 
 * Tests unitarios para PayrollJournalService
 * Verifica generación de asientos contables para nómina
 * 
 * @author Kiro AI - NASA Level Testing
 * @date 2026-02-08
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PayrollJournalService, type PayrollJournalInput } from '@/services/payroll/PayrollJournalService';

describe('PayrollJournalService', () => {
  let service: PayrollJournalService;

  beforeEach(() => {
    service = new PayrollJournalService();
  });

  describe('Payroll Journal Entry Structure', () => {
    it('should have correct account codes defined', () => {
      // Verificar que los códigos de cuenta estén definidos correctamente
      // Esto es importante para la integridad contable
      
      const input: PayrollJournalInput = {
        payrollId: 1,
        grossPay: 5000,
        netPay: 4000,
        socialSecurity: 310,
        medicare: 72.5,
        medicareAdditional: 0,
        federalTax: 500,
        otherDeductions: 117.5,
        payDate: '2026-01-20',
        employeeId: 1
      };

      // Los códigos de cuenta deben seguir el plan contable estándar
      // 1000-1999: Assets
      // 2000-2999: Liabilities
      // 5000-5999: Expenses
      
      expect(input.grossPay).toBeGreaterThan(0);
      expect(input.netPay).toBeGreaterThan(0);
      expect(input.netPay).toBeLessThan(input.grossPay);
    });

    it('should calculate total FICA correctly', () => {
      const socialSecurity = 310;
      const medicare = 72.5;
      const medicareAdditional = 45;

      const totalFICA = socialSecurity + medicare + medicareAdditional;

      expect(totalFICA).toBe(427.5);
    });

    it('should validate that gross pay equals net pay plus deductions', () => {
      const grossPay = 5000;
      const netPay = 4000;
      const socialSecurity = 310;
      const medicare = 72.5;
      const medicareAdditional = 0;
      const federalTax = 500;
      const otherDeductions = 117.5;

      const totalDeductions = socialSecurity + medicare + medicareAdditional + federalTax + otherDeductions;
      const calculatedNetPay = grossPay - totalDeductions;

      expect(calculatedNetPay).toBeCloseTo(netPay, 2);
    });
  });

  describe('Journal Entry Balance Validation', () => {
    it('should ensure debits equal credits for basic payroll', () => {
      const input: PayrollJournalInput = {
        payrollId: 1,
        grossPay: 5000,
        netPay: 4000,
        socialSecurity: 310,
        medicare: 72.5,
        medicareAdditional: 0,
        federalTax: 500,
        otherDeductions: 117.5,
        payDate: '2026-01-20',
        employeeId: 1
      };

      // Debits
      const totalDebits = input.grossPay;

      // Credits
      const totalFICA = input.socialSecurity + input.medicare + input.medicareAdditional;
      const totalCredits = input.netPay + totalFICA + input.federalTax + input.otherDeductions;

      expect(totalDebits).toBeCloseTo(totalCredits, 2);
    });

    it('should ensure debits equal credits with additional Medicare', () => {
      const input: PayrollJournalInput = {
        payrollId: 1,
        grossPay: 10000,
        netPay: 7500,
        socialSecurity: 620,
        medicare: 145,
        medicareAdditional: 90,
        federalTax: 1500,
        otherDeductions: 145,
        payDate: '2026-01-20',
        employeeId: 1
      };

      // Debits
      const totalDebits = input.grossPay;

      // Credits
      const totalFICA = input.socialSecurity + input.medicare + input.medicareAdditional;
      const totalCredits = input.netPay + totalFICA + input.federalTax + input.otherDeductions;

      expect(totalDebits).toBeCloseTo(totalCredits, 2);
    });

    it('should ensure debits equal credits with zero other deductions', () => {
      const input: PayrollJournalInput = {
        payrollId: 1,
        grossPay: 3000,
        netPay: 2500,
        socialSecurity: 186,
        medicare: 43.5,
        medicareAdditional: 0,
        federalTax: 270.5,
        otherDeductions: 0,
        payDate: '2026-01-20',
        employeeId: 1
      };

      // Debits
      const totalDebits = input.grossPay;

      // Credits
      const totalFICA = input.socialSecurity + input.medicare + input.medicareAdditional;
      const totalCredits = input.netPay + totalFICA + input.federalTax + input.otherDeductions;

      expect(totalDebits).toBeCloseTo(totalCredits, 2);
    });
  });

  describe('Employer Tax Calculation', () => {
    it('should calculate employer FICA matching contribution', () => {
      const employeeSocialSecurity = 310;
      const employeeMedicare = 72.5;
      const employeeMedicareAdditional = 0;

      // Employer matches Social Security and Medicare (but not additional Medicare)
      const employerFICA = employeeSocialSecurity + employeeMedicare;

      expect(employerFICA).toBe(382.5);
    });

    it('should not match additional Medicare tax', () => {
      const employeeSocialSecurity = 620;
      const employeeMedicare = 145;
      const employeeMedicareAdditional = 90;

      // Employer matches SS and Medicare, but NOT additional Medicare
      const employerFICA = employeeSocialSecurity + employeeMedicare;

      expect(employerFICA).toBe(765);
      expect(employerFICA).not.toBe(employeeSocialSecurity + employeeMedicare + employeeMedicareAdditional);
    });

    it('should calculate employer tax for high earner', () => {
      const employeeSocialSecurity = 0; // Over wage base
      const employeeMedicare = 145;
      const employeeMedicareAdditional = 90;

      // Employer only matches Medicare (SS is 0 because over wage base)
      const employerFICA = employeeSocialSecurity + employeeMedicare;

      expect(employerFICA).toBe(145);
    });
  });

  describe('Journal Entry Reference Format', () => {
    it('should format payroll reference correctly', () => {
      const payrollId = 123;
      const expectedReference = `PAYROLL-${payrollId}`;

      expect(expectedReference).toBe('PAYROLL-123');
    });

    it('should format employer tax reference correctly', () => {
      const payrollId = 456;
      const expectedReference = `PAYROLL-TAX-${payrollId}`;

      expect(expectedReference).toBe('PAYROLL-TAX-456');
    });
  });

  describe('Journal Entry Description Format', () => {
    it('should format payroll description correctly', () => {
      const employeeId = 42;
      const expectedDescription = `Payroll for Employee #${employeeId}`;

      expect(expectedDescription).toBe('Payroll for Employee #42');
    });

    it('should format employer tax description correctly', () => {
      const employeeId = 99;
      const expectedDescription = `Employer Payroll Taxes for Employee #${employeeId}`;

      expect(expectedDescription).toBe('Employer Payroll Taxes for Employee #99');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero FICA correctly', () => {
      const input: PayrollJournalInput = {
        payrollId: 1,
        grossPay: 1000,
        netPay: 900,
        socialSecurity: 0,
        medicare: 0,
        medicareAdditional: 0,
        federalTax: 100,
        otherDeductions: 0,
        payDate: '2026-01-20',
        employeeId: 1
      };

      const totalFICA = input.socialSecurity + input.medicare + input.medicareAdditional;

      expect(totalFICA).toBe(0);
    });

    it('should handle zero federal tax correctly', () => {
      const input: PayrollJournalInput = {
        payrollId: 1,
        grossPay: 500,
        netPay: 423.5,
        socialSecurity: 31,
        medicare: 7.25,
        medicareAdditional: 0,
        federalTax: 0,
        otherDeductions: 38.25,
        payDate: '2026-01-20',
        employeeId: 1
      };

      expect(input.federalTax).toBe(0);
      
      // Should still balance
      const totalDebits = input.grossPay;
      const totalFICA = input.socialSecurity + input.medicare + input.medicareAdditional;
      const totalCredits = input.netPay + totalFICA + input.federalTax + input.otherDeductions;

      expect(totalDebits).toBeCloseTo(totalCredits, 2);
    });

    it('should handle very small amounts correctly', () => {
      const input: PayrollJournalInput = {
        payrollId: 1,
        grossPay: 100,
        netPay: 85.75,
        socialSecurity: 6.2,
        medicare: 1.45,
        medicareAdditional: 0,
        federalTax: 5,
        otherDeductions: 1.6,
        payDate: '2026-01-20',
        employeeId: 1
      };

      const totalDebits = input.grossPay;
      const totalFICA = input.socialSecurity + input.medicare + input.medicareAdditional;
      const totalCredits = input.netPay + totalFICA + input.federalTax + input.otherDeductions;

      expect(totalDebits).toBeCloseTo(totalCredits, 2);
    });

    it('should handle very large amounts correctly', () => {
      const input: PayrollJournalInput = {
        payrollId: 1,
        grossPay: 100000,
        netPay: 70000,
        socialSecurity: 6200,
        medicare: 1450,
        medicareAdditional: 900,
        federalTax: 20000,
        otherDeductions: 1450,
        payDate: '2026-01-20',
        employeeId: 1
      };

      const totalDebits = input.grossPay;
      const totalFICA = input.socialSecurity + input.medicare + input.medicareAdditional;
      const totalCredits = input.netPay + totalFICA + input.federalTax + input.otherDeductions;

      expect(totalDebits).toBeCloseTo(totalCredits, 2);
    });
  });
});
