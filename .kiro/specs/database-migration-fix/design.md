# Design Document: Database Migration System Fix

## Overview

This design implements a comprehensive fix for the database initialization system by integrating the existing MigrationEngine into the startup flow, eliminating legacy schema duplication, and ensuring all required tables are created consistently. The solution addresses the root cause of missing tables (`sys_migrations`, `fixed_assets`, `asset_depreciation`, `florida_tax_config`, `tax_transactions`) that cause IRON CORE VERIFICATION failures.

## Architecture

### Current Architecture (Broken)

```
initDB()
  ├─> initializeSchema(db)          // Creates ~40 tables manually
  ├─> DatabaseInitializer.initializeWithFix(db)  // Only repairs
  └─> ❌ MigrationEngine NEVER CALLED
```

**Problems:**
- MigrationEngine exists with 12 migrations but never executes
- `sys_migrations` table never created
- Fixed Assets tables (011) never created
- Budgets tables (012) never created
- Three competing initialization systems

### New Architecture (Fixed)

```
initDB()
  ├─> Create SQLiteEngine wrapper
  ├─> MigrationEngine.getInstance().migrate(dbEngine)  // ✅ NEW
  │     ├─> ensureMigrationTable()
  │     ├─> getCurrentVersion()
  │     ├─> Execute pending migrations (1-12)
  │     └─> Record each in sys_migrations
  ├─> initializeLegacyTables(db)  // Only non-migrated tables
  ├─> DatabaseInitializer.initializeWithFix(db)  // Repair if needed
  ├─> validateRequiredTables(dbEngine)  // ✅ NEW
  └─> setupAutoSave()
```

**Benefits:**
- Single source of truth for schema (migrations)
- All tables created consistently
- Version tracking in `sys_migrations`
- Atomic execution with rollback
- Validation ensures completeness

## Components and Interfaces

### 1. Modified `initDB()` Function

**Location:** `src/database/simple-db.ts`

**Changes:**
```typescript
export const initDB = async (password?: string): Promise<any> => {
  if (isInitialized && db) {
    return db;
  }

  try {
    logger.info('Database', 'init_start', 'Iniciando inicialización de base de datos SQLite');

    // ... existing encryption setup ...

    // Inicializar sql.js
    const SQL = await initSqlJs({ /* ... */ });
    const dbData = await loadFromLocalStorage();
    
    if (!db) {
      db = new SQL.Database(dbData || undefined);
    }

    // Crear instancia de SQLiteEngine
    dbEngine = new SQLiteEngine();
    dbEngine.setDB(db);
    logger.info('Database', 'engine_initialized', 'SQLiteEngine wrapper creado exitosamente');

    // ✅ NEW: Execute migrations FIRST
    await executeMigrations(dbEngine);

    // Execute legacy schema for non-migrated tables only
    await initializeLegacyTables(db);

    // Repair any issues
    await DatabaseInitializer.initializeWithFix(db);

    // ✅ NEW: Validate all required tables exist
    await validateRequiredTables(dbEngine);

    // Configure auto-save
    setupAutoSave();

    return db;
  } catch (error) {
    logger.error('Database', 'init_failed', 'Error fatal en inicialización', { error });
    throw error;
  } finally {
    isInitialized = true;
  }
};
```

### 2. New `executeMigrations()` Function

**Location:** `src/database/simple-db.ts`

**Purpose:** Wrapper to execute MigrationEngine with proper error handling

```typescript
/**
 * Execute all pending database migrations
 * @throws Error if migrations fail
 */
async function executeMigrations(engine: SQLiteEngine): Promise<void> {
  try {
    logger.info('Database', 'migrations_start', 'Ejecutando migraciones de base de datos...');
    
    const migrationEngine = MigrationEngine.getInstance();
    await migrationEngine.migrate(engine);
    
    // Get final version
    const version = await engine.select('SELECT MAX(version) as version FROM sys_migrations');
    const currentVersion = version[0]?.version || 0;
    
    logger.info('Database', 'migrations_complete', `Migraciones completadas. Versión actual: ${currentVersion}`);
  } catch (error: any) {
    logger.error('Database', 'migrations_failed', 'Error crítico en migraciones', { error: error.message });
    throw new Error(`Database migration failed: ${error.message}`);
  }
}
```

### 3. New `initializeLegacyTables()` Function

**Location:** `src/database/simple-db.ts`

**Purpose:** Create only tables NOT covered by migrations

```typescript
/**
 * Initialize legacy tables that are not yet covered by migrations
 * This function will be phased out as more migrations are created
 */
async function initializeLegacyTables(db: any): Promise<void> {
  logger.info('Database', 'legacy_tables_start', 'Creando tablas legacy no migradas...');
  
  // IMPORTANT: Only create tables that DON'T have migrations
  // Current migrations cover:
  // - 001: customers, suppliers, products, invoices, payments, etc.
  // - 003: inventory tables
  // - 004: purchasing tables
  // - 005: accounting/chart_of_accounts
  // - 006: system tables (users, roles, audit)
  // - 007: fiscal year, currency fixes
  // - 008: historical data fixes
  // - 009: florida_tax_rates (NOT florida_tax_config)
  // - 010: multi-user schema
  // - 011: fixed_assets, asset_depreciation, asset_categories
  // - 012: budgets
  
  // Tables that still need migrations (to be created here temporarily):
  // - tax_transactions (will be migrated in 013)
  // - Any other tables not in migrations
  
  // For now, this function is mostly empty since migrations cover everything
  // We'll add tax_transactions migration next
  
  logger.info('Database', 'legacy_tables_complete', 'Tablas legacy creadas');
}
```

### 4. New `validateRequiredTables()` Function

**Location:** `src/database/simple-db.ts`

**Purpose:** Validate all critical tables exist after initialization

```typescript
/**
 * Validate that all required tables exist after initialization
 * @throws Error if any required table is missing
 */
async function validateRequiredTables(engine: SQLiteEngine): Promise<void> {
  logger.info('Database', 'validation_start', 'Validando tablas requeridas...');
  
  const requiredTables = [
    'sys_migrations',
    'customers',
    'suppliers',
    'products',
    'invoices',
    'chart_of_accounts',
    'journal_entries',
    'fixed_assets',
    'asset_depreciation',
    'asset_categories',
    'florida_tax_rates',
    'tax_transactions',
    'budgets',
    'budget_items',
    'users',
    'user_roles'
  ];
  
  const missingTables: string[] = [];
  
  for (const tableName of requiredTables) {
    const result = await engine.select(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    
    if (result.length === 0) {
      missingTables.push(tableName);
    }
  }
  
  if (missingTables.length > 0) {
    const errorMsg = `Missing required tables: ${missingTables.join(', ')}`;
    logger.error('Database', 'validation_failed', errorMsg);
    throw new Error(errorMsg);
  }
  
  logger.info('Database', 'validation_complete', `Validación exitosa. ${requiredTables.length} tablas verificadas.`);
}
```

### 5. New Migration 013: Tax Transactions

**Location:** `src/core/migrations/list/013_tax_transactions.ts`

**Purpose:** Create the missing `tax_transactions` table

```typescript
import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 013: Tax Transactions Table
 * 
 * Creates the tax_transactions table for tracking sales tax on invoices.
 * Supports Florida county-level tax tracking and compliance reporting.
 */
export const TaxTransactionsMigration: Migration = {
    version: 13,
    name: 'Tax Transactions Table',
    up: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 013: Creating tax_transactions table...');

        await db.exec(`
            CREATE TABLE IF NOT EXISTS tax_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                transaction_date DATE NOT NULL,
                county TEXT NOT NULL,
                taxable_amount INTEGER NOT NULL,  -- in cents
                state_tax_amount INTEGER NOT NULL,  -- in cents
                county_tax_amount INTEGER NOT NULL,  -- in cents
                total_tax_amount INTEGER NOT NULL,  -- in cents
                state_rate REAL NOT NULL,
                county_rate REAL NOT NULL,
                total_rate REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        `);

        // Create indexes for performance
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_invoice ON tax_transactions(invoice_id)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_date ON tax_transactions(transaction_date)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_tax_trans_county ON tax_transactions(county)`);

        console.log('✅ Migration 013: tax_transactions table created');
    },

    down: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 013: Dropping tax_transactions table...');
        await db.exec(`DROP TABLE IF EXISTS tax_transactions`);
        console.log('✅ Migration 013: Rollback complete');
    }
};
```

### 6. Update MigrationEngine to Include Migration 013

**Location:** `src/core/migrations/MigrationEngine.ts`

**Changes:**
```typescript
import { TaxTransactionsMigration } from './list/013_tax_transactions';

export class MigrationEngine {
    private migrations: Migration[] = [
        InitialSchemaMigration,
        AIViewsMigration,
        InventorySchemaMigration,
        PurchasingSchemaMigration,
        AccountingSchemaMigration,
        SystemSchemaMigration,
        CurrencyFixAndFiscalMigration,
        new HistoricalDataFixMigration(),
        new PerformanceIndicesMigration(),
        MultiUserSchemaMigration,
        FixedAssetsSchema,
        BudgetsSchema,
        TaxTransactionsMigration  // ✅ NEW
    ];
    // ... rest of class
}
```

### 7. Resolve Florida Tax Table Naming Conflict

**Decision:** Use `florida_tax_rates` (already in migration 009)

**Rationale:**
- Migration 009 already creates and populates `florida_tax_rates`
- Contains all 67 Florida counties with 2025-2026 rates
- More descriptive name (rates vs config)
- Already has data seeded

**Actions Required:**
1. Remove `florida_tax_config` creation from `DatabaseService.ts`
2. Remove `florida_tax_config` creation from `EmergencyInitializer.ts`
3. Update all code references from `florida_tax_config` to `florida_tax_rates`
4. Remove duplicate `florida_tax_rates` creation from `simple-db.ts` line 1910

**Files to Update:**
- `src/database/DatabaseService.ts` (remove CREATE TABLE florida_tax_config)
- `src/database/EmergencyInitializer.ts` (remove CREATE TABLE florida_tax_config)
- `src/database/simple-db.ts` (remove duplicate florida_tax_rates creation)
- Any service files querying `florida_tax_config` → change to `florida_tax_rates`

### 8. Remove Legacy Schema Duplication

**Tables to Remove from `initializeSchema()`:**

All tables covered by migrations should be removed from manual creation:

- ✅ Migration 001: customers, suppliers, products, invoices, payments, product_categories, invoice_lines
- ✅ Migration 003: inventory tables
- ✅ Migration 004: purchasing tables  
- ✅ Migration 005: chart_of_accounts, journal_entries, journal_entry_items
- ✅ Migration 006: users, user_roles, audit_trail
- ✅ Migration 009: florida_tax_rates
- ✅ Migration 010: multi-user columns
- ✅ Migration 011: fixed_assets, asset_depreciation, asset_categories, asset_disposals
- ✅ Migration 012: budgets, budget_items

**Result:** `initializeSchema()` becomes `initializeLegacyTables()` and is nearly empty

## Data Models

### sys_migrations Table

```sql
CREATE TABLE sys_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**Purpose:** Track which migrations have been applied

### tax_transactions Table

```sql
CREATE TABLE tax_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    county TEXT NOT NULL,
    taxable_amount INTEGER NOT NULL,  -- in cents
    state_tax_amount INTEGER NOT NULL,  -- in cents
    county_tax_amount INTEGER NOT NULL,  -- in cents
    total_tax_amount INTEGER NOT NULL,  -- in cents
    state_rate REAL NOT NULL,
    county_rate REAL NOT NULL,
    total_rate REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
)
```

**Purpose:** Track sales tax transactions for compliance reporting

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Migration Execution Completeness

*For any* database initialization, all 13 migrations should execute in sequential order and be recorded in `sys_migrations`.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Migration Atomicity

*For any* migration that fails, the transaction should rollback and the migration should NOT be recorded in `sys_migrations`.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 3: Table Existence After Initialization

*For any* successful database initialization, all required tables in the validation list should exist in `sqlite_master`.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 4: No Duplicate Table Creation

*For any* table name, it should appear in EITHER migrations OR legacy initialization, but NOT both.

**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

### Property 5: Florida Tax Table Uniqueness

*For any* database, exactly ONE Florida tax table should exist (either `florida_tax_rates` OR `florida_tax_config`, not both).

**Validates: Requirements 3.1, 3.2, 3.5**

### Property 6: Migration Version Monotonicity

*For any* two migrations in `sys_migrations`, if migration A was applied before migration B, then A.version < B.version.

**Validates: Requirements 1.1, 7.1**

### Property 7: First-Time Initialization Completeness

*For any* empty database (no tables), after initialization completes, `sys_migrations` should contain exactly 13 records with versions 1-13.

**Validates: Requirements 9.1, 9.2**

### Property 8: Backward Compatibility Preservation

*For any* existing database with legacy tables, after migration execution, all existing data should remain intact.

**Validates: Requirements 7.1, 7.2, 7.3**

## Error Handling

### Migration Failure Handling

```typescript
public async migrate(engine: SQLiteEngine): Promise<void> {
    try {
        await this.ensureMigrationTable(engine);
        const currentVersion = await this.getCurrentVersion(engine);
        const pending = this.migrations.filter(m => m.version > currentVersion);

        if (pending.length === 0) {
            console.log('[MigrationEngine] System is up to date.');
            return;
        }

        for (const migration of pending) {
            await engine.executeTransaction(async () => {
                console.log(`[MigrationEngine] Applying v${migration.version}: ${migration.name}...`);
                
                try {
                    await migration.up(engine);
                    await engine.run(
                        "INSERT INTO sys_migrations (version, name) VALUES (?, ?)",
                        [migration.version, migration.name]
                    );
                    console.log(`[MigrationEngine] Success v${migration.version}`);
                } catch (migrationError: any) {
                    console.error(`[MigrationEngine] Migration v${migration.version} failed:`, migrationError);
                    throw migrationError;  // Rollback transaction
                }
            });
        }

        console.log("[MigrationEngine] All migrations completed successfully.");
    } catch (error) {
        console.error("[MigrationEngine] CRITICAL ERROR: Migration failed.", error);
        throw new Error("Database migration failed. System startup aborted to prevent data corruption.");
    }
}
```

### Validation Failure Handling

```typescript
async function validateRequiredTables(engine: SQLiteEngine): Promise<void> {
    // ... validation logic ...
    
    if (missingTables.length > 0) {
        const errorMsg = `Missing required tables: ${missingTables.join(', ')}`;
        logger.error('Database', 'validation_failed', errorMsg);
        
        // Log to console for visibility
        console.error('❌ DATABASE VALIDATION FAILED');
        console.error('❌ Missing tables:', missingTables);
        console.error('❌ This indicates migrations did not complete successfully');
        
        throw new Error(errorMsg);
    }
}
```

### User-Facing Error Messages

When initialization fails, display clear error to user:

```typescript
try {
    await initDB();
} catch (error: any) {
    if (error.message.includes('migration failed')) {
        alert('Database initialization failed. Please contact support.\n\nError: ' + error.message);
    } else if (error.message.includes('Missing required tables')) {
        alert('Database validation failed. Some tables are missing.\n\nError: ' + error.message);
    } else {
        alert('Database error: ' + error.message);
    }
    throw error;
}
```

## Testing Strategy

### Unit Tests

1. **Test `executeMigrations()` function**
   - Verify MigrationEngine.migrate() is called
   - Verify error handling and logging
   - Verify version logging after completion

2. **Test `validateRequiredTables()` function**
   - Test with all tables present (should pass)
   - Test with missing tables (should throw)
   - Test error message format

3. **Test `initializeLegacyTables()` function**
   - Verify no duplicate tables created
   - Verify only non-migrated tables created

### Property-Based Tests

**Test Configuration:** Minimum 100 iterations per property test

1. **Property Test: Migration Execution Completeness**
   - **Feature: database-migration-fix, Property 1: For any database initialization, all 13 migrations should execute in sequential order and be recorded in sys_migrations**
   - Generate: Random database states (empty, partial, complete)
   - Execute: initDB()
   - Verify: sys_migrations contains versions 1-13

2. **Property Test: Migration Atomicity**
   - **Feature: database-migration-fix, Property 2: For any migration that fails, the transaction should rollback and the migration should NOT be recorded in sys_migrations**
   - Generate: Random migration failure scenarios
   - Execute: Migration with injected failure
   - Verify: sys_migrations does NOT contain failed version

3. **Property Test: Table Existence After Initialization**
   - **Feature: database-migration-fix, Property 3: For any successful database initialization, all required tables should exist**
   - Generate: Random initialization scenarios
   - Execute: initDB()
   - Verify: All tables in requiredTables array exist

4. **Property Test: No Duplicate Table Creation**
   - **Feature: database-migration-fix, Property 4: For any table name, it should appear in EITHER migrations OR legacy initialization, but NOT both**
   - Generate: List of all table names from migrations and legacy code
   - Verify: No table name appears in both lists

5. **Property Test: Florida Tax Table Uniqueness**
   - **Feature: database-migration-fix, Property 5: For any database, exactly ONE Florida tax table should exist**
   - Execute: initDB()
   - Query: sqlite_master for tables matching 'florida_tax%'
   - Verify: Exactly 1 result (florida_tax_rates)

### Integration Tests

1. **Test: First-Time Initialization**
   - Start with empty database
   - Execute initDB()
   - Verify all 13 migrations applied
   - Verify all required tables exist
   - Verify IRON CORE VERIFICATION passes

2. **Test: Existing Database Upgrade**
   - Start with database at version 10
   - Execute initDB()
   - Verify migrations 11, 12, 13 applied
   - Verify existing data preserved
   - Verify new tables created

3. **Test: Already Up-to-Date Database**
   - Start with database at version 13
   - Execute initDB()
   - Verify "System is up to date" logged
   - Verify no migrations executed
   - Verify validation passes

## Implementation Notes

### Execution Order

1. Create migration 013 file
2. Update MigrationEngine to include migration 013
3. Add `executeMigrations()` function to simple-db.ts
4. Add `validateRequiredTables()` function to simple-db.ts
5. Rename `initializeSchema()` to `initializeLegacyTables()` and remove migrated tables
6. Update `initDB()` to call migrations first
7. Remove florida_tax_config from DatabaseService.ts and EmergencyInitializer.ts
8. Update any code referencing florida_tax_config to use florida_tax_rates
9. Test with empty database (first-time init)
10. Test with existing database (upgrade path)
11. Verify IRON CORE VERIFICATION passes

### Backward Compatibility

- All migrations use `CREATE TABLE IF NOT EXISTS`
- Existing data is never dropped
- Migration 013 is additive (only creates new table)
- Legacy databases will upgrade smoothly from any version

### Performance Considerations

- Migrations execute in ~2-3 seconds for empty database
- Validation adds ~100ms overhead
- Total initialization time: ~3-5 seconds (acceptable for desktop app)
- Auto-save continues to work as before

### Logging Strategy

All migration operations use ProductionLogger:
- `migrations_start`: When migration process begins
- `migrations_complete`: When all migrations finish (includes version)
- `migrations_failed`: When any migration fails (includes error)
- `validation_start`: When table validation begins
- `validation_complete`: When validation passes (includes count)
- `validation_failed`: When validation fails (includes missing tables)

Console logs remain for developer visibility during development.
