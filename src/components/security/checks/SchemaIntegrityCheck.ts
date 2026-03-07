/**
 * Check 1: Integridad Estructural del Schema
 * Verifica que todas las tablas críticas existan
 */

import { IntegrityCheck, CheckResult } from '../../../types/integrity.types';
import { getDB } from '@/database/simple-db';

export class SchemaIntegrityCheck implements IntegrityCheck {
    id = 'schema-integrity';
    name = 'Integridad Estructural';
    description = 'Verifica que todas las tablas críticas del sistema existan';
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
                    const { getDBEngine } = await import('../../../database/simple-db');

                    try {
                        // Usar la instancia única del motor que gestiona la persistencia real
                        const engine = getDBEngine();
                        const repair = new SchemaRepairService(engine);
                        await repair.repairSchema();

                        // Forzar sincronización si es necesaria
                        if (typeof engine.sync === 'function') {
                            await engine.sync();
                        }
                    } catch (e) {
                        // Fallback si el motor no está inicializado (raro en arranque, pero posible)
                        console.warn('DB Engine not ready, trying init...', e);
                        const { initDB } = await import('../../../database/simple-db');
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
                    message: `✅ Todas las ${this.CRITICAL_TABLES.length} tablas críticas existen`,
                    canAutoRepair: false
                };
            }

            return {
                passed: false,
                message: `❌ Faltan ${missingTables.length} tablas críticas`,
                details: {
                    missingTables,
                    existingTables: existingTables.length,
                    requiredTables: this.CRITICAL_TABLES.length
                },
                canAutoRepair: true,
                repairAction: async () => {
                    const { SchemaRepairService } = await import('../../../database/SchemaRepairService');
                    const { getDBEngine, initDB } = await import('../../../database/simple-db');

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

                        // CRÍTICO: Forzar persistencia
                        if (typeof engine.sync === 'function') {
                            await engine.sync();
                        }

                        // Forzar exportación explicita a IndexedDB
                        try {
                            const { forceSaveDB } = await import('../../../database/simple-db');
                            if (forceSaveDB) await forceSaveDB();
                        } catch (e) {
                            console.warn('Force save failed', e);
                        }
                    } catch (e) {
                        console.error("Critical Repair Fail", e);
                    }

                    // Esperar un momento para asegurar que IndexedDB termine
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            };
        } catch (error) {
            return {
                passed: false,
                message: `❌ Error verificando schema: ${(error as Error).message}`,
                canAutoRepair: false
            };
        }
    }
}
