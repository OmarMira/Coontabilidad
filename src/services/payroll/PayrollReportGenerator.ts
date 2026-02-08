/**
 * PayrollReportGenerator.ts
 * 
 * Servicio para generar reportes de nómina requeridos por el IRS:
 * - Form 941 (Quarterly Federal Tax Return)
 * - Form W-2 (Wage and Tax Statement)
 * - Form W-3 (Transmittal of Wage and Tax Statements)
 */

import { db } from '../../database/simple-db';
import type { Payroll, Employee } from '../../database/simple-db';

// ==========================================
// INTERFACES
// ==========================================

export interface Form941Data {
  quarter: number;
  year: number;
  employerName: string;
  ein: string;
  address: string;
  numberOfEmployees: number;
  totalWages: number;
  federalIncomeTax: number;
  socialSecurityWages: number;
  socialSecurityTax: number;
  medicareWages: number;
  medicareTax: number;
  additionalMedicareTax: number;
  totalTaxes: number;
  totalDeposits: number;
  balanceDue: number;
  overpayment: number;
}

export interface W2Data {
  year: number;
  employeeId: number;
  employeeName: string;
  employeeSSN: string;
  employeeAddress: string;
  employerName: string;
  employerEIN: string;
  employerAddress: string;
  wages: number;
  federalIncomeTax: number;
  socialSecurityWages: number;
  socialSecurityTax: number;
  medicareWages: number;
  medicareTax: number;
  socialSecurityTips: number;
  allocatedTips: number;
  dependentCareBenefits: number;
  nonqualifiedPlans: number;
  box12Codes: Array<{ code: string; amount: number }>;
  statutoryEmployee: boolean;
  retirementPlan: boolean;
  thirdPartySickPay: boolean;
  stateWages: number;
  stateIncomeTax: number;
  localWages: number;
  localIncomeTax: number;
}

export interface W3Data {
  year: number;
  employerName: string;
  employerEIN: string;
  employerAddress: string;
  numberOfW2Forms: number;
  totalWages: number;
  totalFederalIncomeTax: number;
  totalSocialSecurityWages: number;
  totalSocialSecurityTax: number;
  totalMedicareWages: number;
  totalMedicareTax: number;
}

// ==========================================
// PAYROLL REPORT GENERATOR CLASS
// ==========================================

class PayrollReportGenerator {
  
  /**
   * Genera datos para Form 941 (Quarterly Federal Tax Return)
   */
  generateForm941(quarter: number, year: number, companyData?: any): Form941Data {
    if (!db) throw new Error('Database not initialized');
    
    // Determinar fechas del quarter
    const { startDate, endDate } = this.getQuarterDates(quarter, year);
    
    // Obtener todos los payrolls del quarter
    const payrolls = db.prepare(`
      SELECT * FROM payroll
      WHERE pay_date >= ? AND pay_date <= ?
      AND status != 'voided'
      ORDER BY pay_date
    `).all(startDate, endDate) as Payroll[];
    
    // Calcular totales
    let totalWages = 0;
    let federalIncomeTax = 0;
    let socialSecurityWages = 0;
    let socialSecurityTax = 0;
    let medicareWages = 0;
    let medicareTax = 0;
    let additionalMedicareTax = 0;
    const employeeIds = new Set<number>();
    
    payrolls.forEach(payroll => {
      totalWages += payroll.gross_pay;
      federalIncomeTax += payroll.federal_income_tax;
      socialSecurityWages += payroll.gross_pay;
      socialSecurityTax += payroll.social_security_tax;
      medicareWages += payroll.gross_pay;
      medicareTax += payroll.medicare_tax;
      additionalMedicareTax += payroll.medicare_additional_tax || 0;
      employeeIds.add(payroll.employee_id);
    });
    
    // Total taxes = Employee taxes + Employer matching
    const totalTaxes = federalIncomeTax + 
                      (socialSecurityTax * 2) + // Employee + Employer
                      (medicareTax * 2) +       // Employee + Employer
                      additionalMedicareTax;
    
    return {
      quarter,
      year,
      employerName: companyData?.name || 'Company Name',
      ein: companyData?.ein || '00-0000000',
      address: companyData?.address || 'Company Address',
      numberOfEmployees: employeeIds.size,
      totalWages,
      federalIncomeTax,
      socialSecurityWages,
      socialSecurityTax: socialSecurityTax * 2, // Employee + Employer
      medicareWages,
      medicareTax: medicareTax * 2, // Employee + Employer
      additionalMedicareTax,
      totalTaxes,
      totalDeposits: 0, // Would come from payment records
      balanceDue: totalTaxes,
      overpayment: 0
    };
  }
  
  /**
   * Genera datos para Form W-2 (Wage and Tax Statement) para un empleado
   */
  generateW2(employeeId: number, year: number, companyData?: any): W2Data | null {
    if (!db) throw new Error('Database not initialized');
    
    // Obtener datos del empleado
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId) as Employee;
    if (!employee) return null;
    
    // Obtener todos los payrolls del año para este empleado
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const payrolls = db.prepare(`
      SELECT * FROM payroll
      WHERE employee_id = ?
      AND pay_date >= ? AND pay_date <= ?
      AND status != 'voided'
      ORDER BY pay_date
    `).all(employeeId, startDate, endDate) as Payroll[];
    
    if (payrolls.length === 0) return null;
    
    // Calcular totales anuales
    let wages = 0;
    let federalIncomeTax = 0;
    let socialSecurityWages = 0;
    let socialSecurityTax = 0;
    let medicareWages = 0;
    let medicareTax = 0;
    
    payrolls.forEach(payroll => {
      wages += payroll.gross_pay;
      federalIncomeTax += payroll.federal_income_tax;
      socialSecurityWages += payroll.gross_pay;
      socialSecurityTax += payroll.social_security_tax;
      medicareWages += payroll.gross_pay;
      medicareTax += payroll.medicare_tax + (payroll.medicare_additional_tax || 0);
    });
    
    return {
      year,
      employeeId,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      employeeSSN: employee.ssn || '000-00-0000',
      employeeAddress: 'Employee Address', // TODO: Add address field to Employee table
      employerName: companyData?.name || 'Company Name',
      employerEIN: companyData?.ein || '00-0000000',
      employerAddress: companyData?.address || 'Company Address',
      wages,
      federalIncomeTax,
      socialSecurityWages,
      socialSecurityTax,
      medicareWages,
      medicareTax,
      socialSecurityTips: 0,
      allocatedTips: 0,
      dependentCareBenefits: 0,
      nonqualifiedPlans: 0,
      box12Codes: [],
      statutoryEmployee: false,
      retirementPlan: false,
      thirdPartySickPay: false,
      stateWages: wages,
      stateIncomeTax: 0,
      localWages: wages,
      localIncomeTax: 0
    };
  }
  
  /**
   * Genera datos para Form W-3 (Transmittal of Wage and Tax Statements)
   */
  generateW3(year: number, companyData?: any): W3Data {
    if (!db) throw new Error('Database not initialized');
    
    // Obtener todos los empleados que tuvieron payroll en el año
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const employeeIds = db.prepare(`
      SELECT DISTINCT employee_id FROM payroll
      WHERE pay_date >= ? AND pay_date <= ?
      AND status != 'voided'
    `).all(startDate, endDate) as Array<{ employee_id: number }>;
    
    // Generar W-2 para cada empleado y sumar totales
    let totalWages = 0;
    let totalFederalIncomeTax = 0;
    let totalSocialSecurityWages = 0;
    let totalSocialSecurityTax = 0;
    let totalMedicareWages = 0;
    let totalMedicareTax = 0;
    let numberOfW2Forms = 0;
    
    employeeIds.forEach(({ employee_id }) => {
      const w2 = this.generateW2(employee_id, year, companyData);
      if (w2) {
        totalWages += w2.wages;
        totalFederalIncomeTax += w2.federalIncomeTax;
        totalSocialSecurityWages += w2.socialSecurityWages;
        totalSocialSecurityTax += w2.socialSecurityTax;
        totalMedicareWages += w2.medicareWages;
        totalMedicareTax += w2.medicareTax;
        numberOfW2Forms++;
      }
    });
    
    return {
      year,
      employerName: companyData?.name || 'Company Name',
      employerEIN: companyData?.ein || '00-0000000',
      employerAddress: companyData?.address || 'Company Address',
      numberOfW2Forms,
      totalWages,
      totalFederalIncomeTax,
      totalSocialSecurityWages,
      totalSocialSecurityTax,
      totalMedicareWages,
      totalMedicareTax
    };
  }
  
  /**
   * Obtiene todas las W-2 para un año
   */
  getAllW2s(year: number, companyData?: any): W2Data[] {
    if (!db) throw new Error('Database not initialized');
    
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const employeeIds = db.prepare(`
      SELECT DISTINCT employee_id FROM payroll
      WHERE pay_date >= ? AND pay_date <= ?
      AND status != 'voided'
    `).all(startDate, endDate) as Array<{ employee_id: number }>;
    
    const w2s: W2Data[] = [];
    
    employeeIds.forEach(({ employee_id }) => {
      const w2 = this.generateW2(employee_id, year, companyData);
      if (w2) {
        w2s.push(w2);
      }
    });
    
    return w2s;
  }
  
  /**
   * Obtiene las fechas de inicio y fin de un quarter
   */
  private getQuarterDates(quarter: number, year: number): { startDate: string; endDate: string } {
    const quarters = {
      1: { start: `${year}-01-01`, end: `${year}-03-31` },
      2: { start: `${year}-04-01`, end: `${year}-06-30` },
      3: { start: `${year}-07-01`, end: `${year}-09-30` },
      4: { start: `${year}-10-01`, end: `${year}-12-31` }
    };
    
    const dates = quarters[quarter as keyof typeof quarters];
    if (!dates) throw new Error(`Invalid quarter: ${quarter}`);
    
    return { startDate: dates.start, endDate: dates.end };
  }
  
  /**
   * Formatea un número como moneda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}

// Exportar instancia singleton
export const payrollReportGenerator = new PayrollReportGenerator();
