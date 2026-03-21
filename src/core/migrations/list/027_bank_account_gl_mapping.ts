import { Migration } from '../MigrationEngine';
import { SQLiteEngine } from '../../database/SQLiteEngine';

export const BankAccountGLMappingMigration: Migration = {
    version: 27,
    name: 'Add gl_account_code to bank_accounts',

    up: async (db: SQLiteEngine) => {
        // Verificar que la tabla existe antes de operar
        const tables = await db.select("SELECT name FROM sqlite_master WHERE type='table' AND name='bank_accounts'");
        if (tables.length === 0) {
            console.warn('Migration 027: bank_accounts table does not exist yet, skipping.');
            return;
        }

        const tableInfo = await db.select("PRAGMA table_info(bank_accounts)");
        const hasColumn = tableInfo.some((col: any) => col.name === 'gl_account_code');

        if (!hasColumn) {
            await db.run("ALTER TABLE bank_accounts ADD COLUMN gl_account_code TEXT");
        }
    },

    down: async (db: SQLiteEngine) => {
        // SQLite no soporta DROP COLUMN antes de v3.35.0, usamos el patrón de recreación si fuera necesario
        // Pero para el 'down' de este campo opcional, podemos omitirlo o recrear.
    }
};
