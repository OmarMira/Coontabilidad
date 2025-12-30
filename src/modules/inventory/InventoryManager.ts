import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { BatchControlService } from './BatchControlService';
import { StockMovementTracker } from './StockMovementTracker';
import { type InventoryMovement, type ProductBatch } from './Inventory.types';

export class InventoryManager {
    private batchService: BatchControlService;
    private movementTracker: StockMovementTracker;
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
        this.batchService = new BatchControlService(engine);
        this.movementTracker = new StockMovementTracker(engine);
    }

    /**
     * Receive new stock (IN). Optionally creates a new batch.
     */
    async receiveStock(productId: number, quantity: number, locationId?: number, batchDetails?: Partial<ProductBatch>): Promise<boolean> {
        // 1. Create Batch if needed
        let batchId: number | undefined;
        if (batchDetails && batchDetails.batch_number) {
            batchId = await this.batchService.createBatch({
                product_id: productId,
                quantity: 0, // Initial 0, movement will add to it via trigger or we set it here?
                // Our Schema Trigger `trg_update_batch_stock_after_movement` adds movement qty to batch.
                // So we create batch with 0, then record movement.
                batch_number: batchDetails.batch_number,
                expiry_date: batchDetails.expiry_date,
                cost: batchDetails.cost || 0,
                location_id: locationId
            } as ProductBatch);
        }

        // 2. Record Movement
        const result = await this.movementTracker.recordMovement({
            type: 'IN',
            product_id: productId,
            batch_id: batchId,
            location_to_id: locationId,
            quantity: quantity,
            reference_type: 'initial', // or purchase
            date: new Date().toISOString()
        } as InventoryMovement);

        return result > 0;
    }

    /**
     * Ship/Consume stock (OUT). Uses FIFO to Pick batches.
     */
    async shipStock(productId: number, quantityNeeded: number, referenceId?: string): Promise<boolean> {
        // 1. Allocate Batches (FIFO)
        const allocation = await this.batchService.findFIFOAllocation(productId, quantityNeeded);

        let totalAllocated = 0;
        for (const alloc of allocation) {
            totalAllocated += alloc.quantity;
            // Record individual batch OUT movement
            await this.movementTracker.recordMovement({
                type: 'OUT',
                product_id: productId,
                batch_id: alloc.batchId,
                quantity: alloc.quantity, // Tracker flips to negative
                reference_type: 'invoice',
                reference_id: referenceId
            } as InventoryMovement);
        }

        // Handle remaining if needed (Stockout logic)
        if (totalAllocated < quantityNeeded) {
            const shortage = quantityNeeded - totalAllocated;
            // Record generic stockout movement from "general" stock if we allow negative?
            // Or fail?
            // For now, we record generic OUT for remainder without batch_id
            await this.movementTracker.recordMovement({
                type: 'OUT',
                product_id: productId,
                quantity: shortage,
                reference_type: 'invoice',
                reference_id: referenceId,
                notes: 'Unallocated/Stockout'
            } as InventoryMovement);
        }

        return true;
    }

    async getProductStock(productId: number): Promise<number> {
        // Simple wrapper
        const res = await this.engine.select('SELECT stock_quantity FROM products WHERE id = ?', [productId]);
        return res[0]?.stock_quantity || 0;
    }
}
