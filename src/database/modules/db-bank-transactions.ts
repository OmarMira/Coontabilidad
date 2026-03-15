/**
 * Módulo 22 — Bank Transactions e Import
 * Extraído de simple-db.ts líneas 11276–11543
 */

import { db } from '../simple-db';
import { saveDatabase, rowToEntity, generateSimpleHash } from '../simple-db';
import { logger } from '../../core/logging/SystemLogger';
import type { BankTransaction, JournalEntry } from './db-types';

export interface MatchCandidate {
  entry: JournalEntry;
  confidence: number;
  matchType: 'exact' | 'fuzzy_date' | 'amount_only';
  reason: string;
}

export const insertBankTransactions = (
  transactions: Partial<BankTransaction>[]
): { success: boolean; message: string; importedCount: number } => {
  if (!db) return { success: false, message: 'Database not initialized', importedCount: 0 };

  let importedCount = 0;
  db.run('BEGIN TRANSACTION');

  try {
    for (const txn of transactions) {
      if (!txn.bank_account_id) throw new Error('Bank Account ID requerido');
      if (!txn.transaction_date) throw new Error('Fecha requerida');
      if (txn.amount === undefined || txn.amount === null) throw new Error('Monto requerido');
      if (!txn.description) txn.description = 'Transacción genérica';

      if (txn.fit_id) {
        const check = db.exec(`SELECT 1 FROM bank_transactions WHERE fit_id = '${txn.fit_id}'`);
        if (check.length > 0 && check[0].values.length > 0) continue;
      }

      const stmt = db.prepare(`
        INSERT INTO bank_transactions(
          bank_account_id, transaction_date, description, amount, reference,
          status, fit_id, category
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        txn.bank_account_id,
        txn.transaction_date,
        txn.description,
        txn.amount,
        txn.reference_number || txn.reference || null,
        'pending',
        txn.fit_id || null,
        txn.category || null
      ]);

      stmt.free();
      importedCount++;
    }

    db.run('COMMIT');
    logger.info('Database', 'bank_import_success', `Importadas ${importedCount} transacciones`, { importedCount });
    return { success: true, message: 'Importación exitosa', importedCount };

  } catch (error) {
    db.run('ROLLBACK');
    logger.error('Database', 'bank_import_failed', 'Error importando transacciones', null, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error al importar transacciones', importedCount: 0 };
  }
};

export const getBankTransactions = (
  accountId: number,
  status?: 'pending' | 'matched' | 'unmatched' | 'excluded'
): BankTransaction[] => {
  if (!db) return [];

  let query = `SELECT * FROM bank_transactions WHERE bank_account_id = ${accountId}`;
  if (status) query += ` AND status = '${status}'`;
  query += ` ORDER BY transaction_date DESC`;

  const result = db.exec(query);
  if (!result.length || !result[0].values.length) return [];

  const columns = (result[0].columns || (result[0] as any).lc);
  return result[0].values.map((row: any) => rowToEntity<BankTransaction>(columns, row));
};

export const findPotentialMatches = (transaction: BankTransaction): MatchCandidate[] => {
  if (!db) return [];

  const targetAmount = Math.abs(transaction.amount);
  const txnDate = new Date(transaction.transaction_date);
  const tolerance = 0.01;
  const dateMargin = 7 * 24 * 60 * 60 * 1000;
  const minDate = new Date(txnDate.getTime() - dateMargin);
  const maxDate = new Date(txnDate.getTime() + dateMargin);

  try {
    const minDateStr = minDate.toISOString().split('T')[0];
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const query = `
      SELECT * FROM journal_entries
      WHERE ABS(total_debit - ${targetAmount}) < ${tolerance}
        AND entry_date BETWEEN '${minDateStr}' AND '${maxDateStr}'
      ORDER BY entry_date ASC
    `;

    const result = db.exec(query);
    if (!result.length || !result[0].values.length) return [];

    const columns = (result[0].columns || (result[0] as any).lc);
    const entries = result[0].values.map((row: any) => rowToEntity<JournalEntry>(columns, row));
    const candidates: MatchCandidate[] = [];

    for (const entry of entries) {
      const entryDate = new Date(entry.entry_date);
      const diffTime = Math.abs(txnDate.getTime() - entryDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let confidence = 0;
      let matchType: 'exact' | 'fuzzy_date' | 'amount_only' = 'amount_only';
      let reason = '';

      if (diffDays === 0) {
        confidence = 1.0; matchType = 'exact'; reason = 'Monto exacto y fecha exacta (100%)';
      } else if (diffDays <= 1) {
        confidence = 0.95; matchType = 'fuzzy_date'; reason = 'Monto exacto, diferencia de 1 día';
      } else if (diffDays <= 3) {
        confidence = 0.80; matchType = 'fuzzy_date'; reason = `Monto exacto, diferencia de ${diffDays} días`;
      } else {
        confidence = 0.50; matchType = 'amount_only'; reason = `Monto coincide, fecha distante (${diffDays} días)`;
      }

      candidates.push({ entry, confidence, matchType, reason });
    }

    return candidates.sort((a, b) => b.confidence - a.confidence);

  } catch (error) {
    logger.error('Database', 'find_matches_failed', 'Error finding matches', { txId: transaction.id }, error as Error);
    return [];
  }
};

export const confirmMatch = (
  bankTransactionId: number,
  journalEntryId: number
): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    const txCheck = db.exec(`SELECT status, amount FROM bank_transactions WHERE id = ${bankTransactionId}`);
    if (!txCheck[0] || !txCheck[0].values.length) throw new Error('Transacción bancaria no encontrada');

    const currentStatus = txCheck[0].values[0][0];
    if (currentStatus === 'matched') throw new Error('La transacción ya está conciliada');

    db.run(`
      UPDATE bank_transactions
      SET status = 'matched', matched_journal_entry_id = ?, match_confidence = 1.0
      WHERE id = ?
    `, [journalEntryId, bankTransactionId]);

    const timestamp = new Date().toISOString();
    const auditData = { bankTransactionId, journalEntryId, timestamp };
    const auditHash = generateSimpleHash(auditData);

    db.run(`
      INSERT INTO audit_chain(table_name, record_id, action, old_value, new_value, user_id, timestamp, current_hash)
      VALUES('bank_transactions', ?, 'MATCH', 'pending', 'matched', 1, ?, ?)
    `, [bankTransactionId, timestamp, auditHash]);

    db.run('COMMIT');
    return { success: true, message: 'Conciliación confirmada correctamente' };

  } catch (error) {
    db.run('ROLLBACK');
    logger.error('Database', 'confirm_match_failed', 'Error matching transaction', { bankTransactionId, journalEntryId }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido al conciliar' };
  }
};

export const unmatchTransaction = (
  bankTransactionId: number
): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    const txCheck = db.exec(`SELECT matched_journal_entry_id FROM bank_transactions WHERE id = ${bankTransactionId}`);
    if (!txCheck[0] || !txCheck[0].values.length) throw new Error('Transacción no encontrada');

    const previousMatchId = txCheck[0].values[0][0];

    db.run(`
      UPDATE bank_transactions
      SET status = 'pending', matched_journal_entry_id = NULL, match_confidence = NULL
      WHERE id = ?
    `, [bankTransactionId]);

    const timestamp = new Date().toISOString();
    const auditData = { bankTransactionId, action: 'UNMATCH', previousMatchId, timestamp };
    const auditHash = generateSimpleHash(auditData);

    db.run(`
      INSERT INTO audit_chain(table_name, record_id, action, old_value, new_value, user_id, timestamp, current_hash)
      VALUES('bank_transactions', ?, 'UNMATCH', 'matched', 'pending', 1, ?, ?)
    `, [bankTransactionId, timestamp, auditHash]);

    db.run('COMMIT');
    return { success: true, message: 'Conciliación revertida correctamente' };

  } catch (error) {
    db.run('ROLLBACK');
    logger.error('Database', 'unmatch_failed', 'Error unmatching transaction', { bankTransactionId }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido al desconciliar' };
  }
};

export const restoreDatabaseFromBackup = async (data: Uint8Array): Promise<void> => {
  try {
    const opfsRootHandle = await (navigator.storage as any).getDirectory?.();
    if (opfsRootHandle) {
      const fileHandle = await opfsRootHandle.getFileHandle('accountexpress.db', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data as any);
      await writable.close();
      logger.info('Database', 'restore_success', 'Backup restaurado en OPFS');
    } else {
      logger.warn('Database', 'restore_warning', 'Restaurando en modo sin OPFS (experimental)');
    }
    window.location.reload();
  } catch (e) {
    logger.error('Database', 'restore_error', 'Fallo al restaurar backup', null, e as Error);
    throw e;
  }
};
