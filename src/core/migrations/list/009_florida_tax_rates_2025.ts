import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

/**
 * Migration 009: Florida County Tax Rates 2025-2026
 * 
 * Populates all 67 Florida counties with current discretionary sales surtax rates.
 * 
 * Tax Structure:
 * - State Rate: 6.00% (fixed, applies to all sales)
 * - County Surtax: 0.50% - 1.50% (varies by county)
 * - Total Rate: State + County Surtax
 * 
 * IMPORTANT: Surtax has a $5,000 cap per line item (Florida Statute 212.054)
 * 
 * Source: Florida Department of Revenue, effective January 1, 2025
 */
export const FloridaTaxRates2025Migration: Migration = {
    version: 9,
    name: 'Florida Tax Rates 2025-2026',
    up: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 009: Populating Florida county tax rates...');

        // All 67 Florida counties with 2025-2026 discretionary surtax rates
        const counties = [
            { name: 'Alachua', surtax: 0.0075 },
            { name: 'Baker', surtax: 0.0100 },
            { name: 'Bay', surtax: 0.0100 },
            { name: 'Bradford', surtax: 0.0100 },
            { name: 'Brevard', surtax: 0.0100 },
            { name: 'Broward', surtax: 0.0100 },
            { name: 'Calhoun', surtax: 0.0100 },
            { name: 'Charlotte', surtax: 0.0100 },
            { name: 'Citrus', surtax: 0.0100 },
            { name: 'Clay', surtax: 0.0075 },
            { name: 'Collier', surtax: 0.0100 },
            { name: 'Columbia', surtax: 0.0100 },
            { name: 'DeSoto', surtax: 0.0100 },
            { name: 'Dixie', surtax: 0.0100 },
            { name: 'Duval', surtax: 0.0075 },
            { name: 'Escambia', surtax: 0.0150 },
            { name: 'Flagler', surtax: 0.0100 },
            { name: 'Franklin', surtax: 0.0100 },
            { name: 'Gadsden', surtax: 0.0100 },
            { name: 'Gilchrist', surtax: 0.0100 },
            { name: 'Glades', surtax: 0.0100 },
            { name: 'Gulf', surtax: 0.0100 },
            { name: 'Hamilton', surtax: 0.0100 },
            { name: 'Hardee', surtax: 0.0100 },
            { name: 'Hendry', surtax: 0.0100 },
            { name: 'Hernando', surtax: 0.0050 },
            { name: 'Highlands', surtax: 0.0100 },
            { name: 'Hillsborough', surtax: 0.0100 },
            { name: 'Holmes', surtax: 0.0100 },
            { name: 'Indian River', surtax: 0.0100 },
            { name: 'Jackson', surtax: 0.0100 },
            { name: 'Jefferson', surtax: 0.0100 },
            { name: 'Lafayette', surtax: 0.0100 },
            { name: 'Lake', surtax: 0.0100 },
            { name: 'Lee', surtax: 0.0100 },
            { name: 'Leon', surtax: 0.0150 },
            { name: 'Levy', surtax: 0.0100 },
            { name: 'Liberty', surtax: 0.0100 },
            { name: 'Madison', surtax: 0.0100 },
            { name: 'Manatee', surtax: 0.0100 },
            { name: 'Marion', surtax: 0.0100 },
            { name: 'Martin', surtax: 0.0100 },
            { name: 'Miami-Dade', surtax: 0.0100 },
            { name: 'Monroe', surtax: 0.0150 },
            { name: 'Nassau', surtax: 0.0075 },
            { name: 'Okaloosa', surtax: 0.0100 },
            { name: 'Okeechobee', surtax: 0.0100 },
            { name: 'Orange', surtax: 0.0050 },
            { name: 'Osceola', surtax: 0.0100 },
            { name: 'Palm Beach', surtax: 0.0100 },
            { name: 'Pasco', surtax: 0.0100 },
            { name: 'Pinellas', surtax: 0.0100 },
            { name: 'Polk', surtax: 0.0100 },
            { name: 'Putnam', surtax: 0.0100 },
            { name: 'St. Johns', surtax: 0.0050 },
            { name: 'St. Lucie', surtax: 0.0100 },
            { name: 'Santa Rosa', surtax: 0.0100 },
            { name: 'Sarasota', surtax: 0.0100 },
            { name: 'Seminole', surtax: 0.0050 },
            { name: 'Sumter', surtax: 0.0100 },
            { name: 'Suwannee', surtax: 0.0100 },
            { name: 'Taylor', surtax: 0.0100 },
            { name: 'Union', surtax: 0.0100 },
            { name: 'Volusia', surtax: 0.0050 },
            { name: 'Wakulla', surtax: 0.0100 },
            { name: 'Walton', surtax: 0.0100 },
            { name: 'Washington', surtax: 0.0100 }
        ];

        const STATE_RATE = 0.06; // 6% Florida state sales tax

        for (const county of counties) {
            const totalRate = STATE_RATE + county.surtax;

            await db.run(`
                INSERT OR REPLACE INTO florida_tax_rates 
                (county_name, state_rate, county_rate, total_rate, effective_date, active)
                VALUES (?, ?, ?, ?, '2025-01-01', 1)
            `, [county.name, STATE_RATE, county.surtax, totalRate]);
        }

        console.log(`  ✓ Populated ${counties.length} Florida counties`);
        console.log('  ✓ State rate: 6.00%');
        console.log('  ✓ Surtax range: 0.50% - 1.50%');
        console.log('  ✓ Effective date: 2025-01-01');
        console.log('✅ Migration 009: Florida tax rates loaded');
    },

    down: async (db: SQLiteEngine) => {
        console.log('🔄 Migration 009: Removing Florida tax rates...');
        await db.exec(`DELETE FROM florida_tax_rates WHERE effective_date = '2025-01-01'`);
        console.log('✅ Migration 009: Tax rates removed');
    }
};
