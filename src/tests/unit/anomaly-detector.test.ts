/**
 * AnomalyDetector Tests (Iron Clad Upgrade - Phase 3, Day 4)
 * 
 * Tests unitarios para el detector de anomalías de IA
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnomalyDetector } from '../../services/ai/AnomalyDetector';
import { DraftProposalService } from '../../services/DraftProposalService';
import { DatabaseService } from '../../database/DatabaseService';

// Mock DraftProposalService
vi.mock('../../services/DraftProposalService', () => ({
    DraftProposalService: {
        createProposal: vi.fn()
    }
}));

describe('AnomalyDetector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Unbalanced Entries Detection', () => {
        it('should detect unbalanced journal entries', async () => {
            // Mock database with unbalanced entry
            const mockDb = {
                prepare: vi.fn().mockReturnValue({
                    all: vi.fn().mockReturnValue([
                        {
                            id: 1,
                            date: '2026-02-08',
                            description: 'Test Entry',
                            total_debits: 1000.00,
                            total_credits: 999.50
                        }
                    ])
                })
            };

            // Temporarily replace db
            const originalDb = (global as any).db;
            (global as any).db = mockDb;

            await AnomalyDetector.detectUnbalancedEntries();

            expect(DraftProposalService.createProposal).toHaveBeenCalledWith(
                'accounting',
                'CORRECT_JOURNAL_ENTRY',
                expect.objectContaining({
                    journalEntryId: 1,
                    difference: 0.50
                }),
                expect.stringContaining('Asiento descuadrado')
            );

            // Restore original db
            (global as any).db = originalDb;
        });

        it('should not create proposal for balanced entries', async () => {
            const mockDb = {
                prepare: vi.fn().mockReturnValue({
                    all: vi.fn().mockReturnValue([])
                })
            };

            const originalDb = (global as any).db;
            (global as any).db = mockDb;

            await AnomalyDetector.detectUnbalancedEntries();

            expect(DraftProposalService.createProposal).not.toHaveBeenCalled();

            (global as any).db = originalDb;
        });
    });

    describe('Overdue Invoices Detection', () => {
        it('should detect overdue invoices (>30 days)', async () => {
            const mockDb = {
                prepare: vi.fn().mockReturnValue({
                    all: vi.fn().mockReturnValue([
                        {
                            id: 1,
                            invoice_number: 'INV-001',
                            customer_id: 1,
                            due_date: '2025-12-01',
                            balance_due: 5000.00,
                            days_overdue: 69
                        }
                    ])
                })
            };

            const originalDb = (global as any).db;
            (global as any).db = mockDb;

            await AnomalyDetector.detectOverdueInvoices();

            expect(DraftProposalService.createProposal).toHaveBeenCalledWith(
                'accounting',
                'SEND_PAYMENT_REMINDER',
                expect.objectContaining({
                    invoiceNumber: 'INV-001',
                    daysOverdue: 69
                }),
                expect.stringContaining('vencida hace 69 días')
            );

            (global as any).db = originalDb;
        });

        it('should not create proposal for invoices <30 days overdue', async () => {
            const mockDb = {
                prepare: vi.fn().mockReturnValue({
                    all: vi.fn().mockReturnValue([
                        {
                            id: 1,
                            invoice_number: 'INV-002',
                            days_overdue: 15
                        }
                    ])
                })
            };

            const originalDb = (global as any).db;
            (global as any).db = mockDb;

            await AnomalyDetector.detectOverdueInvoices();

            expect(DraftProposalService.createProposal).not.toHaveBeenCalled();

            (global as any).db = originalDb;
        });
    });

    describe('Duplicate Transactions Detection', () => {
        it('should detect duplicate transactions', async () => {
            const mockDb = {
                prepare: vi.fn().mockReturnValue({
                    all: vi.fn().mockReturnValue([
                        {
                            date: '2026-02-01',
                            description: 'Pago a Proveedor XYZ',
                            amount: 1000.00,
                            count: 3,
                            transaction_ids: '1,2,3'
                        }
                    ])
                })
            };

            const originalDb = (global as any).db;
            (global as any).db = mockDb;

            await AnomalyDetector.detectDuplicateTransactions();

            expect(DraftProposalService.createProposal).toHaveBeenCalledWith(
                'accounting',
                'REVIEW_DUPLICATES',
                expect.objectContaining({
                    count: 3,
                    transactionIds: ['1', '2', '3']
                }),
                expect.stringContaining('3 transacciones duplicadas')
            );

            (global as any).db = originalDb;
        });
    });

    describe('Unusual Expenses Detection', () => {
        it('should detect expenses >3x average', async () => {
            const mockDb = {
                prepare: vi.fn()
                    .mockReturnValueOnce({
                        all: vi.fn().mockReturnValue([
                            {
                                category: 'Office Supplies',
                                avg_amount: 150.00,
                                count: 10
                            }
                        ])
                    })
                    .mockReturnValueOnce({
                        all: vi.fn().mockReturnValue([
                            {
                                id: 1,
                                date: '2026-02-08',
                                description: 'Large purchase',
                                amount: 5000.00,
                                category: 'Office Supplies'
                            }
                        ])
                    })
            };

            const originalDb = (global as any).db;
            (global as any).db = mockDb;

            await AnomalyDetector.detectUnusualExpenses();

            expect(DraftProposalService.createProposal).toHaveBeenCalledWith(
                'accounting',
                'REVIEW_UNUSUAL_EXPENSE',
                expect.objectContaining({
                    amount: 5000.00,
                    averageAmount: 150.00
                }),
                expect.stringContaining('Gasto inusual')
            );

            (global as any).db = originalDb;
        });
    });

    describe('Negative Balances Detection', () => {
        it('should detect negative balances in asset accounts', async () => {
            const mockDb = {
                prepare: vi.fn().mockReturnValue({
                    all: vi.fn().mockReturnValue([
                        {
                            id: 1,
                            code: '1010',
                            name: 'Cash',
                            type: 'asset',
                            balance: -250.00
                        }
                    ])
                })
            };

            const originalDb = (global as any).db;
            (global as any).db = mockDb;

            await AnomalyDetector.detectNegativeBalances();

            expect(DraftProposalService.createProposal).toHaveBeenCalledWith(
                'accounting',
                'REVIEW_NEGATIVE_BALANCE',
                expect.objectContaining({
                    accountCode: '1010',
                    balance: -250.00
                }),
                expect.stringContaining('saldo negativo')
            );

            (global as any).db = originalDb;
        });
    });

    describe('detectAll', () => {
        it('should run all detection methods', async () => {
            const detectUnbalancedSpy = vi.spyOn(AnomalyDetector, 'detectUnbalancedEntries').mockResolvedValue();
            const detectOverdueSpy = vi.spyOn(AnomalyDetector, 'detectOverdueInvoices').mockResolvedValue();
            const detectDuplicatesSpy = vi.spyOn(AnomalyDetector, 'detectDuplicateTransactions').mockResolvedValue();
            const detectUnusualSpy = vi.spyOn(AnomalyDetector, 'detectUnusualExpenses').mockResolvedValue();
            const detectNegativeSpy = vi.spyOn(AnomalyDetector, 'detectNegativeBalances').mockResolvedValue();

            await AnomalyDetector.detectAll();

            expect(detectUnbalancedSpy).toHaveBeenCalled();
            expect(detectOverdueSpy).toHaveBeenCalled();
            expect(detectDuplicatesSpy).toHaveBeenCalled();
            expect(detectUnusualSpy).toHaveBeenCalled();
            expect(detectNegativeSpy).toHaveBeenCalled();

            detectUnbalancedSpy.mockRestore();
            detectOverdueSpy.mockRestore();
            detectDuplicatesSpy.mockRestore();
            detectUnusualSpy.mockRestore();
            detectNegativeSpy.mockRestore();
        });

        it('should handle errors gracefully', async () => {
            const detectUnbalancedSpy = vi.spyOn(AnomalyDetector, 'detectUnbalancedEntries').mockRejectedValue(new Error('Test error'));

            await expect(AnomalyDetector.detectAll()).resolves.not.toThrow();

            detectUnbalancedSpy.mockRestore();
        });
    });

    describe('scheduleAutoScan', () => {
        it('should schedule automatic scanning', () => {
            const setIntervalSpy = vi.spyOn(global, 'setInterval');
            const detectAllSpy = vi.spyOn(AnomalyDetector, 'detectAll').mockResolvedValue();

            AnomalyDetector.scheduleAutoScan();

            expect(detectAllSpy).toHaveBeenCalled(); // Immediate execution
            expect(setIntervalSpy).toHaveBeenCalledWith(
                expect.any(Function),
                60 * 60 * 1000 // 1 hour
            );

            setIntervalSpy.mockRestore();
            detectAllSpy.mockRestore();
        });
    });
});
