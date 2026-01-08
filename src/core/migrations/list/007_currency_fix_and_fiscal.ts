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


        // 2. Anti-Tamper Triggers for Fiscal Tables (Task 5.2)

        // TAX_TRANSACTIONS
        await db.run(`
            CREATE TRIGGER IF NOT EXISTS prevent_tax_tx_update
            BEFORE UPDATE ON tax_transactions
            BEGIN
                SELECT RAISE(ABORT, 'FORENSIC ALERT: Tax transactions are immutable.');
            END;
        `);
        await db.run(`
            CREATE TRIGGER IF NOT EXISTS prevent_tax_tx_delete
            BEFORE DELETE ON tax_transactions
            BEGIN
                SELECT RAISE(ABORT, 'FORENSIC ALERT: Tax transactions are immutable.');
            END;
        `);

        // FIXED_ASSETS (Allow IsActive update, but not financial fields)
        await db.run(`
            CREATE TRIGGER IF NOT EXISTS protect_asset_financials
            BEFORE UPDATE OF acquisition_cost, acquisition_date, depreciation_method ON fixed_assets
            BEGIN
                SELECT RAISE(ABORT, 'FORENSIC ALERT: Fixed Asset financial data is immutable.');
            END;
        `);

        // ASSET_DEPRECIATION
        await db.run(`
            CREATE TRIGGER IF NOT EXISTS prevent_depreciation_tamper
            BEFORE UPDATE ON asset_depreciation
            BEGIN
                SELECT RAISE(ABORT, 'FORENSIC ALERT: Depreciation records are immutable.');
            END;
        `);
    },
    down: async (db: SQLiteEngine) => {
        // Dropping triggers is safe. Reverting currency is risky so we leave data as cents.
        await db.run("DROP TRIGGER IF EXISTS prevent_tax_tx_update");
        await db.run("DROP TRIGGER IF EXISTS prevent_tax_tx_delete");
        await db.run("DROP TRIGGER IF EXISTS protect_asset_financials");
        await db.run("DROP TRIGGER IF EXISTS prevent_depreciation_tamper");
    }
};
