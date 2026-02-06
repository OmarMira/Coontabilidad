/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmergencyDatabaseInitializer } from '../../src/database/EmergencyInitializer';
import { checkEmergencyRequirement } from '../../src/emergency-entry';

// Mocking dependencies using hoisted values to avoid closure errors
const { mockDb } = vi.hoisted(() => ({
    mockDb: {
        run: vi.fn(),
        exec: vi.fn((sql) => {
            if (sql === "PRAGMA foreign_keys") return [{ values: [[1]] }];
            if (sql === "PRAGMA foreign_key_check") return [];
            if (sql === "PRAGMA integrity_check") return [{ values: [['ok']] }];
            if (sql === "SELECT COUNT(*) FROM users") return [{ values: [[0]] }];
            if (sql === "SELECT name FROM sqlite_master WHERE type='table'") return [{ values: [['users'], ['customers']] }];
            return [];
        }),
    }
}));

vi.mock('../../src/database/simple-db', () => ({
    db: mockDb,
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        success: vi.fn(),
        critical: vi.fn(),
        emergency: vi.fn()
    }
}));

describe('Emergency Database Initializer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
    });

    it('Debe detectar requerimiento de emergencia si hay error FK en sessionStorage', () => {
        // Mock sessionStorage.getItem to return the FK error
        const mockGetItem = vi.fn((key: string) => {
            if (key === 'db_init_error') {
                return 'FOREIGN KEY constraint failed';
            }
            return null;
        });
        
        vi.stubGlobal('sessionStorage', {
            getItem: mockGetItem,
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            length: 0,
            key: vi.fn()
        });
        
        const result = checkEmergencyRequirement();
        expect(mockGetItem).toHaveBeenCalledWith('db_init_error');
        expect(result).toBe(true);
    });

    it('Debe ejecutar la inicialización de emergencia sin errores', async () => {
        await EmergencyDatabaseInitializer.initializeWithEmergencyFix();
        expect(mockDb.run).toHaveBeenCalledWith('PRAGMA foreign_keys = OFF;');
        expect(mockDb.run).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
        // Verificar que se intentaron crear tablas del Grupo 1
        expect(mockDb.run).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS users'));
    });
});
