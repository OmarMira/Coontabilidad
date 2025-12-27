// Encryption Worker
// Handles cryptographic operations in a separate thread

let key: CryptoKey | null = null;

self.onmessage = async (e: MessageEvent) => {
    const { type, id, payload } = e.data;

    try {
        switch (type) {
            case 'INITIALIZE':
                await initializeKey(payload);
                self.postMessage({ type: 'SUCCESS', id });
                break;

            case 'ENCRYPT':
                if (!key) throw new Error('Key not initialized');
                const result = await encrypt(payload.data);
                self.postMessage({ type: 'ENCRYPT_SUCCESS', id, payload: result });
                break;

            default:
                console.warn('Unknown message type', type);
        }
    } catch (error: any) {
        self.postMessage({ type: 'ERROR', id, error: error.message });
    }
};

async function initializeKey(payload: { password: string, salt: Uint8Array, config: any }) {
    const { password, salt, config } = payload;

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Ensure salt is ArrayBuffer, not SharedArrayBuffer
    let saltBuffer: ArrayBuffer;
    if (salt.buffer instanceof SharedArrayBuffer) {
        saltBuffer = new ArrayBuffer(salt.byteLength);
        new Uint8Array(saltBuffer).set(salt);
    } else {
        saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength);
    }

    key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: config.iterations,
            hash: config.hash
        },
        keyMaterial,
        { name: 'AES-GCM', length: config.keyLength },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encrypt(data: ArrayBuffer) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key!,
        data
    );

    return {
        data: encrypted,
        iv,
        salt: null // Salt is managed by the vault/context generally, but can be passed back if needed
    };
}
