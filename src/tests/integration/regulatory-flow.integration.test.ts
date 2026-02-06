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

        // Create florida_tax_rates table
        db.run(`
            CREATE TABLE IF NOT EXISTS florida_tax_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                county_name TEXT UNIQUE NOT NULL,
                county_code TEXT UNIQUE NOT NULL,
                state_rate DECIMAL(5,4) DEFAULT 0.06,
                county_rate DECIMAL(5,4) DEFAULT 0.01,
                total_rate DECIMAL(5,4) DEFAULT 0.07,
                is_active BOOLEAN DEFAULT 1,
                effective_date DATE,
                notes TEXT
            );
        `);

        // Insert Miami-Dade county for tests
        db.run(`
            INSERT INTO florida_tax_rates (county_name, county_code, state_rate, county_rate, total_rate)
            VALUES ('Miami-Dade', 'MIAMI-DADE', 0.06, 0.01, 0.07);
        `);

        // Insert all 67 Florida counties
        const counties = [
            { name: "Alachua", code: "ALACHUA", county_rate: 0.015 },
            { name: "Baker", code: "BAKER", county_rate: 0.01 },
            { name: "Bay", code: "BAY", county_rate: 0.01 },
            { name: "Bradford", code: "BRADFORD", county_rate: 0.01 },
            { name: "Brevard", code: "BREVARD", county_rate: 0.01 },
            { name: "Broward", code: "BROWARD", county_rate: 0.01 },
            { name: "Calhoun", code: "CALHOUN", county_rate: 0.015 },
            { name: "Charlotte", code: "CHARLOTTE", county_rate: 0.01 },
            { name: "Citrus", code: "CITRUS", county_rate: 0.01 },
            { name: "Clay", code: "CLAY", county_rate: 0.015 },
            { name: "Collier", code: "COLLIER", county_rate: 0.01 },
            { name: "Columbia", code: "COLUMBIA", county_rate: 0.01 },
            { name: "DeSoto", code: "DESOTO", county_rate: 0.015 },
            { name: "Dixie", code: "DIXIE", county_rate: 0.01 },
            { name: "Duval", code: "DUVAL", county_rate: 0.015 },
            { name: "Escambia", code: "ESCAMBIA", county_rate: 0.015 },
            { name: "Flagler", code: "FLAGLER", county_rate: 0.01 },
            { name: "Franklin", code: "FRANKLIN", county_rate: 0.01 },
            { name: "Gadsden", code: "GADSDEN", county_rate: 0.015 },
            { name: "Gilchrist", code: "GILCHRIST", county_rate: 0.01 },
            { name: "Glades", code: "GLADES", county_rate: 0.01 },
            { name: "Gulf", code: "GULF", county_rate: 0.01 },
            { name: "Hamilton", code: "HAMILTON", county_rate: 0.01 },
            { name: "Hardee", code: "HARDEE", county_rate: 0.01 },
            { name: "Hendry", code: "HENDRY", county_rate: 0.01 },
            { name: "Hernando", code: "HERNANDO", county_rate: 0.005 },
            { name: "Highlands", code: "HIGHLANDS", county_rate: 0.015 },
            { name: "Hillsborough", code: "HILLSBOROUGH", county_rate: 0.015 },
            { name: "Holmes", code: "HOLMES", county_rate: 0.01 },
            { name: "Indian River", code: "INDIAN-RIVER", county_rate: 0.01 },
            { name: "Jackson", code: "JACKSON", county_rate: 0.015 },
            { name: "Jefferson", code: "JEFFERSON", county_rate: 0.01 },
            { name: "Lafayette", code: "LAFAYETTE", county_rate: 0.01 },
            { name: "Lake", code: "LAKE", county_rate: 0.01 },
            { name: "Lee", code: "LEE", county_rate: 0.005 },
            { name: "Leon", code: "LEON", county_rate: 0.015 },
            { name: "Levy", code: "LEVY", county_rate: 0.01 },
            { name: "Liberty", code: "LIBERTY", county_rate: 0.015 },
            { name: "Madison", code: "MADISON", county_rate: 0.015 },
            { name: "Manatee", code: "MANATEE", county_rate: 0.01 },
            { name: "Marion", code: "MARION", county_rate: 0.01 },
            { name: "Martin", code: "MARTIN", county_rate: 0.005 },
            { name: "Monroe", code: "MONROE", county_rate: 0.015 },
            { name: "Nassau", code: "NASSAU", county_rate: 0.01 },
            { name: "Okaloosa", code: "OKALOOSA", county_rate: 0.005 },
            { name: "Okeechobee", code: "OKEECHOBEE", county_rate: 0.01 },
            { name: "Orange", code: "ORANGE", county_rate: 0.005 },
            { name: "Osceola", code: "OSCEOLA", county_rate: 0.015 },
            { name: "Palm Beach", code: "PALM-BEACH", county_rate: 0.01 },
            { name: "Pasco", code: "PASCO", county_rate: 0.01 },
            { name: "Pinellas", code: "PINELLAS", county_rate: 0.01 },
            { name: "Polk", code: "POLK", county_rate: 0.01 },
            { name: "Putnam", code: "PUTNAM", county_rate: 0.01 },
            { name: "Santa Rosa", code: "SANTA-ROSA", county_rate: 0.005 },
            { name: "Sarasota", code: "SARASOTA", county_rate: 0.01 },
            { name: "Seminole", code: "SEMINOLE", county_rate: 0.01 },
            { name: "St. Johns", code: "ST-JOHNS", county_rate: 0.005 },
            { name: "St. Lucie", code: "ST-LUCIE", county_rate: 0.01 },
            { name: "Sumter", code: "SUMTER", county_rate: 0.01 },
            { name: "Suwannee", code: "SUWANNEE", county_rate: 0.01 },
            { name: "Taylor", code: "TAYLOR", county_rate: 0.01 },
            { name: "Union", code: "UNION", county_rate: 0.01 },
            { name: "Volusia", code: "VOLUSIA", county_rate: 0.005 },
            { name: "Wakulla", code: "WAKULLA", county_rate: 0.01 },
            { name: "Walton", code: "WALTON", county_rate: 0.01 },
            { name: "Washington", code: "WASHINGTON", county_rate: 0.01 }
        ];

        // Skip Miami-Dade since we already inserted it
        for (const county of counties.filter(c => c.code !== 'MIAMI-DADE')) {
            const total_rate = 0.06 + county.county_rate;
            db.run(`
                INSERT OR IGNORE INTO florida_tax_rates (county_name, county_code, state_rate, county_rate, total_rate)
                VALUES (?, ?, 0.06, ?, ?);
            `, [county.name, county.code, county.county_rate, total_rate]);
        }

        // Create accounting_periods table
        db.run(`
            CREATE TABLE IF NOT EXISTS accounting_periods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                period_name TEXT NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                fiscal_year INTEGER NOT NULL,
                fiscal_year_id INTEGER,
                status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed', 'locked')),
                closed_by INTEGER,
                closed_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_years(id)
            );
        `);

        // Create fiscal_years table
        db.run(`
            CREATE TABLE IF NOT EXISTS fiscal_years (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                year INTEGER UNIQUE NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                status TEXT DEFAULT 'open' CHECK(status IN ('open', 'closed')),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Insert current fiscal year
        const currentYear = new Date().getFullYear();
        db.run(`
            INSERT INTO fiscal_years (year, start_date, end_date, status)
            VALUES (${currentYear}, '${currentYear}-01-01', '${currentYear}-12-31', 'open');
        `);

        // Create tax_transactions table for DR-15 tests
        db.run(`
            CREATE TABLE IF NOT EXISTS tax_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_id INTEGER,
                county_code TEXT NOT NULL,
                taxable_amount INTEGER NOT NULL,
                tax_amount INTEGER NOT NULL,
                effective_rate INTEGER NOT NULL,
                transaction_date TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

        const config = await DatabaseService.executeQuery("SELECT * FROM florida_tax_rates WHERE county_name LIKE 'Miami%'");
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
