
import { describe, it, expect, vi } from 'vitest';
import { ViewManager } from './ViewManager';
import initSqlJs from 'sql.js';

describe('ViewManager', () => {
    it('should be defined', () => {
        // Mock DB
        const mockDb = {} as any;
        const manager = new ViewManager(mockDb);
        expect(manager).toBeDefined();
    });

    it('should recognize AI readonly views', () => {
        const mockDb = { exec: vi.fn() } as any;
        const manager = new ViewManager(mockDb);
        const views = manager.getAIReadOnlyViews();

        expect(views).toContain('v_payroll_summary');
        expect(views).toContain('v_bank_reconciliation_summary');
        expect(views).toContain('v_inventory_movements_summary');
        expect(views).toContain('v_purchase_orders_summary');
    });
});
