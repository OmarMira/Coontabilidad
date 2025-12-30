import { z } from 'zod';

export const AuditEventSchema = z.object({
    id: z.string().optional(),
    previous_hash: z.string(),
    current_hash: z.string(),
    event_type: z.enum([
        'invoice_created',
        'invoice_updated',
        'tax_calculated',
        'dr15_generated',
        'backup_created',
        'backup_restored',
        'audit_verification'
    ]),
    event_data: z.string(), // Encrypted JSON
    user_id: z.number().optional().default(1),
    timestamp: z.string(), // ISO 8601
    nonce: z.number()
}).strict();

export const AuditVerificationResultSchema = z.object({
    isValid: z.boolean(),
    totalEvents: z.number(),
    lastHash: z.string(),
    errors: z.array(z.string()).optional()
}).strict();

export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AuditVerificationResult = z.infer<typeof AuditVerificationResultSchema>;
