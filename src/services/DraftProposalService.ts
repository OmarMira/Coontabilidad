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
     * Approves a proposal and promotes it (placeholder for promotion logic).
     */
    static async approveProposal(id: number): Promise<void> {
        // Here you would implement the logic to execute the payload 
        // through the TransactionManager to the real DB.

        await DatabaseService.executeQuery(`
            UPDATE draft_transactions 
            SET status = 'approved', updated_at = datetime('now') 
            WHERE id = ?
        `, [id]);

        logger.info('DraftProposalService', 'proposal_approved', `Propuesta ${id} aprobada`);
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

