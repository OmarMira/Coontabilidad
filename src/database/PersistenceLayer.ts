
import { logger } from '../core/logging/SystemLogger';

const DB_NAME = 'AccountExpressDB';
const STORE_NAME = 'sqlite_store';
const KEY_NAME = 'main_db';

// NASA Standard: Key must reside in volatile memory only
let encryptionKey: CryptoKey | null = null;

export const setEncryptionKey = (key: CryptoKey) => {
    encryptionKey = key;
    logger.info('Persistence', 'key_set', 'Clave de cifrado establecida en memoria volátil');
};

/**
 * Cifra datos usando AES-256-GCM
 */
async function encryptData(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended for GCM
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        data
    );

    // Concatenate IV + Encrypted Data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    return result;
}

/**
 * Descifra datos usando AES-256-GCM
 */
async function decryptData(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);

    return new Uint8Array(await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        ciphertext
    ));
}

/**
 * Guarda la base de datos (Uint8Array) en IndexedDB
 * NASA Standard: Si falla el cifrado, abortar.
 */
export async function saveDatabase(data: Uint8Array): Promise<void> {
    return new Promise(async (resolve, reject) => {
        let blobToSave = data;

        // Apply Encryption if Key exists
        if (encryptionKey) {
            try {
                blobToSave = await encryptData(data, encryptionKey);
            } catch (cryptoError) {
                logger.error('Persistence', 'encrypt_fail', 'Fallo crítico al cifrar DB. Abortando guardado.', cryptoError);
                reject(new Error('CRITICAL_SECURITY_FAILURE: Encryption failed. Write aborted.'));
                return;
            }
        } else {
            logger.warn('Persistence', 'no_key', 'Guardando DB sin cifrar (Clave no establecida)');
        }

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

            const putRequest = store.put(blobToSave, KEY_NAME);

            putRequest.onsuccess = () => {
                logger.info('Persistence', 'save_success', 'Base de datos guardada en IndexedDB', { size: blobToSave.length, encrypted: !!encryptionKey });
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

            getRequest.onsuccess = async () => {
                const result = getRequest.result as Uint8Array;
                if (result) {
                    // Try to decrypt if key exists
                    if (encryptionKey) {
                        try {
                            const decrypted = await decryptData(result, encryptionKey);
                            logger.info('Persistence', 'load_success', 'DB cargada y descifrada correctamente');
                            resolve(decrypted);
                        } catch (e) {
                            logger.error('Persistence', 'decrypt_fail', 'Error al descifrar DB. Clave incorrecta o datos corruptos.', e);
                            // Fail secure: Do not return encrypted blob
                            resolve(null);
                        }
                    } else {
                        // Check if file is likely encrypted (check existing magic headers of sqlite vs random)
                        // SQLite header is "SQLite format 3\0" (16 bytes)
                        // If it's encrypted, the first bytes will be random IV.
                        const header = new TextDecoder().decode(result.slice(0, 16));
                        if (header.startsWith('SQLite')) {
                            logger.info('Persistence', 'load_plain', 'DB cargada (Texto plano)');
                            resolve(result);
                        } else {
                            logger.warn('Persistence', 'load_locked', 'DB cifrada detectada pero no hay clave en memoria.');
                            resolve(null); // Lock out
                        }
                    }
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

        request.onerror = () => {
            resolve(null);
        };
    });
}
