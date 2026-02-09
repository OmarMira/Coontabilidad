import { SQLiteEngine } from './SQLiteEngine';
import { DatabaseService } from '../../database/DatabaseService';
import { logger } from '../logging/SystemLogger';

export interface OutboxEntry {
    module: string;
    operation: string;
    payload: any;
}

/**
 * TransactionManager (Iron Clad Upgrade)
 * Wraps SQLiteEngine to ensure atomic writes between business data and the sync outbox.
 * Follows the Transactional Outbox Pattern.
 */
export class TransactionManager {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    /**
     * Executes a write operation and automatically enqueues a sync task in the same transaction.
     * Use this for any operation that needs to be synced to the cloud (e.g., Backups).
     */
    async executeForensicWrite<T>(
        operation: () => Promise<T>,
        outboxEntry: OutboxEntry
    ): Promise<T> {
        return await this.engine.executeTransaction(async () => {
            // 1. Execute the main operation (e.g., save backup record)
            const result = await operation();

            // 2. Enqueue in sync_outbox
            const uuid = crypto.randomUUID();
            const payloadStr = JSON.stringify(outboxEntry.payload);

            await this.engine.run(`
                INSERT INTO sync_outbox (id, module, operation, payload, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
            `, [uuid, outboxEntry.module, outboxEntry.operation, payloadStr]);

            logger.info('TransactionManager', 'outbox_queued', `Operation ${outboxEntry.operation} for ${outboxEntry.module} queued in outbox.`);

            return result;
        });
    }

    /**
     * Standard transaction without outbox requirement.
     */
    async executeTransaction<T>(operation: () => Promise<T>): Promise<T> {
        return await this.engine.executeTransaction(operation);
    }
}
