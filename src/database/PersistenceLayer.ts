
import { logger } from '../core/logging/SystemLogger';

const DB_NAME = 'AccountExpressDB';
const STORE_NAME = 'sqlite_store';
const KEY_NAME = 'main_db';

/**
 * Guarda la base de datos (Uint8Array) en IndexedDB
 */
export async function saveDatabase(data: Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const putRequest = store.put(data, KEY_NAME);

            putRequest.onsuccess = () => {
                logger.info('Persistence', 'save_success', 'Base de datos guardada en IndexedDB', { size: data.length });
                resolve();
            };

            putRequest.onerror = () => {
                logger.error('Persistence', 'save_error', 'Error guardando en IndexedDB', putRequest.error);
                reject(putRequest.error);
            };
        };

        request.onerror = () => {
            logger.error('Persistence', 'open_error', 'Error abriendo IndexedDB', request.error);
            reject(request.error);
        };
    });
}

/**
 * Carga la base de datos desde IndexedDB
 */
export async function loadDatabase(): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);

            const getRequest = store.get(KEY_NAME);

            getRequest.onsuccess = () => {
                const result = getRequest.result;
                if (result) {
                    logger.info('Persistence', 'load_success', 'Base de datos cargada de IndexedDB');
                    resolve(result as Uint8Array);
                } else {
                    logger.warn('Persistence', 'load_empty', 'No se encontró base de datos en IndexedDB');
                    resolve(null);
                }
            };

            getRequest.onerror = () => {
                logger.error('Persistence', 'load_error', 'Error leyendo de IndexedDB', getRequest.error);
                reject(getRequest.error);
            };
        };

        request.onerror = () => { // Initial open might fail if DB doesn't exist? No, it creates it.
            // Unless blocked.
            resolve(null);
        };
    });
}
