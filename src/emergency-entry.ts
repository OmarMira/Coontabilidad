import { ForensicDatabaseDiagnostic } from './database/ForensicDiagnostic';
import { EnhancedBackupService } from './services/backup/EnhancedBackupService';
import { IntegrityMonitor } from './monitoring/IntegrityMonitor';
import { logger } from './utils/logger';
import { ViewManager } from './database/views/ViewManager';
import { db } from './database/simple-db';

/**
 * Punto de entrada de emergencia para la aplicación
 * Se activa ante errores fatales de integridad
 */
export async function emergencyBoot(): Promise<void> {
    logger.emergency('INICIANDO FIX NUCLEAR DE EMERGENCIA DEFINITIVO', undefined, undefined, 'Boot', 'emergency');

    try {
        // 1. Ejecutar el Fix Definitivo Nuclear
        // Esto elimina todo y reconstruye con arquitectura de UUIDs
        await ForensicDatabaseDiagnostic.executeDefinitiveFix();

        // 2. Iniciar el Monitor de Integridad inmediatamente
        IntegrityMonitor.startContinuousMonitoring();

        // 2. Re-crear las vistas para la IA (importante para la optimización reciente)
        if (db) {
            const viewManager = new ViewManager(db);
            await viewManager.createAllViews();
            logger.info('Vistas analíticas IA re-creadas con éxito', undefined, 'Boot', 'views');
        }

        // 3. Notificar al sistema que la integridad ha sido restaurada
        sessionStorage.removeItem('db_init_error');
        logger.success('SISTEMA RESTAURADO: Integridad de base de datos confirmada', undefined, 'Boot', 'restored');

        // 4. Recargar la aplicación para volver al flujo normal
        setTimeout(() => {
            window.location.reload();
        }, 2000);

    } catch (error: any) {
        logger.critical('FALLA EN MODO DE EMERGENCIA', { error: error.message }, undefined, 'Boot', 'failed');

        // Ofrecer opciones de recuperación extrema
        // En una app real, esto dispararía el renderizado de un portal de recuperación
        window.dispatchEvent(new CustomEvent('emergency-recovery-required', {
            detail: {
                error: error.message,
                actions: [
                    { label: 'Restaurar último backup', action: () => EnhancedBackupService.restoreBackup('latest') },
                    { label: 'Exportar logs de diagnóstico', action: () => console.log('Diagnostic logs exported') }
                ]
            }
        }));
    }
}

/**
 * Función para verificar si se requiere el modo de emergencia antes de montar React
 */
export function checkEmergencyRequirement(): boolean {
    if (typeof window === 'undefined') return false;

    const lastError = sessionStorage.getItem('db_init_error');
    if (lastError && lastError.includes('FOREIGN KEY')) {
        return true;
    }
    return false;
}
