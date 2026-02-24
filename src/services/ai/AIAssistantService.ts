import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { AuditChainService } from '../audit/AuditChainService';
import { FinancialReportingService } from '../accounting/FinancialReportingService';
import { AccountingService } from '../accounting/AccountingService';
import { SmartAIProvider } from './SmartAIProvider';
import { SchemaContext } from '../../types/ai-context';
import { SemanticQueryResolver } from './SemanticQueryResolver';

/**
 * AIAssistantService - Read-Only AI Analysis Engine
 * 
 * SECURITY CONSTRAINTS:
 * - NO direct database write access (read-only views only)
 * - NO SQL generation (only predefined queries)
 * - Rate limiting (100 queries per day)
 * - Context includes logic_clock for data integrity verification
 * 
 * PERSONA: Forensic Auditor & Florida Tax Consultant
 * - Detects anomalies in AuditChain
 * - Validates double-entry bookkeeping
 * - Analyzes Florida tax compliance
 * - Identifies financial risks
 * 
 * @example
 * const ai = new AIAssistantService(db, apiKey);
 * const analysis = await ai.analyzeFinancialRisks();
 * // Returns: { risks: [...], recommendations: [...], integrityStatus: 'VALID' }
 */
export class AIAssistantService {
    private db: SQLiteEngine;
    private auditChainService: AuditChainService;
    private reportingService: FinancialReportingService;
    private accountingService: AccountingService;
    private smartAI: SmartAIProvider;
    private resolver: SemanticQueryResolver;
    private apiKey: string;
    private readonly DAILY_LIMIT = 100;
    private readonly SYSTEM_PROMPT = `You are a Forensic Auditor and Florida Tax Consultant for AccountExpress Next-Gen.

Your responsibilities:
1. Detect anomalies in the audit chain (hash mismatches, logic_clock gaps)
2. Validate double-entry bookkeeping (debits = credits)
3. Analyze Florida sales tax compliance (6% state + county surtax, $5,000 cap)
4. Identify financial risks and provide actionable recommendations

CRITICAL CONSTRAINTS:
- You have READ-ONLY access to financial data
- You CANNOT modify any database records
- You CANNOT execute SQL queries
- All data is provided as JSON summaries
- Always verify the logic_clock to ensure data integrity

Response format:
- Be concise and actionable
- Highlight critical issues first
- Provide specific recommendations
- Reference logic_clock for data freshness`;

    constructor(db: SQLiteEngine, apiKey: string = '') {
        this.db = db;
        this.apiKey = apiKey;
        this.auditChainService = new AuditChainService(db);
        this.accountingService = new AccountingService(db);
        this.reportingService = new FinancialReportingService(db);
        this.smartAI = new SmartAIProvider(db); // ✅ Pass DB for full data access
        this.resolver = new SemanticQueryResolver(db);

        // Initialize AI in background
        this.smartAI.initialize().catch((err: unknown) => {
            console.error('Failed to initialize Smart AI:', err);
        });
    }

    /**
     * Analyze financial risks
     * 
     * @returns Risk analysis with recommendations
     */
    public async analyzeFinancialRisks(): Promise<AIAnalysisResult> {
        // Check rate limit
        await this.checkRateLimit();

        // Get read-only data views
        const context = await this.buildReadOnlyContext();

        // Call AI API
        const prompt = `Analyze the following financial data for risks and anomalies:

${JSON.stringify(context, null, 2)}

Provide:
1. Critical risks (if any)
2. Audit chain integrity status
3. Double-entry balance verification
4. Florida tax compliance check
5. Actionable recommendations`;

        const aiResponse = await this.callAIAPI(prompt);

        // Increment usage counter
        await this.incrementUsageCounter();

        return {
            analysis: aiResponse,
            context,
            timestamp: new Date().toISOString(),
            logicClock: (context as any).logicClock
        };
    }

    /**
     * Detect accounting anomalies
     * 
     * @returns Anomaly detection report
     */
    public async detectAnomalies(): Promise<AIAnalysisResult> {
        await this.checkRateLimit();

        // Verify audit chain integrity
        const integrity = await this.auditChainService.verifyIntegrity();

        // Get trial balance
        const trialBalance = await this.reportingService.getTrialBalance();

        // Calculate total debits and credits
        const totalDebits = trialBalance.reduce((sum, entry) => sum + entry.debit, 0);
        const totalCredits = trialBalance.reduce((sum, entry) => sum + entry.credit, 0);

        const context = {
            integrityReport: integrity,
            trialBalance: {
                totalDebits,
                totalCredits,
                isBalanced: totalDebits === totalCredits,
                accounts: trialBalance
            },
            logicClock: await this.auditChainService.getCurrentLogicClock()
        };

        const prompt = `Analyze this accounting data for anomalies:

${JSON.stringify(context, null, 2)}

Focus on:
1. Audit chain integrity (any hash mismatches or gaps?)
2. Trial balance (debits = credits?)
3. Unusual account balances
4. Logic clock consistency`;

        const aiResponse = await this.callAIAPI(prompt);

        await this.incrementUsageCounter();

        return {
            analysis: aiResponse,
            context,
            timestamp: new Date().toISOString(),
            logicClock: (context as any).logicClock
        };
    }

    /**
     * Analyze Florida tax compliance
     * 
     * @returns Tax compliance analysis
     */
    public async analyzeTaxCompliance(): Promise<AIAnalysisResult> {
        await this.checkRateLimit();

        // DAC Phase 2: Dynamic Semantic Resolution
        await this.resolver.loadContext();
        const invoiceTable = this.resolver.resolveTable('INVOICE')?.name || 'invoices';
        const customerTable = this.resolver.resolveTable('CUSTOMER')?.name || 'customers';

        // Get sales tax data
        const taxData = await this.db.select(`
            SELECT 
                i.id,
                i.invoice_number,
                i.subtotal,
                i.tax,
                i.total,
                c.county
            FROM ${invoiceTable} i
            JOIN ${customerTable} c ON i.customer_id = c.id
            WHERE i.status = 'posted'
            ORDER BY i.created_at DESC
            LIMIT 100
        `);

        // Get tax payable balance
        const taxPayable = await this.accountingService.getAccountBalance('2020'); // Sales Tax Payable

        const context = {
            recentInvoices: taxData.map(inv => ({
                invoiceNumber: inv.invoice_number,
                subtotalCents: inv.subtotal,
                taxCents: inv.tax,
                totalCents: inv.total,
                county: inv.county,
                effectiveRate: inv.subtotal > 0 ? (inv.tax / inv.subtotal) : 0
            })),
            taxPayableBalance: taxPayable,
            logicClock: await this.auditChainService.getCurrentLogicClock()
        };

        const prompt = `Analyze Florida sales tax compliance:

${JSON.stringify(context, null, 2)}

Check:
1. Are tax rates correct? (6% state + county surtax)
2. Is the $5,000 surtax cap applied correctly?
3. Are there any unusual effective tax rates?
4. Is the tax payable balance reasonable?
5. Any compliance risks?`;

        const aiResponse = await this.callAIAPI(prompt);

        await this.incrementUsageCounter();

        return {
            analysis: aiResponse,
            context,
            timestamp: new Date().toISOString(),
            logicClock: (context as any).logicClock
        };
    }

    /**
     * Quick command handler
     * 
     * @param command - Command string (e.g., "/analizar riesgos")
     * @returns Command result
     */
    public async executeCommand(command: string): Promise<AIAnalysisResult> {
        const cmd = command.toLowerCase().trim();

        if (cmd.includes('riesgo') || cmd.includes('risk')) {
            return this.analyzeFinancialRisks();
        } else if (cmd.includes('fiscal') || cmd.includes('tax')) {
            return this.analyzeTaxCompliance();
        } else if (cmd.includes('integridad') || cmd.includes('integrity')) {
            return this.verifySystemIntegrity();
        } else if (cmd.includes('anomal')) {
            return this.detectAnomalies();
        } else {
            throw new Error(`Unknown command: ${command}`);
        }
    }

    /**
     * Verify system integrity (quick check)
     * 
     * @returns Integrity verification result
     */
    public async verifySystemIntegrity(): Promise<AIAnalysisResult> {
        await this.checkRateLimit();

        const integrity = await this.auditChainService.verifyIntegrity();

        const context = {
            integrityReport: integrity,
            logicClock: await this.auditChainService.getCurrentLogicClock()
        };

        const prompt = `Verify system integrity:

${JSON.stringify(context, null, 2)}

Report:
1. Is the audit chain valid?
2. Are there any hash mismatches?
3. Are there any logic_clock gaps?
4. Overall integrity status`;

        const aiResponse = await this.callAIAPI(prompt);

        await this.incrementUsageCounter();

        return {
            analysis: aiResponse,
            context,
            timestamp: new Date().toISOString(),
            logicClock: (context as any).logicClock
        };
    }

    /**
     * Build read-only context for AI
     * @private
     */
    private async buildReadOnlyContext(): Promise<ReadOnlyContext> {
        // Get integrity status
        const integrity = await this.auditChainService.verifyIntegrity();

        // Get trial balance
        const trialBalance = await this.reportingService.getTrialBalance();

        // Get balance sheet
        const balanceSheet = await this.reportingService.getBalanceSheet();

        // Get recent transactions count
        const recentTxData = await this.db.select(`
            SELECT COUNT(*) as count 
            FROM journal_entries 
            WHERE status = 'POSTED' 
            AND created_at >= date('now', '-30 days')
        `);
        const recentTxCount = (recentTxData[0] as any).count;

        return {
            integrityStatus: integrity.valid ? 'VALID' : 'COMPROMISED',
            integrityErrors: integrity.errors,
            logicClock: await this.auditChainService.getCurrentLogicClock(),
            trialBalance: {
                totalDebits: trialBalance.reduce((sum, e) => sum + e.debit, 0),
                totalCredits: trialBalance.reduce((sum, e) => sum + e.credit, 0),
                isBalanced: trialBalance.reduce((sum, e) => sum + e.debit, 0) ===
                    trialBalance.reduce((sum, e) => sum + e.credit, 0)
            },
            balanceSheet: {
                totalAssets: balanceSheet.assets.total,
                totalLiabilities: balanceSheet.liabilities.total,
                totalEquity: balanceSheet.equity.total,
                isBalanced: balanceSheet.isBalanced
            },
            recentActivity: {
                last30DaysTransactions: recentTxCount
            }
        };
    }

    /**
     * Call AI API (placeholder - integrate with actual AI service)
     * @private
     */
    private async callAIAPI(prompt: string): Promise<string> {
        // TODO: Integrate with actual AI service (OpenAI, Anthropic, etc.)
        // For now, return a mock response

        // In production, this would be:
        // const response = await fetch('https://api.openai.com/v1/chat/completions', {
        //     method: 'POST',
        //     headers: {
        //         'Authorization': `Bearer ${this.apiKey}`,
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({
        //         model: 'gpt-4',
        //         messages: [
        //             { role: 'system', content: this.SYSTEM_PROMPT },
        //             { role: 'user', content: prompt }
        //         ]
        //     })
        // });

        return `[AI Analysis - Mock Response]
This is a placeholder response. In production, this would call the actual AI API.

Prompt received:
${prompt.substring(0, 200)}...

To enable AI analysis, configure the API key in environment variables.`;
    }

    /**
     * Check rate limit
     * @private
     */
    private async checkRateLimit(): Promise<void> {
        const today = new Date().toISOString().split('T')[0];

        // Get usage count for today
        const usage = await this.db.select(`
            SELECT value FROM system_config 
            WHERE key = ?
        `, [`ai_usage_${today}`]);

        const count = usage.length > 0 ? parseInt((usage[0] as any).value) : 0;

        if (count >= this.DAILY_LIMIT) {
            throw new Error(
                `Daily AI query limit reached (${this.DAILY_LIMIT}). ` +
                `Limit resets at midnight.`
            );
        }
    }

    /**
     * Increment usage counter
     * @private
     */
    private async incrementUsageCounter(): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const key = `ai_usage_${today}`;

        const usage = await this.db.select(`
            SELECT value FROM system_config WHERE key = ?
        `, [key]);

        if (usage.length > 0) {
            const newCount = parseInt((usage[0] as any).value) + 1;
            await this.db.run(`
                UPDATE system_config SET value = ? WHERE key = ?
            `, [newCount.toString(), key]);
        } else {
            await this.db.run(`
                INSERT INTO system_config (key, value) VALUES (?, '1')
            `, [key]);
        }
    }

    /**
     * Get remaining queries for today
     */
    public async getRemainingQueries(): Promise<number> {
        const today = new Date().toISOString().split('T')[0];
        const usage = await this.db.select(`
            SELECT value FROM system_config WHERE key = ?
        `, [`ai_usage_${today}`]);

        const count = usage.length > 0 ? parseInt((usage[0] as any).value) : 0;
        return Math.max(0, this.DAILY_LIMIT - count);
    }

    /**
     * Obtener el contexto dinámico del esquema generado por el crawler
     */
    public async getSchemaContext(): Promise<SchemaContext | null> {
        const result = await this.db.select(`
            SELECT value FROM system_config WHERE key = 'ai_schema_context'
        `);
        if (result.length > 0 && result[0].value) {
            try {
                return JSON.parse(result[0].value as string);
            } catch (e) {
                return null;
            }
        }
        return null;
    }
}

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface AIAnalysisResult {
    analysis: string;
    context: any;
    timestamp: string;
    logicClock: number;
}

export interface ReadOnlyContext {
    integrityStatus: 'VALID' | 'COMPROMISED';
    integrityErrors: any[];
    logicClock: number;
    trialBalance: {
        totalDebits: number;
        totalCredits: number;
        isBalanced: boolean;
    };
    balanceSheet: {
        totalAssets: number;
        totalLiabilities: number;
        totalEquity: number;
        isBalanced: boolean;
    };
    recentActivity: {
        last30DaysTransactions: number;
    };
}
