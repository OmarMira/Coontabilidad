import initSqlJs from 'sql.js';
import { logger } from '../core/logging/SystemLogger';

/**
 * RECONSTRUCTOR DE BASE DE DATOS
 * Crea las tablas en el orden jerárquico correcto para evitar errores de FK.
 */
export class DatabaseReconstructor {
    static async reconstruct(db: initSqlJs.Database): Promise<void> {
        logger.emergency('Database', 'reconstruction_start', '🏗️ INICIANDO RECONSTRUCCIÓN DE BASE DE DATOS');

        try {
            db.run('PRAGMA foreign_keys = OFF;'); // Desactivar para limpieza

            // 1. ELIMINAR TODO LO EXISTENTE
            const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
            if (tables.length > 0) {
                for (const row of tables[0].values) {
                    db.run(`DROP TABLE IF EXISTS "${row[0]}";`);
                }
            }

            const views = db.exec("SELECT name FROM sqlite_master WHERE type='view';");
            if (views.length > 0) {
                for (const row of views[0].values) {
                    db.run(`DROP VIEW IF EXISTS "${row[0]}";`);
                }
            }

            logger.info('Database', 'drop_all', 'Todas las tablas y vistas eliminadas');

            // 2. CREACIÓN EN ORDEN CORRECTO (PADRES PRIMERO)

            // Independientes / Maestros
            db.run(`CREATE TABLE IF NOT EXISTS company_data(
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
                timezone TEXT DEFAULT 'America/New_York',
                sales_commission_rate DECIMAL(10, 2) DEFAULT 0.00,
                sales_commission_percentage DECIMAL(5, 2) DEFAULT 0.00,
                discount_amount DECIMAL(10, 2) DEFAULT 0.00,
                discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
                shipping_rate DECIMAL(10, 2) DEFAULT 0.00,
                shipping_percentage DECIMAL(5, 2) DEFAULT 0.00,
                reposition_policy_days INTEGER DEFAULT 32,
                late_fee_amount DECIMAL(10, 2) DEFAULT 0.00,
                late_fee_percentage DECIMAL(5, 2) DEFAULT 0.00,
                annual_interest_rate DECIMAL(5, 2) DEFAULT 0.00,
                grace_period_days INTEGER DEFAULT 0,
                documentation_cost DECIMAL(10, 2) DEFAULT 0.00,
                other_costs DECIMAL(10, 2) DEFAULT 0.00,
                chart_of_accounts_name TEXT DEFAULT 'Plan de Cuenta Ejemplo',
                date_format TEXT DEFAULT 'MM/DD/AAAA',
                fiscal_year_end TEXT DEFAULT '12-31',
                netIncreaseInCash DECIMAL(15, 2) DEFAULT 0.00,
                tax_frequency TEXT DEFAULT 'monthly',
                sales_tax_method TEXT DEFAULT 'accrual',
                dr15_filing_day INTEGER DEFAULT 20,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            );`);

            // Insertar registro por defecto si no existe
            db.run(`INSERT OR IGNORE INTO company_data (
                id, company_name, legal_name, tax_id, address, city, state, zip_code, phone, email, is_active
            ) VALUES (
                1, 'Mi Empresa', 'Mi Empresa S.R.L.', '00-0000000-0', 'Calle Principal 123', 'Miami', 'FL', '33101', '555-0100', 'contacto@empresa.com', 1
            );`);

            db.run(`CREATE TABLE customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                business_name TEXT,
                document_type TEXT,
                document_number TEXT,
                email TEXT,
                phone TEXT,
                address_line1 TEXT,
                city TEXT,
                state TEXT,
                zip_code TEXT,
                florida_county TEXT,
                credit_limit DECIMAL(12,2) DEFAULT 0.00,
                payment_terms INTEGER DEFAULT 30,
                tax_exempt BOOLEAN DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`);

            db.run(`CREATE TABLE suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                business_name TEXT,
                document_type TEXT,
                document_number TEXT,
                email TEXT,
                phone TEXT,
                address_line1 TEXT,
                city TEXT,
                state TEXT,
                zip_code TEXT,
                florida_county TEXT,
                credit_limit DECIMAL(12,2) DEFAULT 0.00,
                payment_terms INTEGER DEFAULT 30,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`);

            db.run(`CREATE TABLE product_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                parent_id INTEGER,
                tax_rate DECIMAL(5,2) DEFAULT 0.00,
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES product_categories(id)
            );`);

            // Dependientes
            db.run(`CREATE TABLE products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sku TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) NOT NULL,
                cost DECIMAL(10,2),
                category_id INTEGER,
                supplier_id INTEGER,
                stock_quantity INTEGER DEFAULT 0,
                min_stock_level INTEGER DEFAULT 0,
                taxable BOOLEAN DEFAULT 1,
                active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES product_categories(id),
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            );`);

            db.run(`CREATE TABLE invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_number TEXT UNIQUE NOT NULL,
                customer_id INTEGER NOT NULL,
                issue_date DATE DEFAULT CURRENT_DATE,
                due_date DATE,
                subtotal DECIMAL(12,2) DEFAULT 0.00,
                tax_amount DECIMAL(12,2) DEFAULT 0.00,
                total_amount DECIMAL(12,2) DEFAULT 0.00,
                status TEXT DEFAULT 'paid',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            );`);

            db.run(`CREATE TABLE invoice_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER NOT NULL,
                product_id INTEGER,
                description TEXT NOT NULL,
                quantity DECIMAL(10,3) DEFAULT 1.000,
                unit_price DECIMAL(10,2) DEFAULT 0.00,
                line_total DECIMAL(12,2) DEFAULT 0.00,
                FOREIGN KEY (invoice_id) REFERENCES invoices(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            );`);

            db.run(`CREATE TABLE chart_of_accounts (
                account_code TEXT PRIMARY KEY,
                account_name TEXT NOT NULL,
                account_type TEXT NOT NULL,
                normal_balance TEXT NOT NULL,
                is_active BOOLEAN DEFAULT 1
            );`);

            db.run(`CREATE TABLE journal_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_date DATE NOT NULL,
                reference TEXT,
                description TEXT,
                total_debit DECIMAL(15,2) NOT NULL,
                total_credit DECIMAL(15,2) NOT NULL
            );`);

            db.run(`CREATE TABLE journal_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                journal_entry_id INTEGER NOT NULL,
                account_code TEXT NOT NULL,
                debit_amount DECIMAL(15,2) DEFAULT 0,
                credit_amount DECIMAL(15,2) DEFAULT 0,
                FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
                FOREIGN KEY (account_code) REFERENCES chart_of_accounts(account_code)
            );`);

            logger.info('Database', 'tables_created', 'Esquema reconstruido correctamente');

            logger.info('Database', 'reconstruction_complete', 'Esquema reconstruido correctamente (Base de datos limpia)');

            // 4. REACTIVAR Y VERIFICAR
            db.run('PRAGMA foreign_keys = ON;');
            const check = db.exec('PRAGMA foreign_key_check;');
            if (check.length > 0) {
                throw new Error('Violación de FK detectada después de la reconstrucción');
            }

            logger.success('Database', 'reconstruction_success', '🚀 BASE DE DATOS RECONSTRUIDA SIN ERRORES');

        } catch (error: any) {
            logger.critical('Database', 'reconstruction_failed', 'Fallo en la reconstrucción', { error: error.message });
            throw error;
        }
    }
}
