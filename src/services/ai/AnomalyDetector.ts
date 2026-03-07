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

import { db } from '@/database/simple-db';
import { DraftProposalService } from '../DraftProposalService';
import { logger } from '../../core/logging/SystemLogger';

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
          je.entry_date as date,
          je.description,
          SUM(jd.debit) as total_debits,
          SUM(jd.credit) as total_credits
        FROM journal_entries je
        LEFT JOIN journal_details jd ON je.id = jd.journal_id
        WHERE je.status != 'voided'
        GROUP BY je.id
        HAVING ABS(SUM(jd.debit) - SUM(jd.credit)) > 0.01
        ORDER BY je.entry_date DESC
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
          i.id,
          i.invoice_number,
          i.customer_id,
          i.issue_date,
          i.due_date,
          i.total_amount,
          0 as amount_paid, -- Fallback since amount_paid column is missing
          i.total_amount as balance_due,
          julianday('${today}') - julianday(i.due_date) as days_overdue
        FROM invoices i
        WHERE i.status = 'sent'
        AND i.due_date < '${today}'
        AND i.total_amount > 0.01
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
          ca.name as category,
          AVG(jd.debit) as avg_amount,
          COUNT(*) as count
        FROM journal_details jd
        JOIN chart_of_accounts ca ON jd.account_code = ca.code
        WHERE ca.type = 'EXPENSE'
        AND jd.debit > 0
        GROUP BY ca.name
        HAVING COUNT(*) >= 5
      `).all() as any[];

            for (const stat of stats) {
                // Buscar gastos que sean 3x el promedio
                const threshold = stat.avg_amount * 3;

                const outliers = db.prepare(`
          SELECT 
            je.id,
            je.entry_date as date,
            je.description,
            jd.debit as amount,
            ca.name as category
          FROM journal_details jd
          JOIN journal_entries je ON jd.journal_id = je.id
          JOIN chart_of_accounts ca ON jd.account_code = ca.code
          WHERE ca.name = ?
          AND jd.debit > ?
          AND je.entry_date >= date('now', '-90 days')
          AND je.status != 'voided'
          ORDER BY jd.debit DESC
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
          SUM(jd.debit - jd.credit) as balance
        FROM chart_of_accounts a
        LEFT JOIN journal_details jd ON a.code = jd.account_code
        LEFT JOIN journal_entries je ON jd.journal_id = je.id
        WHERE (je.status IS NULL OR je.status != 'voided')
        AND a.type IN ('ASSET', 'EXPENSE')
        GROUP BY a.id, a.code, a.name, a.type
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
