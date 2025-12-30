import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const PurchasingSchemaMigration: Migration = {
    version: 4,
    name: 'Purchasing & Accounts Payable',
    up: async (db: SQLiteEngine) => {

        // 1. Purchase Orders (Head)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS purchase_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE NOT NULL,
                supplier_id INTEGER NOT NULL,
                date DATE DEFAULT CURRENT_DATE,
                expected_date DATE,
                status TEXT DEFAULT 'draft', -- draft, sent, approved, partial, closed, cancelled
                subtotal DECIMAL(12,2) DEFAULT 0.00,
                tax_amount DECIMAL(12,2) DEFAULT 0.00,
                total_amount DECIMAL(12,2) DEFAULT 0.00,
                notes TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )
        `);

        // 2. Purchase Order Lines
        await db.exec(`
            CREATE TABLE IF NOT EXISTS purchase_order_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                purchase_order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                description TEXT,
                quantity_ordered DECIMAL(10,3) NOT NULL,
                quantity_received DECIMAL(10,3) DEFAULT 0,
                unit_cost DECIMAL(10,2) NOT NULL,
                line_total DECIMAL(12,2) NOT NULL,
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);

        // 3. Goods Receipts (Head) - Entrada de Mercancía
        await db.exec(`
            CREATE TABLE IF NOT EXISTS goods_receipts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                receipt_number TEXT UNIQUE NOT NULL,
                purchase_order_id INTEGER, -- Optional, can be direct receipt
                supplier_id INTEGER NOT NULL,
                received_date DATE DEFAULT CURRENT_DATE,
                status TEXT DEFAULT 'received', -- received, verified
                notes TEXT,
                received_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )
        `);

        // 4. Goods Receipt Lines
        await db.exec(`
            CREATE TABLE IF NOT EXISTS goods_receipt_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                goods_receipt_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity_received DECIMAL(10,3) NOT NULL,
                batch_number TEXT,
                expiry_date DATE,
                location_id INTEGER,
                FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipts(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);

        // 5. Bills (Facturas de Proveedor - Accounts Payable)
        // Linking receipts or POs to a Payable Bill
        await db.exec(`
            CREATE TABLE IF NOT EXISTS vendor_bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplier_id INTEGER NOT NULL,
                bill_number TEXT, -- Supplier's Invoice Number
                date DATE DEFAULT CURRENT_DATE,
                due_date DATE,
                total_amount DECIMAL(12,2) NOT NULL,
                balance_due DECIMAL(12,2) NOT NULL,
                status TEXT DEFAULT 'open', -- open, partial, paid, void
                purchase_order_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
                FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id)
            )
        `);
    },

    down: async (db: SQLiteEngine) => {
        await db.exec("DROP TABLE IF EXISTS vendor_bills");
        await db.exec("DROP TABLE IF EXISTS goods_receipt_lines");
        await db.exec("DROP TABLE IF EXISTS goods_receipts");
        await db.exec("DROP TABLE IF EXISTS purchase_order_lines");
        await db.exec("DROP TABLE IF EXISTS purchase_orders");
    }
};
