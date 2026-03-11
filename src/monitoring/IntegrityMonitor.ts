import { db } from '@/database/simple-db';
import { logger } from '../utils/logger';
import { BackupService } from '../services/backup/BackupService';

export class IntegrityMonitor {
    private static timeoutId: any = null;
    private static readonly CHECK_INTERVAL = 300000; // 5 minutos (antes 60s)

    /**
     * Inicia el monitoreo continuo de integridad del sistema.
     */
    static startContinuousMonitoring(): void {
        if (this.timeoutId) return;

        logger.info('Monitor de Integridad 24/7 activado (Fondo).', undefined, 'Monitor', 'startup');

        const scheduleNextCheck = () => {
            this.timeoutId = setTimeout(() => {
                if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                    (window as any).requestIdleCallback(async () => {
                        await this.performPulseCheck();
                        scheduleNextCheck();
                    }, { timeout: 5000 });
                } else {
                    // Fallback para entornos sin requestIdleCallback
                    this.performPulseCheck().then(scheduleNextCheck);
                }
            }, this.CHECK_INTERVAL);
        };

        // Ejecutar chequeo inicial de forma no bloqueante
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            (window as any).requestIdleCallback(() => this.performPulseCheck());
        } else {
            this.performPulseCheck();
        }

        scheduleNextCheck();
    }

    /**
     * Detiene el monitoreo.
     */
    static stopMonitoring(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
            logger.warn('Monitor de Integridad detenido manualmente.', undefined, 'Monitor', 'shutdown');
        }
    }

    /**
     * Ejecuta un chequeo de pulso en todos los subsistemas críticos.
     */
    private static async performPulseCheck(): Promise<void> {
        try {
            // 1. Salud de la Base de Datos (Integridad y FK)
            const dbStatus = await BackupService.runIntegrityTestSuite(db);

            if (!dbStatus.passed) {
                logger.emergency('FALLA DE INTEGRIDAD DETECTADA POR MONITOR CONTINUO', { failures: dbStatus.failures }, undefined, 'Monitor', 'integrity_failure');
                // Aquí se podría disparar una reparación automática si estuviera configurada
            }

            // 2. Monitoreo de Alertas de IA
            // En un sistema real, aquí auditaríamos las últimas respuestas de la IA 
            // buscando patrones de 'documentación' prohibidos.

            // 3. Verificación de Almacenamiento
            this.checkLocalPersistence();

            if (dbStatus.passed) {
                logger.debug('Pulso de integridad estable.', undefined, 'Monitor', 'pulse');
            }

        } catch (error: any) {
            logger.error('Error durante el ciclo de monitoreo', { error: error.message }, error, 'Monitor', 'cycle_error');
        }
    }

    private static checkLocalPersistence(): void {
        const nav = navigator as any;
        if (typeof nav !== 'undefined' && nav.storage && nav.storage.estimate) {
            nav.storage.estimate().then((estimate: any) => {
                const usagePercent = ((estimate.usage || 0) / (estimate.quota || 1)) * 100;
                if (usagePercent > 90) {
                    logger.warn('Espacio de almacenamiento crítico (>90%)', { usagePercent }, 'Monitor', 'storage_low');
                }
            });
        }
    }
}
