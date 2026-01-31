import { describe, it, expect, beforeAll } from '@jest/globals';
import { FloridaTaxEngine } from './FloridaTaxEngine';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

/**
 * Unit tests for FloridaTaxEngine
 * 
 * ACCEPTANCE CRITERIA:
 * - $6,000 invoice in 1% surtax county = $410 tax
 *   - State: $360 (6% of $6,000)
 *   - Surtax: $50 (1% of first $5,000)
 *   - Total: $410
 */
describe('FloridaTaxEngine', () => {
    let db: SQLiteEngine;
    let taxEngine: FloridaTaxEngine;

    beforeAll(async () => {
        // Initialize in-memory database
        db = new SQLiteEngine();
        await db.initialize(':memory:');

        // Create florida_tax_rates table
        db.exec(`
            CREATE TABLE florida_tax_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                county_name TEXT UNIQUE NOT NULL,
                state_rate DECIMAL(5,4) DEFAULT 0.06,
                county_rate DECIMAL(5,4) DEFAULT 0.0,
                total_rate DECIMAL(5,4) DEFAULT 0.06,
                effective_date DATE DEFAULT CURRENT_DATE,
                active BOOLEAN DEFAULT 1
            )
        `);

        // Insert test counties
        db.run(`
            INSERT INTO florida_tax_rates (county_name, state_rate, county_rate, total_rate, active)
            VALUES ('Baker', 0.06, 0.01, 0.07, 1)
        `, []);

        db.run(`
            INSERT INTO florida_tax_rates (county_name, state_rate, county_rate, total_rate, active)
            VALUES ('Miami-Dade', 0.06, 0.01, 0.07, 1)
        `, []);

        db.run(`
            INSERT INTO florida_tax_rates (county_name, state_rate, county_rate, total_rate, active)
            VALUES ('Escambia', 0.06, 0.015, 0.075, 1)
        `, []);

        db.run(`
            INSERT INTO florida_tax_rates (county_name, state_rate, county_rate, total_rate, active)
            VALUES ('Orange', 0.06, 0.005, 0.065, 1)
        `, []);

        taxEngine = FloridaTaxEngine.getInstance(db);
        await taxEngine.loadRates();
    });

    describe('ACCEPTANCE TEST: $6,000 Invoice with 1% Surtax', () => {
        it('should calculate $410 tax for $6,000 in Baker County', () => {
            // Arrange
            const amountCents = 600000; // $6,000.00
            const county = 'Baker'; // 1% surtax

            // Act
            const taxCents = taxEngine.calculateLineTax(amountCents, county);

            // Assert
            // State: 600000 * 0.06 = 36000 ($360.00)
            // Surtax: 500000 * 0.01 = 5000 ($50.00) [capped at $5,000]
            // Total: 41000 ($410.00)
            expect(taxCents).toBe(41000);
        });

        it('should provide correct tax breakdown for $6,000', () => {
            // Arrange
            const amountCents = 600000;
            const county = 'Baker';

            // Act
            const breakdown = taxEngine.getTaxBreakdown(amountCents, county);

            // Assert
            expect(breakdown.stateTaxCents).toBe(36000); // $360
            expect(breakdown.surtaxCents).toBe(5000); // $50 (capped)
            expect(breakdown.totalTaxCents).toBe(41000); // $410
        });
    });

    describe('$5,000 Cap Logic', () => {
        it('should apply surtax to full amount when under $5,000', () => {
            // Arrange
            const amountCents = 400000; // $4,000.00
            const county = 'Baker'; // 1% surtax

            // Act
            const taxCents = taxEngine.calculateLineTax(amountCents, county);

            // Assert
            // State: 400000 * 0.06 = 24000 ($240.00)
            // Surtax: 400000 * 0.01 = 4000 ($40.00) [under cap]
            // Total: 28000 ($280.00)
            expect(taxCents).toBe(28000);
        });

        it('should cap surtax at $5,000 for amounts over $5,000', () => {
            // Arrange
            const amountCents = 1000000; // $10,000.00
            const county = 'Baker'; // 1% surtax

            // Act
            const taxCents = taxEngine.calculateLineTax(amountCents, county);

            // Assert
            // State: 1000000 * 0.06 = 60000 ($600.00)
            // Surtax: 500000 * 0.01 = 5000 ($50.00) [capped at $5,000]
            // Total: 65000 ($650.00)
            expect(taxCents).toBe(65000);
        });

        it('should apply cap to EACH line item separately', () => {
            // Arrange
            const lineItems = [
                { amountCents: 400000 }, // $4,000
                { amountCents: 400000 }  // $4,000
            ];
            const county = 'Baker'; // 1% surtax

            // Act
            const totalTax = taxEngine.calculateInvoiceTax(lineItems, county);

            // Assert
            // Item 1: $240 (6%) + $40 (1%) = $280
            // Item 2: $240 (6%) + $40 (1%) = $280
            // Total: $560 (NOT $520 if cap was applied to invoice total)
            expect(totalTax).toBe(56000);
        });
    });

    describe('Different County Rates', () => {
        it('should calculate correctly for Miami-Dade (1% surtax)', () => {
            const taxCents = taxEngine.calculateLineTax(600000, 'Miami-Dade');
            expect(taxCents).toBe(41000); // Same as Baker
        });

        it('should calculate correctly for Escambia (1.5% surtax)', () => {
            const amountCents = 600000; // $6,000
            const taxCents = taxEngine.calculateLineTax(amountCents, 'Escambia');

            // State: 600000 * 0.06 = 36000 ($360.00)
            // Surtax: 500000 * 0.015 = 7500 ($75.00) [capped at $5,000]
            // Total: 43500 ($435.00)
            expect(taxCents).toBe(43500);
        });

        it('should calculate correctly for Orange (0.5% surtax)', () => {
            const amountCents = 600000; // $6,000
            const taxCents = taxEngine.calculateLineTax(amountCents, 'Orange');

            // State: 600000 * 0.06 = 36000 ($360.00)
            // Surtax: 500000 * 0.005 = 2500 ($25.00) [capped at $5,000]
            // Total: 38500 ($385.00)
            expect(taxCents).toBe(38500);
        });
    });

    describe('Edge Cases', () => {
        it('should return 0 tax for $0 amount', () => {
            const taxCents = taxEngine.calculateLineTax(0, 'Baker');
            expect(taxCents).toBe(0);
        });

        it('should throw error for negative amount', () => {
            expect(() => {
                taxEngine.calculateLineTax(-100, 'Baker');
            }).toThrow('Amount cannot be negative');
        });

        it('should throw error for unknown county', () => {
            expect(() => {
                taxEngine.calculateLineTax(100000, 'Unknown County');
            }).toThrow('County not found');
        });

        it('should handle exactly $5,000 amount', () => {
            const amountCents = 500000; // Exactly $5,000
            const taxCents = taxEngine.calculateLineTax(amountCents, 'Baker');

            // State: 500000 * 0.06 = 30000 ($300.00)
            // Surtax: 500000 * 0.01 = 5000 ($50.00) [exactly at cap]
            // Total: 35000 ($350.00)
            expect(taxCents).toBe(35000);
        });
    });

    describe('Rounding', () => {
        it('should round to nearest cent (Florida DOR TIP #21A01-02)', () => {
            // Test case that would produce fractional cents
            const amountCents = 333; // $3.33
            const taxCents = taxEngine.calculateLineTax(amountCents, 'Baker');

            // State: 333 * 0.06 = 19.98 → 20
            // Surtax: 333 * 0.01 = 3.33 → 3
            // Total: 23
            expect(taxCents).toBe(23);
        });
    });

    describe('County Validation', () => {
        it('should validate that Baker is a valid county', () => {
            expect(taxEngine.isValidCounty('Baker')).toBe(true);
        });

        it('should return false for invalid county', () => {
            expect(taxEngine.isValidCounty('Invalid')).toBe(false);
        });
    });

    describe('Get All Counties', () => {
        it('should return all active counties', () => {
            const counties = taxEngine.getAllCounties();
            expect(counties.length).toBeGreaterThan(0);
            expect(counties.some((c: any) => c.name === 'Baker')).toBe(true);
            expect(counties.some((c: any) => c.name === 'Miami-Dade')).toBe(true);
        });
    });
});
