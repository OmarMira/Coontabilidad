/**
 * Servicio Central de Integridad del Sistema
 * Coordina todas las verificaciones y reparaciones
 */

import { IntegrityCheck, SystemIntegrityReport, IntegrityCheckResult } from '../../types/integrity.types';
import { SchemaIntegrityCheck } from '../../components/security/checks/SchemaIntegrityCheck';
import { TaxDataIntegrityCheck } from '../../components/security/checks/TaxDataIntegrityCheck';
import { UserIntegrityCheck } from '../../components/security/checks/UserIntegrityCheck';
import { logger } from '../../core/logging/SystemLogger';

export class IntegrityService {
    private checks: IntegrityCheck[] = [
        new SchemaIntegrityCheck(),
        new TaxDataIntegrityCheck(),
        new UserIntegrityCheck()
    ];

    /**
     * Ejecuta todas las verificaciones de integridad
     */
    async runAllChecks(): Promise<SystemIntegrityReport> {
        logger.info('IntegrityService', 'start_checks', 'Iniciando verificación de integridad del sistema');
        
        const results: IntegrityCheckResult[] = [];
        let criticalFailures = 0;
        let warnings = 0;

        for (const check of this.checks) {
            const startTime = performance.now();
            
            try {
                const result = await check.execute();
                const executionTime = performance.now() - startTime;

                const checkResult: IntegrityCheckResult = {
                    ...check,
                    result,
                    executionTime,
                    status: result.passed ? 'passed' : 'failed'
                };

                results.push(checkResult);

                if (!result.passed) {
                    if (check.severity === 'critical') {
                        criticalFailures++;
                        logger.error('IntegrityService', 'check_failed', `Check crítico falló: ${check.name}`, { checkId: check.id, message: result.message });
                    } else if (check.severity === 'warning') {
                        warnings++;
                        logger.warn('IntegrityService', 'check_warning', `Check con advertencia: ${check.name}`, { checkId: check.id, message: result.message });
                    }
                } else {
                    logger.info('IntegrityService', 'check_passed', `Check exitoso: ${check.name}`, { checkId: check.id, time: executionTime });
                }
            } catch (error) {
                logger.error('IntegrityService', 'check_error', `Error ejecutando check: ${check.name}`, { checkId: check.id, error });
                
                const checkResult: IntegrityCheckResult = {
                    ...check,
                    result: {
                        passed: false,
                        message: `Error inesperado: ${(error as Error).message}`,
                        canAutoRepair: false
                    },
                    executionTime: performance.now() - startTime,
                    status: 'failed'
                };
                
                results.push(checkResult);
                criticalFailures++;
            }
        }

        const overallStatus = 
            criticalFailures > 0 ? 'critical' :
            warnings > 0 ? 'degraded' :
            'healthy';

        const report: SystemIntegrityReport = {
            timestamp: new Date().toISOString(),
            overallStatus,
            checks: results,
            criticalFailures,
            warnings
        };

        logger.info('IntegrityService', 'checks_complete', `Verificación completada: ${overallStatus}`, {
            critical: criticalFailures,
            warnings,
            total: results.length
        });

        return report;
    }

    /**
     * Repara un check específico
     */
    async repairCheck(checkId: string): Promise<boolean> {
        const check = this.checks.find(c => c.id === checkId);
        if (!check) {
            logger.error('IntegrityService', 'repair_not_found', `Check no encontrado: ${checkId}`);
            return false;
        }

        logger.info('IntegrityService', 'repair_start', `Iniciando reparación: ${check.name}`, { checkId });

        try {
            const result = await check.execute();
            
            if (result.canAutoRepair && result.repairAction) {
                await result.repairAction();
                logger.info('IntegrityService', 'repair_success', `Reparación exitosa: ${check.name}`, { checkId });
                return true;
            }

            logger.warn('IntegrityService', 'repair_not_available', `Reparación no disponible: ${check.name}`, { checkId });
            return false;
        } catch (error) {
            logger.error('IntegrityService', 'repair_failed', `Error en reparación: ${check.name}`, { checkId, error });
            return false;
        }
    }

    /**
     * Repara todos los checks que fallen
     */
    async repairAll(): Promise<{ repaired: number; failed: number }> {
        logger.info('IntegrityService', 'repair_all_start', 'Iniciando reparación automática de todos los checks');
        
        const report = await this.runAllChecks();
        let repaired = 0;
        let failed = 0;

        for (const check of report.checks) {
            if (!check.result.passed && check.result.canAutoRepair) {
                const success = await this.repairCheck(check.id);
                if (success) {
                    repaired++;
                } else {
                    failed++;
                }
            }
        }

        logger.info('IntegrityService', 'repair_all_complete', 'Reparación automática completada', { repaired, failed });
        
        return { repaired, failed };
    }
}
