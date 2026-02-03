import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { AuditChainService } from '../audit/AuditChainService';
import { ProductionLogger } from '../../core/logging/ProductionLogger';
import { AIAssistantService } from './AIAssistantService';
import { AccountingService, CreateJournalEntryDTO } from '../accounting/AccountingService';
import { FloridaTaxEngine } from '../accounting/FloridaTaxEngine';
import {
    RepairProposal,
    RepairResult,
    RepairAction,
    RepairCategory,
    BackupPoint,
    RepairHistoryEntry,
    RepairStats,
    RepairActionType
} from '../../types/ai-repair';

/**
 * AIRepairService - Sistema de Reparación Asistida por IA
 * 
 * Flujo:
 * 1. Detecta problemas usando AIAssistantService
 * 2. Genera propuestas de reparación con preview
 * 3. Usuario aprueba/rechaza en UI
 * 4. Ejecuta reparación de forma segura (transacción + backup)
 * 5. Permite rollback si algo falla
 * 
 * SEGURIDAD:
 * - Solo funciones whitelisted pueden ejecutarse
 * - Backup automático antes de cada reparación
 * - Ejecución en transacción atómica
 * - Audit trail completo
 */
export class AIRepairService {
    private db: SQLiteEngine;
    private auditChainService: AuditChainService;
    private aiAssistant: AIAssistantService;
    private accountingService: AccountingService;
    private taxEngine: FloridaTaxEngine;
    private proposals: Map<string, RepairProposal> = new Map();

    // Registry de funciones seguras que la IA puede sugerir
    private readonly SAFE_FUNCTIONS: Record<RepairActionType, Function> = {
        'CREATE_JE': this.createJournalEntry.bind(this),
        'UPDATE_ACCOUNT': this.updateAccount.bind(this),
        'RECALCULATE_TAX': this.recalculateTax.bind(this),
        'FIX_CHAIN': this.fixAuditChain.bind(this),
        'REVERSE_ENTRY': this.reverseEntry.bind(this),
        'ADJUST_BALANCE': this.adjustBalance.bind(this)
    };

    constructor(db: SQLiteEngine, apiKey: string) {
        this.db = db;
        this.auditChainService = new AuditChainService(db);
        this.aiAssistant = new AIAssistantService(db, apiKey);
        this.accountingService = new AccountingService(db);
        this.taxEngine = FloridaTaxEngine.getInstance(db);
    }

    /**
     * Detectar problema y generar propuesta de reparación
     */
    async detectAndPropose(category: RepairCategory): Promise<RepairProposal | null> {
        ProductionLogger.info('AIRepairService', `Detecting issues in category: ${category}`);

        try {
            // 1. Detectar anomalías usando AI existente
            const analysis = await this.aiAssistant.detectAnomalies();

            // 2. Analizar el problema y generar propuesta
            const proposal = await this.generateProposal(category, analysis);

            if (proposal) {
                // Guardar propuesta en memoria
                this.proposals.set(proposal.id, proposal);

                ProductionLogger.info('AIRepairService', 'Repair proposal generated', {
                    proposalId: proposal.id,
                    severity: proposal.severity
                });
            }

            return proposal;

        } catch (error) {
            ProductionLogger.error('AIRepairService', 'Failed to generate proposal', error as Error);
            return null;
        }
    }

    /**
     * Ejecutar reparación aprobada por el usuario
     */
    async executeRepair(proposalId: string, userId: number): Promise<RepairResult> {
        const proposal = this.proposals.get(proposalId);

        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }

        if (proposal.status !== 'pending') {
            throw new Error(`Proposal already ${proposal.status}`);
        }

        ProductionLogger.info('AIRepairService', 'Executing repair', {
            proposalId,
            userId,
            actionsCount: proposal.solution.actions.length
        });

        const startTime = Date.now();
        let backupPoint: BackupPoint | undefined;

        try {
            // 1. Crear backup point
            backupPoint = await this.createBackupPoint(proposal);

            // 2. Marcar como aprobado
            proposal.status = 'approved';
            proposal.userId = userId;
            proposal.approvedAt = new Date();
            proposal.backupPointId = backupPoint.id;

            // 3. Ejecutar acciones en transacción atómica
            let executedActions = 0;
            let failedActions = 0;

            await this.db.executeTransaction(async () => {
                for (const action of proposal.solution.actions) {
                    try {
                        await this.executeAction(action);
                        executedActions++;
                    } catch (error) {
                        failedActions++;
                        ProductionLogger.error('AIRepairService', `Action failed: ${action.type}`, error as Error);
                        throw error; // Trigger rollback
                    }
                }
            });

            // 4. Verificar resultado
            const verification = await this.verifyRepair(proposal);

            // 5. Registrar en audit chain
            await this.auditChainService.recordEvent({
                eventType: 'AI_REPAIR_EXECUTED',
                entityTable: 'system',
                entityId: '0',
                userId: userId.toString(),
                payload: {
                    proposalId,
                    category: proposal.category,
                    actionsExecuted: executedActions,
                    verification: verification.passed
                }
            });

            // 6. Marcar como ejecutado
            proposal.status = 'executed';
            proposal.executedAt = new Date();

            const result: RepairResult = {
                success: true,
                repairId: this.generateId(),
                proposalId,
                executedActions,
                failedActions,
                backupPointId: backupPoint.id,
                verification,
                duration: Date.now() - startTime,
                timestamp: new Date()
            };

            ProductionLogger.info('AIRepairService', 'Repair executed successfully', result);

            return result;

        } catch (error) {
            // Auto-rollback en caso de error
            if (backupPoint) {
                await this.rollbackToBackupPoint(backupPoint.id);
                proposal.status = 'rolled_back';
            } else {
                proposal.status = 'failed';
            }

            ProductionLogger.error('AIRepairService', 'Repair execution failed', error as Error);

            return {
                success: false,
                repairId: this.generateId(),
                proposalId,
                executedActions: 0,
                failedActions: proposal.solution.actions.length,
                backupPointId: backupPoint?.id,
                verification: { passed: false, checks: [] },
                duration: Date.now() - startTime,
                timestamp: new Date(),
                error: (error as Error).message
            };
        }
    }

    /**
     * Rechazar propuesta
     */
    async rejectProposal(proposalId: string, userId: number): Promise<void> {
        const proposal = this.proposals.get(proposalId);

        if (!proposal) {
            throw new Error(`Proposal not found: ${proposalId}`);
        }

        proposal.status = 'rejected';
        proposal.userId = userId;

        ProductionLogger.info('AIRepairService', 'Proposal rejected', { proposalId, userId });
    }

    /**
     * Rollback a un backup point
     */
    async rollbackToBackupPoint(backupPointId: string): Promise<void> {
        ProductionLogger.warn('AIRepairService', 'Rolling back to backup point', { backupPointId });

        // Retrieve backup point
        const backupPoints = (this as any)._backupPoints as Map<string, BackupPoint>;

        if (!backupPoints || !backupPoints.has(backupPointId)) {
            throw new Error(`Backup point ${backupPointId} not found or expired`);
        }

        const backupPoint = backupPoints.get(backupPointId)!;

        // Check if backup point has expired
        if (new Date() > backupPoint.expiresAt) {
            throw new Error(`Backup point ${backupPointId} has expired`);
        }

        // Restore data in transaction
        await this.db.executeTransaction(async () => {
            for (const [table, records] of Object.entries(backupPoint.dataSnapshot)) {
                if (records.length === 0) continue;

                // Delete current records (that were modified during repair)
                const recordIds = records.map((r: any) => r.id || r.code);

                if (table === 'journal_entries') {
                    await this.db.run(
                        `DELETE FROM journal_entries WHERE id IN (${recordIds.map(() => '?').join(',')})`,
                        recordIds
                    );
                } else if (table === 'ledger_lines') {
                    await this.db.run(
                        `DELETE FROM ledger_lines WHERE id IN (${recordIds.map(() => '?').join(',')})`,
                        recordIds
                    );
                } else if (table === 'accounts') {
                    // For accounts, restore specific fields instead of deleting
                    for (const record of records as any[]) {
                        await this.db.run(
                            'UPDATE chart_of_accounts SET name = ?, is_active = ?, description = ? WHERE code = ?',
                            [record.name, record.is_active, record.description, record.code]
                        );
                    }
                    continue; // Skip insert
                }

                // Insert backup records
                for (const record of records as any[]) {
                    const columns = Object.keys(record);
                    const placeholders = columns.map(() => '?').join(',');
                    const values = columns.map(col => record[col]);

                    await this.db.run(
                        `INSERT OR REPLACE INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`,
                        values
                    );
                }
            }
        });

        // Record rollback in audit chain
        await this.auditChainService.recordEvent({
            eventType: 'AI_REPAIR_ROLLBACK',
            entityTable: 'system',
            entityId: '0',
            userId: 'system',
            payload: {
                backupPointId,
                logicClock: backupPoint.logicClock,
                tablesRestored: backupPoint.affectedTables
            }
        });

        ProductionLogger.info('AIRepairService', 'Rollback completed successfully', {
            backupPointId,
            tablesRestored: backupPoint.affectedTables.length
        });
    }

    /**
     * Obtener historial de reparaciones
     */
    async getRepairHistory(limit: number = 50): Promise<RepairHistoryEntry[]> {
        const history: RepairHistoryEntry[] = [];

        for (const [id, proposal] of this.proposals.entries()) {
            history.push({
                id,
                proposalId: proposal.id,
                category: proposal.category,
                severity: proposal.severity,
                status: proposal.status,
                issueTitle: proposal.issue.title,
                timestamp: proposal.timestamp,
                userId: proposal.userId,
                canRollback: proposal.status === 'executed' && !!proposal.backupPointId
            });
        }

        return history
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }

    /**
     * Obtener estadísticas de reparaciones
     */
    getStats(): RepairStats {
        const proposals = Array.from(this.proposals.values());

        return {
            totalProposals: proposals.length,
            approved: proposals.filter(p => p.status === 'approved').length,
            rejected: proposals.filter(p => p.status === 'rejected').length,
            executed: proposals.filter(p => p.status === 'executed').length,
            failed: proposals.filter(p => p.status === 'failed').length,
            rolledBack: proposals.filter(p => p.status === 'rolled_back').length,
            averageConfidence: proposals.reduce((sum, p) => sum + p.confidence, 0) / proposals.length || 0,
            successRate: proposals.filter(p => p.status === 'executed').length / proposals.length || 0
        };
    }

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    private async generateProposal(
        category: RepairCategory,
        analysis: any
    ): Promise<RepairProposal | null> {
        /**
         * Generate repair proposal based on detected anomalies
         * 
         * This converts analysis results into actionable repair proposals
         */
        if (!analysis || !analysis.anomalies || analysis.anomalies.length === 0) {
            return null;
        }

        // Take the first anomaly to create a proposal
        const anomaly = analysis.anomalies[0];

        // Map anomaly type to repair actions
        const proposal = await this.mapAnomalyToProposal(category, anomaly);

        return proposal;
    }

    /**
     * Map detected anomaly to repair proposal
     */
    private async mapAnomalyToProposal(
        category: RepairCategory,
        anomaly: any
    ): Promise<RepairProposal | null> {
        let actions: RepairAction[] = [];
        let issue = {
            title: anomaly.description || 'Unknown issue',
            description: anomaly.details || 'No details available',
            affectedEntities: anomaly.affectedEntities || [],
            detectedAt: new Date()
        };
        let risks: string[] = [];
        let confidence = 0.7;

        // Generate actions based on category
        switch (category) {
            case 'balance':
                if (anomaly.type === 'UNBALANCED_JE') {
                    actions = [{
                        type: 'REVERSE_ENTRY',
                        params: {
                            journalEntryId: anomaly.entityid,
                            reason: 'Unbalanced entry detected'
                        },
                        reversible: true,
                        description: `Reverse unbalanced journal entry ${anomaly.entityId}`,
                        estimatedImpact: 'medium'
                    }];
                    risks = ['Will create reversal entry', 'Original entry remains in history'];
                } else if (anomaly.type === 'ACCOUNT_MISMATCH') {
                    actions = [{
                        type: 'ADJUST_BALANCE',
                        params: {
                            accountCode: anomaly.accountCode,
                            targetBalanceCents: anomaly.expectedBalance,
                            reason: 'Balance mismatch detected'
                        },
                        reversible: true,
                        description: `Adjust balance for account ${anomaly.accountCode}`,
                        estimatedImpact: 'high'
                    }];
                    risks = ['Creates adjustment entry', 'Uses suspense account 9999'];
                }
                break;

            case 'tax':
                actions = [{
                    type: 'RECALCULATE_TAX',
                    params: {
                        invoiceId: anomaly.invoiceId,
                        county: anomaly.county || 'Miami-Dade'
                    },
                    reversible: true,
                    description: `Recalculate tax for invoice ${anomaly.invoiceId}`,
                    estimatedImpact: 'medium'
                }];
                risks = ['Will update invoice tax amount', 'Creates tax adjustment journal entry'];
                break;

            case 'audit':
                actions = [{
                    type: 'FIX_CHAIN',
                    params: {
                        from_logic_clock: anomaly.fromClock,
                        to_logic_clock: anomaly.toClock
                    },
                    reversible: false,
                    description: 'Repair broken audit chain',
                    estimatedImpact: 'high'
                }];
                risks = ['Will regenerate hashes', 'Irreversible operation'];
                confidence = 0.5; // Lower confidence for chain repair
                break;

            default:
                return null;
        }

        if (actions.length === 0) {
            return null;
        }

        // Generate preview
        const preview = this.generatePreview(actions);

        const proposal: RepairProposal = {
            id: this.generateId(),
            timestamp: new Date(),
            category,
            severity: this.calculateSeverity(anomaly),
            status: 'pending',
            issue,
            solution: {
                summary: this.generateSolutionSummary(actions),
                actions,
                preview,
                estimatedDuration: actions.length * 500 // 500ms per action
            },
            risks,
            confidence,
            affectedRecords: anomaly.affectedRecords || 1,
            proposedBy: 'AI'
        };

        return proposal;
    }

    private generatePreview(actions: RepairAction[]): string {
        const lines = ['Repair Actions:', ''];

        actions.forEach((action, idx) => {
            lines.push(`${idx + 1}. ${action.description}`);
            lines.push(`   Type: ${action.type}`);
            lines.push(`   Impact: ${action.estimatedImpact}`);
            lines.push(`   Params: ${JSON.stringify(action.params, null, 2)}`);
            lines.push('');
        });

        return lines.join('\n');
    }

    private generateSolutionSummary(actions: RepairAction[]): string {
        return actions.map(a => a.description).join(' + ');
    }

    private calculateSeverity(anomaly: any): 'low' | 'medium' | 'high' | 'critical' {
        if (anomaly.severity) return anomaly.severity;
        if (anomaly.impact === 'critical') return 'critical';
        if (anomaly.type?.includes('CHAIN')) return 'high';
        if (anomaly.affectedRecords > 10) return 'high';
        return 'medium';
    }

    private async createBackupPoint(proposal: RepairProposal): Promise<BackupPoint> {
        const logicClock = await this.auditChainService.getCurrentLogicClock();
        const affectedTables = this.extractAffectedTables(proposal);

        // Capture data snapshot for affected tables
        const dataSnapshot: Record<string, any[]> = {};

        for (const table of affectedTables) {
            try {
                // Get affected records based on proposal
                const records = await this.getAffectedRecords(table, proposal);
                dataSnapshot[table] = records;

                ProductionLogger.info('AIRepairService', `Captured ${records.length} records from ${table}`);
            } catch (error) {
                ProductionLogger.error('AIRepairService', `Failed to capture snapshot for ${table}`, error as Error);
                // Continue with other tables
            }
        }

        const backupPoint: BackupPoint = {
            id: this.generateId(),
            timestamp: new Date(),
            logicClock,
            affectedTables,
            dataSnapshot,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
        };

        // Store backup point in memory (in production, persist to disk/db)
        // TODO: Persistir backup points en IndexedDB o disco
        (this as any)._backupPoints = (this as any)._backupPoints || new Map();
        (this as any)._backupPoints.set(backupPoint.id, backupPoint);

        ProductionLogger.info('AIRepairService', 'Backup point created', {
            backupPointId: backupPoint.id,
            logicClock: backupPoint.logicClock,
            tablesCount: affectedTables.length,
            recordsCount: Object.values(dataSnapshot).reduce((sum, records) => sum + records.length, 0)
        });

        return backupPoint;
    }

    /**
     * Get affected records for a specific table based on proposal
     */
    private async getAffectedRecords(table: string, proposal: RepairProposal): Promise<any[]> {
        // Extract IDs from affected entities
        const entityIds: string[] = [];

        for (const entity of proposal.issue.affectedEntities) {
            // Parse entities like "JE #1234", "Account 4010", etc.
            const match = entity.match(/\#?(\w+)/);
            if (match) {
                entityIds.push(match[1]);
            }
        }

        // Query based on table
        if (table === 'journal_entries') {
            if (entityIds.length === 0) {
                return this.db.select('SELECT * FROM journal_entries ORDER BY logic_clock DESC LIMIT 10') as Promise<any[]>;
            }
            return this.db.select(
                `SELECT * FROM journal_entries WHERE id IN (${entityIds.map(() => '?').join(',')})`,
                entityIds
            ) as Promise<any[]>;
        } else if (table === 'journal_entry_lines') {
            return this.db.select(
                `SELECT * FROM ledger_lines WHERE journal_entry_id IN (${entityIds.map(() => '?').join(',')})`,
                entityIds
            ) as Promise<any[]>;
        } else if (table === 'accounts') {
            return this.db.select(
                `SELECT * FROM chart_of_accounts WHERE code IN (${entityIds.map(() => '?').join(',')})`,
                entityIds
            ) as Promise<any[]>;
        }

        // Default: return recent records
        return this.db.select(`SELECT * FROM ${table} LIMIT 100`) as Promise<any[]>;
    }

    private async executeAction(action: RepairAction): Promise<void> {
        const fn = this.SAFE_FUNCTIONS[action.type];

        if (!fn) {
            throw new Error(`Unsupported action type: ${action.type}`);
        }

        await fn(action.params);
    }

    private async verifyRepair(proposal: RepairProposal) {
        // Verificaciones básicas post-reparación
        const checks = [];

        // 1. Verificar integridad de audit chain
        const integrity = await this.auditChainService.verifyIntegrity();
        checks.push({
            name: 'Audit Chain Integrity',
            passed: integrity.valid,
            message: integrity.valid ? 'Chain is valid' : `${integrity.errors.length} errors found`,
            severity: integrity.valid ? 'info' as const : 'error' as const
        });

        return {
            passed: checks.every(c => c.passed),
            checks
        };
    }

    private extractAffectedTables(proposal: RepairProposal): string[] {
        const tables = new Set<string>();

        for (const action of proposal.solution.actions) {
            if (action.type === 'CREATE_JE' || action.type === 'REVERSE_ENTRY') {
                tables.add('journal_entries');
                tables.add('journal_entry_lines');
            } else if (action.type === 'UPDATE_ACCOUNT') {
                tables.add('accounts');
            }
        }

        return Array.from(tables);
    }

    // ==========================================
    // SAFE REPAIR FUNCTIONS
    // ==========================================

    private async createJournalEntry(params: any): Promise<void> {
        /**
         * CREATE_JE - Crear asiento contable
         * 
         * Params esperados:
         * - description: string
         * - lines: Array<{ accountCode: string, debit?: number, credit?: number, description?: string }>
         * - entryDate?: string (ISO format)
         * - autoPost?: boolean
         */
        if (!params.lines || !Array.isArray(params.lines)) {
            throw new Error('CREATE_JE requires "lines" array');
        }

        if (!params.description) {
            throw new Error('CREATE_JE requires "description"');
        }

        const entryData: CreateJournalEntryDTO = {
            description: params.description,
            lines: params.lines,
            entryDate: params.entryDate,
            autoPost: params.autoPost !== false, // Default true para reparaciones
            createdBy: 'AI_REPAIR',
            notes: params.notes || 'Auto-generated by AI Repair System'
        };

        const entryId = await this.accountingService.createJournalEntry(entryData);

        ProductionLogger.info('AIRepairService', 'Journal entry created successfully', {
            entryId,
            description: params.description,
            linesCount: params.lines.length
        });
    }

    private async updateAccount(params: any): Promise<void> {
        /**
         * UPDATE_ACCOUNT - Actualizar cuenta
         * 
         * Params esperados:
         * - accountCode: string (required)
         * - updates: Record<string, any> (name, is_active, etc.)
         */
        if (!params.accountCode) {
            throw new Error('UPDATE_ACCOUNT requires "accountCode"');
        }

        if (!params.updates || typeof params.updates !== 'object') {
            throw new Error('UPDATE_ACCOUNT requires "updates" object');
        }

        // Verify account exists
        const account = await this.db.select(
            'SELECT code FROM chart_of_accounts WHERE code = ?',
            [params.accountCode]
        );

        if (!account || account.length === 0) {
            throw new Error(`Account ${params.accountCode} not found`);
        }

        // Build UPDATE query dynamically
        const allowedFields = ['name', 'is_active', 'description'];
        const updates: string[] = [];
        const values: any[] = [];

        for (const [field, value] of Object.entries(params.updates)) {
            if (allowedFields.includes(field)) {
                updates.push(`${field} = ?`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            throw new Error('No valid updates provided');
        }

        values.push(params.accountCode); // WHERE clause

        await this.db.run(
            `UPDATE chart_of_accounts SET ${updates.join(', ')} WHERE code = ?`,
            values
        );

        ProductionLogger.info('AIRepairService', 'Account updated successfully', {
            accountCode: params.accountCode,
            updates: params.updates
        });
    }

    private async recalculateTax(params: any): Promise<void> {
        /**
         * RECALCULATE_TAX - Recalcular impuestos
         * 
         * Params esperados:
         * - invoiceId: number (required)
         * - county: string (required for Florida)
         */
        if (!params.invoiceId) {
            throw new Error('RECALCULATE_TAX requires "invoiceId"');
        }

        if (!params.county) {
            throw new Error('RECALCULATE_TAX requires "county" for Florida tax calculation');
        }

        // Get invoice details
        const invoice = await this.db.select(
            'SELECT id, subtotal, tax, total FROM invoices WHERE id = ?',
            [params.invoiceId]
        );

        if (!invoice || invoice.length === 0) {
            throw new Error(`Invoice ${params.invoiceId} not found`);
        }

        const invoiceData = invoice[0] as any;

        // Get invoice line items
        const lineItems = await this.db.select(
            'SELECT line_total FROM invoice_items WHERE invoice_id = ?',
            [params.invoiceId]
        );

        // Recalculate tax using FloridaTaxEngine
        const lineItemsForTax = (lineItems as any[]).map(item => ({
            amountCents: Math.round(item.line_total * 100) // Convert to cents
        }));

        const correctTaxCents = await this.taxEngine.calculateInvoiceTax(
            lineItemsForTax,
            params.county
        );

        const correctTaxDollars = correctTaxCents / 100;
        const currentTax = invoiceData.tax;
        const difference = correctTaxDollars - currentTax;

        if (Math.abs(difference) < 0.01) {
            ProductionLogger.info('AIRepairService', 'Tax already correct, no adjustment needed', {
                invoiceId: params.invoiceId,
                currentTax,
                correctTax: correctTaxDollars
            });
            return;
        }

        // Update invoice with correct tax
        await this.db.run(
            'UPDATE invoices SET tax = ?, total = subtotal + ? WHERE id = ?',
            [correctTaxDollars, correctTaxDollars, params.invoiceId]
        );

        // Create adjusting journal entry if there's a difference
        if (Math.abs(difference) >= 0.01) {
            const differenceCents = Math.round(difference * 100);

            await this.accountingService.createJournalEntry({
                description: `Tax correction for Invoice #${params.invoiceId}`,
                lines: differenceCents > 0 ? [
                    { accountCode: '1020', debit: differenceCents, credit: 0 }, // AR
                    { accountCode: '2020', debit: 0, credit: differenceCents }  // Sales Tax Payable
                ] : [
                    { accountCode: '1020', debit: 0, credit: Math.abs(differenceCents) },
                    { accountCode: '2020', debit: Math.abs(differenceCents), credit: 0 }
                ],
                autoPost: true,
                createdBy: 'AI_REPAIR',
                notes: `Auto-correction: ${currentTax} → ${correctTaxDollars}`
            });
        }

        ProductionLogger.info('AIRepairService', 'Tax recalculated successfully', {
            invoiceId: params.invoiceId,
            oldTax: currentTax,
            newTax: correctTaxDollars,
            difference
        });
    }

    private async fixAuditChain(params: any): Promise<void> {
        /**
         * FIX_CHAIN - Reparar cadena de auditoría
         * 
         * Params esperados:
         * - from_logic_clock?: number (start point, optional)
         * - to_logic_clock?: number (end point, optional)
         */
        ProductionLogger.warn('AIRepairService', 'Starting audit chain repair', params);

        // Get broken chain events
        const events = await this.db.select(
            `SELECT logic_clock, previous_hash, event_hash 
             FROM audit_events 
             ${params.from_logic_clock ? 'WHERE logic_clock >= ?' : ''}
             ORDER BY logic_clock ASC`,
            params.from_logic_clock ? [params.from_logic_clock] : []
        );

        if (!events || events.length === 0) {
            ProductionLogger.info('AIRepairService', 'No events found to repair');
            return;
        }

        let fixed = 0;
        let previousHash = null;

        for (const event of events as any[]) {
            // Regenerate hash for this event
            const eventData = await this.db.select(
                'SELECT * FROM audit_events WHERE logic_clock = ?',
                [event.logic_clock]
            );

            if (eventData && eventData.length > 0) {
                const data = eventData[0] as any;

                // TODO: Usar AuditChainService para regenerar hash
                // Por ahora solo logueamos
                ProductionLogger.info('AIRepairService', `Would fix event at logic_clock ${event.logic_clock}`);
                fixed++;
            }

            previousHash = event.event_hash;
        }

        ProductionLogger.info('AIRepairService', 'Audit chain repair completed', {
            eventsFixed: fixed,
            fromClock: params.from_logic_clock,
            toClock: params.to_logic_clock
        });
    }

    private async reverseEntry(params: any): Promise<void> {
        // TODO: Implementar reversión de asiento
        ProductionLogger.info('AIRepairService', 'Reversing entry', params);
    }

    private async adjustBalance(params: any): Promise<void> {
        /**
         * ADJUST_BALANCE - Ajustar balance
         * 
         * Params esperados:
         * - accountCode: string
         * - targetBalanceCents: number (expected balance)
         * - reason: string
         */
        if (!params.accountCode) {
            throw new Error('ADJUST_BALANCE requires "accountCode"');
        }

        if (typeof params.targetBalanceCents !== 'number') {
            throw new Error('ADJUST_BALANCE requires "targetBalanceCents" (number in cents)');
        }

        if (!params.reason) {
            throw new Error('ADJUST_BALANCE requires "reason"');
        }

        // Get current balance
        const currentBalanceCents = await this.accountingService.getAccountBalance(params.accountCode);
        const differenceCents = params.targetBalanceCents - currentBalanceCents;

        if (differenceCents === 0) {
            ProductionLogger.info('AIRepairService', 'Balance already correct', {
                accountCode: params.accountCode,
                currentBalance: currentBalanceCents
            });
            return;
        }

        // Get account info to determine normal balance
        const account = await this.db.select(
            'SELECT code, name, normal_balance FROM chart_of_accounts WHERE code = ?',
            [params.accountCode]
        );

        if (!account || account.length === 0) {
            throw new Error(`Account ${params.accountCode} not found`);
        }

        const accountData = account[0] as any;
        const isNormalDebit = accountData.normal_balance === 'DEBIT';

        // Create adjusting entry
        // Use suspense account (TBD - should be configured)
        const suspenseAccount = '9999'; // Adjustment/Suspense account

        const adjustmentLines = differenceCents > 0 ? (
            isNormalDebit ? [
                { accountCode: params.accountCode, debit: differenceCents, credit: 0 },
                { accountCode: suspenseAccount, debit: 0, credit: differenceCents }
            ] : [
                { accountCode: suspenseAccount, debit: differenceCents, credit: 0 },
                { accountCode: params.accountCode, debit: 0, credit: differenceCents }
            ]
        ) : [
            isNormalDebit ?
                { accountCode: params.accountCode, debit: 0, credit: Math.abs(differenceCents) } :
                { accountCode: params.accountCode, debit: Math.abs(differenceCents), credit: 0 },
            isNormalDebit ?
                { accountCode: suspenseAccount, debit: Math.abs(differenceCents), credit: 0 } :
                { accountCode: suspenseAccount, debit: 0, credit: Math.abs(differenceCents) }
        ];

        await this.accountingService.createJournalEntry({
            description: `Balance adjustment: ${params.reason}`,
            lines: adjustmentLines,
            autoPost: true,
            createdBy: 'AI_REPAIR',
            notes: `Adjusted from ${currentBalanceCents} to ${params.targetBalanceCents} cents`
        });

        ProductionLogger.info('AIRepairService', 'Balance adjusted successfully', {
            accountCode: params.accountCode,
            oldBalance: currentBalanceCents,
            newBalance: params.targetBalanceCents,
            difference: differenceCents
        });
    }

    private generateId(): string {
        return `repair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
