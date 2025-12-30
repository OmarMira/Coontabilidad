import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const InitialSchemaMigration: Migration = {
    version: 1,
    name: 'Initial Schema & AI Views',
    up: async (db: SQLiteEngine) => {
        // --- Core Tables ---

        // Customers
        await db.exec(`
            CREATE TABLE IF NOT EXISTS customers (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              business_name TEXT,
              document_type TEXT DEFAULT 'SSN',
              document_number TEXT,
              business_type TEXT,
              email TEXT,
              email_secondary TEXT,
              phone TEXT,
              phone_secondary TEXT,
              address_line1 TEXT,
              address_line2 TEXT,
              city TEXT DEFAULT 'Miami',
              state TEXT DEFAULT 'FL',
              zip_code TEXT,
              florida_county TEXT DEFAULT 'Miami-Dade',
              credit_limit DECIMAL(12,2) DEFAULT 0.00,
              payment_terms INTEGER DEFAULT 30,
              tax_exempt BOOLEAN DEFAULT 0,
              tax_id TEXT,
              assigned_salesperson TEXT,
              status TEXT DEFAULT 'active',
              notes TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Product Categories
        await db.exec(`
            CREATE TABLE IF NOT EXISTS product_categories (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              description TEXT,
              parent_id INTEGER,
              tax_rate DECIMAL(5,2) DEFAULT 0.00,
              active BOOLEAN DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (parent_id) REFERENCES product_categories(id)
            )
        `);

        // Suppliers
        await db.exec(`
             CREATE TABLE IF NOT EXISTS suppliers (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              business_name TEXT,
              document_type TEXT DEFAULT 'EIN',
              document_number TEXT,
              business_type TEXT,
              email TEXT,
              email_secondary TEXT,
              phone TEXT,
              phone_secondary TEXT,
              address_line1 TEXT,
              address_line2 TEXT,
              city TEXT DEFAULT 'Miami',
              state TEXT DEFAULT 'FL',
              zip_code TEXT,
              florida_county TEXT DEFAULT 'Miami-Dade',
              credit_limit DECIMAL(12,2) DEFAULT 0.00,
              payment_terms INTEGER DEFAULT 30,
              tax_exempt BOOLEAN DEFAULT 0,
              tax_id TEXT,
              assigned_buyer TEXT,
              status TEXT DEFAULT 'active',
              notes TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Products
        await db.exec(`
            CREATE TABLE IF NOT EXISTS products (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              sku TEXT UNIQUE NOT NULL,
              name TEXT NOT NULL,
              description TEXT,
              price DECIMAL(10,2) NOT NULL DEFAULT 0,
              cost DECIMAL(10,2) DEFAULT 0,
              category_id INTEGER,
              unit_of_measure TEXT DEFAULT 'unidad',
              taxable BOOLEAN DEFAULT 1,
              tax_rate DECIMAL(5,2),
              stock_quantity INTEGER DEFAULT 0,
              min_stock_level INTEGER DEFAULT 0,
              max_stock_level INTEGER DEFAULT 100,
              reorder_point INTEGER DEFAULT 10,
              supplier_id INTEGER,
              barcode TEXT,
              image_path TEXT,
              weight DECIMAL(8,2),
              dimensions TEXT,
              is_service BOOLEAN DEFAULT 0,
              service_duration INTEGER,
              warranty_period INTEGER,
              notes TEXT,
              active BOOLEAN DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (category_id) REFERENCES product_categories(id),
              FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )
        `);

        // Invoices
        await db.exec(`
            CREATE TABLE IF NOT EXISTS invoices (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              invoice_number TEXT UNIQUE NOT NULL,
              customer_id INTEGER NOT NULL,
              issue_date DATE DEFAULT CURRENT_DATE,
              due_date DATE,
              subtotal DECIMAL(12,2) DEFAULT 0.00,
              tax_amount DECIMAL(12,2) DEFAULT 0.00,
              total_amount DECIMAL(12,2) DEFAULT 0.00,
              status TEXT DEFAULT 'draft',
              notes TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (customer_id) REFERENCES customers (id)
            )
        `);

        // Invoice Lines
        await db.exec(`
             CREATE TABLE IF NOT EXISTS invoice_lines (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              invoice_id INTEGER NOT NULL,
              product_id INTEGER,
              description TEXT NOT NULL,
              quantity DECIMAL(10,3) DEFAULT 1.000,
              unit_price DECIMAL(10,2) DEFAULT 0.00,
              line_total DECIMAL(12,2) DEFAULT 0.00,
              taxable BOOLEAN DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (invoice_id) REFERENCES invoices (id),
              FOREIGN KEY (product_id) REFERENCES products (id)
            )
        `);

        // Journal Entries
        await db.exec(`
             CREATE TABLE IF NOT EXISTS journal_entries (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              entry_date DATE DEFAULT CURRENT_DATE,
              description TEXT NOT NULL,
              reference TEXT,
              total DECIMAL(12,2) NOT NULL,
              status TEXT DEFAULT 'posted',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Journal Details
        await db.exec(`
             CREATE TABLE IF NOT EXISTS journal_details (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              journal_id INTEGER NOT NULL,
              account_code TEXT NOT NULL,
              debit DECIMAL(12,2) DEFAULT 0.00,
              credit DECIMAL(12,2) DEFAULT 0.00,
              description TEXT,
              FOREIGN KEY (journal_id) REFERENCES journal_entries(id)
            )
        `);

        // Chart of Accounts
        await db.exec(`
            CREATE TABLE IF NOT EXISTS chart_of_accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                subtype TEXT,
                active BOOLEAN DEFAULT 1
            )
        `);

        // Audit Chain (The critical table)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS audit_chain (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                event_type TEXT NOT NULL,
                entity_table TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                user_id TEXT,
                content_payload TEXT NOT NULL, -- JSON
                content_hash TEXT NOT NULL,
                previous_hash TEXT,
                chain_hash TEXT NOT NULL
            )
        `);

        // Florida Tax Config
        await db.exec(`
             CREATE TABLE IF NOT EXISTS florida_tax_rates (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              county_name TEXT UNIQUE NOT NULL,
              state_rate DECIMAL(5,4) DEFAULT 0.06,
              county_rate DECIMAL(5,4) DEFAULT 0.0,
              total_rate DECIMAL(5,4) DEFAULT 0.06,
              effective_date DATE DEFAULT CURRENT_DATE,
              active BOOLEAN DEFAULT 1
            )
        `);


        // --- AI Read-Only Views ---

        // 1. Financial Summary View (Balance Sheet Snapshot)
        await db.exec(`
            CREATE VIEW IF NOT EXISTS financial_summary_view AS
            SELECT 
                (SELECT SUM(debit - credit) FROM journal_details jd JOIN chart_of_accounts ca ON jd.account_code = ca.code WHERE ca.type = 'ASSET') as total_assets,
                (SELECT SUM(credit - debit) FROM journal_details jd JOIN chart_of_accounts ca ON jd.account_code = ca.code WHERE ca.type = 'LIABILITY') as total_liabilities,
                (SELECT SUM(credit - debit) FROM journal_details jd JOIN chart_of_accounts ca ON jd.account_code = ca.code WHERE ca.type = 'EQUITY') as total_equity,
                (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices_count,
                CURRENT_DATE as report_date
        `);

        // 2. Tax Compliance View (For DR-15)
        // Aggregates sales by county for the current month
        await db.exec(`
            CREATE VIEW IF NOT EXISTS tax_compliance_view AS
            SELECT 
                c.florida_county as county,
                SUM(i.total_amount) as gross_sales,
                SUM(CASE WHEN i.tax_amount > 0 THEN i.subtotal ELSE 0 END) as taxable_sales,
                SUM(CASE WHEN i.tax_amount = 0 THEN i.subtotal ELSE 0 END) as exempt_sales,
                SUM(i.tax_amount) as tax_collected,
                strftime('%Y-%m', i.issue_date) as tax_period
            FROM invoices i
            JOIN customers c ON i.customer_id = c.id
            WHERE i.status IN ('paid', 'sent')
            GROUP BY c.florida_county, tax_period
        `);

        // 3. Audit Integrity View
        // Checks for broken chains (where previous_hash != hash of previous row)
        // Note: SQLite complex recursive queries or lag window functions might be needed.
        // Simple view: Just show the chain for external traversal validation.
        await db.exec(`
            CREATE VIEW IF NOT EXISTS audit_integrity_view AS
            SELECT 
                id, 
                timestamp,
                chain_hash,
                previous_hash
            FROM audit_chain
            ORDER BY id DESC
        `);
    },
    down: async (db: SQLiteEngine) => {
        // Dangerous, but defined for completeness
        // In production, we might disable this or be very careful.
        await db.exec("DROP VIEW IF EXISTS audit_integrity_view");
        await db.exec("DROP VIEW IF EXISTS tax_compliance_view");
        await db.exec("DROP VIEW IF EXISTS financial_summary_view");
        // Drop tables... (omitted for safety in this snippet, usually we don't drop data in down unless dev)
    }
};
