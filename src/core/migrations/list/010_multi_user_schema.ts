import { Migration } from '../MigrationEngine';
import { SQLiteEngine } from '../../database/SQLiteEngine';

export const MultiUserSchemaMigration: Migration = {
    version: 10,
    name: 'Multi-User System and Audit Trail',
    up: async (db: SQLiteEngine) => {
        // Helper function to check if column exists
        const hasColumn = async (tableName: string, columnName: string): Promise<boolean> => {
            try {
                const cols = await db.select(`PRAGMA table_info(${tableName})`);
                return cols.some((c: any) => c.name === columnName);
            } catch (e) {
                console.warn(`[Migration v10] Error checking column ${columnName} in ${tableName}`, e);
                return false;
            }
        };

        // 1. Mejorar tabla de roles con permisos granulares
        try {
            if (!(await hasColumn('user_roles', 'permissions_json'))) {
                await db.exec(`ALTER TABLE user_roles ADD COLUMN permissions_json TEXT DEFAULT '{}'`);
            }
            if (!(await hasColumn('user_roles', 'is_system_role'))) {
                await db.exec(`ALTER TABLE user_roles ADD COLUMN is_system_role BOOLEAN DEFAULT 0`);
            }
        } catch (e) {
            console.warn('[Migration v10] Non-critical error adjusting user_roles:', e);
        }

        // 2. Ajustar tabla de usuarios (Email y Full Name)
        try {
            if (!(await hasColumn('users', 'email'))) {
                await db.exec(`ALTER TABLE users ADD COLUMN email TEXT`);
                await db.exec(`UPDATE users SET email = username`);
            }
            if (!(await hasColumn('users', 'full_name'))) {
                await db.exec(`ALTER TABLE users ADD COLUMN full_name TEXT`);
                await db.exec(`UPDATE users SET full_name = display_name`);
            }
        } catch (e) {
            console.warn('[Migration v10] Non-critical error adjusting users table:', e);
        }

        // 3. Crear tabla de sesiones
        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    session_token TEXT UNIQUE NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (e) {
            console.error('[Migration v10] Error creating user_sessions table:', e);
            throw e; // Critical
        }

        // 4. Crear tabla de auditoría (Audit Trail)
        // Aligned with simple-db.ts to use TEXT for entity_id and entity_type nullable
        try {
            await db.exec(`
                CREATE TABLE IF NOT EXISTS audit_trail (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER REFERENCES users(id),
                    action TEXT NOT NULL,
                    entity_type TEXT,
                    entity_id TEXT,
                    old_value TEXT,
                    new_value TEXT,
                    ip_address TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } catch (e) {
            console.error('[Migration v10] Error creating audit_trail table:', e);
            throw e; // Critical
        }

        // 5. Agregar trazabilidad a tablas principales
        const tablesToTrack = ['customers', 'suppliers', 'invoices', 'bills', 'products', 'chart_of_accounts', 'journal_entries'];
        for (const table of tablesToTrack) {
            try {
                // Check if table exists first
                const tableExists = await db.select(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
                if (tableExists && tableExists.length > 0) {
                    if (!(await hasColumn(table, 'created_by'))) {
                        await db.exec(`ALTER TABLE ${table} ADD COLUMN created_by INTEGER REFERENCES users(id) DEFAULT 1`);
                    }
                    if (!(await hasColumn(table, 'updated_by'))) {
                        await db.exec(`ALTER TABLE ${table} ADD COLUMN updated_by INTEGER REFERENCES users(id) DEFAULT 1`);
                    }
                }
            } catch (e) {
                console.warn(`[Migration v10] Error adding info columns to ${table}:`, e);
                // Continue with other tables
            }
        }

        // 6. Semilla de roles predefinidos con permisos
        try {
            const adminPerms = JSON.stringify({
                dashboard: ["view", "export"],
                customers: ["view", "create", "edit", "delete", "export"],
                suppliers: ["view", "create", "edit", "delete"],
                products: ["view", "create", "edit", "delete", "manage_inventory"],
                sales: ["view_invoices", "create_invoice", "edit_invoice", "cancel_invoice", "view_reports"],
                purchases: ["view_bills", "create_bill", "edit_bill", "pay_bill"],
                accounting: ["view_chart_of_accounts", "create_journal", "edit_journal", "view_reports", "close_period"],
                reports: ["view_financial", "view_tax", "view_inventory", "export_all"],
                settings: ["view_company", "edit_company", "manage_users", "manage_roles", "system_settings"]
            });

            const accountantPerms = JSON.stringify({
                dashboard: ["view"],
                customers: ["view"],
                suppliers: ["view"],
                products: ["view"],
                sales: ["view_invoices", "view_reports"],
                purchases: ["view_bills"],
                accounting: ["view_chart_of_accounts", "create_journal", "edit_journal", "view_reports", "close_period"],
                reports: ["view_financial", "view_tax", "view_inventory", "export_all"],
                settings: ["view_company"]
            });

            // Update existing roles if they exist
            await db.run("UPDATE user_roles SET permissions_json = ?, is_system_role = 1 WHERE name = 'admin'", [adminPerms]);
            await db.run("UPDATE user_roles SET permissions_json = ?, is_system_role = 1 WHERE name = 'accountant'", [accountantPerms]);

            // Create roles missing if necessary
            // Safer check for 'vendedor' existence using SQL directly
            const vendorRole = await db.select("SELECT id FROM user_roles WHERE name = 'vendedor'");
            if (!vendorRole || vendorRole.length === 0) {
                const sellerPerms = JSON.stringify({
                    dashboard: ["view"],
                    customers: ["view", "create", "edit"],
                    sales: ["view_invoices", "create_invoice"],
                    products: ["view"]
                });
                await db.run("INSERT INTO user_roles (name, description, permissions_json, level) VALUES ('vendedor', 'Personal de ventas', ?, 20)", [sellerPerms]);
            }
        } catch (e) {
            console.warn('[Migration v10] Error seeding roles/permissions:', e);
            // Non-critical if roles allow basic login
        }
    },
    down: async (db: SQLiteEngine) => {
        try {
            await db.exec(`DROP TABLE IF EXISTS user_sessions`);
            await db.exec(`DROP TABLE IF EXISTS audit_trail`);
        } catch (e) {
            console.error('[Migration v10] Error reverting migration:', e);
        }
    }
};

