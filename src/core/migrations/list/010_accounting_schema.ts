import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 010: US GAAP Accounting Schema with Immutability
 * 
 * Creates the complete double-entry bookkeeping system with:
 * - Chart of Accounts (US GAAP 1xxx-5xxx structure)
 * - Journal Entries (immutable once posted)
 * - Ledger Lines (immutable once posted)
 * - SQL Triggers to enforce immutability
 * 
 * CRITICAL: Once a journal entry is Posted, it CANNOT be deleted or modified.
 * Corrections must be made via reversal entries (Storno method).
 */
export const AccountingSchemaMigration: Migration = {
    version: 10,
    name: 'US GAAP Accounting Schema with Immutability',
    up: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 010: Creating US GAAP accounting schema...');

        // ==========================================
        // 1. CHART OF ACCOUNTS (Enhanced)
        // ==========================================
        await db.exec(`
            CREATE TABLE IF NOT EXISTS chart_of_accounts (
                code TEXT PRIMARY KEY,  -- e.g., '1010', '4010'
                name TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
                subtype TEXT,  -- e.g., 'Current Asset', 'Fixed Asset'
                parent_code TEXT,
                normal_balance TEXT CHECK(normal_balance IN ('DEBIT', 'CREDIT')),
                is_active BOOLEAN DEFAULT 1,
                is_system BOOLEAN DEFAULT 0,  -- System accounts cannot be deleted
                description TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_code) REFERENCES chart_of_accounts(code)
            )
        `);

        // ==========================================
        // 2. JOURNAL ENTRIES (Immutable)
        // ==========================================
        await db.exec(`
            CREATE TABLE IF NOT EXISTS journal_entries (
                id TEXT PRIMARY KEY,  -- UUID format
                entry_date DATE NOT NULL,
                description TEXT NOT NULL,
                reference_type TEXT,  -- 'INVOICE', 'PAYMENT', 'ADJUSTMENT', etc.
                reference_id TEXT,  -- ID of the referenced entity
                logic_clock INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'POSTED', 'VOID')),
                posted_at DATETIME,
                posted_by TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by TEXT,
                notes TEXT
            )
        `);

        // ==========================================
        // 3. LEDGER LINES (Immutable)
        // ==========================================
        await db.exec(`
            CREATE TABLE IF NOT EXISTS ledger_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                journal_entry_id TEXT NOT NULL,
                account_code TEXT NOT NULL,
                debit INTEGER DEFAULT 0,  -- INTEGER cents
                credit INTEGER DEFAULT 0,  -- INTEGER cents
                description TEXT,
                logic_clock INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
                FOREIGN KEY (account_code) REFERENCES chart_of_accounts(code)
            )
        `);

        // ==========================================
        // 4. IMMUTABILITY TRIGGERS
        // ==========================================

        // Prevent DELETE on Posted journal entries
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS prevent_journal_delete
            BEFORE DELETE ON journal_entries
            FOR EACH ROW
            WHEN OLD.status = 'POSTED'
            BEGIN
                SELECT RAISE(ABORT, 'Cannot delete POSTED journal entry. Use reversal entry instead.');
            END
        `);

        // Prevent UPDATE on Posted journal entries (except status changes to VOID)
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS prevent_journal_update
            BEFORE UPDATE ON journal_entries
            FOR EACH ROW
            WHEN OLD.status = 'POSTED' AND NEW.status != 'VOID'
            BEGIN
                SELECT RAISE(ABORT, 'Cannot modify POSTED journal entry. Use reversal entry instead.');
            END
        `);

        // Prevent DELETE on ledger lines if journal entry is Posted
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS prevent_ledger_delete
            BEFORE DELETE ON ledger_lines
            FOR EACH ROW
            WHEN (SELECT status FROM journal_entries WHERE id = OLD.journal_entry_id) = 'POSTED'
            BEGIN
                SELECT RAISE(ABORT, 'Cannot delete ledger line from POSTED journal entry.');
            END
        `);

        // Prevent UPDATE on ledger lines if journal entry is Posted
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS prevent_ledger_update
            BEFORE UPDATE ON ledger_lines
            FOR EACH ROW
            WHEN (SELECT status FROM journal_entries WHERE id = OLD.journal_entry_id) = 'POSTED'
            BEGIN
                SELECT RAISE(ABORT, 'Cannot modify ledger line from POSTED journal entry.');
            END
        `);

        // ==========================================
        // 5. SEED US GAAP CHART OF ACCOUNTS
        // ==========================================

        // ASSETS (1xxx)
        const assetAccounts = [
            { code: '1000', name: 'ASSETS', type: 'ASSET', subtype: 'Header', parent: null, balance: 'DEBIT', system: 1 },
            { code: '1010', name: 'Cash', type: 'ASSET', subtype: 'Current Asset', parent: '1000', balance: 'DEBIT', system: 1 },
            { code: '1020', name: 'Accounts Receivable', type: 'ASSET', subtype: 'Current Asset', parent: '1000', balance: 'DEBIT', system: 1 },
            { code: '1030', name: 'Inventory', type: 'ASSET', subtype: 'Current Asset', parent: '1000', balance: 'DEBIT', system: 1 },
            { code: '1040', name: 'Prepaid Expenses', type: 'ASSET', subtype: 'Current Asset', parent: '1000', balance: 'DEBIT', system: 1 },
            { code: '1500', name: 'Fixed Assets', type: 'ASSET', subtype: 'Fixed Asset', parent: '1000', balance: 'DEBIT', system: 1 },
            { code: '1510', name: 'Equipment', type: 'ASSET', subtype: 'Fixed Asset', parent: '1500', balance: 'DEBIT', system: 1 },
            { code: '1520', name: 'Accumulated Depreciation - Equipment', type: 'ASSET', subtype: 'Contra Asset', parent: '1500', balance: 'CREDIT', system: 1 },
        ];

        // LIABILITIES (2xxx)
        const liabilityAccounts = [
            { code: '2000', name: 'LIABILITIES', type: 'LIABILITY', subtype: 'Header', parent: null, balance: 'CREDIT', system: 1 },
            { code: '2010', name: 'Accounts Payable', type: 'LIABILITY', subtype: 'Current Liability', parent: '2000', balance: 'CREDIT', system: 1 },
            { code: '2020', name: 'Sales Tax Payable', type: 'LIABILITY', subtype: 'Current Liability', parent: '2000', balance: 'CREDIT', system: 1 },
            { code: '2030', name: 'Accrued Expenses', type: 'LIABILITY', subtype: 'Current Liability', parent: '2000', balance: 'CREDIT', system: 1 },
            { code: '2100', name: 'Long-term Debt', type: 'LIABILITY', subtype: 'Long-term Liability', parent: '2000', balance: 'CREDIT', system: 1 },
        ];

        // EQUITY (3xxx)
        const equityAccounts = [
            { code: '3000', name: 'EQUITY', type: 'EQUITY', subtype: 'Header', parent: null, balance: 'CREDIT', system: 1 },
            { code: '3010', name: 'Owner\'s Capital', type: 'EQUITY', subtype: 'Capital', parent: '3000', balance: 'CREDIT', system: 1 },
            { code: '3020', name: 'Retained Earnings', type: 'EQUITY', subtype: 'Retained Earnings', parent: '3000', balance: 'CREDIT', system: 1 },
            { code: '3030', name: 'Owner\'s Drawings', type: 'EQUITY', subtype: 'Drawings', parent: '3000', balance: 'DEBIT', system: 1 },
        ];

        // REVENUE (4xxx)
        const revenueAccounts = [
            { code: '4000', name: 'REVENUE', type: 'REVENUE', subtype: 'Header', parent: null, balance: 'CREDIT', system: 1 },
            { code: '4010', name: 'Sales Revenue', type: 'REVENUE', subtype: 'Operating Revenue', parent: '4000', balance: 'CREDIT', system: 1 },
            { code: '4020', name: 'Service Revenue', type: 'REVENUE', subtype: 'Operating Revenue', parent: '4000', balance: 'CREDIT', system: 1 },
            { code: '4900', name: 'Other Income', type: 'REVENUE', subtype: 'Non-Operating Revenue', parent: '4000', balance: 'CREDIT', system: 1 },
        ];

        // EXPENSES (5xxx)
        const expenseAccounts = [
            { code: '5000', name: 'EXPENSES', type: 'EXPENSE', subtype: 'Header', parent: null, balance: 'DEBIT', system: 1 },
            { code: '5010', name: 'Cost of Goods Sold', type: 'EXPENSE', subtype: 'COGS', parent: '5000', balance: 'DEBIT', system: 1 },
            { code: '5100', name: 'Salaries & Wages', type: 'EXPENSE', subtype: 'Operating Expense', parent: '5000', balance: 'DEBIT', system: 1 },
            { code: '5110', name: 'Rent Expense', type: 'EXPENSE', subtype: 'Operating Expense', parent: '5000', balance: 'DEBIT', system: 1 },
            { code: '5120', name: 'Utilities Expense', type: 'EXPENSE', subtype: 'Operating Expense', parent: '5000', balance: 'DEBIT', system: 1 },
            { code: '5130', name: 'Depreciation Expense', type: 'EXPENSE', subtype: 'Operating Expense', parent: '5000', balance: 'DEBIT', system: 1 },
            { code: '5900', name: 'Other Expenses', type: 'EXPENSE', subtype: 'Non-Operating Expense', parent: '5000', balance: 'DEBIT', system: 1 },
        ];

        // Insert all accounts
        const allAccounts = [
            ...assetAccounts,
            ...liabilityAccounts,
            ...equityAccounts,
            ...revenueAccounts,
            ...expenseAccounts
        ];

        for (const account of allAccounts) {
            await db.run(`
                INSERT OR IGNORE INTO chart_of_accounts (code, name, type, subtype, parent_code, normal_balance, is_system)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [account.code, account.name, account.type, account.subtype, account.parent, account.balance, account.system]);
        }

        console.log(`  ✓ Created ${allAccounts.length} US GAAP accounts`);
        console.log('  ✓ Immutability triggers installed');
        console.log('✅ Migration 010: Accounting schema ready');
    },

    down: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 010: Removing accounting schema...');

        // Drop triggers first
        await db.exec(`DROP TRIGGER IF EXISTS prevent_ledger_update`);
        await db.exec(`DROP TRIGGER IF EXISTS prevent_ledger_delete`);
        await db.exec(`DROP TRIGGER IF EXISTS prevent_journal_update`);
        await db.exec(`DROP TRIGGER IF EXISTS prevent_journal_delete`);

        // Drop tables
        await db.exec(`DROP TABLE IF EXISTS ledger_lines`);
        await db.exec(`DROP TABLE IF EXISTS journal_entries`);
        await db.exec(`DROP TABLE IF EXISTS chart_of_accounts`);

        console.log('✅ Migration 010: Accounting schema removed');
    }
};
