/**
 * Check 3: Usuario Administrador
 * Verifica que los usuarios crÃ­ticos (admin, demo) existan y estÃ©n configurados
 */

import { IntegrityCheck, CheckResult } from '../../../types/integrity.types';
import { getDB } from '@/database/modules/db-core';

export class UserIntegrityCheck implements IntegrityCheck {
    id = 'user-integrity';
    name = 'Usuarios del Sistema';
    description = 'Verifica que los usuarios admin y demo existan y estÃ©n activos';
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
                    const { initDB } = await import('../../../database/modules/db-init');

                    // Inicializar DB primero
                    const newDb = await initDB();

                    // Luego reparar
                    const engine = new SQLiteEngine();
                    engine.setDB(newDb);
                    const repair = new SchemaRepairService(engine);
                    await repair.repairSchema();

                    // CRÃTICO: Forzar persistencia
                    if (typeof engine.sync === 'function') {
                        await engine.sync();
                    }

                    // Esperar un momento para asegurar que IndexedDB termine
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            };
        }

        try {
            // Verificar si el sistema estÃ¡ vacÃ­o (Primer Inicio)
            const countResult = db.exec("SELECT COUNT(*) FROM users");
            const totalUsers = countResult[0]?.values[0]?.[0] as number || 0;

            if (totalUsers === 0) {
                return {
                    passed: true,
                    message: 'âœ… Sistema virgen - Pendiente de configuraciÃ³n inicial',
                    details: { issue: 'first_boot' },
                    canAutoRepair: false
                };
            }

            // Verificar usuario admin
            const adminResult = db.exec(`
                SELECT id, username, password_hash, is_active 
                FROM users 
                WHERE username = 'admin'
            `);

            if (adminResult.length === 0 || adminResult[0].values.length === 0) {
                // Si hay usuarios pero no hay 'admin', esto SÃ es un problema de integridad
                return {
                    passed: false,
                    message: 'âŒ El sistema tiene usuarios pero no se encontrÃ³ la cuenta admin',
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
                    message: 'âŒ Usuario admin sin contraseÃ±a configurada',
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
                    message: 'âš ï¸ Usuario admin estÃ¡ desactivado',
                    details: { issue: 'admin_inactive' },
                    canAutoRepair: true,
                    repairAction: async () => {
                        db.run("UPDATE users SET is_active = 1 WHERE username = 'admin'");
                    }
                };
            }

            return {
                passed: true,
                message: 'âœ… Usuario admin configurado correctamente',
                canAutoRepair: false
            };
        } catch (error) {
            return {
                passed: false,
                message: `âŒ Error verificando usuarios: ${(error as Error).message}`,
                canAutoRepair: false
            };
        }
    }
}

