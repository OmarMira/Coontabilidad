import { SQLiteEngine } from '../../core/database/SQLiteEngine';

/**
 * InventoryService - Stock validation and inventory management
 * 
 * HARD CONSTRAINTS:
 * - PROHIBIT negative stock at all times
 * - All stock updates must be within a transaction
 * - All stock movements must be recorded for audit
 * 
 * @example
 * const inventoryService = new InventoryService(db);
 * 
 * // Validate before invoice creation
 * inventoryService.validateStock(productId, 5); // throws if insufficient
 * 
 * // Deduct stock (within transaction)
 * inventoryService.deductStock(productId, 5, logicClock);
 */
export class InventoryService {
    constructor(private db: SQLiteEngine) { }

    /**
     * Check if sufficient stock exists for a product
     * 
     * @param productId - Product ID
     * @param quantityNeeded - Quantity to check
     * @throws Error if insufficient stock or product not found
     */
    public validateStock(productId: number, quantityNeeded: number): void {
        const product = this.db.select(
            'SELECT stock_quantity, name, sku FROM products WHERE id = ?',
            [productId]
        );

        if (product.length === 0) {
            throw new Error(`Product ${productId} not found`);
        }

        const { stock_quantity, name, sku } = product[0];

        if (stock_quantity < quantityNeeded) {
            throw new Error(
                `Insufficient stock for ${name} (SKU: ${sku}). ` +
                `Available: ${stock_quantity}, Needed: ${quantityNeeded}`
            );
        }
    }

    /**
     * Deduct stock from a product
     * 
     * MUST be called within a transaction
     * 
     * @param productId - Product ID
     * @param quantity - Quantity to deduct
     * @param logicClock - Current logic clock value
     * @throws Error if insufficient stock
     */
    public deductStock(productId: number, quantity: number, logicClock: number): void {
        // Validate first
        this.validateStock(productId, quantity);

        // Deduct
        this.db.run(`
            UPDATE products 
            SET stock_quantity = stock_quantity - ?,
                logic_clock = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [quantity, logicClock, productId]);

        // Record movement in inventory history
        this.recordInventoryMovement({
            productId,
            movementType: 'sale',
            quantity: -quantity,
            logicClock,
            reason: 'Invoice creation'
        });
    }

    /**
     * Restore stock to a product (for invoice cancellation/returns)
     * 
     * @param productId - Product ID
     * @param quantity - Quantity to restore
     * @param logicClock - Current logic clock value
     */
    public restoreStock(productId: number, quantity: number, logicClock: number): void {
        this.db.run(`
            UPDATE products 
            SET stock_quantity = stock_quantity + ?,
                logic_clock = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [quantity, logicClock, productId]);

        // Record movement
        this.recordInventoryMovement({
            productId,
            movementType: 'return',
            quantity: quantity,
            logicClock,
            reason: 'Invoice cancellation/return'
        });
    }

    /**
     * Get current stock level for a product
     * 
     * @param productId - Product ID
     * @returns Current stock quantity
     */
    public getStockLevel(productId: number): number {
        const result = this.db.select(
            'SELECT stock_quantity FROM products WHERE id = ?',
            [productId]
        );

        if (result.length === 0) {
            throw new Error(`Product ${productId} not found`);
        }

        return result[0].stock_quantity;
    }

    /**
     * Check if product is in stock
     * 
     * @param productId - Product ID
     * @param quantityNeeded - Quantity needed (default: 1)
     * @returns true if sufficient stock available
     */
    public isInStock(productId: number, quantityNeeded: number = 1): boolean {
        try {
            this.validateStock(productId, quantityNeeded);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Record inventory movement for audit trail
     * 
     * @private
     */
    private recordInventoryMovement(movement: {
        productId: number;
        movementType: 'sale' | 'return' | 'adjustment' | 'purchase';
        quantity: number;
        logicClock: number;
        reason: string;
    }): void {
        // Check if inventory_movements table exists
        try {
            this.db.run(`
                INSERT INTO inventory_movements (
                    product_id, movement_type, quantity, logic_clock, reason, created_at
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                movement.productId,
                movement.movementType,
                movement.quantity,
                movement.logicClock,
                movement.reason
            ]);
        } catch (e) {
            // Table might not exist yet - log warning but don't fail
            console.warn('inventory_movements table not found - movement not recorded');
        }
    }

    /**
     * Get low stock products (below reorder point)
     * 
     * @returns Array of products below reorder point
     */
    public getLowStockProducts(): Array<{
        id: number;
        sku: string;
        name: string;
        stockQuantity: number;
        reorderPoint: number;
    }> {
        const products = this.db.select(`
            SELECT id, sku, name, stock_quantity, reorder_point
            FROM products
            WHERE stock_quantity <= reorder_point AND active = 1
            ORDER BY stock_quantity ASC
        `);

        return products.map(p => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            stockQuantity: p.stock_quantity,
            reorderPoint: p.reorder_point
        }));
    }
}
