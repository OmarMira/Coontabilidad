import { logger } from '../utils/logger';
import { DatabaseHealthChecker } from './DatabaseHealthChecker';

export class UISyncManager {
    private static readonly MAX_RETRIES = 3;
    private static readonly RETRY_DELAY = 2000; // 2 segundos
    private static isRecovering = false;

    /**
     * Intercepta errores de inicialización y ejecuta recuperación automática
     */
    static async interceptAndRecover(error: Error): Promise<boolean> {
        if (this.isRecovering) {
            logger.warn('Recuperación ya en progreso', undefined, 'UISync');
            return false;
        }

        // Detectar si es error FK persistente
        const isFKError = error.message.includes('FOREIGN KEY constraint failed');

        if (!isFKError) {
            return false;
        }

        logger.emergency('🚨 INTERCEPTANDO ERROR FK PERSISTENTE EN UI', { error: error.message }, undefined, 'UISync');
        this.isRecovering = true;

        try {
            // PASO 1: Mostrar estado de recuperación en UI (gestionado por el Error Boundary)
            // notify event if someone is listening
            window.dispatchEvent(new CustomEvent('sync-recovery-start'));

            // PASO 2: Verificar estado real de la base de datos
            const dbStatus = await DatabaseHealthChecker.checkHealth();

            if (dbStatus.healthy) {
                // La DB está sana, es solo la UI desincronizada
                await this.syncUIWithHealthyDB();
                return true;
            } else {
                // La DB realmente tiene problemas
                await this.executeUISideRecovery();
                return true;
            }

        } catch (recoveryError: any) {
            logger.critical('Fallo en recuperación automática:', { error: recoveryError.message }, undefined, 'UISync');

            // Último recurso: Forzar recarga completa
            await this.forceCompleteReload();
            return false;

        } finally {
            this.isRecovering = false;
        }
    }

    /**
     * Sincroniza UI con base de datos sana
     */
    private static async syncUIWithHealthyDB(): Promise<void> {
        logger.info('Sincronizando UI con DB sana...', undefined, 'UISync');

        // 1. Limpiar cache de errores del navegador
        await this.clearBrowserErrorCache();

        // 2. Forzar re-render de componentes críticos
        await this.forceComponentRefresh();

        // 3. Actualizar estado global de la aplicación
        await this.updateGlobalAppState();

        // 4. Ocultar mensaje de error si está visible
        await this.hideErrorDisplay();

        // 5. Mostrar notificación de éxito
        await this.showSyncSuccessNotification();

        logger.success('✅ UI sincronizada con DB correctamente', undefined, 'UISync');
    }

    /**
     * Ejecuta recuperación desde el lado de la UI
     */
    private static async executeUISideRecovery(): Promise<void> {
        logger.info('Ejecutando recuperación desde UI...', undefined, 'UISync');
        const repaired = await DatabaseHealthChecker.attemptAutoRepair();
        if (repaired) {
            await this.syncUIWithHealthyDB();
        } else {
            throw new Error('No se pudo reparar la base de datos automáticamente');
        }
    }

    /**
     * Forzar recarga completa con validación
     */
    static async forceCompleteReload(): Promise<void> {
        // Guardar estado de recuperación en localStorage
        localStorage.setItem('recovery_attempt', Date.now().toString());
        localStorage.setItem('recovery_reason', 'fk_persistent_error');

        // Mostrar mensaje al usuario (vía log)
        logger.info('Forzando recarga de la aplicación...', undefined, 'UISync');

        // Esperar para que el usuario vea el mensaje o se procesen logs
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Recargar con parámetros para bypass de cache
        window.location.href = `${window.location.pathname}?recovery=${Date.now()}&nocache=1`;
    }

    private static async clearBrowserErrorCache(): Promise<void> {
        localStorage.removeItem('last_database_error');
        sessionStorage.removeItem('db_init_error');
    }

    private static async forceComponentRefresh(): Promise<void> {
        window.dispatchEvent(new CustomEvent('force-app-refresh'));
    }

    private static async updateGlobalAppState(): Promise<void> {
        // Aquí se podrían limpiar estados de Redux/Zustand si existieran
        sessionStorage.setItem('last_sync', Date.now().toString());
    }

    private static async hideErrorDisplay(): Promise<void> {
        window.dispatchEvent(new CustomEvent('hide-error-overlay'));
    }

    private static async showSyncSuccessNotification(): Promise<void> {
        // Notificar al sistema de notificaciones si existe
        console.log('✅ Sincronización exitosa');
    }
}
