import { SQLiteEngine } from '../database/SQLiteEngine';

interface AuditEvent {
    eventType: string;
    entityTable: string;
    entityId: string;
    userId: string;
    content: any;
    resolve?: () => void;
    reject?: (reason?: any) => void;
}

export class AuditChainService {
    private engine: SQLiteEngine;
    private worker: Worker;
    private queue: AuditEvent[] = [];
    private processing = false;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
        // Initialize worker
        this.worker = new Worker(new URL('../../workers/encryption.worker.ts', import.meta.url), { type: 'module' });
    }

    /**
     * Intercepts a write operation to log it into the immutable audit chain.
     * Queues the event to ensure strict sequential processing (Chain Integrity).
     */
    async logEvent(event: AuditEvent): Promise<void> {
        return new Promise((resolve, reject) => {
            // Add to queue with queue-specific resolver
            this.queue.push({ ...event, resolve, reject });
            this.processQueue();
        });
    }

    /**
     * Processes queue sequentially.
     * One item at a time is processed to ensure PreviousHash is stable.
     */
    private async processQueue() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;
        const currentEvent = this.queue.shift();

        if (!currentEvent) {
            this.processing = false;
            return; // Should happen if queue empty
        }

        try {
            await this.processSingleEvent(currentEvent);
            if (currentEvent.resolve) currentEvent.resolve();
        } catch (error) {
            console.error('[Audit] Fatal Chain Error', error);
            if (currentEvent.reject) currentEvent.reject(error);
            // Critical decision: If audit fails, do we clear the queue? 
            // Yes, because subsequent items might depend on this one's success if inside same transaction logic on generic level.
            // But usually this service is called transactionally. 
            // If this fails, the caller sees the error and aborts transaction.
        } finally {
            this.processing = false;
            // Next
            if (this.queue.length > 0) {
                this.processQueue();
            }
        }
    }

    private async processSingleEvent(event: AuditEvent): Promise<void> {
        // 1. Get Previous Hash (LATEST committed)
        // Note: In strict isolation 'BEGIN IMMEDIATE', we are safe from other writers, 
        // but we need to ensure we read the very last one inserted even in this session?
        // Yes, `SELECT ... ORDER BY id DESC LIMIT 1` sees uncommitted writes within the same transaction context in SQLite.
        const lastRecord = await this.engine.select("SELECT chain_hash FROM audit_chain ORDER BY id DESC LIMIT 1");
        const previousHash = lastRecord[0]?.chain_hash || 'GENESIS_HASH';

        // 2. Delegate Hashing to Worker
        let newHash: string;
        try {
            newHash = await this.calculateHashInWorker(previousHash, event.content);
        } catch (workerError) {
            console.error('[Audit] Worker Hashing Failed', workerError);
            throw new Error('AUDIT_INTEGRITY_FAILURE: Could not verify hash integrity via Worker.');
        }

        if (!newHash || newHash.length < 32) {
            throw new Error('AUDIT_INTEGRITY_FAILURE: Invalid hash generated.');
        }

        // 3. Insert
        await this.engine.run(`
                INSERT INTO audit_chain 
                (event_type, entity_table, entity_id, user_id, content_payload, content_hash, previous_hash, chain_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
            event.eventType,
            event.entityTable,
            event.entityId,
            event.userId,
            JSON.stringify(event.content),
            newHash,
            previousHash,
            newHash
        ]);

        console.log(`[Audit] Sealed: ${event.eventType} | Chain: ${previousHash.substring(0, 4)}->${newHash.substring(0, 4)}`);
    }

    private calculateHashInWorker(previousHash: string, content: any): Promise<string> {
        return new Promise((resolve, reject) => {
            const id = Math.random().toString(36).substr(2, 9);

            const handler = (e: MessageEvent) => {
                if (e.data.id === id) {
                    this.worker.removeEventListener('message', handler);
                    if (e.data.type === 'HASH_SUCCESS') {
                        resolve(e.data.payload);
                    } else {
                        reject(new Error(e.data.error || 'Worker Unknown Error'));
                    }
                }
            };

            this.worker.addEventListener('message', handler);
            this.worker.addEventListener('error', (err) => {
                this.worker.removeEventListener('message', handler);
                reject(err);
            });

            this.worker.postMessage({
                type: 'HASH_CHAIN',
                id,
                payload: { previousHash, content }
            });

            // Timeout safely
            setTimeout(() => {
                this.worker.removeEventListener('message', handler);
                reject(new Error('Audit Worker Timed Out (>3000ms)'));
            }, 3000);
        });
    }

    terminate() {
        this.worker.terminate();
    }
}
