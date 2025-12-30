// Encryption Worker
// Handles cryptographic operations in a separate thread
import sjcl from 'sjcl';

let key: CryptoKey | null = null;
let sjclPassword: string | null = null;

self.onmessage = async (e: MessageEvent) => {
    const { type, id, payload } = e.data;

    try {
        switch (type) {
            case 'INITIALIZE':
                await initializeKey(payload);
                self.postMessage({ type: 'SUCCESS', id });
                break;

            case 'ENCRYPT':
                // Check if we have a key (Web Crypto) or password (SJCL)
                if (!key && !sjclPassword) throw new Error('Key not initialized');

                let result;
                if (key) {
                    try {
                        result = await encryptWebCrypto(payload.data);
                    } catch (err) {
                        console.warn('Web Crypto encryption failed, falling back to SJCL if available', err);
                        if (sjclPassword) {
                            result = await encryptSJCL(payload.data);
                        } else {
                            throw err;
                        }
                    }
                } else {
                    result = await encryptSJCL(payload.data);
                }

                self.postMessage({ type: 'ENCRYPT_SUCCESS', id, payload: result });
                break;

            case 'HASH_CHAIN':
                const hash = await calculateAuditHash(payload.previousHash, payload.content);
                self.postMessage({ type: 'HASH_SUCCESS', id, payload: hash });
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
    sjclPassword = password; // Store for SJCL fallback

    try {
        if (!crypto.subtle) throw new Error('Web Crypto API not available');

        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        // Ensure salt is ArrayBuffer
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
                iterations: config.iterations || 10000,
                hash: config.hash || 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: config.keyLength || 256 },
            false,
            ['encrypt', 'decrypt']
        );
    } catch (e) {
        console.warn('Web Crypto initialization failed, will use SJCL only.', e);
        key = null;
    }
}

async function encryptWebCrypto(data: ArrayBuffer) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key!,
        data
    );

    return {
        data: encrypted,
        iv,
        salt: null,
        method: 'webcrypto'
    };
}

// SJCL Encryption implementation
async function encryptSJCL(data: ArrayBuffer) {
    if (!sjclPassword) throw new Error('SJCL Password not set');

    // Convert ArrayBuffer to SJCL bitArray
    const dataArray = new Uint8Array(data);
    // Safe conversion for arbitrary binary data to something SJCL handles?
    // SJCL's codec.utf8String might fail on binary. 
    // Ideally we use sjcl.codec.hex or base64.
    // Let's use Base64 to be safe.
    const binaryString = String.fromCharCode(...dataArray);
    const base64 = btoa(binaryString);
    const bits = sjcl.codec.base64.toBits(base64);

    // Encrypt
    const encryptedJsonFn = sjcl.json.encrypt(sjclPassword, base64, { ks: 256, iter: 10000 } as any);
    const encryptedStr = typeof encryptedJsonFn === 'string' ? encryptedJsonFn : JSON.stringify(encryptedJsonFn);

    return {
        data: new TextEncoder().encode(encryptedStr).buffer, // Return JSON string as buffer
        iv: null, // SJCL packs everything
        salt: null,
        method: 'sjcl'
    };
}

async function calculateAuditHash(previousHash: string, content: any): Promise<string> {
    const contentStr = JSON.stringify(content);
    const dataToHash = previousHash + contentStr;

    if (crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(dataToHash);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
        // SJCL Hash Fallback
        const bitArray = sjcl.hash.sha256.hash(dataToHash);
        return sjcl.codec.hex.fromBits(bitArray);
    }
}
