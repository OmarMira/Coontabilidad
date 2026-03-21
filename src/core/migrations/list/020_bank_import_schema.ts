import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 020 — Bank Import Schema (Defensive)
 *
 * Crea las tablas del sistema de importación bancaria que nunca fueron
 * incluidas en el ciclo de migraciones (sólo existían en DatabaseService.ensureFiscalTables).
 * También asegura que bank_transactions tenga la columna import_hash
 * (que la migración 017 debía agregar pero que en algunas DBs no se ejecutó).
 *
 * Todas las operaciones son CREATE TABLE IF NOT EXISTS / ALTER TABLE
 * para ser completamente idempotentes.
 */
export const BankImportSchemaMigration: Migration = {
    version: 20,
    name: 'Bank Import Schema — import_batches, import_transactions_temp, ml tables, import_hash',

    up: async (db: SQLiteEngine) => {

        // ── 1. import_batches ────────────────────────────────────────────────────
        await db.exec(`
      CREATE TABLE IF NOT EXISTS import_batches (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_number    TEXT    UNIQUE NOT NULL,
        file_name       TEXT    NOT NULL,
        file_format     TEXT    NOT NULL,
        bank_account_id INTEGER,
        total_transactions INTEGER NOT NULL,
        imported_count  INTEGER DEFAULT 0,
        duplicate_count INTEGER DEFAULT 0,
        status          TEXT    NOT NULL
                          CHECK(status IN ('pending','completed','rolled_back')),
        created_by      INTEGER NOT NULL,
        created_at      TEXT    DEFAULT (datetime('now')),
        imported_at     TEXT,
        rolled_back_at  TEXT
      )
    `);
        await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_import_batch_status
        ON import_batches(status)
    `);
        await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_import_batch_account
        ON import_batches(bank_account_id)
    `);

        // ── 2. import_transactions_temp ──────────────────────────────────────────
        await db.exec(`
      CREATE TABLE IF NOT EXISTS import_transactions_temp (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id            INTEGER NOT NULL REFERENCES import_batches(id),
        transaction_date    TEXT    NOT NULL,
        description         TEXT    NOT NULL,
        amount              REAL    NOT NULL,
        balance             REAL,
        suggested_category  TEXT,
        confidence_score    REAL,
        is_duplicate        INTEGER DEFAULT 0,
        duplicate_confidence REAL,
        matched_invoice_id  INTEGER,
        matched_bill_id     INTEGER,
        match_confidence    REAL,
        excluded            INTEGER DEFAULT 0,
        user_category       TEXT,
        user_description    TEXT,
        created_at          TEXT    DEFAULT (datetime('now'))
      )
    `);
        await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_import_temp_batch
        ON import_transactions_temp(batch_id)
    `);

        // ── 3. ml_training_data ──────────────────────────────────────────────────
        await db.exec(`
      CREATE TABLE IF NOT EXISTS ml_training_data (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        description      TEXT    NOT NULL,
        category         TEXT    NOT NULL,
        amount           REAL,
        transaction_type TEXT,
        source           TEXT    NOT NULL,
        created_at       TEXT    DEFAULT (datetime('now'))
      )
    `);
        await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_ml_training_category
        ON ml_training_data(category)
    `);

        // ── 4. ml_metrics ────────────────────────────────────────────────────────
        await db.exec(`
      CREATE TABLE IF NOT EXISTS ml_metrics (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_date         TEXT    NOT NULL,
        total_predictions   INTEGER NOT NULL,
        correct_predictions INTEGER NOT NULL,
        accuracy            REAL    NOT NULL,
        precision_score     REAL,
        recall_score        REAL,
        training_examples   INTEGER NOT NULL,
        created_at          TEXT    DEFAULT (datetime('now'))
      )
    `);

        // ── 5. import_hash en bank_transactions (idempotente) ────────────────────
        // La migración 017 debía agregar esta columna pero en algunas DBs
        // se registró con otro nombre. Lo aplicamos defensivamente.
        try {
            await db.exec(`
        ALTER TABLE bank_transactions ADD COLUMN import_hash TEXT DEFAULT NULL
      `);
        } catch {
            // Column already exists — safe to ignore
        }

        try {
            await db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_import_hash
          ON bank_transactions(import_hash)
          WHERE import_hash IS NOT NULL
      `);
        } catch {
            // Index already exists — safe to ignore
        }

        console.log('✅ Migration 020: Bank import schema created defensively.');
    },

    down: async (db: SQLiteEngine) => {
        await db.exec(`DROP INDEX IF EXISTS idx_bank_transactions_import_hash`);
        await db.exec(`DROP INDEX IF EXISTS idx_ml_training_category`);
        await db.exec(`DROP INDEX IF EXISTS idx_import_temp_batch`);
        await db.exec(`DROP INDEX IF EXISTS idx_import_batch_status`);
        await db.exec(`DROP INDEX IF EXISTS idx_import_batch_account`);
        await db.exec(`DROP TABLE IF EXISTS ml_metrics`);
        await db.exec(`DROP TABLE IF EXISTS ml_training_data`);
        await db.exec(`DROP TABLE IF EXISTS import_transactions_temp`);
        await db.exec(`DROP TABLE IF EXISTS import_batches`);
    }
};
