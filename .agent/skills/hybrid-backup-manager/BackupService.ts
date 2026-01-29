
/**
 * Hybrid Backup Manager
 * 
 * Implements AES-256-GCM Encryption with PBKDF2 key derivation.
 * Supports Hybrid Storage (OPFS / Cloud) and Outbox Pattern for Offline-First sync.
 */

export interface BackupMetadata {
    id: string;
    timestamp: string;
    size_bytes: number;
    checksum: string;
}

export interface IBackupStorage {
    saveToOPFS(filename: string, data: ArrayBuffer): Promise<void>;
    saveToCloud(filename: string, data: ArrayBuffer): Promise<boolean>; // Returns false if offline/failed
}

export interface ISyncOutbox {
    queueBackup(filename: string, data: ArrayBuffer): Promise<void>;
}

export class BackupService {
    private storage: IBackupStorage;
    private outbox: ISyncOutbox;

    constructor(storage: IBackupStorage, outbox: ISyncOutbox) {
        this.storage = storage;
        this.outbox = outbox;
    }

    /**
     * Derives a cryptographic key from the user's password using PBKDF2.
     * Iterations: 210,000 (NIST/OWASP recommended for high security)
     */
    private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey(
            "raw",
            encoder.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 210000,
                hash: "SHA-256"
            },
            passwordKey,
            { name: "AES-GCM", length: 256 },
            false, // Key is not extractable (Memory Only)
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Encrypts the backup data (JSON) into a binary .aex format.
     * Format structure: [Salt (16b)] [IV (12b)] [Encrypted Data]
     */
    async encryptBackup(dataValues: object, password: string): Promise<ArrayBuffer> {
        const jsonString = JSON.stringify(dataValues);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(jsonString);

        // 1. Generate Salt and IV
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // 2. Derive Key
        const key = await this.deriveKey(password, salt);

        // 3. Encrypt
        const encryptedContent = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            dataBuffer
        );

        // 4. Pack into single buffer: Salt + IV + Content
        const resultBuffer = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
        resultBuffer.set(salt, 0);
        resultBuffer.set(iv, salt.length);
        resultBuffer.set(new Uint8Array(encryptedContent), salt.length + iv.length);

        return resultBuffer.buffer;
    }

    /**
     * Master Hybrid Backup Strategy
     * 1. Encrypts data in memory.
     * 2. Saves directly to OPFS (Local First).
     * 3. Tries Cloud sync. If failure, queues to Outbox.
     */
    async performHybridBackup(data: object, password: string): Promise<{ filename: string, synced: boolean }> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.aex`;

        // 1. Encrypt
        const encryptedBlob = await this.encryptBackup(data, password);

        // 2. Local Persistence (OPFS) - Critical Path
        await this.storage.saveToOPFS(filename, encryptedBlob);

        // 3. Hybrid Sync Strategy
        let synced = false;
        if (navigator.onLine) {
            try {
                synced = await this.storage.saveToCloud(filename, encryptedBlob);
            } catch (e) {
                console.warn("Cloud backup failed, falling back to outbox", e);
            }
        }

        // 4. Outbox Pattern
        if (!synced) {
            await this.outbox.queueBackup(filename, encryptedBlob);
            console.info("Backup queued in Outbox for future sync.");
        }

        return { filename, synced };
    }

    /**
     * Decrypts a backup file.
     */
    async decryptBackup(backupBuffer: ArrayBuffer, password: string): Promise<object> {
        const totalBytes = new Uint8Array(backupBuffer);

        // Extract Salt (16 bytes) and IV (12 bytes)
        const salt = totalBytes.slice(0, 16);
        const iv = totalBytes.slice(16, 28);
        const encryptedData = totalBytes.slice(28);

        // Derive Key
        const key = await this.deriveKey(password, salt);

        // Decrypt
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            encryptedData
        );

        const decoder = new TextDecoder();
        const jsonString = decoder.decode(decryptedBuffer);
        return JSON.parse(jsonString);
    }
}
