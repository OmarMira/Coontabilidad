// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

beforeAll(async () => {
    if (typeof window !== 'undefined' && !window.crypto) {
        const { webcrypto } = await import('node:crypto');
        Object.defineProperty(window, 'crypto', {
            value: webcrypto,
            writable: true
        });
    }
});

import { TaxReportingService } from '../services/TaxReportingService';
import { XMLGeneratorService } from '../services/XMLGeneratorService';
import { DatabaseService } from '../database/DatabaseService';

// Mock DatabaseService
vi.mock('../database/DatabaseService', () => ({
    DatabaseService: {
        executeQuery: vi.fn()
    }
}));

// Mock basic crypto if needed, but modern Node has it. 
// If BasicEncryption fails due to missing TextEncoder/crypto, we might need setup.
// Vitest environment 'node' usually has them.

describe('Regulatory Reporting Flow (DR-15)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should generate a valid DR-15 report and XML with forensic checksum', async () => {
        // 1. Setup Mock Data
        // generateDR15Report queries `tax_transactions`
        const mockTransactions = [
            { county_code: 'FL001', total_sales: 10000, total_tax: 600 }, // $100.00 / $6.00
            { county_code: 'FL002', total_sales: 20000, total_tax: 1200 } // $200.00 / $12.00
            // Totals: Sales 30000 ($300), Tax 1800 ($18)
        ];

        (DatabaseService.executeQuery as any).mockResolvedValue(mockTransactions);

        // 2. Execute Report Generation
        const month = 1; // January
        const year = 2026;
        const report = await TaxReportingService.generateDR15Report(month, year);

        // 3. Verify Report Structure & Totals
        expect(report).toBeDefined();
        expect(report.taxpayerInfo.period).toBe('2026-01');

        expect(report.totals.sales).toBe(30000);
        expect(report.totals.tax).toBe(1800);

        expect(report.countySummary).toHaveLength(2);
        expect(report.countySummary[0].code).toBe('FL001');

        // 4. Verify Forensic Integrity (Checksum)
        expect(report.verification).toBeDefined();
        expect(report.verification.checksum).toBeDefined();
        expect(typeof report.verification.checksum).toBe('string');
        expect(report.verification.checksum.length).toBeGreaterThan(0);
        expect(report.verification.generatedAt).toBeDefined();

        // 5. Generate XML for E-Filing
        const xml = XMLGeneratorService.generateDR15XML(report);

        // 6. Verify XML Content
        expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(xml).toContain('<FDOR_DR15_Return');
        expect(xml).toContain('<ForensicChecksum>' + report.verification.checksum + '</ForensicChecksum>');
        expect(xml).toContain('<TotalTaxDue>1800</TotalTaxDue>');
        expect(xml).toContain('<TotalGrossSales>30000</TotalGrossSales>');
        expect(xml).toContain('<ReportingPeriod>2026-01</ReportingPeriod>');
    });
});
