import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const InventorySchemaMigration: Migration = {
    version: 3,
    name: 'Advanced Inventory Schema',
    up: async (db: SQLiteEngine) => {

        // 1. Locations (Multi-warehouse support)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT DEFAULT 'warehouse', -- warehouse, store, shelf
                address TEXT,
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Product Batches (Expiry & Lot Tracking)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS product_batches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                batch_number TEXT NOT NULL,
                expiry_date DATE,
                quantity DECIMAL(10,3) DEFAULT 0,
                cost DECIMAL(10,2) DEFAULT 0,
                received_date DATE DEFAULT CURRENT_DATE,
                location_id INTEGER,
                active BOOLEAN DEFAULT 1,
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (location_id) REFERENCES locations(id)
            )
        `);

        // 3. Price History (Audit for pricing)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                old_price DECIMAL(10,2),
                new_price DECIMAL(10,2) NOT NULL,
                changed_by INTEGER, -- User ID
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                reason TEXT,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        `);

        // 4. Inventory Adjustments (Header for grouped adjustments)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS inventory_adjustments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER,
                reason TEXT NOT NULL,
                reference TEXT,
                status TEXT DEFAULT 'completed', -- pending, approved, completed
                total_value_change DECIMAL(12,2) DEFAULT 0
            )
        `);

        // 5. Inventory Movements (The core tracking table)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS inventory_movements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL, -- IN, OUT, ADJUSTMENT, TRANSFER
                product_id INTEGER NOT NULL,
                batch_id INTEGER,
                location_from_id INTEGER,
                location_to_id INTEGER,
                quantity DECIMAL(10,3) NOT NULL, -- Positive for add, negative for remove? Or strictly positive magnitude with type? 
                                                -- Convention: Quantity is magnitude. Type determines sign logic. 
                                                -- BUT for SQL triggers, signed quantity is easier. 
                                                -- Let's use SIGNED quantity: + for IN, - for OUT.
                balance_after DECIMAL(10,3), -- Snapshot of stock after calc
                date DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER,
                reference_type TEXT, -- 'invoice', 'order', 'adjustment'
                reference_id TEXT,
                notes TEXT,
                adjustment_id INTEGER, -- Link to parent adjustment if applicable
                FOREIGN KEY (product_id) REFERENCES products(id),
                FOREIGN KEY (batch_id) REFERENCES product_batches(id),
                FOREIGN KEY (location_from_id) REFERENCES locations(id),
                FOREIGN KEY (location_to_id) REFERENCES locations(id),
                FOREIGN KEY (adjustment_id) REFERENCES inventory_adjustments(id)
            )
        `);

        // 6. TRIGGERS
        // Auto-update Products Stock
        // NOTE: We assume 'quantity' in movement is signed (+/-) for simplicity in trigger
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS trg_update_stock_after_movement
            AFTER INSERT ON inventory_movements
            BEGIN
                UPDATE products 
                SET stock_quantity = stock_quantity + NEW.quantity,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.product_id;
            END;
        `);

        // Auto-update Batch Stock if batch_id provided
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS trg_update_batch_stock_after_movement
            AFTER INSERT ON inventory_movements
            WHEN NEW.batch_id IS NOT NULL
            BEGIN
                UPDATE product_batches
                SET quantity = quantity + NEW.quantity
                WHERE id = NEW.batch_id;
            END;
        `);

        // Prevent negative stock (Optional/Strict mode)
        // await db.exec(`
        //     CREATE TRIGGER IF NOT EXISTS trg_prevent_negative_stock
        //     BEFORE INSERT ON inventory_movements
        //     WHEN NEW.quantity < 0 AND (SELECT stock_quantity FROM products WHERE id = NEW.product_id) + NEW.quantity < 0
        //     BEGIN
        //         SELECT RAISE(ABORT, 'Insufficient stock for transaction');
        //     END;
        // `);
        // Commented out to allow flexibility/overdraft if configured, but typically strict is better. 
        // User requested "inventory_movements (con triggers automáticos)".
    },

    down: async (db: SQLiteEngine) => {
        await db.exec("DROP TRIGGER IF EXISTS trg_update_batch_stock_after_movement");
        await db.exec("DROP TRIGGER IF EXISTS trg_update_stock_after_movement");
        await db.exec("DROP TABLE IF EXISTS inventory_movements");
        await db.exec("DROP TABLE IF EXISTS inventory_adjustments");
        await db.exec("DROP TABLE IF EXISTS price_history");
        await db.exec("DROP TABLE IF EXISTS product_batches");
        await db.exec("DROP TABLE IF EXISTS locations");
    }
};
