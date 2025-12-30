import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoodsReceiptService } from './GoodsReceiptService';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { InventoryManager } from '../inventory/InventoryManager';

// Mocks
const mockRun = vi.fn();
const mockReceiveStock = vi.fn();

vi.mock('../../core/database/SQLiteEngine', () => ({
    SQLiteEngine: class {
        async run(sql: string, params: any[]) { return mockRun(sql, params); }
    }
}));

// Mock InventoryManager specifically to verify integration
vi.mock('../inventory/InventoryManager', () => ({
    InventoryManager: class {
        constructor() { }
        async receiveStock(...args: any[]) { return mockReceiveStock(...args); }
    }
}));

describe('GoodsReceiptService', () => {
    let service: GoodsReceiptService;
    let engine: SQLiteEngine;

    beforeEach(() => {
        vi.clearAllMocks();
        engine = new SQLiteEngine();
        service = new GoodsReceiptService(engine);
    });

    it('should process receipt and update inventory', async () => {
        mockRun.mockResolvedValue({ lastID: 500 }); // receiptId
        mockReceiveStock.mockResolvedValue(true);

        const receiptId = await service.processReceipt({
            receipt_number: 'GR-001',
            supplier_id: 1,
            received_date: '2023-12-30',
            status: 'received',
            lines: [
                { product_id: 10, quantity_received: 100, batch_number: 'B1', expiry_date: '2024-01-01' }
            ]
        });

        expect(receiptId).toBe(500);

        // Verify Receipt Header Insert
        expect(mockRun).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO goods_receipts'),
            expect.arrayContaining(['GR-001'])
        );

        // Verify Line Insert
        expect(mockRun).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO goods_receipt_lines'),
            expect.arrayContaining([500, 10, 100, 'B1'])
        );

        // Verify Inventory Integration
        expect(mockReceiveStock).toHaveBeenCalledWith(
            10, // productId
            100, // qty
            undefined, // locationId
            expect.objectContaining({ batch_number: 'B1' }) // batch details
        );
    });
});
