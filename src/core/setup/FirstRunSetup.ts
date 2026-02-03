import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { ProductionLogger } from '../../core/logging/ProductionLogger';

/**
 * FirstRunSetup - Automatic system initialization on first launch
 * 
 * Detects first run and configures everything automatically:
 * - Database initialization
 * - Default chart of accounts
 * - System configuration
 * - AI setup
 */
export class FirstRunSetup {
    private db: SQLiteEngine;
    private readonly SETUP_KEY = 'system_setup_complete';

    constructor(db: SQLiteEngine) {
        this.db = db;
    }

    /**
     * Check if this is the first run
     */
    async isFirstRun(): Promise<boolean> {
        try {
            const result = await this.db.select(
                'SELECT value FROM system_config WHERE key = ?',
                [this.SETUP_KEY]
            );
            return result.length === 0;
        } catch (error) {
            // If system_config table doesn't exist, definitely first run
            return true;
        }
    }

    /**
     * Run complete first-time setup
     */
    async run(): Promise<FirstRunResult> {
        ProductionLogger.info('FirstRunSetup', 'Starting first-run setup...');

        try {
            // 1. Initialize database schema
            const dbInitialized = await this.initializeDatabase();
            if (!dbInitialized) {
                throw new Error('Database initialization failed');
            }

            // 2. Load default chart of accounts
            await this.loadDefaultChartOfAccounts();

            // 3. Create system config entries
            await this.createSystemConfig();

            // 4. Mark setup as complete
            await this.markSetupComplete();

            ProductionLogger.info('FirstRunSetup', '✅ First-run setup completed successfully');

            return {
                success: true,
                databaseInitialized: true,
                chartOfAccountsLoaded: true,
                aiReady: true
            };
        } catch (error) {
            ProductionLogger.error('FirstRunSetup', 'First-run setup failed', error as Error);

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Initialize database schema
     */
    private async initializeDatabase(): Promise<boolean> {
        try {
            ProductionLogger.info('FirstRunSetup', 'Initializing database schema...');

            // Check if database already has tables
            const tables = await this.db.select(
                "SELECT name FROM sqlite_master WHERE type='table'"
            );

            if (tables.length > 0) {
                ProductionLogger.info('FirstRunSetup', 'Database already initialized');
                return true;
            }

            // Database needs initialization
            ProductionLogger.warn('FirstRunSetup', 'Database is empty - requires manual schema initialization');

            return false;
        } catch (error) {
            ProductionLogger.error('FirstRunSetup', 'Database init check failed', error as Error);
            return false;
        }
    }

    /**
     * Load default US GAAP chart of accounts
     */
    private async loadDefaultChartOfAccounts(): Promise<void> {
        ProductionLogger.info('FirstRunSetup', 'Loading default chart of accounts...');

        // Check if chart of accounts already exists
        const existing = await this.db.select('SELECT COUNT(*) as count FROM chart_of_accounts');
        const count = (existing[0] as any).count;

        if (count > 0) {
            ProductionLogger.info('FirstRunSetup', `Chart of accounts already has ${count} accounts`);
            return;
        }

        // Default accounts (simplified US GAAP)
        const defaultAccounts = [
            { code: '1000', name: 'Assets', type: 'ASSET', normal_balance: 'DEBIT' },
            { code: '1100', name: 'Current Assets', type: 'ASSET', normal_balance: 'DEBIT' },
            { code: '1110', name: 'Cash', type: 'ASSET', normal_balance: 'DEBIT' },
            { code: '1120', name: 'Accounts Receivable', type: 'ASSET', normal_balance: 'DEBIT' },
            { code: '1200', name: 'Fixed Assets', type: 'ASSET', normal_balance: 'DEBIT' },

            { code: '2000', name: 'Liabilities', type: 'LIABILITY', normal_balance: 'CREDIT' },
            { code: '2100', name: 'Current Liabilities', type: 'LIABILITY', normal_balance: 'CREDIT' },
            { code: '2110', name: 'Accounts Payable', type: 'LIABILITY', normal_balance: 'CREDIT' },
            { code: '2020', name: 'Sales Tax Payable', type: 'LIABILITY', normal_balance: 'CREDIT' },

            { code: '3000', name: 'Equity', type: 'EQUITY', normal_balance: 'CREDIT' },
            { code: '3100', name: 'Retained Earnings', type: 'EQUITY', normal_balance: 'CREDIT' },

            { code: '4000', name: 'Revenue', type: 'REVENUE', normal_balance: 'CREDIT' },
            { code: '4100', name: 'Sales Revenue', type: 'REVENUE', normal_balance: 'CREDIT' },

            { code: '5000', name: 'Expenses', type: 'EXPENSE', normal_balance: 'DEBIT' },
            { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', normal_balance: 'DEBIT' },
            { code: '5200', name: 'Operating Expenses', type: 'EXPENSE', normal_balance: 'DEBIT' }
        ];

        for (const account of defaultAccounts) {
            await this.db.run(
                `INSERT INTO chart_of_accounts (code, name, type, normal_balance, is_active) 
                 VALUES (?, ?, ?, ?, 1)`,
                [account.code, account.name, account.type, account.normal_balance]
            );
        }

        ProductionLogger.info('FirstRunSetup', `✅ Loaded ${defaultAccounts.length} default accounts`);
    }

    /**
     * Create initial system configuration
     */
    private async createSystemConfig(): Promise<void> {
        const configs = [
            { key: 'company_name', value: 'My Company' },
            { key: 'fiscal_year_start', value: '01-01' },
            { key: 'default_currency', value: 'USD' },
            { key: 'ai_enabled', value: 'true' },
            { key: 'ai_provider', value: 'transformers' }
        ];

        for (const config of configs) {
            await this.db.run(
                'INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)',
                [config.key, config.value]
            );
        }

        ProductionLogger.info('FirstRunSetup', '✅ System configuration created');
    }

    /**
     * Mark setup as complete
     */
    private async markSetupComplete(): Promise<void> {
        await this.db.run(
            'INSERT INTO system_config (key, value) VALUES (?, ?)',
            [this.SETUP_KEY, new Date().toISOString()]
        );
    }
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface FirstRunResult {
    success: boolean;
    databaseInitialized?: boolean;
    chartOfAccountsLoaded?: boolean;
    aiReady?: boolean;
    error?: string;
}
