import { SQLiteEngine } from '../database/SQLiteEngine';
import { InitialSchemaMigration } from './list/001_initial_schema';
import { AIViewsMigration } from './list/002_ai_views';
import { InventorySchemaMigration } from './list/003_inventory_schema';
import { PurchasingSchemaMigration } from './list/004_purchasing_schema';
import { AccountingSchemaMigration } from './list/005_accounting_schema';
import { SystemSchemaMigration } from './list/006_system_schema';
import { CurrencyFixAndFiscalMigration } from './list/007_currency_fix_and_fiscal';
import { LogicClockInitMigration } from './list/008_logic_clock_init';
import { HistoricalDataFixMigration } from './list/024_historical_data_fix';
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
import { AddStatusToJournalEntriesMigration } from './list/025_add_status_to_journal_entries';
import { DropCompanyInfoMigration } from './list/026_drop_company_info';
import { BankAccountGLMappingMigration } from './list/027_bank_account_gl_mapping';
import { AddAccountNumberMigration } from './list/028_add_account_number';
import { AddDetailTypeMigration } from './list/029_add_detail_type';
import { TaxRatesConfigMigration } from './list/030_tax_rates_config';
import { UsersAndCompanyDataMigration } from './list/031_users_and_company_data';
import { AddCountyCodeToFloridaTaxRatesMigration } from './list/032_add_county_code_to_florida_tax_rates';

export interface Migration {
    version: number;
    name: string;
    up: (db: SQLiteEngine) => Promise<void>;
    down: (db: SQLiteEngine) => Promise<void>;
}

export class MigrationEngine {
    private static instance: MigrationEngine;

    // Lista de todas las migraciones registradas en el sistema.
    // El motor las aplica en el orden en que aparecen en el array, filtrando por versión.
    // MANTENER ORDEN CRONOLÓGICO POR VERSIÓN PARA EVITAR FALLOS DE DEPENDENCIA.
    private migrations: Migration[] = [
        InitialSchemaMigration,              // v1
        AIViewsMigration,                   // v2
        InventorySchemaMigration,           // v3
        PurchasingSchemaMigration,          // v4
        AccountingSchemaMigration,          // v5
        SystemSchemaMigration,              // v6
        CurrencyFixAndFiscalMigration,     // v7
        LogicClockInitMigration,           // v8
        new PerformanceIndicesMigration(),  // v9
        MultiUserSchemaMigration,          // v10
        FixedAssetsSchema,                  // v11
        BudgetsSchema,                      // v12
        TaxTransactionsMigration,          // v13
        // v14: Intencionalmente saltada - no hay migración con este ID
        AddAccountAliasMigration,          // v15
        RemediationSchemaMigration,        // v16
        BankImportHashMigration,           // v17
        ClassificationRulesMigration,      // v18
        ClassificationRulesAccountTypeMigration, // v19
        BankImportSchemaMigration,          // v20
        FixAnomalyDetectorSchemaMigration,   // v21
        FixAuditChainSchemaMigration as any, // v23
        new HistoricalDataFixMigration(),    // v24
        AddStatusToJournalEntriesMigration,  // v25
        DropCompanyInfoMigration,             // v26
        BankAccountGLMappingMigration,        // v27
        AddAccountNumberMigration,             // v28
        AddDetailTypeMigration,                // v29
        TaxRatesConfigMigration,                 // v30
        UsersAndCompanyDataMigration,            // v31
        AddCountyCodeToFloridaTaxRatesMigration  // v32
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

            // Filtrar y ordenar explícitamente por versión para robustez
            const pending = this.migrations
                .filter(m => m.version > currentVersion)
                .sort((a, b) => a.version - b.version);

            if (pending.length === 0) {
                console.log('[MigrationEngine] System is up to date.');
                return;
            }

            console.log(`[MigrationEngine] Found ${pending.length} pending migrations.`);

            for (const migration of pending) {
                await engine.executeTransaction(async () => {
                    console.log(`[MigrationEngine] Applying v${migration.version}: ${migration.name}...`);
                    await migration.up(engine);

                    // Record success
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
        await engine.exec(`
            CREATE TABLE IF NOT EXISTS sys_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Inspeccionar esquema actual
        const tableInfo = await engine.select("PRAGMA table_info(sys_migrations)");
        const hasName = tableInfo.some((col: any) => col.name === 'name');
        const hasLegacyName = tableInfo.some((col: any) => col.name === 'migration_name');

        // Normalización profunda si detectamos columnas obsoletas
        if (hasLegacyName) {
            console.log("[MigrationEngine] Legacy schema detected in sys_migrations. Normalizing...");
            try {
                await engine.executeTransaction(async () => {
                    await engine.exec("ALTER TABLE sys_migrations RENAME TO sys_migrations_old");
                    await engine.exec(`
                        CREATE TABLE sys_migrations (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            version INTEGER NOT NULL UNIQUE,
                            name TEXT NOT NULL,
                            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `);

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
                    await engine.exec("DROP TABLE sys_migrations_old");
                });
                console.log("[MigrationEngine] Schema normalization successful.");
            } catch (error) {
                console.error("[MigrationEngine] Schema normalization failed. Attempting fallback...", error);
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
