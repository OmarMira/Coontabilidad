/**
 * BankImportService - Orquestador principal de importación bancaria
 * 
 * Coordina el proceso completo de importación:
 * 1. Upload y validación
 * 2. Parsing
 * 3. Detección de duplicados
 * 4. Categorización con IA
 * 5. Matching con facturas/gastos
 * 6. Preview
 * 7. Importación final
 * 8. Rollback si es necesario
 */

import { db } from '../../database/simple-db';
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

  /**
   * Carga datos de entrenamiento desde la base de datos
   */
  private async loadTrainingData(): Promise<void> {
    try {
      const trainingData = db.exec(`
        SELECT description, category, amount, transaction_type
        FROM ml_training_data
        ORDER BY created_at DESC
        LIMIT 1000
      `);

      if (trainingData.length > 0 && trainingData[0].values.length > 0) {
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

  /**
   * Crea un nuevo batch de importación y genera preview
   */
  async createImportBatch(
    file: File,
    bankAccountId: number,
    userId: number
  ): Promise<{ batchId: number; transactions: ImportTransaction[] }> {

    // 1. Parse file
    const parseResult = await FileParserService.parseFile(file);

    if (parseResult.errors.length > 0) {
      throw new Error(`Errores al parsear archivo: ${parseResult.errors.join(', ')}`);
    }

    if (parseResult.transactions.length === 0) {
      throw new Error('No se encontraron transacciones en el archivo');
    }

    // 2. Create batch
    const batchNumber = `IMP-${Date.now()}`;

    db.run(`
      INSERT INTO import_batches (
        batch_number, file_name, file_format, bank_account_id,
        total_transactions, status, created_by
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `, [
      batchNumber,
      file.name,
      parseResult.format,
      bankAccountId,
      parseResult.transactions.length,
      userId
    ]);

    const batchIdResult = db.exec('SELECT last_insert_rowid() as id');
    const batchId = batchIdResult[0].values[0][0] as number;

    // 3. Get existing transactions for duplicate detection
    const existingTxns = await this.getExistingTransactions();

    // 4. Get unpaid invoices and bills for matching
    const unpaidInvoices = await this.getUnpaidInvoices();
    const unpaidBills = await this.getUnpaidBills();

    // 5. Process each transaction
    const importTransactions: ImportTransaction[] = [];

    for (const txn of parseResult.transactions) {
      // Detect duplicates
      const duplicateResult = await DuplicateDetector.detectDuplicate(txn, existingTxns);

      // Categorize with AI
      const categorizationResult = this.categorizer.categorize(txn);

      // Match with invoices/bills
      const matchResult = await TransactionMatcher.matchTransaction(
        txn,
        unpaidInvoices,
        unpaidBills
      );

      // Insert into temp table
      db.run(`
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

      const txnIdResult = db.exec('SELECT last_insert_rowid() as id');
      const txnId = txnIdResult[0].values[0][0] as number;

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

    return { batchId, transactions: importTransactions };
  }

  /**
   * Actualiza una transacción en el preview
   */
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

    db.run(`
      UPDATE import_transactions_temp
      SET ${setClauses.join(', ')}
      WHERE id = ?
    `, values);
  }

  /**
   * Importa las transacciones finales
   * Retorna { imported: number, skipped: number }
   */
  async finalizeImport(batchId: number, userId: number, bankAccountId: number): Promise<{ imported: number, skipped: number }> {
    // GUARD: bankAccountId es obligatorio. 0, null o undefined indican que el usuario
    // no seleccionó una cuenta — abortamos con error claro antes de tocar la DB.
    if (!bankAccountId || bankAccountId <= 0) {
      throw new Error('Seleccioná una cuenta bancaria antes de importar');
    }

    try {
      db.run('BEGIN TRANSACTION');

      // Get transactions to import (not excluded)
      const txnsResult = db.exec(`
        SELECT * FROM import_transactions_temp
        WHERE batch_id = ? AND excluded = 0
      `, [batchId]);

      if (txnsResult.length === 0 || txnsResult[0].values.length === 0) {
        throw new Error('No hay transacciones para importar');
      }

      const columns = txnsResult[0].columns;
      const transactions = txnsResult[0].values.map((row: any) => {
        const obj: any = {};
        columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });

      let importedCount = 0;
      let skippedCount = 0;

      for (const txn of transactions) {
        // Generar hash único para deduplicación
        const hash = await generateTransactionHash(
          txn.transaction_date,
          txn.amount,
          txn.description,
          bankAccountId
        );

        // NOTA ARQUITECTÓNICA: bank_transactions.status usa el vocabulario del schema original:
        //   CHECK(status IN ('pending', 'matched', 'ignored')) — definido en simple-db.ts L2419
        // El vocabulario TRANSACTION_STATES (IMPORTED, VERIFIED, etc.) pertenece a la tabla
        //   transaction_states (migration 016), que es donde se registra el workflow.
        // Son dos tablas distintas; no mezclar sus vocabolarios.
        db.run(`
          INSERT OR IGNORE INTO bank_transactions (
            bank_account_id, transaction_date, description, amount, status, import_hash
          ) VALUES (?, ?, ?, ?, 'pending', ?)
        `, [
          bankAccountId,
          txn.transaction_date,
          txn.description,
          txn.amount,
          hash
        ]);

        // Verificar si se insertó realmente
        const rowsAffected = db.exec('SELECT changes() as changes')[0].values[0][0] as number;

        if (rowsAffected === 0) {
          skippedCount++;
          continue;
        }

        // Obtener ID de la transacción recién insertada
        const txnIdResult = db.exec('SELECT last_insert_rowid() as id');
        const bankTxnId = txnIdResult[0].values[0][0] as number;

        // EVALUAR REGLAS DE CLASIFICACIÓN (Automatización Inteligente)
        const autoAccount = await ClassificationRulesService.evaluateTransaction(txn.description);

        // Determine final category (rule match > user override > suggested)
        const finalCategory = autoAccount ? autoAccount.account_code : (txn.user_category || txn.suggested_category);
        const finalDescription = txn.user_description || txn.description;
        const isAutoClassified = !!autoAccount;

        // Insertar en transaction_states
        db.run(`
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

        // Generate journal entry
        const debitAccount = txn.amount < 0 ? finalCategory : 'Bank Account';
        const creditAccount = txn.amount < 0 ? 'Bank Account' : finalCategory;
        const absAmount = Math.abs(txn.amount);

        await DatabaseService.insertJournalEntry({
          description: `Bank Import: ${finalDescription}`,
          date: txn.transaction_date,
          items: [
            {
              account_code: debitAccount,
              debit: txn.amount < 0 ? absAmount : 0,
              credit: 0,
              description: finalDescription
            },
            {
              account_code: creditAccount,
              debit: 0,
              credit: txn.amount < 0 ? 0 : absAmount,
              description: finalDescription
            }
          ],
          userId
        });

        // Save as training data if user corrected the category
        if (txn.user_category && txn.user_category !== txn.suggested_category) {
          db.run(`
            INSERT INTO ml_training_data (description, category, amount, transaction_type, source)
            VALUES (?, ?, ?, ?, 'user_correction')
          `, [
            txn.description,
            txn.user_category,
            txn.amount,
            txn.amount < 0 ? 'debit' : 'credit'
          ]);

          // Add to categorizer for immediate learning
          this.categorizer.addTrainingExample({
            description: txn.description,
            category: txn.user_category,
            amount: txn.amount,
            transactionType: txn.amount < 0 ? 'debit' : 'credit'
          });
        }

        importedCount++;
      }

      // Update batch status
      db.run(`
        UPDATE import_batches
        SET status = 'completed', imported_count = ?, imported_at = datetime('now')
        WHERE id = ?
      `, [importedCount, batchId]);

      // Clean up temp transactions
      db.run('DELETE FROM import_transactions_temp WHERE batch_id = ?', [batchId]);

      db.run('COMMIT');
      return { imported: importedCount, skipped: skippedCount };

    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Rollback de una importación
   */
  async rollbackImport(batchId: number): Promise<void> {
    try {
      db.run('BEGIN TRANSACTION');

      // Check if period is open
      // (This would need to check against accounting_periods table)

      // Delete journal entries created by this batch
      // Note: This would need to track which journal entries belong to which batch
      // For now, we'll just mark the batch as rolled back

      db.run(`
        UPDATE import_batches
        SET status = 'rolled_back', rolled_back_at = datetime('now')
        WHERE id = ?
      `, [batchId]);

      db.run('COMMIT');

    } catch (error) {
      db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * Obtiene transacciones existentes para detección de duplicados
   */
  private async getExistingTransactions(): Promise<ExistingTransaction[]> {
    try {
      // This would query your actual bank_transactions table
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting existing transactions:', error);
      return [];
    }
  }

  /**
   * Obtiene facturas no pagadas
   */
  private async getUnpaidInvoices(): Promise<Invoice[]> {
    try {
      const result = db.exec(`
        SELECT id, invoice_number, total, date, customer_name
        FROM invoices
        WHERE status = 'unpaid'
        ORDER BY date DESC
        LIMIT 100
      `);

      if (result.length === 0 || result[0].values.length === 0) {
        return [];
      }

      return result[0].values.map((row: any) => ({
        id: row[0],
        invoice_number: row[1],
        total: row[2],
        date: row[3],
        customer_name: row[4]
      }));
    } catch (error) {
      console.error('Error getting unpaid invoices:', error);
      return [];
    }
  }

  /**
   * Obtiene gastos no pagados
   */
  private async getUnpaidBills(): Promise<Bill[]> {
    try {
      // This would query your bills/expenses table
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting unpaid bills:', error);
      return [];
    }
  }

  /**
   * Obtiene el historial de importaciones
   */
  async getImportHistory(): Promise<ImportBatch[]> {
    try {
      const result = db.exec(`
        SELECT id, batch_number, file_name, file_format,
               total_transactions, imported_count, duplicate_count,
               status, created_at
        FROM import_batches
        ORDER BY created_at DESC
        LIMIT 50
      `);

      if (result.length === 0 || result[0].values.length === 0) {
        return [];
      }

      return result[0].values.map((row: any) => ({
        id: row[0],
        batchNumber: row[1],
        fileName: row[2],
        fileFormat: row[3],
        totalTransactions: row[4],
        importedCount: row[5],
        duplicateCount: row[6],
        status: row[7],
        createdAt: row[8]
      }));
    } catch (error) {
      console.error('Error getting import history:', error);
      return [];
    }
  }
}
