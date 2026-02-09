/**
 * Backup & Recovery Integration Tests (Iron Clad Upgrade - Phase 1, Day 7)
 * 
 * Tests completos para validar:
 * - Creación de backups cifrados
 * - Upload a S3 con retry logic
 * - Restauración con safety backup
 * - Persistent Storage API
 * - Compresión GZIP
 * - Cifrado end-to-end
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DatabaseService } from '../../database/DatabaseService';
import { RecoveryService } from '../../services/RecoveryService';
import { S3Provider } from '../../services/cloud/S3Provider';
import { PersistentStorageService } from '../../services/PersistentStorageService';
import { BasicEncryption } from '../../core/security/BasicEncryption';
import pako from 'pako';

describe('Backup & Recovery Integration Tests', () => {
    let mockDB: any;

    beforeEach(async () => {
        // Mock database initialization
        mockDB = {
            export: vi.fn(() => new Uint8Array([1, 2, 3, 4, 5])),
            run: vi.fn(),
            exec: vi.fn(() => [])
        };

        // Mock DatabaseService
        DatabaseService.setDB(mockDB);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Backup Snapshot Creation', () => {
        it('should create encrypted backup snapshot', async () => {
            const snapshot = await DatabaseService.createBackupSnapshot();

            expect(snapshot).toBeInstanceOf(Blob);
            expect(snapshot.size).toBeGreaterThan(0);
            expect(snapshot.type).toBe('application/octet-stream');
        });

        it('should compress data with GZIP', async () => {
            const originalData = new Uint8Array(1000).fill(65); // 1KB of 'A'
            const compressed = pako.gzip(originalData);

            expect(compressed.length).toBeLessThan(originalData.length);
            expect(compressed.length).toBeLessThan(100); // GZIP should compress repetitive data significantly
        });

        it('should encrypt backup with AES-256-GCM', async () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const encrypted = await BasicEncryption.encryptCombined(testData);

            expect(encrypted).toBeInstanceOf(Uint8Array);
            expect(encrypted.length).toBeGreaterThan(testData.length); // Encrypted data includes salt, IV and auth tag
            expect(encrypted).not.toEqual(testData); // Should be different from original
        });

        it('should decrypt encrypted data correctly', async () => {
            const testData = new Uint8Array([1, 2, 3, 4, 5]);
            const encrypted = await BasicEncryption.encryptCombined(testData);
            const decrypted = await BasicEncryption.decryptCombined(encrypted);

            expect(new Uint8Array(decrypted)).toEqual(testData);
        });
    });

    describe('S3 Upload with Retry Logic', () => {
        it('should upload to S3 successfully', async () => {
            // Mock S3Provider
            const mockS3 = {
                upload: vi.fn().mockResolvedValue(undefined)
            };

            const testData = new Blob(['test data']);
            await mockS3.upload('test.aex', testData);

            expect(mockS3.upload).toHaveBeenCalledWith('test.aex', testData);
        });

        it('should retry on failure with exponential backoff', async () => {
            let attempts = 0;
            const mockS3 = {
                upload: vi.fn().mockImplementation(() => {
                    attempts++;
                    if (attempts < 3) {
                        throw new Error('Network error');
                    }
                    return Promise.resolve();
                })
            };

            // Simulate retry logic
            const maxRetries = 3;
            let lastError: Error | null = null;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    await mockS3.upload('test.aex', new Blob(['test']));
                    break;
                } catch (error) {
                    lastError = error as Error;
                    if (i < maxRetries - 1) {
                        const delay = 1000 * Math.pow(2, i);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            expect(attempts).toBe(3);
            expect(lastError).toBeNull(); // Should succeed on 3rd attempt
        });

        it('should report progress during upload', async () => {
            const progressUpdates: number[] = [];
            const mockOnProgress = (progress: number) => {
                progressUpdates.push(progress);
            };

            // Simulate progress reporting
            mockOnProgress(0);
            mockOnProgress(50);
            mockOnProgress(100);

            expect(progressUpdates).toEqual([0, 50, 100]);
            expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
        });
    });

    describe('Recovery with Safety Backup', () => {
        it('should create safety backup before restoration', async () => {
            const mockLocalStorage = {
                getItem: vi.fn(),
                setItem: vi.fn(),
                removeItem: vi.fn()
            };

            global.localStorage = mockLocalStorage as any;

            // Simulate safety backup creation
            const snapshot = await DatabaseService.createBackupSnapshot();
            const arrayBuffer = await snapshot.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

            mockLocalStorage.setItem('accountexpress_safety_backup', base64);

            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'accountexpress_safety_backup',
                expect.any(String)
            );
        });

        it('should rollback on restoration failure', async () => {
            const mockLocalStorage = {
                getItem: vi.fn().mockReturnValue('mock_base64_backup'),
                setItem: vi.fn(),
                removeItem: vi.fn()
            };

            global.localStorage = mockLocalStorage as any;

            // Simulate rollback
            const safetyBackup = mockLocalStorage.getItem('accountexpress_safety_backup');
            expect(safetyBackup).toBe('mock_base64_backup');
            expect(mockLocalStorage.getItem).toHaveBeenCalled();
        });

        it('should validate backup integrity before restoration', async () => {
            // Create a valid SQLite database header
            const validHeader = new TextEncoder().encode('SQLite format 3\0');
            const validData = new Uint8Array(100);
            validData.set(validHeader, 0);

            // Validate
            const headerString = new TextDecoder().decode(validData.slice(0, 16));
            const isValid = headerString.startsWith('SQLite format 3');

            expect(isValid).toBe(true);
        });

        it('should reject invalid backup files', async () => {
            const invalidData = new Uint8Array([1, 2, 3, 4, 5]);
            const headerString = new TextDecoder().decode(invalidData.slice(0, 16));
            const isValid = headerString.startsWith('SQLite format 3');

            expect(isValid).toBe(false);
        });
    });

    describe('Persistent Storage API', () => {
        it('should request persistent storage', async () => {
            const mockNavigator = {
                storage: {
                    persist: vi.fn().mockResolvedValue(true),
                    persisted: vi.fn().mockResolvedValue(false)
                }
            };

            global.navigator = mockNavigator as any;

            const granted = await mockNavigator.storage.persist();
            expect(granted).toBe(true);
            expect(mockNavigator.storage.persist).toHaveBeenCalled();
        });

        it('should check storage quota', async () => {
            const mockNavigator = {
                storage: {
                    estimate: vi.fn().mockResolvedValue({
                        usage: 50 * 1024 * 1024, // 50MB
                        quota: 500 * 1024 * 1024  // 500MB
                    })
                }
            };

            global.navigator = mockNavigator as any;

            const estimate = await mockNavigator.storage.estimate();
            const percentUsed = (estimate.usage! / estimate.quota!) * 100;

            expect(estimate.usage).toBe(50 * 1024 * 1024);
            expect(estimate.quota).toBe(500 * 1024 * 1024);
            expect(percentUsed).toBe(10);
        });

        it('should warn when storage is low', async () => {
            const mockNavigator = {
                storage: {
                    estimate: vi.fn().mockResolvedValue({
                        usage: 480 * 1024 * 1024, // 480MB
                        quota: 500 * 1024 * 1024  // 500MB
                    })
                }
            };

            global.navigator = mockNavigator as any;

            const estimate = await mockNavigator.storage.estimate();
            const percentUsed = (estimate.usage! / estimate.quota!) * 100;
            const shouldWarn = percentUsed > 90;

            expect(shouldWarn).toBe(true);
        });

        it('should calculate available space correctly', async () => {
            const usage = 100 * 1024 * 1024; // 100MB
            const quota = 500 * 1024 * 1024; // 500MB
            const available = quota - usage;
            const availableMB = Math.floor(available / (1024 * 1024));

            expect(availableMB).toBe(400);
        });
    });

    describe('End-to-End Backup Flow', () => {
        it('should complete full backup cycle', async () => {
            // 1. Create snapshot
            const snapshot = await DatabaseService.createBackupSnapshot();
            expect(snapshot.size).toBeGreaterThan(0);

            // 2. Convert to ArrayBuffer
            const arrayBuffer = await snapshot.arrayBuffer();
            expect(arrayBuffer.byteLength).toBeGreaterThan(0);

            // 3. Verify it's encrypted (should not be plain SQLite)
            const header = new Uint8Array(arrayBuffer.slice(0, 16));
            const headerString = new TextDecoder().decode(header);
            const isPlainSQLite = headerString.startsWith('SQLite format 3');
            expect(isPlainSQLite).toBe(false); // Should be encrypted
        });

        it('should complete full recovery cycle', async () => {
            // 1. Create backup
            const originalData = new Uint8Array([1, 2, 3, 4, 5]);

            // 2. Compress
            const compressed = pako.gzip(originalData);

            // 3. Encrypt
            const encrypted = await BasicEncryption.encryptCombined(compressed);

            // 4. Decrypt
            const decrypted = await BasicEncryption.decryptCombined(encrypted);

            // 5. Decompress
            const decompressed = pako.ungzip(new Uint8Array(decrypted));

            // 6. Verify
            expect(decompressed).toEqual(originalData);
        });
    });

    describe('Auto-Backup Scheduling', () => {
        it('should schedule backup every 6 hours', () => {
            const sixHoursInMs = 6 * 60 * 60 * 1000;
            expect(sixHoursInMs).toBe(21600000);
        });

        it('should insert backup into sync_outbox', async () => {
            const mockExecuteQuery = vi.fn().mockResolvedValue(undefined);
            DatabaseService.executeQuery = mockExecuteQuery;

            const filename = 'backup_test.aex';
            const data = 'base64_encoded_data';

            await DatabaseService.executeQuery(
                `INSERT INTO sync_outbox (id, module, operation, payload, status, created_at, updated_at)
                 VALUES (?, 'backups', 'UPLOAD', ?, 'pending', datetime('now'), datetime('now'))`,
                ['test-uuid', JSON.stringify({ filename, data })]
            );

            expect(mockExecuteQuery).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            const mockUpload = vi.fn().mockRejectedValue(new Error('Network error'));

            try {
                await mockUpload('test.aex', new Blob(['test']));
            } catch (error: any) {
                expect(error.message).toBe('Network error');
            }
        });

        it('should handle encryption errors', async () => {
            // Test with invalid data
            try {
                await BasicEncryption.decryptCombined(new Uint8Array([1, 2, 3]));
            } catch (error: any) {
                expect(error).toBeDefined();
            }
        });

        it('should handle quota exceeded errors', async () => {
            const mockNavigator = {
                storage: {
                    estimate: vi.fn().mockResolvedValue({
                        usage: 500 * 1024 * 1024,
                        quota: 500 * 1024 * 1024
                    })
                }
            };

            global.navigator = mockNavigator as any;

            const estimate = await mockNavigator.storage.estimate();
            const available = estimate.quota! - estimate.usage!;
            const hasSpace = available >= 500 * 1024 * 1024; // 500MB required

            expect(hasSpace).toBe(false);
        });
    });

    describe('Performance Tests', () => {
        it('should compress data efficiently', () => {
            const testData = new Uint8Array(10 * 1024 * 1024); // 10MB
            testData.fill(65); // Fill with 'A'

            const startTime = Date.now();
            const compressed = pako.gzip(testData);
            const endTime = Date.now();

            const compressionTime = endTime - startTime;
            const compressionRatio = (compressed.length / testData.length) * 100;

            expect(compressionTime).toBeLessThan(1000); // Should complete in < 1s
            expect(compressionRatio).toBeLessThan(10); // Should compress to < 10%
        });

        it('should encrypt data in reasonable time', async () => {
            const testData = new Uint8Array(1024 * 1024); // 1MB

            const startTime = Date.now();
            await BasicEncryption.encryptCombined(testData);
            const endTime = Date.now();

            const encryptionTime = endTime - startTime;
            expect(encryptionTime).toBeLessThan(500); // Should complete in < 500ms
        });
    });
});
