import { EmbeddingsService } from './EmbeddingsService';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import floridaTaxRates from '../../knowledge/florida-tax-rates.json';
import { ProductionLogger } from '../../core/logging/ProductionLogger';

/**
 * FullDatabaseIndexer - Indexa TODOS los datos del sistema en RAG
 * 
 * Crea embeddings de:
 * - Todas las tablas
 * - Todos los registros
 * - Relaciones entre datos
 */
export class FullDatabaseIndexer {
    private db: SQLiteEngine;
    private embeddings: EmbeddingsService;
    private index: Map<string, IndexedRecord> = new Map();

    constructor(db: SQLiteEngine) {
        this.db = db;
        this.embeddings = new EmbeddingsService();
    }

    /**
     * Index entire database
     */
    async indexEverything(): Promise<void> {
        ProductionLogger.info('FullDatabaseIndexer', 'Starting full database indexing...');

        await this.embeddings.initialize();

        // Index all main tables
        await this.indexChartOfAccounts();
        await this.indexCustomers();
        await this.indexVendors();
        await this.indexProducts();
        await this.indexInvoices();
        await this.indexJournalEntries();
        await this.indexLedgerLines();
        await this.indexAssets();
        await this.indexEmployees();
        await this.indexSystemConfig();

        ProductionLogger.info('FullDatabaseIndexer', `✅ Indexed ${this.index.size} records`);
    }

    /**
     * Search across all indexed data
     */
    async search(query: string, limit: number = 10): Promise<SearchResult[]> {
        const queryEmbedding = await this.embeddings.embed(query);
        const results: SearchResult[] = [];

        // Calculate similarity for all indexed records
        for (const [id, record] of this.index.entries()) {
            const similarity = this.embeddings.cosineSimilarity(queryEmbedding, record.embedding);

            results.push({
                id,
                table: record.table,
                data: record.data,
                textRepresentation: record.text,
                similarity
            });
        }

        // Sort by similarity and return top results
        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, limit);
    }

    /**
     * Get context from search results
     */
    async getContextForQuery(query: string): Promise<string> {
        const results = await this.search(query, 5);

        if (results.length === 0) {
            return 'No relevant data found in system.';
        }

        const contextLines = results.map((r, idx) => {
            return `[${idx + 1}] ${r.table}: ${r.textRepresentation} (relevance: ${(r.similarity * 100).toFixed(1)}%)`;
        });

        return `Relevant data from your system:\n${contextLines.join('\n')}`;
    }

    // ==========================================
    // TABLE INDEXERS
    // ==========================================

    private async indexChartOfAccounts(): Promise<void> {
        const accounts = await this.db.select('SELECT * FROM chart_of_accounts');

        for (const account of accounts) {
            const text = `Account ${account.code}: ${account.name} (${account.type}, Normal Balance: ${account.normal_balance})`;
            await this.indexRecord('chart_of_accounts', account.code, account, text);
        }
    }

    private async indexCustomers(): Promise<void> {
        const customers = await this.db.select('SELECT * FROM customers');

        for (const customer of customers) {
            const text = `Customer: ${customer.business_name || customer.name}, Email: ${customer.email}, Phone: ${customer.phone}, County: ${customer.county}`;
            await this.indexRecord('customers', customer.id, customer, text);
        }
    }

    private async indexVendors(): Promise<void> {
        const vendors = await this.db.select('SELECT * FROM vendors');

        for (const vendor of vendors) {
            const text = `Vendor: ${vendor.business_name || vendor.name}, Email: ${vendor.email}, Type: ${vendor.type}`;
            await this.indexRecord('vendors', vendor.id, vendor, text);
        }
    }

    private async indexProducts(): Promise<void> {
        const products = await this.db.select('SELECT * FROM products');

        for (const product of products) {
            const text = `Product: ${product.name}, SKU: ${product.sku}, Price: $${product.price_cents / 100}, Category: ${product.category}`;
            await this.indexRecord('products', product.id, product, text);
        }
    }

    private async indexInvoices(): Promise<void> {
        const invoices = await this.db.select(`
            SELECT i.*, c.business_name as customer_name 
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.id
            LIMIT 1000
        `);

        for (const invoice of invoices) {
            const text = `Invoice #${invoice.invoice_number}: Customer ${invoice.customer_name}, Date: ${invoice.invoice_date}, Total: $${invoice.total / 100}, Status: ${invoice.status}`;
            await this.indexRecord('invoices', invoice.id, invoice, text);
        }
    }

    private async indexJournalEntries(): Promise<void> {
        const entries = await this.db.select(`
            SELECT * FROM journal_entries 
            WHERE status = 'POSTED'
            ORDER BY created_at DESC
            LIMIT 500
        `);

        for (const entry of entries) {
            const text = `Journal Entry: ${entry.description}, Date: ${entry.entry_date}, Type: ${entry.entry_type}, Reference: ${entry.reference_number}`;
            await this.indexRecord('journal_entries', entry.id, entry, text);
        }
    }

    private async indexLedgerLines(): Promise<void> {
        const lines = await this.db.select(`
            SELECT ll.*, coa.code as account_code, coa.name as account_name
            FROM ledger_lines ll
            JOIN chart_of_accounts coa ON ll.account_code = coa.code
            LIMIT 1000
        `);

        for (const line of lines) {
            const amount = line.amount_cents / 100;
            const type = line.line_type === 'DEBIT' ? 'Debit' : 'Credit';
            const text = `${type} ${line.account_code} ${line.account_name}: $${amount}`;
            await this.indexRecord('ledger_lines', line.id, line, text);
        }
    }

    private async indexAssets(): Promise<void> {
        try {
            const assets = await this.db.select('SELECT * FROM fixed_assets LIMIT 500');

            for (const asset of assets) {
                const text = `Asset: ${asset.name}, Cost: $${asset.cost_cents / 100}, Method: ${asset.depreciation_method}, Life: ${asset.useful_life_years} years`;
                await this.indexRecord('fixed_assets', asset.id, asset, text);
            }
        } catch (error) {
            // Table might not exist
            ProductionLogger.warn('FullDatabaseIndexer', 'fixed_assets table not found');
        }
    }

    private async indexEmployees(): Promise<void> {
        try {
            const employees = await this.db.select('SELECT * FROM employees');

            for (const employee of employees) {
                const text = `Employee: ${employee.first_name} ${employee.last_name}, Position: ${employee.position}, Salary: $${employee.salary_cents / 100}`;
                await this.indexRecord('employees', employee.id, employee, text);
            }
        } catch (error) {
            // Table might not exist
            ProductionLogger.warn('FullDatabaseIndexer', 'employees table not found');
        }
    }

    private async indexSystemConfig(): Promise<void> {
        const configs = await this.db.select('SELECT * FROM system_config');

        for (const config of configs) {
            const text = `System Config: ${config.key} = ${config.value}`;
            await this.indexRecord('system_config', config.key, config, text);
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private async indexRecord(table: string, id: any, data: any, text: string): Promise<void> {
        const embedding = await this.embeddings.embed(text);

        const recordId = `${table}:${id}`;
        this.index.set(recordId, {
            table,
            id,
            data,
            text,
            embedding
        });
    }

    /**
     * Re-index specific table (for updates)
     */
    async reindexTable(tableName: string): Promise<void> {
        // Remove old entries for this table
        for (const [key, value] of this.index.entries()) {
            if (value.table === tableName) {
                this.index.delete(key);
            }
        }

        // Re-index
        switch (tableName) {
            case 'chart_of_accounts': await this.indexChartOfAccounts(); break;
            case 'customers': await this.indexCustomers(); break;
            case 'vendors': await this.indexVendors(); break;
            case 'products': await this.indexProducts(); break;
            case 'invoices': await this.indexInvoices(); break;
            case 'journal_entries': await this.indexJournalEntries(); break;
            // Add more as needed
        }

        ProductionLogger.info('FullDatabaseIndexer', `Re-indexed ${tableName}`);
    }

    /**
     * Get index stats
     */
    getStats(): IndexStats {
        const tableStats = new Map<string, number>();

        for (const record of this.index.values()) {
            const count = tableStats.get(record.table) || 0;
            tableStats.set(record.table, count + 1);
        }

        return {
            totalRecords: this.index.size,
            byTable: Object.fromEntries(tableStats)
        };
    }
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface IndexedRecord {
    table: string;
    id: any;
    data: any;
    text: string;
    embedding: number[];
}

interface SearchResult {
    id: string;
    table: string;
    data: any;
    textRepresentation: string;
    similarity: number;
}

interface IndexStats {
    totalRecords: number;
    byTable: Record<string, number>;
}
