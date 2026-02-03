# Requirements Document: Database Migration System Fix

## Introduction

This specification addresses the critical database initialization failure where the MigrationEngine exists but is never executed, causing missing tables (`sys_migrations`, `fixed_assets`, `asset_depreciation`, `florida_tax_config`, `tax_transactions`) and system-wide errors in the IRON CORE VERIFICATION system.

## Glossary

- **MigrationEngine**: The system component responsible for executing database schema migrations in sequential order
- **SQLiteEngine**: Typed wrapper around sql.js that provides async methods for database operations
- **Legacy_Schema**: The manual table creation code in `initializeSchema()` that predates the migration system
- **Migration**: A versioned database schema change with `up()` and `down()` methods
- **sys_migrations**: The tracking table that records which migrations have been applied
- **IRON_CORE_VERIFICATION**: The system's internal verification module that validates database integrity

## Requirements

### Requirement 1: Execute Migration System on Startup

**User Story:** As a system administrator, I want the migration system to execute automatically on database initialization, so that all required tables are created consistently.

#### Acceptance Criteria

1. WHEN the system calls `initDB()`, THE System SHALL execute `MigrationEngine.getInstance().migrate(dbEngine)` after creating the SQLiteEngine instance
2. WHEN migrations execute, THE System SHALL create the `sys_migrations` table before running any migrations
3. WHEN migrations complete successfully, THE System SHALL log the final database version
4. IF any migration fails, THEN THE System SHALL throw an error and prevent application startup
5. WHEN migrations are already up-to-date, THE System SHALL skip execution and log "System is up to date"

### Requirement 2: Remove Legacy Schema Duplication

**User Story:** As a developer, I want to eliminate duplicate table creation code, so that the migration system is the single source of truth for schema definitions.

#### Acceptance Criteria

1. WHEN the system initializes, THE System SHALL NOT execute manual `CREATE TABLE` statements for tables defined in migrations
2. THE System SHALL preserve only tables that are NOT covered by existing migrations in `initializeSchema()`
3. WHEN a table exists in both legacy code and migrations, THE Migration SHALL take precedence
4. THE System SHALL document which tables remain in legacy initialization and why
5. WHEN all migrations complete, THE System SHALL have zero duplicate table definitions

### Requirement 3: Resolve Florida Tax Table Conflicts

**User Story:** As a tax compliance officer, I want consistent Florida tax table naming, so that tax calculations work reliably across all modules.

#### Acceptance Criteria

1. THE System SHALL use exactly ONE table name for Florida tax configuration (either `florida_tax_config` or `florida_tax_rates`)
2. WHEN the chosen table name is selected, THE System SHALL update all references in the codebase
3. THE System SHALL include a migration to rename existing tables if necessary
4. WHEN tax calculations execute, THE System SHALL query the correct standardized table name
5. THE System SHALL remove all conflicting table definitions from `DatabaseService.ts`, `EmergencyInitializer.ts`, and `simple-db.ts`

### Requirement 4: Ensure Migration Atomicity

**User Story:** As a system administrator, I want migrations to be atomic, so that partial failures don't corrupt the database.

#### Acceptance Criteria

1. WHEN a migration executes, THE System SHALL wrap it in a transaction
2. IF a migration fails, THEN THE System SHALL rollback the transaction
3. WHEN a migration rollback occurs, THE System SHALL NOT record it in `sys_migrations`
4. THE System SHALL log detailed error information for failed migrations
5. WHEN startup fails due to migration error, THE System SHALL display a clear error message to the user

### Requirement 5: Validate All Required Tables Exist

**User Story:** As a quality assurance engineer, I want automatic validation that all required tables exist after initialization, so that missing tables are detected immediately.

#### Acceptance Criteria

1. WHEN database initialization completes, THE System SHALL verify that `sys_migrations` table exists
2. WHEN database initialization completes, THE System SHALL verify that `fixed_assets` table exists
3. WHEN database initialization completes, THE System SHALL verify that `asset_depreciation` table exists
4. WHEN database initialization completes, THE System SHALL verify that the Florida tax table exists
5. WHEN database initialization completes, THE System SHALL verify that `tax_transactions` table exists
6. IF any required table is missing, THEN THE System SHALL throw a detailed error listing missing tables
7. THE System SHALL log successful validation with table count

### Requirement 6: Create Missing Tax Transactions Migration

**User Story:** As a financial analyst, I want the `tax_transactions` table to be created via migration, so that tax transaction tracking is consistent with other modules.

#### Acceptance Criteria

1. THE System SHALL include a migration that creates the `tax_transactions` table
2. WHEN the migration executes, THE System SHALL create all required columns for tax tracking
3. THE System SHALL create appropriate indexes for tax transaction queries
4. THE System SHALL establish foreign key relationships to invoices and customers
5. WHEN the migration completes, THE System SHALL seed any required default tax configuration

### Requirement 7: Maintain Backward Compatibility

**User Story:** As a system administrator, I want existing databases to migrate smoothly, so that production systems upgrade without data loss.

#### Acceptance Criteria

1. WHEN an existing database has legacy tables, THE System SHALL NOT drop or recreate them
2. WHEN migrations detect existing tables, THE System SHALL use `CREATE TABLE IF NOT EXISTS` or skip creation
3. THE System SHALL preserve all existing data during migration
4. WHEN table structure changes are needed, THE System SHALL use `ALTER TABLE` statements
5. THE System SHALL provide rollback migrations for all schema changes

### Requirement 8: Log Migration Execution Details

**User Story:** As a system administrator, I want detailed migration logs, so that I can troubleshoot initialization issues.

#### Acceptance Criteria

1. WHEN migrations start, THE System SHALL log the current database version
2. WHEN each migration executes, THE System SHALL log "Applying vX: Migration Name"
3. WHEN each migration completes, THE System SHALL log "Success vX"
4. WHEN all migrations complete, THE System SHALL log "All migrations completed successfully"
5. IF a migration fails, THEN THE System SHALL log the full error stack trace
6. THE System SHALL use the ProductionLogger for all migration logs

### Requirement 9: Handle First-Time Initialization

**User Story:** As a new user, I want the system to initialize correctly on first run, so that I can start using the application immediately.

#### Acceptance Criteria

1. WHEN the database is empty (no tables), THE System SHALL execute all 12 migrations in order
2. WHEN migrations complete on first run, THE System SHALL have version 12 recorded in `sys_migrations`
3. THE System SHALL seed default data after migrations complete
4. WHEN first initialization completes, THE System SHALL pass all IRON CORE VERIFICATION checks
5. THE System SHALL complete first-time initialization in under 10 seconds

### Requirement 10: Integrate with IRON CORE VERIFICATION

**User Story:** As a quality assurance engineer, I want IRON CORE VERIFICATION to pass after migration fixes, so that system integrity is confirmed.

#### Acceptance Criteria

1. WHEN migrations complete, THE System SHALL pass the "sys_migrations table exists" check
2. WHEN migrations complete, THE System SHALL pass the "fiscal tables exist" check
3. WHEN migrations complete, THE System SHALL pass the "Florida tax config exists" check
4. WHEN migrations complete, THE System SHALL pass the "tax transactions table exists" check
5. WHEN all checks pass, THE IRON_CORE_VERIFICATION SHALL report 100% compliance
