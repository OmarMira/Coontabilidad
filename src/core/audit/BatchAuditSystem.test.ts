
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BatchAuditSystem } from './BatchAuditSystem';

// Mock rfc3161-client
const mockTimestamp = vi.fn().mockResolvedValue('MOCKED_TIMESTAMP_123');
const mockClient = vi.fn().mockImplementation(() => ({
    timestamp: mockTimestamp
}));

vi.mock('rfc3161-client', () => ({
    Client: mockClient
}));

// Mock simple-db
const mockExec = vi.fn();
const mockRun = vi.fn();
const mockPrepare = vi.fn().mockReturnValue({
    run: mockRun,
    free: vi.fn()
});

vi.mock('../../database/simple-db', () => ({
    db: {
        exec: mockExec,
        prepare: mockPrepare
    }
}));

// Mock process.env
vi.stubGlobal('process', { env: { TEST_MODE: 'false' } });
// Mock crypto
const mockDigest = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
vi.stubGlobal('crypto', {
    subtle: {
        digest: mockDigest
    }
});

describe('BatchAuditSystem Forensics (P0)', () => {
    let system: BatchAuditSystem;

    beforeEach(() => {
        vi.clearAllMocks();
        // Allow timers to work if needed, but we check logic mostly
        vi.useFakeTimers();
        system = new BatchAuditSystem();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize and attempt schema migration', async () => {
        // Wait for async constructor side effects (schema check) if any
        await new Promise(r => setTimeout(r, 10));
        expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS audit_chain'));
        expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('ALTER TABLE audit_chain column external_signature'));
    });

    it('should log an event and process it immediately if critical', async () => {
        const event = {
            action: 'DELETE_LEDGER',
            critical: true,
            changes: { id: 1 },
            userId: 99
        };

        // Spy on processInteral method if possible, but it's private.
        // We check side effects: DB insert and RFC call

        // We need to bypass the "process.env.TEST_MODE" check in the source if we want to test real logic?
        // In my code I wrote: if (!process.env.TEST_MODE) ...
        // So for this test to verify RFC call, we need TEST_MODE to be falshy.
        // vi.stubGlobal above set it to 'false'.

        await system.logEvent(event);

        // Since it's critical, it triggers processBatch(true) which is async.
        // We might need to wait a tick.
        await vi.waitFor(() => {
            expect(mockTimestamp).toHaveBeenCalled();
        });

        expect(mockRun).toHaveBeenCalledWith(expect.arrayContaining(['DELETE_LEDGER']));
        expect(mockRun).toHaveBeenCalledWith(expect.arrayContaining(['VERIFIED'])); // witness_status
    });

    it('should handle RFC 3161 failure with Exponential Backoff and fallback to NO_EXTERNAL_WITNESS', async () => {
        // Mock failure
        mockTimestamp.mockRejectedValue(new Error('TSA Down'));

        // Set reduced timers for test speed? code has 5000, 30000.
        // We use fake timers.

        const event = { action: 'FAIL_TEST', critical: true };

        // Start valid promise in background
        const processPromise = system.logEvent(event);

        // Fast forward for 1st retry (5s)
        await vi.advanceTimersByTimeAsync(5000);
        // Fast forward for 2nd retry (30s)
        await vi.advanceTimersByTimeAsync(30000);
        // Fast forward for 3rd retry (5m)
        await vi.advanceTimersByTimeAsync(300000); // 300s

        // Wait for completion
        await processPromise;

        // Check calls: Initial + 3 Retries = 4 calls? Or Initial + 3 retries.
        // Logic: loop 0..length (3 items) = 4 attempts.
        expect(mockTimestamp).toHaveBeenCalledTimes(4);

        // Should save with NO_EXTERNAL_WITNESS
        expect(mockRun).toHaveBeenCalledWith(expect.arrayContaining(['NO_EXTERNAL_WITNESS']));
    });
});
