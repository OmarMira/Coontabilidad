/**
 * Módulo 26 — Budgets (Presupuestos)
 * Extraído de simple-db.ts líneas 13091–13920
 */

import { db, rowToEntity } from './db-core';
import { forceSaveDB } from './db-persistence';
import { logger } from '../../core/logging/SystemLogger';
import { AuditChainService as AuditTrailService } from '../../core/audit/AuditChainService';

// ==========================================
// INTERFACES
// ==========================================

export interface Budget {
  id: number;
  budget_name: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED';
  total_budget_amount: number;
  department?: string;
  notes?: string;
  alert_threshold_percentage?: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  approved_by?: number;
  approved_at?: string;
}

export interface BudgetLine {
  id: number;
  budget_id: number;
  account_number: number;
  annual_amount: number;
  distribution_type: 'EQUAL' | 'CUSTOM' | 'ZERO';
  notes?: string;
  created_at: string;
}

export interface BudgetPeriod {
  id: number;
  budget_line_id: number;
  period_type: 'MONTHLY' | 'QUARTERLY';
  period_number: number;
  period_start_date: string;
  period_end_date: string;
  budgeted_amount: number;
  actual_amount?: number;
  variance_amount?: number;
  variance_percent?: number;
  created_at: string;
}

export interface BudgetVarianceAnalysis {
  budget_id: number;
  budget_name: string;
  account_number: number;
  account_name: string;
  annual_budget: number;
  ytd_budget: number;
  ytd_actual: number;
  ytd_variance: number;
  ytd_variance_percent: number;
  periods: {
    period_number: number;
    period_name: string;
    budgeted: number;
    actual: number;
    variance: number;
    variance_percent: number;
    is_favorable: boolean;
  }[];
}

// ==========================================
// HELPERS (privadas)
// ==========================================

function getAccountNameByNumber(accountNumber: number): string | null {
  if (!db) return null;
  try {
    const res = db.exec('SELECT name FROM chart_of_accounts WHERE code = ?', [accountNumber.toString()]);
    if (res.length === 0 || res[0].values.length === 0) return null;
    return res[0].values[0][0] as string;
  } catch { return null; }
}

function getLastDayOfMonth(year: number, month: number): string {
  return new Date(year, month, 0).getDate().toString().padStart(2, '0');
}

function generateBudgetPeriods(lineId: number, fiscalYear: number, annualAmount: number, distributionType: 'EQUAL' | 'CUSTOM' | 'ZERO'): void {
  const monthlyAmount = distributionType === 'EQUAL' ? Math.round(annualAmount / 12) : 0;
  for (let month = 1; month <= 12; month++) {
    const lastDay = getLastDayOfMonth(fiscalYear, month);
    const periodStartDate = `${fiscalYear}-${month.toString().padStart(2, '0')}-01`;
    const periodEndDate = `${fiscalYear}-${month.toString().padStart(2, '0')}-${lastDay}`;
    db?.run(`
      INSERT INTO budget_periods (budget_line_id, period_type, period_number, period_start_date, period_end_date, budgeted_amount)
      VALUES (?, 'MONTHLY', ?, ?, ?, ?)
    `, [lineId, month, periodStartDate, periodEndDate, monthlyAmount]);
  }
}

// ==========================================
// CRUD
// ==========================================

export async function createBudget(
  budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'>,
  budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[]
): Promise<{ success: boolean; message: string; id?: number }> {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const linesTotal = budgetLines.reduce((sum, line) => sum + line.annual_amount, 0);
    if (Math.abs(linesTotal - budgetData.total_budget_amount) > 1) {
      return { success: false, message: `Total de líneas (${(linesTotal / 100).toFixed(2)}) no coincide con total del presupuesto (${(budgetData.total_budget_amount / 100).toFixed(2)})` };
    }

    db.run('BEGIN TRANSACTION');

    db.exec(`
      INSERT INTO budgets (budget_name, fiscal_year, start_date, end_date, status, total_budget_amount, department, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [budgetData.budget_name, budgetData.fiscal_year, budgetData.start_date, budgetData.end_date,
        budgetData.status, budgetData.total_budget_amount, budgetData.department || null,
        budgetData.notes || null, budgetData.created_by || null]);

    const budgetId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

    for (const line of budgetLines) {
      db.exec(`
        INSERT INTO budget_lines (budget_id, account_number, annual_amount, distribution_type, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [budgetId, line.account_number, line.annual_amount, line.distribution_type, line.notes || null]);

      const lineId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
      generateBudgetPeriods(lineId, budgetData.fiscal_year, line.annual_amount, line.distribution_type);
    }

    db.run('COMMIT');

    AuditTrailService.logAction({
      user_id: budgetData.created_by || 1,
      action: 'CREATE',
      entity_type: 'budget',
      entity_id: budgetId.toString(),
      new_value: JSON.stringify({ budget_name: budgetData.budget_name, fiscal_year: budgetData.fiscal_year, total: budgetData.total_budget_amount })
    });

    logger.info('Budgets', 'budget_created', `Presupuesto creado: ${budgetData.budget_name}`, { budgetId, linesCount: budgetLines.length });
    await forceSaveDB();
    return { success: true, message: 'Presupuesto creado exitosamente', id: budgetId };

  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Budgets', 'budget_creation_failed', 'Error al crear presupuesto', { error: error.message });
    return { success: false, message: error.message };
  }
}

export function getBudgets(filters?: { fiscal_year?: number; status?: string; userId?: number; role?: string }): Budget[] {
  if (!db) return [];
  try {
    let query = 'SELECT * FROM budgets WHERE 1=1';
    const params: any[] = [];
    if (filters?.fiscal_year) { query += ' AND fiscal_year = ?'; params.push(filters.fiscal_year); }
    if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
    const privilegedRoles = ['admin', 'contador', 'auditor'];
    if (filters?.userId && filters?.role && !privilegedRoles.includes(filters.role)) {
      query += ' AND created_by = ?'; params.push(filters.userId);
    }
    query += ' ORDER BY fiscal_year DESC, budget_name ASC';
    const res = db.exec(query, params);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<Budget>((res[0].columns || (res[0] as any).lc), row));
  } catch (error) { console.error('Error fetching budgets:', error); return []; }
}

export function getBudgetById(id: number): Budget | null {
  if (!db) return null;
  try {
    const res = db.exec('SELECT * FROM budgets WHERE id = ?', [id]);
    if (res.length === 0 || res[0].values.length === 0) return null;
    return rowToEntity<Budget>((res[0].columns || (res[0] as any).lc), res[0].values[0]);
  } catch (error) { console.error('Error fetching budget:', error); return null; }
}

export function getBudgetLines(budgetId: number): BudgetLine[] {
  if (!db) return [];
  try {
    const res = db.exec('SELECT * FROM budget_lines WHERE budget_id = ? ORDER BY account_number ASC', [budgetId]);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<BudgetLine>((res[0].columns || (res[0] as any).lc), row));
  } catch (error) { console.error('Error fetching budget lines:', error); return []; }
}

export function getBudgetPeriods(budgetLineId: number): BudgetPeriod[] {
  if (!db) return [];
  try {
    const res = db.exec('SELECT * FROM budget_periods WHERE budget_line_id = ? ORDER BY period_number ASC', [budgetLineId]);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<BudgetPeriod>((res[0].columns || (res[0] as any).lc), row));
  } catch (error) { console.error('Error fetching budget periods:', error); return []; }
}

export function updateBudget(id: number, budgetData: Partial<Budget>, budgetLines?: Partial<BudgetLine>[]): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const existing = getBudgetById(id);
    if (!existing) return { success: false, message: 'Presupuesto no encontrado' };
    if (existing.status !== 'DRAFT' && budgetLines) return { success: false, message: 'No se puede editar un presupuesto que no está en borrador' };

    db.run('BEGIN TRANSACTION');

    const updates: string[] = [];
    const params: any[] = [];
    if (budgetData.budget_name !== undefined) { updates.push('budget_name = ?'); params.push(budgetData.budget_name); }
    if (budgetData.status !== undefined) { updates.push('status = ?'); params.push(budgetData.status); }
    if (budgetData.department !== undefined) { updates.push('department = ?'); params.push(budgetData.department); }
    if (budgetData.notes !== undefined) { updates.push('notes = ?'); params.push(budgetData.notes); }
    if (budgetData.updated_by !== undefined) { updates.push('updated_by = ?'); params.push(budgetData.updated_by); }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    if (updates.length > 1) db.run(`UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`, params);

    if (budgetLines) {
      db.run('DELETE FROM budget_lines WHERE budget_id = ?', [id]);
      const newTotal = budgetLines.reduce((sum, line) => sum + (line.annual_amount || 0), 0);
      for (const line of budgetLines) {
        db.exec(`INSERT INTO budget_lines (budget_id, account_number, annual_amount, distribution_type, notes) VALUES (?, ?, ?, ?, ?)`,
          [id, line.account_number, line.annual_amount, line.distribution_type || 'EQUAL', line.notes || null]);
        const lineId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
        generateBudgetPeriods(lineId, existing.fiscal_year, line.annual_amount || 0, line.distribution_type || 'EQUAL');
      }
      db.run('UPDATE budgets SET total_budget_amount = ? WHERE id = ?', [newTotal, id]);
    }

    db.run('COMMIT');

    AuditTrailService.logAction({
      user_id: budgetData.updated_by || 1, action: 'UPDATE', entity_type: 'budget', entity_id: id.toString(),
      old_value: JSON.stringify({ budget_name: existing.budget_name, status: existing.status }),
      new_value: JSON.stringify({ budget_name: budgetData.budget_name || existing.budget_name, status: budgetData.status || existing.status })
    });

    logger.info('Budgets', 'budget_updated', `Presupuesto actualizado: ${id}`);
    return { success: true, message: 'Presupuesto actualizado exitosamente' };
  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Budgets', 'budget_update_failed', 'Error al actualizar presupuesto', { error: error.message });
    return { success: false, message: error.message };
  }
}

export function deleteBudget(id: number): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const existing = getBudgetById(id);
    if (!existing) return { success: false, message: 'Presupuesto no encontrado' };
    if (existing.status !== 'DRAFT') return { success: false, message: 'Solo se pueden eliminar presupuestos en borrador' };
    db.run('DELETE FROM budgets WHERE id = ?', [id]);
    AuditTrailService.logAction({
      user_id: 1, action: 'DELETE', entity_type: 'budget', entity_id: id.toString(),
      old_value: JSON.stringify({ budget_name: existing.budget_name, fiscal_year: existing.fiscal_year })
    });
    logger.info('Budgets', 'budget_deleted', `Presupuesto eliminado: ${id}`);
    return { success: true, message: 'Presupuesto eliminado exitosamente' };
  } catch (error: any) {
    logger.error('Budgets', 'budget_deletion_failed', 'Error al eliminar presupuesto', { error: error.message });
    return { success: false, message: error.message };
  }
}

export function approveBudget(id: number, userId: number): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const existing = getBudgetById(id);
    if (!existing) return { success: false, message: 'Presupuesto no encontrado' };
    if (existing.status !== 'DRAFT') return { success: false, message: 'Solo se pueden aprobar presupuestos en borrador' };
    db.run("UPDATE budgets SET status = 'APPROVED', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [userId, id]);
    AuditTrailService.logAction({
      user_id: userId, action: 'UPDATE', entity_type: 'budget', entity_id: id.toString(),
      old_value: JSON.stringify({ status: 'DRAFT' }), new_value: JSON.stringify({ status: 'APPROVED', approved_by: userId })
    });
    logger.info('Budgets', 'budget_approved', `Presupuesto aprobado: ${id} por usuario ${userId}`);
    return { success: true, message: 'Presupuesto aprobado exitosamente' };
  } catch (error: any) {
    logger.error('Budgets', 'budget_approval_failed', 'Error al aprobar presupuesto', { error: error.message });
    return { success: false, message: error.message };
  }
}

// ==========================================
// ANALYSIS
// ==========================================

export function calculateActualsByAccount(accountNumber: number, startDate: string, endDate: string): number {
  if (!db) return 0;
  try {
    const res = db.exec(`
      SELECT
        SUM(CASE WHEN debit > 0 THEN debit ELSE 0 END) as total_debit,
        SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as total_credit
      FROM journal_entry_lines
      INNER JOIN journal_entries ON journal_entries.id = journal_entry_lines.entry_id
      WHERE account_number = ? AND entry_date >= ? AND entry_date <= ? AND journal_entries.status = 'posted'
    `, [accountNumber, startDate, endDate]);
    if (res.length === 0 || res[0].values.length === 0) return 0;
    const totalDebit = res[0].values[0][0] as number || 0;
    const totalCredit = res[0].values[0][1] as number || 0;
    return accountNumber >= 5000 ? totalDebit - totalCredit : totalCredit - totalDebit;
  } catch (error) { console.error('Error calculating actuals:', error); return 0; }
}

export function getBudgetVarianceAnalysis(budgetId: number, asOfDate?: string): BudgetVarianceAnalysis[] {
  if (!db) return [];
  const currentDate = asOfDate || new Date().toISOString().split('T')[0];
  const budget = getBudgetById(budgetId);
  if (!budget) return [];
  const lines = getBudgetLines(budgetId);
  return lines.map(line => {
    const periods = getBudgetPeriods(line.id);
    const accountNumber = line.account_number;
    const ytdBudget = periods.filter(p => p.period_end_date <= currentDate).reduce((sum, p) => sum + p.budgeted_amount, 0);
    const ytdActual = calculateActualsByAccount(accountNumber, budget.start_date, currentDate);
    const ytdVariance = ytdActual - ytdBudget;
    const ytdVariancePercent = ytdBudget !== 0 ? (ytdVariance / ytdBudget) * 100 : 0;
    const accountName = getAccountNameByNumber(accountNumber) || `Account ${accountNumber}`;
    return {
      budget_id: budgetId, budget_name: budget.budget_name, account_number: accountNumber, account_name: accountName,
      annual_budget: line.annual_amount, ytd_budget: ytdBudget, ytd_actual: ytdActual, ytd_variance: ytdVariance,
      ytd_variance_percent: ytdVariancePercent,
      periods: periods.map(p => {
        const periodActual = calculateActualsByAccount(accountNumber, p.period_start_date, p.period_end_date);
        const periodVariance = periodActual - p.budgeted_amount;
        const periodVariancePercent = p.budgeted_amount !== 0 ? (periodVariance / p.budgeted_amount) * 100 : 0;
        const periodIsFavorable = accountNumber >= 5000 ? periodVariance < 0 : periodVariance > 0;
        return { period_number: p.period_number, period_name: new Date(p.period_start_date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }), budgeted: p.budgeted_amount, actual: periodActual, variance: periodVariance, variance_percent: periodVariancePercent, is_favorable: periodIsFavorable };
      })
    };
  });
}

export function updatePeriodActuals(budgetId: number): { success: boolean; message: string; periodsUpdated: number } {
  if (!db) return { success: false, message: 'Database not initialized', periodsUpdated: 0 };
  try {
    const budget = getBudgetById(budgetId);
    if (!budget) return { success: false, message: 'Presupuesto no encontrado', periodsUpdated: 0 };
    const lines = getBudgetLines(budgetId);
    let periodsUpdated = 0;
    db.run('BEGIN TRANSACTION');
    for (const line of lines) {
      const periods = getBudgetPeriods(line.id);
      for (const period of periods) {
        const actualAmount = calculateActualsByAccount(line.account_number, period.period_start_date, period.period_end_date);
        const variance = actualAmount - period.budgeted_amount;
        const variancePercent = period.budgeted_amount !== 0 ? (variance / period.budgeted_amount) * 100 : 0;
        db.run("UPDATE budget_periods SET actual_amount = ?, variance_amount = ?, variance_percent = ? WHERE id = ?", [actualAmount, variance, variancePercent, period.id]);
        periodsUpdated++;
      }
    }
    db.run('COMMIT');
    logger.info('Budgets', 'periods_updated', `Períodos actualizados: ${periodsUpdated}`, { budgetId });
    return { success: true, message: `${periodsUpdated} períodos actualizados`, periodsUpdated };
  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Budgets', 'period_update_failed', 'Error al actualizar períodos', { error: error.message });
    return { success: false, message: error.message, periodsUpdated: 0 };
  }
}

export function getBudgetSummary(budgetId: number): { budget_id: number; budget_name: string; fiscal_year: number; status: string; total_budgeted: number; total_actual: number; total_variance: number; total_variance_percent: number; lines_count: number; lines_over_budget: number; lines_under_budget: number; lines_on_budget: number; alert_count: number } | null {
  if (!db) return null;
  try {
    const budget = getBudgetById(budgetId);
    if (!budget) return null;
    const lines = getBudgetLines(budgetId);
    const varianceAnalysis = getBudgetVarianceAnalysis(budgetId);
    const totalBudgeted = lines.reduce((sum, line) => sum + line.annual_amount, 0);
    const totalActual = varianceAnalysis.reduce((sum, va) => sum + va.ytd_actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const totalVariancePercent = totalBudgeted !== 0 ? (totalVariance / totalBudgeted) * 100 : 0;
    let linesOverBudget = 0, linesUnderBudget = 0, linesOnBudget = 0, alertCount = 0;
    const alertThreshold = budget.alert_threshold_percentage || 10;
    for (const va of varianceAnalysis) {
      const variancePercent = Math.abs(va.ytd_variance_percent);
      if (variancePercent > alertThreshold) alertCount++;
      if (va.ytd_variance > 0) linesOverBudget++; else if (va.ytd_variance < 0) linesUnderBudget++; else linesOnBudget++;
    }
    return { budget_id: budgetId, budget_name: budget.budget_name, fiscal_year: budget.fiscal_year, status: budget.status, total_budgeted: totalBudgeted, total_actual: totalActual, total_variance: totalVariance, total_variance_percent: totalVariancePercent, lines_count: lines.length, lines_over_budget: linesOverBudget, lines_under_budget: linesUnderBudget, lines_on_budget: linesOnBudget, alert_count: alertCount };
  } catch (error) { console.error('Error getting budget summary:', error); return null; }
}

export function generateBudgetAlerts(budgetId: number): Array<{ budget_id: number; budget_line_id: number; account_number: number; account_name: string; alert_type: 'over_budget' | 'under_budget'; severity: 'warning' | 'critical'; variance_amount: number; variance_percent: number; threshold_percent: number; message: string }> {
  if (!db) return [];
  try {
    const budget = getBudgetById(budgetId);
    if (!budget) return [];
    const alertThreshold = budget.alert_threshold_percentage || 10;
    const varianceAnalysis = getBudgetVarianceAnalysis(budgetId);
    const alerts: Array<any> = [];
    for (const va of varianceAnalysis) {
      const variancePercent = Math.abs(va.ytd_variance_percent);
      if (variancePercent > alertThreshold) {
        const isOverBudget = va.ytd_variance > 0;
        const severity = variancePercent > (alertThreshold * 2) ? 'critical' : 'warning';
        const lines = getBudgetLines(budgetId);
        const line = lines.find(l => l.account_number === va.account_number);
        if (line) {
          alerts.push({ budget_id: budgetId, budget_line_id: line.id, account_number: va.account_number, account_name: va.account_name, alert_type: isOverBudget ? 'over_budget' : 'under_budget', severity, variance_amount: va.ytd_variance, variance_percent: va.ytd_variance_percent, threshold_percent: alertThreshold, message: `${va.account_name}: ${isOverBudget ? 'Sobre' : 'Bajo'} presupuesto por ${Math.abs(variancePercent).toFixed(1)}% (${(Math.abs(va.ytd_variance) / 100).toFixed(2)})` });
        }
      }
    }
    if (alerts.length > 0) logger.warn('Budgets', 'alerts_generated', `${alerts.length} alertas generadas`, { budgetId, alertCount: alerts.length });
    return alerts;
  } catch (error) { console.error('Error generating budget alerts:', error); return []; }
}

export function getBudgetExecutionStatus(budgetId: number): { budget_id: number; execution_percent: number; status: 'on_track' | 'at_risk' | 'over_budget'; days_elapsed: number; days_remaining: number; period_progress_percent: number; budget_consumed_percent: number; pace_indicator: 'ahead' | 'on_pace' | 'behind' } | null {
  if (!db) return null;
  try {
    const budget = getBudgetById(budgetId);
    if (!budget) return null;
    const summary = getBudgetSummary(budgetId);
    if (!summary) return null;
    const startDate = new Date(budget.start_date);
    const endDate = new Date(budget.end_date);
    const currentDate = new Date();
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysElapsed;
    const periodProgressPercent = (daysElapsed / totalDays) * 100;
    const budgetConsumedPercent = summary.total_budgeted !== 0 ? (summary.total_actual / summary.total_budgeted) * 100 : 0;
    const expectedSpending = (summary.total_budgeted * periodProgressPercent) / 100;
    const executionPercent = expectedSpending !== 0 ? (summary.total_actual / expectedSpending) * 100 : 0;
    let paceIndicator: 'ahead' | 'on_pace' | 'behind';
    if (budgetConsumedPercent > periodProgressPercent + 5) paceIndicator = 'ahead';
    else if (budgetConsumedPercent < periodProgressPercent - 5) paceIndicator = 'behind';
    else paceIndicator = 'on_pace';
    let status: 'on_track' | 'at_risk' | 'over_budget';
    if (summary.alert_count === 0 && paceIndicator === 'on_pace') status = 'on_track';
    else if (summary.alert_count > 0 || paceIndicator === 'ahead') status = 'at_risk';
    else status = budgetConsumedPercent > 100 ? 'over_budget' : 'on_track';
    return { budget_id: budgetId, execution_percent: executionPercent, status, days_elapsed: daysElapsed, days_remaining: daysRemaining, period_progress_percent: periodProgressPercent, budget_consumed_percent: budgetConsumedPercent, pace_indicator: paceIndicator };
  } catch (error) { console.error('Error getting budget execution status:', error); return null; }
}
