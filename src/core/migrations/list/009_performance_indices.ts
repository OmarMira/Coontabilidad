import { Migration } from '../MigrationEngine';
import { SQLiteEngine } from '../../database/SQLiteEngine';

export class PerformanceIndicesMigration implements Migration {
    version = 9;
    name = 'Performance Indices';
    description = 'Adds indices to journal_entries, tax_transactions, and audit_chain for optimization.';

    async up(engine: SQLiteEngine): Promise<void> {
        // journal_entries
        await engine.run("CREATE INDEX IF NOT EXISTS idx_je_number_date ON journal_entries(entry_number, transaction_date)");

        // tax_transactions
        await engine.run("CREATE INDEX IF NOT EXISTS idx_tax_tx_county_date ON tax_transactions(county_code, transaction_date)");

        // audit_chain
        await engine.run("CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_chain(table_name, record_id)");
    }

    async down(engine: SQLiteEngine): Promise<void> {
        await engine.run("DROP INDEX IF EXISTS idx_je_number_date");
        await engine.run("DROP INDEX IF EXISTS idx_tax_tx_county_date");
        await engine.run("DROP INDEX IF EXISTS idx_audit_table_record");
    }
}
