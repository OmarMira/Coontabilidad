import { GoogleAuthService } from './GoogleAuthService';
import { logger } from '../core/logging/SystemLogger';

export class GDriveSyncService {

    /**
     * Uploads the encrypted backup blob to Google Drive
     * Uses 'AccountExpress_Backups' folder, creating it if needed.
     */
    /**
     * Uploads the encrypted backup blob to Google Drive
     * Uses 'AccountExpress_Backups' folder, creating it if needed.
     */
    static async uploadBackup(blob: Blob, filename: string): Promise<boolean> {
        let token = await GoogleAuthService.getValidToken();

        if (!token) {
            logger.warn('GDriveSync', 'skip', 'No auth token available');
            return false;
        }

        try {
            // 1. Ensure folder exists (Retryable)
            const folderId = await this.ensureBackupFolder(token);

            // 2. Prepare Metadata
            const metadata = {
                name: filename,
                parents: [folderId],
                mimeType: 'application/json'
            };

            // 3. Upload (Multipart) with Retry & 401 Recovery
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', blob);

            const uploadFn = async (authToken: string) => {
                return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` },
                    body: form
                });
            };

            let res = await this.fetchWithRetry(() => uploadFn(token!), 'Upload');

            // Handle 401 specifics (Token expired during transmission)
            if (res.status === 401) {
                logger.warn('GDriveSync', '401', 'Token expired during upload, refreshing...');
                try {
                    // Force refresh
                    const newToken = await GoogleAuthService.refreshAccessToken();
                    token = newToken; // Update local var
                    res = await this.fetchWithRetry(() => uploadFn(newToken), 'Upload Retry');
                } catch (refreshErr) {
                    logger.error('GDriveSync', 'refresh_fail', 'Could not refresh token', null, refreshErr as Error);
                    throw new Error('Auth expired and refresh failed');
                }
            }

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                // Check for Quota
                if (res.status === 403 && errJson?.error?.errors?.some((e: any) => e.reason === 'storageQuotaExceeded')) {
                    throw new Error('STORAGE_QUOTA_EXCEEDED');
                }
                throw new Error(`Upload failed: ${res.status}`);
            }

            const fileData = await res.json();
            logger.info('GDriveSync', 'upload_success', `Backup uploaded: ${fileData.id}`);

            // 4. Prune old backups (Keep last 5)
            // Fire and forget, but catch errors
            this.pruneOldBackups(token!, folderId).catch(err => {
                logger.warn('GDriveSync', 'prune_fail', 'Failed to prune old backups', null, err);
            });

            return true;
        } catch (e: any) {
            if (e.message === 'STORAGE_QUOTA_EXCEEDED') {
                logger.error('GDriveSync', 'quota', 'Google Drive Storage Full');
                // Could emit global event here
            } else {
                logger.error('GDriveSync', 'upload_fail', 'Drive upload failed', null, e as Error);
            }
            return false;
        }
    }

    /**
     * Helper: Fetch with Exponential Backoff for 503/500
     */
    private static async fetchWithRetry(fn: () => Promise<Response>, opName: string, retries = 3): Promise<Response> {
        // Faster retries in test environment
        const BASE_DELAY = process.env.NODE_ENV === 'test' ? 50 : 1000;

        for (let i = 0; i < retries; i++) {
            try {
                const res = await fn();
                // If 503 (Service Unavailable) or 500 (Server Error) or 429 (Too Many Requests)
                if (res.status === 503 || res.status === 500 || res.status === 429) {
                    const waitTime = Math.pow(2, i) * BASE_DELAY + (process.env.NODE_ENV === 'test' ? 0 : Math.random() * 500);
                    logger.warn('GDriveSync', 'retry', `${opName} failed (${res.status}), retrying in ${waitTime}ms...`);
                    await new Promise(r => setTimeout(r, waitTime));
                    continue;
                }
                return res;
            } catch (netErr) {
                // Network errors (fetch throws)
                if (i === retries - 1) throw netErr;
                const waitTime = Math.pow(2, i) * BASE_DELAY;
                await new Promise(r => setTimeout(r, waitTime));
            }
        }
        throw new Error(`${opName} max retries exceeded`);
    }

    private static async ensureBackupFolder(token: string): Promise<string> {
        // Search query
        const q = "mimeType = 'application/vnd.google-apps.folder' and name = 'AccountExpress_Backups' and trashed = false";
        const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await searchRes.json();

        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }

        // Create
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'AccountExpress_Backups',
                mimeType: 'application/vnd.google-apps.folder'
            })
        });

        const newStart = await createRes.json();
        return newStart.id;
    }

    private static async pruneOldBackups(token: string, folderId: string) {
        // List files in folder, ordered by creation time desc
        const q = `'${folderId}' in parents and trashed = false`;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=createdTime desc&fields=files(id, name)`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        const files = data.files || [];

        // Keep 5, delete rest
        if (files.length > 5) {
            const toDelete = files.slice(5);
            for (const f of toDelete) {
                await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            logger.info('GDriveSync', 'prune', `Cleaned up ${toDelete.length} old backups`);
        }
    }
}
