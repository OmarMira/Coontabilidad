import { db } from '../database/simple-db';
import { logger } from '../utils/logger';
import { CorruptionProofBackupService } from '../services/backup/CorruptionProofBackupService';

export class IntegrityMonitor {
    private static intervalId: any = null;
    private static readonly CHECK_INTERVAL = 60000; // Cada minuto para propósitos de demostración/seguridad

    /**
     * Inicia el monitoreo continuo de integridad del sistema.
     */
    static startContinuousMonitoring(): void {
        if (this.intervalId) return;

        logger.info('Monitor de Integridad 24/7 activado.', undefined, 'Monitor', 'startup');

        this.intervalId = setInterval(async () => {
            await this.performPulseCheck();
        }, this.CHECK_INTERVAL);

        // Ejecutar chequeo inmediato
        this.performPulseCheck();
    }

    /**
     * Detiene el monitoreo.
     */
    static stopMonitoring(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.warn('Monitor de Integridad detenido manualmente.', undefined, 'Monitor', 'shutdown');
        }
    }

    /**
     * Ejecuta un chequeo de pulso en todos los subsistemas críticos.
     */
    private static async performPulseCheck(): Promise<void> {
        try {
            // 1. Salud de la Base de Datos (Integridad y FK)
            const dbStatus = await CorruptionProofBackupService.runIntegrityTestSuite();

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
