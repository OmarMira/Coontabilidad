import { describe, it, expect, vi } from 'vitest';
import { AIFactory } from '../../src/services/ai/AIFactory';

vi.mock('../../src/core/database/SQLiteEngine', () => ({
  SQLiteEngine: class {
    async run() { return; }
    async select() { return []; }
    async exec() { return; }
    static getInstance() { return new this(); }
  }
}));

vi.mock('../../src/database/modules/db-core', () => ({
  db: { exec: vi.fn().mockReturnValue([]), run: vi.fn(), prepare: vi.fn().mockReturnValue({ run: vi.fn(), free: vi.fn() }) },
  getDBEngine: vi.fn().mockReturnValue({ run: vi.fn(), select: vi.fn().mockResolvedValue([]), exec: vi.fn() }),
  rowToEntity: vi.fn(),
  PRIVILEGED_ROLES: ['admin']
}));

describe('Phase 2: AIFactory Integrity Check', () => {

    it('should correctly identify a health analysis query', async () => {
        const response = await AIFactory.processQuery('dame un resumen de salud financiera');
        expect(response.source).toBe('analytical');
        expect(response.alerts).toBeDefined();
    });

    it('should identify a knowledge base query', async () => {
        const response = await AIFactory.processQuery('como registrar una factura');
        expect(response.source).toBe('knowledge_base');
    });

    it('should block unauthorized SQL commands', async () => {
        // En un entorno de test real, IntelligentSQLGenerator podrÃ­a devolver un UPDATE si fuera vulnerable
        // Simulamos la validaciÃ³n de seguridad de la factorÃ­a
        const dangerousSql = 'UPDATE customers SET credit_limit = 1000000';
        expect(() => (AIFactory as any).validateSecurity(dangerousSql)).toThrow('Seguridad AI: Comando no autorizado');
    });

    it('should correctly build data content for a count query', () => {
        const analysis = { intent: { key: 'COUNT' }, entity: { key: 'CUSTOMER' } };
        const data = [{ count: 150 }];
        const content = (AIFactory as any).buildDataContent(analysis, data);
        expect(content).toContain('150');
        expect(content.toLowerCase()).toContain('clientes') || expect(content).toContain('customer');
    });
});
