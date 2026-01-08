/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Database } from 'sql.js';
import { ViewManager } from '../../src/database/views/ViewManager';

// Mock de base de datos
const mockDb = {
    exec: vi.fn(),
    prepare: vi.fn(),
    close: vi.fn()
} as unknown as Database;

describe('ViewManager - Vistas de Solo Lectura', () => {
    let viewManager: ViewManager;

    beforeEach(() => {
        vi.clearAllMocks();
        viewManager = new ViewManager(mockDb);
    });

    it('debe tener 5 vistas de solo lectura para IA', () => {
        const aiViews = viewManager.getAIReadOnlyViews();
        expect(aiViews).toHaveLength(10);
        expect(aiViews).toContain('v_invoice_summary');
        expect(aiViews).toContain('v_tax_alerts');
        expect(aiViews).toContain('v_audit_kpi');
    });

    it('debe permitir acceso solo a vistas autorizadas', () => {
        expect(viewManager.isViewAccessibleByAI('v_invoice_summary')).toBe(true);
        expect(viewManager.isViewAccessibleByAI('users')).toBe(false);
        expect(viewManager.isViewAccessibleByAI('audit_log')).toBe(false);
    });

    it('debe rechazar queries que no sean SELECT', () => {
        mockDb.exec.mockImplementation((query) => {
            if (typeof query === 'string' && query.toUpperCase().startsWith('SELECT')) return [{ columns: ['count'], values: [[0]] }];
            return [];
        });

        expect(() => viewManager.queryView('v_invoice_summary', 'DROP TABLE users'))
            .toThrow('Only SELECT queries are allowed');

        expect(() => viewManager.queryView('v_invoice_summary', 'UPDATE views SET name = "test"'))
            .toThrow('Only SELECT queries are allowed');
    });

    it('debe rechazar acceso a tablas base no autorizadas', () => {
        expect(() => viewManager.queryView('invoices')).toThrow('Access denied');
        expect(() => viewManager.queryView('audit_log')).toThrow('Access denied');
    });

    it('debe ejecutar consulta SELECT en vista autorizada con mapeo de objetos', () => {
        mockDb.exec.mockImplementation((query) => {
            if (typeof query === 'string' && query.includes('SELECT * FROM v_invoice_summary')) {
                return [{
                    columns: ['id', 'number'],
                    values: [[1, 'INV-001'], [2, 'INV-002']]
                }];
            }
            return [];
        });

        const results = viewManager.queryView('v_invoice_summary', 'SELECT * FROM {view} LIMIT 100');
        expect(results).toHaveLength(2);
        expect(results[0]).toEqual({ id: 1, number: 'INV-001' });
        expect(results[1]).toEqual({ id: 2, number: 'INV-002' });
    });
});
