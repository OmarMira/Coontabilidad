/**
 * Check 2: Datos Fiscales de Florida
 * Verifica que existan los 67 condados con sus tasas
 */

import { IntegrityCheck, CheckResult } from '../../../types/integrity.types';
import { getDB } from '@/database/modules/db-core';

export class TaxDataIntegrityCheck implements IntegrityCheck {
    id = 'tax-data-integrity';
    name = 'Datos Fiscales de Florida';
    description = 'Verifica que existan los 67 condados de Florida con tasas correctas';
    severity = 'warning' as const;
    status = 'pending' as const;

    private readonly EXPECTED_COUNTIES = 67;
    private readonly CRITICAL_COUNTIES = ['MIAMI-DADE', 'BROWARD', 'PALM-BEACH'];

    async execute(): Promise<CheckResult> {
        const db = getDB();

        if (!db) {
            return {
                passed: false,
                message: 'Base de datos no inicializada',
                canAutoRepair: true,
                repairAction: async () => {
                    const { SchemaRepairService } = await import('../../../database/SchemaRepairService');
                    const { SQLiteEngine } = await import('../../../core/database/SQLiteEngine');
                    const { initDB } = await import('../../../database/simple-db');

                    // Inicializar DB primero
                    const newDb = await initDB();

                    // Luego reparar
                    const engine = new SQLiteEngine();
                    engine.setDB(newDb);
                    const repair = new SchemaRepairService(engine);
                    await repair.repairSchema();

                    // CRÍTICO: Forzar persistencia
                    if (typeof engine.sync === 'function') {
                        await engine.sync();
                    }

                    // Esperar un momento para asegurar que IndexedDB termine
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            };
        }

        try {
            // Verificar cantidad total
            const countResult = db.exec('SELECT COUNT(*) as count FROM florida_tax_rates');
            const count = countResult[0]?.values[0]?.[0] as number || 0;

            if (count === this.EXPECTED_COUNTIES) {
                // Verificar condados críticos
                const criticalCheck = db.exec(`
                    SELECT county_code FROM florida_tax_rates 
                    WHERE county_code IN ('MIAMI-DADE', 'BROWARD', 'PALM-BEACH')
                `);
                const foundCritical = criticalCheck[0]?.values.length || 0;

                if (foundCritical === this.CRITICAL_COUNTIES.length) {
                    return {
                        passed: true,
                        message: `✅ Los ${this.EXPECTED_COUNTIES} condados están cargados correctamente`,
                        canAutoRepair: false
                    };
                }
            }

            // Verificar condados críticos específicamente
            const missingCritical: string[] = [];
            for (const county of this.CRITICAL_COUNTIES) {
                const check = db.exec(
                    `SELECT COUNT(*) FROM florida_tax_rates WHERE county_code = ?`,
                    [county]
                );
                const exists = (check[0]?.values[0]?.[0] as number) > 0;
                if (!exists) {
                    missingCritical.push(county);
                }
            }

            return {
                passed: false,
                message: `⚠️ Solo ${count}/${this.EXPECTED_COUNTIES} condados cargados`,
                details: {
                    currentCount: count,
                    expected: this.EXPECTED_COUNTIES,
                    missing: this.EXPECTED_COUNTIES - count,
                    missingCritical
                },
                canAutoRepair: true,
                repairAction: async () => {
                    const { SchemaRepairService } = await import('../../../database/SchemaRepairService');
                    const { SQLiteEngine } = await import('../../../core/database/SQLiteEngine');
                    const engine = new SQLiteEngine();
                    engine.setDB(db);
                    const repair = new SchemaRepairService(engine);
                    await repair.repairSchema();

                    // CRÍTICO: Forzar persistencia
                    if (typeof engine.sync === 'function') {
                        await engine.sync();
                    }

                    // Esperar un momento para asegurar que IndexedDB termine
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            };
        } catch (error) {
            return {
                passed: false,
                message: `❌ Error verificando condados: ${(error as Error).message}`,
                canAutoRepair: false
            };
        }
    }
}
