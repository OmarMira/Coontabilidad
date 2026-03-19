/**
 * SyncWorker (Iron Clad Upgrade)
 * Handles background synchronization tasks from sync_outbox.
 * Prevents UI freezes during network operations and heavy retries.
 */

// We need a minimal SQLite connection in the worker to read the outbox
import { SQLiteEngine } from '../core/database/SQLiteEngine';
import { logger } from '../core/logging/SystemLogger';
import { S3Provider } from '../services/cloud/S3Provider';

const ctx: Worker = self as any;

let engine: SQLiteEngine | null = null;
let isOnline = true;
let isProcessing = false;
let pollingInterval: any = null;

async function initEngine() {
    if (!engine) {
        engine = new SQLiteEngine();
        await engine.initialize();
    }
}

async function processOutbox() {
    if (isProcessing || !isOnline || !engine) return;

    try {
        isProcessing = true;

        // Verify if the table exists before querying (Phase 7 - Silencio Inteligente)
        const tableCheck = await engine.select("SELECT name FROM sqlite_master WHERE type='table' AND name='sync_outbox'");
        if (tableCheck.length === 0) {
            isProcessing = false;
            return;
        }

        // 1. Get pending items with exponential backoff logic (simplified for now: status = 'pending' or 'failed')
        const items = await engine.select(`
            SELECT * FROM sync_outbox 
            WHERE status IN ('pending', 'failed') 
            AND retry_count < 10
            ORDER BY created_at ASC 
            LIMIT 5
        `);

        if (items.length === 0) {
            isProcessing = false;
            return;
        }

        logger.info('SyncWorker', 'processing', `[SyncWorker] Processing `$`{items.length} operations`);

        for (const item of items) {
            try {
                // Calculate backoff: 2^retry_count * 1000ms
                const backoffMs = Math.pow(2, item.retry_count || 0) * 1000;
                const lastUpdated = new Date(item.updated_at).getTime();
                const now = Date.now();

                // Skip if not enough time has passed since last failure
                if (item.status === 'failed' && (now - lastUpdated) < backoffMs) {
                    continue;
                }

                // Update status to processing
                await engine.run("UPDATE sync_outbox SET status = 'processing', updated_at = datetime('now') WHERE id = ?", [item.id]);

                const payload = JSON.parse(item.payload);

                // ---------------------------------------------------------
                // HANDLERS (Objective 1.3 - execute specific handlers)
                // ---------------------------------------------------------
                let success = false;

                switch (item.module) {
                    case 'backups':
                        // Objective 3.4: Hook into the Outbox
                        logger.info('SyncWorker', 'cloud_upload_start', '[SyncWorker] Starting Cloud Vault Upload');

                        // Parse cloud config (should be encrypted in localStorage)
                        let cloudConfig;
                        try {
                            const encryptedConfig = self.localStorage?.getItem('cloud_backup_config');
                            if (!encryptedConfig) {
                                throw new Error('Cloud backup not configured');
                            }

                            // In worker context, we need to decrypt
                            // For now, assume config is passed in payload or use a simpler approach
                            cloudConfig = payload.cloudConfig || JSON.parse(encryptedConfig);
                        } catch (configError: any) {
                            logger.error('SyncWorker', 'cloud_config', '[SyncWorker] Cloud config error', configError);
                            throw new Error(`Cloud configuration error: ${configError.message}`);
                        }

                        // Create S3Provider instance
                        const s3 = new S3Provider(cloudConfig);

                        // Convert Base64 data to Blob if needed
                        let uploadData: Blob | ArrayBuffer | string;
                        if (payload.data && typeof payload.data === 'string') {
                            // Assume Base64 encoded
                            const binaryString = atob(payload.data);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            uploadData = new Blob([bytes], { type: 'application/octet-stream' });
                        } else if (payload.encryptedData) {
                            // Legacy support
                            uploadData = payload.encryptedData;
                        } else {
                            throw new Error('No data found in backup payload');
                        }

                        // Upload to S3 with progress reporting
                        await s3.upload(
                            payload.filename || payload.fileName,
                            uploadData,
                            {
                                compress: false, // Already compressed by DatabaseService
                                contentType: 'application/octet-stream',
                                onProgress: (progress) => {
                                    logger.info('SyncWorker', 'upload_progress', '[SyncWorker] Upload progress');
                                    ctx.postMessage({
                                        type: 'UPLOAD_PROGRESS',
                                        opId: item.id,
                                        progress
                                    });
                                }
                            }
                        );

                        success = true;
                        break;
                    default:
                        logger.warn('SyncWorker', 'no_handler', '[SyncWorker] No handler for module');
                        success = true;
                }

                if (success) {
                    await engine.run("UPDATE sync_outbox SET status = 'completed', updated_at = datetime('now') WHERE id = ?", [item.id]);
                    ctx.postMessage({ type: 'SYNC_SUCCESS', opId: item.id });
                } else {
                    throw new Error("Handler returned failure");
                }

            } catch (err: any) {
                const newRetryCount = (item.retry_count || 0) + 1;
                const nextStatus = newRetryCount >= 10 ? 'abandoned' : 'failed';

                await engine.run(`
                    UPDATE sync_outbox 
                    SET status = ?, 
                        retry_count = ?, 
                        last_error = ?, 
                        updated_at = datetime('now') 
                    WHERE id = ?
                `, [nextStatus, newRetryCount, err.message, item.id]);

                ctx.postMessage({ type: 'SYNC_ERROR', opId: item.id, error: err.message });
            }
        }

    } catch (e) {
        logger.error('SyncWorker', 'global_processing', '[SyncWorker] Global processing error', e);
    } finally {
        isProcessing = false;
    }
}

ctx.onmessage = async (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'INIT':
            await initEngine();
            isOnline = payload.isOnline;
            startPolling();
            break;
        case 'STATUS_CHANGE':
            isOnline = payload.isOnline;
            if (isOnline) processOutbox();
            break;
        case 'TRIGGER_SYNC':
            processOutbox();
            break;
    }
};

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    // Poll every 30 seconds for pending tasks
    pollingInterval = setInterval(() => {
        processOutbox();
    }, 30000);
}

logger.info('SyncWorker', 'init', '[SyncWorker] Background sync initialized');

