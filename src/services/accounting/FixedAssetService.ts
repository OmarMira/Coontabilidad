import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { AssetCategoryService, AssetCategory } from './AssetCategoryService';
import { DatabaseService } from '../../database/DatabaseService';

/**
 * Fixed Asset Model
 */
export interface FixedAsset {
    id: number;
    asset_tag: string;
    asset_name: string;
    description?: string;
    category_id: number;
    purchase_date: string;
    purchase_cost: number; // in cents
    salvage_value: number; // in cents
    vendor_id?: number;
    useful_life_months: number;
    depreciation_method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE_200';
    start_depreciation_date?: string;
    status: 'PENDING' | 'ACTIVE' | 'FULLY_DEPRECIATED' | 'DISPOSED';
    disposal_date?: string;
    disposal_method?: 'SALE' | 'RETIREMENT' | 'TRADE_IN' | 'LOST';
    disposal_amount?: number; // in cents
    total_accumulated_depreciation: number; // in cents
    net_book_value?: number; // in cents
    purchase_entry_id?: number;
    disposal_entry_id?: number;
    created_at: string;
    updated_at: string;
}

export interface AssetPurchaseData {
    asset_name: string;
    description?: string;
    category_id: number;
    purchase_date: string; // ISO date
    purchase_cost: number; // in cents
    salvage_value?: number; // in cents
    vendor_id?: number;
    useful_life_months?: number; // Override category default
    depreciation_method?: 'STRAIGHT_LINE' | 'DECLINING_BALANCE_200'; // Override
    activate_immediately?: boolean;
    payment_method: 'CASH' | 'PAYABLE'; // For journal entry
}

export interface AssetFilters {
    status?: 'PENDING' | 'ACTIVE' | 'FULLY_DEPRECIATED' | 'DISPOSED';
    category_id?: number;
    purchase_date_from?: string;
    purchase_date_to?: string;
    search?: string;
}

/**
 * FixedAssetService
 * 
 * Manages the complete lifecycle of fixed assets:
 * - Purchase/acquisition
 * - Activation and depreciation start
 * - Status tracking
 * - Disposal
 */
export class FixedAssetService {
    private categoryService: AssetCategoryService;

    constructor(private db: SQLiteEngine) {
        this.categoryService = new AssetCategoryService(db);
    }

    /**
     * Purchase a new fixed asset
     * Creates the asset record and optionally creates the purchase journal entry
     */
    async purchaseAsset(data: AssetPurchaseData, userId: number = 1): Promise<number> {
        // Validate category exists
        const category = await this.categoryService.getCategoryById(data.category_id);
        if (!category) {
            throw new Error(`Category ID ${data.category_id} not found`);
        }

        // Use category defaults if not overridden
        const usefulLifeMonths = data.useful_life_months || category.default_useful_life_months;
        const depreciationMethod = data.depreciation_method || category.default_depreciation_method;
        const salvageValue = data.salvage_value ||
            Math.round(data.purchase_cost * (category.default_salvage_value_percent / 100));

        // Validate purchase cost
        if (data.purchase_cost <= 0) {
            throw new Error('Purchase cost must be greater than zero');
        }

        if (salvageValue >= data.purchase_cost) {
            throw new Error('Salvage value cannot be >= purchase cost');
        }

        // Generate asset tag
        const assetTag = await this.generateAssetTag(category.code);

        // Create purchase journal entry
        let purchaseEntryId: number | undefined;
        if (data.payment_method) {
            purchaseEntryId = await this.createPurchaseJournalEntry(
                data.asset_name,
                data.purchase_cost,
                data.purchase_date,
                category,
                data.payment_method,
                userId
            );
        }

        // Calculate initial net book value
        const netBookValue = data.purchase_cost;

        // Insert asset
        const result = await this.db.run(
            `INSERT INTO fixed_assets 
            (asset_tag, asset_name, description, category_id, purchase_date, purchase_cost, 
             salvage_value, vendor_id, useful_life_months, depreciation_method, 
             net_book_value, purchase_entry_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                assetTag,
                data.asset_name,
                data.description,
                data.category_id,
                data.purchase_date,
                data.purchase_cost,
                salvageValue,
                data.vendor_id,
                usefulLifeMonths,
                depreciationMethod,
                netBookValue,
                purchaseEntryId,
                'PENDING'
            ]
        );

        // Get the last inserted ID
        const idResult = await this.db.select('SELECT last_insert_rowid() as id');
        const assetId = idResult[0].id as number;

        // Activate immediately if requested
        if (data.activate_immediately) {
            await this.activateAsset(assetId);
        }

        return assetId;
    }

    /**
     * Activate an asset to begin depreciation
     */
    async activateAsset(assetId: number): Promise<void> {
        const asset = await this.getAssetById(assetId);
        if (!asset) {
            throw new Error(`Asset ID ${assetId} not found`);
        }

        if (asset.status !== 'PENDING') {
            throw new Error(`Asset must be in PENDING status to activate (current: ${asset.status})`);
        }

        // Set start_depreciation_date to first day of next month after purchase
        const purchaseDate = new Date(asset.purchase_date);
        const startDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + 1, 1);

        await this.db.run(
            `UPDATE fixed_assets 
            SET status = 'ACTIVE', start_depreciation_date = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [startDate.toISOString().split('T')[0], assetId]
        );
    }

    /**
     * Get asset by ID
     */
    async getAssetById(assetId: number): Promise<FixedAsset | null> {
        const assets = await this.db.select(
            'SELECT * FROM fixed_assets WHERE id = ?',
            [assetId]
        );
        return assets.length > 0 ? (assets[0] as FixedAsset) : null;
    }

    /**
     * Get all assets with optional filters
     */
    async getAllAssets(filters?: AssetFilters): Promise<FixedAsset[]> {
        let query = 'SELECT * FROM fixed_assets WHERE 1=1';
        const params: any[] = [];

        if (filters) {
            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }
            if (filters.category_id) {
                query += ' AND category_id = ?';
                params.push(filters.category_id);
            }
            if (filters.purchase_date_from) {
                query += ' AND purchase_date >= ?';
                params.push(filters.purchase_date_from);
            }
            if (filters.purchase_date_to) {
                query += ' AND purchase_date <= ?';
                params.push(filters.purchase_date_to);
            }
            if (filters.search) {
                query += ' AND (asset_name LIKE ? OR asset_tag LIKE ? OR description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }
        }

        query += ' ORDER BY created_at DESC';

        return (await this.db.select(query, params)) as any;
    }

    /**
     * Get only active assets (for depreciation batch)
     */
    async getActiveAssets(): Promise<FixedAsset[]> {
        return (await this.db.select(
            'SELECT * FROM fixed_assets WHERE status = ? ORDER BY purchase_date',
            ['ACTIVE']
        )) as any;
    }

    /**
     * Update asset details
     * Note: Cannot change depreciation_method after activation (IRS compliance)
     */
    async updateAsset(assetId: number, data: Partial<AssetPurchaseData>): Promise<void> {
        const asset = await this.getAssetById(assetId);
        if (!asset) {
            throw new Error(`Asset ID ${assetId} not found`);
        }

        // Prevent changing depreciation method if already activated
        if (asset.status !== 'PENDING' && data.depreciation_method) {
            throw new Error(
                'Cannot change depreciation method after asset activation (IRS compliance)'
            );
        }

        // Build dynamic UPDATE
        const updates: string[] = [];
        const values: any[] = [];

        if (data.asset_name !== undefined) {
            updates.push('asset_name = ?');
            values.push(data.asset_name);
        }
        if (data.description !== undefined) {
            updates.push('description = ?');
            values.push(data.description);
        }
        if (data.salvage_value !== undefined) {
            updates.push('salvage_value = ?');
            values.push(data.salvage_value);
        }
        if (data.vendor_id !== undefined) {
            updates.push('vendor_id = ?');
            values.push(data.vendor_id);
        }
        if (data.useful_life_months !== undefined && asset.status === 'PENDING') {
            updates.push('useful_life_months = ?');
            values.push(data.useful_life_months);
        }
        if (data.depreciation_method !== undefined && asset.status === 'PENDING') {
            updates.push('depreciation_method = ?');
            values.push(data.depreciation_method);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(assetId);

        if (updates.length > 1) {
            await this.db.run(
                `UPDATE fixed_assets SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }
    }

    /**
     * Update accumulated depreciation and net book value
     * Called by DepreciationService after each period
     */
    async updateDepreciationTotals(
        assetId: number,
        accumulatedDepreciation: number
    ): Promise<void> {
        const asset = await this.getAssetById(assetId);
        if (!asset) {
            throw new Error(`Asset ID ${assetId} not found`);
        }

        const netBookValue = asset.purchase_cost - accumulatedDepreciation;

        // Check if fully depreciated
        let status = asset.status;
        if (netBookValue <= asset.salvage_value && status === 'ACTIVE') {
            status = 'FULLY_DEPRECIATED';
        }

        await this.db.run(
            `UPDATE fixed_assets 
            SET total_accumulated_depreciation = ?, net_book_value = ?, status = ?, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [accumulatedDepreciation, netBookValue, status, assetId]
        );
    }

    /**
     * Generate unique asset tag based on category code and year
     * Format: {CATEGORY}-{YEAR}-{SEQUENCE}
     * Example: VEH-2026-001
     */
    private async generateAssetTag(categoryCode: string): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `${categoryCode}-${year}`;

        // Find max sequence number for this prefix
        const result = await this.db.select(
            `SELECT asset_tag FROM fixed_assets 
            WHERE asset_tag LIKE ? 
            ORDER BY asset_tag DESC 
            LIMIT 1`,
            [`${prefix}-%`]
        );

        let sequence = 1;
        if (result.length > 0) {
            const lastTag = result[0].asset_tag as string;
            const lastSeq = parseInt(lastTag.split('-')[2] || '0');
            sequence = lastSeq + 1;
        }

        return `${prefix}-${sequence.toString().padStart(3, '0')}`;
    }

    /**
     * Create purchase journal entry
     * DR: Fixed Assets (1600)
     * CR: Cash (1000) or Accounts Payable (2000)
     */
    private async createPurchaseJournalEntry(
        assetName: string,
        costInCents: number,
        purchaseDate: string,
        category: AssetCategory,
        paymentMethod: 'CASH' | 'PAYABLE',
        userId: number
    ): Promise<number> {
        const costDollars = costInCents / 100;
        const creditAccount = paymentMethod === 'CASH' ? '1000' : '2000';

        const entryNumber = await DatabaseService.insertJournalEntry({
            description: `Purchase of fixed asset: ${assetName}`,
            date: purchaseDate,
            items: [
                {
                    account_code: category.gl_asset_account.toString(),
                    debit: costDollars,
                    credit: 0,
                    description: `${assetName} - Asset`
                },
                {
                    account_code: creditAccount,
                    debit: 0,
                    credit: costDollars,
                    description: `${assetName} - Payment`
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
     * Get asset summary statistics
     */
    async getAssetSummary(): Promise<{
        total_assets: number;
        active_assets: number;
        total_cost: number;
        total_depreciation: number;
        net_book_value: number;
    }> {
        const result = await this.db.select(`
            SELECT 
                COUNT(*) as total_assets,
                SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_assets,
                COALESCE(SUM(purchase_cost), 0) as total_cost,
                COALESCE(SUM(total_accumulated_depreciation), 0) as total_depreciation,
                COALESCE(SUM(net_book_value), 0) as net_book_value
            FROM fixed_assets
            WHERE status != 'DISPOSED'
        `);

        return result[0] as any;
    }
}
