
import { pipeline } from '@xenova/transformers';

export interface SemanticMatch {
    key: string;
    score: number;
}

export interface QueryAnalysis {
    intent: SemanticMatch;
    entity: SemanticMatch;
    parameters: Record<string, any>;
    confidence: number;
    language: 'es' | 'en';
}

export class SemanticQueryAnalyzer {
    private static instance: SemanticQueryAnalyzer;
    private embedder: any = null;
    private isInitializing: boolean = false;
    private modelLoaded: boolean = false;

    private readonly INTENT_EMBEDDINGS: Record<string, number[][]> = {};
    private readonly ENTITY_EMBEDDINGS: Record<string, number[][]> = {};

    private readonly INTENT_SEEDS: Record<string, string[]> = {
        COUNT: ["cuantos", "cuántos", "cantidad de", "número de", "contar", "how many", "count", "number of"],
        SUM: ["cuánto es", "cuanto es", "suma total", "monto", "total de dinero", "valorizado", "how much", "total amount", "sum of"],
        FIND_MAX: ["más alto", "máximo", "mejor", "superior", "highest", "best", "top", "maximum"],
        FIND_MIN: ["más bajo", "mínimo", "peor", "inferior", "lowest", "worst", "minimum"],
        EXPLAIN: ["qué es", "que es", "que significa", "definición", "concepto", "explicar", "explicame", "what is", "definition", "meaning", "concept", "explain"],
        HOW_TO: ["cómo", "como", "pasos para", "procedimiento", "guía", "instrucciones", "how do I", "how to", "steps for", "procedure"],
        LIST: ["mostrar", "ver", "listar", "lista de", "catálogo", "show", "view", "list", "catalog"]
    };

    private readonly ENTITY_SEEDS: Record<string, string[]> = {
        CUSTOMER: ["clientes", "cliente", "compradores", "customers", "client", "buyer"],
        SUPPLIER: ["proveedores", "proveedor", "vendedores", "vendors", "supplier", "distributor"],
        PRODUCT: ["productos", "inventario", "stock", "mercancías", "artículos", "products", "inventory", "items"],
        INVOICE: ["facturas", "recibos", "invoices", "ventas", "invoice", "sale", "receipt"],
        ACCOUNT: ["cuentas contables", "plan de cuentas", "ledger", "asientos", "accounts", "chart of accounts"],
        ASSET: ["activos", "bienes", "propiedades", "assets", "property"],
        EXPENSE: ["gastos", "costos", "expenses", "egresos", "expense", "costs"],
        REVENUE: ["ingresos", "ventas totales", "ganancias", "revenue", "income", "earnings"]
    };

    private readonly TYPO_MAP: Record<string, string> = {
        'cuanl': 'cual',
        'cuanlto': 'cuanto',
        'cliennte': 'cliente',
        'proveedorr': 'proveedor',
        'vendi': 'vendí',
        'compre': 'compré',
        'factrua': 'factura'
    };

    private constructor() { }

    static async getInstance(): Promise<SemanticQueryAnalyzer> {
        if (!this.instance) {
            this.instance = new SemanticQueryAnalyzer();
            await this.instance.initialize();
        }
        return this.instance;
    }

    async initialize() {
        if (this.modelLoaded || this.isInitializing) return;
        this.isInitializing = true;
        try {
            this.embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', {
                quantized: true
            });
            this.modelLoaded = true;
            for (const [key, seeds] of Object.entries(this.INTENT_SEEDS)) {
                this.INTENT_EMBEDDINGS[key] = await Promise.all(seeds.map(s => this.getEmbedding(s)));
            }
            for (const [key, seeds] of Object.entries(this.ENTITY_SEEDS)) {
                this.ENTITY_EMBEDDINGS[key] = await Promise.all(seeds.map(s => this.getEmbedding(s)));
            }
        } catch (error) {
            this.modelLoaded = false;
        } finally {
            this.isInitializing = false;
        }
    }

    public async getEmbedding(text: string): Promise<number[]> {
        if (!this.modelLoaded || !this.embedder) return new Array(384).fill(0);
        try {
            const output = await this.embedder(text, { pooling: 'mean', normalize: true });
            return Array.from(output.data);
        } catch (error) {
            return new Array(384).fill(0);
        }
    }

    async analyzeQuery(query: string): Promise<QueryAnalysis> {
        const language = this.detectLanguage(query);
        const normalizedInput = this.normalizeText(query);

        let processedQuery = normalizedInput.toLowerCase().trim();
        Object.entries(this.TYPO_MAP).forEach(([typo, correction]) => {
            processedQuery = processedQuery.replace(new RegExp(`\\b${typo}\\b`, 'g'), correction);
        });

        // PRIORIDAD 1: Keywords claras para Knowledge Base
        const lower = processedQuery;
        if (/\b(qu[é|e] es|significa|definici[ó|o]n|expl[í|i]ca|what is|meaning|definition|explain)\b/i.test(lower)) {
            const fallback = this.analyzeQueryFallback(processedQuery, language);
            if (fallback.intent.key === 'EXPLAIN') return fallback;
        }
        if (/\b(c[ó|o]mo|pasos|procedimiento|instrucciones|gu[í|i]a|how to|steps|procedure|guide)\b/i.test(lower)) {
            const fallback = this.analyzeQueryFallback(processedQuery, language);
            if (fallback.intent.key === 'HOW_TO') return fallback;
        }

        if (!this.modelLoaded) return this.analyzeQueryFallback(processedQuery, language);

        // PRIORIDAD 2: Semántica con embeddings
        const queryEmbedding = await this.getEmbedding(processedQuery);
        const intent = this.findBestMatch(queryEmbedding, this.INTENT_EMBEDDINGS, 0.4);
        const entity = this.findBestMatch(queryEmbedding, this.ENTITY_EMBEDDINGS, 0.4);

        if (intent.key === 'UNKNOWN' || entity.key === 'UNKNOWN') {
            const fallbackRes = this.analyzeQueryFallback(processedQuery, language);
            if (fallbackRes.intent.key !== 'UNKNOWN' || fallbackRes.entity.key !== 'UNKNOWN') {
                return fallbackRes;
            }
        }

        return {
            intent,
            entity,
            parameters: this.extractParameters(processedQuery),
            confidence: intent.score * entity.score,
            language
        };
    }

    private detectLanguage(text: string): 'es' | 'en' {
        const lowerText = text.toLowerCase();
        const normalizedText = this.normalizeText(lowerText);

        // 1. Indicadores fuertes de ESPAÑOL
        const spanishStrong = [
            /\b(cliente|proveedor|factura|gasto|ingreso|producto|asiento|cuenta|banco|activo|pasivo|patrimonio|impuesto|procedimiento|conciliacion)s?\b/i,
            /\b(cuanto|cuanto|que|como|donde|cuando|cual|cuales|quien|quienes)\b/i,
            /\b(tengo|tienes|tenemos|hay|vendi|compre|pague|recibi|hacer|registrar)\b/i,
            /[áéíóúñ]/i
        ];

        // 2. Indicadores fuertes de INGLÉS
        const englishStrong = [
            /\b(customer|supplier|invoice|expense|revenue|product|entry|account|bank|asset|liability|equity|tax|procedure|reconciliation)s?\b/i,
            /\b(how|what|where|when|why|many|much|which|who)\b/i,
            /\b(have|has|do|does|did|am|is|are|was|were|sold|bought|paid|received|make|register)\b/i,
            /\b(i|you|we|they|it|my|your|our|their)\b/i,
            /'s|'re|'ll|'ve|'d/i
        ];

        // 3. Contar coincidencias
        const spanishMatches = spanishStrong.filter(regex => regex.test(normalizedText)).length;
        const englishMatches = englishStrong.filter(regex => regex.test(lowerText)).length;

        if (spanishMatches > englishMatches) return 'es';
        if (englishMatches > spanishMatches) return 'en';

        // 4. Heurística de palabras de estructura (Common Words)
        const esCommonWords = ['el', 'la', 'los', 'las', 'de', 'y', 'en', 'con', 'por', 'un', 'una', 'para', 'que', 'su', 'mi'];
        const enCommonWords = ['the', 'a', 'an', 'and', 'in', 'with', 'for', 'to', 'of', 'on', 'at', 'that', 'it', 'is', 'my'];

        const words = normalizedText.split(/\s+/);
        const rawWords = lowerText.split(/\s+/);

        const esCommonCount = words.filter(w => esCommonWords.includes(w)).length;
        const enCommonCount = rawWords.filter(w => enCommonWords.includes(w)).length;

        if (esCommonCount > enCommonCount) return 'es';
        if (enCommonCount > esCommonCount) return 'en';

        // 5. Desempate final
        return (/[áéíóúñ]/i.test(text)) ? 'es' : (englishMatches > 0 ? 'en' : 'es');
    }

    private normalizeText(text: string): string {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    private analyzeQueryFallback(query: string, language: 'es' | 'en' = 'es'): QueryAnalysis {
        const lower = query.toLowerCase().trim();
        let intentKey = 'UNKNOWN';
        let entityKey = 'UNKNOWN';

        // Intents
        if (/\b(cu[á|a]ntos|contar|n[ú|u]mero|cantidad|how many|count)\b/i.test(lower)) intentKey = 'COUNT';
        else if (/\b(cu[á|a]nto|suma|monto|total|valor|how much|sum)\b/i.test(lower)) intentKey = 'SUM';
        else if (/\b(qu[é|e] es|significa|concepto|definici[ó|o]n|expl[í|i]ca|what is|meaning|definition|explain)\b/i.test(lower)) intentKey = 'EXPLAIN';
        else if (/\b(c[ó|o]mo|pasos|procedimiento|instrucciones|gu[í|i]a|how to|procedure|steps)\b/i.test(lower)) intentKey = 'HOW_TO';
        else if (/\b(mejor|m[á|a]ximo|m[á|a]s alto|superior|best|highest|maximum)\b/i.test(lower)) intentKey = 'FIND_MAX';
        else if (/\b(peor|m[í|i]nimo|m[á|a]s bajo|inferior|worst|lowest|minimum)\b/i.test(lower)) intentKey = 'FIND_MIN';

        // Entities
        if (/\b(cliente(s)?|customer(s)?|client(s)?)\b/i.test(lower)) entityKey = 'CUSTOMER';
        else if (/\b(proveedor(es)?|vendor(s)?|supplier(s)?)\b/i.test(lower)) entityKey = 'SUPPLIER';
        else if (/\b(producto(s)?|inventario|stock|art[í|i]culo(s)?|product(s)?|item(s)?)\b/i.test(lower)) entityKey = 'PRODUCT';
        else if (/\b(factura(s)?|venta(s)?|invoice(s)?|sale(s)?)\b/i.test(lower)) entityKey = 'INVOICE';
        else if (/\b(activo(s)?|asset(s)?|bien(es)?)\b/i.test(lower)) entityKey = 'ASSET';
        else if (/\b(pasivo(s)?|liability|deuda(s)?|liabilities)\b/i.test(lower)) entityKey = 'LIABILITY';
        else if (/\b(patrimonio|capital|equity)\b/i.test(lower)) entityKey = 'EQUITY';
        else if (/\b(impuesto(s)?|tax(es)?|iva|tributo)\b/i.test(lower)) entityKey = 'TAX';
        else if (/\b(banco(s)?|bank(s)?|cuenta bancaria|bank account)\b/i.test(lower)) entityKey = 'BANK_ACCOUNT';
        else if (/\b(gasto(s)?|expense(s)?|egreso(s)?|cost(s)?)\b/i.test(lower)) entityKey = 'EXPENSE';
        else if (/\b(ingreso(s)?|revenue|ganancia(s)?|income|earnings)\b/i.test(lower)) entityKey = 'REVENUE';
        else if (/\b(cuenta(s)?|ledger|asiento(s)?|account(s)?)\b/i.test(lower)) entityKey = 'ACCOUNT';

        const hasKeywords = intentKey !== 'UNKNOWN' || entityKey !== 'UNKNOWN';

        return {
            intent: { key: intentKey, score: intentKey !== 'UNKNOWN' ? 0.95 : 0 },
            entity: { key: entityKey, score: entityKey !== 'UNKNOWN' ? 0.95 : 0 },
            parameters: this.extractParameters(query),
            confidence: hasKeywords ? 0.9 : 0,
            language
        };
    }

    private findBestMatch(queryEmbedding: number[], targetGroups: Record<string, number[][]>, threshold: number): SemanticMatch {
        let bestMatch = { key: 'UNKNOWN', score: 0 };
        for (const [key, embeddings] of Object.entries(targetGroups)) {
            for (const targetEmbedding of embeddings) {
                const similarity = this.cosineSimilarity(queryEmbedding, targetEmbedding);
                if (similarity > bestMatch.score) {
                    bestMatch = { key, score: similarity };
                }
            }
        }
        return bestMatch.score > threshold ? bestMatch : { key: 'UNKNOWN', score: 0 };
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let mA = 0, mB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            mA += a[i] * a[i];
            mB += b[i] * b[i];
        }
        const denom = Math.sqrt(mA) * Math.sqrt(mB);
        return denom === 0 ? 0 : dotProduct / denom;
    }

    private extractParameters(query: string): Record<string, any> {
        const params: Record<string, any> = {};
        const lowerQuery = query.toLowerCase();
        const numbers = lowerQuery.match(/\d+/g);
        if (numbers) params.numeric_value = parseFloat(numbers[0]);
        if (lowerQuery.includes('miami')) params.county = 'Miami-Dade';
        if (lowerQuery.includes('broward')) params.county = 'Broward';
        return params;
    }
}
