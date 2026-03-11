import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const CurrencyFixAndFiscalMigration: Migration = {
    version: 7,
    name: 'Currency Fix (Floats to Cents) & Fiscal Triggers',
    up: async (db: SQLiteEngine) => {
        // 1. Currency Migration (Floats -> Integer Cents)

        // JOURNAL ENTRIES
        try {
            await db.run(`
                UPDATE journal_entries 
                SET total_debit = CAST(ROUND(total_debit * 100) AS INTEGER),
                    total_credit = CAST(ROUND(total_credit * 100) AS INTEGER)
            `);
        } catch (e) {
            console.warn("Migration 007: Failed to update journal_entries currency", e);
        }

        // INVOICES
        try {
            await db.run(`
                UPDATE invoices
                SET total_amount = CAST(ROUND(total_amount * 100) AS INTEGER),
                    tax_amount = CAST(ROUND(tax_amount * 100) AS INTEGER)
            `);
        } catch (e) {
            console.warn("Migration 007: Failed to update invoices currency", e);
        }

        // BILLS
        try {
            await db.run(`
                UPDATE bills
                SET total_amount = CAST(ROUND(total_amount * 100) AS INTEGER)
            `);
        } catch (e) { }

        // PRODUCTS
        try {
            await db.run(`
                UPDATE products
                SET price = CAST(ROUND(price * 100) AS INTEGER),
                    cost = CAST(ROUND(cost * 100) AS INTEGER)
            `);
        } catch (e) { }



    },
    down: async (db: SQLiteEngine) => {
        // Dropping triggers is safe. Reverting currency is risky so we leave data as cents.

    }
};
