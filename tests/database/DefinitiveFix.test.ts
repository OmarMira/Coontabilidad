/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ForensicDatabaseDiagnostic } from '../../src/database/ForensicDiagnostic';
import { IntegrityMonitor } from '../../src/monitoring/IntegrityMonitor';

// Mocking dependencies
const { mockDb } = vi.hoisted(() => ({
    mockDb: {
        run: vi.fn(),
        exec: vi.fn((sql) => {
            if (sql.includes('PRAGMA integrity_check')) return [{ values: [['ok']] }];
            if (sql.includes('PRAGMA foreign_key_check')) return [];
            if (sql.includes('SELECT type, name FROM sqlite_master')) return [{ values: [['table', 'old_table']] }];
            if (sql.includes('SELECT COUNT(*) FROM sqlite_master')) return [{ values: [[10]] }];
            if (sql.includes('SELECT group_concat(name)')) return [{ values: [['table1,table2']] }];
            return [];
        }),
        export: vi.fn(() => new Uint8Array([1, 2, 3]))
    }
}));

vi.mock('../../src/database/simple-db', () => ({
    db: mockDb,
    DB_NAME: 'test.db',
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
        critical: vi.fn(),
        emergency: vi.fn(),
        debug: vi.fn()
    }
}));

describe('Definitive Forensic system', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        IntegrityMonitor.stopMonitoring();
    });

    it('Debe ejecutar el fix nuclear correctamente reconstruyendo el esquema', async () => {
        const result = await ForensicDatabaseDiagnostic.executeDefinitiveFix();

        expect(result.success).toBe(true);
        expect(mockDb.run).toHaveBeenCalledWith('PRAGMA foreign_keys = OFF;');
        expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('DROP TABLE IF EXISTS "old_table"'));
        expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE customers'));
        expect(mockDb.run).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    });

    it('Debe realizar un diagnóstico profundo y detectar necesidad de fix', async () => {
        // Simular error en pragma integrity_check basado en SQL
        mockDb.exec.mockImplementation((sql: string) => {
            if (sql.includes('PRAGMA integrity_check')) return [{ values: [['corrupt']] }];
            if (sql.includes('SELECT name')) return [{ values: [['existing_table']] }];
            return [];
        });

        const report = await ForensicDatabaseDiagnostic.performDeepAnalysis();
        expect(report.errors.length).toBeGreaterThan(0);
        expect(report.recommendations).toContain('NUCLEAR_REBUILD_REQUIRED');
    });

    it('Debe iniciar el monitor de integridad sin errores', () => {
        IntegrityMonitor.startContinuousMonitoring();
        // El monitor debería ejecutarse inmediatamente una vez
        expect(mockDb.exec).toHaveBeenCalledWith('PRAGMA foreign_key_check;');
    });
});
