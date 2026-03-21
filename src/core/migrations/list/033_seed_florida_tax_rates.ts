import { SQLiteEngine } from '../../database/SQLiteEngine';
import { Migration } from '../MigrationEngine';

export const SeedFloridaTaxRatesMigration: Migration = {
    version: 33,
    name: 'Seed Florida Tax Rates - 67 counties',
    up: async (db: SQLiteEngine) => {
        const existing = await db.select('SELECT COUNT(*) as count FROM florida_tax_rates');
        const count = existing[0]?.count as number || 0;
        if (count >= 67) {
            console.log('Migration 033: florida_tax_rates already seeded, skipping');
            return;
        }

        await db.exec(`
            INSERT OR IGNORE INTO florida_tax_rates (county_name, county_code, state_rate, county_rate, total_rate) VALUES
            ('Alachua', 'ALACHUA', 0.06, 0.005, 0.065),
            ('Baker', 'BAKER', 0.06, 0.0, 0.06),
            ('Bay', 'BAY', 0.06, 0.005, 0.065),
            ('Bradford', 'BRADFORD', 0.06, 0.0, 0.06),
            ('Brevard', 'BREVARD', 0.06, 0.005, 0.065),
            ('Broward', 'BROWARD', 0.06, 0.01, 0.07),
            ('Calhoun', 'CALHOUN', 0.06, 0.0, 0.06),
            ('Charlotte', 'CHARLOTTE', 0.06, 0.01, 0.07),
            ('Citrus', 'CITRUS', 0.06, 0.0, 0.06),
            ('Clay', 'CLAY', 0.06, 0.01, 0.07),
            ('Collier', 'COLLIER', 0.06, 0.01, 0.07),
            ('Columbia', 'COLUMBIA', 0.06, 0.005, 0.065),
            ('DeSoto', 'DESOTO', 0.06, 0.01, 0.07),
            ('Dixie', 'DIXIE', 0.06, 0.0, 0.06),
            ('Duval', 'DUVAL', 0.06, 0.015, 0.075),
            ('Escambia', 'ESCAMBIA', 0.06, 0.015, 0.075),
            ('Flagler', 'FLAGLER', 0.06, 0.01, 0.07),
            ('Franklin', 'FRANKLIN', 0.06, 0.0, 0.06),
            ('Gadsden', 'GADSDEN', 0.06, 0.0, 0.06),
            ('Gilchrist', 'GILCHRIST', 0.06, 0.0, 0.06),
            ('Glades', 'GLADES', 0.06, 0.0, 0.06),
            ('Gulf', 'GULF', 0.06, 0.0, 0.06),
            ('Hamilton', 'HAMILTON', 0.06, 0.0, 0.06),
            ('Hardee', 'HARDEE', 0.06, 0.0, 0.06),
            ('Hendry', 'HENDRY', 0.06, 0.0, 0.06),
            ('Hernando', 'HERNANDO', 0.06, 0.005, 0.065),
            ('Highlands', 'HIGHLANDS', 0.06, 0.01, 0.07),
            ('Hillsborough', 'HILLSBOROUGH', 0.06, 0.015, 0.075),
            ('Holmes', 'HOLMES', 0.06, 0.0, 0.06),
            ('Indian River', 'INDIAN-RIVER', 0.06, 0.005, 0.065),
            ('Jackson', 'JACKSON', 0.06, 0.0, 0.06),
            ('Jefferson', 'JEFFERSON', 0.06, 0.0, 0.06),
            ('Lafayette', 'LAFAYETTE', 0.06, 0.0, 0.06),
            ('Lake', 'LAKE', 0.06, 0.01, 0.07),
            ('Lee', 'LEE', 0.06, 0.01, 0.07),
            ('Leon', 'LEON', 0.06, 0.015, 0.075),
            ('Levy', 'LEVY', 0.06, 0.0, 0.06),
            ('Liberty', 'LIBERTY', 0.06, 0.0, 0.06),
            ('Madison', 'MADISON', 0.06, 0.0, 0.06),
            ('Manatee', 'MANATEE', 0.06, 0.01, 0.07),
            ('Marion', 'MARION', 0.06, 0.0, 0.06),
            ('Martin', 'MARTIN', 0.06, 0.01, 0.07),
            ('Miami-Dade', 'MIAMI-DADE', 0.06, 0.01, 0.07),
            ('Monroe', 'MONROE', 0.06, 0.015, 0.075),
            ('Nassau', 'NASSAU', 0.06, 0.0, 0.06),
            ('Okaloosa', 'OKALOOSA', 0.06, 0.005, 0.065),
            ('Okeechobee', 'OKEECHOBEE', 0.06, 0.0, 0.06),
            ('Orange', 'ORANGE', 0.06, 0.005, 0.065),
            ('Osceola', 'OSCEOLA', 0.06, 0.015, 0.075),
            ('Palm Beach', 'PALM-BEACH', 0.06, 0.01, 0.07),
            ('Pasco', 'PASCO', 0.06, 0.01, 0.07),
            ('Pinellas', 'PINELLAS', 0.06, 0.01, 0.07),
            ('Polk', 'POLK', 0.06, 0.01, 0.07),
            ('Putnam', 'PUTNAM', 0.06, 0.0, 0.06),
            ('Santa Rosa', 'SANTA-ROSA', 0.06, 0.005, 0.065),
            ('Sarasota', 'SARASOTA', 0.06, 0.01, 0.07),
            ('Seminole', 'SEMINOLE', 0.06, 0.01, 0.07),
            ('St. Johns', 'ST-JOHNS', 0.06, 0.005, 0.065),
            ('St. Lucie', 'ST-LUCIE', 0.06, 0.01, 0.07),
            ('Sumter', 'SUMTER', 0.06, 0.01, 0.07),
            ('Suwannee', 'SUWANNEE', 0.06, 0.0, 0.06),
            ('Taylor', 'TAYLOR', 0.06, 0.0, 0.06),
            ('Union', 'UNION', 0.06, 0.0, 0.06),
            ('Volusia', 'VOLUSIA', 0.06, 0.005, 0.065),
            ('Wakulla', 'WAKULLA', 0.06, 0.005, 0.065),
            ('Walton', 'WALTON', 0.06, 0.005, 0.065),
            ('Washington', 'WASHINGTON', 0.06, 0.0, 0.06)
        `);
        console.log('✅ Migration 033: 67 condados de Florida insertados');
    },
    down: async (db: SQLiteEngine) => {}
};
