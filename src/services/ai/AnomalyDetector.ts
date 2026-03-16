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

import { db, getDBEngine } from '@/database/modules/db-core';
import { DraftProposalService } from '../DraftProposalService';
import { logger } from '../../core/logging/SystemLogger';

export class AnomalyDetector {
    private static get engine() {
        return getDBEngine();
    }

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
            const unbalanced = await this.engine.select(`
        SELECT 
          je.id,
          je.entry_date as date,
          je.description,
          je.total_debit as total_debits,
          je.total_credit as total_credits
        FROM journal_entries je
        WHERE je.is_balanced = 0
        ORDER BY je.entry_date DESC
        LIMIT 10
      `);

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
            const overdue = await this.engine.select(`
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
      `);

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
            const duplicates = await this.engine.select(`
        SELECT 
          transaction_date as date,
          description,
          amount,
          COUNT(*) as count,
          GROUP_CONCAT(id) as transaction_ids
        FROM bank_transactions
        WHERE status != 'voided'
        AND transaction_date >= date('now', '-90 days')
        GROUP BY transaction_date, description, amount
        HAVING COUNT(*) > 1
        ORDER BY count DESC, transaction_date DESC
        LIMIT 10
      `);

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
            const stats = await this.engine.select(`
        SELECT 
          ca.account_name as category,
          AVG(jd.debit_amount) as avg_amount,
          COUNT(*) as count
        FROM journal_details jd
        JOIN chart_of_accounts ca ON jd.account_code = ca.account_code
        WHERE ca.account_type = 'expense'
        AND jd.debit_amount > 0
        GROUP BY ca.account_name
        HAVING COUNT(*) >= 5
      `);

            for (const stat of stats) {
                // Buscar gastos que sean 3x el promedio
                const threshold = stat.avg_amount * 3;

                const outliers = await this.engine.select(`
          SELECT 
            je.id,
            je.entry_date as date,
            je.description,
            jd.debit_amount as amount,
            ca.account_name as category
          FROM journal_details jd
          JOIN journal_entries je ON jd.journal_entry_id = je.id
          JOIN chart_of_accounts ca ON jd.account_code = ca.account_code
          WHERE ca.account_name = ?
          AND jd.debit_amount > ?
          AND je.entry_date >= date('now', '-90 days')
          ORDER BY jd.debit_amount DESC
          LIMIT 5
        `, [stat.category, threshold]);

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
            const negative = await this.engine.select(`
        SELECT 
          a.id,
          a.account_code as code,
          a.account_name as name,
          a.account_type as type,
          SUM(jd.debit_amount - jd.credit_amount) as balance
        FROM chart_of_accounts a
        LEFT JOIN journal_details jd ON a.account_code = jd.account_code
        LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
        WHERE a.account_type IN ('asset', 'expense')
        GROUP BY a.id, a.account_code, a.account_name, a.account_type
        HAVING balance < -0.01
        ORDER BY balance ASC
        LIMIT 10
      `);

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
