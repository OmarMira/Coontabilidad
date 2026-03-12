import { Migration } from '../MigrationEngine';
import { SQLiteEngine } from '../../database/SQLiteEngine';

export const UsersAndCompanyDataMigration: Migration = {
    version: 31,
    name: 'Create users, user_roles and company_data tables in persistent engine',
    up: async (db: SQLiteEngine) => {

        await db.exec(`
            CREATE TABLE IF NOT EXISTS user_roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                level INTEGER DEFAULT 1,
                permissions_json TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role_id INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                picture TEXT,
                last_login DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(role_id) REFERENCES user_roles(id)
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS company_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_name TEXT NOT NULL,
                legal_name TEXT NOT NULL,
                tax_id TEXT NOT NULL,
                address TEXT NOT NULL,
                city TEXT NOT NULL,
                state TEXT NOT NULL DEFAULT 'FL',
                zip_code TEXT NOT NULL,
                phone TEXT NOT NULL,
                email TEXT NOT NULL,
                website TEXT,
                logo_path TEXT,
                fiscal_year_start TEXT DEFAULT '01-01',
                currency TEXT DEFAULT 'USD',
                language TEXT DEFAULT 'es',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS bills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bill_number TEXT UNIQUE NOT NULL,
                supplier_id INTEGER NOT NULL,
                issue_date DATE DEFAULT CURRENT_DATE,
                due_date DATE,
                total_amount INTEGER NOT NULL DEFAULT 0,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue', 'cancelled')),
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
            )
        `);

        console.log('✅ Migration 031: users, user_roles y company_data creadas en motor persistente');
    },
    down: async (db: SQLiteEngine) => {
        await db.exec(`DROP TABLE IF EXISTS users`);
        await db.exec(`DROP TABLE IF EXISTS user_roles`);
        await db.exec(`DROP TABLE IF EXISTS company_data`);
    }
};
