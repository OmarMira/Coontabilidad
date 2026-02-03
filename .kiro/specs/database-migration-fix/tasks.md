# Implementation Plan: Database Migration System Fix

## ⚠️ IMPORTANT: File Corruption Recovery

**Date:** 2026-02-03  
**Status:** Tasks 2, 5, 6, 7 were marked complete but changes were lost due to file corruption in `simple-db.ts`. The file has been restored from Git. All tasks are now marked incomplete and need reimplementation.

See `.kiro/specs/database-migration-fix/PROGRESS.md` for detailed status tracking.

---

## Overview

This implementation plan fixes the critical database initialization failure by integrating the MigrationEngine into the startup flow, eliminating duplicate schema code, and ensuring all required tables are created consistently. The plan follows a careful sequence to avoid breaking existing functionality while adding the migration system.

## Tasks

- [-] 1. Create Migration 013 for tax_transactions table
  - Create new file `src/core/migrations/list/013_tax_transactions.ts`
  - Implement `up()` method to create tax_transactions table with all columns
  - Implement `down()` method to drop tax_transactions table
  - Create indexes for invoice_id, transaction_date, and county
  - Add foreign key constraints to invoices and customers tables
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 1.1 Write unit test for Migration 013
  - Test that up() creates tax_transactions table
  - Test that down() drops tax_transactions table
  - Test that indexes are created
  - Test that foreign keys are established
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 2. Update MigrationEngine to include Migration 013
  - Import TaxTransactionsMigration in MigrationEngine.ts
  - Add TaxTransactionsMigration to migrations array
  - Verify migrations array now has 13 entries
  - _Requirements: 6.1_
  - _Status: REVERTED - Changes lost due to file corruption_

- [-] 3. Add executeMigrations() function to simple-db.ts
  - Create async function that wraps MigrationEngine.getInstance().migrate()
  - Add try-catch error handling with ProductionLogger
  - Log migration start with 'migrations_start' event
  - Query final version from sys_migrations after completion
  - Log migration completion with version number
  - Throw descriptive error if migrations fail
  - _Requirements: 1.1, 1.3, 1.4, 8.1, 8.4, 8.6_

- [ ] 3.1 Write property test for executeMigrations()
  - **Property 1: Migration Execution Completeness**
  - **Validates: Requirements 1.1, 1.2, 1.3**
  - Generate random database states (empty, partial migrations)
  - Execute executeMigrations()
  - Verify sys_migrations contains all versions 1-13 in order
  - _Requirements: 1.1, 1.2, 9.1, 9.2_

- [ ] 3.2 Write property test for migration atomicity
  - **Property 2: Migration Atomicity**
  - **Validates: Requirements 4.1, 4.2, 4.3**
  - Inject random failures into migrations
  - Execute migration with failure
  - Verify sys_migrations does NOT contain failed version
  - Verify no partial table changes exist
  - _Requirements: 4.1, 4.2, 4.3_

- [-] 4. Add validateRequiredTables() function to simple-db.ts
  - Create async function that checks all required tables exist
  - Define requiredTables array with all critical table names
  - Loop through array and query sqlite_master for each table
  - Collect missing tables in array
  - If any missing, log error and throw with detailed message
  - If all present, log success with table count
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 4.1 Write property test for table validation
  - **Property 3: Table Existence After Initialization**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
  - Generate random subsets of required tables
  - Execute validateRequiredTables()
  - Verify function throws if any table missing
  - Verify function succeeds if all tables present
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 5. Rename initializeSchema() to initializeLegacyTables()
  - Rename function in simple-db.ts
  - Update function comment to explain it's for non-migrated tables only
  - Add comment listing which migrations cover which tables
  - Keep function body empty for now (will clean up in next task)
  - _Requirements: 2.1, 2.2_
  - _Status: REVERTED - Changes lost due to file corruption_

- [ ] 6. Remove duplicate table creation from initializeLegacyTables()
  - Remove CREATE TABLE statements for tables covered by Migration 001 (customers, suppliers, products, invoices, payments, product_categories, invoice_lines)
  - Remove CREATE TABLE statements for tables covered by Migration 003 (inventory tables)
  - Remove CREATE TABLE statements for tables covered by Migration 004 (purchasing tables)
  - Remove CREATE TABLE statements for tables covered by Migration 005 (chart_of_accounts, journal_entries, journal_entry_items)
  - Remove CREATE TABLE statements for tables covered by Migration 006 (users, user_roles, audit_trail)
  - Remove CREATE TABLE statements for tables covered by Migration 009 (florida_tax_rates)
  - Remove CREATE TABLE statements for tables covered by Migration 011 (fixed_assets, asset_depreciation, asset_categories)
  - Remove CREATE TABLE statements for tables covered by Migration 012 (budgets, budget_items)
  - Document any remaining tables and why they're not migrated yet
  - _Requirements: 2.1, 2.2, 2.3, 2.5_
  - _Status: REVERTED - Changes lost due to file corruption_

- [ ] 6.1 Write property test for no duplicate tables
  - **Property 4: No Duplicate Table Creation**
  - **Validates: Requirements 2.1, 2.2, 2.5**
  - Extract all table names from migrations
  - Extract all table names from initializeLegacyTables()
  - Verify no table name appears in both lists
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 7. Update initDB() to call migrations first
  - After creating SQLiteEngine (dbEngine.setDB(db)), add call to executeMigrations(dbEngine)
  - Change initializeSchema(db) call to initializeLegacyTables(db)
  - After DatabaseInitializer.initializeWithFix(db), add call to validateRequiredTables(dbEngine)
  - Ensure proper error handling wraps all initialization steps
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4, 5.5_
  - _Status: REVERTED - Changes lost due to file corruption_

- [ ] 8. Checkpoint - Test first-time initialization
  - Clear browser storage/database
  - Run application
  - Verify all 13 migrations execute
  - Verify sys_migrations table contains versions 1-13
  - Verify all required tables exist
  - Verify no errors in console
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 9. Remove florida_tax_config from DatabaseService.ts
  - Open src/database/DatabaseService.ts
  - Find CREATE TABLE florida_tax_config statement
  - Remove entire CREATE TABLE block
  - Search for any references to florida_tax_config in same file
  - Update references to use florida_tax_rates instead
  - _Requirements: 3.1, 3.5_

- [ ] 10. Remove florida_tax_config from EmergencyInitializer.ts
  - Open src/database/EmergencyInitializer.ts
  - Find CREATE TABLE florida_tax_config statement
  - Remove entire CREATE TABLE block
  - Search for any references to florida_tax_config in same file
  - Update references to use florida_tax_rates instead
  - _Requirements: 3.1, 3.5_

- [ ] 11. Remove duplicate florida_tax_rates from simple-db.ts
  - Open src/database/simple-db.ts
  - Find CREATE TABLE florida_tax_rates statement around line 1910
  - Remove entire CREATE TABLE block (migration 009 handles this)
  - _Requirements: 2.1, 2.5, 3.1_

- [ ] 12. Update all code references from florida_tax_config to florida_tax_rates
  - Search codebase for "florida_tax_config"
  - Update all SQL queries to use "florida_tax_rates"
  - Update all TypeScript interfaces/types if needed
  - Update any comments or documentation
  - _Requirements: 3.2, 3.4_

- [ ] 12.1 Write property test for Florida tax table uniqueness
  - **Property 5: Florida Tax Table Uniqueness**
  - **Validates: Requirements 3.1, 3.5**
  - Execute initDB()
  - Query sqlite_master for tables matching 'florida_tax%'
  - Verify exactly 1 result exists
  - Verify result is 'florida_tax_rates'
  - _Requirements: 3.1, 3.5_

- [ ] 13. Add comprehensive error handling to MigrationEngine
  - Wrap each migration.up() call in try-catch
  - Log detailed error with migration version and name
  - Ensure transaction rollback on failure
  - Throw descriptive error to halt startup
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 14. Checkpoint - Test existing database upgrade
  - Use database with version 10 (before Fixed Assets)
  - Run application
  - Verify migrations 11, 12, 13 execute
  - Verify existing data preserved
  - Verify new tables created
  - Verify validation passes
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 14.1 Write property test for backward compatibility
  - **Property 8: Backward Compatibility Preservation**
  - **Validates: Requirements 7.1, 7.2, 7.3**
  - Create database with legacy tables and sample data
  - Execute migrations
  - Verify all original data still exists
  - Verify no tables were dropped
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 15. Add detailed logging to all migration operations
  - Ensure executeMigrations() logs start event
  - Ensure each migration logs "Applying vX: Name"
  - Ensure each migration logs "Success vX"
  - Ensure final completion log includes version
  - Ensure errors log full stack trace
  - Use ProductionLogger for all logs
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 16. Test integration with IRON CORE VERIFICATION
  - Run application with IRON CORE VERIFICATION enabled
  - Verify "sys_migrations table exists" check passes
  - Verify "fiscal tables exist" check passes
  - Verify "Florida tax config exists" check passes
  - Verify "tax transactions table exists" check passes
  - Verify overall compliance reaches 100%
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 17. Final checkpoint - Comprehensive testing
  - Test first-time initialization (empty database)
  - Test upgrade from version 10
  - Test upgrade from version 12
  - Test already up-to-date (version 13)
  - Verify all IRON CORE VERIFICATION checks pass
  - Verify no console errors
  - Verify application functions normally
  - _Requirements: 1.5, 9.1, 9.2, 9.4, 10.5_

- [ ] 17.1 Write property test for migration version monotonicity
  - **Property 6: Migration Version Monotonicity**
  - **Validates: Requirements 1.1, 7.1**
  - Execute initDB()
  - Query sys_migrations ordered by applied_at
  - Verify each version is greater than previous
  - _Requirements: 1.1, 7.1_

- [ ] 17.2 Write property test for first-time initialization
  - **Property 7: First-Time Initialization Completeness**
  - **Validates: Requirements 9.1, 9.2**
  - Start with empty database (no tables)
  - Execute initDB()
  - Verify sys_migrations contains exactly 13 records
  - Verify versions are 1, 2, 3, ..., 13
  - _Requirements: 9.1, 9.2_

- [ ] 18. Build and verify TypeScript compilation
  - Run `npm run build`
  - Verify 0 TypeScript errors
  - Verify build completes successfully
  - Check bundle size hasn't increased significantly
  - _Requirements: All_

- [ ] 19. Push all changes to GitHub
  - Stage all modified files
  - Commit with message: "fix: Integrate MigrationEngine into database initialization"
  - Push to remote repository
  - Verify CI/CD passes (if configured)
  - _Requirements: All_

## Notes

- All tasks including property-based tests are required for a robust, NASA-level implementation
- Each task references specific requirements for traceability
- Checkpoints (tasks 8, 14, 17) ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All migrations use CREATE TABLE IF NOT EXISTS for safety
- Existing data is never dropped or modified
- Total estimated time: 4-6 hours for complete implementation and testing
