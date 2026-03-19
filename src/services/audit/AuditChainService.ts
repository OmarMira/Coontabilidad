import { logger } from '../../core/logging/SystemLogger';
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
    /**
     * Record an event in the audit chain
     * 
     * @param event - Event data to record
     * @returns Chain hash of the new record
     */
    public async recordEvent(event: AuditEvent): Promise<string> {
        return this.db.executeTransaction(async () => {
            // 1. Increment logic_clock
            const logicClock = await this.incrementLogicClock();

            // 2. Prepare payload (Optimize storage with Delta if possible)
            let finalPayload = event.payload;
            let isDelta = false;

            // Intento de optimizaciÃ³n Delta solo para UPDATES
            if (event.eventType.toUpperCase().includes('UPDATE') || event.eventType.toUpperCase().includes('EDIT')) {
                const previousRecord = await this.db.select(
                    `SELECT content_payload FROM audit_chain 
                     WHERE entity_table = ? AND entity_id = ? 
                     ORDER BY logic_clock DESC LIMIT 1`,
                    [event.entityTable, event.entityId]
                );

                if (previousRecord.length > 0) {
                    try {
                        const oldData = JSON.parse((previousRecord[0] as any).content_payload);
                        
                        // Crear delta mÃ¡s eficiente
                        const delta = this.createDelta(oldData, event.payload);
                        
                        // Solo usar delta si es significativamente mÃ¡s pequeÃ±o
                        const deltaSize = JSON.stringify(delta).length;
                        const fullSize = JSON.stringify(event.payload).length;
                        
                        if (deltaSize < fullSize * 0.7) { // Solo si el delta es 30% mÃ¡s pequeÃ±o
                            finalPayload = { _is_delta: true, _delta_version: 1, ...delta };
                            isDelta = true;
                        }

                    } catch (e) {
                        // Si falla el parseo o diff, guardamos payload original
                        logger.warn('AuditChainService', 'delta_error', 'Error creating delta, using full payload');
                        logger.warn('AuditChainService', 'delta_error', 'Error creating delta, using full payload');
                }
            }

            const contentPayload = JSON.stringify(finalPayload);

            // 3. Generate content hash (SHA-256 of payload + logic_clock)
            const contentHash = await this.sha256(`${contentPayload}|${logicClock}`);

            // 4. Get previous hash
            const previous = await this.db.select(
                'SELECT chain_hash FROM audit_chain ORDER BY id DESC LIMIT 1'
            );
            const previousHash = previous.length > 0 ? (previous[0] as any).chain_hash : 'GENESIS';

            // 5. Generate chain hash (SHA-256 of previous_hash + content_hash + logic_clock)
            const chainHash = await this.sha256(`${previousHash}|${contentHash}|${logicClock}`);

            // 6. Insert into audit_chain
            await this.db.run(`
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
        const records = await this.db.select(`
            SELECT id, event_type, entity_table, entity_id, content_payload,
                   content_hash, previous_hash, chain_hash, logic_clock
            FROM audit_chain
            ORDER BY logic_clock ASC
        `);

        const errors: IntegrityError[] = [];
        let previousHash = 'GENESIS';
        let expectedLogicClock = 1;

        for (const recordData of records) {
            const record = recordData as any;
            
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
        const records = await this.db.select(`
            SELECT id, event_type, content_payload, content_hash, previous_hash, chain_hash, logic_clock
            FROM audit_chain
            WHERE entity_table = ? AND entity_id = ?
            ORDER BY logic_clock ASC
        `, [entityTable, entityId]);

        const errors: IntegrityError[] = [];

        for (const recordData of records) {
            const record = recordData as any;
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
     * Get recent records from the audit chain
     * 
     * @param limit - Max records to return
     * @returns Last records in the chain
     */
    public async getAuditLog(limit: number = 100): Promise<any[]> {
        const records = await this.db.select(`
            SELECT id, timestamp as created_at, event_type, entity_table, entity_id, user_id, 
                   content_payload as payload, logic_clock, chain_hash, previous_hash
            FROM audit_chain
            ORDER BY logic_clock DESC
            LIMIT ?
        `, [limit]);

        return records.map((r: any) => ({
            id: r.id,
            created_at: r.created_at,
            event_type: r.event_type,
            entity_table: r.entity_table,
            entity_id: r.entity_id,
            user_id: r.user_id,
            payload: r.payload ? JSON.parse(r.payload) : {},
            logic_clock: r.logic_clock,
            chain_hash: r.chain_hash,
            previous_hash: r.previous_hash
        }));
    }

    /**
     * Get audit trail for an entity
     * 
     * @param entityTable - Table name
     * @param entityId - Entity ID
     * @returns Audit trail records
     */
    public async getAuditTrail(entityTable: string, entityId: string): Promise<AuditRecord[]> {
        const records = await this.db.select(`
            SELECT id, timestamp, event_type, user_id, content_payload, logic_clock
            FROM audit_chain
            WHERE entity_table = ? AND entity_id = ?
            ORDER BY logic_clock ASC
        `, [entityTable, entityId]);

        return records.map((r: any) => ({
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
    private async incrementLogicClock(): Promise<number> {
        const current = await this.db.select(
            'SELECT value FROM system_config WHERE key = ?',
            ['logic_clock']
        );

        if (current.length === 0) {
            throw new Error('logic_clock not initialized');
        }

        const newClock = parseInt((current[0] as any).value) + 1;

        await this.db.run(
            'UPDATE system_config SET value = ? WHERE key = ?',
            [newClock.toString(), 'logic_clock']
        );

        return newClock;
    }

    /**
     * Get current logic clock value
     */
    public async getCurrentLogicClock(): Promise<number> {
        const result = await this.db.select(
            'SELECT value FROM system_config WHERE key = ?',
            ['logic_clock']
        );

        return result.length > 0 ? parseInt((result[0] as any).value) : 0;
    }

    /**
     * Crear delta eficiente entre dos objetos
     * Solo incluye campos que cambiaron
     */
    private createDelta(oldData: any, newData: any): any {
        const delta: any = {};
        
        // Detectar cambios en campos existentes
        for (const key in newData) {
            if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
                delta[key] = {
                    old: oldData[key],
                    new: newData[key]
                };
            }
        }
        
        // Detectar campos eliminados
        for (const key in oldData) {
            if (!(key in newData)) {
                delta[key] = {
                    old: oldData[key],
                    new: null,
                    _deleted: true
                };
            }
        }
        
        return delta;
    }

    /**
     * Reconstruir objeto completo desde delta
     */
    public async reconstructFromDelta(entityTable: string, entityId: string, targetLogicClock?: number): Promise<any> {
        const records = await this.db.select(
            `SELECT content_payload, logic_clock FROM audit_chain 
             WHERE entity_table = ? AND entity_id = ? 
             ${targetLogicClock ? 'AND logic_clock <= ?' : ''}
             ORDER BY logic_clock ASC`,
            targetLogicClock ? [entityTable, entityId, targetLogicClock] : [entityTable, entityId]
        );

        let reconstructed: any = {};

        for (const record of records) {
            const payload = JSON.parse((record as any).content_payload);
            
            if (payload._is_delta) {
                // Aplicar delta
                for (const key in payload) {
                    if (key.startsWith('_')) continue; // Skip metadata
                    
                    if (payload[key]._deleted) {
                        delete reconstructed[key];
                    } else {
                        reconstructed[key] = payload[key].new;
                    }
                }
            } else {
                // Payload completo, reemplazar todo
                reconstructed = { ...payload };
            }
        }

        return reconstructed;
    }

    /**
     * Obtener estadÃ­sticas de compresiÃ³n delta
     */
    public async getDeltaCompressionStats(): Promise<{
        totalRecords: number;
        deltaRecords: number;
        compressionRatio: number;
        spaceSaved: number;
    }> {
        const stats = await this.db.select(`
            SELECT 
                COUNT(*) as total_records,
                SUM(CASE WHEN content_payload LIKE '%"_is_delta":true%' THEN 1 ELSE 0 END) as delta_records,
                SUM(LENGTH(content_payload)) as total_size
            FROM audit_chain
        `);

        const result = stats[0] as any;
        const compressionRatio = result.delta_records / result.total_records;
        
        return {
            totalRecords: result.total_records,
            deltaRecords: result.delta_records,
            compressionRatio: compressionRatio,
            spaceSaved: Math.round(compressionRatio * 30) // EstimaciÃ³n de 30% de ahorro promedio
        };
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
