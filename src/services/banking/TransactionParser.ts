import { logger } from '../../core/logging/SystemLogger';
// SQLiteEngine interface â€” mirrors the public API of SQLiteEngine.ts.
// Defined locally to avoid TS2709 namespace collision caused by `declare module '*'` in custom.d.ts.
interface IDbEngine {
    exec(sql: string): Promise<void>;
    run(sql: string, params?: any[]): Promise<void>;
    select(sql: string, params?: any[]): Promise<Record<string, any>[]>;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TIPOS â€” alineados exactamente con migration 016 constraints
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { TRANSACTION_STATES, TransactionState } from '../../constants/bankingStates';

export type SuggestedCategory =
    | 'PERSONAL_EXPENSE'
    | 'OWNERS_DRAW'
    | 'PENDING_REVIEW'
    | 'TRANSPORT_INCOME'
    | 'CONTRACTOR_PAYMENT';

export interface RiskKeyword {
    id: number;
    merchant_name: string;
    pattern: string;
    pattern_type: 'REGEX' | 'LIKE' | 'EXACT';
    risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
    suggested_category: SuggestedCategory;
    auto_classify: number; // SQLite stores boolean as 0|1
}

export interface ParseResult {
    transaction_id: number;
    description: string;
    state: TransactionState;
    matched_keyword_id: number | null;
    suggested_category: SuggestedCategory | null;
    confidence_score: number;
    auto_classified: boolean;
    // Para Zelle/P2P: nombre extraÃ­do de la nota
    extracted_reference: string | null;
    // Para Invoice: nÃºmero de factura extraÃ­do
    extracted_invoice_number: number | null;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MOTOR DE DOS CAPAS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export class TransactionParser {
    private db: IDbEngine;
    private keywordCache: RiskKeyword[] = [];
    private cacheLoadedAt: number = 0;
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

    constructor(db: IDbEngine) {
        this.db = db;
    }

    // â”€â”€ Carga de reglas desde DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // NOTE: SQLiteEngine.select() returns Promise<Record<string, any>[]> â€” no generics.
    // We cast the rows to RiskKeyword after retrieval.
    private async loadKeywords(): Promise<void> {
        const now = Date.now();
        if (this.keywordCache.length > 0 && (now - this.cacheLoadedAt) < this.CACHE_TTL_MS) {
            return;
        }
        const rows = await this.db.select(
            `SELECT id, merchant_name, pattern, pattern_type,
                    risk_level, suggested_category,
                    auto_classify
             FROM   risk_keywords
             WHERE  is_active = 1
             ORDER  BY risk_level DESC, id ASC`
        );
        this.keywordCache = rows as unknown as RiskKeyword[];
        this.cacheLoadedAt = now;
    }

    // â”€â”€ CAPA 1: Regex determinÃ­stico â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private matchLayer1(description: string): { keyword: RiskKeyword; score: number } | null {
        const descUpper = description.toUpperCase();

        for (const kw of this.keywordCache) {
            let matched = false;

            if (kw.pattern_type === 'REGEX') {
                try {
                    // El patrÃ³n en DB incluye flags: /pattern/flags
                    const flagMatch = kw.pattern.match(/^\/(.+)\/([gimsuy]*)$/);
                    if (flagMatch) {
                        const regex = new RegExp(flagMatch[1], flagMatch[2]);
                        matched = regex.test(description);
                    }
                } catch {
                    logger.warn('TransactionParser', 'warn', `[TransactionParser] Regex invÃ¡lido en keyword ${kw.id}: ${kw.pattern}`);
                }
            } else if (kw.pattern_type === 'LIKE') {
                // Convertir SQL LIKE a match simple: % = wildcard, _ = un carÃ¡cter
                const likePattern = kw.pattern
                    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escapar regex especiales
                    .replace(/%/g, '.*')
                    .replace(/_/g, '.');
                matched = new RegExp(`^${likePattern}$`, 'i').test(descUpper);
            } else if (kw.pattern_type === 'EXACT') {
                matched = descUpper === kw.pattern.toUpperCase();
            }

            if (matched) {
                // auto_classify viene como 0|1 desde SQLite
                return { keyword: kw, score: kw.auto_classify ? 1.0 : 0.9 };
            }
        }
        return null;
    }

    // â”€â”€ CAPA 2: Fuzzy scoring Jaro-Winkler â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Usado para Zelle P2P donde el nombre del beneficiario
    // es inconsistente. Umbral calibrado empÃ­ricamente.
    private jaroWinkler(s1: string, s2: string): number {
        if (s1 === s2) return 1.0;
        const len1 = s1.length;
        const len2 = s2.length;
        if (len1 === 0 || len2 === 0) return 0.0;

        const matchDist = Math.max(0, Math.floor(Math.max(len1, len2) / 2) - 1);
        const s1Matches = new Array(len1).fill(false);
        const s2Matches = new Array(len2).fill(false);

        let matches = 0;
        let transpositions = 0;

        for (let i = 0; i < len1; i++) {
            const start = Math.max(0, i - matchDist);
            const end = Math.min(i + matchDist + 1, len2);
            for (let j = start; j < end; j++) {
                if (s2Matches[j] || s1[i] !== s2[j]) continue;
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }

        if (matches === 0) return 0.0;

        let k = 0;
        for (let i = 0; i < len1; i++) {
            if (!s1Matches[i]) continue;
            while (!s2Matches[k]) k++;
            if (s1[i] !== s2[k]) transpositions++;
            k++;
        }

        const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

        // Winkler prefix bonus (hasta 4 caracteres)
        let prefix = 0;
        for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
            if (s1[i] === s2[i]) prefix++;
            else break;
        }

        return jaro + prefix * 0.1 * (1 - jaro);
    }

    // â”€â”€ Limpieza de tokens ruidosos de BofA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    private cleanDescription(description: string): string {
        return description
            .replace(/CONF#\s*[A-Z0-9]+/gi, '')
            .replace(/ID:\s*[A-Z0-9]+/gi, '')
            .replace(/CO ID:\s*[A-Z0-9]+/gi, '')
            .replace(/INDN:\s*[\w\s]+/gi, '')
            .replace(/DES:\s*[\w\s]+/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // â”€â”€ ExtracciÃ³n de referencias de notas Zelle/Invoice â”€â”€â”€â”€â”€
    private extractReferences(description: string): {
        extracted_reference: string | null;
        extracted_invoice_number: number | null;
    } {
        // Extraer nÃºmero de factura: "Invoice 334", "invoice #334", "INV-334"
        const invoiceMatch = description.match(/invoice\s*#?\s*(\d+)|INV[-\s](\d+)/i);
        const extracted_invoice_number = invoiceMatch
            ? parseInt(invoiceMatch[1] ?? invoiceMatch[2], 10)
            : null;

        // Extraer nombre de Zelle: "Zelle - Omar M", "ZELLE PAYMENT FROM JOHN"
        const zelleMatch = description.match(/Zelle\s*[-â€“]\s*(.+?)(?:\s+\d|$)/i);
        const extracted_reference = zelleMatch ? zelleMatch[1].trim() : null;

        return { extracted_reference, extracted_invoice_number };
    }

    // â”€â”€ MÃ‰TODO PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    async parse(transaction_id: number, description: string): Promise<ParseResult> {
        await this.loadKeywords();

        const cleanedDesc = this.cleanDescription(description);
        const { extracted_reference, extracted_invoice_number } = this.extractReferences(description);

        // CAPA 1
        const layer1Match = this.matchLayer1(description);

        if (layer1Match && layer1Match.keyword.auto_classify) {
            return {
                transaction_id,
                description,
                state: TRANSACTION_STATES.VERIFIED,
                matched_keyword_id: layer1Match.keyword.id,
                suggested_category: layer1Match.keyword.suggested_category,
                confidence_score: 1.0,
                auto_classified: true,
                extracted_reference,
                extracted_invoice_number,
            };
        }

        if (layer1Match && !layer1Match.keyword.auto_classify) {
            const state: TransactionState =
                layer1Match.keyword.risk_level === 'HIGH'
                    ? TRANSACTION_STATES.HIGH_RISK_PERSONAL
                    : TRANSACTION_STATES.IMPORTED;
            return {
                transaction_id,
                description,
                state,
                matched_keyword_id: layer1Match.keyword.id,
                suggested_category: layer1Match.keyword.suggested_category,
                confidence_score: layer1Match.score,
                auto_classified: false,
                extracted_reference,
                extracted_invoice_number,
            };
        }

        // CAPA 2: Fuzzy para P2P sin match determinÃ­stico
        // NOTA: El umbral Fâ‚€.â‚ˆâ‚… se calibrÃ³ con datos reales de BofA.
        const FUZZY_THRESHOLD = 0.85;

        let bestScore = 0;
        let bestKeyword: RiskKeyword | null = null;

        for (const kw of this.keywordCache) {
            const score = this.jaroWinkler(
                cleanedDesc.toLowerCase(),
                kw.merchant_name.toLowerCase()
            );
            if (score > bestScore) {
                bestScore = score;
                bestKeyword = kw;
            }
        }

        if (bestScore >= FUZZY_THRESHOLD && bestKeyword !== null) {
            return {
                transaction_id,
                description,
                state: TRANSACTION_STATES.IMPORTED, // Fuzzy nunca auto-clasifica â€” siempre requiere revisiÃ³n
                matched_keyword_id: bestKeyword.id,
                suggested_category: bestKeyword.suggested_category,
                confidence_score: bestScore,
                auto_classified: false,
                extracted_reference,
                extracted_invoice_number,
            };
        }

        // Sin match en ninguna capa
        return {
            transaction_id,
            description,
            state: TRANSACTION_STATES.IMPORTED,
            matched_keyword_id: null,
            suggested_category: null,
            confidence_score: 0,
            auto_classified: false,
            extracted_reference,
            extracted_invoice_number,
        };
    }

    // â”€â”€ Procesar lote e insertar estados en DB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // NOTE: SQLiteEngine.exec() returns Promise<void> â€” no .changes property.
    // For UPSERT, exec() is sufficient as it runs DDL/DML without parameterized binding.
    // For parameterized INSERTs, run() is used.
    async processBatch(
        transactions: Array<{ id: number; description: string }>,
        userId: number | null
    ): Promise<ParseResult[]> {
        if (userId === null || userId === undefined) {
            throw new Error('[TransactionParser] userId requerido. OperaciÃ³n abortada.');
        }

        const results: ParseResult[] = [];

        for (const tx of transactions) {
            const result = await this.parse(tx.id, tx.description);
            results.push(result);

            const keywordId = result.matched_keyword_id;
            const isHighRisk = result.state === TRANSACTION_STATES.HIGH_RISK_PERSONAL;

            // UPSERT manual for transaction_states
            const existingRows = await this.db.select(
                `SELECT 1 FROM transaction_states WHERE transaction_id = ?`,
                [tx.id]
            );

            if (existingRows && existingRows.length > 0) {
                await this.db.run(`
                    UPDATE transaction_states SET
                        current_state         = ?,
                        risk_keyword_id       = ?,
                        risk_score            = ?,
                        is_verified           = ?,
                        quarantine_started_at = ${isHighRisk ? "datetime('now')" : "NULL"},
                        sla_deadline          = ${isHighRisk ? "datetime('now', '+72 hours')" : "NULL"}
                    WHERE transaction_id = ?
                `, [
                    result.state,
                    keywordId,
                    result.confidence_score,
                    result.auto_classified ? 1 : 0,
                    tx.id
                ]);
            } else {
                await this.db.run(`
                    INSERT INTO transaction_states (
                        transaction_id, current_state, risk_keyword_id,
                        risk_score, is_verified,
                        quarantine_started_at, sla_deadline
                    ) VALUES (
                        ?, ?, ?, ?, ?, 
                        ${isHighRisk ? "datetime('now')" : "NULL"}, 
                        ${isHighRisk ? "datetime('now', '+72 hours')" : "NULL"}
                    )
                `, [
                    tx.id,
                    result.state,
                    keywordId,
                    result.confidence_score,
                    result.auto_classified ? 1 : 0
                ]);
            }

            // Log en quarantine_audit_log para HIGH_RISK
            if (result.state === TRANSACTION_STATES.HIGH_RISK_PERSONAL) {
                const stateRows = await this.db.select(
                    `SELECT id FROM transaction_states WHERE transaction_id = ? LIMIT 1`,
                    [tx.id]
                );
                if (stateRows.length > 0) {
                    const stateId = stateRows[0]['id'] as number;
                    await this.db.run(`
                        INSERT INTO quarantine_audit_log (
                            transaction_id, state_id, action_type,
                            performed_by, previous_state, new_state
                        ) VALUES (?, ?, ?, NULL, ?, ?)
                    `, [
                        tx.id,
                        stateId,
                        TRANSACTION_STATES.RISK_DETECTED,
                        TRANSACTION_STATES.IMPORTED,
                        TRANSACTION_STATES.HIGH_RISK_PERSONAL
                    ]);
                }
            }
        }

        return results;
    }

    // â”€â”€ EscalaciÃ³n SLA (llamar desde job periÃ³dico) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // NOTE: exec() returns void. To get affected rows, we query count before/after.
    async escalateExpiredQuarantine(): Promise<number> {
        // Count before
        const before = await this.db.select(
            `SELECT COUNT(*) as cnt FROM transaction_states
             WHERE current_state = 'HIGH_RISK_PERSONAL'
               AND sla_deadline  < datetime('now')
               AND is_verified   = 0`
        );
        const count = (before[0]?.['cnt'] as number) ?? 0;

        if (count > 0) {
            await this.db.exec(`
                UPDATE transaction_states
                SET    current_state = '${TRANSACTION_STATES.PENDING_SUPERVISOR}'
                WHERE  current_state = '${TRANSACTION_STATES.HIGH_RISK_PERSONAL}'
                  AND  sla_deadline  < datetime('now')
                  AND  is_verified   = 0
            `);
        }

        return count;
    }

    // â”€â”€ Invalidar cachÃ© (llamar cuando se modifiquen risk_keywords) â”€â”€
    invalidateCache(): void {
        this.keywordCache = [];
        this.cacheLoadedAt = 0;
    }
}
