import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const SystemSchemaMigration: Migration = {
    version: 6,
    name: 'System Configuration & Roles',
    up: async (db: SQLiteEngine) => {

        // 1. System Config (Key-Value Store)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS system_config (
                key TEXT PRIMARY KEY,
                value TEXT,
                category TEXT DEFAULT 'general',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Company Info (Singleton usually, or support multi-entity with row 1)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS company_info (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                tax_id TEXT,
                address TEXT,
                city TEXT,
                state TEXT,
                zip TEXT,
                phone TEXT,
                email TEXT,
                website TEXT,
                logo_path TEXT,
                currency_code TEXT DEFAULT 'USD',
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. User Roles & Permissions
        await db.exec(`
            CREATE TABLE IF NOT EXISTS user_roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE, -- e.g. 'admin', 'accountant', 'viewer'
                description TEXT,
                permissions TEXT, -- JSON array of permission strings
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Fiscal Settings (Extends basic Tax Table)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS fiscal_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tax_year_start DATE,
                tax_frequency TEXT DEFAULT 'monthly', -- monthly, quarterly
                sales_tax_method TEXT DEFAULT 'accrual', -- accrual, cash
                default_tax_rate DECIMAL(5,4) DEFAULT 0.06,
                dr15_filing_day INTEGER DEFAULT 20,
                active BOOLEAN DEFAULT 1
            )
        `);

        // 5. System Audit Log (Differs from AuditChain - simpler Log for UI/Admin actions)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS system_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER,
                action TEXT NOT NULL, -- e.g., 'update_config'
                target TEXT,
                details TEXT, -- JSON
                ip_address TEXT
            )
        `);
    },

    down: async (db: SQLiteEngine) => {
        await db.exec("DROP TABLE IF EXISTS system_audit_log");
        await db.exec("DROP TABLE IF EXISTS fiscal_settings");
        await db.exec("DROP TABLE IF EXISTS user_roles");
        await db.exec("DROP TABLE IF EXISTS company_info");
        await db.exec("DROP TABLE IF EXISTS system_config");
    }
};
