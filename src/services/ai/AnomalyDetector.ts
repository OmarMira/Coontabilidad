/**
 * AnomalyDetector (Iron Clad Upgrade - Phase 3, Day 1)
 * 
 * Servicio de IA que detecta anomalías contables automáticamente y genera propuestas.
 * 
 * Anomalías detectadas:
 * - Asientos descuadrados (partida doble violada)
 * - Facturas vencidas no cobradas
 * - Transacciones duplicadas
 * - Gastos inusuales (outliers)
 * - Cuentas con saldo negativo inesperado
 */

import { db } from '../database/simple-db';
import { DraftProposalService } from './DraftProposalService';
import { logger } from '../utils/logger';

export class AnomalyDetector {
    /**
     * Ejecuta todas las detecciones de anomalías
     */
    static async detectAll(): Promise<void> {
        logger.info('AnomalyDetector', 'scan_start', 'Iniciando escaneo de anomalías');

        try {
            await Promise.all([
                this.detectUnbalancedEntries(),
                this.detectOverdueInvoices(),
                this.detectDuplicateTransactions(),
                this.detectUnusualExpenses(),
                this.detectNegativeBalances()
            ]);

            logger.info('AnomalyDetector', 'scan_complete', 'Escaneo completado');
        } catch (error) {
            logger.error('AnomalyDetector', 'scan_failed', 'Error en escaneo', null, error as Error);
        }
    }

    /**
     * Detecta asientos contables descuadrados
     */
    static async detectUnbalancedEntries(): Promise<void> {
        if (!db) return;

        try {
            // Buscar asientos donde débitos != créditos
            const unbalanced = db.prepare(`
        SELECT 
          je.id,
          je.date,
          je.description,
          SUM(CASE WHEN jel.type = 'debit' THEN jel.amount ELSE 0 END) as total_debits,
          SUM(CASE WHEN jel.type = 'credit' THEN jel.amount ELSE 0 END) as total_credits
        FROM journal_entries je
        LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        WHERE je.status != 'voided'
        GROUP BY je.id
        HAVING ABS(total_debits - total_credits) > 0.01
        ORDER BY je.date DESC
        LIMIT 10
      `).all() as any[];

            for (const entry of unbalanced) {
                const difference = entry.total_debits - entry.total_credits;

                await DraftProposalService.createProposal(
                    'accounting',
                    'CORRECT_JOURNAL_ENTRY',
                    {
                        journalEntryId: entry.id,
                        date: entry.date,
                        description: entry.description,
                        totalDebits: entry.total_debits,
                        totalCredits: entry.total_credits,
                        difference: difference,
                        suggestedCorrection: {
                            account: difference > 0 ? 'Suspense Account (Credit)' : 'Suspense Account (Debit)',
                            amount: Math.abs(difference),
                            type: difference > 0 ? 'credit' : 'debit'
                        }
                    },
                    `Asiento descuadrado detectado: Débitos ($${entry.total_debits.toFixed(2)}) != Créditos ($${entry.total_credits.toFixed(2)}). Diferencia: $${Math.abs(difference).toFixed(2)}`
                );

                logger.warn('AnomalyDetector', 'unbalanced_entry', `Asiento ${entry.id} descuadrado por $${Math.abs(difference).toFixed(2)}`);
            }

            if (unbalanced.length > 0) {
                logger.info('AnomalyDetector', 'unbalanced_found', `${unbalanced.length} asientos descuadrados detectados`);
            }
        } catch (error) {
            logger.error('AnomalyDetector', 'unbalanced_check_failed', 'Error al detectar asientos descuadrados', null, error as Error);
        }
    }

    /**
     * Detecta facturas vencidas no cobradas
     */
    static async detectOverdueInvoices(): Promise<void> {
        if (!db) return;

        try {
            const today = new Date().toISOString().split('T')[0];

            // Buscar facturas vencidas con saldo pendiente
            const overdue = db.prepare(`
        SELECT 
          id,
          invoice_number,
          customer_id,
          issue_date,
          due_date,
          total_amount,
          amount_paid,
          (total_amount - amount_paid) as balance_due,
          julianday('${today}') - julianday(due_date) as days_overdue
        FROM invoices
        WHERE status = 'sent'
        AND due_date < '${today}'
        AND (total_amount - amount_paid) > 0.01
        ORDER BY days_overdue DESC
        LIMIT 20
      `).all() as any[];

            for (const invoice of overdue) {
                // Solo crear propuesta si está muy vencida (>30 días)
                if (invoice.days_overdue > 30) {
                    await DraftProposalService.createProposal(
                        'accounting',
                        'SEND_PAYMENT_REMINDER',
                        {
                            invoiceId: invoice.id,
                            invoiceNumber: invoice.invoice_number,
                            customerId: invoice.customer_id,
                            dueDate: invoice.due_date,
                            balanceDue: invoice.balance_due,
                            daysOverdue: Math.floor(invoice.days_overdue),
                            suggestedAction: 'send_reminder_email'
                        },
                        `Factura ${invoice.invoice_number} vencida hace ${Math.floor(invoice.days_overdue)} días. Saldo pendiente: $${invoice.balance_due.toFixed(2)}`
                    );
                }
            }

            if (overdue.length > 0) {
                logger.info('AnomalyDetector', 'overdue_found', `${overdue.length} facturas vencidas detectadas`);
            }
        } catch (error) {
            logger.error('AnomalyDetector', 'overdue_check_failed', 'Error al detectar facturas vencidas', null, error as Error);
        }
    }

    /**
     * Detecta transacciones duplicadas
     */
    static async detectDuplicateTransactions(): Promise<void> {
        if (!db) return;

        try {
            // Buscar transacciones con mismo monto, fecha y descripción
            const duplicates = db.prepare(`
        SELECT 
          date,
          description,
          amount,
          COUNT(*) as count,
          GROUP_CONCAT(id) as transaction_ids
        FROM bank_transactions
        WHERE status != 'voided'
        AND date >= date('now', '-90 days')
        GROUP BY date, description, amount
        HAVING COUNT(*) > 1
        ORDER BY count DESC, date DESC
        LIMIT 10
      `).all() as any[];

            for (const dup of duplicates) {
                const ids = dup.transaction_ids.split(',');

                await DraftProposalService.createProposal(
                    'accounting',
                    'REVIEW_DUPLICATES',
                    {
                        date: dup.date,
                        description: dup.description,
                        amount: dup.amount,
                        count: dup.count,
                        transactionIds: ids,
                        suggestedAction: 'review_and_void_duplicates'
                    },
                    `${dup.count} transacciones duplicadas detectadas: ${dup.description} por $${dup.amount.toFixed(2)} el ${dup.date}`
                );
            }

            if (duplicates.length > 0) {
                logger.info('AnomalyDetector', 'duplicates_found', `${duplicates.length} grupos de duplicados detectados`);
            }
        } catch (error) {
            logger.error('AnomalyDetector', 'duplicate_check_failed', 'Error al detectar duplicados', null, error as Error);
        }
    }

    /**
     * Detecta gastos inusuales (outliers)
     */
    static async detectUnusualExpenses(): Promise<void> {
        if (!db) return;

        try {
            // Calcular promedio y desviación estándar de gastos por categoría
            const stats = db.prepare(`
        SELECT 
          category,
          AVG(amount) as avg_amount,
          COUNT(*) as count
        FROM expenses
        WHERE date >= date('now', '-180 days')
        AND status != 'voided'
        GROUP BY category
        HAVING COUNT(*) >= 5
      `).all() as any[];

            for (const stat of stats) {
                // Buscar gastos que sean 3x el promedio
                const threshold = stat.avg_amount * 3;

                const outliers = db.prepare(`
          SELECT 
            id,
            date,
            description,
            amount,
            category
          FROM expenses
          WHERE category = ?
          AND amount > ?
          AND date >= date('now', '-90 days')
          AND status != 'voided'
          ORDER BY amount DESC
          LIMIT 5
        `).all(stat.category, threshold) as any[];

                for (const expense of outliers) {
                    await DraftProposalService.createProposal(
                        'accounting',
                        'REVIEW_UNUSUAL_EXPENSE',
                        {
                            expenseId: expense.id,
                            date: expense.date,
                            description: expense.description,
                            amount: expense.amount,
                            category: expense.category,
                            averageAmount: stat.avg_amount,
                            threshold: threshold,
                            suggestedAction: 'verify_expense_legitimacy'
                        },
                        `Gasto inusual detectado: $${expense.amount.toFixed(2)} en ${expense.category} (promedio: $${stat.avg_amount.toFixed(2)})`
                    );
                }
            }
        } catch (error) {
            logger.error('AnomalyDetector', 'unusual_check_failed', 'Error al detectar gastos inusuales', null, error as Error);
        }
    }

    /**
     * Detecta cuentas con saldo negativo inesperado
     */
    static async detectNegativeBalances(): Promise<void> {
        if (!db) return;

        try {
            // Buscar cuentas de activo con saldo negativo
            const negative = db.prepare(`
        SELECT 
          a.id,
          a.code,
          a.name,
          a.type,
          SUM(CASE WHEN jel.type = 'debit' THEN jel.amount ELSE -jel.amount END) as balance
        FROM accounts a
        LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
        LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id
        WHERE je.status != 'voided'
        AND a.type IN ('asset', 'expense')
        GROUP BY a.id
        HAVING balance < -0.01
        ORDER BY balance ASC
        LIMIT 10
      `).all() as any[];

            for (const account of negative) {
                await DraftProposalService.createProposal(
                    'accounting',
                    'REVIEW_NEGATIVE_BALANCE',
                    {
                        accountId: account.id,
                        accountCode: account.code,
                        accountName: account.name,
                        accountType: account.type,
                        balance: account.balance,
                        suggestedAction: 'review_account_transactions'
                    },
                    `Cuenta ${account.code} - ${account.name} tiene saldo negativo: $${account.balance.toFixed(2)}`
                );
            }

            if (negative.length > 0) {
                logger.info('AnomalyDetector', 'negative_found', `${negative.length} cuentas con saldo negativo detectadas`);
            }
        } catch (error) {
            logger.error('AnomalyDetector', 'negative_check_failed', 'Error al detectar saldos negativos', null, error as Error);
        }
    }

    /**
     * Programa escaneo automático cada hora
     */
    static scheduleAutoScan(): void {
        // Ejecutar inmediatamente
        this.detectAll();

        // Luego cada hora
        setInterval(() => {
            this.detectAll();
        }, 60 * 60 * 1000); // 1 hora

        logger.info('AnomalyDetector', 'auto_scan_scheduled', 'Escaneo automático programado cada hora');
    }
}
