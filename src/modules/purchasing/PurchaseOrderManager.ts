import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { PurchaseOrderSchema, type PurchaseOrder, type PurchaseOrderLine } from './Purchasing.types';

export class PurchaseOrderManager {
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
    }

    async createPurchaseOrder(po: PurchaseOrder): Promise<number> {
        // Validation
        const validPO = PurchaseOrderSchema.parse(po);

        // Transaction simulation (if supported by engine, otherwise sequential)
        // Insert Header
        const headQuery = `
            INSERT INTO purchase_orders (order_number, supplier_id, date, expected_date, status, subtotal, tax_amount, total_amount, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        let poId = 0;
        if ('run' in this.engine) {
            const result = await (this.engine as any).run(headQuery, [
                validPO.order_number,
                validPO.supplier_id,
                validPO.date,
                validPO.expected_date,
                validPO.status,
                validPO.subtotal,
                validPO.tax_amount,
                validPO.total_amount,
                validPO.notes
            ]);
            poId = result.lastID;
        }

        // Insert Lines
        if (poId > 0 && validPO.lines && validPO.lines.length > 0) {
            for (const line of validPO.lines) {
                const lineQuery = `
                    INSERT INTO purchase_order_lines (purchase_order_id, product_id, description, quantity_ordered, unit_cost, line_total)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                await (this.engine as any).run(lineQuery, [
                    poId,
                    line.product_id,
                    line.description,
                    line.quantity_ordered,
                    line.unit_cost,
                    line.line_total
                ]);
            }
        }

        return poId;
    }

    async getPurchaseOrder(id: number): Promise<PurchaseOrder | null> {
        const head = await this.engine.select('SELECT * FROM purchase_orders WHERE id = ?', [id]);
        if (!head || head.length === 0) return null;

        const lines = await this.engine.select('SELECT * FROM purchase_order_lines WHERE purchase_order_id = ?', [id]);

        return {
            ...head[0],
            lines: lines as PurchaseOrderLine[]
        } as PurchaseOrder;
    }

    async updateStatus(id: number, status: string): Promise<boolean> {
        if ('run' in this.engine) {
            await (this.engine as any).run('UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
            return true;
        }
        return false;
    }
}
