import { logger } from './logging/SystemLogger';

/**
 * SERVICIO DE LIMPIEZA NUCLEAR
 * Elimina todos los rastros de datos para permitir un inicio desde cero absoluto.
 */
export class NuclearCleanExecution {
    static async execute(): Promise<void> {
        logger.emergency('System', 'nuclear_clean_start', '☢️ INICIANDO LIMPIEZA NUCLEAR COMPLETA');

        try {
            // 1. Limpiar LocalStorage
            localStorage.clear();
            logger.info('System', 'storage_clear', 'LocalStorage eliminado');

            // 2. Limpiar SessionStorage
            sessionStorage.clear();
            logger.info('System', 'session_clear', 'SessionStorage eliminado');

            // 3. Eliminar IndexedDB
            const dbs = await window.indexedDB.databases();
            for (const dbInfo of dbs) {
                if (dbInfo.name) {
                    window.indexedDB.deleteDatabase(dbInfo.name);
                }
            }
            logger.info('System', 'idb_clear', 'Bases de datos IndexedDB eliminadas');

            // 4. Eliminar archivos SQLite en OPFS
            if (typeof navigator !== 'undefined' && navigator.storage && 'getDirectory' in navigator.storage) {
                const opfsRoot = await navigator.storage.getDirectory();
                try {
                    await opfsRoot.removeEntry('accountexpress.db');
                    logger.success('System', 'opfs_clear', 'Archivo SQLite eliminado de OPFS');
                } catch (e) {
                    logger.debug('System', 'opfs_skip', 'No se encontró archivo en OPFS para eliminar');
                }
            }

            // 5. Desregistrar Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) {
                    await reg.unregister();
                }
                logger.info('System', 'sw_clear', 'Service Workers desregistrados');
            }

            // 6. Limpiar Caches de la API del Navegador
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                for (const name of cacheNames) {
                    await caches.delete(name);
                }
                logger.info('System', 'cache_clear', 'Caches del navegador eliminadas');
            }

            logger.success('System', 'nuclear_clean_success', '☢️ LIMPIEZA NUCLEAR COMPLETADA CON ÉXITO');

        } catch (error: any) {
            logger.critical('System', 'nuclear_clean_failed', 'Fallo en la limpieza nuclear', { error: error.message });
            throw error;
        }
    }
}
