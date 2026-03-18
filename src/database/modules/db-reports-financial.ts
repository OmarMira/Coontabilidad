/**
 * Módulo 14 — Financial Reports (Reportes Financieros)
 * Extraído de simple-db.ts líneas 7831–8116
 */

import { db } from '../simple-db';
import { rowToEntity } from './db-core';
import { createJournalEntry } from './db-journal';
import type { ChartOfAccount, JournalDetail, AccountingPeriod } from './db-types';

export const generateBalanceSheet = (asOfDate?: string): {
  assets: ChartOfAccount[];
  liabilities: ChartOfAccount[];
  equity: ChartOfAccount[];
  totalAssets: number;
  totalLiabilitiesEquity: number;
  isBalanced: boolean;
} => {
  if (!db) return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesEquity: 0, isBalanced: false };

  try {
    const dateFilter = asOfDate ? `AND je.entry_date <= '${asOfDate}'` : '';

    const result = db.exec(`
      SELECT
        coa.account_code, coa.number, coa.account_name, coa.account_type, coa.normal_balance,
        COALESCE(SUM(jd.debit_amount), 0) as total_debits,
        COALESCE(SUM(jd.credit_amount), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_details jd ON coa.account_code = jd.account_code
      LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE coa.account_type IN ('asset', 'liability', 'equity')
        AND coa.is_active = 1
        ${dateFilter}
      GROUP BY coa.account_code, coa.number, coa.account_name, coa.account_type, coa.normal_balance
      ORDER BY coa.account_code
    `);

    if (!result[0]) return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesEquity: 0, isBalanced: false };

    const assets: ChartOfAccount[] = [];
    const liabilities: ChartOfAccount[] = [];
    const equity: ChartOfAccount[] = [];
    let totalAssets = 0;
    let totalLiabilitiesEquity = 0;

    const columns = (result[0].columns || (result[0] as any).lc);

    result[0].values.forEach((row: any) => {
      const account: any = {};
      columns.forEach((col: any, index: any) => { account[col] = row[index]; });

      const debits = Number(account.total_debits) || 0;
      const credits = Number(account.total_credits) || 0;

      account.balance = account.normal_balance === 'debit' ? debits - credits : credits - debits;

      if (account.account_type === 'asset') {
        assets.push(account);
        totalAssets += account.balance;
      } else if (account.account_type === 'liability') {
        liabilities.push(account);
        totalLiabilitiesEquity += account.balance;
      } else if (account.account_type === 'equity') {
        equity.push(account);
        totalLiabilitiesEquity += account.balance;
      }
    });

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;

    return { assets, liabilities, equity, totalAssets, totalLiabilitiesEquity, isBalanced };

  } catch (error) {
    console.error('Error generating balance sheet:', error);
    return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesEquity: 0, isBalanced: false };
  }
};

export const generateIncomeStatement = (fromDate: string, toDate: string): {
  revenue: ChartOfAccount[];
  expenses: ChartOfAccount[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
} => {
  if (!db) return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 };

  try {
    const result = db.exec(`
      SELECT
        coa.account_code, coa.number, coa.account_name, coa.account_type, coa.normal_balance,
        COALESCE(SUM(jd.debit_amount), 0) as total_debits,
        COALESCE(SUM(jd.credit_amount), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_details jd ON coa.account_code = jd.account_code
      LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE coa.account_type IN ('revenue', 'expense')
        AND coa.is_active = 1
        AND je.entry_date BETWEEN ? AND ?
      GROUP BY coa.account_code, coa.number, coa.account_name, coa.account_type, coa.normal_balance
      ORDER BY coa.account_code
    `, [fromDate, toDate]);

    if (!result[0]) return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 };

    const revenue: ChartOfAccount[] = [];
    const expenses: ChartOfAccount[] = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    const columns = (result[0].columns || (result[0] as any).lc);

    result[0].values.forEach((row: any) => {
      const account: any = {};
      columns.forEach((col: any, index: any) => { account[col] = row[index]; });

      const debits = Number(account.total_debits) || 0;
      const credits = Number(account.total_credits) || 0;

      account.balance = account.normal_balance === 'debit' ? debits - credits : credits - debits;

      if (account.account_type === 'revenue') {
        revenue.push(account);
        totalRevenue += account.balance;
      } else if (account.account_type === 'expense') {
        expenses.push(account);
        totalExpenses += account.balance;
      }
    });

    return { revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };

  } catch (error) {
    console.error('Error generating income statement:', error);
    return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 };
  }
};

export const generateClosingEntry = async (
  fromDate: string,
  toDate: string,
  userId?: number
): Promise<{ success: boolean; message: string; entryId?: number }> => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const incomeData = generateIncomeStatement(fromDate, toDate);
    const details: Partial<JournalDetail>[] = [];

    incomeData.revenue.forEach(acc => {
      if (Math.abs(acc.balance || 0) > 0.01) {
        details.push({
          account_code: acc.account_code,
          debit_amount: Math.abs(acc.balance || 0),
          credit_amount: 0,
          description: `Cierre de cuenta de ingresos - Periodo ${fromDate} a ${toDate}`
        });
      }
    });

    incomeData.expenses.forEach(acc => {
      if (Math.abs(acc.balance || 0) > 0.01) {
        details.push({
          account_code: acc.account_code,
          debit_amount: 0,
          credit_amount: Math.abs(acc.balance || 0),
          description: `Cierre de cuenta de gastos - Periodo ${fromDate} a ${toDate}`
        });
      }
    });

    if (details.length === 0) {
      return { success: false, message: 'No hay saldos en cuentas de resultados para cerrar en este periodo.' };
    }

    if (Math.abs(incomeData.netIncome) > 0.01) {
      const isProfit = incomeData.netIncome > 0;
      details.push({
        account_code: '3130',
        debit_amount: isProfit ? 0 : Math.abs(incomeData.netIncome),
        credit_amount: isProfit ? Math.abs(incomeData.netIncome) : 0,
        description: isProfit ? 'Registro de Utilidad del Periodo' : 'Registro de Pérdida del Periodo'
      });
    }

    return createJournalEntry({
      entry_date: toDate,
      reference_number: `CLOSE-${toDate.slice(0, 7)}`,
      description: `ASIENTO DE CIERRE DE RESULTADOS: Periodo ${fromDate} a ${toDate}`
    }, details, userId);

  } catch (error: any) {
    return { success: false, message: 'Error al generar asiento de cierre: ' + error.message };
  }
};

export const getCashFlowStatement = (fromDate: string, toDate: string): {
  netIncome: number;
  operatingActivities: { title: string; amount: number }[];
  investingActivities: { title: string; amount: number }[];
  financingActivities: { title: string; amount: number }[];
  netIncreaseInCash: number;
  startingCash: number;
  endingCash: number;
} => {
  if (!db) return { netIncome: 0, operatingActivities: [], investingActivities: [], financingActivities: [], netIncreaseInCash: 0, startingCash: 0, endingCash: 0 };

  try {
    const incomeStatement = generateIncomeStatement(fromDate, toDate);
    const netIncome = incomeStatement.netIncome;

    const startBalanceSheet = generateBalanceSheet(
      new Date(new Date(fromDate).getTime() - 86400000).toISOString().split('T')[0]
    );
    const endBalanceSheet = generateBalanceSheet(toDate);

    const operatingActivities: { title: string; amount: number }[] = [];
    let operatingTotal = netIncome;

    const startAR = startBalanceSheet.assets.filter(a => a.account_name.toLowerCase().includes('cobrar')).reduce((sum, a) => sum + (a.balance || 0), 0);
    const endAR = endBalanceSheet.assets.filter(a => a.account_name.toLowerCase().includes('cobrar')).reduce((sum, a) => sum + (a.balance || 0), 0);
    const deltaAR = endAR - startAR;
    if (deltaAR !== 0) {
      operatingActivities.push({ title: deltaAR > 0 ? 'Aumento en Cuentas por Cobrar' : 'Disminución en Cuentas por Cobrar', amount: -deltaAR });
      operatingTotal -= deltaAR;
    }

    const startInv = startBalanceSheet.assets.filter(a => a.account_name.toLowerCase().includes('inventario')).reduce((sum, a) => sum + (a.balance || 0), 0);
    const endInv = endBalanceSheet.assets.filter(a => a.account_name.toLowerCase().includes('inventario')).reduce((sum, a) => sum + (a.balance || 0), 0);
    const deltaInv = endInv - startInv;
    if (deltaInv !== 0) {
      operatingActivities.push({ title: deltaInv > 0 ? 'Aumento en Inventario' : 'Disminución en Inventario', amount: -deltaInv });
      operatingTotal -= deltaInv;
    }

    const startAP = startBalanceSheet.liabilities.filter(l => l.account_name.toLowerCase().includes('pagar')).reduce((sum, l) => sum + (l.balance || 0), 0);
    const endAP = endBalanceSheet.liabilities.filter(l => l.account_name.toLowerCase().includes('pagar')).reduce((sum, l) => sum + (l.balance || 0), 0);
    const deltaAP = endAP - startAP;
    if (deltaAP !== 0) {
      operatingActivities.push({ title: deltaAP > 0 ? 'Aumento en Cuentas por Pagar' : 'Disminución en Cuentas por Pagar', amount: deltaAP });
      operatingTotal += deltaAP;
    }

    const investingActivities: { title: string; amount: number }[] = [];
    const financingActivities: { title: string; amount: number }[] = [];

    const startCash = startBalanceSheet.assets.filter(a => a.account_name.toLowerCase().includes('caja') || a.account_name.toLowerCase().includes('banco')).reduce((sum, a) => sum + (a.balance || 0), 0);
    const endCash = endBalanceSheet.assets.filter(a => a.account_name.toLowerCase().includes('caja') || a.account_name.toLowerCase().includes('banco')).reduce((sum, a) => sum + (a.balance || 0), 0);

    return {
      netIncome,
      operatingActivities,
      investingActivities,
      financingActivities,
      netIncreaseInCash: endCash - startCash,
      startingCash: startCash,
      endingCash: endCash
    };

  } catch (error) {
    console.error('Error generating cash flow statement:', error);
    return { netIncome: 0, operatingActivities: [], investingActivities: [], financingActivities: [], netIncreaseInCash: 0, startingCash: 0, endingCash: 0 };
  }
};

export async function closePeriod(periodId: number, userId: number): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const periodRes = db.exec("SELECT * FROM accounting_periods WHERE id = ?", [periodId]);
    if (periodRes.length === 0) return { success: false, message: 'Periodo no encontrado' };
    const period = rowToEntity<AccountingPeriod>((periodRes[0].columns || (periodRes[0] as any).lc), periodRes[0].values[0]);
    if (period.status === 'closed' || period.status === 'locked') {
      return { success: false, message: 'El periodo ya está cerrado' };
    }
    const tb = db.exec(`SELECT SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit FROM journal_details jd JOIN journal_entries je ON jd.journal_entry_id = je.id WHERE date(je.entry_date) BETWEEN date(?) AND date(?)`, [period.start_date, period.end_date]);
    const totalDebit = tb[0]?.values[0]?.[0] as number || 0;
    const totalCredit = tb[0]?.values[0]?.[1] as number || 0;
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return { success: false, message: 'No se puede cerrar: El balance no cuadra (Diferencia: ' + (totalDebit - totalCredit).toFixed(2) + ')' };
    }
    db.run(`UPDATE accounting_periods SET status = 'closed', closed_at = CURRENT_TIMESTAMP, closed_by = ? WHERE id = ?`, [userId, periodId]);
    return { success: true, message: `Periodo ${period.month} cerrado exitosamente` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
