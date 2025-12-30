import { describe, it, expect, beforeEach } from 'vitest';
import { InvoiceComplianceValidator } from './InvoiceComplianceValidator';

describe('InvoiceComplianceValidator', () => {
    let validator: InvoiceComplianceValidator;

    beforeEach(() => {
        validator = new InvoiceComplianceValidator();
    });

    it('should validate a correct invoice', () => {
        const validInvoice = {
            invoiceNumber: 'INV-001',
            date: new Date(),
            customer: {
                name: 'John Doe',
                county: 'Miami-Dade'
            },
            items: [
                { description: 'Service A', quantity: 1, unitPrice: 100, taxable: true, lineTotal: 100 },
                { description: 'Service B', quantity: 2, unitPrice: 50, taxable: false, lineTotal: 100 }
            ],
            subtotal: 200,
            taxAmount: 7.00, // Assuming 7% on 100
            totalAmount: 207.00
        };

        const result = validator.validate(validInvoice);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
        const invalidInvoice = {
            // Missing invoiceNumber
            date: new Date(),
            customer: { name: 'John Doe', county: 'Miami-Dade' },
            items: [],
            subtotal: 0,
            taxAmount: 0,
            totalAmount: 0
        };

        const result = validator.validate(invalidInvoice);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('invoiceNumber'))).toBe(true);
    });

    it('should detect math errors in subtotal', () => {
        const mathErrorInvoice = {
            invoiceNumber: 'INV-002',
            date: new Date(),
            customer: { name: 'Jane Doe', county: 'Broward' },
            items: [
                { description: 'Item 1', quantity: 10, unitPrice: 10, taxable: true, lineTotal: 100 }
            ],
            subtotal: 50, // Should be 100
            taxAmount: 7,
            totalAmount: 57
        };

        const result = validator.validate(mathErrorInvoice);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Subtotal mismatch'))).toBe(true);
    });

    it('should detect math errors in total', () => {
        const totalErrorInvoice = {
            invoiceNumber: 'INV-003',
            date: new Date(),
            customer: { name: 'Bob Smith', county: 'Orange' },
            items: [
                { description: 'Item 1', quantity: 1, unitPrice: 100, taxable: true, lineTotal: 100 }
            ],
            subtotal: 100,
            taxAmount: 6.5,
            totalAmount: 200 // Should be 106.5
        };

        const result = validator.validate(totalErrorInvoice);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.includes('Total amount mismatch'))).toBe(true);
    });

    it('should warn about unknown counties', () => {
        const unknownCountyInvoice = {
            invoiceNumber: 'INV-004',
            date: new Date(),
            customer: { name: 'Alien', county: 'Mars Colony' },
            items: [
                { description: 'Space Rock', quantity: 1, unitPrice: 1000, taxable: true, lineTotal: 1000 }
            ],
            subtotal: 1000,
            taxAmount: 0,
            totalAmount: 1000
        };

        const result = validator.validate(unknownCountyInvoice);
        // Depending on strictness, this might be valid but with warnings, or invalid.
        // In our implementation it produces a warning but keeps isValid=true (unless math fails).
        // Here tax is 0 which might fail "taxable implies tax" logic if we implemented strict tax checking, 
        // but currently we only check taxAmount < 0. 
        expect(result.warnings.some(w => w.includes('not recognized'))).toBe(true);
    });
});
