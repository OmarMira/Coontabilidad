// @vitest-environment jsdom
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import initSqlJs from 'sql.js';
import { DatabaseService } from '../../database/DatabaseService';
import { TaxReportingService } from '../../services/TaxReportingService';
import { XMLGeneratorService } from '../../services/XMLGeneratorService';

describe('Regulatory & Forensic Integration Test (L1/L3)', () => {
    let db: any;

    beforeAll(async () => {
        if (!globalThis.localStorage) {
            const storage: Record<string, string> = {};
            globalThis.localStorage = {
                getItem: (key: string) => storage[key] || null,
                setItem: (key: string, value: string) => { storage[key] = value; },
                removeItem: (key: string) => { delete storage[key]; },
                clear: () => { for (const k in storage) delete storage[k]; },
                length: 0,
                key: (index: number) => null
            } as Storage;
        }
        if (globalThis.crypto && !globalThis.crypto.randomUUID) {
            Object.defineProperty(globalThis.crypto, 'randomUUID', {
                value: () => 'TEST-UUID-1234',
                writable: true,
                configurable: true
            });
        }

        // Polyfill Web Crypto API for BasicEncryption (requires node:crypto in jsdom)
        const { webcrypto } = await import('node:crypto');
        Object.defineProperty(window, 'crypto', {
            value: webcrypto,
            writable: true,
            configurable: true
        });
        Object.defineProperty(globalThis, 'crypto', {
            value: webcrypto,
            writable: true,
            configurable: true
        });

        const SQL = await initSqlJs();
        db = new SQL.Database();
        DatabaseService.setDB(db);

        // Mimic simple-db schema (DECIMAL for money)
        db.run(`
            CREATE TABLE journal_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entry_number TEXT,
                description TEXT,
                transaction_date TEXT,
                entry_date TEXT,
                reference TEXT,
                total_debit DECIMAL(15,2),
                total_credit DECIMAL(15,2),
                created_by INTEGER
            );
        `);
        // We also need journal_entry_lines for verification logic to work
        db.run(`
            CREATE TABLE journal_entry_lines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                journal_entry_id INTEGER,
                account_code TEXT,
                description TEXT,
                debit DECIMAL(15,2),
                credit DECIMAL(15,2)
            );
        `);

        await DatabaseService.initializeForensicLayer(false);
    });

    afterAll(() => {
        if (db) db.close();
    });

    it('should pass forensic integrity check on new journal entries', async () => {
        // Step A: Insert Journal Entry (Use float for dollars)
        const entryItems = [
            { account_code: '4000', debit: 0, credit: 107.00, description: 'Sales Revenue + Tax' },
            { account_code: '1100', debit: 107.00, credit: 0, description: 'Cash' }
        ];

        let jeNumber = '';
        try {
            jeNumber = await DatabaseService.insertJournalEntry({
                description: 'Test Invoice #1',
                date: new Date().toISOString(),
                items: entryItems,
                userId: 1
            });
        } catch (e) {
            console.error('INSERT ERROR:', e);
            throw e;
        }

        expect(jeNumber).toBeDefined();
        expect(jeNumber).toContain('JE-');

        const idRes = await DatabaseService.executeQuery("SELECT id FROM journal_entries WHERE entry_number = ?", [jeNumber]);
        const id = idRes[0].id;

        const isVerified = await DatabaseService.verifyJournalEntryIntegrity(id);
        if (!isVerified) console.error('VERIFICATION FAILED for ID:', id);

        expect(isVerified).toBe(true);
    });

    it('should generate accurate DR-15 report from tax transactions', async () => {
        const month = 1; // Jan
        const year = 2026;

        const config = await DatabaseService.executeQuery("SELECT * FROM florida_tax_config WHERE county_name LIKE 'Miami%'");
        expect(config.length).toBeGreaterThan(0);
        const miamiCode = config[0].county_code;

        await db.run(`
            INSERT INTO tax_transactions (invoice_id, county_code, taxable_amount, tax_amount, effective_rate, transaction_date)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [999, miamiCode, 100000, 7000, 700, '2026-01-15T10:00:00.000Z']);

        const txCheck = await DatabaseService.executeQuery("SELECT * FROM tax_transactions");
        expect(txCheck.length).toBe(1);

        const report = await TaxReportingService.generateDR15Report(month, year);

        expect(report.totals.sales).toBe(100000);
        expect(report.totals.tax).toBe(7000);
        expect(report.verification.checksum).toBeDefined();

        const xml = XMLGeneratorService.generateDR15XML(report);
        console.error('XML DEBUG:', xml);
        expect(xml).toContain(`${report.verification.checksum}`);
        expect(xml).toContain('7000'); // Check for Cents (7000)
        expect(xml).toContain('<TotalGrossSales>');
        expect(xml).toContain('100000');
        expect(xml).toContain('</TotalGrossSales>');
    });

    it('should validate Florida Tax Config (Priority 2)', async () => {
        const configStatus = await TaxReportingService.hasValidConfiguration();
        expect(configStatus.valid).toBe(true);
        expect(configStatus.counties).toBe(67);
        expect(configStatus.outdatedRates).toBe(false);
    });
});
