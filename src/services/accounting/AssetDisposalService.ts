import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { FixedAssetService, FixedAsset } from './FixedAssetService';
import { AssetCategoryService } from './AssetCategoryService';
import { DepreciationService } from './DepreciationService';
import { DatabaseService } from '../../database/DatabaseService';

/**
 * Asset Disposal Model
 */
export interface AssetDisposal {
    id: number;
    asset_id: number;
    disposal_date: string;
    disposal_method: 'SALE' | 'RETIREMENT' | 'TRADE_IN' | 'LOST';
    original_cost: number; // in cents
    accumulated_depreciation: number; // in cents
    net_book_value: number; // in cents
    disposal_proceeds: number; // in cents
    gain_loss: number; // in cents
    journal_entry_id?: number;
    notes?: string;
    created_at: string;
}

export interface DisposalData {
    disposal_date: string; // ISO date
    disposal_method: 'SALE' | 'RETIREMENT' | 'TRADE_IN' | 'LOST';
    disposal_proceeds: number; // in cents (amount received, 0 for retirement/lost)
    notes?: string;
}

/**
 * AssetDisposalService
 * 
 * Handles asset disposal workflow:
 * - Calculate final depreciation up to disposal date
 * - Calculate gain/loss on disposal
 * - Create disposal journal entry
 * - Update asset status to DISPOSED
 */
export class AssetDisposalService {
    private assetService: FixedAssetService;
    private categoryService: AssetCategoryService;
    private depreciationService: DepreciationService;

    constructor(private db: SQLiteEngine) {
        this.assetService = new FixedAssetService(db);
        this.categoryService = new AssetCategoryService(db);
        this.depreciationService = new DepreciationService(db);
    }

    /**
     * Dispose of an asset (sale, retirement, trade-in, or loss)
     * 
     * Workflow:
     * 1. Calculate final depreciation up to disposal date
     * 2. Calculate gain/loss (proceeds - net book value)
     * 3. Create 4-line disposal journal entry
     * 4. Update asset status to DISPOSED
     * 5. Record disposal details
     */
    async disposeAsset(
        assetId: number,
        disposalData: DisposalData,
        userId: number = 1
    ): Promise<number> {
        const asset = await this.assetService.getAssetById(assetId);
        if (!asset) {
            throw new Error(`Asset ${assetId} not found`);
        }

        if (asset.status === 'DISPOSED') {
            throw new Error('Asset is already disposed');
        }

        if (asset.status === 'PENDING') {
            throw new Error('Asset must be activated before disposal');
        }

        // Validate disposal date
        const disposalDate = new Date(disposalData.disposal_date);
        const purchaseDate = new Date(asset.purchase_date);

        if (disposalDate < purchaseDate) {
            throw new Error('Disposal date cannot be before purchase date');
        }

        // 1. Calculate final depreciation up to disposal date
        const finalDepreciation = await this.calculateFinalDepreciation(asset, disposalDate, userId);

        // Refresh asset data after depreciation
        const updatedAsset = await this.assetService.getAssetById(assetId);
        if (!updatedAsset) {
            throw new Error('Failed to refresh asset data');
        }

        // 2. Calculate gain/loss
        const netBookValue = updatedAsset.net_book_value || (updatedAsset.purchase_cost - updatedAsset.total_accumulated_depreciation);
        const gainLoss = disposalData.disposal_proceeds - netBookValue;

        // 3. Create disposal journal entry
        const category = await this.categoryService.getCategoryById(updatedAsset.category_id);
        if (!category) {
            throw new Error(`Category ${updatedAsset.category_id} not found`);
        }

        const journalEntryId = await this.createDisposalJournalEntry(
            updatedAsset,
            disposalData,
            netBookValue,
            gainLoss,
            category.gl_asset_account,
            category.gl_accumulated_dep_account,
            userId
        );

        // 4. Record disposal
        const disposalResult = await this.db.run(
            `INSERT INTO asset_disposals 
            (asset_id, disposal_date, disposal_method, original_cost, accumulated_depreciation, 
             net_book_value, disposal_proceeds, gain_loss, journal_entry_id, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                assetId,
                disposalData.disposal_date,
                disposalData.disposal_method,
                updatedAsset.purchase_cost,
                updatedAsset.total_accumulated_depreciation,
                netBookValue,
                disposalData.disposal_proceeds,
                gainLoss,
                journalEntryId,
                disposalData.notes
            ]
        );

        // Get the last inserted ID
        const idResult = await this.db.select('SELECT last_insert_rowid() as id');
        const disposalId = idResult[0].id as number;

        // 5. Update asset status
        await this.db.run(
            `UPDATE fixed_assets 
            SET status = 'DISPOSED', 
                disposal_date = ?, 
                disposal_method = ?, 
                disposal_amount = ?, 
                disposal_entry_id = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                disposalData.disposal_date,
                disposalData.disposal_method,
                disposalData.disposal_proceeds,
                journalEntryId,
                assetId
            ]
        );

        return disposalId;
    }

    /**
     * Get disposal by ID
     */
    async getDisposalById(id: number): Promise<AssetDisposal | null> {
        const disposals = await this.db.select(
            'SELECT * FROM asset_disposals WHERE id = ?',
            [id]
        );
        return disposals.length > 0 ? (disposals[0] as AssetDisposal) : null;
    }

    /**
     * Get disposal for an asset
     */
    async getDisposalForAsset(assetId: number): Promise<AssetDisposal | null> {
        const disposals = await this.db.select(
            'SELECT * FROM asset_disposals WHERE asset_id = ?',
            [assetId]
        );
        return disposals.length > 0 ? (disposals[0] as AssetDisposal) : null;
    }

    /**
     * Get all disposals with optional date range filter
     */
    async getAllDisposals(
        startDate?: string,
        endDate?: string
    ): Promise<AssetDisposal[]> {
        let query = 'SELECT * FROM asset_disposals WHERE 1=1';
        const params: any[] = [];

        if (startDate) {
            query += ' AND disposal_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND disposal_date <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY disposal_date DESC';

        return (await this.db.select(query, params)) as any;
    }

    /**
     * Get disposal summary for a period
     */
    async getDisposalSummary(year?: number) {
        let query = `
            SELECT 
                COUNT(*) as total_disposals,
                SUM(disposal_proceeds) as total_proceeds,
                SUM(gain_loss) as total_gain_loss,
                SUM(CASE WHEN gain_loss > 0 THEN gain_loss ELSE 0 END) as total_gains,
                SUM(CASE WHEN gain_loss < 0 THEN gain_loss ELSE 0 END) as total_losses
            FROM asset_disposals
        `;

        const params: any[] = [];

        if (year) {
            query += ` WHERE strftime('%Y', disposal_date) = ?`;
            params.push(year.toString());
        }

        const result = await this.db.select(query, params);
        return result[0];
    }

    /**
     * Calculate final depreciation up to disposal date
     * Ensures asset is depreciated through the month of disposal
     */
    private async calculateFinalDepreciation(
        asset: FixedAsset,
        disposalDate: Date,
        userId: number
    ): Promise<number> {
        if (!asset.start_depreciation_date) {
            return 0; // No depreciation started
        }

        const startDate = new Date(asset.start_depreciation_date);

        // Get last depreciation entry
        const history = await this.depreciationService.getDepreciationHistory(asset.id);

        let lastDepreciationDate: Date;
        if (history.length > 0) {
            lastDepreciationDate = new Date(history[history.length - 1].period_date);
        } else {
            lastDepreciationDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
        }

        // Calculate depreciation for each month between last entry and disposal
        let periodDate = new Date(lastDepreciationDate);
        periodDate.setMonth(periodDate.getMonth() + 1);
        periodDate.setDate(1);

        const disposalMonth = disposalDate.getMonth();
        const disposalYear = disposalDate.getFullYear();

        let totalDepreciated = 0;

        while (
            periodDate.getFullYear() < disposalYear ||
            (periodDate.getFullYear() === disposalYear && periodDate.getMonth() <= disposalMonth)
        ) {
            // Check if entry already exists
            const existing = await this.depreciationService.getDepreciationForPeriod(
                asset.id,
                this.formatPeriodDate(periodDate)
            );

            if (!existing) {
                const entry = await this.depreciationService.calculateDepreciationForAsset(
                    asset.id,
                    periodDate,
                    userId
                );

                if (entry) {
                    totalDepreciated += entry.depreciation_amount;
                }
            }

            // Move to next month
            periodDate.setMonth(periodDate.getMonth() + 1);
        }

        return totalDepreciated;
    }

    /**
     * Create disposal journal entry (4-line entry)
     * 
     * For SALE:
     * DR: Cash (1000) - proceeds
     * DR: Accumulated Depreciation (1650) - accumulated
     * DR/CR: Gain/Loss (4900/5900) - difference
     * CR: Fixed Asset (1600) - original cost
     * 
     * For RETIREMENT/LOST (no proceeds):
     * DR: Accumulated Depreciation (1650)
     * DR: Loss on Disposal (5900)
     * CR: Fixed Asset (1600)
     */
    private async createDisposalJournalEntry(
        asset: FixedAsset,
        disposalData: DisposalData,
        netBookValue: number,
        gainLoss: number,
        assetAccount: number,
        accumulatedDepAccount: number,
        userId: number
    ): Promise<number> {
        const items: Array<{ account_code: string; debit: number; credit: number; description?: string }> = [];

        // Line 1: DR Cash (if proceeds exist)
        if (disposalData.disposal_proceeds > 0) {
            items.push({
                account_code: '1000',
                debit: disposalData.disposal_proceeds / 100,
                credit: 0,
                description: `${asset.asset_tag} - Proceeds`
            });
        }

        // Line 2: DR Accumulated Depreciation
        items.push({
            account_code: accumulatedDepAccount.toString(),
            debit: asset.total_accumulated_depreciation / 100,
            credit: 0,
            description: `${asset.asset_tag} - Accumulated Dep.`
        });

        // Line 3: DR/CR Gain or Loss
        if (gainLoss > 0) {
            // Gain
            items.push({
                account_code: '4900', // Gain on Sale of Assets
                debit: 0,
                credit: gainLoss / 100,
                description: `${asset.asset_tag} - Gain on Disposal`
            });
        } else if (gainLoss < 0) {
            // Loss
            items.push({
                account_code: '5900', // Loss on Sale of Assets
                debit: Math.abs(gainLoss) / 100,
                credit: 0,
                description: `${asset.asset_tag} - Loss on Disposal`
            });
        }

        // Line 4: CR Fixed Asset (original cost)
        items.push({
            account_code: assetAccount.toString(),
            debit: 0,
            credit: asset.purchase_cost / 100,
            description: `${asset.asset_tag} - Asset Retirement`
        });

        const entryNumber = await DatabaseService.insertJournalEntry({
            description: `Disposal of ${asset.asset_tag} - ${asset.asset_name} (${disposalData.disposal_method})`,
            date: disposalData.disposal_date,
            items,
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
