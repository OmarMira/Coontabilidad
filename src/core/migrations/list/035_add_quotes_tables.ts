import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const AddQuotesTablesMigration: Migration = {
    version: 35,
    name: 'Add quotes and quote_lines tables to persistent engine',
    up: async (db: SQLiteEngine) => {
        await db.exec(`
            CREATE TABLE IF NOT EXISTS quotes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quote_number TEXT NOT NULL UNIQUE,
                customer_id INTEGER NOT NULL,
                issue_date DATE NOT NULL,
                expiry_date DATE,
                status TEXT DEFAULT 'draft' CHECK(status IN('draft', 'sent', 'accepted', 'declined', 'expired', 'converted')),
                subtotal DECIMAL(12, 2) DEFAULT 0.00,
                tax_amount DECIMAL(12, 2) DEFAULT 0.00,
                total_amount DECIMAL(12, 2) DEFAULT 0.00,
                converted_to_invoice_id INTEGER,
                notes TEXT,
                terms TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER DEFAULT 1,
                updated_by INTEGER DEFAULT 1,
                FOREIGN KEY(customer_id) REFERENCES customers(id),
                FOREIGN KEY(converted_to_invoice_id) REFERENCES invoices(id)
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS quote_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quote_id INTEGER NOT NULL,
                product_id INTEGER,
                description TEXT NOT NULL,
                quantity DECIMAL(10, 3) DEFAULT 1.000,
                unit_price DECIMAL(10, 2) DEFAULT 0.00,
                discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
                line_total DECIMAL(12, 2) DEFAULT 0.00,
                taxable BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
        `);

        console.log('✅ Migration 035: quotes y quote_lines creadas en motor persistente');
    },
    down: async (db: SQLiteEngine) => {}
};
