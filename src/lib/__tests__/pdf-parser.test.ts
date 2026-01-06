// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import * as pdfParser from '../pdf-parser';
import { extractTextFromPDF } from '../pdf-extractor';

// Mock the extractor module
vi.mock('../pdf-extractor', () => ({
    extractTextFromPDF: vi.fn()
}));

describe('PDF Parser (Gold+)', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should parse and normalize a standard Chase PDF transaction line', async () => {
        vi.mocked(extractTextFromPDF).mockResolvedValue([
            '01/15/2024 UBER TRIP 12.50'
        ]);

        const file = new File(['dummy'], 'chase.pdf');
        const results = await pdfParser.parseBankPDF(file);

        expect(results).toHaveLength(1);
        expect(results[0].success).toBe(true);
        expect(results[0].data).toMatchObject({
            transaction_date: '2024-01-15',
            description: 'UBER TRIP',
            amount: 1250 // Cents!
        });
    });

    it('should handle negative amounts in parentheses (US Accounting)', async () => {
        vi.mocked(extractTextFromPDF).mockResolvedValue([
            '10/12/2023 REFUND SERVICE FEE     (50.00)'
        ]);

        const file = new File(['dummy'], 'test.pdf');
        const results = await pdfParser.parseBankPDF(file);

        expect(results).toHaveLength(1);
        expect(results[0].data?.amount).toBe(-5000); // -50.00 -> -5000 cents
        expect(results[0].data?.description).toBe('REFUND SERVICE FEE');
    });

    it('should handle European format (dots for thousands, comma for decimal)', async () => {
        vi.mocked(extractTextFromPDF).mockResolvedValue([
            '15/01/2024 PAYMENT RECEIVED 1.250,50'
        ]);

        const file = new File(['dummy'], 'euro.pdf');
        const results = await pdfParser.parseBankPDF(file);

        // 1.250,50 -> 1250.50 -> 125050 cents
        expect(results[0].data?.amount).toBe(125050);
        expect(results[0].data?.transaction_date).toBe('2024-01-15');
    });

    it('should filter noise and balance lines', async () => {
        vi.mocked(extractTextFromPDF).mockResolvedValue([
            'Page 1 of 5',
            'Ending Balance 5,340.22', // Balance keyword
            'Just some random text header',
            '01/01/2024 VALID TRANS 10.00'
        ]);

        const file = new File(['dummy'], 'test.pdf');
        const results = await pdfParser.parseBankPDF(file);

        expect(results).toHaveLength(1);
        expect(results[0].data?.description).toBe('VALID TRANS');
    });

    it('should extract correct amount when multiple numbers (Amount/Balance) are present', async () => {
        vi.mocked(extractTextFromPDF).mockResolvedValue([
            '01/15/2024 CHECK 101 100.00 4,900.00'
        ]);

        const file = new File(['dummy'], 'test.pdf');
        const results = await pdfParser.parseBankPDF(file);

        expect(results).toHaveLength(1);
        expect(results[0].data?.amount).toBe(10000);
    });

    it('should parse Spanish dates and formats (Gold+)', async () => {
        vi.mocked(extractTextFromPDF).mockResolvedValue([
            '15 Enero 2024 PAGO ALQUILER 1.500,00',
            '15 Ene 2024 SUB CRIPTOMONEDA (10.000,00)' // Negative Spanish EU
        ]);

        const file = new File(['dummy'], 'spanish.pdf');
        const results = await pdfParser.parseBankPDF(file);

        expect(results).toHaveLength(2);

        // 15 Enero 2024 -> 2024-01-15
        expect(results[0].data?.transaction_date).toBe('2024-01-15');
        // 1.500,00 -> 150000 cents
        expect(results[0].data?.amount).toBe(150000);

        // 15 Ene 2024 -> 2024-01-15
        expect(results[1].data?.transaction_date).toBe('2024-01-15');
        // (10.000,00) -> -1000000 cents
        expect(results[1].data?.amount).toBe(-1000000);
    });
});
