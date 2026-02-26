import { SQLiteEngine } from '../core/database/SQLiteEngine';
import { AssetCategoryService } from '../services/accounting/AssetCategoryService';
import { FixedAssetService, AssetPurchaseData, AssetFilters } from '../services/accounting/FixedAssetService';
import { DepreciationService } from '../services/accounting/DepreciationService';
import { AssetDisposalService, DisposalData } from '../services/accounting/AssetDisposalService';

/**
 * FixedAssetsController
 * 
 * Facade pattern controller that provides a unified interface for all
 * fixed assets operations. This simplifies UI integration by providing
 * a single entry point for all fixed assets functionality.
 * 
 * Usage:
 * ```ts
 * const controller = new FixedAssetsController(db);
 * const assets = await controller.getAllAssets();
 * const categories = await controller.getCategories();
 * ```
 */
export class FixedAssetsController {
    private categoryService: AssetCategoryService;
    private assetService: FixedAssetService;
    private depreciationService: DepreciationService;
    private disposalService: AssetDisposalService;
    private db: SQLiteEngine;

    constructor(db: any | SQLiteEngine) {
        // Convertir a SQLiteEngine si es necesario (compatibilidad con sql.js raw)
        if (db instanceof SQLiteEngine) {
            this.db = db;
        } else {
            this.db = new SQLiteEngine();
            this.db.setDB(db);
        }

        this.categoryService = new AssetCategoryService(this.db);
        this.assetService = new FixedAssetService(this.db);
        this.depreciationService = new DepreciationService(this.db);
        this.disposalService = new AssetDisposalService(this.db);
    }

    // ==========================================
    // ASSET CATEGORIES
    // ==========================================

    async getCategories() {
        return await this.categoryService.getAllCategories();
    }

    async getActiveCategories() {
        return await this.categoryService.getActiveCategories();
    }

    async getCategoryById(id: number) {
        return await this.categoryService.getCategoryById(id);
    }

    async createCategory(data: any) {
        return await this.categoryService.createCategory(data);
    }

    async updateCategory(id: number, data: any) {
        return await this.categoryService.updateCategory(id, data);
    }

    async deactivateCategory(id: number) {
        return await this.categoryService.deactivateCategory(id);
    }

    async getCategoryStats() {
        return await this.categoryService.getCategoryStats();
    }

    // ==========================================
    // FIXED ASSETS
    // ==========================================

    async purchaseAsset(data: AssetPurchaseData, userId: number | null) {
        if (userId === null || userId === undefined) {
            throw new Error('[FixedAssetsController] userId requerido. Operación abortada.');
        }
        return await this.assetService.purchaseAsset(data, userId);
    }

    async activateAsset(assetId: number) {
        return await this.assetService.activateAsset(assetId);
    }

    async getAllAssets(filters?: AssetFilters) {
        return await this.assetService.getAllAssets(filters);
    }

    async getAssetById(assetId: number) {
        return await this.assetService.getAssetById(assetId);
    }

    async updateAsset(assetId: number, data: Partial<AssetPurchaseData>) {
        return await this.assetService.updateAsset(assetId, data);
    }

    async getAssetSummary() {
        return await this.assetService.getAssetSummary();
    }

    // ==========================================
    // DEPRECIATION
    // ==========================================

    async runDepreciationBatch(periodDate: Date, userId: number | null) {
        if (userId === null || userId === undefined) {
            throw new Error('[FixedAssetsController] userId requerido. Operación abortada.');
        }
        return await this.depreciationService.runMonthlyDepreciationBatch(periodDate, userId);
    }

    async calculateAssetDepreciation(assetId: number, periodDate: Date, userId: number | null) {
        if (userId === null || userId === undefined) {
            throw new Error('[FixedAssetsController] userId requerido. Operación abortada.');
        }
        return await this.depreciationService.calculateDepreciationForAsset(assetId, periodDate, userId);
    }

    async getDepreciationHistory(assetId: number) {
        return await this.depreciationService.getDepreciationHistory(assetId);
    }

    async getDepreciationSchedule(assetId: number) {
        return await this.depreciationService.generateDepreciationSchedule(assetId);
    }

    async getDepreciationSummary(periodDate: string) {
        return await this.depreciationService.getDepreciationSummary(periodDate);
    }

    // ==========================================
    // ASSET DISPOSAL
    // ==========================================

    async disposeAsset(assetId: number, disposalData: DisposalData, userId: number | null) {
        if (userId === null || userId === undefined) {
            throw new Error('[FixedAssetsController] userId requerido. Operación abortada.');
        }
        return await this.disposalService.disposeAsset(assetId, disposalData, userId);
    }

    async getDisposalById(id: number) {
        return await this.disposalService.getDisposalById(id);
    }

    async getDisposalForAsset(assetId: number) {
        return await this.disposalService.getDisposalForAsset(assetId);
    }

    async getAllDisposals(startDate?: string, endDate?: string) {
        return await this.disposalService.getAllDisposals(startDate, endDate);
    }

    async getDisposalSummary(year?: number) {
        return await this.disposalService.getDisposalSummary(year);
    }

    // ==========================================
    // REPORTS
    // ==========================================

    /**
     * Asset Register Report
     * Lists all non-disposed assets with current values
     */
    async getAssetRegister(categoryId?: number) {
        let query = `
            SELECT 
                fa.id,
                fa.asset_tag,
                fa.asset_name,
                fa.description,
                c.name as category_name,
                fa.purchase_date,
                fa.purchase_cost,
                fa.total_accumulated_depreciation,
                fa.net_book_value,
                fa.status,
                fa.useful_life_months,
                fa.depreciation_method
            FROM fixed_assets fa
            JOIN asset_categories c ON fa.category_id = c.id
            WHERE fa.status != 'DISPOSED'
        `;

        const params: any[] = [];

        if (categoryId) {
            query += ' AND fa.category_id = ?';
            params.push(categoryId);
        }

        query += ' ORDER BY c.name, fa.asset_tag';

        return await this.db.select(query, params);
    }

    /**
     * Monthly Depreciation Report
     * Shows all depreciation entries for a specific month
     */
    async getMonthlyDepreciationReport(periodDate: string) {
        const query = `
            SELECT 
                fa.asset_tag,
                fa.asset_name,
                c.name as category_name,
                ad.depreciation_amount,
                ad.accumulated_depreciation,
                ad.net_book_value,
                ad.is_partial_month
            FROM asset_depreciation ad
            JOIN fixed_assets fa ON ad.asset_id = fa.id
            JOIN asset_categories c ON fa.category_id = c.id
            WHERE ad.period_date = ?
            ORDER BY c.name, fa.asset_tag
        `;

        return await this.db.select(query, [periodDate]);
    }

    /**
     * YTD Disposal Report
     * Shows all disposals for year with gains/losses
     */
    async getYTDDisposalReport(year: number) {
        const query = `
            SELECT 
                fa.asset_tag,
                fa.asset_name,
                c.name as category_name,
                d.disposal_date,
                d.disposal_method,
                d.original_cost,
                d.accumulated_depreciation,
                d.net_book_value,
                d.disposal_proceeds,
                d.gain_loss
            FROM asset_disposals d
            JOIN fixed_assets fa ON d.asset_id = fa.id
            JOIN asset_categories c ON fa.category_id = c.id
            WHERE strftime('%Y', d.disposal_date) = ?
            ORDER BY d.disposal_date DESC
        `;

        return await this.db.select(query, [year.toString()]);
    }

    /**
     * Dashboard Summary
     * Key metrics for fixed assets overview
     */
    async getDashboardSummary() {
        const assetSummary = await this.assetService.getAssetSummary();
        const categoryStats = await this.categoryService.getCategoryStats();

        // Get current month depreciation
        const now = new Date();
        const currentPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
        const depSummary = await this.depreciationService.getDepreciationSummary(currentPeriod);

        // Get YTD disposal summary
        const disposalSummary = await this.disposalService.getDisposalSummary(now.getFullYear());

        return {
            assets: assetSummary,
            categories: categoryStats,
            current_month_depreciation: depSummary,
            ytd_disposals: disposalSummary
        };
    }
}

/**
 * Singleton instance for easy access across the application
 */
let fixedAssetsControllerInstance: FixedAssetsController | null = null;

export function getFixedAssetsController(db: any | SQLiteEngine): FixedAssetsController {
    // Resetear singleton si db cambió o no existe
    if (!fixedAssetsControllerInstance) {
        fixedAssetsControllerInstance = new FixedAssetsController(db);
    }
    return fixedAssetsControllerInstance;
}
