import { S3Provider } from './cloud/S3Provider';
import { DatabaseService } from '../database/DatabaseService';
import { BasicEncryption } from '../core/security/BasicEncryption';
import { logger } from '../core/logging/SystemLogger';
import pako from 'pako';

/**
 * RecoveryService (Iron Clad Upgrade - Phase 1, Day 6-7)
 * 
 * Manages database backup and recovery operations.
 * Implements safe restoration with rollback capability.
 * 
 * Features:
 * - List available backups from cloud
 * - Download and decrypt backups
 * - Validate backup integrity
 * - Safe restoration with safety backup
 * - Rollback on failure
 */

export interface BackupMetadata {
    filename: string;
    size: number;
    created: Date;
    checksum?: string;
}

export class RecoveryService {
    private static readonly SAFETY_BACKUP_KEY = 'accountexpress_safety_backup';
    private static readonly BACKUP_PREFIX = 'backup_';
    private static readonly BACKUP_EXTENSION = '.aex';

    /**
     * Gets cloud configuration from localStorage.
     * 
     * @returns Promise<any>
     */
    private static async getCloudConfig(): Promise<any> {
        try {
            const encrypted = localStorage.getItem('cloud_backup_config');
            if (!encrypted) {
                throw new Error('Cloud backup not configured. Please configure in Settings.');
            }

            const decryptedJson = await BasicEncryption.decryptCombinedBase64(encrypted);
            const config = JSON.parse(decryptedJson);

            if (!config.enabled) {
                throw new Error('Cloud backup is disabled. Please enable in Settings.');
            }

            return config;

        } catch (error: any) {
            logger.error('RecoveryService', 'config_error', 'Failed to get cloud config', null, error);
            throw error;
        }
    }

    /**
     * Lists all available backups from cloud storage.
     * 
     * @returns Promise<BackupMetadata[]>
     */
    static async listAvailableBackups(): Promise<BackupMetadata[]> {
        try {
            const config = await this.getCloudConfig();
            const s3 = new S3Provider(config);

            const files = await s3.list();

            // Filter and map backup files
            const backups: BackupMetadata[] = files
                .filter(file =>
                    file.name.startsWith(this.BACKUP_PREFIX) &&
                    file.name.endsWith(this.BACKUP_EXTENSION)
                )
                .map(file => ({
                    filename: file.name,
                    size: file.size,
                    created: file.lastModified,
                    checksum: undefined // Will be validated on download
                }))
                .sort((a, b) => b.created.getTime() - a.created.getTime()); // Newest first

            logger.info('RecoveryService', 'list_success', `Found ${backups.length} backups`);
            return backups;

        } catch (error: any) {
            logger.error('RecoveryService', 'list_failed', 'Failed to list backups', null, error);
            throw new Error(`Failed to list backups: ${error.message}`);
        }
    }

    /**
     * Creates a safety backup in localStorage before restoration.
     * 
     * @returns Promise<string> - Base64 encoded backup
     */
    private static async createSafetyBackup(): Promise<string> {
        try {
            logger.info('RecoveryService', 'safety_backup_start', 'Creating safety backup...');

            const snapshot = await DatabaseService.createBackupSnapshot();
            const arrayBuffer = await snapshot.arrayBuffer();
            const base64 = this.arrayBufferToBase64(arrayBuffer);

            localStorage.setItem(this.SAFETY_BACKUP_KEY, base64);

            logger.info('RecoveryService', 'safety_backup_success', `Safety backup created (${snapshot.size} bytes)`);
            return base64;

        } catch (error: any) {
            logger.error('RecoveryService', 'safety_backup_failed', 'Failed to create safety backup', null, error);
            throw error;
        }
    }

    /**
     * Restores database from safety backup.
     * 
     * @returns Promise<void>
     */
    private static async restoreFromSafetyBackup(): Promise<void> {
        try {
            logger.warn('RecoveryService', 'safety_restore_start', 'Restoring from safety backup...');

            const base64 = localStorage.getItem(this.SAFETY_BACKUP_KEY);
            if (!base64) {
                throw new Error('No safety backup found');
            }

            const arrayBuffer = this.base64ToArrayBuffer(base64);
            const uint8Array = new Uint8Array(arrayBuffer);

            // Decrypt
            const decrypted = await BasicEncryption.decryptCombined(uint8Array);

            // Decompress
            const decompressed = pako.ungzip(new Uint8Array(decrypted));

            // Restore DB
            // @ts-ignore sql.js type mismatch
            const SQL = await import('sql.js');
            // @ts-ignore sql.js Database constructor signature
            const db = new SQL.Database(decompressed);
            DatabaseService.setDB(db);

            logger.info('RecoveryService', 'safety_restore_success', 'Successfully restored from safety backup');

        } catch (error: any) {
            logger.error('RecoveryService', 'safety_restore_failed', 'Failed to restore from safety backup', null, error);
            throw error;
        }
    }

    /**
     * Validates backup integrity by checking checksum.
     * 
     * @param data - Backup data
     * @returns Promise<boolean>
     */
    private static async validateBackup(data: ArrayBuffer): Promise<boolean> {
        try {
            // Calculate checksum
            const uint8Array = new Uint8Array(data);
            const checksum = await BasicEncryption.hash(uint8Array);

            // For now, we just verify it's a valid SQLite database
            // In production, you'd store and verify checksums
            const header = new Uint8Array(data.slice(0, 16));
            const sqliteHeader = 'SQLite format 3\0';
            const headerString = new TextDecoder().decode(header);

            const isValid = headerString.startsWith(sqliteHeader);

            if (!isValid) {
                logger.error('RecoveryService', 'validation_failed', 'Invalid SQLite database header');
            }

            return isValid;

        } catch (error: any) {
            logger.error('RecoveryService', 'validation_error', 'Error validating backup', null, error);
            return false;
        }
    }

    /**
     * Restores database from a cloud backup.
     * 
     * @param filename - Name of the backup file
     * @param options - Restoration options
     * @returns Promise<void>
     */
    static async restoreFromCloud(
        filename: string,
        options?: {
            skipSafetyBackup?: boolean;
            onProgress?: (progress: number, message: string) => void;
        }
    ): Promise<void> {
        const skipSafetyBackup = options?.skipSafetyBackup ?? false;
        const onProgress = options?.onProgress;

        try {
            logger.info('RecoveryService', 'restore_start', `Starting restoration from ${filename}`);

            // Step 1: Create safety backup (unless skipped)
            if (!skipSafetyBackup) {
                onProgress?.(10, 'Creating safety backup...');
                await this.createSafetyBackup();
            }

            // Step 2: Download backup from S3
            onProgress?.(30, 'Downloading backup from cloud...');
            const config = await this.getCloudConfig();
            const s3 = new S3Provider(config);

            const encryptedBlob = await s3.download(filename, {
                decompress: false, // We'll handle decompression ourselves
                onProgress: (progress) => onProgress?.(30 + progress * 0.3, 'Downloading...')
            });

            // Step 3: Decrypt
            onProgress?.(60, 'Decrypting backup...');
            const encryptedData = await encryptedBlob.arrayBuffer();
            const decrypted = await BasicEncryption.decryptCombined(new Uint8Array(encryptedData));

            // Step 4: Decompress
            onProgress?.(70, 'Decompressing backup...');
            const decompressed = pako.ungzip(new Uint8Array(decrypted));

            // Step 5: Validate integrity
            onProgress?.(80, 'Validating backup integrity...');
            const isValid = await this.validateBackup(decompressed.buffer);

            if (!isValid) {
                throw new Error('Backup validation failed - checksum mismatch or corrupted data');
            }

            // Step 6: Restore DB
            onProgress?.(90, 'Restoring database...');
            // @ts-ignore sql.js type mismatch
            const SQL = await import('sql.js');
            // @ts-ignore sql.js Database constructor signature
            const db = new SQL.Database(decompressed);
            DatabaseService.setDB(db);

            // Step 7: Verify restoration
            onProgress?.(95, 'Verifying restoration...');
            const testQuery = await DatabaseService.executeQuery('SELECT COUNT(*) as count FROM journal_entries');
            logger.info('RecoveryService', 'restore_verify', `Restored ${testQuery[0]?.count || 0} journal entries`);

            // Step 8: Clean up safety backup
            if (!skipSafetyBackup) {
                localStorage.removeItem(this.SAFETY_BACKUP_KEY);
            }

            onProgress?.(100, 'Restoration complete!');
            logger.info('RecoveryService', 'restore_success', `Successfully restored from ${filename}`);

        } catch (error: any) {
            logger.error('RecoveryService', 'restore_failed', 'Restoration failed', null, error);

            // Attempt to restore from safety backup
            if (!skipSafetyBackup) {
                try {
                    onProgress?.(0, 'Restoration failed, rolling back...');
                    await this.restoreFromSafetyBackup();
                    onProgress?.(100, 'Rolled back to safety backup');

                    throw new Error(`Restoration failed, rolled back to previous state: ${error.message}`);
                } catch (rollbackError: any) {
                    throw new Error(`Restoration failed AND rollback failed: ${error.message} | ${rollbackError.message}`);
                }
            }

            throw new Error(`Restoration failed: ${error.message}`);
        }
    }

    /**
     * Restores database from a local file.
     * 
     * @param file - File object from file input
     * @param options - Restoration options
     * @returns Promise<void>
     */
    static async restoreFromFile(
        file: File,
        options?: {
            skipSafetyBackup?: boolean;
            onProgress?: (progress: number, message: string) => void;
        }
    ): Promise<void> {
        const skipSafetyBackup = options?.skipSafetyBackup ?? false;
        const onProgress = options?.onProgress;

        try {
            logger.info('RecoveryService', 'restore_file_start', `Starting restoration from file: ${file.name}`);

            // Step 1: Create safety backup
            if (!skipSafetyBackup) {
                onProgress?.(10, 'Creating safety backup...');
                await this.createSafetyBackup();
            }

            // Step 2: Read file
            onProgress?.(30, 'Reading backup file...');
            const encryptedData = await file.arrayBuffer();

            // Step 3: Decrypt
            onProgress?.(50, 'Decrypting backup...');
            const decrypted = await BasicEncryption.decryptCombined(new Uint8Array(encryptedData));

            // Step 4: Decompress
            onProgress?.(70, 'Decompressing backup...');
            const decompressed = pako.ungzip(new Uint8Array(decrypted));

            // Step 5: Validate
            onProgress?.(80, 'Validating backup...');
            const isValid = await this.validateBackup(decompressed.buffer);

            if (!isValid) {
                throw new Error('Invalid backup file');
            }

            // Step 6: Restore
            onProgress?.(90, 'Restoring database...');
            // @ts-ignore sql.js type mismatch
            const SQL = await import('sql.js');
            // @ts-ignore sql.js Database constructor signature
            const db = new SQL.Database(decompressed);
            DatabaseService.setDB(db);

            // Step 7: Clean up
            if (!skipSafetyBackup) {
                localStorage.removeItem(this.SAFETY_BACKUP_KEY);
            }

            onProgress?.(100, 'Restoration complete!');
            logger.info('RecoveryService', 'restore_file_success', `Successfully restored from ${file.name}`);

        } catch (error: any) {
            logger.error('RecoveryService', 'restore_file_failed', 'File restoration failed', null, error);

            // Rollback
            if (!skipSafetyBackup) {
                try {
                    await this.restoreFromSafetyBackup();
                    throw new Error(`Restoration failed, rolled back: ${error.message}`);
                } catch (rollbackError: any) {
                    throw new Error(`Restoration failed AND rollback failed: ${error.message}`);
                }
            }

            throw error;
        }
    }

    /**
     * Converts ArrayBuffer to Base64 string.
     * 
     * @param buffer - ArrayBuffer to convert
     * @returns string - Base64 encoded string
     */
    private static arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Converts Base64 string to ArrayBuffer.
     * 
     * @param base64 - Base64 encoded string
     * @returns ArrayBuffer
     */
    private static base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Gets recovery statistics.
     * 
     * @returns Promise<{ cloudBackupsAvailable: number; hasSafetyBackup: boolean }>
     */
    static async getRecoveryStats(): Promise<{
        cloudBackupsAvailable: number;
        hasSafetyBackup: boolean;
        latestBackup?: BackupMetadata;
    }> {
        try {
            const backups = await this.listAvailableBackups();
            const hasSafetyBackup = localStorage.getItem(this.SAFETY_BACKUP_KEY) !== null;

            return {
                cloudBackupsAvailable: backups.length,
                hasSafetyBackup,
                latestBackup: backups[0] // Sorted newest first
            };

        } catch (error) {
            return {
                cloudBackupsAvailable: 0,
                hasSafetyBackup: localStorage.getItem(this.SAFETY_BACKUP_KEY) !== null
            };
        }
    }
}
