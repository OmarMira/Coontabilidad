/**
 * Accounting Worker
 * 
 * Handles heavy accounting calculations in background:
 * - Batch depreciation calculations
 * - Complex financial computations
 * - Large dataset processing
 */

// Depreciation calculation methods
type DepreciationMethod = 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'SUM_OF_YEARS_DIGITS' | 'UNITS_OF_PRODUCTION';

interface DepreciationParams {
    cost: number;
    salvageValue: number;
    usefulLifeMonths: number;
    currentBookValue: number;
    isPartialMonth: boolean;
    daysInMonth?: number;
    totalDaysInMonth?: number;
}

interface Asset {
    id: number;
    purchase_cost: number;
    salvage_value: number;
    useful_life_months: number;
    net_book_value: number;
    depreciation_method: DepreciationMethod;
    purchase_date: string;
    start_depreciation_date?: string;
}

interface DepreciationResult {
    assetId: number;
    depreciationAmount: number;
    accumulatedDepreciation: number;
    netBookValue: number;
    isPartialMonth: boolean;
}

// Worker message handler
self.onmessage = async (event: MessageEvent) => {
    const { type, taskId, payload } = event.data;

    try {
        switch (type) {
            case 'EXECUTE_TASK':
                await handleTask(taskId, payload);
                break;

            default:
                console.warn(`Unknown message type: ${type}`);
        }
    } catch (error: any) {
        self.postMessage({
            taskId,
            type: 'ERROR',
            error: error.message || 'Unknown error in accounting worker'
        });
    }
};

async function handleTask(taskId: string, payload: any) {
    const { operation } = payload;

    let result: any;

    switch (operation) {
        case 'batch_depreciation':
            result = await calculateBatchDepreciation(payload);
            break;

        case 'single_depreciation':
            result = await calculateSingleDepreciation(payload);
            break;

        case 'depreciation_schedule':
            result = await generateDepreciationSchedule(payload);
            break;

        default:
            throw new Error(`Unknown operation: ${operation}`);
    }

    // Send result back to main thread
    self.postMessage({
        taskId,
        type: 'RESULT',
        payload: result
    });
}

/**
 * Calculate depreciation for multiple assets (batch processing)
 */
async function calculateBatchDepreciation(payload: any): Promise<any> {
    const { assets, periodDate } = payload;

    const results: DepreciationResult[] = [];
    const errors: Array<{ assetId: number; error: string }> = [];

    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];

        try {
            // Calculate depreciation for this asset
            const result = calculateAssetDepreciation(asset, new Date(periodDate));
            results.push(result);

            // Send progress update every 10 assets
            if (i % 10 === 0 || i === assets.length - 1) {
                self.postMessage({
                    type: 'PROGRESS',
                    progress: {
                        current: i + 1,
                        total: assets.length,
                        percentage: Math.round(((i + 1) / assets.length) * 100),
                        message: `Processing asset ${i + 1} of ${assets.length}...`
                    }
                });
            }
        } catch (error: any) {
            errors.push({
                assetId: asset.id,
                error: error.message || 'Unknown error'
            });
        }
    }

    return {
        results,
        errors,
        totalProcessed: results.length,
        totalErrors: errors.length
    };
}

/**
 * Calculate depreciation for a single asset
 */
async function calculateSingleDepreciation(payload: any): Promise<DepreciationResult> {
    const { asset, periodDate } = payload;
    return calculateAssetDepreciation(asset, new Date(periodDate));
}

/**
 * Generate depreciation schedule for an asset
 */
async function generateDepreciationSchedule(payload: any): Promise<any> {
    const { asset, months } = payload;

    const schedule: Array<{
        month: number;
        date: string;
        depreciation: number;
        accumulated: number;
        bookValue: number;
    }> = [];

    let currentBookValue = asset.purchase_cost;
    let accumulatedDepreciation = 0;
    const startDate = new Date(asset.purchase_date);

    for (let month = 0; month < months; month++) {
        const periodDate = new Date(startDate);
        periodDate.setMonth(periodDate.getMonth() + month);

        const isPartialMonth = month === 0 && isFirstMonthPartial(startDate, periodDate);

        const params: DepreciationParams = {
            cost: asset.purchase_cost,
            salvageValue: asset.salvage_value,
            usefulLifeMonths: asset.useful_life_months,
            currentBookValue,
            isPartialMonth
        };

        const result = calculateDepreciation(asset.depreciation_method, params);
        const depreciationAmount = result.depreciationAmount;

        accumulatedDepreciation += depreciationAmount;
        currentBookValue -= depreciationAmount;

        schedule.push({
            month: month + 1,
            date: periodDate.toISOString().split('T')[0],
            depreciation: depreciationAmount,
            accumulated: accumulatedDepreciation,
            bookValue: currentBookValue
        });

        // Stop if fully depreciated
        if (currentBookValue <= asset.salvage_value) {
            break;
        }

        // Send progress update every 12 months
        if (month % 12 === 0) {
            self.postMessage({
                type: 'PROGRESS',
                progress: {
                    current: month + 1,
                    total: months,
                    percentage: Math.round(((month + 1) / months) * 100),
                    message: `Generating schedule: month ${month + 1}...`
                }
            });
        }
    }

    return { schedule };
}

/**
 * Core depreciation calculation for a single asset
 */
function calculateAssetDepreciation(asset: Asset, periodDate: Date): DepreciationResult {
    const purchaseDate = new Date(asset.purchase_date);
    const isPartialMonth = isFirstMonthPartial(purchaseDate, periodDate);

    const params: DepreciationParams = {
        cost: asset.purchase_cost,
        salvageValue: asset.salvage_value,
        usefulLifeMonths: asset.useful_life_months,
        currentBookValue: asset.net_book_value || asset.purchase_cost,
        isPartialMonth
    };

    const result = calculateDepreciation(asset.depreciation_method, params);
    const depreciationAmount = result.depreciationAmount;

    // Calculate accumulated depreciation
    const previousAccumulated = asset.purchase_cost - (asset.net_book_value || asset.purchase_cost);
    const newAccumulated = previousAccumulated + depreciationAmount;
    const newBookValue = asset.purchase_cost - newAccumulated;

    return {
        assetId: asset.id,
        depreciationAmount,
        accumulatedDepreciation: newAccumulated,
        netBookValue: Math.max(newBookValue, asset.salvage_value),
        isPartialMonth
    };
}

/**
 * Calculate depreciation based on method
 */
function calculateDepreciation(method: DepreciationMethod, params: DepreciationParams): { depreciationAmount: number } {
    switch (method) {
        case 'STRAIGHT_LINE':
            return calculateStraightLine(params);
        
        case 'DECLINING_BALANCE':
            return calculateDecliningBalance(params);
        
        case 'SUM_OF_YEARS_DIGITS':
            return calculateSumOfYearsDigits(params);
        
        default:
            return calculateStraightLine(params); // Default to straight line
    }
}

/**
 * Straight Line Depreciation
 */
function calculateStraightLine(params: DepreciationParams): { depreciationAmount: number } {
    const depreciableAmount = params.cost - params.salvageValue;
    let monthlyDepreciation = depreciableAmount / params.usefulLifeMonths;

    // Adjust for partial month
    if (params.isPartialMonth && params.daysInMonth && params.totalDaysInMonth) {
        monthlyDepreciation = (monthlyDepreciation * params.daysInMonth) / params.totalDaysInMonth;
    }

    // Don't depreciate below salvage value
    const maxDepreciation = params.currentBookValue - params.salvageValue;
    const depreciationAmount = Math.min(monthlyDepreciation, maxDepreciation);

    return { depreciationAmount: Math.max(0, Math.round(depreciationAmount)) };
}

/**
 * Declining Balance Depreciation (200% / Double Declining)
 */
function calculateDecliningBalance(params: DepreciationParams): { depreciationAmount: number } {
    const rate = 2.0 / params.usefulLifeMonths; // 200% declining balance
    let monthlyDepreciation = params.currentBookValue * rate;

    // Adjust for partial month
    if (params.isPartialMonth && params.daysInMonth && params.totalDaysInMonth) {
        monthlyDepreciation = (monthlyDepreciation * params.daysInMonth) / params.totalDaysInMonth;
    }

    // Don't depreciate below salvage value
    const maxDepreciation = params.currentBookValue - params.salvageValue;
    const depreciationAmount = Math.min(monthlyDepreciation, maxDepreciation);

    return { depreciationAmount: Math.max(0, Math.round(depreciationAmount)) };
}

/**
 * Sum of Years Digits Depreciation
 */
function calculateSumOfYearsDigits(params: DepreciationParams): { depreciationAmount: number } {
    const depreciableAmount = params.cost - params.salvageValue;
    const sumOfYears = (params.usefulLifeMonths * (params.usefulLifeMonths + 1)) / 2;
    
    // Calculate which month we're in
    const depreciatedAmount = params.cost - params.currentBookValue;
    const monthsDepreciated = Math.round((depreciatedAmount / depreciableAmount) * params.usefulLifeMonths);
    const remainingMonths = params.usefulLifeMonths - monthsDepreciated;
    
    let monthlyDepreciation = (depreciableAmount * remainingMonths) / sumOfYears;

    // Adjust for partial month
    if (params.isPartialMonth && params.daysInMonth && params.totalDaysInMonth) {
        monthlyDepreciation = (monthlyDepreciation * params.daysInMonth) / params.totalDaysInMonth;
    }

    // Don't depreciate below salvage value
    const maxDepreciation = params.currentBookValue - params.salvageValue;
    const depreciationAmount = Math.min(monthlyDepreciation, maxDepreciation);

    return { depreciationAmount: Math.max(0, Math.round(depreciationAmount)) };
}

/**
 * Check if first month is partial
 */
function isFirstMonthPartial(purchaseDate: Date, periodDate: Date): boolean {
    const purchaseDay = purchaseDate.getDate();
    const periodMonth = periodDate.getMonth();
    const periodYear = periodDate.getFullYear();
    const purchaseMonth = purchaseDate.getMonth();
    const purchaseYear = purchaseDate.getFullYear();

    // Same month and year, and not purchased on the 1st
    return (
        purchaseMonth === periodMonth &&
        purchaseYear === periodYear &&
        purchaseDay > 1
    );
}

// Handle errors gracefully
self.onerror = (error: ErrorEvent) => {
    console.error('Accounting worker error:', error);
    self.postMessage({
        type: 'ERROR',
        error: error.message || 'Unknown worker error'
    });
};
