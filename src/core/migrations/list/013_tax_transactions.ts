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

        await db.exec(`
            CREATE TABLE IF NOT EXISTS tax_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                transaction_date DATE NOT NULL,
                county TEXT NOT NULL,
                taxable_amount INTEGER NOT NULL,  -- in cents
                state_tax_amount INTEGER NOT NULL,  -- in cents (6% of taxable_amount)
                county_tax_amount INTEGER NOT NULL,  -- in cents (county surtax)
                total_tax_amount INTEGER NOT NULL,  -- in cents (state + county)
                state_rate REAL NOT NULL,  -- 0.06 (6%)
                county_rate REAL NOT NULL,  -- 0.005 to 0.015 (0.5% to 1.5%)
                total_rate REAL NOT NULL,  -- state_rate + county_rate
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `);

        // Create indexes for performance
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_invoice ON tax_transactions(invoice_id)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_date ON tax_transactions(transaction_date)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_county ON tax_transactions(county)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_customer ON tax_transactions(customer_id)`);

        console.log('✅ Migration 013: tax_transactions table created successfully');
        console.log('   - Table: tax_transactions');
        console.log('   - Indexes: 4 (invoice_id, transaction_date, county, customer_id)');
        console.log('   - Foreign Keys: 2 (invoices, customers)');
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
