import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 015: Add account_alias to chart_of_accounts
 * 
 * Purpose: Support bilingual UI while maintaining US GAAP compliance
 * 
 * - account_name: Always in English (legal standard)
 * - account_alias: Optional Spanish translation for UI display
 * 
 * Florida-Compliant: Chart of Accounts remains in English for legal/audit purposes
 */
export const AddAccountAliasMigration: Migration = {
    version: 15,
    name: 'Add account_alias for bilingual support',
    up: async (db: SQLiteEngine) => {
        // Add account_alias column (optional Spanish translation)
        // Wrapped in try-catch in case the column already exists
        try {
            await db.exec(`
                ALTER TABLE chart_of_accounts 
                ADD COLUMN account_alias TEXT DEFAULT NULL
            `);
        } catch (e) {
            console.warn('Migration 015: account_alias column may already exist, skipping ALTER.');
        }

        // Create index for faster lookups
        try {
            await db.exec(`
                CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_alias 
                ON chart_of_accounts(account_alias)
            `);
        } catch (e) { console.warn('Migration 015: index skipped -', e); }

        // Update common accounts with Spanish aliases (use account_code column)
        const commonAliases = [
            { code: '1010', alias: 'Efectivo en Caja' },
            { code: '1020', alias: 'Banco - Cuenta Corriente' },
            { code: '1030', alias: 'Banco - Cuenta de Ahorros' },
            { code: '1100', alias: 'Cuentas por Cobrar' },
            { code: '1200', alias: 'Inventario' },
            { code: '1500', alias: 'Activos Fijos' },
            { code: '2010', alias: 'Cuentas por Pagar' },
            { code: '2020', alias: 'Impuestos por Pagar' },
            { code: '2100', alias: 'Préstamos por Pagar' },
            { code: '3000', alias: 'Capital Social' },
            { code: '3100', alias: 'Utilidades Retenidas' },
            { code: '4000', alias: 'Ingresos por Ventas' },
            { code: '4100', alias: 'Ingresos por Servicios' },
            { code: '5000', alias: 'Costo de Ventas' },
            { code: '5100', alias: 'Gastos de Nómina' },
            { code: '5200', alias: 'Gastos de Renta' },
            { code: '5300', alias: 'Gastos de Servicios Públicos' },
            { code: '5400', alias: 'Gastos de Publicidad' },
            { code: '5500', alias: 'Gastos de Depreciación' },
            { code: '5999', alias: 'Gastos Misceláneos' }
        ];

        for (const { code, alias } of commonAliases) {
            try {
                await db.run(
                    `UPDATE chart_of_accounts SET account_alias = ? WHERE account_code = ?`,
                    [alias, code]
                );
            } catch (e) { /* ignore missing rows */ }
        }

        console.log('✅ Migration 015: account_alias column added successfully');
    },

    down: async (db: SQLiteEngine) => {
        // SQLite doesn't support DROP COLUMN directly
        // We need to recreate the table without the column

        await db.exec(`
            -- Create temporary table without account_alias
            CREATE TABLE chart_of_accounts_backup (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                subtype TEXT,
                active BOOLEAN DEFAULT 1
            )
        `);

        await db.exec(`
            -- Copy data
            INSERT INTO chart_of_accounts_backup (id, code, name, type, subtype, active)
            SELECT id, code, name, type, subtype, active
            FROM chart_of_accounts
        `);

        await db.exec(`
            -- Drop original table
            DROP TABLE chart_of_accounts
        `);

        await db.exec(`
            -- Rename backup to original
            ALTER TABLE chart_of_accounts_backup RENAME TO chart_of_accounts
        `);

        await db.exec(`
            -- Drop index
            DROP INDEX IF EXISTS idx_chart_of_accounts_alias
        `);

        console.log('✅ Migration 015 rolled back: account_alias column removed');
    }
};
