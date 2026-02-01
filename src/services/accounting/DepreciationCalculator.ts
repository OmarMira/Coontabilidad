/**
 * DepreciationCalculator
 * 
 * Pure calculation utility for fixed asset depreciation.
 * Implements US GAAP standard methods with IRS Half-Month Convention.
 * 
 * Methods:
 * - Straight-Line: (cost - salvage) / useful_life_months
 * - Declining Balance 200%: book_value * (2 / useful_life_months)
 * 
 * All monetary values are in INTEGER cents for precision.
 */

export interface DepreciationParams {
    cost: number; // in cents
    salvageValue: number; // in cents
    usefulLifeMonths: number;
    currentBookValue?: number; // in cents (for declining balance)
    isPartialMonth: boolean;
}

export interface DepreciationResult {
    depreciationAmount: number; // in cents
    method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE_200';
    isPartial: boolean;
}

export class DepreciationCalculator {
    /**
     * Straight-Line Depreciation
     * Formula: (cost - salvage) / useful_life_months
     * 
     * @param params Depreciation parameters
     * @returns Monthly depreciation amount in cents
     */
    static calculateStraightLine(params: DepreciationParams): number {
        const { cost, salvageValue, usefulLifeMonths, isPartialMonth } = params;

        // Validate inputs
        if (cost <= 0 || usefulLifeMonths <= 0) {
            throw new Error('Cost and useful life must be positive');
        }

        if (salvageValue < 0 || salvageValue >= cost) {
            throw new Error('Salvage value must be between 0 and cost');
        }

        // Calculate monthly depreciation
        const depreciableBase = cost - salvageValue;
        let monthlyDepreciation = Math.round(depreciableBase / usefulLifeMonths);

        // Apply half-month convention if needed
        if (isPartialMonth) {
            monthlyDepreciation = Math.round(monthlyDepreciation / 2);
        }

        return monthlyDepreciation;
    }

    /**
     * Declining Balance 200% Depreciation
     * Formula: book_value * (2 / useful_life_months)
     * 
     * Note: Cannot depreciate below salvage value
     * 
     * @param params Depreciation parameters
     * @returns Monthly depreciation amount in cents
     */
    static calculateDecliningBalance200(params: DepreciationParams): number {
        const { currentBookValue, salvageValue, usefulLifeMonths, isPartialMonth } = params;

        if (!currentBookValue || currentBookValue <= 0) {
            throw new Error('Current book value is required for declining balance');
        }

        if (usefulLifeMonths <= 0) {
            throw new Error('Useful life must be positive');
        }

        // Check if already at or below salvage value
        if (currentBookValue <= salvageValue) {
            return 0; // No more depreciation allowed
        }

        // Calculate depreciation rate (200% = 2x straight-line)
        const depreciationRate = 2 / usefulLifeMonths;

        // Calculate depreciation amount
        let depreciationAmount = Math.round(currentBookValue * depreciationRate);

        // Apply half-month convention if needed
        if (isPartialMonth) {
            depreciationAmount = Math.round(depreciationAmount / 2);
        }

        // Ensure we don't go below salvage value
        const remainingDepreciable = currentBookValue - salvageValue;
        if (depreciationAmount > remainingDepreciable) {
            depreciationAmount = remainingDepreciable;
        }

        return depreciationAmount;
    }

    /**
     * Determines if the first month of depreciation should be partial
     * based on IRS Half-Month Convention.
     * 
     * Rule:
     * - Purchase days 1-15: full month depreciation
     * - Purchase days 16-31: half month depreciation
     * 
     * @param purchaseDate Asset purchase date
     * @param periodDate First depreciation period date
     * @returns True if partial month (purchased after day 15)
     */
    static isFirstMonthPartial(purchaseDate: Date, periodDate: Date): boolean {
        const purchaseDay = purchaseDate.getDate();
        const purchaseMonth = purchaseDate.getMonth();
        const purchaseYear = purchaseDate.getFullYear();

        const periodMonth = periodDate.getMonth();
        const periodYear = periodDate.getFullYear();

        // Check if this is the first month of depreciation
        const isFirstMonth =
            purchaseYear === periodYear &&
            purchaseMonth === periodMonth;

        if (!isFirstMonth) {
            return false; // Not first month, so full depreciation
        }

        // Apply half-month convention
        // Days 1-15: full month (not partial)
        // Days 16-31: half month (partial)
        return purchaseDay > 15;
    }

    /**
     * Calculates the depreciation amount for a specific period
     * using the appropriate method.
     * 
     * @param method Depreciation method
     * @param params Depreciation parameters
     * @returns Depreciation result with amount and metadata
     */
    static calculate(
        method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE_200',
        params: DepreciationParams
    ): DepreciationResult {
        let depreciationAmount: number;

        switch (method) {
            case 'STRAIGHT_LINE':
                depreciationAmount = this.calculateStraightLine(params);
                break;

            case 'DECLINING_BALANCE_200':
                depreciationAmount = this.calculateDecliningBalance200(params);
                break;

            default:
                throw new Error(`Unsupported depreciation method: ${method}`);
        }

        return {
            depreciationAmount,
            method,
            isPartial: params.isPartialMonth
        };
    }

    /**
     * Projects future depreciation schedule for an asset.
     * Useful for forecasting and budgeting.
     * 
     * @param cost Asset cost in cents
     * @param salvageValue Salvage value in cents
     * @param usefulLifeMonths Useful life in months
     * @param method Depreciation method
     * @param startDate Start of depreciation
     * @returns Array of monthly depreciation projections
     */
    static projectSchedule(
        cost: number,
        salvageValue: number,
        usefulLifeMonths: number,
        method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE_200',
        startDate: Date
    ): Array<{
        period: Date;
        depreciation: number;
        accumulated: number;
        bookValue: number;
    }> {
        const schedule: Array<{
            period: Date;
            depreciation: number;
            accumulated: number;
            bookValue: number;
        }> = [];

        let currentBookValue = cost;
        let accumulatedDepreciation = 0;

        for (let month = 0; month < usefulLifeMonths; month++) {
            const periodDate = new Date(startDate);
            periodDate.setMonth(startDate.getMonth() + month);
            periodDate.setDate(1); // First day of month

            const isPartialMonth = month === 0 && this.isFirstMonthPartial(startDate, periodDate);

            const params: DepreciationParams = {
                cost,
                salvageValue,
                usefulLifeMonths,
                currentBookValue,
                isPartialMonth
            };

            const result = this.calculate(method, params);
            const depreciation = result.depreciationAmount;

            accumulatedDepreciation += depreciation;
            currentBookValue = cost - accumulatedDepreciation;

            // Ensure book value doesn't go below salvage value
            if (currentBookValue < salvageValue) {
                currentBookValue = salvageValue;
                accumulatedDepreciation = cost - salvageValue;
            }

            schedule.push({
                period: periodDate,
                depreciation,
                accumulated: accumulatedDepreciation,
                bookValue: currentBookValue
            });

            // Stop if fully depreciated
            if (currentBookValue <= salvageValue) {
                break;
            }
        }

        return schedule;
    }
}
