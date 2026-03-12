import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const FixBankTransactionsSchemaMigration: Migration = {
    version: 36,
    name: 'Fix bank_transactions schema - add missing columns',
    up: async (db: SQLiteEngine) => {
        try {
            await db.run(`ALTER TABLE bank_transactions ADD COLUMN transaction_date DATE`);
        } catch (e) {
            console.warn('Migration 036: transaction_date might already exist');
        }
        try {
            await db.run(`ALTER TABLE bank_transactions ADD COLUMN status TEXT DEFAULT 'pending'`);
        } catch (e) {
            console.warn('Migration 036: status might already exist');
        }
        try {
            await db.run(`ALTER TABLE bank_transactions ADD COLUMN reference_number TEXT`);
        } catch (e) {
            console.warn('Migration 036: reference_number might already exist');
        }
        try {
            await db.run(`UPDATE bank_transactions SET transaction_date = date WHERE transaction_date IS NULL`);
        } catch (e) {
            console.warn('Migration 036: could not copy date to transaction_date');
        }
        console.log('✅ Migration 036: bank_transactions schema fixed');
    },
    down: async (db: SQLiteEngine) => {}
};
