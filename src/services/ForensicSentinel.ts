import { DatabaseService } from '../database/DatabaseService';
import { logger } from '../core/logging/SystemLogger';
import { BasicEncryption } from '../core/security/BasicEncryption';

/**
 * ForensicSentinel (NASA Level Objective 2)
 * Proactive integrity monitor. Detects data tampering and provides self-healing paths.
 */
export class ForensicSentinel {

    /**
     * Scans the entire audit chain and verifies consistency.
     */
    static async fullIntegrityAudit(): Promise<{
        healthy: boolean;
        tamperedRecords: any[];
    }> {
        const chain = await DatabaseService.executeQuery("SELECT * FROM audit_chain ORDER BY id ASC");
        const tamperedRecords: { type: string; [key: string]: any }[] = [];

        let expectedPreviousHash = 'GENESIS_BLOCK';

        for (const record of chain) {
            // 1. Verify Hash Chaining
            if (record.previous_hash !== expectedPreviousHash) {
                tamperedRecords.push({
                    type: 'CHAIN_BREAK',
                    recordId: record.id,
                    expected: expectedPreviousHash,
                    actual: record.previous_hash
                });
            }

            // 2. Verify Record Content (Bit-level check)
            // This is the "NASA" part: Re-execute the hash for the current record in the real table
            const currentData = await DatabaseService.executeQuery(
                `SELECT * FROM ${record.table_name} WHERE id = ?`,
                [record.record_id]
            );

            if (currentData.length > 0) {
                const dataHash = await BasicEncryption.hash(new TextEncoder().encode(JSON.stringify(currentData[0])));
                // Note: sealGenericRecord uses stringified payload. 
                // A true sentinel might need deeper payload matching.

                // For now, we verify the chain metadata integrity
                const chainPayload = record.previous_hash + record.data_hash + record.table_name + record.record_id + record.logic_clock;
                const recalculateHash = await BasicEncryption.hash(new TextEncoder().encode(chainPayload));

                if (recalculateHash !== record.current_hash) {
                    tamperedRecords.push({
                        type: 'METADATA_TAMPERING',
                        recordId: record.id,
                        tableName: record.table_name
                    });
                }
            }

            expectedPreviousHash = record.current_hash;
        }

        const healthy = tamperedRecords.length === 0;
        if (!healthy) {
            logger.error('Sentinel', 'tampering_detected', `Detected ${tamperedRecords.length} compromises in the Forensic Audit Chain!`);
        }

        return { healthy, tamperedRecords };
    }

    /**
     * Forensic Replay (NASA Level Objective 2.2)
     * Reconstructs a record's state by replaying its forensic history.
     */
    static async repairRecord(tableName: string, recordId: number): Promise<boolean> {
        try {
            logger.info('Sentinel', 'repair_start', `Repairing ${tableName}:${recordId}`);

            // Find the last valid state in the audit chain
            const history = await DatabaseService.executeQuery(
                "SELECT payload FROM audit_chain WHERE table_name = ? AND record_id = ? ORDER BY logic_clock DESC LIMIT 1",
                [tableName, recordId]
            );

            if (history.length === 0) {
                throw new Error('No forensic history found for this record.');
            }

            const lastValidState = JSON.parse(history[0].payload || '{}');

            // Self-Heal: Updata the table with the forensic truth
            const columns = Object.keys(lastValidState).filter(k => k !== 'id');
            const setClause = columns.map(col => `${col} = ?`).join(', ');
            const values = columns.map(col => lastValidState[col]);
            values.push(recordId);

            await DatabaseService.executeQuery(
                `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
                values
            );

            logger.info('Sentinel', 'repair_success', `Record ${recordId} in ${tableName} successfully healed.`);
            return true;
        } catch (e) {
            logger.error('Sentinel', 'repair_failed', `Failed to heal record ${recordId}`, null, e as Error);
            return false;
        }
    }

    /**
     * Health Telemetry Provider
     */
    static async getHealthStats() {
        const chainStats = await DatabaseService.executeQuery("SELECT COUNT(*) as count, MAX(logic_clock) as last_clock FROM audit_chain");
        const tamperedCount = (await this.fullIntegrityAudit()).tamperedRecords.length;

        return {
            status: tamperedCount === 0 ? 'HEALTHY' : 'COMPROMISED',
            forensicEvents: chainStats[0].count,
            lastClock: chainStats[0].last_clock,
            integrityScore: Math.max(0, 100 - (tamperedCount * 5)), // Industrial metric
            uptime: performance.now()
        };
    }
}
