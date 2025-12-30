import { z } from 'zod';

export const BackupMetadataSchema = z.object({
    version: z.string().default('1.0.0'),
    createdAt: z.string(), // ISO 8601
    checksum: z.string(), // SHA-256 of encrypted blob
    auditHash: z.string(), // Last known chain hash
    tablesIncluded: z.array(z.string()),
    sizeUncompressed: z.number(),
    sizeCompressed: z.number(),
    description: z.string().optional(),
    isEncrypted: z.boolean().default(true)
}).strict();

export const BackupFileSchema = z.object({
    metadata: BackupMetadataSchema,
    data: z.instanceof(Uint8Array) // Encrypted binary blob
});

export type BackupMetadata = z.infer<typeof BackupMetadataSchema>;
export type BackupFileContainer = z.infer<typeof BackupFileSchema>;

export interface BackupOptions {
    description?: string;
    password?: string;
    tables?: string[];
}
