/**
 * Fixed Assets Module Exports
 * 
 * Provides a unified export point for all fixed assets functionality.
 * 
 * Quick Start:
 * ```ts
 * import { getFixedAssetsController } from './services/accounting/fixed-assets';
 * 
 * const controller = getFixedAssetsController(db);
 * const assets = await controller.getAllAssets();
 * ```
 */

// Services
export { AssetCategoryService } from './AssetCategoryService';
export { FixedAssetService } from './FixedAssetService';
export { DepreciationService } from './DepreciationService';
export { AssetDisposalService } from './AssetDisposalService';
export { DepreciationCalculator } from './DepreciationCalculator';

// Controller (Recommended entry point)
export { FixedAssetsController, getFixedAssetsController } from '../../controllers/FixedAssetsController';

// Types
export type { AssetCategory, AssetCategoryCreateData } from './AssetCategoryService';
export type { FixedAsset, AssetPurchaseData, AssetFilters } from './FixedAssetService';
export type { DepreciationEntry, DepreciationBatchResult } from './DepreciationService';
export type { AssetDisposal, DisposalData } from './AssetDisposalService';
export type { DepreciationParams, DepreciationResult } from './DepreciationCalculator';
