import { SQLiteEngine } from '../../core/database/SQLiteEngine';

/**
 * BackupServiceWorker
 * 
 * Worker-compatible backup operations that don't block the main thread.
 * These functions are designed to be called from workers.
 */

/**
 * Export database as SQL dump (Worker-safe)
 */
export async function exportDatabaseToSQL(db: any): Promise<string> {
    // Get all tables
    const tables = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    if (!tables || tables.length === 0) return '';

    let dump = '';
    const tableNames = tables[0].values.map((row: any) => row[0] as string);

    for (const tableName of tableNames) {
        // Get table schema
        const schema = db.exec(`SELECT sql FROM sqlite_master WHERE name = '${tableName}'`);
        if (schema && schema[0]) {
            dump += `${schema[0].values[0][0]};\\n\\n`;
        }

        // Get table data
        const rows = db.exec(`SELECT * FROM ${tableName}`);
        if (rows && rows[0]) {
            for (const row of rows[0].values) {
                const values = row.map((v: any) =>
                    typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
                ).join(', ');
                dump += `INSERT INTO ${tableName} VALUES (${values});\\n`;
            }
        }

        dump += '\\n';
    }

    return dump;
}

/**
 * Encrypt data using AES-256-GCM (Worker-safe)
 */
export async function encryptData(data: string, password: string): Promise<string> {
    // Derive key from password using PBKDF2
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt data using AES-256-GCM (Worker-safe)
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract salt, iv, encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    // Derive key from password
    const key = await deriveKey(password, salt);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
    );

    // Return as string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt as BufferSource,
            iterations: 100000,
            hash: 'SHA-256'
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}
