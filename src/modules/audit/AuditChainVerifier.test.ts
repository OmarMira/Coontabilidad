import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditChainVerifier } from './AuditChainVerifier';
import { type AuditEvent } from './AuditEvent.types';
import { BasicEncryption } from '../../core/security/BasicEncryption';

// Mock BasicEncryption to run in Node/Vitest if WebCrypto not available, 
// OR assume environment is correct. 
// For deterministic testing, maybe we should mock the hash function.
// But we want to test "Integrity", so hashing is key.
// Let's assume BasicEncryption.hash works or mock it to return 'hash(content)'.

vi.mock('../../core/security/BasicEncryption', () => ({
    BasicEncryption: {
        hash: async (data: Uint8Array) => {
            // Simple mock hash for speed and determinism in tests
            // returns "hash_of_<length>"
            const str = new TextDecoder().decode(data);
            // very simple hash: "hash_<first5chars>_<length>"
            return `hash_${str.length}`;
        }
    }
}));

describe('AuditChainVerifier', () => {
    let verifier: AuditChainVerifier;
    const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

    beforeEach(() => {
        verifier = new AuditChainVerifier();
    });

    it('should verify a valid chain of 1 event', async () => {
        // Construct valid event based on Mock Hash logic
        // Payload: `${previousHash}|${eventType}|${eventData}|${timestamp}|${userId}|${nonce}`
        const previousHash = GENESIS_HASH;
        const eventType = 'invoice_created';
        const eventData = '{}';
        const timestamp = '2023-01-01T00:00:00.000Z';
        const userId = 1;
        const nonce = 123;

        const payload = `${previousHash}|${eventType}|${eventData}|${timestamp}|${userId}|${nonce}`;
        const currentHash = `hash_${payload.length}`; // Matches mock implementation

        const event: AuditEvent = {
            previous_hash: previousHash,
            current_hash: currentHash,
            event_type: eventType as any,
            event_data: eventData,
            user_id: userId,
            timestamp: timestamp,
            nonce: nonce
        };

        const result = await verifier.verify([event]);
        if (!result.isValid) {
            console.error(result.errors);
        }
        expect(result.isValid).toBe(true);
        expect(result.totalEvents).toBe(1);
    });

    it('should detect a broken link (previous_hash mismatch)', async () => {
        const event: AuditEvent = {
            previous_hash: 'wrong_hash',
            current_hash: 'does_not_matter_for_link_check',
            event_type: 'invoice_created',
            event_data: '{}',
            user_id: 1,
            timestamp: '2023-01-01T00:00:00.000Z',
            nonce: 1
        };

        const result = await verifier.verify([event]);
        expect(result.isValid).toBe(false);
        expect(result.errors?.some(e => e.includes('Broken Link'))).toBe(true);
    });

    it('should detect integrity failure (tampered data)', async () => {
        // Correct Link, but Wrong Hash for content
        const previousHash = GENESIS_HASH;
        const eventType = 'invoice_created';
        const eventData = '{"amount":100}'; // Original
        const timestamp = '2023-01-01T00:00:00.000Z';
        const userId = 1;
        const nonce = 123;

        const payload = `${previousHash}|${eventType}|${eventData}|${timestamp}|${userId}|${nonce}`;
        const correctHash = `hash_${payload.length}`;

        const event: AuditEvent = {
            previous_hash: previousHash,
            current_hash: correctHash, // Hash matches ORIGINAL data
            event_type: eventType as any,
            event_data: '{"amount":999}', // TAMPERED data (different length or content)
            user_id: userId,
            timestamp: timestamp,
            nonce: nonce
        };

        // In our mock, hash is just length dependent?
        // Let's ensure length changes or content interpretation is robust.
        // `hash_${str.length}` might collision if tamper has same length.
        // Let's modify event_data length.
        // original: 14 chars. tampered: 14 chars '{"amount":999}' vs '{"amount":100}'
        // Wait, correctHash was based on original.
        // Verify will re-hash Tampered data.
        // payload tampered ends with ...|{"amount":999}|... same length?
        // To be safe in test, verify simply checks if recalculated != stored.
        // If my mock is too simple (only length), and tamper preserves length, it won't detect.
        // I will update mock to include first char of data?
        // Or just change length. '{"amount": 1000000}'

        event.event_data = '{"amount": 1000000}'; // Longer

        const result = await verifier.verify([event]);
        expect(result.isValid).toBe(false);
        expect(result.errors?.some(e => e.includes('Integrity Fail'))).toBe(true);
    });
});
