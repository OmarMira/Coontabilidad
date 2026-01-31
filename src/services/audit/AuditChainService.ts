import { SQLiteEngine } from '../../core/database/SQLiteEngine';

/**
 * AuditChainService - Blockchain-style Immutable Audit Trail
 * 
 * Implements cryptographic chain of custody for all database transactions:
 * - SHA-256 hashing of transaction data
 * - Chain linking (current hash includes previous hash)
 * - Logic clock sequencing
 * - Integrity verification (detects tampering)
 * 
 * SECURITY:
 * - Any manual SQL modification breaks the chain
 * - verifyIntegrity() detects gaps in logic_clock
 * - Hashes are deterministic and reproducible
 * 
 * @example
 * const auditChain = new AuditChainService(db);
 * await auditChain.recordEvent({
 *   eventType: 'invoice_created',
 *   entityTable: 'invoices',
 *   entityId: '123',
 *   userId: 'admin',
 *   payload: { amount: 10000, tax: 700 }
 * });
 * 
 * const integrity = await auditChain.verifyIntegrity();
 * // Returns: { valid: true, totalRecords: 100, errors: [] }
 */
export class AuditChainService {
    constructor(private db: SQLiteEngine) { }

    /**
     * Record an event in the audit chain
     * 
     * @param event - Event data to record
     * @returns Chain hash of the new record
     */
    public async recordEvent(event: AuditEvent): Promise<string> {
        return this.db.executeTransaction(async () => {
            // 1. Increment logic_clock
            const logicClock = this.incrementLogicClock();

            // 2. Prepare payload
            const contentPayload = JSON.stringify(event.payload);

            // 3. Generate content hash (SHA-256 of payload + logic_clock)
            const contentHash = await this.sha256(`${contentPayload}|${logicClock}`);

            // 4. Get previous hash
            const previous = this.db.select(
                'SELECT chain_hash FROM audit_chain ORDER BY id DESC LIMIT 1'
            );
            const previousHash = previous.length > 0 ? previous[0].chain_hash : 'GENESIS';

            // 5. Generate chain hash (SHA-256 of previous_hash + content_hash + logic_clock)
            const chainHash = await this.sha256(`${previousHash}|${contentHash}|${logicClock}`);

            // 6. Insert into audit_chain
            this.db.run(`
                INSERT INTO audit_chain (
                    timestamp, event_type, entity_table, entity_id, user_id,
                    content_payload, content_hash, previous_hash, chain_hash, logic_clock
                ) VALUES (CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                event.eventType,
                event.entityTable,
                event.entityId,
                event.userId,
                contentPayload,
                contentHash,
                previousHash,
                chainHash,
                logicClock
            ]);

            return chainHash;
        });
    }

    /**
     * Verify integrity of entire audit chain
     * 
     * Checks:
     * 1. Hash chain is unbroken (each hash references previous correctly)
     * 2. Logic clock has no gaps (sequential)
     * 3. Content hashes match recalculated hashes
     * 
     * @returns Integrity report
     */
    public async verifyIntegrity(): Promise<IntegrityReport> {
        const records = this.db.select(`
            SELECT id, event_type, entity_table, entity_id, content_payload,
                   content_hash, previous_hash, chain_hash, logic_clock
            FROM audit_chain
            ORDER BY logic_clock ASC
        `);

        const errors: IntegrityError[] = [];
        let previousHash = 'GENESIS';
        let expectedLogicClock = 1;

        for (const record of records) {
            // Check 1: Logic clock sequencing
            if (record.logic_clock !== expectedLogicClock) {
                errors.push({
                    recordId: record.id,
                    errorType: 'LOGIC_CLOCK_GAP',
                    message: `Logic clock gap detected. Expected ${expectedLogicClock}, found ${record.logic_clock}`,
                    severity: 'CRITICAL'
                });
            }

            // Check 2: Content hash verification
            const recalculatedContentHash = await this.sha256(
                `${record.content_payload}|${record.logic_clock}`
            );

            if (recalculatedContentHash !== record.content_hash) {
                errors.push({
                    recordId: record.id,
                    errorType: 'CONTENT_HASH_MISMATCH',
                    message: `Content hash mismatch for record ${record.id}. Data may have been tampered with.`,
                    severity: 'CRITICAL'
                });
            }

            // Check 3: Previous hash linkage
            if (record.previous_hash !== previousHash) {
                errors.push({
                    recordId: record.id,
                    errorType: 'CHAIN_BREAK',
                    message: `Chain break detected at record ${record.id}. Previous hash mismatch.`,
                    severity: 'CRITICAL'
                });
            }

            // Check 4: Chain hash verification
            const recalculatedChainHash = await this.sha256(
                `${record.previous_hash}|${record.content_hash}|${record.logic_clock}`
            );

            if (recalculatedChainHash !== record.chain_hash) {
                errors.push({
                    recordId: record.id,
                    errorType: 'CHAIN_HASH_MISMATCH',
                    message: `Chain hash mismatch for record ${record.id}. Chain integrity compromised.`,
                    severity: 'CRITICAL'
                });
            }

            // Update for next iteration
            previousHash = record.chain_hash;
            expectedLogicClock++;
        }

        return {
            valid: errors.length === 0,
            totalRecords: records.length,
            errors,
            lastLogicClock: records.length > 0 ? records[records.length - 1].logic_clock : 0,
            lastChainHash: previousHash
        };
    }

    /**
     * Verify integrity of a specific entity's audit trail
     * 
     * @param entityTable - Table name
     * @param entityId - Entity ID
     * @returns Integrity report for entity
     */
    public async verifyEntityIntegrity(entityTable: string, entityId: string): Promise<IntegrityReport> {
        const records = this.db.select(`
            SELECT id, event_type, content_payload, content_hash, previous_hash, chain_hash, logic_clock
            FROM audit_chain
            WHERE entity_table = ? AND entity_id = ?
            ORDER BY logic_clock ASC
        `, [entityTable, entityId]);

        const errors: IntegrityError[] = [];

        for (const record of records) {
            // Verify content hash
            const recalculatedContentHash = await this.sha256(
                `${record.content_payload}|${record.logic_clock}`
            );

            if (recalculatedContentHash !== record.content_hash) {
                errors.push({
                    recordId: record.id,
                    errorType: 'CONTENT_HASH_MISMATCH',
                    message: `Content tampered for ${entityTable}/${entityId}`,
                    severity: 'CRITICAL'
                });
            }
        }

        return {
            valid: errors.length === 0,
            totalRecords: records.length,
            errors,
            lastLogicClock: records.length > 0 ? records[records.length - 1].logic_clock : 0,
            lastChainHash: records.length > 0 ? records[records.length - 1].chain_hash : 'GENESIS'
        };
    }

    /**
     * Get audit trail for an entity
     * 
     * @param entityTable - Table name
     * @param entityId - Entity ID
     * @returns Audit trail records
     */
    public getAuditTrail(entityTable: string, entityId: string): AuditRecord[] {
        const records = this.db.select(`
            SELECT id, timestamp, event_type, user_id, content_payload, logic_clock
            FROM audit_chain
            WHERE entity_table = ? AND entity_id = ?
            ORDER BY logic_clock ASC
        `, [entityTable, entityId]);

        return records.map(r => ({
            id: r.id,
            timestamp: r.timestamp,
            eventType: r.event_type,
            userId: r.user_id,
            payload: JSON.parse(r.content_payload),
            logicClock: r.logic_clock
        }));
    }

    /**
     * SHA-256 hash function using Web Crypto API
     * 
     * @param data - Data to hash
     * @returns Hex-encoded SHA-256 hash
     * @private
     */
    private async sha256(data: string): Promise<string> {
        // Use Web Crypto API (available in browsers and Node.js 15+)
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Increment logic_clock
     * @private
     */
    private incrementLogicClock(): number {
        const current = this.db.select(
            'SELECT value FROM system_config WHERE key = ?',
            ['logic_clock']
        );

        if (current.length === 0) {
            throw new Error('logic_clock not initialized');
        }

        const newClock = parseInt(current[0].value) + 1;

        this.db.run(
            'UPDATE system_config SET value = ? WHERE key = ?',
            [newClock.toString(), 'logic_clock']
        );

        return newClock;
    }

    /**
     * Get current logic clock value
     */
    public getCurrentLogicClock(): number {
        const result = this.db.select(
            'SELECT value FROM system_config WHERE key = ?',
            ['logic_clock']
        );

        return result.length > 0 ? parseInt(result[0].value) : 0;
    }
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface AuditEvent {
    eventType: string;
    entityTable: string;
    entityId: string;
    userId: string;
    payload: any;
}

export interface IntegrityReport {
    valid: boolean;
    totalRecords: number;
    errors: IntegrityError[];
    lastLogicClock: number;
    lastChainHash: string;
}

export interface IntegrityError {
    recordId: number;
    errorType: 'LOGIC_CLOCK_GAP' | 'CONTENT_HASH_MISMATCH' | 'CHAIN_BREAK' | 'CHAIN_HASH_MISMATCH';
    message: string;
    severity: 'CRITICAL' | 'WARNING';
}

export interface AuditRecord {
    id: number;
    timestamp: string;
    eventType: string;
    userId: string;
    payload: any;
    logicClock: number;
}
