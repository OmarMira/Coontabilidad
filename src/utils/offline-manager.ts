import { logger } from '../core/logging/SystemLogger';

/**
 * Offline Manager for Account Express
 * Handles synchronization of pending operations and connection state tracking.
 */

type PendingOperation = {
    id: string;
    timestamp: number;
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    module: string;
    payload: any;
};

class OfflineManager {
    private isOnline: boolean = navigator.onLine;
    private listeners: ((online: boolean) => void)[] = [];
    private worker: Worker | null = null;

    constructor() {
        window.addEventListener('online', () => this.handleStatusChange(true));
        window.addEventListener('offline', () => this.handleStatusChange(false));
        this.initWorker();
    }

    private initWorker() {
        try {
            // Using Vite's worker import syntax
            this.worker = new Worker(new URL('../workers/SyncWorker.ts', import.meta.url), { type: 'module' });

            this.worker.onmessage = (e) => {
                const { type, opId, error } = e.data;
                if (type === 'SYNC_ERROR') {
                    logger.warn('OfflineManager', 'sync_failed', '[OfflineManager] Sync failed locally');
                }
            };

            this.worker.postMessage({ type: 'INIT', payload: { isOnline: this.isOnline } });
        } catch (e) {
            logger.error('OfflineManager', 'init_sync_worker', '[OfflineManager] Failed to init SyncWorker', e);
        }
    }

    private handleStatusChange(online: boolean) {
        this.isOnline = online;
        logger.info('OfflineManager', 'status_changed', '[OfflineManager] Status changed');

        if (this.worker) {
            this.worker.postMessage({ type: 'STATUS_CHANGE', payload: { isOnline: online } });
        }

        this.listeners.forEach(fn => fn(online));
    }

    public subscribe(fn: (online: boolean) => void) {
        this.listeners.push(fn);
        fn(this.isOnline);
        return () => {
            this.listeners = this.listeners.filter(l => l !== fn);
        };
    }

    public getStatus() {
        return this.isOnline;
    }

    /**
     * Triggers an immediate sync check in the worker.
     */
    public triggerSync() {
        if (this.worker) {
            this.worker.postMessage({ type: 'TRIGGER_SYNC' });
        }
    }

    /**
     * Legacy queueOperation maintained for non-database sync tasks if needed,
     * but recommended to use TransactionManager for atomic DB writes.
     */
    public queueOperation(op: Omit<PendingOperation, 'id' | 'timestamp'>) {
        logger.info('OfflineManager', 'legacy_queue', '[OfflineManager] Legacy queueOperation called');
        const operation: PendingOperation = {
            ...op,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };

        // Mantener compatibilidad mÃ­nima con LocalStorage por ahora
        const stored = localStorage.getItem('ae_sync_outbox');
        const list = stored ? JSON.parse(stored) : [];
        list.push(operation);
        localStorage.setItem('ae_sync_outbox', JSON.stringify(list));

        if (this.isOnline) {
            this.triggerSync();
        }
    }
}

export const offlineManager = new OfflineManager();

