
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BatchAuditSystem } from './BatchAuditSystem';

// Mock ExternalTimestampService
const { mockGetTrustedTimestamp } = vi.hoisted(() => ({
    mockGetTrustedTimestamp: vi.fn().mockResolvedValue('MOCKED_TIMESTAMP_123')
}));

vi.mock('../../services/ExternalTimestampService', () => ({
    ExternalTimestampService: {
        getTrustedTimestamp: mockGetTrustedTimestamp
    }
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

// Mock crypto
const mockDigest = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
vi.stubGlobal('crypto', {
    subtle: {
        digest: mockDigest
    }
});

describe('BatchAuditSystem Forensics (P0)', () => {
    let system: BatchAuditSystem;

    beforeEach(async () => {
        vi.clearAllMocks();
        // Mock sessionStorage
        vi.stubGlobal('sessionStorage', {
            getItem: vi.fn(),
            setItem: vi.fn()
        });

        // Use fake timers for all tests
        vi.useFakeTimers();
        system = new BatchAuditSystem();

        // Wait for async initialization to complete
        await vi.advanceTimersByTimeAsync(100);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('should initialize without errors', async () => {
        // The system should initialize without throwing errors
        expect(system).toBeDefined();
    });

    it('should log an event and process it immediately if critical', async () => {
        const event = {
            action: 'DELETE_LEDGER',
            critical: true,
            changes: { id: 1 },
            userId: 99
        };

        await system.logEvent(event);

        // Since it's critical, it triggers processBatch(true) which is async.
        // We need to advance timers and wait for the async processing to complete
        await vi.advanceTimersByTimeAsync(100);

        await vi.waitFor(() => {
            expect(mockGetTrustedTimestamp).toHaveBeenCalled();
        }, { timeout: 5000 });

        expect(mockRun).toHaveBeenCalledWith(expect.arrayContaining(['DELETE_LEDGER']));
        expect(mockRun).toHaveBeenCalledWith(expect.arrayContaining(['VERIFIED'])); // witness_status
    });

    it('should handle RFC 3161 failure with Exponential Backoff and fallback to NO_EXTERNAL_WITNESS', async () => {
        // Mock failure
        mockGetTrustedTimestamp.mockRejectedValue(new Error('TSA Down'));

        const event = { action: 'FAIL_TEST', critical: true };

        system.logEvent(event);

        // Since logEvent triggers processBatch without returning the promise,
        // we must wait for the retries to happen by advancing time and verifying.

        // We expect 4 calls total (1 initial + 3 retries) with delays 1s, 2s, 4s.
        // Total time approx 7-8s.

        // Advance time in chunks and check
        for (let i = 0; i < 10; i++) {
            await vi.advanceTimersByTimeAsync(1000);
        }

        await vi.waitFor(() => {
            expect(mockGetTrustedTimestamp).toHaveBeenCalledTimes(4);
        }, { timeout: 1000 }); // Wait for assertions to pass

        // Should save with FAILED status
        expect(mockRun).toHaveBeenCalledWith(expect.arrayContaining(['FAILED']));
    });
});
