import { SQLiteEngine } from '../database/SQLiteEngine';
import { db as globalDb } from '@/database/modules/db-core';
import { logger } from '../../utils/logger';


interface AuditEvent {
    eventType: string;
    entityTable: string;
    entityId: string;
    userId: string;
    content: any;
    resolve?: (value?: any) => void;
    reject?: (reason?: any) => void;
}

export class AuditChainService {
    private engine: SQLiteEngine;
    private worker: Worker;
    private queue: AuditEvent[] = [];
    private processing = false;
    private static instance: AuditChainService;


    constructor(engine: SQLiteEngine) {
        this.engine = engine;
        // Initialize worker
        this.worker = new Worker(new URL('../../workers/encryption.worker.ts', import.meta.url), { type: 'module' });
    }

    /**
     * Intercepts a write operation to log it into the immutable audit chain.
     * Queues the event to ensure strict sequential processing (Chain Integrity).
     */
    async logEvent(event: AuditEvent): Promise<any> {
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
            const result = await this.processSingleEvent(currentEvent);
            if (currentEvent.resolve) currentEvent.resolve(result);
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

    private async processSingleEvent(event: AuditEvent): Promise<any> {
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

        // Return for compatibility
        return {
            id: lastRecord[0]?.id || 0,
            previous_hash: previousHash,
            current_hash: newHash,
            event_type: event.eventType,
            event_data: JSON.stringify(event.content),
            user_id: parseInt(event.userId),
            timestamp: new Date().toISOString(),
            nonce: 0
        };
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

    /**
     * Get recent audit log entries
     * @param limit Max entries to return
     */
    async getAuditLog(limit: number = 50): Promise<any[]> {
        const records = await this.engine.select(`
            SELECT id, event_type, entity_table, entity_id, user_id, 
                   content_payload, chain_hash, previous_hash,
                   datetime(created_at, 'localtime') as created_at
            FROM audit_chain
            ORDER BY id DESC
            LIMIT ?
        `, [limit]);

        return records.map((r: any) => ({
            id: r.id,
            event_type: r.event_type,
            entity_table: r.entity_table,
            entity_id: r.entity_id,
            user_id: r.user_id,
            payload: r.content_payload ? JSON.parse(r.content_payload) : {},
            chain_hash: r.chain_hash,
            previous_hash: r.previous_hash,
            created_at: r.created_at || new Date().toISOString()
        }));
    }

    terminate() {
        this.worker.terminate();
    }

    /**
     * Compatibility: addEvent (used by useInvoiceForm.ts)
     */
    async addEvent(eventType: string, eventData: any, userId: number = 1): Promise<any> {
        return this.logEvent({
            eventType,
            entityTable: 'GENERIC', // Or extract from data if needed
            entityId: eventData.invoiceId || '0',
            userId: userId.toString(),
            content: eventData
        });
    }

    /**
     * Compatibility: ensureTable
     */
    async ensureTable(): Promise<void> {
        // Table is already handled in SQLiteEngine/simple-db, but we provide it for safety
        await this.engine.exec(`
            CREATE TABLE IF NOT EXISTS audit_chain (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT,
                entity_table TEXT,
                entity_id TEXT,
                user_id TEXT,
                content_payload TEXT,
                content_hash TEXT,
                previous_hash TEXT,
                chain_hash TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }


    /**
     * Singleton management for legacy components
     */
    public static getInstance(): AuditChainService {
        if (!AuditChainService.instance) {
            const engine = new SQLiteEngine();
            // @ts-ignore
            engine.setDB(globalDb);
            AuditChainService.instance = new AuditChainService(engine);
        }
        return AuditChainService.instance;
    }

    /**
     * Compatibility: logAction (used by simple-db.ts)
     */
    public static async logAction(event: any): Promise<void> {
        const instance = AuditChainService.getInstance();
        await instance.logEvent({
            eventType: event.action || 'SQL_EVENT',
            entityTable: event.table || 'GENERIC',
            entityId: event.id?.toString() || '0',
            userId: event.userId?.toString() || '1',
            content: event.payload || event
        });
    }

    /**
     * Compatibility: performFullAudit (used by LiveVerification.tsx)
     */
    public static async performFullAudit(): Promise<any> {
        const instance = AuditChainService.getInstance();
        const logs = await instance.getAuditLog(100);

        let valid = true;
        let details = 'Verification Successful';

        // Simple sequential check
        for (let i = 0; i < logs.length - 1; i++) {
            if (logs[i].previous_hash !== logs[i + 1].chain_hash) {
                valid = false;
                details = `Chain break at entry ${logs[i].id}`;
                break;
            }
        }

        return {
            valid,
            timestamp: new Date().toISOString(),
            details,
            totalChecked: logs.length
        };
    }

    /**
     * Compatibility: getLastValidHash (used by Dashboard.tsx)
     */
    public static async getLastValidHash(): Promise<string> {
        const instance = AuditChainService.getInstance();
        const logs = await instance.getAuditLog(1);
        return logs[0]?.chain_hash || 'GENESIS_HASH';
    }

    /**
     * Compatibility: getAuditTrail (used by AuditTrailTable.tsx)
     */
    public static async getAuditTrail(options: any = {}): Promise<any[]> {
        const instance = AuditChainService.getInstance();
        return await instance.getAuditLog(options.limit || 50);
    }

    /**
     * Helper for delta calculation
     */
    public static computeDelta(oldData: any, newData: any): any {
        const delta: any = {};
        for (const key in newData) {
            if (newData[key] !== oldData[key]) {
                delta[key] = { from: oldData[key], to: newData[key] };
            }
        }
        return delta;
    }
}

