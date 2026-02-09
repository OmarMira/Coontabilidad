/**
 * AIProposalPanel Integration Tests (Iron Clad Upgrade - Phase 3, Day 4)
 * 
 * Tests de integración para el panel de propuestas de IA
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIProposalPanel } from '../../components/ai/AIProposalPanel';
import { DraftProposalService } from '../../services/DraftProposalService';

// Mock DraftProposalService
vi.mock('../../services/DraftProposalService', () => ({
    DraftProposalService: {
        getPendingProposals: vi.fn(),
        approveProposal: vi.fn(),
        rejectProposal: vi.fn()
    }
}));

// Mock window.confirm and window.alert
global.confirm = vi.fn(() => true);
global.alert = vi.fn();

describe('AIProposalPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Empty State', () => {
        it('should show empty state when no proposals', async () => {
            (DraftProposalService.getPendingProposals as any).mockResolvedValue([]);

            render(<AIProposalPanel />);

            await waitFor(() => {
                expect(screen.getByText(/No hay propuestas pendientes/i)).toBeInTheDocument();
            });
        });

        it('should show monitoring message in empty state', async () => {
            (DraftProposalService.getPendingProposals as any).mockResolvedValue([]);

            render(<AIProposalPanel />);

            await waitFor(() => {
                expect(screen.getByText(/monitoreando tu contabilidad/i)).toBeInTheDocument();
            });
        });
    });

    describe('Loading State', () => {
        it('should show loading spinner initially', () => {
            (DraftProposalService.getPendingProposals as any).mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve([]), 1000))
            );

            render(<AIProposalPanel />);

            expect(screen.getByText(/Cargando propuestas/i)).toBeInTheDocument();
        });
    });

    describe('Proposals Display', () => {
        const mockProposals = [
            {
                id: 1,
                module: 'accounting',
                operation: 'CORRECT_JOURNAL_ENTRY',
                payload: JSON.stringify({
                    journalEntryId: 123,
                    difference: 0.50
                }),
                ai_proposal_reason: 'Asiento descuadrado detectado',
                status: 'draft',
                created_at: '2026-02-08T12:00:00Z'
            },
            {
                id: 2,
                module: 'accounting',
                operation: 'SEND_PAYMENT_REMINDER',
                payload: JSON.stringify({
                    invoiceNumber: 'INV-001',
                    daysOverdue: 45
                }),
                ai_proposal_reason: 'Factura vencida hace 45 días',
                status: 'draft',
                created_at: '2026-02-08T13:00:00Z'
            }
        ];

        it('should display all pending proposals', async () => {
            (DraftProposalService.getPendingProposals as any).mockResolvedValue(mockProposals);

            render(<AIProposalPanel />);

            await waitFor(() => {
                expect(screen.getByText(/Propuestas de la IA/i)).toBeInTheDocument();
                expect(screen.getByText(/2/)).toBeInTheDocument(); // Badge count
            });
        });

        it('should show proposal details', async () => {
            (DraftProposalService.getPendingProposals as any).mockResolvedValue([mockProposals[0]]);

            render(<AIProposalPanel />);

            await waitFor(() => {
                expect(screen.getByText('accounting')).toBeInTheDocument();
                expect(screen.getByText('CORRECT_JOURNAL_ENTRY')).toBeInTheDocument();
                expect(screen.getByText(/Asiento descuadrado/i)).toBeInTheDocument();
            });
        });

        it('should display formatted payload', async () => {
            (DraftProposalService.getPendingProposals as any).mockResolvedValue([mockProposals[0]]);

            render(<AIProposalPanel />);

            await waitFor(() => {
                expect(screen.getByText(/journalEntryId/i)).toBeInTheDocument();
                expect(screen.getByText(/123/)).toBeInTheDocument();
            });
        });
    });

    describe('Approve Proposal', () => {
        it('should call approveProposal when approved', async () => {
            const mockProposals = [{
                id: 1,
                module: 'accounting',
                operation: 'CORRECT_JOURNAL_ENTRY',
                payload: '{}',
                ai_proposal_reason: 'Test',
                status: 'draft',
                created_at: '2026-02-08T12:00:00Z'
            }];

            (DraftProposalService.getPendingProposals as any).mockResolvedValue(mockProposals);
            (DraftProposalService.approveProposal as any).mockResolvedValue(undefined);

            render(<AIProposalPanel />);

            await waitFor(() => {
                expect(screen.getByText(/✅ Aprobar/i)).toBeInTheDocument();
            });

            const approveButton = screen.getByText(/✅ Aprobar/i);
            fireEvent.click(approveButton);

            await waitFor(() => {
                expect(global.confirm).toHaveBeenCalledWith('¿Aprobar esta propuesta de la IA?');
                expect(DraftProposalService.approveProposal).toHaveBeenCalledWith(1);
            });
        });

        it('should show success message after approval', async () => {
            const mockProposals = [{
                id: 1,
                module: 'accounting',
                operation: 'CORRECT_JOURNAL_ENTRY',
                payload: '{}',
                ai_proposal_reason: 'Test',
                status: 'draft',
                created_at: '2026-02-08T12:00:00Z'
            }];

            (DraftProposalService.getPendingProposals as any).mockResolvedValue(mockProposals);
            (DraftProposalService.approveProposal as any).mockResolvedValue(undefined);

            render(<AIProposalPanel />);

            await waitFor(() => {
                expect(screen.getByText(/✅ Aprobar/i)).toBeInTheDocument();
            });

            const approveButton = screen.getByText(/✅ Aprobar/i);
            fireEvent.click(approveButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('✅ Propuesta aprobada y ejecutada');
            });
        });

        it('should handle approval errors', async () => {
            const mockProposals = [{
                id: 1,
                module: 'accounting',
                operation: 'CORRECT_JOURNAL_ENTRY',
                payload: '{}',
                ai_proposal_reason: 'Test',
                status: 'draft',
                created_at: '2026-02-08T12:00:00Z'
            }];

            (DraftProposalService.getPendingProposals as any).mockResolvedValue(mockProposals);
            (DraftProposalService.approveProposal as any).mockRejectedValue(new Error('Test error'));

            render(<AIProposalPanel />);

            await waitFor(() => {
                expect(screen.getByText(/✅ Aprobar/i)).toBeInTheDocument();
            });

            const approveButton = screen.getByText(/✅ Aprobar/i);
            fireEvent.click(approveButton);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Error al aprobar'));
            });
        });
    });

    describe('Reject Proposal', () => {
        it('should call rejectProposal when rejected', async () => {
            const mockProposals = [{
                id: 1,
                module: 'accounting',
                operation: 'CORRECT_JOURNAL_ENTRY',
                payload: '{}',
                ai_proposal_reason: 'Test',
                status: 'draft',
                created_at: '2026-02-08T12:00:00Z'
            }];

            (DraftProposalService.getPendingProposals as any).mockResolvedValue(mockProposals);
            (DraftProposalService.rejectProposal as any).mockResolvedValue(undefined);

            render(<AIProposalPanel />);

            await waitFor(() => {
                expect(screen.getByText(/❌ Rechazar/i)).toBeInTheDocument();
            });

            const rejectButton = screen.getByText(/❌ Rechazar/i);
            fireEvent.click(rejectButton);

            await waitFor(() => {
                expect(global.confirm).toHaveBeenCalledWith('¿Rechazar esta propuesta?');
                expect(DraftProposalService.rejectProposal).toHaveBeenCalledWith(1);
            });
        });
    });

    describe('Auto-refresh', () => {
        it('should refresh proposals every 30 seconds', async () => {
            vi.useFakeTimers();

            (DraftProposalService.getPendingProposals as any).mockResolvedValue([]);

            render(<AIProposalPanel />);

            await waitFor(() => {
                expect(DraftProposalService.getPendingProposals).toHaveBeenCalledTimes(1);
            });

            // Fast-forward 30 seconds
            vi.advanceTimersByTime(30000);

            await waitFor(() => {
                expect(DraftProposalService.getPendingProposals).toHaveBeenCalledTimes(2);
            });

            vi.useRealTimers();
        });
    });

    describe('Module Badge Colors', () => {
        it('should show correct color for accounting module', async () => {
            const mockProposals = [{
                id: 1,
                module: 'accounting',
                operation: 'TEST',
                payload: '{}',
                ai_proposal_reason: 'Test',
                status: 'draft',
                created_at: '2026-02-08T12:00:00Z'
            }];

            (DraftProposalService.getPendingProposals as any).mockResolvedValue(mockProposals);

            const { container } = render(<AIProposalPanel />);

            await waitFor(() => {
                const badge = container.querySelector('[style*="backgroundColor"]');
                expect(badge).toBeInTheDocument();
            });
        });
    });
});
