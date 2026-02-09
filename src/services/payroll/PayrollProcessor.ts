/**
 * PayrollProcessor.ts
 * 
 * Servicio principal para procesamiento de nómina con cumplimiento IRS.
 * Orquesta el flujo completo desde validación hasta generación de asientos contables.
 * 
 * @module PayrollProcessor
 * @description
 * Procesa nóminas completas para empleados incluyendo:
 * - Validación de inputs y datos de empleado
 * - Cálculo de gross pay (salario bruto) para hourly y salaried
 * - Cálculo de impuestos federales (FICA, Medicare, Federal Income Tax)
 * - Cálculo de net pay (salario neto)
 * - Generación automática de asientos contables
 * - Actualización de totales YTD (Year-To-Date)
 * - Gestión de estados (draft, approved, voided)
 * 
 * @features
 * - Validación de períodos contables cerrados
 * - Prevención de duplicados por período
 * - Cálculo de overtime (1.5x rate)
 * - Integración con PayrollTaxCalculator
 * - Integración con PayrollJournalService
 * - Manejo de bonuses y commissions
 * - Reversión de nóminas (void)
 * 
 * @compliance
 * - IRS Publication 15 (Circular E)
 * - Federal minimum wage ($7.25)
 * - Overtime rules (FLSA)
 * - SSN format validation
 * 
 * @author Kiro AI
 * @date 2026-02-07
 * @version 1.0.0
 * 
 * @example
 * ```typescript
 * const processor = new PayrollProcessor();
 * const result = await processor.processPayroll({
 *   employeeId: 1,
 *   payPeriodStart: '2026-01-01',
 *   payPeriodEnd: '2026-01-15',
 *   payDate: '2026-01-20',
 *   regularHours: 80,
 *   overtimeHours: 5,
 *   bonuses: 0,
 *   commissions: 0,
 *   otherDeductions: 0,
 *   processedBy: 1
 * });
 * 
 * if (result.success) {
 *   console.log(`Payroll ${result.payrollId} processed`);
 *   console.log(`Gross: $${result.grossPay}, Net: $${result.netPay}`);
 * }
 * ```
 */

import { db } from '../../database/simple-db';
import { payrollTaxCalculator, TaxCalculationInput, TaxCalculationResult } from './PayrollTaxCalculator';
import { payrollJournalService, PayrollJournalInput } from './PayrollJournalService';
import { isDateLocked } from '../../database/simple-db';
import type { Employee, Payroll } from '../../database/simple-db';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface PayrollInput {
  employeeId: number;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  regularHours: number;
  overtimeHours: number;
  bonuses: number;
  commissions: number;
  otherDeductions: number;
  processedBy: number;
}

export interface PayrollResult {
  success: boolean;
  payrollId?: number;
  grossPay: number;
  netPay: number;
  taxes?: TaxCalculationResult;
  journalEntryId?: number;
  message?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ==========================================
// PAYROLL PROCESSOR
// ==========================================

/**
 * Clase principal para procesamiento de nómina
 * 
 * @class PayrollProcessor
 * @description
 * Orquesta el procesamiento completo de nómina desde validación hasta
 * generación de asientos contables. Maneja empleados hourly y salaried,
 * calcula impuestos federales, y mantiene totales YTD actualizados.
 * 
 * @singleton Exportado como instancia única `payrollProcessor`
 */
export class PayrollProcessor {
  
  /**
   * Procesa nómina completa para un empleado
   * 
   * @async
   * @method processPayroll
   * @description
   * Método principal que orquesta todo el flujo de procesamiento de nómina:
   * 1. Valida inputs (horas, fechas, montos)
   * 2. Verifica que el período contable esté abierto
   * 3. Obtiene y valida datos del empleado
   * 4. Verifica que no exista payroll duplicado
   * 5. Calcula gross pay (regular + overtime + bonuses + commissions)
   * 6. Calcula impuestos (FICA, Medicare, Federal Income Tax)
   * 7. Calcula net pay (gross - taxes - deductions)
   * 8. Guarda en base de datos con status 'draft'
   * 9. Genera asiento contable automático
   * 10. Actualiza totales YTD del empleado
   * 
   * @param {PayrollInput} input - Datos de entrada para procesar nómina
   * @param {number} input.employeeId - ID del empleado
   * @param {string} input.payPeriodStart - Fecha inicio período (YYYY-MM-DD)
   * @param {string} input.payPeriodEnd - Fecha fin período (YYYY-MM-DD)
   * @param {string} input.payDate - Fecha de pago (YYYY-MM-DD)
   * @param {number} input.regularHours - Horas regulares trabajadas (0-168)
   * @param {number} input.overtimeHours - Horas extras trabajadas (0-168)
   * @param {number} input.bonuses - Bonos en dólares
   * @param {number} input.commissions - Comisiones en dólares
   * @param {number} input.otherDeductions - Otras deducciones en dólares
   * @param {number} input.processedBy - ID del usuario que procesa
   * 
   * @returns {Promise<PayrollResult>} Resultado del procesamiento
   * @returns {boolean} result.success - true si procesó exitosamente
   * @returns {number} [result.payrollId] - ID del payroll creado
   * @returns {number} result.grossPay - Salario bruto calculado
   * @returns {number} result.netPay - Salario neto calculado
   * @returns {TaxCalculationResult} [result.taxes] - Desglose de impuestos
   * @returns {number} [result.journalEntryId] - ID del asiento contable generado
   * @returns {string} [result.message] - Mensaje de éxito
   * @returns {string} [result.error] - Mensaje de error si falló
   * 
   * @throws {Error} Si el período contable está cerrado
   * @throws {Error} Si el empleado no existe o está inactivo
   * @throws {Error} Si ya existe un payroll para este período
   * @throws {Error} Si los datos del empleado están incompletos
   * 
   * @example
   * ```typescript
   * const result = await payrollProcessor.processPayroll({
   *   employeeId: 1,
   *   payPeriodStart: '2026-01-01',
   *   payPeriodEnd: '2026-01-15',
   *   payDate: '2026-01-20',
   *   regularHours: 80,
   *   overtimeHours: 5,
   *   bonuses: 500,
   *   commissions: 0,
   *   otherDeductions: 100,
   *   processedBy: 1
   * });
   * 
   * if (result.success) {
   *   console.log(`Payroll ID: ${result.payrollId}`);
   *   console.log(`Gross Pay: $${result.grossPay.toFixed(2)}`);
   *   console.log(`Net Pay: $${result.netPay.toFixed(2)}`);
   *   console.log(`Federal Tax: $${result.taxes.federalIncomeTax.toFixed(2)}`);
   * } else {
   *   console.error(`Error: ${result.error}`);
   * }
   * ```
   * 
   * @see {@link PayrollTaxCalculator} Para cálculo de impuestos
   * @see {@link PayrollJournalService} Para generación de asientos contables
   */
  async processPayroll(input: PayrollInput): Promise<PayrollResult> {
    try {
      // 1. Validar input
      const validation = this.validatePayrollInput(input);
      if (!validation.valid) {
        return {
          success: false,
          grossPay: 0,
          netPay: 0,
          error: validation.errors.join(', ')
        };
      }
      
      // 2. Validar que el período contable esté abierto
      if (isDateLocked(input.payDate)) {
        return {
          success: false,
          grossPay: 0,
          netPay: 0,
          error: 'ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado.'
        };
      }
      
      // 3. Obtener datos del empleado
      const employee = this.getEmployee(input.employeeId);
      if (!employee) {
        return {
          success: false,
          grossPay: 0,
          netPay: 0,
          error: 'Employee not found'
        };
      }
      
      // 4. Validar que el empleado tenga datos completos
      const employeeValidation = this.validateEmployeeData(employee);
      if (!employeeValidation.valid) {
        return {
          success: false,
          grossPay: 0,
          netPay: 0,
          error: `Employee data incomplete: ${employeeValidation.errors.join(', ')}`
        };
      }
      
      // 5. Verificar que no exista ya un payroll para este período
      if (this.payrollExists(input.employeeId, input.payPeriodStart, input.payPeriodEnd)) {
        return {
          success: false,
          grossPay: 0,
          netPay: 0,
          error: 'Payroll already processed for this employee and period'
        };
      }
      
      // 6. Calcular gross pay
      const grossPay = this.calculateGrossPay(input, employee);
      
      // 7. Calcular taxes
      const taxes = this.calculateTaxes(grossPay, employee);
      
      // 8. Calcular net pay
      const netPay = this.calculateNetPay(grossPay, taxes, input.otherDeductions);
      
      // 9. Guardar en base de datos
      const payrollId = this.savePayroll(input, employee, grossPay, taxes, netPay);
      
      // 10. Generar asiento contable
      let journalEntryId: number | undefined;
      try {
        const journalInput: PayrollJournalInput = {
          payrollId,
          grossPay,
          netPay,
          socialSecurity: taxes.socialSecurity,
          medicare: taxes.medicare,
          medicareAdditional: taxes.medicareAdditional,
          federalTax: taxes.federalIncomeTax,
          otherDeductions: input.otherDeductions,
          payDate: input.payDate,
          employeeId: input.employeeId
        };
        journalEntryId = payrollJournalService.generatePayrollEntry(journalInput);
      } catch (error) {
        console.error('Error generating journal entry:', error);
        // No fallar el proceso si el journal entry falla
      }
      
      // 11. Actualizar YTD totals del empleado
      this.updateEmployeeYTD(employee.id, grossPay, taxes);
      
      return {
        success: true,
        payrollId,
        grossPay,
        netPay,
        taxes,
        journalEntryId,
        message: 'Payroll processed successfully'
      };
      
    } catch (error) {
      console.error('Error processing payroll:', error);
      return {
        success: false,
        grossPay: 0,
        netPay: 0,
        error: error instanceof Error ? error.message : 'Unknown error processing payroll'
      };
    }
  }
  
  /**
   * Valida los inputs de nómina
   * 
   * @param input - Datos de entrada
   * @returns Resultado de validación
   */
  validatePayrollInput(input: PayrollInput): ValidationResult {
    const errors: string[] = [];
    
    // Validar hours
    if (input.regularHours < 0 || input.regularHours > 168) {
      errors.push('Regular hours must be between 0 and 168');
    }
    
    if (input.overtimeHours < 0 || input.overtimeHours > 168) {
      errors.push('Overtime hours must be between 0 and 168');
    }
    
    // Validar fechas
    const startDate = new Date(input.payPeriodStart);
    const endDate = new Date(input.payPeriodEnd);
    const payDate = new Date(input.payDate);
    
    if (endDate <= startDate) {
      errors.push('Pay period end date must be after start date');
    }
    
    if (payDate < endDate) {
      errors.push('Pay date must be on or after pay period end date');
    }
    
    // Validar montos no negativos
    if (input.bonuses < 0) {
      errors.push('Bonuses cannot be negative');
    }
    
    if (input.commissions < 0) {
      errors.push('Commissions cannot be negative');
    }
    
    if (input.otherDeductions < 0) {
      errors.push('Other deductions cannot be negative');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valida que el empleado tenga todos los datos necesarios
   * 
   * @param employee - Datos del empleado
   * @returns Resultado de validación
   */
  validateEmployeeData(employee: Employee): ValidationResult {
    const errors: string[] = [];
    
    // Validar rate/salary
    if (employee.pay_type === 'hourly' && (!employee.hourly_rate || employee.hourly_rate < 7.25)) {
      errors.push('Hourly rate must be at least $7.25 (federal minimum wage)');
    }
    
    if (employee.pay_type === 'salaried' && (!employee.salary || employee.salary <= 0)) {
      errors.push('Salary must be greater than 0');
    }
    
    // Validar filing status
    if (!employee.filing_status) {
      errors.push('Filing status is required');
    }
    
    const validStatuses = ['single', 'married', 'married_separate', 'head_of_household'];
    if (employee.filing_status && !validStatuses.includes(employee.filing_status)) {
      errors.push('Invalid filing status');
    }
    
    // Validar SSN (opcional pero recomendado)
    if (employee.ssn && !this.isValidSSN(employee.ssn)) {
      errors.push('SSN must be in format XXX-XX-XXXX');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valida formato de SSN
   * 
   * @param ssn - Social Security Number
   * @returns true si es válido
   */
  private isValidSSN(ssn: string): boolean {
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    return ssnRegex.test(ssn);
  }
  
  /**
   * Obtiene datos del empleado
   * 
   * @param employeeId - ID del empleado
   * @returns Datos del empleado o null
   */
  private getEmployee(employeeId: number): Employee | null {
    try {
      const result = db.exec(
        'SELECT * FROM employees WHERE id = ? AND status = ?',
        [employeeId, 'active']
      );
      
      if (!result.length || !result[0].values.length) {
        return null;
      }
      
      const row = result[0].values[0];
      const columns = result[0].columns;
      
      const employee: any = {};
      columns.forEach((col: string, idx: number) => {
        employee[col] = row[idx];
      });
      
      return employee as Employee;
    } catch (error) {
      console.error('Error getting employee:', error);
      return null;
    }
  }
  
  /**
   * Verifica si ya existe un payroll para este empleado y período
   * 
   * @param employeeId - ID del empleado
   * @param startDate - Fecha de inicio del período
   * @param endDate - Fecha de fin del período
   * @returns true si ya existe
   */
  private payrollExists(employeeId: number, startDate: string, endDate: string): boolean {
    try {
      const result = db.exec(
        'SELECT COUNT(*) as count FROM payroll WHERE employee_id = ? AND pay_period_start = ? AND pay_period_end = ? AND status != ?',
        [employeeId, startDate, endDate, 'voided']
      );
      
      if (!result.length || !result[0].values.length) {
        return false;
      }
      
      const count = result[0].values[0][0] as number;
      return count > 0;
    } catch (error) {
      console.error('Error checking payroll existence:', error);
      return false;
    }
  }
  
  /**
   * Calcula gross pay (salario bruto)
   * 
   * @param input - Datos de entrada
   * @param employee - Datos del empleado
   * @returns Gross pay calculado
   */
  calculateGrossPay(input: PayrollInput, employee: Employee): number {
    let grossPay = 0;
    
    if (employee.pay_type === 'hourly') {
      // Hourly employee
      const rate = employee.hourly_rate || 0;
      
      // Regular pay
      const regularPay = input.regularHours * rate;
      
      // Overtime pay (1.5x rate for hours > 40)
      const overtimePay = input.overtimeHours * rate * 1.5;
      
      grossPay = regularPay + overtimePay;
      
    } else if (employee.pay_type === 'salaried') {
      // Salaried employee
      // Asumimos pay period semimonthly (24 períodos al año)
      const annualSalary = employee.salary || 0;
      grossPay = annualSalary / 24;
    }
    
    // Agregar bonuses y commissions
    grossPay += input.bonuses + input.commissions;
    
    // Redondear a centavo más cercano
    return Math.round(grossPay * 100) / 100;
  }
  
  /**
   * Calcula todos los impuestos
   * 
   * @param grossPay - Salario bruto
   * @param employee - Datos del empleado
   * @returns Resultado de cálculo de impuestos
   */
  private calculateTaxes(grossPay: number, employee: Employee): TaxCalculationResult {
    const taxInput: TaxCalculationInput = {
      grossPay,
      ytdGrossPay: employee.ytd_gross_pay || 0,
      filingStatus: employee.filing_status || 'single',
      allowances: employee.allowances || 0,
      additionalWithholding: employee.additional_withholding || 0,
      payPeriod: 'semimonthly' // Default, podría ser configurable
    };
    
    return payrollTaxCalculator.calculateAllTaxes(taxInput);
  }
  
  /**
   * Calcula net pay (salario neto)
   * 
   * @param grossPay - Salario bruto
   * @param taxes - Impuestos calculados
   * @param otherDeductions - Otras deducciones
   * @returns Net pay calculado
   */
  calculateNetPay(grossPay: number, taxes: TaxCalculationResult, otherDeductions: number): number {
    const netPay = grossPay - taxes.totalTaxes - otherDeductions;
    
    // Net pay no puede ser negativo
    return Math.max(0, Math.round(netPay * 100) / 100);
  }
  
  /**
   * Guarda el payroll en la base de datos
   * 
   * @param input - Datos de entrada
   * @param employee - Datos del empleado
   * @param grossPay - Salario bruto
   * @param taxes - Impuestos calculados
   * @param netPay - Salario neto
   * @returns ID del payroll creado
   */
  private savePayroll(
    input: PayrollInput,
    employee: Employee,
    grossPay: number,
    taxes: TaxCalculationResult,
    netPay: number
  ): number {
    const rate = employee.pay_type === 'hourly' ? employee.hourly_rate : null;
    const regularPay = employee.pay_type === 'hourly' 
      ? input.regularHours * (employee.hourly_rate || 0)
      : grossPay - input.bonuses - input.commissions;
    const overtimePay = employee.pay_type === 'hourly'
      ? input.overtimeHours * (employee.hourly_rate || 0) * 1.5
      : 0;
    
    const totalDeductions = taxes.totalTaxes + input.otherDeductions;
    
    db.run(`
      INSERT INTO payroll (
        employee_id, pay_period_start, pay_period_end, pay_date,
        regular_hours, overtime_hours, hourly_rate,
        regular_pay, overtime_pay, bonuses, commissions, gross_pay,
        social_security_tax, medicare_tax, medicare_additional_tax, federal_income_tax,
        other_deductions, total_deductions, net_pay,
        status, processed_by, processed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      input.employeeId, input.payPeriodStart, input.payPeriodEnd, input.payDate,
      input.regularHours, input.overtimeHours, rate,
      regularPay, overtimePay, input.bonuses, input.commissions, grossPay,
      taxes.socialSecurity, taxes.medicare, taxes.medicareAdditional, taxes.federalIncomeTax,
      input.otherDeductions, totalDeductions, netPay,
      'draft', input.processedBy
    ]);
    
    // Obtener el ID del payroll recién creado
    const result = db.exec('SELECT last_insert_rowid() as id');
    return result[0].values[0][0] as number;
  }
  
  /**
   * Actualiza los totales YTD del empleado
   * 
   * @param employeeId - ID del empleado
   * @param grossPay - Salario bruto
   * @param taxes - Impuestos calculados
   */
  private updateEmployeeYTD(employeeId: number, grossPay: number, taxes: TaxCalculationResult): void {
    db.run(`
      UPDATE employees
      SET 
        ytd_gross_pay = COALESCE(ytd_gross_pay, 0) + ?,
        ytd_federal_tax = COALESCE(ytd_federal_tax, 0) + ?,
        ytd_fica = COALESCE(ytd_fica, 0) + ?,
        ytd_medicare = COALESCE(ytd_medicare, 0) + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      grossPay,
      taxes.federalIncomeTax,
      taxes.socialSecurity,
      taxes.medicare + taxes.medicareAdditional,
      employeeId
    ]);
  }
  
  /**
   * Aprueba un payroll (cambia status de draft a approved)
   * 
   * @param payrollId - ID del payroll
   * @param approvedBy - ID del usuario que aprueba
   * @returns true si se aprobó exitosamente
   */
  approvePayroll(payrollId: number, approvedBy: number): boolean {
    try {
      db.run(`
        UPDATE payroll
        SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'draft'
      `, [approvedBy, payrollId]);
      
      return true;
    } catch (error) {
      console.error('Error approving payroll:', error);
      return false;
    }
  }
  
  /**
   * Anula un payroll (cambia status a voided)
   * 
   * @param payrollId - ID del payroll
   * @returns true si se anuló exitosamente
   */
  voidPayroll(payrollId: number): boolean {
    try {
      // Obtener datos del payroll antes de anular
      const result = db.exec('SELECT * FROM payroll WHERE id = ?', [payrollId]);
      if (!result.length || !result[0].values.length) {
        return false;
      }
      
      const row = result[0].values[0];
      const columns = result[0].columns;
      const payroll: any = {};
      columns.forEach((col: string, idx: number) => {
        payroll[col] = row[idx];
      });
      
      // Revertir YTD totals del empleado
      db.run(`
        UPDATE employees
        SET 
          ytd_gross_pay = COALESCE(ytd_gross_pay, 0) - ?,
          ytd_federal_tax = COALESCE(ytd_federal_tax, 0) - ?,
          ytd_fica = COALESCE(ytd_fica, 0) - ?,
          ytd_medicare = COALESCE(ytd_medicare, 0) - ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        payroll.gross_pay,
        payroll.federal_income_tax,
        payroll.social_security_tax,
        payroll.medicare_tax + payroll.medicare_additional_tax,
        payroll.employee_id
      ]);
      
      // Marcar payroll como voided
      db.run(`
        UPDATE payroll
        SET status = 'voided', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [payrollId]);
      
      return true;
    } catch (error) {
      console.error('Error voiding payroll:', error);
      return false;
    }
  }
  
  /**
   * Obtiene un payroll por ID
   * 
   * @param payrollId - ID del payroll
   * @returns Datos del payroll o null
   */
  getPayroll(payrollId: number): Payroll | null {
    try {
      const result = db.exec('SELECT * FROM payroll WHERE id = ?', [payrollId]);
      
      if (!result.length || !result[0].values.length) {
        return null;
      }
      
      const row = result[0].values[0];
      const columns = result[0].columns;
      
      const payroll: any = {};
      columns.forEach((col: string, idx: number) => {
        payroll[col] = row[idx];
      });
      
      return payroll as Payroll;
    } catch (error) {
      console.error('Error getting payroll:', error);
      return null;
    }
  }
  
  /**
   * Obtiene todos los payrolls de un empleado
   * 
   * @param employeeId - ID del empleado
   * @param year - Año (opcional)
   * @returns Lista de payrolls
   */
  getEmployeePayrolls(employeeId: number, year?: number): Payroll[] {
    try {
      let query = 'SELECT * FROM payroll WHERE employee_id = ?';
      const params: any[] = [employeeId];
      
      if (year) {
        query += ' AND strftime("%Y", pay_date) = ?';
        params.push(year.toString());
      }
      
      query += ' ORDER BY pay_date DESC';
      
      const result = db.exec(query, params);
      
      if (!result.length || !result[0].values.length) {
        return [];
      }
      
      const columns = result[0].columns;
      return result[0].values.map((row: any) => {
        const payroll: any = {};
        columns.forEach((col: string, idx: number) => {
          payroll[col] = row[idx];
        });
        return payroll as Payroll;
      });
    } catch (error) {
      console.error('Error getting employee payrolls:', error);
      return [];
    }
  }
}

// Exportar instancia singleton
export const payrollProcessor = new PayrollProcessor();
