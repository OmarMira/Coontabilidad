import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { FixedAssetService, FixedAsset } from './FixedAssetService';
import { AssetCategoryService } from './AssetCategoryService';
import { DepreciationCalculator, DepreciationParams } from './DepreciationCalculator';
import { DatabaseService } from '../../database/DatabaseService';

/**
 * Depreciation Entry Model
 */
export interface DepreciationEntry {
    id: number;
    asset_id: number;
    period_date: string;
    depreciation_amount: number; // in cents
    accumulated_depreciation: number; // in cents
    net_book_value: number; // in cents
    calculation_method: string;
    is_partial_month: boolean;
    journal_entry_id?: number;
    created_at: string;
}

export interface DepreciationBatchResult {
    period_date: string;
    total_assets_processed: number;
    total_depreciation_amount: number; // in cents
    entries_created: number;
    errors: Array<{ asset_id: number; error: string }>;
}

/**
 * DepreciationService
 * 
 * Handles automated depreciation calculations and journal entry creation.
 * Supports:
 * - Monthly batch processing for all active assets
 * - Manual calculation for specific assets
 * - Historical depreciation schedule generation
 */
export class DepreciationService {
    private assetService: FixedAssetService;
    private categoryService: AssetCategoryService;

    constructor(private db: SQLiteEngine) {
        this.assetService = new FixedAssetService(db);
        this.categoryService = new AssetCategoryService(db);
    }

    /**
     * Run monthly depreciation batch
     * Processes all ACTIVE assets for the specified period
     * 
     * @param periodDate First day of the month to depreciate (YYYY-MM-01)
     * @param userId User ID for journal entries
     */
    async runMonthlyDepreciationBatch(
        periodDate: Date,
        userId: number = 1
    ): Promise<DepreciationBatchResult> {
        const periodDateStr = this.formatPeriodDate(periodDate);

        // Get all active assets
        const activeAssets = await this.assetService.getActiveAssets();

        const result: DepreciationBatchResult = {
            period_date: periodDateStr,
            total_assets_processed: 0,
            total_depreciation_amount: 0,
            entries_created: 0,
            errors: []
        };

        // Process each asset
        for (const asset of activeAssets) {
            try {
                // Skip if start_depreciation_date is after period_date
                if (asset.start_depreciation_date &&
                    new Date(asset.start_depreciation_date) > periodDate) {
                    continue;
                }

                // Check if already has entry for this period
                const existing = await this.getDepreciationForPeriod(asset.id, periodDateStr);
                if (existing) {
                    continue; // Skip already processed
                }

                const entry = await this.calculateDepreciationForAsset(asset.id, periodDate, userId);

                if (entry) {
                    result.total_assets_processed++;
                    result.total_depreciation_amount += entry.depreciation_amount;
                    result.entries_created++;
                }
            } catch (error: any) {
                result.errors.push({
                    asset_id: asset.id,
                    error: error.message || 'Unknown error'
                });
            }
        }

        return result;
    }

    /**
     * Calculate depreciation for a specific asset in a specific period
     */
    async calculateDepreciationForAsset(
        assetId: number,
        periodDate: Date,
        userId: number = 1
    ): Promise<DepreciationEntry | null> {
        const asset = await this.assetService.getAssetById(assetId);
        if (!asset) {
            throw new Error(`Asset ${assetId} not found`);
        }

        if (asset.status !== 'ACTIVE') {
            throw new Error(`Asset ${assetId} is not active (status: ${asset.status})`);
        }

        // Check if already fully depreciated
        if (asset.net_book_value !== undefined &&
            asset.net_book_value <= asset.salvage_value) {
            return null; // No more depreciation needed
        }

        // Determine if this is the first month (partial month check)
        const purchaseDate = new Date(asset.purchase_date);
        const startDate = asset.start_depreciation_date
            ? new Date(asset.start_depreciation_date)
            : periodDate;

        const isPartialMonth = DepreciationCalculator.isFirstMonthPartial(purchaseDate, periodDate);

        // Prepare depreciation parameters
        const params: DepreciationParams = {
            cost: asset.purchase_cost,
            salvageValue: asset.salvage_value,
            usefulLifeMonths: asset.useful_life_months,
            currentBookValue: asset.net_book_value || asset.purchase_cost,
            isPartialMonth
        };

        // Calculate depreciation
        const result = DepreciationCalculator.calculate(asset.depreciation_method, params);
        const depreciationAmount = result.depreciationAmount;

        // Calculate new accumulated depreciation
        const newAccumulated = asset.total_accumulated_depreciation + depreciationAmount;
        const newBookValue = asset.purchase_cost - newAccumulated;

        // Create journal entry
        const category = await this.categoryService.getCategoryById(asset.category_id);
        if (!category) {
            throw new Error(`Category ${asset.category_id} not found`);
        }

        const journalEntryId = await this.createDepreciationJournalEntry(
            asset,
            periodDate,
            depreciationAmount,
            category.gl_expense_account,
            category.gl_accumulated_dep_account,
            userId
        );

        // Insert depreciation entry
        const entryResult = await this.db.run(
            `INSERT INTO asset_depreciation 
            (asset_id, period_date, depreciation_amount, accumulated_depreciation, 
             net_book_value, calculation_method, is_partial_month, journal_entry_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                asset.id,
                this.formatPeriodDate(periodDate),
                depreciationAmount,
                newAccumulated,
                newBookValue,
                asset.depreciation_method,
                isPartialMonth ? 1 : 0,
                journalEntryId
            ]
        );

        // Update asset's accumulated depreciation and net book value
        await this.assetService.updateDepreciationTotals(asset.id, newAccumulated);

        // Get the last inserted ID and fetch the entry
        const idResult = await this.db.select('SELECT last_insert_rowid() as id');
        return await this.getDepreciationById(idResult[0].id as number);
    }

    /**
     * Get depreciation history for an asset
     */
    async getDepreciationHistory(assetId: number): Promise<DepreciationEntry[]> {
        return (await this.db.select(
            `SELECT * FROM asset_depreciation 
            WHERE asset_id = ? 
            ORDER BY period_date ASC`,
            [assetId]
        )) as any;
    }

    /**
     * Get depreciation for a specific period
     */
    async getDepreciationForPeriod(
        assetId: number,
        periodDate: string
    ): Promise<DepreciationEntry | null> {
        const entries = await this.db.select(
            'SELECT * FROM asset_depreciation WHERE asset_id = ? AND period_date = ?',
            [assetId, periodDate]
        );
        return entries.length > 0 ? (entries[0] as DepreciationEntry) : null;
    }

    /**
     * Get depreciation entry by ID
     */
    async getDepreciationById(id: number): Promise<DepreciationEntry | null> {
        const entries = await this.db.select(
            'SELECT * FROM asset_depreciation WHERE id = ?',
            [id]
        );
        return entries.length > 0 ? (entries[0] as DepreciationEntry) : null;
    }

    /**
     * Generate future depreciation schedule for an asset
     * Useful for budgeting and forecasting
     */
    async generateDepreciationSchedule(assetId: number): Promise<Array<{
        period: string;
        depreciation: number;
        accumulated: number;
        book_value: number;
    }>> {
        const asset = await this.assetService.getAssetById(assetId);
        if (!asset) {
            throw new Error(`Asset ${assetId} not found`);
        }

        const startDate = asset.start_depreciation_date
            ? new Date(asset.start_depreciation_date)
            : new Date(asset.purchase_date);

        // Use DepreciationCalculator to project schedule
        const schedule = DepreciationCalculator.projectSchedule(
            asset.purchase_cost,
            asset.salvage_value,
            asset.useful_life_months,
            asset.depreciation_method,
            startDate
        );

        // Format for output
        return schedule.map(entry => ({
            period: entry.period.toISOString().substr(0, 10),
            depreciation: entry.depreciation,
            accumulated: entry.accumulated,
            book_value: entry.bookValue
        }));
    }

    /**
     * Get depreciation summary for a period
     */
    async getDepreciationSummary(periodDate: string) {
        const result = await this.db.select(`
            SELECT 
                COUNT(*) as total_entries,
                SUM(depreciation_amount) as total_depreciation,
                AVG(depreciation_amount) as avg_depreciation
            FROM asset_depreciation
            WHERE period_date = ?
        `, [periodDate]);

        return result[0];
    }

    /**
     * Create depreciation journal entry
     * DR: Depreciation Expense (5400)
     * CR: Accumulated Depreciation (1650)
     */
    private async createDepreciationJournalEntry(
        asset: FixedAsset,
        periodDate: Date,
        depreciationAmountCents: number,
        expenseAccount: number,
        accumulatedDepAccount: number,
        userId: number
    ): Promise<number> {
        const depreciationDollars = depreciationAmountCents / 100;
        const periodStr = periodDate.toISOString().substr(0, 7); // YYYY-MM

        const entryNumber = await DatabaseService.insertJournalEntry({
            description: `Depreciation ${periodStr} - ${asset.asset_tag} - ${asset.asset_name}`,
            date: this.formatPeriodDate(periodDate),
            items: [
                {
                    account_code: expenseAccount.toString(),
                    debit: depreciationDollars,
                    credit: 0,
                    description: `${asset.asset_tag} - Expense`
                },
                {
                    account_code: accumulatedDepAccount.toString(),
                    debit: 0,
                    credit: depreciationDollars,
                    description: `${asset.asset_tag} - Accumulated`
                }
            ],
            userId
        });

        // Get journal entry ID
        const entries = await this.db.select(
            'SELECT id FROM journal_entries WHERE entry_number = ?',
            [entryNumber]
        );

        return entries[0].id as number;
    }

    /**
     * Format period date as YYYY-MM-01
     */
    private formatPeriodDate(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}-01`;
    }
}
