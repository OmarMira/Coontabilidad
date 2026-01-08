import { Migration } from '../MigrationEngine';
import { SQLiteEngine } from '../../database/SQLiteEngine';
import { BasicEncryption } from '../../security/BasicEncryption';

export class HistoricalDataFixMigration implements Migration {
    version = 8;
    name = 'Historical Data and Audit Fix';
    description = 'Backfills journal_entry_lines from journal_details, creates dummy lines if missing, and repairs the entire forensic audit chain.';

    async up(engine: SQLiteEngine): Promise<void> {
        // 0. ENSURE SCHEMA (Fix missing operation column from previous versions)
        const columns = engine.select("PRAGMA table_info(audit_chain)");
        const colNames = columns.map((c: any) => c.name);

        if (!colNames.includes('operation')) {
            console.log('[Migration 008] Adding missing column: operation');
            engine.run("ALTER TABLE audit_chain ADD COLUMN operation TEXT DEFAULT 'INSERT'");
        }
        if (!colNames.includes('created_at')) {
            console.log('[Migration 008] Adding missing column: created_at');
            engine.run("ALTER TABLE audit_chain ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP");
        }
        if (!colNames.includes('created_by')) {
            console.log('[Migration 008] Adding missing column: created_by');
            engine.run("ALTER TABLE audit_chain ADD COLUMN created_by INTEGER DEFAULT 1");
        }

        // 1. Fetch all journal entries
        const allEntries = engine.select("SELECT id, total_debit, total_credit, description, entry_date FROM journal_entries");

        // 2. BACKFILL LINES
        for (const je of allEntries) {
            const id = je.id;
            const debit = je.total_debit;
            const credit = je.total_credit;
            const desc = je.description;

            // Check if lines exist in Forensic Table
            const linesRes = engine.select("SELECT COUNT(*) as count FROM journal_entry_lines WHERE journal_entry_id = ?", [id]);
            const lineCount = linesRes[0].count;

            if (lineCount === 0) {
                // Check legacy journal_details
                const detailsRes = engine.select("SELECT account_code, debit_amount, credit_amount, description FROM journal_details WHERE journal_entry_id = ?", [id]);

                if (detailsRes.length > 0) {
                    // Backfill from legacy
                    for (const d of detailsRes) {
                        const d_desc = d.description || desc;
                        engine.run(
                            "INSERT INTO journal_entry_lines (journal_entry_id, account_code, debit, credit, description) VALUES (?, ?, ?, ?, ?)",
                            [id, d.account_code, d.debit_amount, d.credit_amount, d_desc]
                        );
                    }
                } else {
                    // Create Dummy Lines (Correction)
                    engine.run(
                        "INSERT INTO journal_entry_lines (journal_entry_id, account_code, debit, credit, description) VALUES (?, '9999', ?, 0, ?)",
                        [id, debit, desc + ' (Correction)']
                    );
                    engine.run(
                        "INSERT INTO journal_entry_lines (journal_entry_id, account_code, debit, credit, description) VALUES (?, '9999', 0, ?, ?)",
                        [id, credit, desc + ' (Correction)']
                    );
                }
            }
        }

        // 3. REPAIR AUDIT CHAIN (Full Re-hash)
        const nodes = engine.select("SELECT id, table_name, record_id, operation, created_at, created_by FROM audit_chain ORDER BY id ASC");

        if (nodes.length === 0) return;

        let lastHash = '0'; // Genesis previous_hash

        for (const node of nodes) {
            const auditId = node.id;
            let dataHash = '';

            if (node.table_name === 'journal_entries') {
                const jeRes = engine.select("SELECT id, total_debit, total_credit FROM journal_entries WHERE id = ?", [node.record_id]);
                if (jeRes.length > 0) {
                    const je = jeRes[0];
                    // Fetch Lines
                    const lRes = engine.select("SELECT account_code, debit, credit, description FROM journal_entry_lines WHERE journal_entry_id = ?", [node.record_id]);
                    const items = lRes.map(v => ({
                        account_code: v.account_code,
                        debit: v.debit,
                        credit: v.credit,
                        description: v.description
                    }));

                    const payload = {
                        id: je.id,
                        total_debit: je.total_debit,
                        total_credit: je.total_credit,
                        items: items
                    };
                    dataHash = await BasicEncryption.hash(new TextEncoder().encode(JSON.stringify(payload)));
                } else {
                    // Record deleted or missing
                    // Fallback to existing hash to avoid breaking chain if record is gone
                    const existing = engine.select("SELECT data_hash FROM audit_chain WHERE id = ?", [auditId]);
                    dataHash = existing[0]?.data_hash || 'MISSING';
                }
            } else {
                // Preserve existing data_hash for non-journal_entries
                const existing = engine.select("SELECT data_hash FROM audit_chain WHERE id = ?", [auditId]);
                dataHash = existing[0]?.data_hash || '';
            }

            // Calculate Current Hash (Seal)
            // Format: previous_hash|data_hash|created_at|table_name|record_id|operation
            const sealPayload = `${lastHash}|${dataHash}|${node.created_at}|${node.table_name}|${node.record_id}|${node.operation}`;
            const currentHash = await BasicEncryption.hash(new TextEncoder().encode(sealPayload));

            // Update Node
            engine.run(
                "UPDATE audit_chain SET previous_hash = ?, data_hash = ?, current_hash = ? WHERE id = ?",
                [lastHash, dataHash, currentHash, auditId]
            );

            lastHash = currentHash;
        }
    }

    async down(engine: SQLiteEngine): Promise<void> {
        // Migration is destructive/repairing, cannot be reverted safely
    }
}
