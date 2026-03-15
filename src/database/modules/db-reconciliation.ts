/**
 * Módulo 20 — Bank Reconciliation
 * Extraído de simple-db.ts líneas 10769–11049
 */

import { db } from '../simple-db';
import { saveDatabase, rowToEntity } from '../simple-db';
import type { ReconciliationStatement, ReconciliationMatch, BankTransaction, JournalEntry } from './db-types';

export function getReconciliationStatements(accountId?: number): ReconciliationStatement[] {
  if (!db) return [];
  try {
    let query = "SELECT * FROM reconciliation_statements";
    const params: any[] = [];

    if (accountId) {
      query += " WHERE bank_account_id = ?";
      params.push(accountId);
    }

    query += " ORDER BY statement_date DESC";

    const res = db.exec(query, params);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) =>
      rowToEntity<ReconciliationStatement>((res[0].columns || (res[0] as any).lc), row)
    );
  } catch (e) {
    console.error('Error fetching reconciliation statements:', e);
    return [];
  }
}

export function getLastReconciliationStatement(accountId: number): ReconciliationStatement | null {
  const statements = getReconciliationStatements(accountId);
  return statements.length > 0 ? statements[0] : null;
}

export function createReconciliationStatement(
  data: Omit<ReconciliationStatement, 'id' | 'created_at' | 'difference'>
): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const stmt = db.prepare(`
      INSERT INTO reconciliation_statements (bank_account_id, statement_date, statement_balance, system_balance, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      data.bank_account_id,
      data.statement_date,
      data.statement_balance,
      data.system_balance,
      data.status || 'pending',
      data.notes || null
    ]);

    const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: 'Estado de conciliación creado', id };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export function getUnreconciledTransactions(accountId: number): BankTransaction[] {
  if (!db) return [];
  try {
    const res = db.exec(`
      SELECT bt.* FROM bank_transactions bt
      LEFT JOIN reconciliation_matches rm ON bt.id = rm.bank_transaction_id
      WHERE bt.bank_account_id = ? AND rm.id IS NULL AND bt.status = 'pending'
      ORDER BY bt.transaction_date DESC
    `, [accountId]);

    if (res.length === 0) return [];
    return res[0].values.map((row: any) =>
      rowToEntity<BankTransaction>((res[0].columns || (res[0] as any).lc), row)
    );
  } catch (e) {
    console.error('Error fetching unreconciled transactions:', e);
    return [];
  }
}

export function findSimilarJournalEntries(transaction: BankTransaction): JournalEntry[] {
  if (!db) return [];
  try {
    const res = db.exec(`
      SELECT je.* FROM journal_entries je
      WHERE ABS(je.total_debit - ?) < 0.01
        AND ABS(JULIANDAY(je.entry_date) - JULIANDAY(?)) <= 3
        AND je.id NOT IN (
          SELECT COALESCE(rm.journal_entry_id, 0) FROM reconciliation_matches rm WHERE rm.journal_entry_id IS NOT NULL
        )
      ORDER BY ABS(JULIANDAY(je.entry_date) - JULIANDAY(?)) ASC
      LIMIT 5
    `, [Math.abs(transaction.amount), transaction.transaction_date, transaction.transaction_date]);

    if (res.length === 0) return [];
    return res[0].values.map((row: any) =>
      rowToEntity<JournalEntry>((res[0].columns || (res[0] as any).lc), row)
    );
  } catch (e) {
    console.error('Error finding similar journal entries:', e);
    return [];
  }
}

export function createReconciliationMatch(
  data: Omit<ReconciliationMatch, 'id' | 'matched_at'>
): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare(`
      INSERT INTO reconciliation_matches (statement_id, bank_transaction_id, journal_entry_id, match_confidence, match_type, matched_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      data.statement_id,
      data.bank_transaction_id,
      data.journal_entry_id || null,
      data.match_confidence,
      data.match_type || 'manual',
      data.matched_by || null,
      data.notes || null
    ]);

    const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();

    db.run("UPDATE bank_transactions SET status = 'matched' WHERE id = ?", [data.bank_transaction_id]);
    db.run("COMMIT");

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: 'Match de conciliación creado', id };
  } catch (e: any) {
    db.run("ROLLBACK");
    return { success: false, message: e.message };
  }
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  let matches = 0;
  for (const word1 of words1) {
    if (word1.length > 2 && words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      matches++;
    }
  }
  return matches / Math.max(words1.length, words2.length);
}

function calculateMatchConfidence(transaction: BankTransaction, entry: JournalEntry): number {
  let confidence = 0;

  if (Math.abs(Math.abs(transaction.amount) - entry.total_debit) < 0.01) {
    confidence += 0.4;
  }

  const daysDiff = Math.abs(
    new Date(transaction.transaction_date).getTime() - new Date(entry.entry_date).getTime()
  ) / (1000 * 60 * 60 * 24);

  if (daysDiff <= 3) {
    confidence += 0.3 * (1 - daysDiff / 3);
  }

  if (transaction.description && entry.description) {
    const similarity = calculateStringSimilarity(
      transaction.description.toLowerCase(),
      entry.description.toLowerCase()
    );
    confidence += 0.2 * similarity;
  }

  if (transaction.reference_number && entry.reference_number &&
      transaction.reference_number === entry.reference_number) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

export function autoMatchTransactions(statementId: number): { success: boolean; message: string; matchesFound: number } {
  if (!db) return { success: false, message: 'Database not initialized', matchesFound: 0 };

  try {
    const statementRes = db.exec("SELECT * FROM reconciliation_statements WHERE id = ?", [statementId]);
    if (statementRes.length === 0) {
      return { success: false, message: 'Statement no encontrado', matchesFound: 0 };
    }

    const statement = rowToEntity<ReconciliationStatement>(
      (statementRes[0].columns || (statementRes[0] as any).lc),
      statementRes[0].values[0]
    );

    const transactions = getUnreconciledTransactions(statement.bank_account_id);
    let matchesFound = 0;

    for (const transaction of transactions) {
      const similarEntries = findSimilarJournalEntries(transaction);

      if (similarEntries.length > 0) {
        const bestMatch = similarEntries[0];
        const confidence = calculateMatchConfidence(transaction, bestMatch);

        if (confidence >= 0.8) {
          const result = createReconciliationMatch({
            statement_id: statementId,
            bank_transaction_id: transaction.id,
            journal_entry_id: bestMatch.id,
            match_confidence: confidence,
            match_type: 'automatic',
            matched_by: undefined
          });

          if (result.success) matchesFound++;
        }
      }
    }

    return { success: true, message: `${matchesFound} matches automáticos creados`, matchesFound };
  } catch (e: any) {
    return { success: false, message: e.message, matchesFound: 0 };
  }
}

export function getInventoryMovements(): any[] {
  if (!db) return [];
  try {
    const result = db.exec(`
      SELECT m.*, p.name as product_name, p.sku as product_sku
      FROM inventory_movements m
      JOIN products p ON m.product_id = p.id
      ORDER BY m.date DESC
    `);

    if (result.length === 0 || result[0].values.length === 0) return [];

    const columns = (result[0].columns || (result[0] as any).lc);
    return result[0].values.map((row: any) => {
      const obj: any = {};
      columns.forEach((col: any, index: any) => { obj[col] = row[index]; });
      return obj;
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return [];
  }
}
