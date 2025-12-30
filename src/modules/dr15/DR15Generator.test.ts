import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DR15Generator } from './DR15Generator';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

// Mock SQLiteEngine
const mockSelect = vi.fn();
// We cast to unknown first to avoid typescript partial compatibility issues with the full class
const mockEngine = {
    select: mockSelect
} as unknown as SQLiteEngine;

describe('DR15Generator', () => {
    let generator: DR15Generator;

    beforeEach(() => {
        vi.clearAllMocks();
        generator = new DR15Generator(mockEngine);
    });

    it('should generate an empty report when no invoices exist', async () => {
        mockSelect.mockResolvedValueOnce([]);

        const report = await generator.generateMonthlyReport(2024, 1);

        expect(report.totalGrossSales).toBe(0);
        expect(report.totalTaxableSales).toBe(0);
        expect(report.totalTaxCollected).toBe(0);
        expect(report.countyBreakdown).toHaveLength(0);
        expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['2024-01']);
    });

    it('should aggregate taxable sales correctly across multiple counties', async () => {
        mockSelect.mockResolvedValueOnce([
            { subtotal: 100, tax_amount: 7.0, total_amount: 107.0, county: 'Miami-Dade', tax_exempt: 0 },
            { subtotal: 200, tax_amount: 14.0, total_amount: 214.0, county: 'Miami-Dade', tax_exempt: 0 },
            { subtotal: 100, tax_amount: 7.0, total_amount: 107.0, county: 'Broward', tax_exempt: 0 }
        ]);

        const report = await generator.generateMonthlyReport(2024, 2);

        expect(report.totalGrossSales).toBe(400);
        expect(report.totalTaxableSales).toBe(400);
        expect(report.totalTaxCollected).toBe(28.0);
        expect(report.countyBreakdown).toHaveLength(2);

        const miami = report.countyBreakdown.find(c => c.county === 'Miami-Dade');
        expect(miami?.grossSales).toBe(300);
        expect(miami?.taxCollected).toBe(21);

        const broward = report.countyBreakdown.find(c => c.county === 'Broward');
        expect(broward?.grossSales).toBe(100);
    });

    it('should handle tax exempt sales correctly', async () => {
        mockSelect.mockResolvedValueOnce([
            // Taxable
            { subtotal: 100, tax_amount: 7.0, total_amount: 107.0, county: 'Miami-Dade', tax_exempt: 0 },
            // Exempt
            { subtotal: 50, tax_amount: 0, total_amount: 50.0, county: 'Miami-Dade', tax_exempt: 1 }
        ]);

        const report = await generator.generateMonthlyReport(2024, 3);

        expect(report.totalGrossSales).toBe(150);
        expect(report.totalTaxableSales).toBe(100);
        expect(report.totalTaxCollected).toBe(7.0);

        const miami = report.countyBreakdown.find(c => c.county === 'Miami-Dade');
        expect(miami?.grossSales).toBe(150);
        expect(miami?.taxableSales).toBe(100);
    });

    it('should throw Zod error for invalid inputs', async () => {
        await expect(generator.generateMonthlyReport(2024, 13)) // Month 13
            .rejects.toThrow();

        await expect(generator.generateMonthlyReport(1990, 1)) // Year < 2000
            .rejects.toThrow();
    });

    it('should group unknown counties under Unknown', async () => {
        mockSelect.mockResolvedValueOnce([
            { subtotal: 100, tax_amount: 6.0, total_amount: 106.0, county: null, tax_exempt: 0 }
        ]);

        const report = await generator.generateMonthlyReport(2024, 4);

        expect(report.countyBreakdown[0].county).toBe('Unknown');
        expect(report.countyBreakdown[0].grossSales).toBe(100);
    });
});
