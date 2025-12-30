import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryManager } from './InventoryManager';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

// Mock SQLiteEngine
const mockRun = vi.fn();
const mockSelect = vi.fn();

vi.mock('../../core/database/SQLiteEngine', () => {
    return {
        SQLiteEngine: class {
            async run(sql: string, params: any[]) { return mockRun(sql, params); }
            async select(sql: string, params: any[]) { return mockSelect(sql, params); }
            async exec(sql: string) { return Promise.resolve(); }
        }
    };
});

describe('InventoryManager', () => {
    let inventoryManager: InventoryManager;
    let engine: SQLiteEngine;

    beforeEach(() => {
        vi.clearAllMocks();
        engine = new SQLiteEngine();
        inventoryManager = new InventoryManager(engine);
    });

    it('should receive stock and creating batch', async () => {
        // Mock DB responses
        mockRun.mockResolvedValue({ lastID: 100 }); // batch creation, movement creation
        mockSelect.mockResolvedValue([{ stock_quantity: 0 }]); // current stock 0

        const result = await inventoryManager.receiveStock(1, 50, 1, {
            batch_number: 'BATCH-001',
            expiry_date: '2025-01-01'
        });

        expect(result).toBe(true);
        // Verify Calls
        // 1. Create Batch (run)
        expect(mockRun).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO product_batches'),
            expect.arrayContaining(['BATCH-001'])
        );
        // 2. Record Movement (run)
        expect(mockRun).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO inventory_movements'),
            expect.arrayContaining(['IN', 1, 100, 1, 50]) // Type, ProdId, BatchId(mocked 100), LocId(undefined->null?), Qty
        );
    });

    it('should allocate FIFO stock for shipping', async () => {
        // Mock Batches query for FIFO
        mockSelect.mockResolvedValueOnce([
            { id: 10, quantity: 5, expiry_date: '2024-01-01', product_id: 1, batch_number: 'OLD' },
            { id: 11, quantity: 20, expiry_date: '2024-02-01', product_id: 1, batch_number: 'NEW' }
        ]);
        // Mock current stock query
        mockSelect.mockResolvedValueOnce([{ stock_quantity: 100 }]); // for balance update 1
        mockSelect.mockResolvedValueOnce([{ stock_quantity: 95 }]); // for balance update 2

        mockRun.mockResolvedValue({ lastID: 1 });

        // Request 15 items
        // Should take 5 from Batch 10 (OLD), 10 from Batch 11 (NEW)
        await inventoryManager.shipStock(1, 15, 'INV-123');

        // Verify Batch Queries
        expect(mockSelect).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM product_batches'),
            expect.any(Array)
        );

        // Verify Movements
        // 1. OUT 5 from Batch 10
        expect(mockRun).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO inventory_movements'),
            expect.arrayContaining(['OUT', 1, 10, -5])
        );
        // 2. OUT 10 from Batch 11
        expect(mockRun).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO inventory_movements'),
            expect.arrayContaining(['OUT', 1, 11, -10])
        );
    });

    it('should handle stockout if insufficient batches', async () => {
        // 1. Batches
        mockSelect.mockResolvedValueOnce([
            { id: 10, quantity: 5, expiry_date: '2024-01-01', product_id: 1, batch_number: 'ONLY' }
        ]);
        // 2. Stock lookups (fallback)
        mockSelect.mockResolvedValue([{ stock_quantity: 10 }]);

        mockRun.mockResolvedValue({ lastID: 1 });

        // Request 10 items (only 5 in batch)
        await inventoryManager.shipStock(1, 10);

        // Expect 2 movements: 
        // 1. Batch OUT 5
        // 2. General OUT 5 (Stockout)

        expect(mockRun).toHaveBeenCalledTimes(2);
    });
});
