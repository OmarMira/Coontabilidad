import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const AddCountyCodeToFloridaTaxRatesMigration: Migration = {
    version: 32,
    name: 'Add county_code column to florida_tax_rates',
    up: async (db: SQLiteEngine) => {
        try {
            await db.run(`ALTER TABLE florida_tax_rates ADD COLUMN county_code TEXT`);
            console.log('✅ Migration 032: county_code agregado a florida_tax_rates');
        } catch (e) {
            console.warn('Migration 032: county_code might already exist', e);
        }
    },
    down: async (db: SQLiteEngine) => {}
};
