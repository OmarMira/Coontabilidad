import { Migration } from '../MigrationEngine';
import { SQLiteEngine } from '../../database/SQLiteEngine';

export const FixAnomalyDetectorSchemaMigration: Migration = {
    version: 21,
    name: 'Fix Anomaly Detector Schema and Admin Seed',
    up: async (db: SQLiteEngine) => {
        // 1. Add amount_paid to invoices if missing
        try {
            const columns = await db.select("PRAGMA table_info(invoices)");
            const hasAmountPaid = columns.some((c: any) => c.name === 'amount_paid');
            if (!hasAmountPaid) {
                await db.exec("ALTER TABLE invoices ADD COLUMN amount_paid DECIMAL(12,2) DEFAULT 0.00");
                console.log("[Migration v21] Added column 'amount_paid' to 'invoices'");
            }
        } catch (e) {
            console.warn("[Migration v21] Error adding amount_paid to invoices:", e);
        }

        // 2. Ensure Admin Role
        try {
            // Roles setup (idempotent)
            await db.run("INSERT OR IGNORE INTO user_roles (name, description, level, is_system_role) VALUES ('admin', 'System Administrator', 100, 1)");

            // NOTA: La creación del usuario administrador se ha movido al flujo FirstTimeSetup.
            // Para un sistema "Clean Modern", el primer usuario debe ser configurado manualmente.
        } catch (e) {
            console.warn("[Migration v21] Error seeding admin role:", e);
        }
    },
    down: async (db: SQLiteEngine) => {
        // No reverting data seeds usually
    }
};
