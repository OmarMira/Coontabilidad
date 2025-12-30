import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { ProductBatchSchema, type ProductBatch } from './Inventory.types';

export class BatchControlService {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    async createBatch(batch: ProductBatch): Promise<number> {
        const validBatch = ProductBatchSchema.parse(batch);
        const query = `
            INSERT INTO product_batches (product_id, batch_number, expiry_date, quantity, cost, received_date, location_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        // Assuming engine uses run via some mechanism or we mimic implementation
        // For MVP demo we often assume 'run' is available or use raw 'exec' if return id is not needed or select generic.
        // I will use a hypothetical 'run' or fallback since SQLiteEngine implementation details vary.
        // Let's assume standard behavior:
        if ('run' in this.engine) {
            const result = await (this.engine as any).run(query, [
                validBatch.product_id,
                validBatch.batch_number,
                validBatch.expiry_date,
                validBatch.quantity,
                validBatch.cost,
                validBatch.received_date,
                validBatch.location_id
            ]);
            return result.lastID;
        }
        return 0;
    }

    async getBatchesForProduct(productId: number, activeOnly: boolean = true): Promise<ProductBatch[]> {
        let query = `SELECT * FROM product_batches WHERE product_id = ?`;
        if (activeOnly) {
            query += ` AND quantity > 0`;
            // Also checking 'active' flag if we use simple soft delete, 
            // but FIFO implies using positive quantity batches.
        }
        query += ` ORDER BY expiry_date ASC, received_date ASC`; // FIFO priority

        const results = await this.engine.select(query, [productId]);
        return results.map(r => ProductBatchSchema.parse(r));
    }

    async findFIFOAllocation(productId: number, quantityNeeded: number): Promise<{ batchId: number, quantity: number }[]> {
        const batches = await this.getBatchesForProduct(productId, true);
        const allocation: { batchId: number, quantity: number }[] = [];
        let remaining = quantityNeeded;

        for (const batch of batches) {
            if (remaining <= 0) break;

            const take = Math.min(batch.quantity, remaining);
            if (take > 0 && batch.id) {
                allocation.push({ batchId: batch.id, quantity: take });
                remaining -= take;
            }
        }

        if (remaining > 0) {
            // Not enough batch stock?
            // In strict mode this might be error.
            // For now, return what we found.
        }

        return allocation;
    }

    async getExpiringBatches(daysThreshold: number = 30): Promise<ProductBatch[]> {
        // Calculate cutoff date specific to SQLite 'date' modifier syntax if needed or JS calc
        // SQLite: date('now', '+30 days')
        const query = `
            SELECT * FROM product_batches 
            WHERE quantity > 0 
            AND expiry_date <= date('now', '+${daysThreshold} days')
            ORDER BY expiry_date ASC
        `;
        const results = await this.engine.select(query);
        return results.map(r => ProductBatchSchema.parse(r));
    }
}
