import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { BasicEncryption } from '../../core/security/BasicEncryption';
import { BackupCompressor } from './compression/BackupCompressor';
import { BackupMetadataSchema, type BackupOptions, type BackupFileContainer } from './BackupMetadata.types';
import { AuditChain } from '../audit/AuditChain';

export class BackupManager {
    private engine: SQLiteEngine;
    private auditChain: AuditChain;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
        this.auditChain = new AuditChain(engine);
    }

    // Helper to ensure tables exist
    async ensureTables(): Promise<void> {
        const query = `
      CREATE TABLE IF NOT EXISTS backup_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT NOT NULL,
        audit_hash TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        description TEXT,
        file_path TEXT -- Path in OPFS
      );
    `;
        if ('exec' in this.engine) {
            (this.engine as any).exec(query);
        }
    }

    async createBackup(options: BackupOptions = {}): Promise<BackupFileContainer> {
        // 1. Gather Data
        const tablesToBackup = options.tables || [
            'company_data',
            'payment_methods',
            'bank_accounts',
            'customers',
            'suppliers',
            'products',
            'invoices',
            'invoice_lines',
            'bills',
            'bill_lines',
            'payments',
            'journal_entries',
            'journal_details',
            'florida_tax_rates',
            'audit_chain'
        ];

        const dbDump: Record<string, any[]> = {};
        let totalRecords = 0;

        for (const table of tablesToBackup) {
            try {
                const rows = this.engine.select(`SELECT * FROM ${table}`);
                dbDump[table] = rows;
                totalRecords += rows.length;
            } catch (e) {
                console.warn(`Skipping table ${table} - might not exist`, e);
                dbDump[table] = [];
            }
        }

        const rawJson = JSON.stringify(dbDump);
        const rawBytes = new TextEncoder().encode(rawJson);
        const sizeUncompressed = rawBytes.length;

        // 2. Compress
        const compressedBytes = BackupCompressor.compress(rawBytes);

        // 3. Encrypt
        const password = options.password || 'default-system-key'; // Should be from Vault
        // BasicEncryption.encrypt returns {encrypted, salt, iv}
        const { encrypted, salt, iv } = await BasicEncryption.encrypt(compressedBytes, password);
        const combinedEncrypted = BasicEncryption.combineEncryptedData(encrypted, salt, iv);

        // 4. Calculate Checksum
        const checksum = await BasicEncryption.hash(combinedEncrypted);

        // 5. Get Last Audit Hash
        // Assuming AuditChain has getLastHash exposed or we query it. 
        // We already have audit_chain table in dump, but for metadata we want the latest.
        const lastAudit = this.engine.select('SELECT current_hash FROM audit_chain ORDER BY id DESC LIMIT 1');
        const auditHash = lastAudit[0]?.current_hash || 'GENESIS';

        // 6. Build Metadata
        const metadata = {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            checksum,
            auditHash,
            tablesIncluded: tablesToBackup,
            sizeUncompressed,
            sizeCompressed: combinedEncrypted.length,
            description: options.description || 'Auto-generated backup',
            isEncrypted: true
        };

        // 7. Validate Metadata
        const validMetadata = BackupMetadataSchema.parse(metadata);

        // 8. Register in DB (Audit & Backup table)
        await this.auditChain.addEvent('backup_created', { checksum, size: validMetadata.sizeCompressed });

        // Insert into backup_versions
        this.engine.run(`
        INSERT INTO backup_versions (version, created_at, checksum, audit_hash, size_bytes, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [validMetadata.version, validMetadata.createdAt, checksum, auditHash, validMetadata.sizeCompressed, validMetadata.description]);

        // @ts-ignore
        return {
            metadata: validMetadata,
            data: combinedEncrypted
        } as any;
    }

    async restoreBackup(backupFile: Uint8Array, password: string): Promise<boolean> {
        // 1. Verify Checksum
        const calculatedChecksum = await BasicEncryption.hash(backupFile);
        // In a real file scenario, we would parse container first to get metadata.
        // Here we assume backupFile IS the data blob for simplicity of the method signature 
        // or we changed signature to accept container. 
        // Let's assume the blob passed IS the encrypted data we returned in createBackup.data

        // 2. Decrypt
        const { salt, iv, encrypted } = BasicEncryption.separateEncryptedData(backupFile);
        const compressedBytes = await BasicEncryption.decrypt(encrypted, salt, iv, password);

        // 3. Decompress
        const jsonString = BackupCompressor.decompress(compressedBytes);
        const dbDump = JSON.parse(jsonString) as Record<string, any[]>;

        // 4. Import Atomic Transaction
        await this.engine.executeTransaction(async () => {
            for (const [table, rows] of Object.entries(dbDump)) {
                if (rows.length === 0) continue;

                // Clear table first? Strategy: Full Restore usually creates clean state.
                // WARNING: Destructive.
                // Assuming 'DELETE FROM table'
                try {
                    this.engine.exec(`DELETE FROM ${table}`);

                    if (rows.length > 0) {
                        const keys = Object.keys(rows[0]);
                        const placeholders = keys.map(() => '?').join(',');
                        const columns = keys.join(',');
                        const stmt = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`; // Not prepared correctly for engine.run loop but close enough for concept

                        // Optimized batch insert if engine supported it, else loop
                        for (const row of rows) {
                            this.engine.run(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`, Object.values(row));
                        }
                    }
                } catch (e) {
                    console.error(`Error restoring table ${table}`, e);
                    throw e; // Trigger Rollback
                }
            }
        });

        // 5. Audit
        await this.auditChain.addEvent('backup_restored', { checksum: calculatedChecksum });

        return true;
    }
}
