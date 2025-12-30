import { describe, it, expect, beforeEach } from 'vitest';
import { ExplanationEngine } from './ExplanationEngine';

describe('ExplanationEngine', () => {
    let engine: ExplanationEngine;

    beforeEach(() => {
        engine = new ExplanationEngine('en-US');
    });

    it('should explain non-taxable transactions', () => {
        const text = engine.explainTaxCalculation({
            subtotal: 100,
            county: 'Miami-Dade',
            isTaxable: false
        });
        expect(text).toContain('No tax is applied');
        expect(text).toContain('non-taxable');
    });

    it('should explain tax exempt customers', () => {
        const text = engine.explainTaxCalculation({
            subtotal: 100,
            county: 'Miami-Dade',
            isTaxable: true,
            customerTaxId: '123'
        });
        expect(text).toContain('Tax Exempt Certificate');
    });

    it('should explain standard calculation with surtax', () => {
        const text = engine.explainTaxCalculation({
            subtotal: 1000,
            county: 'Miami-Dade', // 7%
            isTaxable: true
        });

        expect(text).toContain('7.0%');
        expect(text).toContain('Miami-Dade');
        expect(text).toContain('Florida State Base Rate (6.0%)');
        expect(text).toContain('Surtax of 1.0%');
        expect(text).toContain('$70.00');
    });

    it('should explain calculation without surtax', () => {
        // Assuming a county with 6% in our map or default
        const text = engine.explainTaxCalculation({
            subtotal: 100,
            county: 'UnknownCounty', // Defaults to 6%
            isTaxable: true
        });

        expect(text).toContain('6.0%');
        expect(text).toContain('No discretionary surtax');
        expect(text).toContain('$6.00');
    });

    it('should explain DR-15 summary', () => {
        const text = engine.explainDR15Summary({
            grossSales: 1000,
            exemptSales: 200,
            taxCollected: 56
        });

        expect(text).toContain('Gross Sales were $1,000.00');
        expect(text).toContain('Exempt Sales of $200.00');
        expect(text).toContain('Taxable Amount is $800.00');
        expect(text).toContain('Tax Collected to be remitted to the DOR is $56.00');
    });
});
