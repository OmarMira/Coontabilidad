import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 018 — Automatización de clasificación
 * 1. Tabla classification_rules para reglas determinísticas.
 * 2. Columnas auto_classified y assigned_account_* en transaction_states.
 */
export const ClassificationRulesMigration: Migration = {
    version: 18,
    name: 'Classification Rules and Auto-Classification support',
    up: async (db: SQLiteEngine) => {
        // 1. Tabla de reglas
        await db.exec(`
            CREATE TABLE IF NOT EXISTS classification_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern TEXT NOT NULL,
                match_type TEXT NOT NULL CHECK(match_type IN ('CONTAINS', 'STARTS_WITH', 'EXACT')),
                account_code TEXT NOT NULL,
                account_name TEXT NOT NULL,
                priority INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Extender transaction_states para soportar auto-clasificación
        try {
            await db.exec(`ALTER TABLE transaction_states ADD COLUMN auto_classified INTEGER DEFAULT 0`);
            await db.exec(`ALTER TABLE transaction_states ADD COLUMN assigned_account_code TEXT`);
            await db.exec(`ALTER TABLE transaction_states ADD COLUMN assigned_account_name TEXT`);
        } catch (e) {
            console.log('Columns might already exist in transaction_states');
        }

        console.log('✅ Migration 018: Classification rules table and state extensions created.');
    },
    down: async (db: SQLiteEngine) => {
        await db.exec(`DROP TABLE IF EXISTS classification_rules`);
    }
};
