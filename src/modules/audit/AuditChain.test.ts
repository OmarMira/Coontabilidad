import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditChain } from './AuditChain';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { BasicEncryption } from '../../core/security/BasicEncryption';

// Mock Dependencies
vi.mock('../../core/security/BasicEncryption', () => ({
    BasicEncryption: {
        hash: vi.fn(async (data: Uint8Array) => {
            // Mock SHA-256 for test speed/simplicity or use real if possible. 
            // Let's use a simple deterministic mock for tests to avoid web crypto in node environment issues if setup is complex,
            // BUT BasicEncryption uses `crypto.subtle` which needs Node 19+ or polyfill.
            // Vitest environment 'node' usually has it.
            return 'mocked_hash_' + Math.random().toString(36).substring(7);
        })
    }
}));

const mockRun = vi.fn();
const mockSelect = vi.fn();
const mockExec = vi.fn();

const mockEngine = {
    select: mockSelect,
    run: mockRun,
    exec: mockExec
} as unknown as SQLiteEngine;

describe('AuditChain', () => {
    let auditChain: AuditChain;

    beforeEach(() => {
        vi.clearAllMocks();
        auditChain = new AuditChain(mockEngine);
    });

    it('should start with Genesis hash for first event', async () => {
        mockSelect.mockResolvedValue([]); // No events

        const event = await auditChain.addEvent('invoice_created', { id: 1 });

        expect(event.previous_hash).toMatch(/^0+$/); // Genesis
        expect(mockRun).toHaveBeenCalled();
        expect(event.current_hash).toContain('mocked_hash');
    });

    it('should link new event to previous hash', async () => {
        const prevEvent = {
            id: '1',
            previous_hash: '0000',
            current_hash: 'hash_1',
            event_type: 'invoice_created',
            event_data: '{}',
            timestamp: new Date().toISOString(),
            user_id: 1,
            nonce: 123
        };

        mockSelect.mockResolvedValue([prevEvent]);

        const event = await auditChain.addEvent('invoice_updated', { id: 1 });

        expect(event.previous_hash).toBe('hash_1');
    });

    it('verifyChain should return valid for consistent chain', async () => {
        // We need to ensure calculateHash matches what verifyChain expects. 
        // Since we mocked hash to be random, verifyChain will fail unless we keep it deterministic or mock implementation carefully.

        // Let's refine the mock for this test
        const deterministicHash = (data: any) => 'hash_' + data.length;
        // @ts-ignore
        BasicEncryption.hash.mockImplementation(async (data) => deterministicHash(data));

        const event1Payload = `0000000000000000000000000000000000000000000000000000000000000000|test|{}|2024-01-01|1|1`;
        // We need to manually construct the "valid" chain for the test expectations
        const hash1 = deterministicHash(new TextEncoder().encode(event1Payload));

        const chain = [
            {
                id: '1',
                previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
                current_hash: hash1,
                event_type: 'test',
                event_data: '{}',
                user_id: 1,
                timestamp: '2024-01-01',
                nonce: 1
            }
        ];

        mockSelect.mockResolvedValue(chain);

        const result = await auditChain.verifyChain();

        expect(result.isValid).toBe(true);
        expect(result.errors).toBeUndefined();
    });

    it('verifyChain should detect tampering', async () => {
        // Mock hash
        // @ts-ignore
        BasicEncryption.hash.mockImplementation(async () => 'real_hash');

        const chain = [
            {
                id: '1',
                previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
                current_hash: 'tampered_hash', // Mismatch
                event_type: 'test',
                event_data: '{}',
                user_id: 1,
                timestamp: '2024-01-01',
                nonce: 1
            }
        ];

        mockSelect.mockResolvedValue(chain);

        const result = await auditChain.verifyChain();

        expect(result.isValid).toBe(false);
        expect(result.errors?.length).toBeGreaterThan(0);
        expect(result.errors?.[0]).toContain('Integrity Fail');
    });
});
