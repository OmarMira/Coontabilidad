import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const AccountingSchemaMigration: Migration = {
    version: 5,
    name: 'Advanced Accounting Schema',
    up: async (db: SQLiteEngine) => {

        // 1. Accounting Periods (Fiscal Periods)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS accounting_periods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL, -- e.g. "January 2024"
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status TEXT DEFAULT 'open', -- open, closed, locked
                locked_by INTEGER,
                locked_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Account Balances (Historical Snapshots for performance)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS account_balances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_code TEXT NOT NULL,
                period_id INTEGER NOT NULL,
                opening_balance DECIMAL(12,2) DEFAULT 0.00,
                debit_total DECIMAL(12,2) DEFAULT 0.00,
                credit_total DECIMAL(12,2) DEFAULT 0.00,
                closing_balance DECIMAL(12,2) DEFAULT 0.00,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (period_id) REFERENCES accounting_periods(id)
            )
        `);

        // 3. Budgets (Presupuestos) - Optional but good for complete ERP
        await db.exec(`
            CREATE TABLE IF NOT EXISTS budget_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_code TEXT NOT NULL,
                period_id INTEGER NOT NULL,
                amount DECIMAL(12,2) NOT NULL,
                FOREIGN KEY (period_id) REFERENCES accounting_periods(id)
            )
        `);

        // 4. View: Trial Balance Live (Detailed)
        // Aggregates all posted journal entries
        await db.exec(`
            CREATE VIEW IF NOT EXISTS v_trial_balance_live AS
            SELECT 
                jd.account_code,
                ca.name as account_name,
                ca.type as account_type,
                SUM(jd.debit) as total_debit,
                SUM(jd.credit) as total_credit,
                SUM(jd.debit) - SUM(jd.credit) as net_balance
            FROM journal_details jd
            JOIN journal_entries je ON jd.journal_id = je.id
            JOIN chart_of_accounts ca ON jd.account_code = ca.code
            WHERE je.status = 'posted'
            GROUP BY jd.account_code;
        `);
    },

    down: async (db: SQLiteEngine) => {
        await db.exec("DROP VIEW IF EXISTS v_trial_balance_live");
        await db.exec("DROP TABLE IF EXISTS budget_entries");
        await db.exec("DROP TABLE IF EXISTS account_balances");
        await db.exec("DROP TABLE IF EXISTS accounting_periods");
    }
};
