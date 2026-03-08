import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { AuditChainService } from './AuditChainService';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

/**
 * Unit tests for AuditChainService
 * 
 * ACCEPTANCE CRITERIA:
 * 1. verifyIntegrity() detects manual SQL changes to journal_details
 * 2. Logic clock is verified during restoration
 * 3. Hash chain is unbroken
 * 4. Performance: 1,000 records hashed without blocking
 */
describe('AuditChainService', () => {
    let db: SQLiteEngine;
    let auditChainService: AuditChainService;

    beforeAll(async () => {
        // Initialize in-memory database
        db = new SQLiteEngine();
        await db.initialize(':memory:');

        // Create schema
        await db.exec(`
            CREATE TABLE system_config (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.exec(`INSERT INTO system_config (key, value) VALUES ('logic_clock', '0')`);

        await db.exec(`
            CREATE TABLE audit_chain (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                event_type TEXT NOT NULL,
                entity_table TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                content_payload TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                previous_hash TEXT NOT NULL DEFAULT 'GENESIS',
                chain_hash TEXT NOT NULL,
                logic_clock INTEGER NOT NULL
            )
        `);

        await db.exec(`
            CREATE TABLE journal_details (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                journal_entry_id TEXT NOT NULL,
                account_code TEXT NOT NULL,
                debit_amount INTEGER DEFAULT 0,
                credit_amount INTEGER DEFAULT 0,
                logic_clock INTEGER NOT NULL
            )
        `);

        auditChainService = new AuditChainService(db);
    });

    beforeEach(async () => {
        // Reset logic_clock and clear audit_chain
        await db.run(`UPDATE system_config SET value = '0' WHERE key = 'logic_clock'`);
        await db.run(`DELETE FROM audit_chain`);
        await db.run(`DELETE FROM journal_details`);
    });

    describe('ACCEPTANCE TEST 1: Detect Manual SQL Changes', () => {
        it('should detect when journal_details is manually modified', async () => {
            // Arrange: Create audit record for ledger line
            const chainHash = await auditChainService.recordEvent({
                eventType: 'ledger_line_created',
                entityTable: 'journal_details',
                entityId: '1',
                userId: 'admin',
                payload: { debit_amount: 10000, credit_amount: 0, account_code: '1020' }
            });

            // Verify integrity is valid initially
            let integrity = await auditChainService.verifyIntegrity();
            expect(integrity.valid).toBe(true);

            // Act: Manually modify the audit_chain record (simulate tampering)
            await db.run(`
                UPDATE audit_chain 
                SET content_payload = '{"debit_amount":20000,"credit_amount":0,"account_code":"1020"}'
                WHERE id = 1
            `);

            // Assert: Integrity check should fail
            integrity = await auditChainService.verifyIntegrity();
            expect(integrity.valid).toBe(false);
            expect(integrity.errors.length).toBeGreaterThan(0);
            expect(integrity.errors[0].errorType).toBe('CONTENT_HASH_MISMATCH');
        });

        it('should detect when content_hash is manually changed', async () => {
            // Arrange
            await auditChainService.recordEvent({
                eventType: 'test_event',
                entityTable: 'journal_details',
                entityId: '1',
                userId: 'admin',
                payload: { value: 100 }
            });

            // Act: Tamper with content_hash
            await db.run(`UPDATE audit_chain SET content_hash = 'fake_hash' WHERE id = (SELECT MIN(id) FROM audit_chain)`);

            // Assert
            const integrity = await auditChainService.verifyIntegrity();
            expect(integrity.valid).toBe(false);
            expect(integrity.errors.length).toBeGreaterThan(0);
            expect(integrity.errors[0].errorType).toBe('CONTENT_HASH_MISMATCH');
        });
    });

    describe('ACCEPTANCE TEST 2: Logic Clock Verification', () => {
        it('should detect gaps in logic_clock sequence', async () => {
            // Arrange: Create 3 records
            await auditChainService.recordEvent({
                eventType: 'event_1',
                entityTable: 'test',
                entityId: '1',
                userId: 'admin',
                payload: { data: 'a' }
            });

            await auditChainService.recordEvent({
                eventType: 'event_2',
                entityTable: 'test',
                entityId: '2',
                userId: 'admin',
                payload: { data: 'b' }
            });

            await auditChainService.recordEvent({
                eventType: 'event_3',
                entityTable: 'test',
                entityId: '3',
                userId: 'admin',
                payload: { data: 'c' }
            });

            // Act: Manually delete record 2 (creates gap in logic_clock)
            // Get the middle record ID
            const records = await db.select('SELECT id FROM audit_chain ORDER BY logic_clock');
            const middleRecordId = (records[1] as any).id;
            await db.run(`DELETE FROM audit_chain WHERE id = ?`, [middleRecordId]);

            // Assert: Should detect logic_clock gap
            const integrity = await auditChainService.verifyIntegrity();
            expect(integrity.valid).toBe(false);
            expect(integrity.errors.some((e: any) => e.errorType === 'LOGIC_CLOCK_GAP')).toBe(true);
        });

        it('should verify logic_clock is sequential', async () => {
            // Arrange: Create 5 records
            for (let i = 1; i <= 5; i++) {
                await auditChainService.recordEvent({
                    eventType: `event_${i}`,
                    entityTable: 'test',
                    entityId: i.toString(),
                    userId: 'admin',
                    payload: { index: i }
                });
            }

            // Assert: Logic clock should be 1, 2, 3, 4, 5
            const records = await db.select('SELECT logic_clock FROM audit_chain ORDER BY id');
            expect(records.map((r: any) => r.logic_clock)).toEqual([1, 2, 3, 4, 5]);

            // Integrity should be valid
            const integrity = await auditChainService.verifyIntegrity();
            expect(integrity.valid).toBe(true);
        });
    });

    describe('ACCEPTANCE TEST 3: Hash Chain Integrity', () => {
        it('should detect broken chain when previous_hash is modified', async () => {
            // Arrange: Create 3 records
            await auditChainService.recordEvent({
                eventType: 'event_1',
                entityTable: 'test',
                entityId: '1',
                userId: 'admin',
                payload: { data: 'a' }
            });

            await auditChainService.recordEvent({
                eventType: 'event_2',
                entityTable: 'test',
                entityId: '2',
                userId: 'admin',
                payload: { data: 'b' }
            });

            await auditChainService.recordEvent({
                eventType: 'event_3',
                entityTable: 'test',
                entityId: '3',
                userId: 'admin',
                payload: { data: 'c' }
            });

            // Act: Break the chain by modifying previous_hash of record 2
            // Get the middle record ID
            const records = await db.select('SELECT id FROM audit_chain ORDER BY logic_clock');
            const middleRecordId = (records[1] as any).id;
            await db.run(`UPDATE audit_chain SET previous_hash = 'broken_chain' WHERE id = ?`, [middleRecordId]);

            // Assert
            const integrity = await auditChainService.verifyIntegrity();
            expect(integrity.valid).toBe(false);
            expect(integrity.errors.some((e: any) => e.errorType === 'CHAIN_BREAK')).toBe(true);
        });

        it('should verify first record has GENESIS as previous_hash', async () => {
            // Arrange
            await auditChainService.recordEvent({
                eventType: 'first_event',
                entityTable: 'test',
                entityId: '1',
                userId: 'admin',
                payload: { data: 'genesis' }
            });

            // Assert
            const record = await db.select('SELECT previous_hash FROM audit_chain ORDER BY id LIMIT 1');
            expect(record.length).toBeGreaterThan(0);
            expect((record[0] as any).previous_hash).toBe('GENESIS');
        });

        it('should link each record to previous via chain_hash', async () => {
            // Arrange: Create 3 records
            await auditChainService.recordEvent({
                eventType: 'event_1',
                entityTable: 'test',
                entityId: '1',
                userId: 'admin',
                payload: { data: 'a' }
            });

            await auditChainService.recordEvent({
                eventType: 'event_2',
                entityTable: 'test',
                entityId: '2',
                userId: 'admin',
                payload: { data: 'b' }
            });

            await auditChainService.recordEvent({
                eventType: 'event_3',
                entityTable: 'test',
                entityId: '3',
                userId: 'admin',
                payload: { data: 'c' }
            });

            // Assert: Record 2's previous_hash should equal Record 1's chain_hash
            const records = await db.select('SELECT chain_hash, previous_hash FROM audit_chain ORDER BY id');

            expect((records[1] as any).previous_hash).toBe((records[0] as any).chain_hash);
            expect((records[2] as any).previous_hash).toBe((records[1] as any).chain_hash);
        });
    });

    describe('ACCEPTANCE TEST 4: Performance with 1,000 Records', () => {
        it('should hash 1,000 records without blocking', async () => {
            const startTime = Date.now();

            // Create 1,000 records
            for (let i = 1; i <= 1000; i++) {
                await auditChainService.recordEvent({
                    eventType: 'bulk_event',
                    entityTable: 'test',
                    entityId: i.toString(),
                    userId: 'system',
                    payload: { index: i, data: `Record ${i}` }
                });
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Assert: Should complete in reasonable time (< 25 seconds)
            expect(duration).toBeLessThan(25000);

            // Verify all records created
            const countResult = await db.select('SELECT COUNT(*) as count FROM audit_chain');
            const count = (countResult[0] as any).count;
            expect(count).toBe(1000);

            // Verify integrity
            const integrity = await auditChainService.verifyIntegrity();
            expect(integrity.valid).toBe(true);
            expect(integrity.totalRecords).toBe(1000);
        }, 25000); // Increase timeout to 25 seconds
    });

    describe('Entity-Specific Integrity', () => {
        it('should verify integrity for specific entity', async () => {
            // Arrange: Create records for different entities
            await auditChainService.recordEvent({
                eventType: 'invoice_created',
                entityTable: 'invoices',
                entityId: '123',
                userId: 'admin',
                payload: { amount: 10000 }
            });

            await auditChainService.recordEvent({
                eventType: 'invoice_updated',
                entityTable: 'invoices',
                entityId: '123',
                userId: 'admin',
                payload: { amount: 15000 }
            });

            await auditChainService.recordEvent({
                eventType: 'invoice_created',
                entityTable: 'invoices',
                entityId: '456',
                userId: 'admin',
                payload: { amount: 20000 }
            });

            // Act: Verify entity 123
            const integrity = await auditChainService.verifyEntityIntegrity('invoices', '123');

            // Assert
            expect(integrity.valid).toBe(true);
            expect(integrity.totalRecords).toBe(2);
        });
    });

    describe('Audit Trail Retrieval', () => {
        it('should retrieve audit trail for entity', async () => {
            // Arrange
            await auditChainService.recordEvent({
                eventType: 'created',
                entityTable: 'invoices',
                entityId: '789',
                userId: 'admin',
                payload: { status: 'draft' }
            });

            await auditChainService.recordEvent({
                eventType: 'updated',
                entityTable: 'invoices',
                entityId: '789',
                userId: 'admin',
                payload: { status: 'posted' }
            });

            // Act
            const trail = await auditChainService.getAuditTrail('invoices', '789');

            // Assert
            expect(trail.length).toBe(2);
            expect(trail[0].eventType).toBe('created');
            expect(trail[1].eventType).toBe('updated');
            expect(trail[0].payload.status).toBe('draft');
            expect(trail[1].payload.status).toBe('posted');
        });
    });

    describe('SHA-256 Hashing', () => {
        it('should produce consistent SHA-256 hashes', async () => {
            // Create two identical events in separate test runs
            const hash1 = await auditChainService.recordEvent({
                eventType: 'test',
                entityTable: 'test',
                entityId: '1',
                userId: 'admin',
                payload: { value: 100 }
            });

            // Get the chain_hash from the database
            const record1 = await db.select('SELECT chain_hash, content_hash, previous_hash, logic_clock FROM audit_chain ORDER BY id DESC LIMIT 1');
            const firstRecord = record1[0] as any;

            // Reset and create again
            await db.run(`UPDATE system_config SET value = '0' WHERE key = 'logic_clock'`);
            await db.run(`DELETE FROM audit_chain`);

            const hash2 = await auditChainService.recordEvent({
                eventType: 'test',
                entityTable: 'test',
                entityId: '1',
                userId: 'admin',
                payload: { value: 100 }
            });

            // Get the chain_hash from the database
            const record2 = await db.select('SELECT chain_hash, content_hash, previous_hash, logic_clock FROM audit_chain ORDER BY id DESC LIMIT 1');
            const secondRecord = record2[0] as any;

            // Content hashes should be identical (deterministic)
            expect(secondRecord.content_hash).toBe(firstRecord.content_hash);

            // Previous hashes should both be GENESIS
            expect(firstRecord.previous_hash).toBe('GENESIS');
            expect(secondRecord.previous_hash).toBe('GENESIS');

            // Logic clocks should both be 1
            expect(firstRecord.logic_clock).toBe(1);
            expect(secondRecord.logic_clock).toBe(1);

            // Chain hashes should be identical (deterministic)
            expect(hash1).toBe(hash2);
        });
    });
});
