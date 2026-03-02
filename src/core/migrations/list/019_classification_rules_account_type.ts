import { SQLiteEngine } from '../../database/SQLiteEngine';

/**
 * Migration 019: Adds account_type column to classification_rules table.
 * Standardizes account metadata storage for auto-classification.
 */
export const migration019 = {
    id: 19,
    name: 'Add account_type to classification_rules',
    up: async (db: any) => {
        // Enforce default 'Expense' for backward compatibility
        await db.exec(`ALTER TABLE classification_rules ADD COLUMN account_type TEXT DEFAULT 'Expense'`);
        return true;
    },
    down: async (db: any) => {
        // SQLite doesn't support DROP COLUMN directly easily in old versions,
        // but for this project we'll assume standard migration flow.
        return true;
    }
};
