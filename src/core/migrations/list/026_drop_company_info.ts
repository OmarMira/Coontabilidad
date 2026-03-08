import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const DropCompanyInfoMigration: Migration = {
    version: 26,
    name: 'Drop legacy company_info table',
    up: async (db: SQLiteEngine) => {
        await db.run('DROP TABLE IF EXISTS company_info');
    },
    down: async (db: SQLiteEngine) => {
        // No se restaura — tabla obsoleta
    }
};
