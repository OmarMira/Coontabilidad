import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 012: Budgets Module
 * 
 * Implements comprehensive Budget management system with:
 * - Budget master records with approval workflow
 * - Budget lines linked to Chart of Accounts
 * - Monthly/Quarterly period breakdowns
 * - Variance analysis integration with journal entries
 * 
 * Standards: US GAAP, Annual budgeting with monthly distribution
 */
export const BudgetsSchema: Migration = {
    version: 12,
    name: 'Budgets Module Schema',
    up: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 012: Creating Budgets schema...');

        // ==========================================
        // TABLE 1: BUDGETS (Master)
        // ==========================================
        await db.exec(`
            CREATE TABLE IF NOT EXISTS budgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                budget_name TEXT NOT NULL,
                fiscal_year INTEGER NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                
                -- Status workflow
                status TEXT NOT NULL DEFAULT 'DRAFT' 
                    CHECK(status IN ('DRAFT', 'APPROVED', 'ACTIVE', 'CLOSED')),
                
                -- Totals (INTEGER cents for monetary values)
                total_budget_amount INTEGER NOT NULL DEFAULT 0 CHECK(total_budget_amount >= 0),
                
                -- Categorization
                department TEXT,
                notes TEXT,
                
                -- Audit trail
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                updated_by INTEGER,
                approved_by INTEGER,
                approved_at DATETIME,
                
                UNIQUE(budget_name, fiscal_year),
                FOREIGN KEY (created_by) REFERENCES users(id),
                FOREIGN KEY (updated_by) REFERENCES users(id),
                FOREIGN KEY (approved_by) REFERENCES users(id)
            )
        `);

        // ==========================================
        // TABLE 2: BUDGET_LINES (Detail per Account)
        // ==========================================
        await db.exec(`
            CREATE TABLE IF NOT EXISTS budget_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                budget_id INTEGER NOT NULL,
                account_number INTEGER NOT NULL,
                
                -- Annual amount (INTEGER cents)
                annual_amount INTEGER NOT NULL CHECK(annual_amount >= 0),
                
                -- Distribution method
                distribution_type TEXT NOT NULL DEFAULT 'EQUAL' 
                    CHECK(distribution_type IN ('EQUAL', 'CUSTOM', 'ZERO')),
                
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE,
                FOREIGN KEY (account_number) REFERENCES chart_of_accounts(account_number),
                
                UNIQUE(budget_id, account_number)
            )
        `);

        // ==========================================
        // TABLE 3: BUDGET_PERIODS (Monthly/Quarterly Breakdown)
        // ==========================================
        await db.exec(`
            CREATE TABLE IF NOT EXISTS budget_periods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                budget_line_id INTEGER NOT NULL,
                period_type TEXT NOT NULL CHECK(period_type IN ('MONTHLY', 'QUARTERLY')),
                period_number INTEGER NOT NULL CHECK(period_number BETWEEN 1 AND 12),
                period_start_date DATE NOT NULL,
                period_end_date DATE NOT NULL,
                
                -- Budgeted amount for this period (INTEGER cents)
                budgeted_amount INTEGER NOT NULL DEFAULT 0 CHECK(budgeted_amount >= 0),
                
                -- Actuals (calculated dynamically from journal_entries)
                actual_amount INTEGER DEFAULT 0,
                variance INTEGER DEFAULT 0,
                variance_percent REAL DEFAULT 0,
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (budget_line_id) REFERENCES budget_lines(id) ON DELETE CASCADE,
                
                UNIQUE(budget_line_id, period_number)
            )
        `);

        // ==========================================
        // INDEXES
        // ==========================================
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_budgets_year ON budgets(fiscal_year)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_budget_lines_account ON budget_lines(account_number)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_budget_periods_dates ON budget_periods(period_start_date, period_end_date)`);

        console.log('✅ Migration 012: Budgets schema created successfully');
        console.log('   - Created 3 tables: budgets, budget_lines, budget_periods');
        console.log('   - Added 4 indexes for query optimization');
    },

    down: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 012: Rolling back Budgets schema...');

        // Drop tables in reverse dependency order
        await db.exec(`DROP TABLE IF EXISTS budget_periods`);
        await db.exec(`DROP TABLE IF EXISTS budget_lines`);
        await db.exec(`DROP TABLE IF EXISTS budgets`);

        console.log('✅ Migration 012: Rollback complete');
    }
};
