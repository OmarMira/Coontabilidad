/**
 * TaxRulesCache (Iron Clad Objective 2.1)
 * Singleton cache for Florida tax rates to avoid repeated DB hits.
 */
export class TaxRulesCache {
    private static instance: TaxRulesCache;
    private cache: Map<string, any> = new Map();
    private lastUpdate: number = 0;
    private TTL: number = 3600000; // 1 hour

    private constructor() { }

    public static getInstance(): TaxRulesCache {
        if (!TaxRulesCache.instance) {
            TaxRulesCache.instance = new TaxRulesCache();
        }
        return TaxRulesCache.instance;
    }

    public getRate(countyCode: string): any | null {
        if (this.isExpired()) {
            this.invalidate();
            return null;
        }
        return this.cache.get(countyCode) || null;
    }

    public setRate(countyCode: string, config: any): void {
        this.cache.set(countyCode, config);
        this.lastUpdate = Date.now();
    }

    public invalidate(): void {
        this.cache.clear();
        this.lastUpdate = 0;
    }

    private isExpired(): boolean {
        return Date.now() - this.lastUpdate > this.TTL;
    }

    public loadBatch(configs: any[]): void {
        configs.forEach(c => this.setRate(c.county_code || c.county_name, c));
    }
}
