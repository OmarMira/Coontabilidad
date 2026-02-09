/**
 * PersistentStorageService (Iron Clad Upgrade - Phase 1, Day 4-5)
 * 
 * Manages browser persistent storage to protect OPFS from automatic cleanup.
 * Implements navigator.storage.persist() API and quota management.
 * 
 * Features:
 * - Request persistent storage permission
 * - Monitor storage quota
 * - Warn users of low space
 * - Provide storage statistics
 */

export class PersistentStorageService {
    private static readonly MIN_REQUIRED_SPACE = 500 * 1024 * 1024; // 500MB
    private static readonly WARNING_THRESHOLD = 0.9; // 90% usage

    /**
     * Requests persistent storage from the browser.
     * This prevents the browser from automatically clearing OPFS data.
     * 
     * @returns Promise<boolean> - true if persistence granted
     */
    static async requestPersistence(): Promise<boolean> {
        if (!navigator.storage || !navigator.storage.persist) {
            console.warn('⚠️ Persistent Storage API not supported in this browser');
            return false;
        }

        try {
            // Check if already persistent with safe fallback
            const isPersisted = await (navigator.storage?.persisted?.() ?? Promise.resolve(false));
            if (isPersisted) {
                console.log('✅ Storage is already persistent');
                return true;
            }

            // Request persistence
            const granted = await navigator.storage.persist();

            if (granted) {
                console.log('✅ Persistent storage granted - data is now protected');
                return true;
            } else {
                console.warn('⚠️ Persistent storage denied - data may be cleared by browser');
                return false;
            }

        } catch (error) {
            console.error('❌ Error requesting persistent storage:', error);
            return false;
        }
    }

    /**
     * Checks if storage is currently persistent.
     * 
     * @returns Promise<boolean>
     */
    static async isPersistent(): Promise<boolean> {
        if (!navigator.storage || !navigator.storage.persisted) {
            return false;
        }

        try {
            return await navigator.storage.persisted();
        } catch (error) {
            console.error('❌ Error checking persistence status:', error);
            return false;
        }
    }

    /**
     * Gets current storage quota and usage.
     * 
     * @returns Promise<{ usage: number; quota: number; available: number; percentUsed: number }>
     */
    static async checkQuota(): Promise<{
        usage: number;
        quota: number;
        available: number;
        percentUsed: number;
        usageMB: number;
        quotaMB: number;
        availableMB: number;
    }> {
        if (!navigator.storage || !navigator.storage.estimate) {
            throw new Error('Storage Estimation API not supported in this browser');
        }

        try {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const available = quota - usage;
            const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

            return {
                usage,
                quota,
                available,
                percentUsed,
                usageMB: Math.floor(usage / (1024 * 1024)),
                quotaMB: Math.floor(quota / (1024 * 1024)),
                availableMB: Math.floor(available / (1024 * 1024))
            };

        } catch (error) {
            console.error('❌ Error checking storage quota:', error);
            throw error;
        }
    }

    /**
     * Checks if there is sufficient space available.
     * 
     * @param minRequired - Minimum required space in bytes (default: 500MB)
     * @returns Promise<boolean>
     */
    static async hasSufficientSpace(minRequired: number = this.MIN_REQUIRED_SPACE): Promise<boolean> {
        try {
            const { available } = await this.checkQuota();
            return available >= minRequired;
        } catch (error) {
            console.error('❌ Error checking available space:', error);
            return false;
        }
    }

    /**
     * Warns user if storage space is low.
     * 
     * @param minRequired - Minimum required space in bytes (default: 500MB)
     * @returns Promise<void>
     */
    static async warnIfLowSpace(minRequired: number = this.MIN_REQUIRED_SPACE): Promise<void> {
        try {
            const quota = await this.checkQuota();

            // Check if below minimum required
            if (quota.available < minRequired) {
                const message = `⚠️ ADVERTENCIA: Espacio de almacenamiento insuficiente\n\n` +
                    `Disponible: ${quota.availableMB}MB\n` +
                    `Requerido: ${Math.floor(minRequired / (1024 * 1024))}MB\n\n` +
                    `Por favor libera espacio o configura respaldo en la nube.`;

                console.warn(message);
                return;
            }

            // Check if above warning threshold
            if (quota.percentUsed > this.WARNING_THRESHOLD * 100) {
                const message = `⚠️ ADVERTENCIA: Almacenamiento casi lleno\n\n` +
                    `Uso: ${quota.percentUsed.toFixed(1)}%\n` +
                    `Disponible: ${quota.availableMB}MB de ${quota.quotaMB}MB\n\n` +
                    `Considera liberar espacio o configurar respaldo en la nube.`;

                console.warn(message);
            }

        } catch (error) {
            console.error('❌ Error checking storage space:', error);
        }
    }

    /**
     * Gets a human-readable storage status report.
     * 
     * @returns Promise<string>
     */
    static async getStorageReport(): Promise<string> {
        try {
            const isPersistent = await this.isPersistent();
            const quota = await this.checkQuota();

            const report = `
📊 STORAGE STATUS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 Persistent Storage: ${isPersistent ? '✅ ENABLED' : '❌ DISABLED'}
💾 Usage: ${quota.usageMB}MB / ${quota.quotaMB}MB (${quota.percentUsed.toFixed(1)}%)
📦 Available: ${quota.availableMB}MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${!isPersistent ? '⚠️ WARNING: Data may be cleared by browser!\n   Recommendation: Enable cloud backups immediately.\n' : ''}
${quota.percentUsed > 90 ? '⚠️ WARNING: Storage almost full!\n   Recommendation: Free up space or enable cloud backups.\n' : ''}
${isPersistent && quota.percentUsed < 90 ? '✅ Storage is healthy and protected.\n' : ''}
            `.trim();

            return report;

        } catch (error) {
            return `❌ Error generating storage report: ${error}`;
        }
    }

    /**
     * Initializes persistent storage on app startup.
     * Requests persistence and checks quota.
     * 
     * @returns Promise<{ isPersistent: boolean; hasSufficientSpace: boolean }>
     */
    static async initialize(): Promise<{
        isPersistent: boolean;
        hasSufficientSpace: boolean;
        quota: Awaited<ReturnType<typeof PersistentStorageService.checkQuota>>;
    }> {
        console.log('🔧 Initializing Persistent Storage Service...');

        // Request persistence
        const isPersistent = await this.requestPersistence();

        // Check quota
        const quota = await this.checkQuota();
        const hasSufficientSpace = quota.available >= this.MIN_REQUIRED_SPACE;

        // Warn if needed
        await this.warnIfLowSpace();

        // Log report
        const report = await this.getStorageReport();
        console.log(report);

        return {
            isPersistent,
            hasSufficientSpace,
            quota
        };
    }

    /**
     * Monitors storage usage and warns if it exceeds threshold.
     * Should be called periodically (e.g., every 5 minutes).
     * 
     * @returns Promise<void>
     */
    static async monitorStorage(): Promise<void> {
        try {
            const quota = await this.checkQuota();

            if (quota.percentUsed > this.WARNING_THRESHOLD * 100) {
                console.warn(`⚠️ Storage usage high: ${quota.percentUsed.toFixed(1)}%`);
                await this.warnIfLowSpace();
            }

        } catch (error) {
            console.error('❌ Error monitoring storage:', error);
        }
    }

    /**
     * Starts periodic storage monitoring.
     * 
     * @param intervalMs - Monitoring interval in milliseconds (default: 5 minutes)
     * @returns NodeJS.Timeout - Interval ID for cleanup
     */
    static startMonitoring(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
        console.log(`🔍 Starting storage monitoring (interval: ${intervalMs}ms)`);

        return setInterval(() => {
            this.monitorStorage();
        }, intervalMs);
    }
}
