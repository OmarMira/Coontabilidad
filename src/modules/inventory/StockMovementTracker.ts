import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { InventoryMovementSchema, type InventoryMovement } from './Inventory.types';

export class StockMovementTracker {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    /**
     * Records a movement. Automatically handles sign based on type.
     * IN/ADJUSTMENT(positive) -> +
     * OUT/TRANSFER(out) -> -
     */
    async recordMovement(movement: InventoryMovement): Promise<number> {
        let signedQuantity = movement.quantity;

        // Determine sign
        if (movement.type === 'OUT') {
            signedQuantity = -Math.abs(movement.quantity);
        } else if (movement.type === 'IN') {
            signedQuantity = Math.abs(movement.quantity);
        }
        // ADJUSTMENT can be pos or neg, passed directly? 
        // If type is Adjustment, we assume caller passes correct diff OR strict magnitude.
        // Let's assume standard API: for OUT, pass positive magnitude, we flip it.
        // For ADJUSTMENT, if user says "Remove 5", pass -5 quantity.
        // If the 'type' is strictly enum IN/OUT it's easy. 
        // If 'ADJUSTMENT', we trust the sign of quantity passed if simple, 
        // OR we enforce magnitude. 
        // Let's stick to: OUT flips sign of magnitude. IN keeps pos. 
        // ADJUSTMENT: Caller must sign it?
        // To be safe: If type out, force neg. If in, force pos. 
        // adjustment: leave as is.

        if (movement.type === 'OUT') signedQuantity = -Math.abs(movement.quantity);
        if (movement.type === 'IN') signedQuantity = Math.abs(movement.quantity);
        // TRANSFER usually involves two movements (OUT from A, IN to B).

        const validMove = InventoryMovementSchema.parse({
            ...movement,
            quantity: signedQuantity // Update with processed sign for storage
        });

        // Calculate balance after (snapshot)
        // This is complex in concurrent env, but for local-first we query current + change
        // We get current stock from product or batch?
        // Usually product total.
        const currentStockRes = await this.engine.select('SELECT stock_quantity FROM products WHERE id = ?', [validMove.product_id]);
        const currentStock = currentStockRes[0]?.stock_quantity || 0;
        const newBalance = currentStock + signedQuantity;

        const query = `
            INSERT INTO inventory_movements 
            (type, product_id, batch_id, location_from_id, location_to_id, quantity, balance_after, date, user_id, reference_type, reference_id, notes, adjustment_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        if ('run' in this.engine) {
            const result = await (this.engine as any).run(query, [
                validMove.type,
                validMove.product_id,
                validMove.batch_id,
                validMove.location_from_id,
                validMove.location_to_id,
                validMove.quantity,
                newBalance,
                validMove.date || new Date().toISOString(),
                validMove.user_id,
                validMove.reference_type,
                validMove.reference_id,
                validMove.notes,
                validMove.adjustment_id
            ]);
            return result.lastID;
        }
        return 0;
    }

    async getHistoryByProduct(productId: number): Promise<InventoryMovement[]> {
        const query = `SELECT * FROM inventory_movements WHERE product_id = ? ORDER BY date DESC`;
        const results = await this.engine.select(query, [productId]);
        return results.map(r => InventoryMovementSchema.parse(r));
    }
}
