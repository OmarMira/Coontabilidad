export interface EncryptedPayload {
    data: ArrayBuffer;
    iv: Uint8Array;
    salt: Uint8Array;
}

export class EncryptionVault {
    private worker: Worker;
    private keyDerivationConfig = {
        algorithm: 'PBKDF2',
        hash: 'SHA-256',
        iterations: 100000,
        keyLength: 256
    };

    constructor() {
        // Worker dedicado para operaciones criptográficas
        this.worker = new Worker(new URL('../../workers/encryption.worker.ts', import.meta.url), {
            type: 'module',
            name: 'accountexpress-crypto-worker'
        });
    }

    async initializeWithPassword(password: string, salt?: Uint8Array): Promise<void> {
        return new Promise((resolve, reject) => {
            const messageId = `init_${Date.now()}`;

            const handler = (event: MessageEvent) => {
                if (event.data.id === messageId) {
                    this.worker.removeEventListener('message', handler);

                    if (event.data.type === 'SUCCESS') {
                        resolve();
                    } else {
                        reject(new Error(event.data.error));
                    }
                }
            };

            this.worker.addEventListener('message', handler);

            this.worker.postMessage({
                type: 'INITIALIZE',
                id: messageId,
                payload: {
                    password,
                    salt: salt || this.generateSalt(),
                    config: this.keyDerivationConfig
                }
            });

            // Timeout de seguridad
            setTimeout(() => {
                this.worker.removeEventListener('message', handler);
                reject(new Error('Timeout en inicialización de cifrado'));
            }, 30000);
        });
    }

    async encryptData(data: ArrayBuffer): Promise<EncryptedPayload> {
        return new Promise((resolve, reject) => {
            const messageId = `encrypt_${Date.now()}`;

            const handler = (event: MessageEvent) => {
                if (event.data.id === messageId) {
                    this.worker.removeEventListener('message', handler);

                    if (event.data.type === 'ENCRYPT_SUCCESS') {
                        resolve(event.data.payload);
                    } else {
                        reject(new Error(event.data.error));
                    }
                }
            };

            this.worker.addEventListener('message', handler);

            this.worker.postMessage({
                type: 'ENCRYPT',
                id: messageId,
                payload: { data }
            });
        });
    }

    private generateSalt(): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(16));
    }
}
