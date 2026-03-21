import { logger } from '../../core/logging/SystemLogger';
import sjcl from 'sjcl';

/**
 * SISTEMA DE CIFRADO HÃBRIDO
 * 
 * Triple fallback: WebCrypto API â†’ SJCL â†’ Embedded
 */

export interface EncryptedPackage {
    method: 'webcrypto' | 'sjcl' | 'embedded';
    data: string | number[];
    salt?: number[];
    iv?: number[];
}

export class HybridEncryptionSystem {
    private webCryptoAvailable: boolean = false;
    private sjclAvailable: boolean = false;

    constructor() {
        this.initializeEncryption();
    }

    private async initializeEncryption() {
        // Detectar capacidades de cifrado disponibles
        this.webCryptoAvailable = typeof window !== 'undefined' && !!window.crypto && !!window.crypto.subtle;
        this.sjclAvailable = typeof sjcl !== 'undefined';

        logger.info('HybridEncryptionSystem', 'info', 'ðŸ” Encryption capabilities initialized:', {
            webCrypto: this.webCryptoAvailable,
            sjcl: this.sjclAvailable,
            embedded: true
        });
    }

    async encrypt(data: any, password: string): Promise<EncryptedPackage> {
        // Intentar WebCrypto API primero
        if (this.webCryptoAvailable) {
            try {
                return await this.encryptWithWebCrypto(data, password);
            } catch (error) {
                logger.warn('HybridEncryptionSystem', 'warn', 'WebCrypto failed, falling back to SJCL:', error);
            }
        }

        // Fallback a SJCL
        if (this.sjclAvailable) {
            try {
                return this.encryptWithSJCL(data, password);
            } catch (error) {
                logger.warn('HybridEncryptionSystem', 'warn', 'SJCL failed, falling back to embedded:', error);
            }
        }

        // Fallback final: cifrado embebido simple
        return this.encryptWithEmbedded(data, password);
    }

    async decrypt(encryptedData: EncryptedPackage, password: string): Promise<any> {
        const method = encryptedData.method || 'embedded';

        switch (method) {
            case 'webcrypto':
                return await this.decryptWithWebCrypto(encryptedData, password);
            case 'sjcl':
                return this.decryptWithSJCL(encryptedData, password);
            case 'embedded':
            default:
                return this.decryptWithEmbedded(encryptedData, password);
        }
    }

    private async encryptWithWebCrypto(data: any, password: string): Promise<EncryptedPackage> {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));

        // Generar salt y IV
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // Derivar clave con PBKDF2
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        // Cifrar con AES-256-GCM
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            dataBuffer
        );

        return {
            method: 'webcrypto',
            salt: Array.from(salt),
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        };
    }

    private async decryptWithWebCrypto(encryptedData: EncryptedPackage, password: string): Promise<any> {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        // Reconstruir buffers
        const salt = new Uint8Array(encryptedData.salt!);
        const iv = new Uint8Array(encryptedData.iv!);
        const data = new Uint8Array(encryptedData.data as number[]);

        // Derivar clave
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const key = await window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );

        // Descifrar
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        return JSON.parse(decoder.decode(decrypted));
    }

    private encryptWithSJCL(data: any, password: string): EncryptedPackage {
        // ImplementaciÃ³n SJCL - convert result to JSON string for type compatibility
        const encrypted = sjcl.encrypt(password, JSON.stringify(data));
        return {
            method: 'sjcl',
            data: typeof encrypted === 'string' ? encrypted : JSON.stringify(encrypted)
        };
    }

    private decryptWithSJCL(encryptedData: EncryptedPackage, password: string): any {
        return JSON.parse(sjcl.decrypt(password, encryptedData.data as string));
    }

    private encryptWithEmbedded(data: any, password: string): EncryptedPackage {
        // Cifrado simple embebido (solo para fallback)
        const dataStr = JSON.stringify(data);
        let encrypted = '';

        for (let i = 0; i < dataStr.length; i++) {
            const char = dataStr.charCodeAt(i);
            const keyChar = password.charCodeAt(i % password.length);
            encrypted += String.fromCharCode(char ^ keyChar);
        }

        return {
            method: 'embedded',
            data: btoa(encrypted)
        };
    }

    private decryptWithEmbedded(encryptedData: EncryptedPackage, password: string): any {
        const encrypted = atob(encryptedData.data as string);
        let decrypted = '';

        for (let i = 0; i < encrypted.length; i++) {
            const char = encrypted.charCodeAt(i);
            const keyChar = password.charCodeAt(i % password.length);
            decrypted += String.fromCharCode(char ^ keyChar);
        }

        return JSON.parse(decrypted);
    }
}

export const hybridEncryption = new HybridEncryptionSystem();
