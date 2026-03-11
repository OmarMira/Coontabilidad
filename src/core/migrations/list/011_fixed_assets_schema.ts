import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 011: Fixed Assets Module
 * 
 * Implements comprehensive Fixed Assets management system with:
 * - Asset categories with depreciation defaults
 * - Fixed assets lifecycle tracking (purchase → depreciation → disposal)
 * - Monthly depreciation entries
 * - Asset disposals with gain/loss calculations
 * - Full accounting integration
 * 
 * Standards: US GAAP, IRS Half-Month Convention
 * Methods: Straight-Line, Declining Balance 200%
 */
export const FixedAssetsSchema: Migration = {
    version: 11,
    name: 'Fixed Assets Module Schema',
    up: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 011: Creating Fixed Assets schema...');

        // ==========================================
        // TABLE 1: ASSET_CATEGORIES
        // ==========================================
        await db.exec(`
            CREATE TABLE IF NOT EXISTS asset_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                code TEXT NOT NULL UNIQUE,
                default_useful_life_months INTEGER NOT NULL,
                default_depreciation_method TEXT NOT NULL CHECK(default_depreciation_method IN ('STRAIGHT_LINE', 'DECLINING_BALANCE_200')),
                default_salvage_value_percent REAL DEFAULT 0,
                gl_asset_account INTEGER NOT NULL,
                gl_accumulated_dep_account INTEGER NOT NULL,
                gl_expense_account INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (gl_asset_account) REFERENCES chart_of_accounts(account_number),
                FOREIGN KEY (gl_accumulated_dep_account) REFERENCES chart_of_accounts(account_number),
                FOREIGN KEY (gl_expense_account) REFERENCES chart_of_accounts(account_number)
            )
        `);

        // ==========================================
        // TABLE 2: FIXED_ASSETS (Replace existing)
        // ==========================================
        // Drop old table if exists (from DatabaseService.ts legacy)
        await db.exec(`DROP TABLE IF EXISTS fixed_assets_old`);
        await db.exec(`ALTER TABLE fixed_assets RENAME TO fixed_assets_old`).catch(() => {
            // Table doesn't exist, continue
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS fixed_assets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_tag TEXT NOT NULL UNIQUE,
                asset_name TEXT NOT NULL,
                description TEXT,
                category_id INTEGER NOT NULL,
                
                -- Purchase details (INTEGER cents for monetary values)
                purchase_date DATE NOT NULL,
                purchase_cost INTEGER NOT NULL CHECK(purchase_cost > 0),
                salvage_value INTEGER DEFAULT 0,
                vendor_id INTEGER,
                
                -- Depreciation config
                useful_life_months INTEGER NOT NULL,
                depreciation_method TEXT NOT NULL CHECK(depreciation_method IN ('STRAIGHT_LINE', 'DECLINING_BALANCE_200')),
                start_depreciation_date DATE,
                
                -- Status tracking
                status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACTIVE', 'FULLY_DEPRECIATED', 'DISPOSED')),
                
                -- Disposal details (nullable until disposed)
                disposal_date DATE,
                disposal_method TEXT CHECK(disposal_method IN ('SALE', 'RETIREMENT', 'TRADE_IN', 'LOST')),
                disposal_amount INTEGER,
                
                -- Calculated fields (INTEGER cents)
                total_accumulated_depreciation INTEGER DEFAULT 0,
                net_book_value INTEGER,
                
                -- Journal entry references
                purchase_entry_id INTEGER,
                disposal_entry_id INTEGER,
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (category_id) REFERENCES asset_categories(id),
                FOREIGN KEY (vendor_id) REFERENCES suppliers(id),
                FOREIGN KEY (purchase_entry_id) REFERENCES journal_entries(id),
                FOREIGN KEY (disposal_entry_id) REFERENCES journal_entries(id)
            )
        `);

        // ==========================================
        // TABLE 3: ASSET_DEPRECIATION (Replace existing)
        // ==========================================
        await db.exec(`DROP TABLE IF EXISTS asset_depreciation_old`);
        await db.exec(`ALTER TABLE asset_depreciation RENAME TO asset_depreciation_old`).catch(() => {
            // Table doesn't exist, continue
        });

        await db.exec(`
            CREATE TABLE IF NOT EXISTS asset_depreciation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                period_date DATE NOT NULL,
                depreciation_amount INTEGER NOT NULL CHECK(depreciation_amount >= 0),
                accumulated_depreciation INTEGER NOT NULL,
                net_book_value INTEGER NOT NULL,
                
                -- Calculation metadata
                calculation_method TEXT NOT NULL,
                is_partial_month BOOLEAN DEFAULT FALSE,
                
                -- Journal entry reference
                journal_entry_id INTEGER,
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (asset_id) REFERENCES fixed_assets(id) ON DELETE CASCADE,
                FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
                
                UNIQUE(asset_id, period_date)
            )
        `);

        // ==========================================
        // TABLE 4: ASSET_DISPOSALS
        // ==========================================
        await db.exec(`
            CREATE TABLE IF NOT EXISTS asset_disposals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                asset_id INTEGER NOT NULL,
                disposal_date DATE NOT NULL,
                disposal_method TEXT NOT NULL CHECK(disposal_method IN ('SALE', 'RETIREMENT', 'TRADE_IN', 'LOST')),
                
                -- Financial details (INTEGER cents)
                original_cost INTEGER NOT NULL,
                accumulated_depreciation INTEGER NOT NULL,
                net_book_value INTEGER NOT NULL,
                disposal_proceeds INTEGER DEFAULT 0,
                gain_loss INTEGER NOT NULL,
                
                -- Journal entry reference
                journal_entry_id INTEGER,
                
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (asset_id) REFERENCES fixed_assets(id),
                FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id)
            )
        `);

        // ==========================================
        // INDEXES
        // ==========================================
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_assets_status ON fixed_assets(status)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_assets_category ON fixed_assets(category_id)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_assets_purchase_date ON fixed_assets(purchase_date)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_depreciation_period ON asset_depreciation(period_date)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_depreciation_asset ON asset_depreciation(asset_id)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_disposals_date ON asset_disposals(disposal_date)`);

        // ==========================================
        // SEED DEFAULT CATEGORIES
        // ==========================================
        const defaultCategories = [
            ['VEH', 'Vehicles', 60, 'DECLINING_BALANCE_200', 0, 1600, 1650, 5400],
            ['EQP', 'Equipment', 84, 'STRAIGHT_LINE', 0, 1600, 1650, 5400],
            ['BLD', 'Buildings', 468, 'STRAIGHT_LINE', 0, 1600, 1650, 5400], // 39 years
            ['FUR', 'Furniture', 84, 'STRAIGHT_LINE', 0, 1600, 1650, 5400],
            ['CMP', 'Computers', 60, 'DECLINING_BALANCE_200', 0, 1600, 1650, 5400],
            ['LHI', 'Leasehold Improvements', 120, 'STRAIGHT_LINE', 0, 1600, 1650, 5400] // 10 years default
        ];

        for (const cat of defaultCategories) {
            await db.exec(`
                INSERT OR IGNORE INTO asset_categories 
                (code, name, default_useful_life_months, default_depreciation_method, default_salvage_value_percent, 
                 gl_asset_account, gl_accumulated_dep_account, gl_expense_account)
                VALUES ('${cat[0]}', '${cat[1]}', ${cat[2]}, '${cat[3]}', ${cat[4]}, ${cat[5]}, ${cat[6]}, ${cat[7]})
            `);
        }

        // ── Iron Core: Anti-Tamper Triggers ───────────────────────────────────
        // fixed_assets and asset_depreciation are guaranteed to exist at this point.
        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS protect_asset_financials
            BEFORE UPDATE OF purchase_cost, purchase_date, depreciation_method ON fixed_assets
            BEGIN
                SELECT RAISE(ABORT, 'FORENSIC ALERT: Fixed Asset financial data is immutable.');
            END;
        `);

        await db.exec(`
            CREATE TRIGGER IF NOT EXISTS prevent_depreciation_tamper
            BEFORE UPDATE ON asset_depreciation
            BEGIN
                SELECT RAISE(ABORT, 'FORENSIC ALERT: Depreciation records are immutable.');
            END;
        `);

        console.log('✅ Migration 011: Fixed Assets schema created successfully');
        console.log('   - Created 4 tables: asset_categories, fixed_assets, asset_depreciation, asset_disposals');
        console.log('   - Added 6 indexes for query optimization');
        console.log('   - Seeded 6 default asset categories');
        console.log('   - Iron Core: protect_asset_financials trigger active');
    },

    down: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 011: Rolling back Fixed Assets schema...');

        // Drop tables in reverse dependency order
        await db.exec(`DROP TABLE IF EXISTS asset_disposals`);
        await db.exec(`DROP TABLE IF EXISTS asset_depreciation`);
        await db.exec(`DROP TABLE IF EXISTS fixed_assets`);
        await db.exec(`DROP TABLE IF EXISTS asset_categories`);

        // Restore old tables if they exist
        await db.exec(`ALTER TABLE fixed_assets_old RENAME TO fixed_assets`).catch(() => { });
        await db.exec(`ALTER TABLE asset_depreciation_old RENAME TO asset_depreciation`).catch(() => { });

        console.log('✅ Migration 011: Rollback complete');
    }
};
