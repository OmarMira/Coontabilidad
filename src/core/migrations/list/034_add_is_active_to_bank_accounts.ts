import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const AddIsActiveToBankAccountsMigration: Migration = {
    version: 34,
    name: 'Add is_active column to bank_accounts if missing',
    up: async (db: SQLiteEngine) => {
        try {
            await db.run(`ALTER TABLE bank_accounts ADD COLUMN is_active BOOLEAN DEFAULT 1`);
            console.log('✅ Migration 034: is_active agregado a bank_accounts');
        } catch (e) {
            console.warn('Migration 034: is_active might already exist', e);
        }
    },
    down: async (db: SQLiteEngine) => {}
};
