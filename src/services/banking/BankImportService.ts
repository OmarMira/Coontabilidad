/**
 * BankImportService - Orquestador principal de importación bancaria
 */

import { dbRun, dbExec } from '@/database/modules/db-core';
import { FileParserService, ParsedTransaction } from './FileParserService';
import { DuplicateDetector, ExistingTransaction } from './DuplicateDetector';
import { AICategorizerService, TrainingExample } from './AICategorizerService';
import { TransactionMatcher, Invoice, Bill } from './TransactionMatcher';
import { DatabaseService } from '../../database/DatabaseService';
import { generateTransactionHash } from './BankingUtils';
import { ClassificationRulesService } from './ClassificationRulesService';
import { TRANSACTION_STATES } from '../../constants/bankingStates';

export interface ImportBatch {
  id: number;
  batchNumber: string;
  fileName: string;
  fileFormat: string;
  totalTransactions: number;
  importedCount: number;
  duplicateCount: number;
  status: 'pending' | 'completed' | 'rolled_back';
  createdAt: string;
}

export interface ImportTransaction {
  id: number;
  batchId: number;
  transactionDate: string;
  description: string;
  amount: number;
  balance?: number;
  suggestedCategory: string;
  confidenceScore: number;
  isDuplicate: boolean;
  duplicateConfidence: number;
  matchedInvoiceId?: number;
  matchedBillId?: number;
  matchConfidence?: number;
  excluded: boolean;
  userCategory?: string;
  userDescription?: string;
}

export class BankImportService {
  private categorizer: AICategorizerService;

  constructor() {
    this.categorizer = new AICategorizerService();
    this.loadTrainingData();
  }

  private async loadTrainingData(): Promise<void> {
    try {
      const trainingData = dbExec(`
        SELECT description, category, amount, transaction_type
        FROM ml_training_data
        ORDER BY created_at DESC
        LIMIT 1000
      `);

      if (trainingData && trainingData.length > 0 && trainingData[0].values.length > 0) {
        const examples: TrainingExample[] = trainingData[0].values.map((row: any) => ({
          description: row[0],
          category: row[1],
          amount: row[2],
          transactionType: row[3]
        }));

        this.categorizer.train(examples);
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    }
  }

  async createImportBatch(
    file: File,
    bankAccountId: number,
    userId: number
  ): Promise<{ batchId: number; transactions: ImportTransaction[]; detectedAccountNumber?: string }> {

    const parseResult = await FileParserService.parseFile(file);

    if (parseResult.errors.length > 0) {
      throw new Error(`Errores al parsear archivo: ${parseResult.errors.join(', ')}`);
    }

    if (parseResult.transactions.length === 0) {
      throw new Error('No se encontraron transacciones en el archivo');
    }

    const batch_number = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    dbRun(`
      INSERT INTO import_batches (
        batch_number, file_name, file_format, bank_account_id,
        total_transactions, status, created_by
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `, [
      batch_number,
      file.name,
      parseResult.format,
      bankAccountId,
      parseResult.transactions.length,
      userId
    ]);

    const batchIdResult = dbExec('SELECT last_insert_rowid() as id');
    const batchId = batchIdResult && batchIdResult.length > 0 ? (batchIdResult[0].values[0][0] as number) : 0;

    const existingTxns = await this.getExistingTransactions();
    const unpaidInvoices = await this.getUnpaidInvoices();
    const unpaidBills = await this.getUnpaidBills();

    const importTransactions: ImportTransaction[] = [];

    for (const txn of parseResult.transactions) {
      const duplicateResult = await DuplicateDetector.detectDuplicate(txn, existingTxns);
      const categorizationResult = this.categorizer.categorize(txn);
      const matchResult = await TransactionMatcher.matchTransaction(txn, unpaidInvoices, unpaidBills);

      dbRun(`
        INSERT INTO import_transactions_temp (
          batch_id, transaction_date, description, amount, balance,
          suggested_category, confidence_score,
          is_duplicate, duplicate_confidence,
          matched_invoice_id, matched_bill_id, match_confidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        batchId,
        txn.date,
        txn.description,
        txn.amount,
        txn.balance || null,
        categorizationResult.category,
        categorizationResult.confidence,
        duplicateResult.isDuplicate ? 1 : 0,
        duplicateResult.confidence,
        matchResult.matchType === 'invoice' ? matchResult.matchedId : null,
        matchResult.matchType === 'bill' ? matchResult.matchedId : null,
        matchResult.confidence || null
      ]);

      const txnIdResult = dbExec('SELECT last_insert_rowid() as id');
      const txnId = txnIdResult && txnIdResult.length > 0 ? (txnIdResult[0].values[0][0] as number) : 0;

      importTransactions.push({
        id: txnId,
        batchId,
        transactionDate: txn.date,
        description: txn.description,
        amount: txn.amount,
        balance: txn.balance,
        suggestedCategory: categorizationResult.category,
        confidenceScore: categorizationResult.confidence,
        isDuplicate: duplicateResult.isDuplicate,
        duplicateConfidence: duplicateResult.confidence,
        matchedInvoiceId: matchResult.matchType === 'invoice' ? matchResult.matchedId || undefined : undefined,
        matchedBillId: matchResult.matchType === 'bill' ? matchResult.matchedId || undefined : undefined,
        matchConfidence: matchResult.confidence,
        excluded: false
      });
    }

    return { batchId, transactions: importTransactions, detectedAccountNumber: parseResult.accountNumber };
  }

  async updateImportTransaction(
    transactionId: number,
    updates: {
      userCategory?: string;
      userDescription?: string;
      excluded?: boolean;
    }
  ): Promise<void> {
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.userCategory !== undefined) {
      setClauses.push('user_category = ?');
      values.push(updates.userCategory);
    }

    if (updates.userDescription !== undefined) {
      setClauses.push('user_description = ?');
      values.push(updates.userDescription);
    }

    if (updates.excluded !== undefined) {
      setClauses.push('excluded = ?');
      values.push(updates.excluded ? 1 : 0);
    }

    if (setClauses.length === 0) return;
    values.push(transactionId);

    dbRun(`
      UPDATE import_transactions_temp
      SET ${setClauses.join(', ')}
      WHERE id = ?
    `, values);
  }

  async finalizeImport(batchId: number, userId: number, bankAccountId: number): Promise<{ imported: number, skipped: number }> {
    if (!bankAccountId || bankAccountId <= 0) {
      throw new Error('Seleccioná una cuenta bancaria antes de importar');
    }

    try {
      dbRun('BEGIN TRANSACTION');

      const txnsResult = dbExec(`
        SELECT * FROM import_transactions_temp
        WHERE batch_id = ? AND excluded = 0
      `, [batchId]);

      if (!txnsResult || txnsResult.length === 0 || txnsResult[0].values.length === 0) {
        dbRun('ROLLBACK');
        throw new Error('No hay transacciones para importar');
      }

      const columns = txnsResult[0].columns;
      const transactions = txnsResult[0].values.map((row: any) => {
        const obj: any = {};
        columns.forEach((col: any, idx: any) => { obj[col] = row[idx]; });
        return obj;
      });

      let importedCount = 0;
      let skippedCount = 0;

      for (const txn of transactions) {
        const hash = await generateTransactionHash(txn.transaction_date, txn.amount, txn.description, bankAccountId);

        dbRun(`
          INSERT INTO bank_transactions (
            bank_account_id, transaction_date, description, amount, status, import_hash, import_batch_id
          ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
          ON CONFLICT(import_hash) WHERE import_hash IS NOT NULL DO UPDATE SET
            import_batch_id = excluded.import_batch_id
        `, [
          bankAccountId, txn.transaction_date, txn.description, txn.amount, hash, batchId.toString()
        ]);

        const rowsAffected = dbExec('SELECT changes() as changes')[0].values[0][0] as number;
        if (rowsAffected === 0) {
          skippedCount++;
          continue;
        }

        const idResult = dbExec('SELECT id FROM bank_transactions WHERE import_hash = ?', [hash]);
        const bankTxnId = idResult[0].values[0][0] as number;

        const autoAccount = await ClassificationRulesService.evaluateTransaction(txn.description);
        const isAutoClassified = !!autoAccount;

        // UPSERT manual for transaction_states
        dbRun(`
          UPDATE transaction_states SET
            current_state = ?,
            is_verified = ?,
            auto_classified = ?,
            assigned_account_code = ?,
            assigned_account_name = ?,
            verified_at = ?,
            verified_by = ?
          WHERE transaction_id = ?
        `, [
          isAutoClassified ? TRANSACTION_STATES.VERIFIED : TRANSACTION_STATES.IMPORTED,
          isAutoClassified ? 1 : 0,
          isAutoClassified ? 1 : 0,
          autoAccount ? autoAccount.account_code : null,
          autoAccount ? autoAccount.account_name : null,
          isAutoClassified ? new Date().toISOString() : null,
          isAutoClassified ? userId : null,
          bankTxnId
        ]);

        const tsAffected = dbExec('SELECT changes() as changes')[0].values[0][0] as number;
        if (tsAffected === 0) {
          dbRun(`
            INSERT INTO transaction_states (
              transaction_id, current_state, is_verified, 
              auto_classified, assigned_account_code, assigned_account_name,
              verified_at, verified_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            bankTxnId,
            isAutoClassified ? TRANSACTION_STATES.VERIFIED : TRANSACTION_STATES.IMPORTED,
            isAutoClassified ? 1 : 0,
            isAutoClassified ? 1 : 0,
            autoAccount ? autoAccount.account_code : null,
            autoAccount ? autoAccount.account_name : null,
            isAutoClassified ? new Date().toISOString() : null,
            isAutoClassified ? userId : null
          ]);
        }

        importedCount++;
      }

      dbRun(`
        UPDATE import_batches
        SET status = 'pending', imported_count = ?, imported_at = datetime('now')
        WHERE id = ?
      `, [importedCount, batchId]);

      dbRun('DELETE FROM import_transactions_temp WHERE batch_id = ?', [batchId]);

      dbRun('COMMIT');
      return { imported: importedCount, skipped: skippedCount };

    } catch (error) {
      dbRun('ROLLBACK');
      throw error;
    }
  }

  private async getExistingTransactions(): Promise<ExistingTransaction[]> {
    return [];
  }

  private async getUnpaidInvoices(): Promise<Invoice[]> {
    try {
      const result = dbExec(`
        SELECT id, invoice_number, total, date, customer_name
        FROM invoices
        WHERE status = 'unpaid'
        ORDER BY date DESC
        LIMIT 100
      `);
      if (!result || result.length === 0 || result[0].values.length === 0) return [];
      return result[0].values.map((row: any) => ({
        id: row[0], invoice_number: row[1], total: row[2], date: row[3], customer_name: row[4]
      }));
    } catch (error) {
      return [];
    }
  }

  private async getUnpaidBills(): Promise<Bill[]> {
    return [];
  }

  async getImportHistory(): Promise<ImportBatch[]> {
    try {
      const result = dbExec(`
        SELECT id, batch_number, file_name, file_format,
               total_transactions, imported_count, duplicate_count,
               status, created_at
        FROM import_batches
        ORDER BY created_at DESC
        LIMIT 50
      `);
      if (!result || result.length === 0 || result[0].values.length === 0) return [];
      return result[0].values.map((row: any) => ({
        id: row[0], batchNumber: row[1], fileName: row[2], fileFormat: row[3],
        totalTransactions: row[4], importedCount: row[5], duplicateCount: row[6],
        status: row[7], createdAt: row[8]
      }));
    } catch (error) {
      return [];
    }
  }

  async getBatchTransactions(batchId: number): Promise<any[]> {
    try {
      const result = dbExec(`
        SELECT bt.*, ts.assigned_account_code, ts.assigned_account_name
        FROM bank_transactions bt
        LEFT JOIN transaction_states ts ON bt.id = ts.transaction_id
        WHERE bt.import_batch_id = ?
        ORDER BY bt.transaction_date ASC
      `, [batchId.toString()]);

      if (!result || result.length === 0 || result[0].values.length === 0) return [];

      const columns = result[0].columns;
      return result[0].values.map((row: any) => {
        const obj: any = {};
        columns.forEach((col: any, idx: any) => { obj[col] = row[idx]; });
        return obj;
      });
    } catch (error) {
      return [];
    }
  }

  async classifyAndFinalizeBatch(batchId: number, userId: number, classifications: any[]): Promise<void> {
    try {
      const batchInfo = dbExec('SELECT bank_account_id FROM import_batches WHERE id = ?', [batchId]);
      if (!batchInfo || batchInfo.length === 0 || batchInfo[0].values.length === 0) throw new Error('Batch no encontrado');
      const bankAccountId = batchInfo[0].values[0][0] as number;

      const bankResult = dbExec('SELECT gl_account_code FROM bank_accounts WHERE id = ?', [bankAccountId]);
      const bankAccountCode = (bankResult && bankResult.length > 0 && bankResult[0].values.length > 0)
        ? bankResult[0].values[0][0] as string || '1112'
        : '1112';

      for (const cls of classifications) {
        if (cls.createRule && cls.accountCode) {
          await ClassificationRulesService.saveRule({
            pattern: cls.description,
            match_type: 'CONTAINS',
            account_code: cls.accountCode,
            account_name: cls.accountName,
            account_type: 'Expense',
            priority: 0,
            is_active: true
          }, userId);
        }

        const isExpense = cls.amount < 0;
        const absAmount = Math.abs(cls.amount);

        const entryNumber = await DatabaseService.insertJournalEntry({
          description: `BOS: ${cls.description} (BATCH ${batchId})`,
          date: cls.date,
          items: [
            {
              account_code: cls.accountCode,
              debit: isExpense ? absAmount : 0,
              credit: isExpense ? 0 : absAmount,
              description: cls.description
            },
            {
              account_code: bankAccountCode,
              debit: isExpense ? 0 : absAmount,
              credit: isExpense ? absAmount : 0,
              description: `Partida Balance (${cls.description})`
            }
          ],
          userId
        });

        const jeResult = dbExec('SELECT id FROM journal_entries WHERE entry_number = ?', [entryNumber]);
        if (jeResult && jeResult.length > 0 && jeResult[0].values.length > 0) {
          const jeId = jeResult[0].values[0][0];
          dbRun(`
            UPDATE bank_transactions 
            SET status = 'matched', matched_journal_entry_id = ? 
            WHERE id = ?
          `, [jeId, cls.id]);
        }
      }

      dbRun(`UPDATE import_batches SET status = 'completed', updated_at = datetime('now') WHERE id = ?`, [batchId]);

    } catch (error) {
      console.error('Finalization failure:', error);
      throw error;
    }
  }

  async rollbackImport(batchId: number): Promise<void> {
    try {
      dbRun('BEGIN TRANSACTION');
      const txnsResult = dbExec(`
        SELECT matched_journal_entry_id 
        FROM bank_transactions 
        WHERE import_batch_id = ? AND matched_journal_entry_id IS NOT NULL
      `, [batchId.toString()]);

      if (txnsResult && txnsResult.length > 0 && txnsResult[0].values.length > 0) {
        const jeIds = txnsResult[0].values.map((v: any) => v[0]);
        for (const jeId of jeIds) {
          dbRun('DELETE FROM journal_details WHERE journal_entry_id = ?', [jeId]);
          dbRun('DELETE FROM journal_entries WHERE id = ?', [jeId]);
        }
      }

      dbRun('DELETE FROM bank_transactions WHERE import_batch_id = ?', [batchId.toString()]);
      dbRun(`UPDATE import_batches SET status = 'rolled_back', rolled_back_at = datetime('now') WHERE id = ?`, [batchId]);
      dbRun('COMMIT');
    } catch (error) {
      dbRun('ROLLBACK');
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del historial de importación (Total de todas las tablas y Duplicados)
   */
  async getHistoryStats(): Promise<{ total: number; duplicates: number }> {
    // Sumamos transacciones de lotes pendientes + transacciones ya procesadas
    const totalResult = dbExec(`
      SELECT 
        (SELECT COALESCE(SUM(total_transactions), 0) FROM import_batches) + 
        (SELECT COUNT(*) FROM bank_transactions WHERE import_batch_id NOT IN (SELECT CAST(id AS TEXT) FROM import_batches))
    `);

    const total = (totalResult && totalResult.length > 0) ? (totalResult[0].values[0][0] as number) : 0;

    const dupResult = dbExec(`
      SELECT COUNT(*) FROM (
        SELECT import_hash FROM bank_transactions 
        WHERE import_hash IS NOT NULL 
        GROUP BY import_hash 
        HAVING COUNT(*) > 1
      )
    `);
    const duplicates = (dupResult && dupResult.length > 0) ? (dupResult[0].values[0][0] as number) : 0;

    return { total, duplicates };
  }

  /**
   * Limpia el historial completo de importaciones de forma definitiva
   */
  async clearImportHistory(): Promise<void> {
    dbRun('DELETE FROM transaction_states');
    dbRun('DELETE FROM bank_transactions');
    dbRun('DELETE FROM import_transactions_temp');
    dbRun('DELETE FROM import_batches');
    dbRun("UPDATE sqlite_sequence SET seq = 0 WHERE name IN ('bank_transactions', 'import_batches', 'import_transactions_temp', 'transaction_states')");
  }
}
