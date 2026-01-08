import { DatabaseService } from '../database/DatabaseService';

export class AssetDepreciationService {

    // MACRS GDS percentages (Half-Year Convention) for common lives
    // Source: IRS Pub 946 Table A-1
    private static MACRS_RATES: Record<number, number[]> = {
        3: [0.3333, 0.4445, 0.1481, 0.0741],
        5: [0.2000, 0.3200, 0.1920, 0.1152, 0.1152, 0.0576],
        7: [0.1429, 0.2449, 0.1749, 0.1249, 0.0893, 0.0892, 0.0893, 0.0446],
        10: [0.1000, 0.1800, 0.1440, 0.1152, 0.0922, 0.0737, 0.0655, 0.0655, 0.0656, 0.0655, 0.0328],
        15: [0.0500, 0.0950, 0.0855, 0.0770, 0.0693, 0.0623, 0.0590, 0.0590, 0.0591, 0.0590, 0.0591, 0.0590, 0.0591, 0.0590, 0.0591, 0.0295]
    };

    /**
     * Calculates Federal MACRS Depreciation for a specific year of the asset's life.
     * @param costInCents Basis (Acquisition cost)
     * @param lifeYears Recovery Period (3, 5, 7, 10, 15)
     * @param yearOfLife 1-based year index (1 = first year)
     */
    static calculateMACRSDepreciation(costInCents: number, lifeYears: number, yearOfLife: number): number {
        const rates = this.MACRS_RATES[lifeYears];
        if (!rates) {
            console.warn(`MACRS Tables for ${lifeYears} years not implemented. Returning 0.`);
            return 0;
        }

        if (yearOfLife < 1 || yearOfLife > rates.length) return 0;

        const rate = rates[yearOfLife - 1];
        return Math.round(costInCents * rate);
    }

    /**
     * Calculates Florida specific add-back (1/7 Rule specified in prompt).
     * Note: This strictly follows the "1/7 of federal" prompt instruction.
     */
    static calculateFloridaAddback(federalDepreciationInCents: number): number {
        return Math.round(federalDepreciationInCents / 7);
    }

    /**
     * Books the depreciation journal entry for an asset in a fiscal year.
     * Generates a Journal Entry in DB and records the depreciation record.
     */
    static async bookDepreciationEntry(assetId: number, fiscalYear: number, userId: number = 1): Promise<string> {
        // 1. Get Asset
        const assets = await DatabaseService.executeQuery("SELECT * FROM fixed_assets WHERE id = ?", [assetId]);
        if (assets.length === 0) throw new Error("Asset not found");
        const asset = assets[0];

        // 2. Determine Year of Life
        const acqYear = new Date(asset.acquisition_date).getFullYear();
        const yearOfLife = fiscalYear - acqYear + 1;

        // Year 1 is the acquisition year.
        if (yearOfLife < 1) throw new Error(`Fiscal year ${fiscalYear} is before acquisition ${acqYear}`);

        // 3. Calculate
        const fedDep = this.calculateMACRSDepreciation(asset.acquisition_cost, asset.useful_life_years, yearOfLife);

        // If fully depreciated or 0
        if (fedDep <= 0) {
            return "NO_DEPRECIATION_NEEDED";
        }

        const flAddback = this.calculateFloridaAddback(fedDep);
        const netFl = fedDep - flAddback; // Not used in JE, but stored for CIT report

        // 4. Create Journal Entry
        // DEBIT: Depreciation Expense (6000)
        // CREDIT: Accumulated Depreciation (1700)
        // Note: Using standard codes. Ensure they exist or are placeholders.

        const jeNumber = await DatabaseService.insertJournalEntry({
            description: `Depreciation ${fiscalYear} - ${asset.asset_number} - ${asset.description}`,
            date: `${fiscalYear}-12-31`, // End of year entry
            items: [
                { account_code: '6000', debit: fedDep / 100, credit: 0 },
                { account_code: '1700', debit: 0, credit: fedDep / 100 }
            ],
            userId
        });

        // 5. Record in asset_depreciation table
        // We need row ID of JE. DatabaseService.insertJournalEntry returns entryNumber (string).
        // We subquery to get ID.

        await DatabaseService.dbInstance.run(`
            INSERT INTO asset_depreciation 
            (asset_id, fiscal_year, federal_depreciation, florida_addback, net_florida_depreciation, journal_entry_id)
            VALUES (?, ?, ?, ?, ?, (SELECT id FROM journal_entries WHERE entry_number = ?))
        `, [asset.id, fiscalYear, fedDep, flAddback, netFl, jeNumber]);

        return jeNumber;
    }
}
