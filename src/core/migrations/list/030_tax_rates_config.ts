import { SQLiteEngine } from '../../database/SQLiteEngine';

export const TaxRatesConfigMigration = {
  version: 30,
  name: 'Tax Rates Configuration Table',
  up: async (engine: SQLiteEngine) => {
    await engine.exec(`
      CREATE TABLE IF NOT EXISTS tax_rates_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tax_year INTEGER NOT NULL,
        rate_key TEXT NOT NULL,
        rate_value REAL NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tax_year, rate_key)
      )
    `);
  },
  down: async (engine: SQLiteEngine) => {
    await engine.exec('DROP TABLE IF EXISTS tax_rates_config');
  }
};
