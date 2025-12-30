import { z } from 'zod';
import { AuditEventSchema, AuditVerificationResultSchema, type AuditEvent, type AuditVerificationResult } from './AuditEvent.types';
import { BasicEncryption } from '../../core/security/BasicEncryption';

export class AuditChainVerifier {
    private readonly GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

    /**
     * Verifies a list of audit events.
     * @param events List of events ordered by sequence (id/timestamp)
     */
    async verify(events: AuditEvent[]): Promise<AuditVerificationResult> {
        const errors: string[] = [];
        let previousHash = this.GENESIS_HASH;

        for (let i = 0; i < events.length; i++) {
            const event = events[i];

            // 1. Validate Structure
            const parseResult = AuditEventSchema.safeParse(event);
            if (!parseResult.success) {
                errors.push(`Structure Fail at index ${i}: ${parseResult.error.message}`);
                // If structure is bad, we can't reliably check hash, but we continue check link if possible
            }

            // 2. Check Chain Link
            if (event.previous_hash !== previousHash) {
                errors.push(`Broken Link at index ${i} (ID: ${event.id || 'unknown'}): stored previous_hash ${event.previous_hash} !== expected ${previousHash}`);
            }

            // 3. Re-calculate Hash
            // Payload format must match AuditChain.ts: 
            // `${previousHash}|${eventType}|${dataString}|${timestamp}|${userId}|${nonce}`
            // Note: event_type in schema is enum, we use the string value

            const payload = `${event.previous_hash}|${event.event_type}|${event.event_data}|${event.timestamp}|${event.user_id}|${event.nonce}`;
            const calculatedHash = await this.calculateHash(payload);

            if (calculatedHash !== event.current_hash) {
                errors.push(`Integrity Fail at index ${i} (ID: ${event.id || 'unknown'}): calculated ${calculatedHash} !== stored ${event.current_hash}`);
            }

            // Update previous hash for next iteration
            previousHash = event.current_hash;
        }

        const result = {
            isValid: errors.length === 0,
            totalEvents: events.length,
            lastHash: previousHash,
            errors: errors.length > 0 ? errors : undefined
        };

        return AuditVerificationResultSchema.parse(result);
    }

    private async calculateHash(data: string): Promise<string> {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        return await BasicEncryption.hash(dataBuffer);
    }
}
