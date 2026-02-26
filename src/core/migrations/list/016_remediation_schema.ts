import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const RemediationSchemaMigration: Migration = {
    version: 16,
    name: 'Remediation Schema - Risk Keywords, Transaction States, Quarantine',
    up: async (db: SQLiteEngine) => {

        // TABLE 1: asset_migration_audit
        await db.exec(`
            CREATE TABLE IF NOT EXISTS asset_migration_audit (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_asset_id INTEGER NOT NULL,
                original_user_id INTEGER NOT NULL DEFAULT 1,
                clustering_metadata TEXT,
                cluster_group TEXT,
                confidence_score REAL CHECK(confidence_score BETWEEN 0.0 AND 1.0),
                triage_status TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK(triage_status IN ('PENDING','ASSIGNED','ORPHAN_CONFIRMED','DELETED')),
                assigned_tenant_id INTEGER,
                reviewed_by INTEGER,
                reviewed_at DATETIME,
                review_notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_mig_status  ON asset_migration_audit(triage_status)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_mig_cluster ON asset_migration_audit(cluster_group)`);

        // TABLE 2: risk_keywords
        await db.exec(`
            CREATE TABLE IF NOT EXISTS risk_keywords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                merchant_name TEXT NOT NULL,
                pattern TEXT NOT NULL,
                pattern_type TEXT NOT NULL DEFAULT 'REGEX'
                    CHECK(pattern_type IN ('REGEX','LIKE','EXACT')),
                risk_level TEXT NOT NULL
                    CHECK(risk_level IN ('HIGH','MEDIUM','LOW')),
                suggested_category TEXT NOT NULL
                    CHECK(suggested_category IN (
                        'PERSONAL_EXPENSE','OWNERS_DRAW','PENDING_REVIEW',
                        'TRANSPORT_INCOME','CONTRACTOR_PAYMENT'
                    )),
                auto_classify INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // SEED DATA — risk_keywords
        const seeds = [
            ['UBER / RAISER', '/UBER|RAISER/i', 'REGEX', 'LOW', 'TRANSPORT_INCOME', 1],
            ['LYFT', '/LYFT/i', 'REGEX', 'LOW', 'TRANSPORT_INCOME', 1],
            ['TURO', '/TURO/i', 'REGEX', 'LOW', 'TRANSPORT_INCOME', 1],
            ['Toyota Fin', 'TOYOTA%FIN%', 'LIKE', 'HIGH', 'PERSONAL_EXPENSE', 0],
            ['TFS Payment', 'TFS%PAYMENT', 'LIKE', 'HIGH', 'PERSONAL_EXPENSE', 0],
            ['American Exp', '/AMEX|AMERICAN.EXP/i', 'REGEX', 'HIGH', 'PERSONAL_EXPENSE', 0],
            ['Zelle P2P', '/Zelle\\s*-/i', 'REGEX', 'HIGH', 'PENDING_REVIEW', 0],
            ['Invoice Ref', '/Invoice\\s*(\\d+)/i', 'REGEX', 'MEDIUM', 'CONTRACTOR_PAYMENT', 0],
        ];
        for (const [merchant, pattern, type, risk, category, auto] of seeds) {
            await db.exec(`
                INSERT OR IGNORE INTO risk_keywords
                    (merchant_name, pattern, pattern_type, risk_level, suggested_category, auto_classify)
                VALUES ('${merchant}','${pattern}','${type}','${risk}','${category}',${auto})
            `);
        }

        // TABLE 3: transaction_states
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transaction_states (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id INTEGER NOT NULL UNIQUE,
                current_state TEXT NOT NULL DEFAULT 'IMPORTED'
                    CHECK(current_state IN (
                        'IMPORTED','HIGH_RISK_PERSONAL',
                        'PENDING_SUPERVISOR','DISPUTED','VERIFIED'
                    )),
                risk_keyword_id INTEGER REFERENCES risk_keywords(id),
                risk_score REAL,
                is_verified INTEGER NOT NULL DEFAULT 0,
                imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                quarantine_started_at DATETIME,
                sla_deadline DATETIME,
                verified_at DATETIME,
                verified_by INTEGER
            )
        `);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_ts_state    ON transaction_states(current_state)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_ts_verified ON transaction_states(is_verified)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_ts_sla      ON transaction_states(sla_deadline)`);

        // TABLE 4: quarantine_audit_log
        await db.exec(`
            CREATE TABLE IF NOT EXISTS quarantine_audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id INTEGER NOT NULL,
                state_id INTEGER NOT NULL REFERENCES transaction_states(id),
                action_type TEXT NOT NULL
                    CHECK(action_type IN (
                        'RISK_DETECTED','RECLASSIFIED',
                        'SLA_ESCALATED','VERIFIED','DISPUTED'
                    )),
                performed_by INTEGER,
                previous_state TEXT,
                new_state TEXT NOT NULL,
                original_category TEXT,
                new_category TEXT,
                justification TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_qal_txn     ON quarantine_audit_log(transaction_id)`);
        await db.exec(`CREATE INDEX IF NOT EXISTS idx_qal_action  ON quarantine_audit_log(action_type)`);

        console.log('✅ Migration 016: Remediation schema created.');
    },
    down: async (db: SQLiteEngine) => {
        await db.exec(`DROP TABLE IF EXISTS quarantine_audit_log`);
        await db.exec(`DROP TABLE IF EXISTS transaction_states`);
        await db.exec(`DROP TABLE IF EXISTS risk_keywords`);
        await db.exec(`DROP TABLE IF EXISTS asset_migration_audit`);
    }
};
