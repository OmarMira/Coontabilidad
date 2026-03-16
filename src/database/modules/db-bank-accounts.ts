/**
 * Módulo 19 — Bank Accounts
 * Extraído de simple-db.ts líneas 10474–10761
 */

import { db } from './db-core';
import { forceSaveDB, saveDatabase } from './db-persistence';
import { generateSimpleHash } from './db-audit';
import { logger } from '../../core/logging/SystemLogger';
import type { BankAccount } from './db-types';

export function getBankAccounts(): BankAccount[] {
  if (!db) return [];

  try {
    const result = db.exec("SELECT * FROM bank_accounts WHERE is_active = 1 ORDER BY account_name ASC");
    if (!result[0]) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any) => {
      const account: any = {};
      columns.forEach((col: any, index: any) => { account[col] = row[index]; });
      account.is_active = account.is_active === 1;
      return account as BankAccount;
    });
  } catch (error) {
    logger.error('BankAccounts', 'get_all_failed', 'Error al obtener cuentas bancarias', null, error as Error);
    return [];
  }
}

export function getBankAccountById(id: number): BankAccount | null {
  if (!db) return null;

  try {
    const result = db.exec(`SELECT * FROM bank_accounts WHERE id = ${id}`);
    if (!result[0] || !result[0].values[0]) return null;

    const columns = result[0].columns;
    const account: any = {};
    columns.forEach((col: any, index: any) => { account[col] = result[0].values[0][index]; });
    account.is_active = account.is_active === 1;
    return account as BankAccount;
  } catch (error) {
    logger.error('BankAccounts', 'get_by_id_failed', 'Error al obtener cuenta bancaria', { id }, error as Error);
    return null;
  }
}

export function getBankAccountTransactionCount(id: number): number {
  if (!db) return 0;
  try {
    const account = getBankAccountById(id);
    if (!account) return 0;

    const result = db.exec(`
      SELECT COUNT(*) FROM journal_entries
      WHERE reference_number LIKE '%${account.account_number}%'
         OR description LIKE '%${account.account_number}%'
    `);
    return (result[0]?.values[0]?.[0] as number) || 0;
  } catch {
    return 0;
  }
}

export function findBankAccountsByNumber(accountNumber: string): BankAccount[] {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT * FROM bank_accounts
      WHERE account_number LIKE '%${accountNumber}%'
        AND is_active = 1
      ORDER BY account_name ASC
    `);

    if (!result[0]) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any) => {
      const account: any = {};
      columns.forEach((col: any, index: any) => { account[col] = row[index]; });
      return account as BankAccount;
    });
  } catch (error) {
    logger.error('BankAccounts', 'find_all_failed', 'Error al buscar cuentas por número', { accountNumber }, error as Error);
    return [];
  }
}

export function findBankAccountByNumber(accountNumber: string): BankAccount | null {
  const accounts = findBankAccountsByNumber(accountNumber);
  return accounts.length > 0 ? accounts[0] : null;
}

export async function createBankAccount(
  data: Omit<BankAccount, 'id' | 'created_at'>
): Promise<{ success: boolean; message: string; id?: number }> {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    const stmt = db.prepare(`
      INSERT INTO bank_accounts(
        account_name, bank_name, account_number, account_type,
        routing_number, balance, currency, is_active, notes
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      data.account_name,
      data.bank_name,
      data.account_number,
      data.account_type,
      data.routing_number || null,
      data.balance || 0,
      data.currency || 'USD',
      data.is_active ? 1 : 0,
      data.notes || null
    ]);

    const idResult = db.exec("SELECT last_insert_rowid()");
    const id = idResult[0].values[0][0] as number;

    const auditStmt = db.prepare(`
      INSERT INTO audit_log(table_name, record_id, action, new_values, user_id, audit_hash)
      VALUES(?, ?, ?, ?, ?, ?)
    `);
    auditStmt.run(['bank_accounts', id, 'INSERT', JSON.stringify(data), 1, generateSimpleHash(data)]);
    auditStmt.free();

    stmt.free();

    logger.info('BankAccounts', 'create_success', 'Cuenta bancaria creada', { id });
    await forceSaveDB();

    return { success: true, message: 'Cuenta bancaria creada correctamente', id };
  } catch (error) {
    logger.error('BankAccounts', 'create_failed', 'Error al crear cuenta bancaria', null, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function updateBankAccount(
  id: number,
  data: Partial<BankAccount>
): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    const fields = ['account_name', 'bank_name', 'account_number', 'account_type', 'routing_number', 'balance', 'currency', 'is_active', 'notes'];

    fields.forEach(field => {
      if ((data as any)[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        let val = (data as any)[field];
        if (typeof val === 'boolean') val = val ? 1 : 0;
        updateValues.push(val);
      }
    });

    if (updateFields.length === 0) return { success: false, message: 'No hay datos para actualizar' };

    updateValues.push(id);

    const stmt = db.prepare(`UPDATE bank_accounts SET ${updateFields.join(', ')} WHERE id = ?`);
    stmt.run(updateValues);

    const auditStmt = db.prepare(`
      INSERT INTO audit_log(table_name, record_id, action, new_values, user_id, audit_hash)
      VALUES(?, ?, ?, ?, ?, ?)
    `);
    auditStmt.run(['bank_accounts', id, 'UPDATE', JSON.stringify(data), 1, generateSimpleHash(data)]);
    auditStmt.free();
    stmt.free();

    logger.info('BankAccounts', 'update_success', 'Cuenta bancaria actualizada', { id });
    await forceSaveDB();

    return { success: true, message: 'Cuenta bancaria actualizada correctamente' };
  } catch (error) {
    logger.error('BankAccounts', 'update_failed', 'Error al actualizar cuenta bancaria', { id }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export function deleteBankAccount(id: number): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    const account = getBankAccountById(id);
    if (!account) return { success: false, message: 'Cuenta no encontrada' };

    const hasBalance = account.balance !== 0;
    const txCount = getBankAccountTransactionCount(id);

    if (txCount === 0 && !hasBalance) {
      const stmt = db.prepare("DELETE FROM bank_accounts WHERE id = ?");
      stmt.run([id]);
      stmt.free();
    } else {
      const stmt = db.prepare("UPDATE bank_accounts SET is_active = 0 WHERE id = ?");
      stmt.run([id]);
      stmt.free();
    }

    const auditStmt = db.prepare(`
      INSERT INTO audit_log(table_name, record_id, action, old_values, user_id, audit_hash)
      VALUES(?, ?, ?, ?, ?, ?)
    `);
    auditStmt.run(['bank_accounts', id, 'DELETE', JSON.stringify(account), 1, generateSimpleHash(account)]);
    auditStmt.free();

    logger.info('BankAccounts', 'delete_success', 'Cuenta bancaria desactivada/eliminada', { id });
    setTimeout(() => saveDatabase(), 1000);

    return {
      success: true,
      message: hasBalance
        ? 'Cuenta desactivada (tenía saldo activo — no se puede eliminar definitivamente)'
        : 'Cuenta bancaria eliminada correctamente'
    };
  } catch (error) {
    logger.error('BankAccounts', 'delete_failed', 'Error al eliminar cuenta bancaria', { id }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
