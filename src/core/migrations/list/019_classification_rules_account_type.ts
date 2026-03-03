import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 019: Adds account_type column to classification_rules table.
 * Standardizes account metadata storage for auto-classification.
 */
export const ClassificationRulesAccountTypeMigration: Migration = {
    version: 19,
    name: 'Add account_type to classification_rules',
    up: async (db: SQLiteEngine) => {
        // Enforce default 'Expense' for backward compatibility
        await db.exec(`ALTER TABLE classification_rules ADD COLUMN account_type TEXT DEFAULT 'Expense'`);
    },
    down: async (db: SQLiteEngine) => {
        // SQLite doesn't support DROP COLUMN directly easily in old versions,
        // but for this project we'll assume standard migration flow.
    }
};
