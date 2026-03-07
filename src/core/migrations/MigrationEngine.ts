import { SQLiteEngine } from '../database/SQLiteEngine';
import { InitialSchemaMigration } from './list/001_initial_schema';
import { AIViewsMigration } from './list/002_ai_views';
import { InventorySchemaMigration } from './list/003_inventory_schema';
import { PurchasingSchemaMigration } from './list/004_purchasing_schema';
import { AccountingSchemaMigration } from './list/005_accounting_schema';
import { SystemSchemaMigration } from './list/006_system_schema';
import { CurrencyFixAndFiscalMigration } from './list/007_currency_fix_and_fiscal';
import { LogicClockInitMigration } from './list/008_logic_clock_init';
import { HistoricalDataFixMigration } from './list/008_historical_data_fix';
import { PerformanceIndicesMigration } from './list/009_performance_indices';
import { MultiUserSchemaMigration } from './list/010_multi_user_schema';
import { FixedAssetsSchema } from './list/011_fixed_assets_schema';
import { BudgetsSchema } from './list/012_budgets_schema';
import { TaxTransactionsMigration } from './list/013_tax_transactions';
import { AddAccountAliasMigration } from './list/015_add_account_alias';
import { RemediationSchemaMigration } from './list/016_remediation_schema';
import { BankImportHashMigration } from './list/017_bank_import_hash';
import { ClassificationRulesMigration } from './list/018_classification_rules';
import { ClassificationRulesAccountTypeMigration } from './list/019_classification_rules_account_type';
import { BankImportSchemaMigration } from './list/020_bank_import_schema';
import { FixAnomalyDetectorSchemaMigration } from './list/021_fix_anomaly_detector_schema';
import { FixAuditChainSchemaMigration } from './list/023_fix_audit_chain_schema';

export interface Migration {
    version: number;
    name: string;
    up: (db: SQLiteEngine) => Promise<void>;
    down: (db: SQLiteEngine) => Promise<void>;
}

export class MigrationEngine {
    private static instance: MigrationEngine;
    private migrations: Migration[] = [
        InitialSchemaMigration,
        AIViewsMigration,
        InventorySchemaMigration,
        PurchasingSchemaMigration,
        AccountingSchemaMigration,
        SystemSchemaMigration,
        CurrencyFixAndFiscalMigration,
        LogicClockInitMigration,
        new HistoricalDataFixMigration(),
        new PerformanceIndicesMigration(),
        MultiUserSchemaMigration,
        FixedAssetsSchema,
        BudgetsSchema,
        TaxTransactionsMigration,
        AddAccountAliasMigration,
        RemediationSchemaMigration,
        BankImportHashMigration,
        ClassificationRulesMigration,
        ClassificationRulesAccountTypeMigration,
        BankImportSchemaMigration,          // v020: import_batches, temp, ml tables, import_hash
        FixAnomalyDetectorSchemaMigration,   // v021: amount_paid and admin seed
        FixAuditChainSchemaMigration as any // v023: event_type in audit_chain
    ];

    private constructor() { }

    public static getInstance(): MigrationEngine {
        if (!MigrationEngine.instance) {
            MigrationEngine.instance = new MigrationEngine();
        }
        return MigrationEngine.instance;
    }

    public async migrate(engine: SQLiteEngine): Promise<void> {
        try {
            await this.ensureMigrationTable(engine);

            const currentVersion = await this.getCurrentVersion(engine);
            console.log(`[MigrationEngine] Current DB Version: ${currentVersion}`);

            const pending = this.migrations.filter(m => m.version > currentVersion);

            if (pending.length === 0) {
                console.log('[MigrationEngine] System is up to date.');
                return;
            }

            console.log(`[MigrationEngine] Found ${pending.length} pending migrations.`);

            // Execute pending migrations
            // Note: We use engine.executeTransaction for each migration to ensure atomicity per version.
            // If the user preferred a single massive transaction for ALL migrations, we could do that,
            // but usually valid to commit each one as checkpoints.
            // However, to strictly follow "Atomic System Startup", if one fails, we might want to stop everything.

            for (const migration of pending) {
                await engine.executeTransaction(async () => {
                    console.log(`[MigrationEngine] Applying v${migration.version}: ${migration.name}...`);

                    await migration.up(engine);

                    // Record success
                    // We must use 'run' here because we are inside the transaction wrapper
                    await engine.run(
                        "INSERT INTO sys_migrations (version, name) VALUES (?, ?)",
                        [migration.version, migration.name]
                    );
                });
                console.log(`[MigrationEngine] Success v${migration.version}`);
            }

            console.log("[MigrationEngine] All migrations completed successfully.");
        } catch (error) {
            console.error("[MigrationEngine] CRITICAL ERROR: Migration failed.", error);
            throw new Error("Database migration failed. System startup aborted to prevent data corruption.");
        }
    }

    private async ensureMigrationTable(engine: SQLiteEngine): Promise<void> {
        // 1. Intentar crear la tabla con el esquema corregido (Sprint 1A+)
        await engine.exec(`
            CREATE TABLE IF NOT EXISTS sys_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Inspeccionar esquema actual
        const tableInfo = await engine.select("PRAGMA table_info(sys_migrations)");
        const hasName = tableInfo.some((col: any) => col.name === 'name');
        const hasLegacyName = tableInfo.some((col: any) => col.name === 'migration_name');

        // 3. Normalización profunda si detectamos columnas obsoletas que causan fallos de NOT NULL
        if (hasLegacyName) {
            console.log("[MigrationEngine] Legacy schema detected in sys_migrations. Normalizing...");

            // Usamos un bloque TRY/CATCH simple fuera de la transacción principal para evitar 
            // problemas de bloqueo si la tabla ya está en uso, aunque executeTransaction es preferible.
            try {
                await engine.executeTransaction(async () => {
                    // Renombrar tabla vieja
                    await engine.exec("ALTER TABLE sys_migrations RENAME TO sys_migrations_old");

                    // Crear tabla nueva limpia
                    await engine.exec(`
                        CREATE TABLE sys_migrations (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            version INTEGER NOT NULL UNIQUE,
                            name TEXT NOT NULL,
                            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `);

                    // Migrar datos usando COALESCE para manejar cualquier combinación de columnas
                    if (hasName) {
                        await engine.exec(`
                            INSERT INTO sys_migrations (id, version, name, applied_at)
                            SELECT id, version, COALESCE(name, migration_name), applied_at 
                            FROM sys_migrations_old
                        `);
                    } else {
                        await engine.exec(`
                            INSERT INTO sys_migrations (id, version, name, applied_at)
                            SELECT id, version, migration_name, applied_at 
                            FROM sys_migrations_old
                        `);
                    }

                    // Eliminar tabla obsoleta
                    await engine.exec("DROP TABLE sys_migrations_old");
                });
                console.log("[MigrationEngine] Schema normalization successful.");
            } catch (error) {
                console.error("[MigrationEngine] Schema normalization failed. Attempting fallback...", error);
                // Si falla el renombre (ej. por triggers), al menos intentamos añadir la columna
                if (!hasName) {
                    try { await engine.exec(`ALTER TABLE sys_migrations ADD COLUMN name TEXT`); } catch (_) { }
                }
            }
        }
    }

    private async getCurrentVersion(engine: SQLiteEngine): Promise<number> {
        const res = await engine.select("SELECT MAX(version) as version FROM sys_migrations");
        if (res.length > 0 && res[0].version !== null) {
            return res[0].version as number;
        }
        return 0;
    }
}
