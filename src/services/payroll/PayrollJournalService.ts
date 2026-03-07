/**
 * PayrollJournalService.ts
 * 
 * Genera asientos contables para nómina:
 * - Asiento de nómina (gross pay → net pay + taxes)
 * - Asiento de impuestos patronales (employer portion)
 * 
 * @author Kiro AI
 * @date 2026-02-07
 */

import { db } from '@/database/simple-db';
import type { Payroll } from '@/database/simple-db';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface PayrollJournalInput {
  payrollId: number;
  grossPay: number;
  netPay: number;
  socialSecurity: number;
  medicare: number;
  medicareAdditional: number;
  federalTax: number;
  otherDeductions: number;
  payDate: string;
  employeeId: number;
}

export interface JournalEntry {
  id: number;
  date: string;
  description: string;
  reference: string;
  items: JournalEntryItem[];
}

export interface JournalEntryItem {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

// ==========================================
// ACCOUNT CODES
// ==========================================

const ACCOUNTS = {
  // Expense Accounts
  PAYROLL_EXPENSE: '5000',
  PAYROLL_TAX_EXPENSE: '5010',
  
  // Asset Accounts
  CASH: '1000',
  
  // Liability Accounts
  FICA_PAYABLE: '2100',
  FEDERAL_TAX_PAYABLE: '2110',
  OTHER_PAYABLES: '2120'
};

// ==========================================
// PAYROLL JOURNAL SERVICE
// ==========================================

export class PayrollJournalService {
  
  /**
   * Genera asiento contable para nómina
   * 
   * Estructura del asiento:
   * DR: Payroll Expense (gross pay)
   * CR: Cash (net pay)
   * CR: FICA Payable (SS + Medicare)
   * CR: Federal Tax Payable (federal tax)
   * CR: Other Payables (other deductions)
   * 
   * @param input - Datos para generar el asiento
   * @returns ID del journal entry creado
   */
  generatePayrollEntry(input: PayrollJournalInput): number {
    const { payrollId, grossPay, netPay, socialSecurity, medicare, medicareAdditional, 
            federalTax, otherDeductions, payDate, employeeId } = input;
    
    // Calcular total FICA (SS + Medicare + Medicare Additional)
    const totalFICA = socialSecurity + medicare + medicareAdditional;
    
    // Crear journal entry
    const description = `Payroll for Employee #${employeeId}`;
    const reference = `PAYROLL-${payrollId}`;
    
    db.run(`
      INSERT INTO journal_entries (
        date, description, reference, created_by, created_at
      ) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
    `, [payDate, description, reference]);
    
    // Obtener ID del journal entry
    const result = db.exec('SELECT last_insert_rowid() as id');
    const journalEntryId = result[0].values[0][0] as number;
    
    // Crear journal entry items
    
    // DR: Payroll Expense (gross pay)
    this.createJournalItem(journalEntryId, ACCOUNTS.PAYROLL_EXPENSE, 'Payroll Expense', grossPay, 0);
    
    // CR: Cash (net pay)
    this.createJournalItem(journalEntryId, ACCOUNTS.CASH, 'Cash', 0, netPay);
    
    // CR: FICA Payable (SS + Medicare)
    if (totalFICA > 0) {
      this.createJournalItem(journalEntryId, ACCOUNTS.FICA_PAYABLE, 'FICA Payable', 0, totalFICA);
    }
    
    // CR: Federal Tax Payable
    if (federalTax > 0) {
      this.createJournalItem(journalEntryId, ACCOUNTS.FEDERAL_TAX_PAYABLE, 'Federal Tax Payable', 0, federalTax);
    }
    
    // CR: Other Payables
    if (otherDeductions > 0) {
      this.createJournalItem(journalEntryId, ACCOUNTS.OTHER_PAYABLES, 'Other Payables', 0, otherDeductions);
    }
    
    // Verificar que el asiento balancea
    if (!this.isBalanced(journalEntryId)) {
      throw new Error(`Journal entry ${journalEntryId} is not balanced`);
    }
    
    // Actualizar payroll con journal_entry_id
    db.run(`
      UPDATE payroll
      SET journal_entry_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [journalEntryId, payrollId]);
    
    return journalEntryId;
  }
  
  /**
   * Genera asiento contable para impuestos patronales (employer portion)
   * 
   * Estructura del asiento:
   * DR: Payroll Tax Expense (employer FICA)
   * CR: FICA Payable (employer portion)
   * 
   * Nota: Employer portion = Employee portion (matching contribution)
   * 
   * @param payrollId - ID del payroll
   * @returns ID del journal entry creado
   */
  generateEmployerTaxEntry(payrollId: number): number {
    // Obtener datos del payroll
    const payroll = this.getPayroll(payrollId);
    if (!payroll) {
      throw new Error(`Payroll ${payrollId} not found`);
    }
    
    // Calcular employer portion (matching)
    const employerFICA = payroll.social_security_tax + payroll.medicare_tax + payroll.medicare_additional_tax;
    
    if (employerFICA === 0) {
      throw new Error('Employer FICA is zero, no journal entry needed');
    }
    
    // Crear journal entry
    const description = `Employer Payroll Taxes for Employee #${payroll.employee_id}`;
    const reference = `PAYROLL-TAX-${payrollId}`;
    
    db.run(`
      INSERT INTO journal_entries (
        date, description, reference, created_by, created_at
      ) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
    `, [payroll.pay_date, description, reference]);
    
    // Obtener ID del journal entry
    const result = db.exec('SELECT last_insert_rowid() as id');
    const journalEntryId = result[0].values[0][0] as number;
    
    // DR: Payroll Tax Expense
    this.createJournalItem(journalEntryId, ACCOUNTS.PAYROLL_TAX_EXPENSE, 'Payroll Tax Expense', employerFICA, 0);
    
    // CR: FICA Payable
    this.createJournalItem(journalEntryId, ACCOUNTS.FICA_PAYABLE, 'FICA Payable', 0, employerFICA);
    
    // Verificar que el asiento balancea
    if (!this.isBalanced(journalEntryId)) {
      throw new Error(`Journal entry ${journalEntryId} is not balanced`);
    }
    
    return journalEntryId;
  }
  
  /**
   * Crea un item de journal entry
   * 
   * @param journalEntryId - ID del journal entry
   * @param accountCode - Código de cuenta
   * @param accountName - Nombre de cuenta
   * @param debit - Monto débito
   * @param credit - Monto crédito
   */
  private createJournalItem(
    journalEntryId: number,
    accountCode: string,
    accountName: string,
    debit: number,
    credit: number
  ): void {
    db.run(`
      INSERT INTO journal_entry_items (
        journal_entry_id, account_code, account_name, debit, credit
      ) VALUES (?, ?, ?, ?, ?)
    `, [journalEntryId, accountCode, accountName, debit, credit]);
  }
  
  /**
   * Verifica que un journal entry esté balanceado (debits = credits)
   * 
   * @param journalEntryId - ID del journal entry
   * @returns true si está balanceado
   */
  private isBalanced(journalEntryId: number): boolean {
    try {
      const result = db.exec(`
        SELECT 
          SUM(debit) as total_debits,
          SUM(credit) as total_credits
        FROM journal_entry_items
        WHERE journal_entry_id = ?
      `, [journalEntryId]);
      
      if (!result.length || !result[0].values.length) {
        return false;
      }
      
      const totalDebits = result[0].values[0][0] as number || 0;
      const totalCredits = result[0].values[0][1] as number || 0;
      
      // Comparar con tolerancia de 1 centavo
      return Math.abs(totalDebits - totalCredits) < 0.01;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }
  
  /**
   * Obtiene un payroll por ID
   * 
   * @param payrollId - ID del payroll
   * @returns Datos del payroll o null
   */
  private getPayroll(payrollId: number): Payroll | null {
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
   * Obtiene un journal entry por ID
   * 
   * @param journalEntryId - ID del journal entry
   * @returns Journal entry con items
   */
  getJournalEntry(journalEntryId: number): JournalEntry | null {
    try {
      // Obtener journal entry
      const entryResult = db.exec('SELECT * FROM journal_entries WHERE id = ?', [journalEntryId]);
      
      if (!entryResult.length || !entryResult[0].values.length) {
        return null;
      }
      
      const entryRow = entryResult[0].values[0];
      const entryColumns = entryResult[0].columns;
      
      const entry: any = {};
      entryColumns.forEach((col: string, idx: number) => {
        entry[col] = entryRow[idx];
      });
      
      // Obtener items
      const itemsResult = db.exec('SELECT * FROM journal_entry_items WHERE journal_entry_id = ?', [journalEntryId]);
      
      const items: JournalEntryItem[] = [];
      if (itemsResult.length && itemsResult[0].values.length) {
        const itemColumns = itemsResult[0].columns;
        itemsResult[0].values.forEach((row: any) => {
          const item: any = {};
          itemColumns.forEach((col: string, idx: number) => {
            item[col] = row[idx];
          });
          items.push({
            accountCode: item.account_code,
            accountName: item.account_name,
            debit: item.debit || 0,
            credit: item.credit || 0
          });
        });
      }
      
      return {
        id: entry.id,
        date: entry.date,
        description: entry.description,
        reference: entry.reference,
        items
      };
    } catch (error) {
      console.error('Error getting journal entry:', error);
      return null;
    }
  }
}

// Exportar instancia singleton
export const payrollJournalService = new PayrollJournalService();
