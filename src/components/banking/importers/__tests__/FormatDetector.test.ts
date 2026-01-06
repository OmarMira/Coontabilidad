// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { detectBankFormat } from '../FormatDetector';

// Mock FileReader
// Note: In JSDOM, FileReader might be available but reading needs async handling
// This is often flaky in simple unit tests without proper polyfills.
// We will test the logic by mocking the 'readFirstChars' if we exported it, 
// or by mocking the File read process.

describe('FormatDetector', () => {
    it('should detect OFX/XML format from magic string', async () => {
        const file = new File(['OFXHEADER:200\n<OFX>...'], 'statement.ofx', { type: 'text/plain' });

        // Mocking behavior or using real file logic if env supports it
        // Assuming test env supports Blob/File
        const result = await detectBankFormat(file);

        // If FileReader is not fully implemented in the test runner, this might fail or timeout.
        // However, JSDOM 20+ usually handles it.
        // Let's assume it works or we see an error.

        expect(result.format).toBe('OFX_2_XML');
        expect(result.confidence).toBeGreaterThan(90);
    });

    it('should detect Chase CSV format', async () => {
        const content = 'Date,Description,Amount,Balance\n01/01/2023,PAYMENT,100.00,500.00';
        const file = new File([content], 'Chase.csv', { type: 'text/csv' });

        const result = await detectBankFormat(file);
        expect(result.format).toBe('CSV_CHASE');
        expect(result.suggestedParser).toBe('CSV');
    });

    it('should detect Bank of America CSV format', async () => {
        const content = 'Posted Date,Reference Number,Payee,Address,Amount\n01/01/2023,123,Uber,,25.00';
        const file = new File([content], 'stmt.csv', { type: 'text/csv' });

        const result = await detectBankFormat(file);
        expect(result.format).toBe('CSV_BOA');
    });

    it('should detect PDF Signature', async () => {
        const content = '%PDF-1.4\n...';
        const file = new File([content], 'stmt.pdf', { type: 'application/pdf' });

        const result = await detectBankFormat(file);
        expect(result.format).toBe('PDF_STATEMENT');
        expect(result.suggestedParser).toBe('PDF');
    });

    it('should return UNKNOWN for arbitrary text', async () => {
        const content = 'Hello World\nThis is not a bank statement';
        const file = new File([content], 'random.txt', { type: 'text/plain' });

        const result = await detectBankFormat(file);
        expect(result.format).toBe('UNKNOWN');
    });
});
