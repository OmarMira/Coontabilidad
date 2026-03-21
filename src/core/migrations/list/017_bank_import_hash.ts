import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 017 — Deduplicación de importaciones bancarias
 * Agrega columna `import_hash` (TEXT UNIQUE) a bank_transactions.
 * NULL permitido para registros anteriores sin hash.
 */
export const BankImportHashMigration: Migration = {
  version: 17,
  name: 'Bank Import Deduplication Hash',
  up: async (db: SQLiteEngine) => {
    // 0. Crear tabla si no existe (para DB vacía)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS bank_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_account_id INTEGER,
            date TEXT,
            description TEXT,
            amount REAL,
            type TEXT,
            balance REAL,
            reference TEXT,
            import_hash TEXT DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    // 1. Agregar columna (idempotente)
    try {
      await db.exec(`ALTER TABLE bank_transactions ADD COLUMN import_hash TEXT DEFAULT NULL`);
    } catch (e) {
      console.log('Column import_hash might already exist');
    }

    // 2. Crear índice único
    await db.exec(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_transactions_import_hash 
            ON bank_transactions(import_hash) 
            WHERE import_hash IS NOT NULL
        `);

    console.log('✅ Migration 017: Bank import hash column and index created.');
  },
  down: async (db: SQLiteEngine) => {
    // Nota: SQLite no soporta DROP COLUMN fácilmente en versiones viejas, 
    // pero podemos quitar el índice.
    await db.exec(`DROP INDEX IF EXISTS idx_bank_transactions_import_hash`);
  }
};
