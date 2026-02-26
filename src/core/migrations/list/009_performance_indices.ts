import { Migration } from '../MigrationEngine';
import { SQLiteEngine } from '../../database/SQLiteEngine';

export class PerformanceIndicesMigration implements Migration {
    version = 9;
    name = 'Performance Indices';
    description = 'Adds indices to journal_entries, tax_transactions, and audit_chain for optimization.';

    async up(engine: SQLiteEngine): Promise<void> {
        // journal_entries - entry_number may not yet exist, wrap safely
        try {
            await engine.run("CREATE INDEX IF NOT EXISTS idx_je_number_date ON journal_entries(entry_number, transaction_date)");
        } catch (e) { console.warn('Migration 009: idx_je_number_date skipped -', (e as Error).message); }

        // tax_transactions - table created in migration 013, wrap safely
        try {
            await engine.run("CREATE INDEX IF NOT EXISTS idx_tax_tx_county_date ON tax_transactions(county_code, transaction_date)");
        } catch (e) { console.warn('Migration 009: idx_tax_tx_county_date skipped -', (e as Error).message); }

        // audit_chain
        try {
            await engine.run("CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_chain(table_name, record_id)");
        } catch (e) { console.warn('Migration 009: idx_audit_table_record skipped -', (e as Error).message); }
    }

    async down(engine: SQLiteEngine): Promise<void> {
        await engine.run("DROP INDEX IF EXISTS idx_je_number_date");
        await engine.run("DROP INDEX IF EXISTS idx_tax_tx_county_date");
        await engine.run("DROP INDEX IF EXISTS idx_audit_table_record");
    }
}
