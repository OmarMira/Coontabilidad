import { SQLiteEngine } from '../database/SQLiteEngine';
import { InitialSchemaMigration } from './list/001_initial_schema';
import { AIViewsMigration } from './list/002_ai_views';
import { InventorySchemaMigration } from './list/003_inventory_schema';
import { PurchasingSchemaMigration } from './list/004_purchasing_schema';
import { AccountingSchemaMigration } from './list/005_accounting_schema';
import { SystemSchemaMigration } from './list/006_system_schema';
import { CurrencyFixAndFiscalMigration } from './list/007_currency_fix_and_fiscal';
import { HistoricalDataFixMigration } from './list/008_historical_data_fix';
import { PerformanceIndicesMigration } from './list/009_performance_indices';

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
        new HistoricalDataFixMigration(),
        new PerformanceIndicesMigration()
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
        await engine.exec(`
            CREATE TABLE IF NOT EXISTS sys_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    private async getCurrentVersion(engine: SQLiteEngine): Promise<number> {
        const res = await engine.select("SELECT MAX(version) as version FROM sys_migrations");
        if (res.length > 0 && res[0].version !== null) {
            return res[0].version as number;
        }
        return 0;
    }
}
