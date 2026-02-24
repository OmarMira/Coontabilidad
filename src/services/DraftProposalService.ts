import { DatabaseService } from '../database/DatabaseService';
import { logger } from '../utils/logger';

/**
 * DraftProposalService (Iron Clad Upgrade - Phase 3)
 * Allows AI or users to propose transactions without affecting the main ledger.
 * Updated to support AI-generated proposals with enhanced logging.
 */
export class DraftProposalService {

    /**
     * Creates a new draft proposal (overloaded for backward compatibility)
     */
    static async createProposal(
        moduleOrProposal: string | { module: string; operation: string; payload: any; reason: string },
        operation?: string,
        payload?: any,
        reason?: string
    ): Promise<number> {
        let module: string;
        let op: string;
        let pl: any;
        let rs: string;

        // Support both old and new signatures
        if (typeof moduleOrProposal === 'object') {
            module = moduleOrProposal.module;
            op = moduleOrProposal.operation;
            pl = moduleOrProposal.payload;
            rs = moduleOrProposal.reason;
        } else {
            module = moduleOrProposal;
            op = operation!;
            pl = payload!;
            rs = reason!;
        }

        const payloadStr = JSON.stringify(pl);

        const result = await DatabaseService.executeQuery(`
            INSERT INTO draft_transactions (module, operation, payload, ai_proposal_reason, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'draft', datetime('now'), datetime('now'))
            RETURNING id
        `, [module, op, payloadStr, rs]);

        const proposalId = result[0].id;

        logger.info('DraftProposalService', 'proposal_created', `Propuesta creada: ${module}/${op}`, {
            proposalId,
            module,
            operation: op
        });

        return proposalId;
    }

    /**
     * Lists all pending proposals for the "Human-in-the-Loop" UI.
     */
    static async getPendingProposals(): Promise<any[]> {
        return await DatabaseService.executeQuery(`
            SELECT * FROM draft_transactions WHERE status = 'draft' ORDER BY created_at DESC
        `);
    }

    /**
     * Approves a proposal and promotes it to a real transaction.
     */
    static async approveProposal(id: number): Promise<void> {
        const proposals = await DatabaseService.executeQuery(`SELECT * FROM draft_transactions WHERE id = ?`, [id]);

        if (proposals.length === 0) {
            throw new Error(`Proposal ${id} not found`);
        }

        const proposal = proposals[0];
        const payload = JSON.parse(proposal.payload);

        try {
            await this.promoteToTransaction(proposal.module, proposal.operation, payload);

            await DatabaseService.executeQuery(`
                UPDATE draft_transactions 
                SET status = 'approved', updated_at = datetime('now') 
                WHERE id = ?
            `, [id]);

            logger.info('DraftProposalService', 'proposal_approved', `Propuesta ${id} aprobada y ejecutada`);
        } catch (error) {
            logger.error('DraftProposalService', 'approval_failed', `Fallo al aprobar propuesta ${id}`, null, error as Error);
            throw error;
        }
    }

    /**
     * Executes the actual business logic for a proposal. (DAC Phase 3 Implementation)
     */
    private static async promoteToTransaction(module: string, operation: string, payload: any): Promise<void> {
        logger.info('DraftProposalService', 'promoting_draft', `Promocionando draft: ${module}/${operation}`);

        switch (operation) {
            case 'CORRECT_JOURNAL_ENTRY':
                // Crear un asiento de ajuste para balancear el registro descuadrado
                await DatabaseService.insertJournalEntry({
                    description: `AJUSTE IA: ${payload.description}`,
                    date: new Date().toISOString().split('T')[0],
                    userId: 0, // AI System User
                    items: [
                        {
                            account_code: payload.suggestedCorrection.account.includes('Debit') ? '9999' : '1010', // Simplified
                            debit: payload.suggestedCorrection.type === 'debit' ? payload.suggestedCorrection.amount : 0,
                            credit: payload.suggestedCorrection.type === 'credit' ? payload.suggestedCorrection.amount : 0,
                            description: `Corrección automática por desbalance en JE #${payload.journalEntryId}`
                        },
                        // Línea de contrapartida para mantener balance (usualmente contra una cuenta de ajuste)
                        {
                            account_code: payload.suggestedCorrection.account.includes('Debit') ? '1010' : '9999',
                            debit: payload.suggestedCorrection.type === 'credit' ? payload.suggestedCorrection.amount : 0,
                            credit: payload.suggestedCorrection.type === 'debit' ? payload.suggestedCorrection.amount : 0,
                            description: `Contrapartida de ajuste IA`
                        }
                    ]
                });
                break;

            case 'REVIEW_DUPLICATES':
                // Si el usuario aprueba que son duplicados, anulamos los sobrantes
                if (payload.transactionIds && payload.transactionIds.length > 1) {
                    const toVoid = payload.transactionIds.slice(1);
                    for (const voidId of toVoid) {
                        await DatabaseService.executeQuery(`UPDATE bank_transactions SET status = 'voided' WHERE id = ?`, [voidId]);
                    }
                }
                break;

            case 'UPDATE_ACCOUNT':
                await DatabaseService.executeQuery(`
                    UPDATE chart_of_accounts 
                    SET name = ?, is_active = ?, description = ? 
                    WHERE code = ?
                `, [payload.name, payload.is_active ? 1 : 0, payload.description, payload.accountCode]);
                break;

            default:
                logger.warn('DraftProposalService', 'unsupported_promotion', `Operación no soportada para promoción automática: ${operation}. Requiere intervención manual.`);
                throw new Error(`Operación ${operation} no tiene handler de promoción automática.`);
        }
    }

    /**
     * Rejects a proposal.
     */
    static async rejectProposal(id: number): Promise<void> {
        await DatabaseService.executeQuery(`
            UPDATE draft_transactions 
            SET status = 'rejected', updated_at = datetime('now') 
            WHERE id = ?
        `, [id]);

        logger.info('DraftProposalService', 'proposal_rejected', `Propuesta ${id} rechazada`);
    }
}

