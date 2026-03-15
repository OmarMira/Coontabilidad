/**
 * Módulo 21 — Trial Balance e Income Statement Reports
 * Extraído de simple-db.ts líneas 11056–11269
 */

import { db } from '../simple-db';
import { logger } from '../../core/logging/SystemLogger';

export interface TrialBalanceItem {
  account_code: string;
  number?: string;
  account_name: string;
  account_type: string;
  normal_balance: 'debit' | 'credit';
  initial_balance: number;
  period_debit: number;
  period_credit: number;
  total_debit: number;
  total_credit: number;
  final_balance: number;
  previous_debit: number;
  previous_credit: number;
}

export interface IncomeStatementItem {
  account_code: string;
  number?: string;
  account_name: string;
  account_type: string;
  balance: number;
}

export function getTrialBalanceReport(year: number, month: number): TrialBalanceItem[] {
  if (!db) return [];

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = new Date(nextYear, nextMonth - 1, 0).toISOString().split('T')[0];

  try {
    const query = `
      SELECT
        ca.account_code,
        ca.number,
        ca.account_name,
        ca.account_type,
        ca.normal_balance,
        COALESCE(SUM(CASE WHEN je.entry_date < ? THEN jd.debit_amount ELSE 0 END), 0) as prev_debit,
        COALESCE(SUM(CASE WHEN je.entry_date < ? THEN jd.credit_amount ELSE 0 END), 0) as prev_credit,
        COALESCE(SUM(CASE WHEN je.entry_date BETWEEN ? AND ? THEN jd.debit_amount ELSE 0 END), 0) as period_debit,
        COALESCE(SUM(CASE WHEN je.entry_date BETWEEN ? AND ? THEN jd.credit_amount ELSE 0 END), 0) as period_credit
      FROM chart_of_accounts ca
      LEFT JOIN journal_details jd ON ca.account_code = jd.account_code
      LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE ca.is_active = 1
      GROUP BY ca.account_code, ca.number, ca.account_name, ca.account_type, ca.normal_balance
      HAVING prev_debit != 0 OR prev_credit != 0 OR period_debit != 0 OR period_credit != 0
      ORDER BY ca.account_code ASC
    `;

    const result = db.exec(query, [startDate, startDate, startDate, endDate, startDate, endDate]);

    if (!result.length || !result[0].values.length) return [];

    return result[0].values.map((row: any) => {
      const account_code = String(row[0]);
      const number = row[1] ? String(row[1]) : undefined;
      const account_name = String(row[2]);
      const account_type = String(row[3]);
      const normal_balance = row[4] as 'debit' | 'credit';
      const previous_debit = Number(row[5]);
      const previous_credit = Number(row[6]);
      const debit = Number(row[7]);
      const credit = Number(row[8]);

      const initial_balance = normal_balance === 'debit'
        ? previous_debit - previous_credit
        : previous_credit - previous_debit;

      const total_debit = previous_debit + debit;
      const total_credit = previous_credit + credit;

      const final_balance = normal_balance === 'debit'
        ? total_debit - total_credit
        : total_credit - total_debit;

      return {
        account_code,
        number,
        account_name,
        account_type,
        normal_balance,
        initial_balance,
        period_debit: debit,
        period_credit: credit,
        total_debit,
        total_credit,
        final_balance,
        previous_debit,
        previous_credit
      };
    });

  } catch (error) {
    logger.error('Accounting', 'trial_balance_failed', 'Error generando balance de comprobación', { year, month }, error as Error);
    return [];
  }
}

export function getAccountMovementsDetails(accountCode: string, startDate: string, endDate: string) {
  if (!db) return [];

  const query = `
    SELECT
      je.entry_date as date,
      je.reference,
      je.description as entry_desc,
      jd.description as line_desc,
      jd.debit_amount as debit,
      jd.credit_amount as credit
    FROM journal_details jd
    JOIN journal_entries je ON jd.journal_entry_id = je.id
    WHERE jd.account_code = ? AND je.entry_date BETWEEN ? AND ?
    ORDER BY je.entry_date ASC, je.id ASC
  `;

  try {
    const res = db.exec(query, [accountCode, startDate, endDate]);
    if (!res.length) return [];
    return res[0].values.map((row: any) => ({
      date: row[0],
      reference: row[1],
      description: row[3] || row[2],
      debit: Number(row[4]),
      credit: Number(row[5])
    }));
  } catch {
    return [];
  }
}

export function validateAccountingIntegrity(): { isValid: boolean; errors: string[] } {
  if (!db) return { isValid: false, errors: ['Database not initialized'] };

  const errors: string[] = [];

  const res = db.exec(
    "SELECT id, entry_date, description, total_debit, total_credit FROM journal_entries WHERE ABS(total_debit - total_credit) > 0.001"
  );

  if (res.length && res[0].values.length > 0) {
    res[0].values.forEach((row: any) => {
      errors.push(`Asiento #${row[0]} (${row[1]}) descuadrado por $${Math.abs(Number(row[3]) - Number(row[4])).toFixed(2)}`);
    });
  }

  return { isValid: errors.length === 0, errors };
}

export function getIncomeStatementReport(startDate: string, endDate: string): IncomeStatementItem[] {
  if (!db) return [];

  try {
    const query = `
      SELECT
        ca.account_code,
        ca.number,
        ca.account_name,
        ca.account_type,
        SUM(jd.debit_amount) as total_debit,
        SUM(jd.credit_amount) as total_credit
      FROM chart_of_accounts ca
      JOIN journal_details jd ON ca.account_code = jd.account_code
      JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE je.entry_date BETWEEN '${startDate}' AND '${endDate}'
        AND (LOWER(ca.account_type) = 'revenue' OR LOWER(ca.account_type) = 'expense')
      GROUP BY ca.account_code, ca.number, ca.account_name, ca.account_type
      ORDER BY ca.account_code ASC
    `;

    const result = db.exec(query);
    if (!result.length || !result[0].values.length) return [];

    const columns = (result[0].columns || (result[0] as any).lc);
    return result[0].values.map((row: any) => {
      const r: any = {};
      columns.forEach((col: any, i: any) => r[col] = row[i]);

      const type = String(r.account_type).toLowerCase();
      const debit = Number(r.total_debit);
      const credit = Number(r.total_credit);
      const netBalance = type === 'revenue' ? credit - debit : debit - credit;

      return {
        account_code: String(r.account_code),
        number: r.number ? String(r.number) : undefined,
        account_name: String(r.account_name),
        account_type: type,
        balance: netBalance
      };
    });

  } catch (error) {
    logger.error('Accounting', 'income_statement_failed', 'Error P&L', { startDate, endDate }, error as Error);
    return [];
  }
}
