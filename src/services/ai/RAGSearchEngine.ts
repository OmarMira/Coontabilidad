import { EmbeddingsService } from '@/services/ai/EmbeddingsService';
import { FullDatabaseIndexer } from '@/services/ai/FullDatabaseIndexer';
import { SQLiteEngine } from '@/core/database/SQLiteEngine';
import floridaTaxRates from '@/knowledge/florida-tax-rates.json';
import { ProductionLogger } from '@/core/logging/ProductionLogger';

/**
 * RAGSearchEngine - Retrieval Augmented Generation
 * 
 * Busca información relevante en:
 * 1. Knowledge base estática (Florida tax, GAAP, etc.)
 * 2. TODA la base de datos del sistema en tiempo real
 */
export class RAGSearchEngine {
    private embeddings: EmbeddingsService;
    private knowledgeBase: Array<{ text: string; metadata: any }> = [];
    private dbIndexer: FullDatabaseIndexer | null = null;
    private isInitialized = false;

    constructor(private db?: SQLiteEngine) {
        this.embeddings = new EmbeddingsService();
        if (db) {
            this.dbIndexer = new FullDatabaseIndexer(db);
        }
    }

    /**
     * Initialize knowledge base + database index
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        ProductionLogger.info('RAGSearchEngine', 'Initializing RAG system...');

        // Initialize embeddings service
        await this.embeddings.initialize();

        // Load static knowledge base (Florida tax, etc.)
        await this.loadStaticKnowledge();

        // Index ALL database content
        if (this.dbIndexer) {
            await this.dbIndexer.indexEverything();
            const stats = this.dbIndexer.getStats();
            ProductionLogger.info('RAGSearchEngine', `Indexed ${stats.totalRecords} database records`);
        }

        this.isInitialized = true;
        ProductionLogger.info('RAGSearchEngine', '✅ RAG system ready');
    }

    /**
     * Load static knowledge (Florida tax, GAAP rules, etc.)
     */
    private async loadStaticKnowledge(): Promise<void> {
        const data = floridaTaxRates as any;

        // Add county information
        for (const county of data.counties) {
            this.knowledgeBase.push({
                text: `${county.name} County, Florida: ${county.description}`,
                metadata: {
                    type: 'tax_rate',
                    source: 'static',
                    county: county.name,
                    totalRate: county.totalRate,
                    surtaxRate: county.surtaxRate
                }
            });

            // Add cities
            if (county.cities) {
                for (const city of county.cities) {
                    this.knowledgeBase.push({
                        text: `${city} is in ${county.name} County. Tax rate: ${county.totalRate}% (${data.stateRate}% state + ${county.surtaxRate}% county surtax).`,
                        metadata: {
                            type: 'city_tax',
                            source: 'static',
                            city,
                            county: county.name,
                            totalRate: county.totalRate
                        }
                    });
                }
            }
        }

        // Add exemptions
        for (const exemption of data.exemptions) {
            this.knowledgeBase.push({
                text: `${exemption.category}: ${exemption.description}. Taxable: ${exemption.taxable ? 'Yes' : 'No'}.`,
                metadata: {
                    type: 'exemption',
                    source: 'static',
                    category: exemption.category,
                    taxable: exemption.taxable
                }
            });
        }

        // Add special rules
        for (const rule of data.specialRules) {
            this.knowledgeBase.push({
                text: `${rule.rule}: ${rule.description} ${rule.example || ''}`,
                metadata: {
                    type: 'special_rule',
                    source: 'static',
                    rule: rule.rule
                }
            });
        }

        ProductionLogger.info('RAGSearchEngine', `Loaded ${this.knowledgeBase.length} static knowledge entries`);
    }

    /**
     * Search across static knowledge + entire database
     */
    async search(query: string, limit: number = 10): Promise<SearchResult[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const results: SearchResult[] = [];

        // Search static knowledge base
        const staticResults = await this.embeddings.findSimilar(query, this.knowledgeBase, limit);
        for (const result of staticResults) {
            results.push({
                text: result.text,
                score: result.similarity,
                source: 'static_knowledge',
                metadata: result.metadata
            });
        }

        // Search database
        if (this.dbIndexer) {
            const dbResults = await this.dbIndexer.search(query, limit);
            for (const result of dbResults) {
                results.push({
                    text: result.textRepresentation,
                    score: result.similarity,
                    source: 'database',
                    metadata: {
                        table: result.table,
                        id: result.id,
                        data: result.data
                    }
                });
            }
        }

        // Sort by score and return top results
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, limit);
    }

    /**
     * Get comprehensive context for AI query
     * Includes both static knowledge AND all relevant database records
     */
    async getContext(query: string): Promise<string> {
        const results = await this.search(query, 10);

        if (results.length === 0) {
            return 'No relevant information found.';
        }

        const contextParts: string[] = [];

        // Group by source
        const staticResults = results.filter(r => r.source === 'static_knowledge');
        const dbResults = results.filter(r => r.source === 'database');

        if (staticResults.length > 0) {
            contextParts.push('**Knowledge Base:**');
            for (const r of staticResults.slice(0, 3)) {
                contextParts.push(`- ${r.text} (${(r.score * 100).toFixed(0)}% relevant)`);
            }
        }

        if (dbResults.length > 0) {
            contextParts.push('\n**Your System Data:**');
            for (const r of dbResults.slice(0, 7)) {
                const table = r.metadata.table || 'unknown';
                contextParts.push(`- [${table}] ${r.text} (${(r.score * 100).toFixed(0)}% relevant)`);
            }
        }

        return contextParts.join('\n');
    }

    /**
     * Re-index database (call after data changes)
     */
    async reindexDatabase(): Promise<void> {
        if (this.dbIndexer) {
            await this.dbIndexer.indexEverything();
            ProductionLogger.info('RAGSearchEngine', 'Database re-indexed');
        }
    }

    /**
     * Re-index specific table
     */
    async reindexTable(tableName: string): Promise<void> {
        if (this.dbIndexer) {
            await this.dbIndexer.reindexTable(tableName);
        }
    }

    /**
     * Get stats
     */
    getStats(): RAGStats {
        const dbStats = this.dbIndexer?.getStats();

        return {
            staticKnowledge: this.knowledgeBase.length,
            databaseRecords: dbStats?.totalRecords || 0,
            totalRecords: this.knowledgeBase.length + (dbStats?.totalRecords || 0),
            byTable: dbStats?.byTable || {}
        };
    }
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface SearchResult {
    text: string;
    score: number;
    source: 'static_knowledge' | 'database';
    metadata: any;
}

interface RAGStats {
    staticKnowledge: number;
    databaseRecords: number;
    totalRecords: number;
    byTable: Record<string, number>;
}
