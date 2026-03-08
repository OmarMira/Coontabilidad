import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const AddStatusToJournalEntriesMigration: Migration = {
    version: 25,
    name: 'Add status, posted_at, and posted_by to journal_entries and fix broken views',
    up: async (db: SQLiteEngine) => {
        // --- 0. DROP BROKEN VIEWS (Broad sweep to prevent re-validation errors during table recreation) ---
        const viewsToDrop = [
            'financial_summary',
            'financial_summary_view',
            'v_trial_balance_live',
            'v_ai_context_financial',
            'v_daily_financial_snapshot',
            'tax_compliance_view',
            'tax_summary_florida',
            'v_tax_liability_florida',
            'alerts_summary',
            'v_financial_health',
            'datos_sistema',
            'v_payroll_summary',
            'v_bank_reconciliation_status'
        ];

        for (const viewName of viewsToDrop) {
            try {
                await db.exec(`DROP VIEW IF EXISTS ${viewName}`);
            } catch (e) {
                console.warn(`Migration 025: Could not drop view ${viewName}`, e);
            }
        }

        // --- 1. RECREATE journal_entries TABLE ---

        // Desactivar FKs para permitir el DROP
        await db.exec("PRAGMA foreign_keys=OFF");

        // Crear tabla temporal con el nuevo esquema
        await db.exec(`
            CREATE TABLE journal_entries_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_date DATE NOT NULL,
                reference TEXT,
                description TEXT,
                notes TEXT,
                total_debit DECIMAL(15, 2) NOT NULL CHECK(total_debit >= 0),
                total_credit DECIMAL(15, 2) NOT NULL CHECK(total_credit >= 0),
                is_balanced BOOLEAN GENERATED ALWAYS AS(total_debit = total_credit) STORED,
                status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'POSTED', 'VOIDED')),
                posted_at DATETIME,
                posted_by INTEGER REFERENCES users(id),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER REFERENCES users(id) DEFAULT 1,
                updated_by INTEGER REFERENCES users(id) DEFAULT 1,
                verified_by INTEGER REFERENCES users(id),
                verified_at DATETIME
            )
        `);

        // Migrar datos existentes (mapeando verified_at -> posted_at por seguridad histórica)
        await db.exec(`
            INSERT INTO journal_entries_new (
                id, entry_date, reference, description, notes, 
                total_debit, total_credit, created_at, updated_at, 
                created_by, updated_by, verified_by, verified_at,
                status, posted_at, posted_by
            )
            SELECT 
                id, entry_date, reference, description, notes, 
                total_debit, total_credit, created_at, updated_at, 
                created_by, updated_by, verified_by, verified_at,
                CASE WHEN verified_at IS NOT NULL THEN 'POSTED' ELSE 'DRAFT' END,
                verified_at,
                verified_by
            FROM journal_entries
        `);

        await db.exec("DROP TABLE journal_entries");
        await db.exec("ALTER TABLE journal_entries_new RENAME TO journal_entries");

        // Reactivar FKs
        await db.exec("PRAGMA foreign_keys=ON");

        // --- 2. RECREATE ESSENTIAL VIEWS WITH CORRECT SCHEMA ---

        // Financial Summary View (Corrected column names and types)
        await db.exec(`
            CREATE VIEW financial_summary_view AS
            SELECT 
                (SELECT SUM(debit_amount - credit_amount) FROM journal_details jd JOIN chart_of_accounts ca ON jd.account_code = ca.account_code WHERE ca.account_type = 'asset') as total_assets,
                (SELECT SUM(credit_amount - debit_amount) FROM journal_details jd JOIN chart_of_accounts ca ON jd.account_code = ca.account_code WHERE ca.account_type = 'liability') as total_liabilities,
                (SELECT SUM(credit_amount - debit_amount) FROM journal_details jd JOIN chart_of_accounts ca ON jd.account_code = ca.account_code WHERE ca.account_type = 'equity') as total_equity,
                (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices_count,
                CURRENT_DATE as report_date
        `);

        // v_trial_balance_live (Corrected join column, account columns, and status)
        await db.exec(`
            CREATE VIEW v_trial_balance_live AS
            SELECT 
                jd.account_code,
                ca.account_name,
                ca.account_type,
                SUM(jd.debit_amount) as total_debit,
                SUM(jd.credit_amount) as total_credit,
                SUM(jd.debit_amount) - SUM(jd.credit_amount) as net_balance
            FROM journal_details jd
            JOIN journal_entries je ON jd.journal_entry_id = je.id
            JOIN chart_of_accounts ca ON jd.account_code = ca.account_code
            WHERE je.status = 'POSTED'
            GROUP BY jd.account_code
        `);

        // v_financial_health (Corrected column names)
        await db.exec(`
            CREATE VIEW v_financial_health AS
            SELECT
                'LIQUIDITY' as metric_category, COUNT(DISTINCT je.id) as total_journal_entries,
                SUM(jd.debit_amount) as cash_inflows, SUM(jd.credit_amount) as cash_outflows,
                strftime('%Y-%m', je.entry_date) as period
            FROM journal_entries je
            JOIN journal_details jd ON je.id = jd.journal_entry_id
            WHERE jd.account_code LIKE '11%' 
                AND je.entry_date >= date('now', '-180 days')
            GROUP BY period
        `);
    },
    down: async (db: SQLiteEngine) => {
        // Rollback a estado anterior aproximado
        await db.exec("DROP VIEW IF EXISTS financial_summary_view");
        await db.exec("DROP VIEW IF EXISTS v_trial_balance_live");
        await db.exec("DROP VIEW IF EXISTS v_financial_health");

        await db.exec("PRAGMA foreign_keys=OFF");

        await db.exec(`
            CREATE TABLE journal_entries_old (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_date DATE NOT NULL,
                reference TEXT,
                description TEXT,
                notes TEXT,
                total_debit DECIMAL(15, 2) NOT NULL CHECK(total_debit >= 0),
                total_credit DECIMAL(15, 2) NOT NULL CHECK(total_credit >= 0),
                is_balanced BOOLEAN GENERATED ALWAYS AS(total_debit = total_credit) STORED,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER REFERENCES users(id) DEFAULT 1,
                updated_by INTEGER REFERENCES users(id) DEFAULT 1,
                verified_by INTEGER REFERENCES users(id),
                verified_at DATETIME
            )
        `);

        await db.exec(`
            INSERT INTO journal_entries_old (
                id, entry_date, reference, description, notes, 
                total_debit, total_credit, created_at, updated_at, 
                created_by, updated_by, verified_by, verified_at
            )
            SELECT 
                id, entry_date, reference, description, notes, 
                total_debit, total_credit, created_at, updated_at, 
                created_by, updated_by, verified_by, verified_at
            FROM journal_entries
        `);

        await db.exec("DROP TABLE journal_entries");
        await db.exec("ALTER TABLE journal_entries_old RENAME TO journal_entries");
        await db.exec("PRAGMA foreign_keys=ON");
    }
};
