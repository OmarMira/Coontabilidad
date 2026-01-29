
/**
 * AuditChain Service - Immutable Ledger Logic
 * 
 * Implements strict chaining using SHA-256 and Logic Clocks.
 * Compliance: Account Express Master Technical Specification.
 */

export interface AuditLogEntry {
    id: number;
    previous_hash: string;
    hash: string;
    data_payload: string; // JSON string
    created_at: string;
    logic_clock: number;
    entity_type: string;
    entity_id: number;
    user_id: number;
    action: string;
}

export interface IAuditDB {
    getLastEntry(): Promise<AuditLogEntry | null>;
    getAllEntries(): Promise<AuditLogEntry[]>;
    saveEntry(entry: Omit<AuditLogEntry, 'id'>): Promise<number>;
}

export class AuditChainService {
    private db: IAuditDB;

    constructor(db: IAuditDB) {
        this.db = db;
    }

    /**
     * Generates a structural SHA-256 hash for the transaction.
     */
    private async generateHash(
        previousHash: string,
        logicClock: number,
        timestamp: string,
        payload: string
    ): Promise<string> {
        const dataToSign = `${previousHash}|${logicClock}|${timestamp}|${payload}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(dataToSign);

        // Check environment for Crypto API
        let hashBuffer: ArrayBuffer;
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            hashBuffer = await crypto.subtle.digest('SHA-256', data);
        } else {
            // Node.js fallback or test environment
            const nodeCrypto = await import('crypto');
            const hash = nodeCrypto.createHash('sha256');
            hash.update(dataToSign);
            return hash.digest('hex');
        }

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Signs a transaction and appends it to the immutable ledger.
     */
    async signTransaction(
        entityType: string,
        entityId: number,
        action: string,
        payload: any,
        userId: number
    ): Promise<string> {
        const lastEntry = await this.db.getLastEntry();

        // Genesis block handling
        const previousHash = lastEntry ? lastEntry.hash : 'GENESIS_HASH_00000000000000000000000000000000';
        const logicClock = lastEntry ? lastEntry.logic_clock + 1 : 1;
        const timestamp = new Date().toISOString();
        const serializedPayload = JSON.stringify(payload);

        const newHash = await this.generateHash(previousHash, logicClock, timestamp, serializedPayload);

        const newEntry: Omit<AuditLogEntry, 'id'> = {
            previous_hash: previousHash,
            hash: newHash,
            data_payload: serializedPayload,
            created_at: timestamp,
            logic_clock: logicClock,
            entity_type: entityType,
            entity_id: entityId,
            user_id: userId,
            action: action
        };

        await this.db.saveEntry(newEntry);
        return newHash;
    }

    /**
     * Verifies the entire chain integrity.
     * Throws CRITICAL_INTEGRITY_FAILURE if any link is broken.
     */
    async verifyIntegrity(): Promise<{ valid: boolean; count: number }> {
        const chain = await this.db.getAllEntries();

        if (chain.length === 0) return { valid: true, count: 0 };

        // Sort by logic clock just in case, though DB should return ordered
        chain.sort((a, b) => a.logic_clock - b.logic_clock);

        for (let i = 0; i < chain.length; i++) {
            const current = chain[i];

            // 1. Verify Genesis Link
            if (i === 0) {
                if (current.previous_hash !== 'GENESIS_HASH_00000000000000000000000000000000') {
                    throw new Error(`CRITICAL_INTEGRITY_FAILURE: Genesis block hash mismatch. ID: ${current.id}`);
                }
            } else {
                // 2. Verify Chain Link
                const previous = chain[i - 1];
                if (current.previous_hash !== previous.hash) {
                    throw new Error(`CRITICAL_INTEGRITY_FAILURE: Broken chain link at ID: ${current.id}. Expected Prev: ${previous.hash}, Got: ${current.previous_hash}`);
                }
                // 3. Verify Logic Clock
                if (current.logic_clock !== previous.logic_clock + 1) {
                    throw new Error(`CRITICAL_INTEGRITY_FAILURE: Logic clock discontinuity at ID: ${current.id}`);
                }
            }

            // 4. Re-compute Hash to verify content integrity
            const calculatedHash = await this.generateHash(
                current.previous_hash,
                current.logic_clock,
                current.created_at,
                current.data_payload
            );

            if (calculatedHash !== current.hash) {
                throw new Error(`CRITICAL_INTEGRITY_FAILURE: Data tampering detected at ID: ${current.id}. Hash mismatch.`);
            }
        }

        return { valid: true, count: chain.length };
    }
}
