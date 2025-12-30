import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { InventoryManager } from '../inventory/InventoryManager';
import { GeneralLedgerService } from '../accounting/GeneralLedgerService'; // New
import { GoodsReceiptSchema, type GoodsReceipt } from './Purchasing.types';
import Big from 'big.js';

export class GoodsReceiptService {
    private engine: SQLiteEngine;
    private inventoryManager: InventoryManager;
    private glService: GeneralLedgerService; // New

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
        this.inventoryManager = new InventoryManager(engine);
        this.glService = new GeneralLedgerService(engine); // New
    }

    async processReceipt(receipt: GoodsReceipt): Promise<number> {
        const validReceipt = GoodsReceiptSchema.parse(receipt);

        // 1. Insert Receipt Header
        const headQuery = `
            INSERT INTO goods_receipts (receipt_number, purchase_order_id, supplier_id, received_date, status)
            VALUES (?, ?, ?, ?, ?)
        `;
        let receiptId = 0;

        // Safety check for engine type (SQLiteEngine supports select/run)
        const result = await (this.engine as any).run(headQuery, [
            validReceipt.receipt_number,
            validReceipt.purchase_order_id,
            validReceipt.supplier_id,
            validReceipt.received_date,
            validReceipt.status
        ]);
        receiptId = result.lastID;

        if (!receiptId) throw new Error("Failed to create receipt header");

        let totalValue = Big(0);

        // 2. Process Lines & Update Inventory
        for (const line of validReceipt.lines) {
            // Save line
            await (this.engine as any).run(`
                INSERT INTO goods_receipt_lines (goods_receipt_id, product_id, quantity_received, batch_number, expiry_date, location_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                receiptId,
                line.product_id,
                line.quantity_received,
                line.batch_number,
                line.expiry_date,
                line.location_id
            ]);

            // Call Inventory Manager to increase stock
            await this.inventoryManager.receiveStock(
                line.product_id,
                line.quantity_received,
                line.location_id,
                {
                    batch_number: line.batch_number,
                    expiry_date: line.expiry_date
                }
            );

            // Fetch product cost for accounting (simplified: use cost if available or current cost)
            const prodRes = await this.engine.select('SELECT cost_price FROM products WHERE id = ?', [line.product_id]);
            const unitCost = Big(prodRes[0]?.cost_price || 0);
            totalValue = totalValue.plus(unitCost.times(line.quantity_received));

            // Update PO received quantity if linked
            if (validReceipt.purchase_order_id) {
                await (this.engine as any).run(`
                    UPDATE purchase_order_lines 
                    SET quantity_received = quantity_received + ?
                    WHERE purchase_order_id = ? AND product_id = ?
                 `, [line.quantity_received, validReceipt.purchase_order_id, line.product_id]);
            }
        }

        // 3. ACCOUNTING INTEGRATION (Accrued Inventory Receipt)
        await this.glService.createAutoEntry(
            `Inventory Received: ${validReceipt.receipt_number}`,
            validReceipt.receipt_number,
            validReceipt.received_date,
            [
                {
                    account_code: '12000', // Inventory
                    debit: totalValue.toNumber(),
                    credit: 0
                },
                {
                    account_code: '21100', // Accrued Liabilities (Received Not Invoiced)
                    debit: 0,
                    credit: totalValue.toNumber()
                }
            ]
        );

        // 4. Update PO Status
        if (validReceipt.purchase_order_id) {
            await (this.engine as any).run(`UPDATE purchase_orders SET status = 'partial' WHERE id = ?`, [validReceipt.purchase_order_id]);
        }

        return receiptId;
    }
}
