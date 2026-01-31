import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 008: Initialize Logic Clock Infrastructure
 * 
 * The logic_clock is a global monotonic counter that ensures deterministic
 * transaction ordering for the audit chain. Every CRUD operation increments
 * this counter and stamps the transaction with the new value.
 * 
 * This is critical for:
 * - Audit chain integrity
 * - Conflict resolution in distributed scenarios
 * - Deterministic replay of transactions
 */
export const LogicClockInitMigration: Migration = {
    version: 8,
    name: 'Initialize Logic Clock',
    up: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 008: Initializing logic_clock infrastructure...');

        // 1. Seed logic_clock in system_config
        await db.exec(`
            INSERT OR IGNORE INTO system_config (key, value, category)
            VALUES ('logic_clock', '0', 'system')
        `);

        // 2. Add logic_clock column to customers table
        try {
            await db.exec(`ALTER TABLE customers ADD COLUMN logic_clock INTEGER DEFAULT 0`);
            console.log('  ✓ Added logic_clock to customers');
        } catch (e) {
            // Column might already exist
            console.log('  ⚠ logic_clock column already exists in customers');
        }

        // 3. Add logic_clock column to products table
        try {
            await db.exec(`ALTER TABLE products ADD COLUMN logic_clock INTEGER DEFAULT 0`);
            console.log('  ✓ Added logic_clock to products');
        } catch (e) {
            console.log('  ⚠ logic_clock column already exists in products');
        }

        // 4. Add logic_clock column to invoices table
        try {
            await db.exec(`ALTER TABLE invoices ADD COLUMN logic_clock INTEGER DEFAULT 0`);
            console.log('  ✓ Added logic_clock to invoices');
        } catch (e) {
            console.log('  ⚠ logic_clock column already exists in invoices');
        }

        // 5. Add logic_clock column to suppliers table
        try {
            await db.exec(`ALTER TABLE suppliers ADD COLUMN logic_clock INTEGER DEFAULT 0`);
            console.log('  ✓ Added logic_clock to suppliers');
        } catch (e) {
            console.log('  ⚠ logic_clock column already exists in suppliers');
        }

        // 6. Verify logic_clock was seeded
        const result = await db.select('SELECT value FROM system_config WHERE key = ?', ['logic_clock']);
        if (result.length > 0) {
            console.log(`  ✓ Logic clock initialized: ${result[0].value}`);
        } else {
            throw new Error('Failed to initialize logic_clock in system_config');
        }

        console.log('✅ Migration 008: Logic clock infrastructure ready');
    },

    down: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 008: Removing logic_clock infrastructure...');

        // Remove logic_clock from system_config
        await db.exec(`DELETE FROM system_config WHERE key = 'logic_clock'`);

        // Note: SQLite doesn't support DROP COLUMN easily without recreating tables
        // In a real rollback scenario, we'd need to recreate tables without logic_clock
        // For now, we'll just remove the system_config entry

        console.log('✅ Migration 008: Logic clock removed');
    }
};
