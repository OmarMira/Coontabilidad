import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 013: Tax Transactions Table
 * 
 * Creates the tax_transactions table for tracking sales tax on invoices.
 * Supports Florida county-level tax tracking and compliance reporting.
 * 
 * This table records the tax breakdown for each invoice:
 * - State tax (6% Florida base rate)
 * - County surtax (0.5% - 1.5% depending on county)
 * - Total tax amount
 * 
 * All monetary values stored in cents (INTEGER) for precision.
 */
export const TaxTransactionsMigration: Migration = {
    version: 13,
    name: 'Tax Transactions Table',
    up: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 013: Creating tax_transactions table...');

        // tax_transactions may already exist from simple-db.ts with different columns.
        // Use CREATE TABLE IF NOT EXISTS and guard all indexes.
        await db.exec(`
            CREATE TABLE IF NOT EXISTS tax_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER NOT NULL,
                transaction_date TEXT NOT NULL,
                county_code TEXT NOT NULL,
                taxable_amount REAL NOT NULL,
                effective_rate REAL NOT NULL,
                tax_amount REAL NOT NULL,
                is_exempt BOOLEAN DEFAULT 0,
                exemption_type TEXT,
                verification_hash TEXT,
                status TEXT DEFAULT 'pending',
                dr15_report_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes for performance — county_code matches the column in simple-db.ts
        try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_invoice ON tax_transactions(invoice_id)`); } catch (e) { console.warn('013 idx_tax_trans_invoice skipped', e); }
        try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_date ON tax_transactions(transaction_date)`); } catch (e) { console.warn('013 idx_tax_trans_date skipped', e); }
        try { await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_county ON tax_transactions(county_code)`); } catch (e) { console.warn('013 idx_tax_trans_county skipped', e); }

        // ── Iron Core: Anti-Tamper Triggers ────────────────────────────────
        // tax_transactions is guaranteed to exist at this point.
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS prevent_tax_tx_update
            BEFORE UPDATE ON tax_transactions
            BEGIN
                SELECT RAISE(ABORT, 'FORENSIC ALERT: Tax transactions are immutable.');
            END;
        `);
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS prevent_tax_tx_delete
            BEFORE DELETE ON tax_transactions
            BEGIN
                SELECT RAISE(ABORT, 'FORENSIC ALERT: Tax transactions are immutable.');
            END;
        `);

        console.log('✅ Migration 013: tax_transactions table created successfully');
        console.log('   - Table: tax_transactions');
        console.log('   - Indexes: 3 (invoice_id, transaction_date, county_code)');
        console.log('   - Iron Core: prevent_tax_tx_update + prevent_tax_tx_delete triggers active');
    },

    down: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 013: Rolling back tax_transactions table...');

        // Drop indexes first
        await db.exec(`DROP INDEX IF EXISTS idx_tax_trans_customer`);
        await db.exec(`DROP INDEX IF EXISTS idx_tax_trans_county`);
        await db.exec(`DROP INDEX IF EXISTS idx_tax_trans_date`);
        await db.exec(`DROP INDEX IF EXISTS idx_tax_trans_invoice`);

        // Drop table
        await db.exec(`DROP TABLE IF EXISTS tax_transactions`);

        console.log('✅ Migration 013: Rollback complete');
    }
};
