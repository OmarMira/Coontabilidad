
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
    private syncOutbox: PendingOperation[] = [];
    private listeners: ((online: boolean) => void)[] = [];

    constructor() {
        window.addEventListener('online', () => this.handleStatusChange(true));
        window.addEventListener('offline', () => this.handleStatusChange(false));
        this.loadOutbox();
    }

    private handleStatusChange(online: boolean) {
        this.isOnline = online;
        console.log(`[OfflineManager] Status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);

        if (online) {
            this.processOutbox();
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
     * Queues an operation to be performed when online.
     * Note: In Account Express, most operations are local (SQLite).
     * This is primarily for external sync (Cloud Backup, External APIs).
     */
    public queueOperation(op: Omit<PendingOperation, 'id' | 'timestamp'>) {
        const operation: PendingOperation = {
            ...op,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };

        this.syncOutbox.push(operation);
        this.saveOutbox();

        if (this.isOnline) {
            this.processOutbox();
        }
    }

    private async processOutbox() {
        if (this.syncOutbox.length === 0) return;

        console.log(`[OfflineManager] Processing ${this.syncOutbox.length} pending operations...`);

        // Clone outbox to avoid mutation issues during async work
        const itemsToProcess = [...this.syncOutbox];

        for (const op of itemsToProcess) {
            try {
                // Here you would call your specific service handlers based on module
                // Example: await BackupService.sync(op);

                // Removing successful op
                this.syncOutbox = this.syncOutbox.filter(item => item.id !== op.id);
                this.saveOutbox();
            } catch (error) {
                console.error(`[OfflineManager] Failed to process ${op.id}`, error);
                // Keep in outbox for retry later
            }
        }
    }

    private loadOutbox() {
        const stored = localStorage.getItem('ae_sync_outbox');
        if (stored) {
            try {
                this.syncOutbox = JSON.parse(stored);
            } catch (e) {
                this.syncOutbox = [];
            }
        }
    }

    private saveOutbox() {
        localStorage.setItem('ae_sync_outbox', JSON.stringify(this.syncOutbox));
    }
}

export const offlineManager = new OfflineManager();
