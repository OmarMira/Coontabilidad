import { logger } from './logging/SystemLogger';

/**
 * DASHBOARD RESTORER
 * Limpia cualquier estado de error que impida ver el Dashboard.
 */
export class DashboardRestorer {
    static restore(): void {
        logger.info('UI', 'restore_dash', 'Restaurando Dashboard principal');

        // 1. Limpiar flags de error en sessionStorage
        sessionStorage.removeItem('db_init_error');
        localStorage.removeItem('last_database_error');

        // 2. Disparar evento para que App.tsx resetee su estado de sección
        window.dispatchEvent(new CustomEvent('navigate-to', { detail: 'dashboard' }));

        logger.success('UI', 'dash_restored', 'Dashboard restaurado correctamente');
    }
}
