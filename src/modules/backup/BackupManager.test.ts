import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackupManager } from './BackupManager';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { BasicEncryption } from '../../core/security/BasicEncryption';

// Mocks
const mockRun = vi.fn();
const mockExec = vi.fn();
const mockSelect = vi.fn();

const mockEngine = {
    select: mockSelect,
    run: mockRun,
    exec: mockExec,
    executeTransaction: async (cb: any) => await cb()
} as unknown as SQLiteEngine;

// Mock Basic Encryption
vi.mock('../../core/security/BasicEncryption', () => ({
    BasicEncryption: {
        hash: vi.fn(async () => 'mock_checksum'),
        encrypt: vi.fn(async (data) => ({ encrypted: data, salt: new Uint8Array(16), iv: new Uint8Array(12) })),
        decrypt: vi.fn(async (data) => data),
        combineEncryptedData: vi.fn((e, s, i) => e),
        separateEncryptedData: vi.fn((c) => ({ encrypted: c, salt: new Uint8Array(16), iv: new Uint8Array(12) }))
    }
}));

describe('BackupManager', () => {
    let manager: BackupManager;

    beforeEach(() => {
        vi.clearAllMocks();
        manager = new BackupManager(mockEngine);
    });

    it('should create a backup file with correct structure', async () => {
        // Mock DB data
        mockSelect.mockReturnValue([
            { id: 1, name: 'Test' }
        ]);

        const result = await manager.createBackup({ password: 'test' });

        expect(result.metadata.checksum).toBe('mock_checksum');
        expect(result.metadata.isEncrypted).toBe(true);
        expect(result.data).toBeDefined();
        // Check Metadata validation
        expect(result.metadata.version).toBe('1.0.0');
    });

    it('should include audit chain in backup and metadata', async () => {
        // Mock chain fetch
        mockSelect.mockImplementation((sql) => {
            if (sql.includes('audit_chain')) return [{ current_hash: '1234' }];
            return [];
        });

        const result = await manager.createBackup();
        expect(result.metadata.auditHash).toBe('1234');
    });

    it('should restore backup successfully', async () => {
        // Create mock backup payload
        const dump = { invoices: [{ id: 1, name: 'Invoice 1' }] };
        const json = JSON.stringify(dump);

        // Import real compressor logic via dynamic import or just re-use if possible
        const { BackupCompressor } = await import('./compression/BackupCompressor');
        const compressed = BackupCompressor.compress(json);

        const valid = await manager.restoreBackup(compressed, 'password');

        expect(valid).toBe(true);
        // Verify delete called for table
        expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM invoices'));
        // Verify insert called for rows. We use arrayContaining or just check call exists.
        // The mockRun is called for INSERT
        expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO invoices'), expect.any(Array));
    });
});
