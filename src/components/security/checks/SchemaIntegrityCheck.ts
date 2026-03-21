import { logger } from '../../../core/logging/SystemLogger';
/**
 * Check 1: Integridad Estructural del Schema
 * Verifica que todas las tablas crÃ­ticas existan
 */

import { IntegrityCheck, CheckResult } from '../../../types/integrity.types';
import { getDB } from '@/database/modules/db-core';

export class SchemaIntegrityCheck implements IntegrityCheck {
    id = 'schema-integrity';
    name = 'Integridad Estructural';
    description = 'Verifica que todas las tablas crÃ­ticas del sistema existan';
    severity = 'critical' as const;
    status = 'pending' as const;

    private readonly CRITICAL_TABLES = [
        'journal_entries',
        'audit_chain',
        'florida_tax_rates',
        'tax_transactions',
        'users',
        'user_roles',
        'customers',
        'suppliers',
        'invoices',
        'bills',
        'products',
        'fixed_assets',
        'asset_depreciation',
        'sys_migrations'
    ];

    async execute(): Promise<CheckResult> {
        const db = getDB();

        if (!db) {
            return {
                passed: false,
                message: 'Base de datos no inicializada',
                canAutoRepair: true,
                repairAction: async () => {
                    const { SchemaRepairService } = await import('../../../database/SchemaRepairService');
                    const { getDBEngine } = await import('../../../database/modules/db-core');

                    try {
                        // Usar la instancia Ãºnica del motor que gestiona la persistencia real
                        const engine = getDBEngine();
                        const repair = new SchemaRepairService(engine);
                        await repair.repairSchema();

                        // Forzar sincronizaciÃ³n si es necesaria
                        if (typeof engine.sync === 'function') {
                            await engine.sync();
                        }
                    } catch (e) {
                        // Fallback si el motor no estÃ¡ inicializado (raro en arranque, pero posible)
                        logger.warn('SchemaIntegrityCheck', 'warn', 'DB Engine not ready, trying init...', e);
                        const { initDB } = await import('../../../database/modules/db-init');
                        const { SQLiteEngine } = await import('../../../core/database/SQLiteEngine');

                        await initDB();
                        // Re-intentar obtener el motor
                        const engine = getDBEngine();
                        const repair = new SchemaRepairService(engine);
                        await repair.repairSchema();
                        if (typeof engine.sync === 'function') await engine.sync();
                    }

                    // Esperar un momento para asegurar que IndexedDB termine
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            };
        }

        try {
            const result = db.exec(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `);

            const existingTables = result[0]?.values.map((row: any) => row[0] as string) || [];
            const missingTables = this.CRITICAL_TABLES.filter(
                table => !existingTables.includes(table)
            );

            if (missingTables.length === 0) {
                return {
                    passed: true,
                    message: `âœ… Todas las ${this.CRITICAL_TABLES.length} tablas crÃ­ticas existen`,
                    canAutoRepair: false
                };
            }

            return {
                passed: false,
                message: `âŒ Faltan ${missingTables.length} tablas crÃ­ticas`,
                details: {
                    missingTables,
                    existingTables: existingTables.length,
                    requiredTables: this.CRITICAL_TABLES.length
                },
                canAutoRepair: true,
                repairAction: async () => {
                    const { SchemaRepairService } = await import('../../../database/SchemaRepairService');
                    const { getDBEngine } = await import('../../../database/modules/db-core');
                    const { initDB } = await import('../../../database/modules/db-init');

                    try {
                        let engine;
                        try {
                            engine = getDBEngine();
                        } catch (e) {
                            await initDB();
                            engine = getDBEngine();
                        }

                        const repair = new SchemaRepairService(engine);
                        await repair.repairSchema();

                        // CRÃTICO: Forzar persistencia
                        if (typeof engine.sync === 'function') {
                            await engine.sync();
                        }

                        // Forzar exportaciÃ³n explicita a IndexedDB
                        try {
                            const { forceSaveDB } = await import('../../../database/modules/db-persistence');
                            if (forceSaveDB) await forceSaveDB();
                        } catch (e) {
                            logger.warn('SchemaIntegrityCheck', 'warn', 'Force save failed', e);
                        }
                    } catch (e) {
                        logger.error('SchemaIntegrityCheck', 'error', 'operation_failed', "Critical Repair Fail", e);
                    }

                    // Esperar un momento para asegurar que IndexedDB termine
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            };
        } catch (error) {
            return {
                passed: false,
                message: `âŒ Error verificando schema: ${(error as Error).message}`,
                canAutoRepair: false
            };
        }
    }
}


