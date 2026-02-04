import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { ProductionLogger } from '../../core/logging/ProductionLogger';
import floridaTaxRates from '../../knowledge/florida-tax-rates.json';

/**
 * FloridaTaxSeeder - Inyecta los 67 condados de Florida con sus tasas oficiales
 */
export class FloridaTaxSeeder {
    constructor(private db: SQLiteEngine) { }

    async seed(): Promise<void> {
        ProductionLogger.info('FloridaTaxSeeder', 'Iniciando carga de 67 condados...');

        try {
            await this.db.executeTransaction(async () => {
                // 1. Asegurar que las columnas existen (por si acaso SchemaRepair falló)
                await this.ensureColumns();

                // 2. Insertar/Actualizar cada condado
                for (const county of floridaTaxRates) {
                    // Convertimos decimales (0.07) a Basis Points (700) para el nuevo esquema
                    const baseRate = 600; // 6% base
                    const surtaxRate = Math.round(county.surtax * 10000);
                    const totalRate = baseRate + surtaxRate;

                    await this.db.run(`
                        INSERT INTO florida_tax_rates (county_name, county_code, base_rate, surtax_rate, total_rate, effective_date)
                        VALUES (?, ?, ?, ?, ?, '2026-01-01')
                        ON CONFLICT(county_name) DO UPDATE SET
                            county_code = excluded.county_code,
                            surtax_rate = excluded.surtax_rate,
                            total_rate = excluded.total_rate,
                            updated_at = CURRENT_TIMESTAMP
                    `, [county.name, county.code, baseRate, surtaxRate, totalRate]);
                }
            });

            ProductionLogger.info('FloridaTaxSeeder', '✅ Los 67 condados han sido cargados exitosamente');
        } catch (error) {
            ProductionLogger.error('FloridaTaxSeeder', 'Error cargando condados', error as Error);
            throw error;
        }
    }

    private async ensureColumns(): Promise<void> {
        const tableInfo = await this.db.select("PRAGMA table_info(florida_tax_rates)");
        const columns = tableInfo.map((c: any) => c.name);

        if (!columns.includes('county_code')) {
            await this.db.exec("ALTER TABLE florida_tax_rates ADD COLUMN county_code TEXT");
        }
        if (!columns.includes('base_rate')) {
            await this.db.exec("ALTER TABLE florida_tax_rates ADD COLUMN base_rate REAL DEFAULT 600");
        }
        if (!columns.includes('effective_date')) {
            await this.db.exec("ALTER TABLE florida_tax_rates ADD COLUMN effective_date TEXT DEFAULT '2026-01-01'");
        }
    }
}
