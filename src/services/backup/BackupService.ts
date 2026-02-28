import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { db as globalDb } from '../../database/simple-db';
import { BackupLocationService } from '../BackupLocationService';

import { AuditChainService } from '../audit/AuditChainService';
import { ExponentialBackoff } from '../../core/resilience/ExponentialBackoff';
import { ProductionLogger } from '../../core/logging/ProductionLogger';
import { timestampService, TimestampResponse } from '../../core/timestamping/TimestampService';
import { metricsCollector, MetricCategory } from '../../core/monitoring/MetricsCollector';
import { TransactionManager } from '../../core/database/TransactionManager';

type Listener = (data: any) => void;

class SimpleEventEmitter {
    private listeners: Record<string, Listener[]> = {};

    on(event: string, listener: Listener) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(listener);
    }

    off(event: string, listener: Listener) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }

    emit(event: string, data: any) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(l => l(data));
    }
}


/**
 * BackupService - Versatile Multi-Destination Backup System
 * 
 * Features:
 * - AES-256-GCM encryption for all backups
 * - Multi-destination support (Local, Cloud, Remote Server)
 * - Atomic restoration (all-or-nothing)
 * - Integrity verification before restoration
 * - Scheduled backups (cron-style)
 * 
 * SECURITY:
 * - Encryption key NEVER stored in database or localStorage
 * - Password-derived key using PBKDF2
 * - Backup includes SQLite dump + audit chain
 * 
 * @example
 * const backupService = new BackupService(db);
 * 
 * // Create encrypted backup
 * const backup = await backupService.createBackup('myPassword123');
 * 
 * // Save to local disk
 * await backupService.saveToLocal(backup, 'backup-2026-01-30.aex');
 * 
 * // Restore from backup
 * await backupService.restoreBackup(backupData, 'myPassword123');
 */
export class BackupService {
    public static eventEmitter = new SimpleEventEmitter();
    private auditChainService: AuditChainService;

    private txManager: TransactionManager;

    constructor(private db: SQLiteEngine) {
        this.auditChainService = new AuditChainService(db);
        this.txManager = new TransactionManager(db);
    }

    /**
     * Create encrypted backup (.aex file) with exponential backoff
     * 
     * @param password - User password for encryption
     * @returns Encrypted backup data
     */
    public async createBackup(password: string): Promise<EncryptedBackup> {
        const startTime = Date.now();
        const backoff = new ExponentialBackoff({
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 8000
        });

        try {
            return await backoff.execute(async () => {
                ProductionLogger.info('BackupService', 'Creating backup');

                // 1. Verify audit chain integrity before backup
                const integrity = await this.auditChainService.verifyIntegrity();
                if (!integrity.valid) {
                    throw new Error(
                        `Cannot create backup: Audit chain integrity compromised. ` +
                        `${integrity.errors.length} errors detected.`
                    );
                }

                // 2. Export database (SQLite dump)
                const dbDump = await this.exportDatabase();

                // 3. Export audit chain
                const auditChain = (await this.db.select('SELECT * FROM audit_chain ORDER BY logic_clock')) as unknown as AuditChainRecord[];

                // 4. Get current logic_clock
                const logicClock = await this.auditChainService.getCurrentLogicClock();

                // 5. Create backup payload
                const payload: BackupPayload = {
                    version: '1.0',
                    timestamp: new Date().toISOString(),
                    logicClock,
                    database: dbDump,
                    auditChain,
                    metadata: {
                        recordCount: auditChain.length,
                        lastChainHash: integrity.lastChainHash
                    }
                };

                // 6. Encrypt with AES-256-GCM
                const encrypted = await this.encrypt(JSON.stringify(payload), password);

                // 7. Obtain RFC 3161 timestamp from FreeTSA
                let rfc3161Timestamp: TimestampResponse | undefined;
                try {
                    const encoder = new TextEncoder();
                    const dataToTimestamp = encoder.encode(encrypted);

                    rfc3161Timestamp = await timestampService.getTimestamp({
                        data: dataToTimestamp.buffer,
                        hashAlgorithm: 'SHA-256',
                        nonce: true,
                        certReq: true
                    });

                    ProductionLogger.info('BackupService', 'RFC 3161 timestamp obtained', {
                        timestamp: rfc3161Timestamp.timestamp,
                        serialNumber: rfc3161Timestamp.serialNumber,
                        tsaName: rfc3161Timestamp.tsaName
                    });

                    // Record timestamp metric
                    metricsCollector.recordMetric({
                        category: MetricCategory.TIMESTAMP,
                        operation: 'rfc3161_timestamp',
                        status: 'success',
                        metadata: {
                            serialNumber: rfc3161Timestamp.serialNumber,
                            tsaName: rfc3161Timestamp.tsaName
                        }
                    });
                } catch (timestampError) {
                    ProductionLogger.error(
                        'BackupService',
                        'Failed to obtain RFC 3161 timestamp',
                        timestampError as Error
                    );

                    // Record timestamp failure metric
                    metricsCollector.recordMetric({
                        category: MetricCategory.TIMESTAMP,
                        operation: 'rfc3161_timestamp',
                        status: 'failure',
                        metadata: {
                            error: (timestampError as Error).message
                        }
                    });

                    // Continue without timestamp (degraded mode)
                    // En producción enterprise, esto debería ser un error fatal
                }

                const backup: EncryptedBackup = {
                    filename: `backup-${new Date().toISOString().split('T')[0]}.aex`,
                    data: encrypted,
                    size: encrypted.length,
                    timestamp: payload.timestamp,
                    logicClock,
                    rfc3161Timestamp
                };

                const duration = Date.now() - startTime;

                ProductionLogger.info('BackupService', 'Backup created successfully', {
                    size: backup.size,
                    logicClock: backup.logicClock,
                    hasRFC3161: !!rfc3161Timestamp,
                    duration
                });

                // Record backup success metric
                metricsCollector.recordMetric({
                    category: MetricCategory.BACKUP,
                    operation: 'create_backup',
                    status: 'success',
                    duration,
                    value: backup.size,
                    metadata: {
                        logicClock: backup.logicClock,
                        hasRFC3161: !!rfc3161Timestamp,
                        recordCount: payload.metadata.recordCount
                    }
                });

                return backup;
            }, 'BackupService.createBackup');
        } catch (error) {
            const duration = Date.now() - startTime;

            // Record backup failure metric
            metricsCollector.recordMetric({
                category: MetricCategory.BACKUP,
                operation: 'create_backup',
                status: 'failure',
                duration,
                metadata: {
                    error: (error as Error).message
                }
            });

            throw error;
        }
    }

    /**
     * Create backup and automatically queue for cloud sync using the Outbox Pattern.
     * Objective 3.4 implementation.
     */
    public async createBackupAndQueueSync(password: string, cloudConfig: any): Promise<EncryptedBackup> {
        return await this.txManager.executeForensicWrite(
            async () => {
                const backup = await this.createBackup(password);
                return backup;
            },
            {
                module: 'backups',
                operation: 'UPLOAD',
                payload: {
                    fileName: `backup-${new Date().toISOString().split('T')[0]}.aex`,
                    cloudConfig
                }
            }
        );
    }

    /**
     * Restore from encrypted backup with exponential backoff and RFC 3161 verification
     * 
     * ATOMIC: All-or-nothing restoration
     * 
     * @param encryptedData - Encrypted backup data
     * @param password - User password for decryption
     * @param rfc3161Token - Optional RFC 3161 timestamp token for verification
     * @throws Error if integrity check fails or decryption fails
     */
    public async restoreBackup(
        encryptedData: string,
        password: string,
        rfc3161Token?: string
    ): Promise<void> {
        const backoff = new ExponentialBackoff({
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 8000
        });

        return await backoff.execute(async () => {
            ProductionLogger.info('BackupService', 'Restoring backup');

            // 1. Verify RFC 3161 timestamp if provided
            if (rfc3161Token) {
                try {
                    const encoder = new TextEncoder();
                    const dataToVerify = encoder.encode(encryptedData);

                    const verification = await timestampService.verifyTimestamp(
                        rfc3161Token,
                        dataToVerify.buffer
                    );

                    if (!verification.valid) {
                        ProductionLogger.error(
                            'BackupService',
                            'RFC 3161 timestamp verification failed',
                            undefined,
                            { errors: verification.errors }
                        );
                        throw new Error(
                            `Timestamp verification failed: ${verification.errors.join(', ')}`
                        );
                    }

                    ProductionLogger.info('BackupService', 'RFC 3161 timestamp verified', {
                        timestamp: verification.timestamp,
                        serialNumber: verification.serialNumber,
                        tsaName: verification.tsaName
                    });
                } catch (timestampError) {
                    ProductionLogger.error(
                        'BackupService',
                        'RFC 3161 timestamp verification error',
                        timestampError as Error
                    );
                    throw timestampError;
                }
            } else {
                ProductionLogger.warn(
                    'BackupService',
                    'Restoring backup without RFC 3161 timestamp verification'
                );
            }

            // 2. Decrypt
            let payload: BackupPayload;
            try {
                const decrypted = await this.decrypt(encryptedData, password);
                payload = JSON.parse(decrypted);
            } catch (e) {
                throw new Error('Decryption failed. Invalid password or corrupted backup.');
            }

            // 3. Verify backup integrity
            if (!payload.version || !payload.database || !payload.auditChain) {
                throw new Error('Invalid backup format. Backup may be corrupted.');
            }

            // 4. Verify logic_clock (prevent importing old/corrupted data)
            const currentLogicClock = await this.auditChainService.getCurrentLogicClock();
            if (payload.logicClock < currentLogicClock) {
                ProductionLogger.warn(
                    'BackupService',
                    'Backup is older than current database',
                    {
                        backupLogicClock: payload.logicClock,
                        currentLogicClock
                    }
                );
                // Allow restoration but warn user
            }

            // 4. ATOMIC RESTORATION (transaction)
            await this.db.executeTransaction(async () => {
                // Drop all tables
                await this.dropAllTables();

                // Restore database from dump
                await this.importDatabase(payload.database);

                // Restore audit chain
                for (const record of payload.auditChain) {
                    const auditRecord = record as AuditChainRecord;
                    this.db.run(`
                        INSERT INTO audit_chain (
                            id, timestamp, event_type, entity_table, entity_id, user_id,
                            content_payload, content_hash, previous_hash, chain_hash, logic_clock
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        auditRecord.id,
                        auditRecord.timestamp,
                        auditRecord.event_type,
                        auditRecord.entity_table,
                        auditRecord.entity_id,
                        auditRecord.user_id,
                        auditRecord.content_payload,
                        auditRecord.content_hash,
                        auditRecord.previous_hash,
                        auditRecord.chain_hash,
                        auditRecord.logic_clock
                    ]);
                }

                // Update logic_clock in system_config
                this.db.run(
                    'UPDATE system_config SET value = ? WHERE key = ?',
                    [payload.logicClock.toString(), 'logic_clock']
                );
            });

            // 5. Verify integrity after restoration
            const postRestoreIntegrity = await this.auditChainService.verifyIntegrity();
            if (!postRestoreIntegrity.valid) {
                throw new Error(
                    `Restoration failed integrity check. Database may be corrupted. ` +
                    `${postRestoreIntegrity.errors.length} errors detected.`
                );
            }

            ProductionLogger.info('BackupService', 'Backup restored successfully', {
                logicClock: payload.logicClock
            });
        }, 'BackupService.restoreBackup');
    }

    /**
     * Save backup to local disk (File System Access API) with exponential backoff
     * 
     * @param backup - Encrypted backup
     * @param filename - Filename (optional)
     */
    public async saveToLocal(backup: EncryptedBackup, filename?: string): Promise<void> {
        const backoff = new ExponentialBackoff({
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 8000
        });

        return await backoff.execute(async () => {
            const fname = filename || backup.filename;

            // Use File System Access API (modern browsers)
            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await (window as any).showSaveFilePicker({
                        suggestedName: fname,
                        types: [{
                            description: 'AccountExpress Backup',
                            accept: { 'application/octet-stream': ['.aex'] }
                        }]
                    });

                    const writable = await handle.createWritable();
                    await writable.write(backup.data);
                    await writable.close();

                    ProductionLogger.info('BackupService', 'Backup saved to local disk', { filename: fname });
                } catch (e) {
                    // User cancelled or API not available
                    ProductionLogger.error('BackupService', 'Failed to save file', e as Error);
                    throw new Error('Failed to save backup to local disk');
                }
            } else {
                // Fallback: Download via blob
                const blob = new Blob([backup.data], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fname;
                a.click();
                URL.revokeObjectURL(url);

                ProductionLogger.info('BackupService', 'Backup downloaded via fallback', { filename: fname });
            }
        }, 'BackupService.saveToLocal');
    }

    /**
     * Upload backup to cloud storage (Google Drive, AWS S3, etc.) with exponential backoff
     * 
     * @param backup - Encrypted backup
     * @param destination - Cloud destination config
     */
    public async saveToCloud(backup: EncryptedBackup, destination: CloudDestination): Promise<void> {
        const backoff = new ExponentialBackoff({
            maxRetries: 5,
            baseDelay: 2000,
            maxDelay: 32000
        });

        return await backoff.execute(async () => {
            ProductionLogger.info('BackupService', 'Uploading to cloud', { provider: destination.provider });

            switch (destination.provider) {
                case 'google-drive':
                    await this.uploadToGoogleDrive(backup, destination);
                    break;
                case 'aws-s3':
                    await this.uploadToS3(backup, destination);
                    break;
                default:
                    throw new Error(`Unsupported cloud provider: ${destination.provider}`);
            }

            ProductionLogger.info('BackupService', 'Cloud upload successful', { provider: destination.provider });
        }, 'BackupService.saveToCloud');
    }

    /**
     * Send backup to remote server (SFTP, REST API) with exponential backoff
     * 
     * @param backup - Encrypted backup
     * @param destination - Remote server config
     */
    public async saveToRemoteServer(backup: EncryptedBackup, destination: RemoteDestination): Promise<void> {
        const backoff = new ExponentialBackoff({
            maxRetries: 5,
            baseDelay: 2000,
            maxDelay: 32000
        });

        return await backoff.execute(async () => {
            ProductionLogger.info('BackupService', 'Uploading to remote server', { protocol: destination.protocol });

            if (destination.protocol === 'rest') {
                // Send via HTTP POST
                const response = await fetch(destination.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/octet-stream',
                        'Authorization': `Bearer ${destination.token}`
                    },
                    body: backup.data
                });

                if (!response.ok) {
                    throw new Error(`Failed to upload to remote server: ${response.statusText}`);
                }

                ProductionLogger.info('BackupService', 'Remote upload successful');
            } else if (destination.protocol === 'sftp') {
                // SFTP upload (requires server-side proxy or browser extension)
                throw new Error('SFTP upload requires server-side implementation');
            }
        }, 'BackupService.saveToRemoteServer');
    }

    /**
     * Encrypt data using AES-256-GCM
     * 
     * @param data - Data to encrypt
     * @param password - User password
     * @returns Encrypted data (base64)
     * @private
     */
    private async encrypt(data: string, password: string): Promise<string> {
        // Derive key from password using PBKDF2
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await this.deriveKey(password, salt);

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
     * Decrypt data using AES-256-GCM
     * 
     * @param encryptedData - Encrypted data (base64)
     * @param password - User password
     * @returns Decrypted data
     * @private
     */
    private async decrypt(encryptedData: string, password: string): Promise<string> {
        // Decode base64
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

        // Extract salt, iv, encrypted data
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encrypted = combined.slice(28);

        // Derive key from password
        const key = await this.deriveKey(password, salt);

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
     * @private
     */
    private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);

        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey'] as any[]
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256'
            } as any,
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt'] as any[]
        );
    }

    /**
     * Export database as SQL dump
     * @private
     */
    private async exportDatabase(): Promise<string> {
        // Get all tables
        const tables = await this.db.select(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);

        if (!Array.isArray(tables)) return '';

        let dump = '';

        for (const table of tables) {
            const tableName = table.name;

            // Get table schema
            const schema = await this.db.select(`SELECT sql FROM sqlite_master WHERE name = ?`, [tableName]);
            dump += `${schema[0].sql};\n\n`;


            // Get table data
            const rows = await this.db.select(`SELECT * FROM ${tableName}`);
            if (Array.isArray(rows)) {
                for (const row of rows) {
                    const values = Object.values(row).map(v =>
                        typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
                    ).join(', ');
                    dump += `INSERT INTO ${tableName} VALUES (${values});\n`;
                }
            }

            dump += '\n';
        }

        return dump;
    }

    /**
     * Import database from SQL dump
     * @private
     */
    private async importDatabase(dump: string): Promise<void> {
        const statements = dump.split(';').filter(s => s.trim());
        for (const statement of statements) {
            if (statement.trim()) {
                this.db.exec(statement);
            }
        }
    }

    /**
     * Drop all tables (for restoration)
     * @private
     */
    private async dropAllTables(): Promise<void> {
        const tables = await this.db.select(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);

        if (!Array.isArray(tables)) return;

        for (const table of tables) {
            this.db.exec(`DROP TABLE IF EXISTS ${table.name}`);
        }
    }

    /**
     * Upload to Google Drive using API v3 (multipart upload)
     * @private
     */
    private async uploadToGoogleDrive(backup: EncryptedBackup, destination: CloudDestination): Promise<void> {
        ProductionLogger.info('BackupService', 'Uploading to Google Drive', {
            filename: backup.filename,
            size: backup.size
        });

        const accessToken = destination.credentials?.accessToken;
        const folderId = destination.credentials?.folderId || 'root';

        if (!accessToken) {
            throw new Error('Google Drive access token is required');
        }

        // Create metadata for the file
        const metadata = {
            name: backup.filename,
            mimeType: 'application/octet-stream',
            parents: [folderId],
            description: `AccountExpress backup created at ${backup.timestamp}`,
            properties: {
                logicClock: backup.logicClock.toString(),
                hasRFC3161: backup.rfc3161Timestamp ? 'true' : 'false',
                timestamp: backup.timestamp
            }
        };

        // Create multipart form data
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/octet-stream\r\n' +
            'Content-Transfer-Encoding: base64\r\n\r\n' +
            backup.data +
            closeDelimiter;

        // Upload to Google Drive
        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`
                },
                body: multipartRequestBody
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            ProductionLogger.error(
                'BackupService',
                'Google Drive upload failed',
                new Error(`HTTP ${response.status}: ${errorText}`)
            );
            throw new Error(`Google Drive upload failed: ${response.statusText}`);
        }

        const result = await response.json();

        ProductionLogger.info('BackupService', 'Google Drive upload successful', {
            fileId: result.id,
            name: result.name,
            size: backup.size
        });

        // Record metric
        metricsCollector.recordMetric({
            category: MetricCategory.BACKUP,
            operation: 'google_drive_upload',
            status: 'success',
            value: backup.size,
            metadata: {
                fileId: result.id,
                logicClock: backup.logicClock
            }
        });
    }

    /**
     * Upload to AWS S3 using REST API (PutObject)
     * Uses pre-signed URL or IAM credentials
     * @private
     */
    private async uploadToS3(backup: EncryptedBackup, destination: CloudDestination): Promise<void> {
        ProductionLogger.info('BackupService', 'Uploading to AWS S3', {
            filename: backup.filename,
            size: backup.size
        });

        const { bucket, region, accessKeyId, secretAccessKey, presignedUrl } = destination.credentials || {};

        // Option 1: Use pre-signed URL (recommended for browser apps)
        if (presignedUrl) {
            const response = await fetch(presignedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'x-amz-meta-logic-clock': backup.logicClock.toString(),
                    'x-amz-meta-timestamp': backup.timestamp,
                    'x-amz-meta-has-rfc3161': backup.rfc3161Timestamp ? 'true' : 'false'
                },
                body: backup.data
            });

            if (!response.ok) {
                const errorText = await response.text();
                ProductionLogger.error(
                    'BackupService',
                    'S3 upload failed (pre-signed URL)',
                    new Error(`HTTP ${response.status}: ${errorText}`)
                );
                throw new Error(`S3 upload failed: ${response.statusText}`);
            }

            ProductionLogger.info('BackupService', 'S3 upload successful (pre-signed URL)', {
                filename: backup.filename,
                size: backup.size
            });

            metricsCollector.recordMetric({
                category: MetricCategory.BACKUP,
                operation: 's3_upload',
                status: 'success',
                value: backup.size,
                metadata: {
                    method: 'presigned_url',
                    logicClock: backup.logicClock
                }
            });

            return;
        }

        // Option 2: Use IAM credentials with AWS Signature V4
        if (!bucket || !region || !accessKeyId || !secretAccessKey) {
            throw new Error(
                'S3 upload requires either presignedUrl or (bucket, region, accessKeyId, secretAccessKey)'
            );
        }

        // Generate AWS Signature V4
        const key = `backups/${backup.filename}`;
        const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
        const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
        const datestamp = timestamp.slice(0, 8);

        // Create canonical request
        const canonicalHeaders = [
            `host:${bucket}.s3.${region}.amazonaws.com`,
            `x-amz-content-sha256:UNSIGNED-PAYLOAD`,
            `x-amz-date:${timestamp}`,
            `x-amz-meta-logic-clock:${backup.logicClock}`,
            `x-amz-meta-timestamp:${backup.timestamp}`
        ].join('\n');

        const signedHeaders = 'host;x-amz-content-sha256;x-amz-date;x-amz-meta-logic-clock;x-amz-meta-timestamp';

        const canonicalRequest = [
            'PUT',
            `/${key}`,
            '',
            canonicalHeaders,
            '',
            signedHeaders,
            'UNSIGNED-PAYLOAD'
        ].join('\n');

        // Create string to sign
        const algorithm = 'AWS4-HMAC-SHA256';
        const credentialScope = `${datestamp}/${region}/s3/aws4_request`;

        const canonicalRequestHash = await this.sha256(canonicalRequest);
        const stringToSign = [
            algorithm,
            timestamp,
            credentialScope,
            canonicalRequestHash
        ].join('\n');

        // Calculate signature
        const signature = await this.calculateAWSSignature(
            secretAccessKey,
            datestamp,
            region,
            stringToSign
        );

        // Create authorization header
        const authorizationHeader = [
            `${algorithm} Credential=${accessKeyId}/${credentialScope}`,
            `SignedHeaders=${signedHeaders}`,
            `Signature=${signature}`
        ].join(', ');

        // Upload to S3
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': authorizationHeader,
                'Content-Type': 'application/octet-stream',
                'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
                'x-amz-date': timestamp,
                'x-amz-meta-logic-clock': backup.logicClock.toString(),
                'x-amz-meta-timestamp': backup.timestamp,
                'x-amz-meta-has-rfc3161': backup.rfc3161Timestamp ? 'true' : 'false'
            },
            body: backup.data
        });

        if (!response.ok) {
            const errorText = await response.text();
            ProductionLogger.error(
                'BackupService',
                'S3 upload failed (IAM credentials)',
                new Error(`HTTP ${response.status}: ${errorText}`)
            );
            throw new Error(`S3 upload failed: ${response.statusText}`);
        }

        ProductionLogger.info('BackupService', 'S3 upload successful (IAM credentials)', {
            bucket,
            key,
            size: backup.size
        });

        metricsCollector.recordMetric({
            category: MetricCategory.BACKUP,
            operation: 's3_upload',
            status: 'success',
            value: backup.size,
            metadata: {
                method: 'iam_credentials',
                bucket,
                region,
                logicClock: backup.logicClock
            }
        });
    }

    /**
     * Calculate SHA-256 hash (helper for AWS Signature V4)
     * @private
     */
    private async sha256(message: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Calculate AWS Signature V4 (helper for S3 upload)
     * @private
     */
    private async calculateAWSSignature(
        secretKey: string,
        datestamp: string,
        region: string,
        stringToSign: string
    ): Promise<string> {
        const encoder = new TextEncoder();

        // Helper function to create HMAC
        const hmac = async (key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> => {
            // Always convert to standard Uint8Array to satisfy BufferSource type requirement
            const keyData = key instanceof ArrayBuffer
                ? new Uint8Array(key)
                : new Uint8Array(key.buffer, key.byteOffset, key.byteLength);

            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyData as BufferSource,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
            // Normalize encoder.encode output to standard Uint8Array
            const messageData = encoder.encode(message);
            const normalizedMessage = new Uint8Array(messageData.buffer.slice(messageData.byteOffset, messageData.byteOffset + messageData.byteLength));
            return await crypto.subtle.sign('HMAC', cryptoKey, normalizedMessage);
        };

        // Derive signing key - convert initial encoder.encode to standard Uint8Array
        const initialKey = encoder.encode(`AWS4${secretKey}`);
        const normalizedInitialKey = new Uint8Array(initialKey.buffer.slice(initialKey.byteOffset, initialKey.byteOffset + initialKey.byteLength));

        const kDate = await hmac(normalizedInitialKey, datestamp);
        const kRegion = await hmac(kDate, region);
        const kService = await hmac(kRegion, 's3');
        const kSigning = await hmac(kService, 'aws4_request');

        // Sign the string
        const signature = await hmac(kSigning, stringToSign);
        const signatureArray = Array.from(new Uint8Array(signature));
        return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Compatibility: Execution of integrity tests (from CorruptionProofBackupService)
     */
    public static async runIntegrityTestSuite(dbInstance: any): Promise<IntegrityResult> {
        if (!dbInstance) return { passed: false, failures: ['DB Not Initialized'], results: [] };

        const failures: string[] = [];
        const results: any[] = [];

        try {
            // TEST 1: Foreign Keys
            const fkCheck = dbInstance.exec('PRAGMA foreign_key_check;');
            results.push({ test: 'foreign_keys', passed: fkCheck.length === 0 });
            if (fkCheck.length > 0) failures.push(`Violaciones de FK detectadas: ${fkCheck.length} filas`);

            // TEST 2: Integrity Check de SQLite
            const integrityCheck = dbInstance.exec('PRAGMA integrity_check;');
            results.push({ test: 'physical_integrity', value: integrityCheck[0].values[0][0] });
            if (integrityCheck[0].values[0][0] !== 'ok') failures.push(`Inconsistencia física: ${integrityCheck[0].values[0][0]}`);

            // TEST 3: Esquema crítico
            const tablesRes = dbInstance.exec("SELECT name FROM sqlite_master WHERE type='table'");
            const tableCount = tablesRes.length > 0 ? tablesRes[0].values.length : 0;
            results.push({ test: 'schema_completeness', count: tableCount });
            if (tableCount < 5) failures.push('Estructura de tablas incompleta');

        } catch (e: any) {
            failures.push(`Suite de pruebas fallida: ${e.message}`);
        }

        return {
            passed: failures.length === 0,
            failures,
            results
        };
    }

    /**
     * Compatibility: Worker-safe functions
     */
    public static async encryptData(data: string, password: string): Promise<string> {
        const dummy = new BackupService({} as any);
        return await dummy.encrypt(data, password);
    }

    public static async decryptData(encryptedData: string, password: string): Promise<string> {
        const dummy = new BackupService({} as any);
        return await dummy.decrypt(encryptedData, password);
    }

    public static async exportDatabaseToSQL(dbInstance: any): Promise<string> {
        const dummy = new BackupService({} as any);
        dummy.db = dbInstance;
        return await dummy.exportDatabase();
    }

    public static async createBackup(password: string = 'LEGACY_MODE_ENCRYPTION_REQD'): Promise<string> {
        const engine = new SQLiteEngine();
        // @ts-ignore
        engine.setDB(globalDb);
        const service = new BackupService(engine);
        const backup = await service.createBackup(password);
        return JSON.stringify(backup);
    }

    /**
     * Compatibility: Legacy static methods for UI components
     */
    public static async createBackupWithLocationChoice(): Promise<boolean> {
        try {
            const engine = new SQLiteEngine();
            // @ts-ignore
            engine.setDB(globalDb);
            const service = new BackupService(engine);

            // Generate backup
            const backup = await service.createBackup('LEGACY_MODE_ENCRYPTION_REQD');

            // Select location
            const destination = await BackupLocationService.chooseBackupLocation();
            if (!destination) return false;

            // Save
            // Fallback to simple blob download if destination saver fails or not implemented for .aex
            const blob = new Blob([backup.data], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = backup.filename;
            a.click();
            URL.revokeObjectURL(url);

            return true;
        } catch (e) {
            console.error('Legacy backup failed', e);
            return false;
        }
    }

    public static async restoreBackupWithFileChoice(): Promise<boolean> {
        try {
            const file = await BackupLocationService.chooseBackupFile();
            if (!file) return false;
            const content = await file.text();

            const engine = new SQLiteEngine();
            // @ts-ignore
            engine.setDB(globalDb);
            const service = new BackupService(engine);

            await service.restoreBackup(content, 'LEGACY_MODE_ENCRYPTION_REQD');
            return true;
        } catch (e) {
            console.error('Legacy restore failed', e);
            return false;
        }
    }

    /**
     * Compatibility: EnhancedBackupService style restore with events
     */
    public static async restoreBackupStatic(backupData: string): Promise<RestoreResult> {
        this.eventEmitter.emit('backup-progress', { stage: 'INICIANDO', percentage: 10, message: 'Preparando sistema...', timestamp: new Date() });

        try {
            const engine = new SQLiteEngine();
            // @ts-ignore
            engine.setDB(globalDb);
            const service = new BackupService(engine);

            this.eventEmitter.emit('backup-progress', { stage: 'RESTAURANDO', percentage: 50, message: 'Procesando backup RFC 3161...', timestamp: new Date() });

            await service.restoreBackup(backupData, 'LEGACY_MODE_ENCRYPTION_REQD');

            this.eventEmitter.emit('backup-progress', { stage: 'COMPLETADO', percentage: 100, message: '¡Restauración exitosa!', timestamp: new Date() });

            const res: RestoreResult = {
                success: true,
                message: 'Sistema restaurado correctamente.',
                timestamp: new Date()
            };
            this.eventEmitter.emit('backup-complete', res);
            return res;
        } catch (error: any) {
            const res: RestoreResult = {
                success: false,
                message: `Error: ${error.message}`,
                error: error.message,
                timestamp: new Date()
            };
            this.eventEmitter.emit('backup-complete', res);
            throw error;
        }
    }

    /**
     * Compatibility: initiateCloudLink
     */
    public static initiateCloudLink(): void {
        import('../../services/GoogleAuthService').then(mod => {
            mod.GoogleAuthService.signIn().catch(err => {
                console.error('Google Auth Error:', err);
                alert('Cloud Link Error: ' + err.message);
            });
        });
    }
}



// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface EncryptedBackup {
    filename: string;
    data: string;  // Base64-encoded encrypted data
    size: number;
    timestamp: string;
    logicClock: number;
    rfc3161Timestamp?: TimestampResponse; // RFC 3161 timestamp token
}

export interface BackupPayload {
    version: string;
    timestamp: string;
    logicClock: number;
    database: string;  // SQL dump
    auditChain: AuditChainRecord[];
    metadata: {
        recordCount: number;
        lastChainHash: string;
    };
}

export interface CloudDestination {
    provider: 'google-drive' | 'aws-s3';
    credentials: any;
}

export interface RemoteDestination {
    protocol: 'rest' | 'sftp';
    url: string;
    token?: string;
    username?: string;
    password?: string;
}

export interface AuditChainRecord {
    id: number;
    timestamp: string;
    event_type: string;
    entity_table: string;
    entity_id: number;
    user_id: number;
    content_payload: string;
    content_hash: string;
    previous_hash: string;
    chain_hash: string;
    logic_clock: number;
}

export interface IntegrityResult {
    passed: boolean;
    failures: string[];
    results: any[];
}

export interface RestoreResult {
    success: boolean;
    message: string;
    timestamp: Date;
    emergencyBackupId?: string;
    error?: string;
}

export interface ProgressData {
    stage: string;
    percentage: number;
    message: string;
    timestamp: Date;
}

export interface BackupMetadata {
    id: string;
    checksum: string;
    timestamp: Date;
    size: number;
    validated: boolean;
}

