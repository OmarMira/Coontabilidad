// IntelligentCache.ts - Sistema de caché inteligente con invalidación automática

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Tags for grouped invalidation
  priority?: number; // 1-5, higher = keep longer
}

interface CacheEntry<T> {
  data: T;
  expires: number;
  accessed: number;
  hits: number;
  tags: string[];
  priority: number;
}

export class IntelligentCache {
  private static instance: IntelligentCache;
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum number of entries
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Auto-cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  static getInstance(): IntelligentCache {
    if (!IntelligentCache.instance) {
      IntelligentCache.instance = new IntelligentCache();
    }
    return IntelligentCache.instance;
  }

  /**
   * Get or compute value with intelligent caching
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.cache.get(key);

    // Cache hit
    if (cached && cached.expires > Date.now()) {
      cached.accessed = Date.now();
      cached.hits++;
      return cached.data as T;
    }

    // Cache miss - compute value
    const data = await computeFn();
    
    this.set(key, data, options);
    
    return data;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || 5 * 60 * 1000; // Default 5 minutes
    const tags = options.tags || [];
    const priority = options.priority || 3;

    // Check size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLeastValuable();
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      accessed: Date.now(),
      hits: 0,
      tags,
      priority
    });
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached || cached.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    cached.accessed = Date.now();
    cached.hits++;
    return cached.data as T;
  }

  /**
   * Invalidate cache by key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache by tag
   */
  invalidateByTag(tag: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate cache when entity changes
   */
  invalidateOnChange(entityType: string, entityId?: number): void {
    const patterns = this.getInvalidationPatterns(entityType);
    
    patterns.forEach(pattern => {
      this.cache.forEach((_, key) => {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      });
    });

    // Also invalidate by tag
    this.invalidateByTag(entityType);
    if (entityId) {
      this.invalidateByTag(`${entityType}-${entityId}`);
    }
  }

  /**
   * Get invalidation patterns for entity type
   */
  private getInvalidationPatterns(entityType: string): string[] {
    const patterns: Record<string, string[]> = {
      'inventory': ['inventory-report', 'stock-level', 'movement-summary', 'product-list'],
      'payroll': ['payroll-report', 'employee-summary', 'tax-calculation', 'period-summary'],
      'banking': ['reconciliation-report', 'bank-balance', 'transaction-summary', 'statement-list'],
      'invoice': ['invoice-list', 'revenue-report', 'customer-balance', 'ar-aging'],
      'bill': ['bill-list', 'expense-report', 'supplier-balance', 'ap-aging'],
      'journal': ['journal-list', 'trial-balance', 'ledger-report', 'financial-statement'],
      'customer': ['customer-list', 'customer-detail', 'ar-report'],
      'supplier': ['supplier-list', 'supplier-detail', 'ap-report'],
      'product': ['product-list', 'product-detail', 'inventory-report'],
      'employee': ['employee-list', 'employee-detail', 'payroll-report']
    };

    return patterns[entityType] || [entityType];
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.expires < now) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));

    console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
  }

  /**
   * Evict least valuable entry when cache is full
   */
  private evictLeastValuable(): void {
    let lowestScore = Infinity;
    let keyToEvict: string | null = null;

    this.cache.forEach((entry, key) => {
      // Calculate value score based on hits, recency, and priority
      const recencyScore = (Date.now() - entry.accessed) / (1000 * 60); // Minutes since last access
      const hitScore = entry.hits;
      const priorityScore = entry.priority * 10;
      
      // Lower score = less valuable
      const score = (hitScore + priorityScore) / (recencyScore + 1);

      if (score < lowestScore) {
        lowestScore = score;
        keyToEvict = key;
      }
    });

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      console.log(`[Cache] Evicted entry: ${keyToEvict} (score: ${lowestScore.toFixed(2)})`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    avgHits: number;
    oldestEntry: number;
  } {
    let totalHits = 0;
    let oldestAccess = Date.now();

    this.cache.forEach(entry => {
      totalHits += entry.hits;
      if (entry.accessed < oldestAccess) {
        oldestAccess = entry.accessed;
      }
    });

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      avgHits: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      oldestEntry: Date.now() - oldestAccess
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Destroy cache instance
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Export singleton instance
export const intelligentCache = IntelligentCache.getInstance();