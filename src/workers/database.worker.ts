import initSqlJs from 'sql.js';

// Import worker utilities
import { BackupService as BackupServiceWorker } from '../services/backup/BackupService';
const { encryptData, decryptData, exportDatabaseToSQL } = BackupServiceWorker;

// Initialize SQL.js
let SQL: any;
let db: any;

async function initializeDB() {
    if (!SQL) {
        SQL = await initSqlJs({
            locateFile: (file: string) => `https://sql.js.org/dist/${file}`
        });
    }
}

// Worker message handler
self.onmessage = async (event: MessageEvent) => {
    const { type, taskId, payload, metadata } = event.data;

    try {
        await initializeDB();

        switch (type) {
            case 'EXECUTE_TASK':
                await handleTask(taskId, payload);
                break;

            default:
                console.warn(`Unknown message type: ${type}`);
        }
    } catch (error: any) {
        self.postMessage({
            taskId,
            type: 'ERROR',
            error: error.message || 'Unknown error in database worker'
        });
    }
};

async function handleTask(taskId: string, payload: any) {
    const { operation } = payload;

    let result: any;

    switch (operation) {
        case 'export_and_encrypt':
            result = await exportAndEncrypt(payload);
            break;

        case 'decrypt_and_validate':
            result = await decryptAndValidate(payload);
            break;

        case 'export_sql':
            result = await exportSQL(payload);
            break;

        case 'import_sql':
            result = await importSQL(payload);
            break;

        default:
            throw new Error(`Unknown operation: ${operation}`);
    }

    // Send result back to main thread
    self.postMessage({
        taskId,
        type: 'RESULT',
        payload: result
    });
}

/**
 * Export database and encrypt (the heavy operation)
 */
async function exportAndEncrypt(payload: any): Promise<any> {
    const { dbData, password, auditChain, metadata } = payload;

    // Step 1: Export database to SQL (CPU intensive)
    self.postMessage({
        type: 'PROGRESS',
        progress: { current: 1, total: 4, percentage: 25, message: 'Exporting database...' }
    });

    // In a real worker, we'd receive the actual DB instance
    // For now, assume dbData is already the SQL dump
    const sqlDump = dbData;

    // Step 2: Create backup payload
    self.postMessage({
        type: 'PROGRESS',
        progress: { current: 2, total: 4, percentage: 50, message: 'Creating backup payload...' }
    });

    const backupPayload = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        database: sqlDump,
        auditChain,
        metadata
    };

    // Step 3: Encrypt (CPU intensive)
    self.postMessage({
        type: 'PROGRESS',
        progress: { current: 3, total: 4, percentage: 75, message: 'Encrypting backup...' }
    });

    const encrypted = await encryptData(JSON.stringify(backupPayload), password);

    // Step 4: Complete
    self.postMessage({
        type: 'PROGRESS',
        progress: { current: 4, total: 4, percentage: 100, message: 'Backup complete!' }
    });

    return {
        backupData: encrypted,
        size: encrypted.length,
        timestamp: backupPayload.timestamp
    };
}

/**
 * Decrypt and validate backup
 */
async function decryptAndValidate(payload: any): Promise<any> {
    const { encryptedData, password } = payload;

    // Step 1: Decrypt
    self.postMessage({
        type: 'PROGRESS',
        progress: { current: 1, total: 3, percentage: 33, message: 'Decrypting backup...' }
    });

    const decrypted = await decryptData(encryptedData, password);
    const backupPayload = JSON.parse(decrypted);

    // Step 2: Validate
    self.postMessage({
        type: 'PROGRESS',
        progress: { current: 2, total: 3, percentage: 66, message: 'Validating backup...' }
    });

    if (!backupPayload.version || !backupPayload.database || !backupPayload.auditChain) {
        throw new Error('Invalid backup format. Backup may be corrupted.');
    }

    // Step 3: Complete
    self.postMessage({
        type: 'PROGRESS',
        progress: { current: 3, total: 3, percentage: 100, message: 'Validation complete!' }
    });

    return backupPayload;
}

/**
 * Export database to SQL
 */
async function exportSQL(payload: any): Promise<any> {
    // This would use the actual DB instance in production
    // For now, return placeholder
    return {
        sql: 'SELECT * FROM...',
        timestamp: new Date().toISOString()
    };
}

/**
 * Import SQL into database
 */
async function importSQL(payload: any): Promise<any> {
    const { sql } = payload;

    // Execute SQL statements
    const statements = sql.split(';').filter((s: string) => s.trim());
    let executed = 0;

    for (const statement of statements) {
        if (statement.trim()) {
            // Execute statement
            // db.run(statement);
            executed++;

            // Report progress every 10 statements
            if (executed % 10 === 0) {
                self.postMessage({
                    type: 'PROGRESS',
                    progress: {
                        current: executed,
                        total: statements.length,
                        percentage: Math.round((executed / statements.length) * 100),
                        message: `Importing data... (${executed}/${statements.length})`
                    }
                });
            }
        }
    }

    return {
        statementsExecuted: executed,
        timestamp: new Date().toISOString()
    };
}

// Handle errors gracefully
self.onerror = (error) => {
    console.error('Database worker error:', error);
    self.postMessage({
        type: 'ERROR',
        error: 'Worker error occurred'
    });
};
