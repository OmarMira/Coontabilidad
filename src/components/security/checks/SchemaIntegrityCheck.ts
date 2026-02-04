/**
 * Check 1: Integridad Estructural del Schema
 * Verifica que todas las tablas críticas existan
 */

import { IntegrityCheck, CheckResult } from '../../../types/integrity.types';
import { getDB } from '../../../database/simple-db';

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
                canAutoRepair: false
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
                    const { SQLiteEngine } = await import('../../../core/database/SQLiteEngine');
                    const engine = new SQLiteEngine();
                    engine.setDB(db);
                    const repair = new SchemaRepairService(engine);
                    await repair.repairSchema();
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
