/**
 * Módulo 11 — Journal (Asientos Contables)
 * Extraído de simple-db.ts líneas 7051–7447
 */

import { db } from '../simple-db';
import { forceSaveDB, isDateLocked, logAuditEvent, PRIVILEGED_ROLES } from '../simple-db';
import { logger } from '../../core/logging/SystemLogger';
import type { ChartOfAccount, JournalEntry, JournalDetail } from './db-types';

// Obtener todas las cuentas del plan de cuentas
export const getChartOfAccounts = (): ChartOfAccount[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT 
        id,
        account_code,
        account_name,
        account_type,
        is_active,
        number,
        parent_account,
        normal_balance,
        detail_type
      FROM chart_of_accounts 
      WHERE is_active = 1
      ORDER BY account_code
    `);

    if (!result[0]) return [];

    const accounts: ChartOfAccount[] = [];
    const columns = (result[0].columns || (result[0] as any).lc);

    result[0].values.forEach((row: any) => {
      const account: any = {};
      columns.forEach((col: any, index: any) => {
        account[col] = row[index];
      });

      account.balance = getAccountBalance(account.account_code);

      accounts.push(account as ChartOfAccount);
    });

    return accounts;
  } catch (error) {
    console.error('Error getting chart of accounts:', error);
    return [];
  }
};

// Obtener balance de una cuenta específica
export const getAccountBalance = (accountCode: string): number => {
  if (!db) return 0;

  try {
    const result = db.exec(`
      SELECT
        coa.normal_balance,
        COALESCE(SUM(jd.debit_amount), 0) as total_debits,
        COALESCE(SUM(jd.credit_amount), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_details jd ON coa.account_code = jd.account_code
      WHERE coa.account_code = ?
      GROUP BY coa.account_code, coa.normal_balance
    `, [accountCode]);

    if (!result[0] || result[0].values.length === 0) return 0;

    const [normalBalance, totalDebits, totalCredits] = result[0].values[0];
    const debits = Number(totalDebits) || 0;
    const credits = Number(totalCredits) || 0;

    if (normalBalance === 'debit') {
      return debits - credits;
    } else {
      return credits - debits;
    }
  } catch (error) {
    console.error(`Error getting balance for account ${accountCode}:`, error);
    return 0;
  }
};

// Crear asiento contable
export const createJournalEntry = async (
  entryData: Partial<JournalEntry>,
  details: Partial<JournalDetail>[],
  userId?: number
): Promise<{ success: boolean; message: string; entryId?: number }> => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const entryDate = entryData.entry_date || new Date().toISOString().split('T')[0];
    if (isDateLocked(entryDate)) {
      return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado.' };
    }

    if (!details || details.length < 2) {
      return { success: false, message: 'Un asiento contable debe tener al menos 2 líneas' };
    }

    let totalDebits = 0;
    let totalCredits = 0;

    details.forEach(detail => {
      totalDebits += Number(detail.debit_amount) || 0;
      totalCredits += Number(detail.credit_amount) || 0;
    });

    const diff = Math.abs(totalDebits - totalCredits);
    if (diff > 0.01) {
      const msg = `VIOLACIÓN DE PARTIDA DOBLE: Asiento desbalanceado por $${diff.toFixed(2)}. Débitos: $${totalDebits.toFixed(2)}, Créditos: $${totalCredits.toFixed(2)}`;
      console.error(msg);
      throw new Error(msg);
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO journal_entries(
        entry_date, reference, description, total_debit, total_credit, created_by, updated_by
      ) VALUES(?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      entryDate,
      entryData.reference_number || entryData.reference || null,
      entryData.description || null,
      totalDebits,
      totalCredits,
      userId || 1,
      userId || 1
    ]);

    const entryId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();

    const detailStmt = db.prepare(`
      INSERT INTO journal_details(
        journal_entry_id, account_code, debit_amount, credit_amount, description
      ) VALUES(?, ?, ?, ?, ?)
    `);

    details.forEach(detail => {
      if (!db) throw new Error('Database not initialized');

      const accountExists = db.exec(`SELECT account_code FROM chart_of_accounts WHERE account_code = ?`, [detail.account_code || '']);
      if (!accountExists[0] || accountExists[0].values.length === 0) {
        throw new Error(`La cuenta ${detail.account_code || 'undefined'} no existe en el plan de cuentas`);
      }

      detailStmt.run([
        entryId,
        detail.account_code || '',
        Number(detail.debit_amount) || 0,
        Number(detail.credit_amount) || 0,
        detail.description || ''
      ]);
    });

    detailStmt.free();

    logAuditEvent('journal_entries', entryId, 'INSERT', null, {
      entry_date: entryDate,
      reference_number: entryData.reference_number,
      total_debit: totalDebits,
      total_credit: totalCredits,
      details_count: details.length
    }, userId);

    db.run('COMMIT');

    await forceSaveDB();

    return {
      success: true,
      message: `Asiento contable creado correctamente (ID: ${entryId})`,
      entryId
    };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error creating journal entry:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear el asiento contable'
    };
  }
};

// Obtener asientos contables
export const getJournalEntries = (limit: number = 50, filters?: { userId?: number, role?: string }): JournalEntry[] => {
  if (!db) return [];

  try {
    let query = `
      SELECT
        id, entry_date, reference, description, total_debit, total_credit,
        is_balanced, created_at, created_by, verified_by, verified_at
      FROM journal_entries
    `;

    const params: any[] = [];

    if (filters?.userId && filters?.role && !PRIVILEGED_ROLES.includes(filters.role)) {
      query += ` WHERE created_by = ?`;
      params.push(filters.userId);
    }

    query += ` ORDER BY entry_date DESC, id DESC LIMIT ?`;
    params.push(limit);

    const result = db.exec(query, params);

    if (!result[0]) return [];

    const entries: JournalEntry[] = [];
    const columns = (result[0].columns || (result[0] as any).lc);

    result[0].values.forEach((row: any) => {
      const entry: any = {};
      columns.forEach((col: any, index: any) => {
        entry[col] = row[index];
      });

      entry.details = getJournalEntryDetails(entry.id);
      entries.push(entry as JournalEntry);
    });

    return entries;
  } catch (error) {
    console.error('Error getting journal entries:', error);
    return [];
  }
};

// Obtener detalles de un asiento específico
export const getJournalEntryDetails = (entryId: number): JournalDetail[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT
        jd.id, jd.journal_entry_id, jd.account_code, jd.debit_amount,
        jd.credit_amount, jd.description,
        coa.account_name, coa.account_type, coa.normal_balance
      FROM journal_details jd
      JOIN chart_of_accounts coa ON jd.account_code = coa.account_code
      WHERE jd.journal_entry_id = ?
      ORDER BY jd.id
    `, [entryId]);

    if (!result[0]) return [];

    const details: JournalDetail[] = [];
    const columns = (result[0].columns || (result[0] as any).lc);

    result[0].values.forEach((row: any) => {
      const detail: any = {};
      columns.forEach((col: any, index: any) => {
        detail[col] = row[index];
      });

      detail.account = {
        account_code: detail.account_code,
        account_name: detail.account_name,
        account_type: detail.account_type,
        normal_balance: detail.normal_balance
      };

      details.push(detail as JournalDetail);
    });

    return details;
  } catch (error) {
    console.error('Error getting journal entry details:', error);
    return [];
  }
};
