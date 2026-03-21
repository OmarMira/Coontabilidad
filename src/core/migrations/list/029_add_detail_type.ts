import { Migration } from '../MigrationEngine';
import { SQLiteEngine } from '../../database/SQLiteEngine';

export const AddDetailTypeMigration: Migration = {
    version: 29,
    name: 'Add detail_type to chart_of_accounts',

    up: async (db: SQLiteEngine) => {
        // Checking if 'detail_type' already exists in 'chart_of_accounts'
        const tableInfo = await db.select("PRAGMA table_info(chart_of_accounts)");
        const hasColumn = tableInfo.some((col: any) => col.name === 'detail_type');

        if (!hasColumn) {
            await db.run("ALTER TABLE chart_of_accounts ADD COLUMN detail_type TEXT");
            console.log("Migración 029 aplicada: columna detail_type añadida a chart_of_accounts");
        }
    },

    down: async (db: SQLiteEngine) => {
        // Rollback usually not needed for simple column additions unless specified
    }
};
