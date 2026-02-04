/**
 * Check 3: Usuario Administrador
 * Verifica que los usuarios críticos (admin, demo) existan y estén configurados
 */

import { IntegrityCheck, CheckResult } from '../../../types/integrity.types';
import { getDB } from '../../../database/simple-db';

export class UserIntegrityCheck implements IntegrityCheck {
    id = 'user-integrity';
    name = 'Usuarios del Sistema';
    description = 'Verifica que los usuarios admin y demo existan y estén activos';
    severity = 'critical' as const;
    status = 'pending' as const;

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
                }
            };
        }

        try {
            // Verificar usuario admin
            const adminResult = db.exec(`
                SELECT id, username, password_hash, is_active 
                FROM users 
                WHERE username = 'admin'
            `);

            if (adminResult.length === 0 || adminResult[0].values.length === 0) {
                return {
                    passed: false,
                    message: '❌ Usuario admin no existe',
                    details: { issue: 'admin_missing' },
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
            }

            const [, , passwordHash, isActive] = adminResult[0].values[0];

            if (!passwordHash) {
                return {
                    passed: false,
                    message: '❌ Usuario admin sin contraseña configurada',
                    details: { issue: 'admin_no_password' },
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
            }

            if (!isActive) {
                return {
                    passed: false,
                    message: '⚠️ Usuario admin está desactivado',
                    details: { issue: 'admin_inactive' },
                    canAutoRepair: true,
                    repairAction: async () => {
                        db.run("UPDATE users SET is_active = 1 WHERE username = 'admin'");
                    }
                };
            }

            // Verificar usuario demo
            const demoResult = db.exec(`
                SELECT id, password_hash, is_active 
                FROM users 
                WHERE username = 'demo'
            `);
            
            const hasDemo = demoResult.length > 0 && demoResult[0].values.length > 0;
            const demoActive = hasDemo && demoResult[0].values[0][2];

            if (!hasDemo || !demoActive) {
                return {
                    passed: true,
                    message: `✅ Usuario admin configurado (demo ${hasDemo ? 'inactivo' : 'faltante'})`,
                    details: { 
                        admin: 'ok',
                        demo: hasDemo ? 'inactive' : 'missing'
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
            }

            return {
                passed: true,
                message: '✅ Usuarios admin y demo configurados correctamente',
                canAutoRepair: false
            };
        } catch (error) {
            return {
                passed: false,
                message: `❌ Error verificando usuarios: ${(error as Error).message}`,
                canAutoRepair: false
            };
        }
    }
}
