/**
 * MÃ³dulo 27 â€” Payroll, Employees, Fixed Assets, Fiscal Settings
 * ExtraÃ­do de simple-db.ts lÃ­neas 289â€“1129 y 13935â€“14173
 */

import { db, rowToEntity } from './db-core';
import { saveDatabase } from './db-persistence';
import { logger } from '../../core/logging/SystemLogger';
import type {
  Employee, PayrollPeriod, PayrollSetting, PayrollEntry, PayrollLineItem,
  Payroll, PayrollRecord, TaxBracket, AssetCategory, FixedAsset, AssetDepreciation,
  MonthlySummary, FiscalSettings
} from './db-types';

// ==========================================
// MONTHLY FINANCIAL SUMMARY
// ==========================================

export function getMonthlyFinancialSummary(): MonthlySummary[] {
  if (!db) return [];
  try {
    const currentYear = new Date().getFullYear();
    const res = db.exec(`
      SELECT strftime('%m', entry_date) as month, SUM(total_debit) as revenue
      FROM journal_entries
      WHERE strftime('%Y', entry_date) = ? AND description LIKE '%Venta%'
      GROUP BY month ORDER BY month ASC
    `, [currentYear.toString()]);

    const expenseRes = db.exec(`
      SELECT strftime('%m', entry_date) as month, SUM(total_debit) as expenses
      FROM journal_entries
      WHERE strftime('%Y', entry_date) = ? AND description LIKE '%Compra%'
      GROUP BY month ORDER BY month ASC
    `, [currentYear.toString()]);

    const summary: Record<string, MonthlySummary> = {};
    for (let i = 1; i <= 12; i++) {
      const m = i.toString().padStart(2, '0');
      summary[m] = { month: m, revenue: 0, expenses: 0 };
    }
    if (res.length > 0) res[0].values.forEach((row: any) => { summary[row[0] as string].revenue = row[1] as number; });
    if (expenseRes.length > 0) expenseRes[0].values.forEach((row: any) => { summary[row[0] as string].expenses = row[1] as number; });
    return Object.values(summary);
  } catch (e) {
    logger.error('db-payroll', 'fetch_monthly_summary', 'Error fetching monthly summary', e);
    return [];
  }
}

// ==========================================
// EMPLOYEES
// ==========================================

export function getEmployees(): Employee[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM employees ORDER BY last_name, first_name");
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<Employee>((res[0].columns || (res[0] as any).lc), row));
  } catch (e) { logger.error('db-payroll', 'fetch_employees', 'Error fetching employees', e); return []; }
}

export function getEmployeeById(id: number): Employee | null {
  if (!db) return null;
  try {
    const res = db.exec("SELECT * FROM employees WHERE id = ?", [id]);
    if (res.length === 0 || res[0].values.length === 0) return null;
    return rowToEntity<Employee>((res[0].columns || (res[0] as any).lc), res[0].values[0]);
  } catch (e) { logger.error('db-payroll', 'fetch_employee', 'Error fetching employee', e); return null; }
}

export function createEmployee(empData: Partial<Employee>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const stmt = db.prepare(`
      INSERT INTO employees (
        employee_number, first_name, last_name, email, phone,
        hire_date, department, position, salary_type, salary_rate, status, florida_county
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      (empData.employee_number || `EMP-${Date.now()}`) as string,
      (empData.first_name || '') as string,
      (empData.last_name || '') as string,
      (empData.email || null) as string | null,
      (empData.phone || null) as string | null,
      (empData.hire_date || new Date().toISOString().split('T')[0]) as string,
      (empData.department || null) as string | null,
      (empData.position || null) as string | null,
      (empData.salary_type || 'monthly') as string,
      (empData.salary_rate || 0) as number,
      (empData.status || 'active') as string,
      (empData.florida_county || 'Miami-Dade') as string
    ]);
    const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();
    return { success: true, message: 'Empleado registrado con Ã©xito', id };
  } catch (e: any) { logger.error('db-payroll', 'create_employee', 'Error creating employee', e); return { success: false, message: e.message }; }
}

export function updateEmployee(id: number, empData: Partial<Employee>): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    db.run(`
      UPDATE employees SET
        first_name = ?, last_name = ?, email = ?, phone = ?,
        department = ?, position = ?, salary_type = ?, salary_rate = ?,
        status = ?, florida_county = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      (empData.first_name || '') as string,
      (empData.last_name || '') as string,
      (empData.email || null) as string | null,
      (empData.phone || null) as string | null,
      (empData.department || null) as string | null,
      (empData.position || null) as string | null,
      (empData.salary_type || 'monthly') as string,
      (empData.salary_rate || 0) as number,
      (empData.status || 'active') as string,
      (empData.florida_county || 'Miami-Dade') as string,
      id
    ]);
    return { success: true, message: 'Empleado actualizado con Ã©xito' };
  } catch (e: any) { return { success: false, message: e.message }; }
}

// ==========================================
// PAYROLL PERIODS & SETTINGS
// ==========================================

export function getPayrollPeriods(): PayrollPeriod[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM payroll_periods ORDER BY start_date DESC");
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<PayrollPeriod>((res[0].columns || (res[0] as any).lc), row));
  } catch (e) { logger.error('db-payroll', 'fetch_payroll_periods', 'Error fetching payroll periods', e); return []; }
}

export function getPayrollSettings(): PayrollSetting[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM payroll_settings");
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<PayrollSetting>((res[0].columns || (res[0] as any).lc), row));
  } catch (e) { logger.error('db-payroll', 'fetch_payroll_settings', 'Error fetching payroll settings', e); return []; }
}

export function updatePayrollSetting(key: string, value: string): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    db.run("UPDATE payroll_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?", [value, key]);
    return { success: true, message: 'ConfiguraciÃ³n actualizada' };
  } catch (e: any) { return { success: false, message: e.message }; }
}

// ==========================================
// TAX BRACKETS
// ==========================================

export function getTaxBrackets(): TaxBracket[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM tax_brackets ORDER BY min_income ASC");
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<TaxBracket>((res[0].columns || (res[0] as any).lc), row));
  } catch (e) { logger.error('db-payroll', 'fetch_tax_brackets', 'Error fetching tax brackets', e); return []; }
}

export function createTaxBracket(bracket: Partial<TaxBracket>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    if (bracket.min_income === undefined || bracket.min_income < 0) return { success: false, message: 'Ingreso mÃ­nimo invÃ¡lido' };
    if (bracket.fixed_amount === undefined || bracket.fixed_amount < 0) return { success: false, message: 'Cuota fija invÃ¡lida' };
    if (bracket.percentage === undefined || bracket.percentage < 0 || bracket.percentage > 1) return { success: false, message: 'Porcentaje debe estar entre 0 y 100' };

    const existing = getTaxBrackets();
    for (const ex of existing) {
      const newMin = bracket.min_income;
      const newMax = bracket.max_income || Infinity;
      const exMin = ex.min_income;
      const exMax = ex.max_income || Infinity;
      if ((newMin >= exMin && newMin < exMax) || (newMax > exMin && newMax <= exMax) || (newMin <= exMin && newMax >= exMax)) {
        return { success: false, message: `Rango solapa con rango existente: $${exMin} - ${exMax === Infinity ? 'En adelante' : '$' + exMax}` };
      }
    }

    db.run('BEGIN TRANSACTION');
    const stmt = db.prepare("INSERT INTO tax_brackets (min_income, max_income, fixed_amount, percentage) VALUES (?, ?, ?, ?)");
    stmt.run([bracket.min_income, bracket.max_income || null, bracket.fixed_amount, bracket.percentage]);
    stmt.free();
    const id = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number;
    db.run('COMMIT');
    return { success: true, message: 'Rango de impuesto creado', id };
  } catch (e: any) {
    db?.run('ROLLBACK');
    return { success: false, message: e.message };
  }
}

export function updateTaxBracket(id: number, bracket: Partial<TaxBracket>): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    db.run("UPDATE tax_brackets SET min_income = ?, max_income = ?, fixed_amount = ?, percentage = ? WHERE id = ?",
      [bracket.min_income ?? 0, bracket.max_income ?? null, bracket.fixed_amount ?? 0, bracket.percentage ?? 0, id]);
    return { success: true, message: 'Rango actualizado' };
  } catch (e: any) { return { success: false, message: e.message }; }
}

export function deleteTaxBracket(id: number): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    db.run('DELETE FROM tax_brackets WHERE id = ?', [id]);
    return { success: true, message: 'Rango eliminado' };
  } catch (e: any) { return { success: false, message: e.message }; }
}

// ==========================================
// FIXED ASSETS
// ==========================================

export function getAssetCategories(): AssetCategory[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM asset_categories WHERE is_active = 1 ORDER BY name");
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<AssetCategory>((res[0].columns || (res[0] as any).lc), row));
  } catch (e) { logger.error('db-payroll', 'fetch_asset_categories', 'Error fetching asset categories', e); return []; }
}

export function createAssetCategory(category: Partial<AssetCategory>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };
  if (!category.name) return { success: false, message: 'El nombre de la categorÃ­a es requerido' };
  try {
    db.run('BEGIN TRANSACTION');
    const stmt = db.prepare(`
      INSERT INTO asset_categories (name, description, default_useful_life_years, default_depreciation_rate, account_code, depreciation_expense_account, accumulated_depreciation_account)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([category.name, category.description ?? null, category.default_useful_life_years ?? null,
      category.default_depreciation_rate ?? null, category.account_code ?? null,
      category.depreciation_expense_account ?? null, category.accumulated_depreciation_account ?? null]);
    stmt.free();
    const id = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number;
    db.run('COMMIT');
    return { success: true, message: 'CategorÃ­a creada', id };
  } catch (e: any) { db?.run('ROLLBACK'); return { success: false, message: e.message }; }
}

export function getFixedAssets(status?: string): FixedAsset[] {
  if (!db) return [];
  try {
    let query = "SELECT * FROM fixed_assets";
    if (status) query += ` WHERE status = '${status}'`;
    query += " ORDER BY acquisition_date DESC";
    const res = db.exec(query);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<FixedAsset>((res[0].columns || (res[0] as any).lc), row));
  } catch (e) { logger.error('db-payroll', 'fetch_fixed_assets', 'Error fetching fixed assets', e); return []; }
}

export function getFixedAssetById(id: number): FixedAsset | null {
  if (!db) return null;
  try {
    const res = db.exec("SELECT * FROM fixed_assets WHERE id = ?", [id]);
    if (res.length === 0 || res[0].values.length === 0) return null;
    return rowToEntity<FixedAsset>((res[0].columns || (res[0] as any).lc), res[0].values[0]);
  } catch (e) { logger.error('db-payroll', 'fetch_fixed_asset', 'Error fetching fixed asset', e); return null; }
}

export function createFixedAsset(asset: Partial<FixedAsset>, userId: number): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };
  if (!asset.name) return { success: false, message: 'El nombre es requerido' };
  if (!asset.category_id) return { success: false, message: 'La categorÃ­a es requerida' };
  if (!asset.purchase_cost || asset.purchase_cost <= 0) return { success: false, message: 'El costo de adquisiciÃ³n debe ser mayor a 0' };
  if (!asset.purchase_date) return { success: false, message: 'La fecha de adquisiciÃ³n es requerida' };
  try {
    db.run('BEGIN TRANSACTION');
    const assetCode = asset.asset_code || `FA-${Date.now().toString().slice(-6)}`;
    const check = db.exec("SELECT id FROM fixed_assets WHERE asset_code = ?", [assetCode]);
    if (check.length > 0 && check[0].values.length > 0) return { success: false, message: 'El cÃ³digo de activo ya existe' };
    const usefulLifeMonths = (asset.useful_life_years ?? 0) * 12;
    const stmt = db.prepare(`
      INSERT INTO fixed_assets (
        asset_code, name, description, category_id, purchase_date, purchase_cost,
        useful_life_years, useful_life_months, depreciation_method, salvage_value,
        current_value, accumulated_depreciation, status, location, serial_number,
        manufacturer, model, purchase_order, supplier_id, warranty_expiration, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      assetCode, asset.name, asset.description ?? null, asset.category_id,
      asset.purchase_date, asset.purchase_cost, asset.useful_life_years ?? 0, usefulLifeMonths,
      asset.depreciation_method ?? 'straight_line', asset.salvage_value ?? 0,
      asset.purchase_cost, 0, asset.status ?? 'active', asset.location ?? null,
      asset.serial_number ?? null, asset.manufacturer ?? null, asset.model ?? null,
      asset.purchase_order ?? null, asset.supplier_id ?? null,
      asset.warranty_expiration ?? null, asset.notes ?? null, userId
    ]);
    stmt.free();
    const id = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number;
    db.run('COMMIT');
    return { success: true, message: `Activo fijo creado: ${assetCode}`, id };
  } catch (e: any) { db?.run('ROLLBACK'); return { success: false, message: e.message }; }
}

export function updateFixedAsset(id: number, asset: Partial<FixedAsset>): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const original = getFixedAssetById(id);
    if (!original) return { success: false, message: 'Activo no encontrado' };
    db.run(`
      UPDATE fixed_assets SET
        name = ?, description = ?, category_id = ?, location = ?,
        serial_number = ?, manufacturer = ?, model = ?, purchase_order = ?,
        supplier_id = ?, warranty_expiration = ?, notes = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      asset.name ?? original.name, asset.description ?? null,
      asset.category_id ?? original.category_id, asset.location ?? null,
      asset.serial_number ?? null, asset.manufacturer ?? null, asset.model ?? null,
      asset.purchase_order ?? null, asset.supplier_id ?? null,
      asset.warranty_expiration ?? null, asset.notes ?? null,
      asset.status ?? 'active', id
    ]);
    return { success: true, message: 'Activo actualizado' };
  } catch (e: any) { return { success: false, message: e.message }; }
}

export function disposeAsset(id: number, disposalDate: string, disposalValue: number, disposalReason: string, userId: number): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const asset = getFixedAssetById(id);
    if (!asset) return { success: false, message: 'Activo no encontrado' };
    db.run('BEGIN TRANSACTION');
    db.run(`UPDATE fixed_assets SET status = 'disposed', disposal_date = ?, disposal_value = ?, disposal_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [disposalDate, disposalValue, disposalReason, id]);
    const netBookValue = (asset.current_value || asset.purchase_cost) - (asset.accumulated_depreciation || 0);
    const gainLoss = disposalValue - netBookValue;
    db.run('COMMIT');
    return { success: true, message: `Activo dado de baja. ${gainLoss >= 0 ? 'Ganancia' : 'PÃ©rdida'}: $${Math.abs(gainLoss).toFixed(2)}` };
  } catch (e: any) { db?.run('ROLLBACK'); return { success: false, message: e.message }; }
}

export function getAssetDepreciations(assetId: number): AssetDepreciation[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM asset_depreciations WHERE asset_id = ? ORDER BY period_date DESC", [assetId]);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<AssetDepreciation>((res[0].columns || (res[0] as any).lc), row));
  } catch (e) { logger.error('db-payroll', 'fetch_asset_depreciations', 'Error fetching asset depreciations', e); return []; }
}

export function recordDepreciation(depreciation: Partial<AssetDepreciation>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };
  if (!depreciation.asset_id) return { success: false, message: 'Asset ID requerido' };
  if (!depreciation.period_date) return { success: false, message: 'Fecha del perÃ­odo requerida' };
  if (depreciation.depreciation_amount == null) return { success: false, message: 'Monto de depreciaciÃ³n requerido' };
  if (depreciation.accumulated_depreciation == null) return { success: false, message: 'DepreciaciÃ³n acumulada requerida' };
  if (depreciation.net_book_value == null) return { success: false, message: 'Valor neto en libros requerido' };
  try {
    db.run('BEGIN TRANSACTION');
    const stmt = db.prepare(`
      INSERT INTO asset_depreciations (asset_id, period_date, depreciation_amount, accumulated_depreciation, net_book_value, is_posted)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run([depreciation.asset_id, depreciation.period_date, depreciation.depreciation_amount,
      depreciation.accumulated_depreciation, depreciation.net_book_value, depreciation.is_posted ?? 0]);
    stmt.free();
    db.run("UPDATE fixed_assets SET accumulated_depreciation = ?, current_value = ? WHERE id = ?",
      [depreciation.accumulated_depreciation, depreciation.net_book_value, depreciation.asset_id]);
    const id = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number;
    db.run('COMMIT');
    return { success: true, message: 'DepreciaciÃ³n registrada', id };
  } catch (e: any) { db?.run('ROLLBACK'); return { success: false, message: e.message }; }
}

export function calculateMonthlyDepreciation(year: number, month: number): { success: boolean; message: string; processed: number } {
  if (!db) return { success: false, message: 'Database not initialized', processed: 0 };
  try {
    const periodDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const assets = getFixedAssets('active');
    let processed = 0;
    for (const asset of assets) {
      if (!asset.id) continue;
      const stmt = db.prepare("SELECT id FROM asset_depreciations WHERE asset_id = ? AND period_date = ?");
      stmt.bind([asset.id as number, periodDate]);
      const existing = stmt.step();
      stmt.free();
      if (existing) continue;
      if (asset.depreciation_method === 'straight_line' && asset.useful_life_months > 0) {
        const depreciableAmount = asset.purchase_cost - (asset.salvage_value || 0);
        const monthlyDepreciation = depreciableAmount / asset.useful_life_months;
        const currentAccumulated = asset.accumulated_depreciation || 0;
        const newAccumulated = currentAccumulated + monthlyDepreciation;
        const netBookValue = asset.purchase_cost - newAccumulated;
        if (netBookValue >= (asset.salvage_value || 0)) {
          recordDepreciation({ asset_id: asset.id!, period_date: periodDate, depreciation_amount: monthlyDepreciation, accumulated_depreciation: newAccumulated, net_book_value: netBookValue });
          processed++;
        }
      }
    }
    return { success: true, message: `DepreciaciÃ³n calculada para ${processed} activos`, processed };
  } catch (e: any) { return { success: false, message: e.message, processed: 0 }; }
}

// ==========================================
// PAYROLL ENTRIES
// ==========================================

export function createPayrollPeriod(period: Partial<PayrollPeriod>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const stmt = db.prepare("INSERT INTO payroll_periods (name, start_date, end_date, pay_date, status, total_gross, total_net) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run([(period.name || '') as string, (period.start_date || '') as string, (period.end_date || '') as string,
      (period.pay_date || '') as string, (period.status || 'open') as string, (period.total_gross || 0) as number, (period.total_net || 0) as number]);
    const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();
    return { success: true, message: 'Periodo creado con Ã©xito', id };
  } catch (e: any) { return { success: false, message: e.message }; }
}

export function getPayrollEntries(periodId: number): (PayrollEntry & { employee_name: string })[] {
  if (!db) return [];
  try {
    const res = db.exec(`
      SELECT pe.*, (e.first_name || ' ' || e.last_name) as employee_name
      FROM payroll_entries pe JOIN employees e ON pe.employee_id = e.id
      WHERE pe.period_id = ?
    `, [periodId]);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<PayrollEntry & { employee_name: string }>((res[0].columns || (res[0] as any).lc), row));
  } catch (e) { logger.error('db-payroll', 'fetch_payroll_entries', 'Error fetching payroll entries', e); return []; }
}

export function createPayrollEntry(entry: Partial<PayrollEntry>, items: Partial<PayrollLineItem>[]): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("INSERT INTO payroll_entries (employee_id, period_id, gross_amount, deductions_amount, net_amount, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run([(entry.employee_id) as number, (entry.period_id) as number, (entry.gross_amount) as number,
      (entry.deductions_amount || 0) as number, (entry.net_amount) as number, (entry.status || 'draft') as string, (entry.notes || null) as string | null]);
    const entryId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();
    const itemStmt = db.prepare("INSERT INTO payroll_line_items (payroll_entry_id, type, category, description, amount) VALUES (?, ?, ?, ?, ?)");
    for (const item of items) {
      itemStmt.run([entryId, (item.type || 'earning') as string, (item.category || '') as string, (item.description || '') as string, (item.amount || 0) as number]);
    }
    itemStmt.free();
    db.run("COMMIT");
    return { success: true, message: 'NÃ³mina procesada para empleado', id: entryId };
  } catch (e: any) { db.run("ROLLBACK"); return { success: false, message: e.message }; }
}

export function getPayrollLineItems(entryId: number): PayrollLineItem[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM payroll_line_items WHERE payroll_entry_id = ?", [entryId]);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<PayrollLineItem>((res[0].columns || (res[0] as any).lc), row));
  } catch (e) { logger.error('db-payroll', 'fetch_payroll_line_items', 'Error fetching payroll line items', e); return []; }
}

export interface PayrollFilter {
  employee_id?: number;
  status?: string;
  year?: number;
}

export function getPayrolls(filters: PayrollFilter = {}): PayrollRecord[] {
  if (!db) return [];
  try {
    let query = "SELECT * FROM payroll WHERE 1=1";
    const params: any[] = [];
    if (filters.employee_id) { query += " AND employee_id = ?"; params.push(filters.employee_id); }
    if (filters.status) { query += " AND status = ?"; params.push(filters.status); }
    if (filters.year) { query += " AND strftime('%Y', pay_date) = ?"; params.push(filters.year.toString()); }
    query += " ORDER BY pay_date DESC";
    const res = db.exec(query, params);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<PayrollRecord>((res[0].columns || (res[0] as any).lc), row));
  } catch (e) { logger.error('db-payroll', 'fetch_payrolls', 'Error fetching payrolls', e); return []; }
}

// ==========================================
// PAYROLL ENGINE (Phase 4)
// ==========================================

export function hasUsers(): boolean {
  if (!db) return false;
  try {
    const res = db.exec("SELECT COUNT(*) FROM users");
    return res.length > 0 && (res[0].values[0][0] as number) > 0;
  } catch (error) { logger.error('db-payroll', 'check_users', 'Error checking users', error); return false; }
}

export function getPayroll(payrollId: number): PayrollRecord | null {
  if (!db) return null;
  try {
    const result = db.exec('SELECT * FROM payroll WHERE id = ?', [payrollId]);
    if (result.length === 0) return null;
    return rowToEntity<PayrollRecord>((result[0].columns || (result[0] as any).lc), result[0].values[0]);
  } catch (error) { logger.error('db-payroll', 'get_payroll', 'Error getting payroll', error); return null; }
}

export function getAllPayrolls(filters?: { employeeId?: number; startDate?: string; endDate?: string; status?: 'draft' | 'approved' | 'voided' }): Payroll[] {
  if (!db) return [];
  try {
    let query = 'SELECT * FROM payroll WHERE 1=1';
    const params: any[] = [];
    if (filters?.employeeId) { query += ' AND employee_id = ?'; params.push(filters.employeeId); }
    if (filters?.startDate) { query += ' AND pay_date >= ?'; params.push(filters.startDate); }
    if (filters?.endDate) { query += ' AND pay_date <= ?'; params.push(filters.endDate); }
    if (filters?.status) { query += ' AND status = ?'; params.push(filters.status); }
    query += ' ORDER BY pay_date DESC, created_at DESC';
    const result = db.exec(query, params);
    if (result.length === 0) return [];
    return result[0].values.map((row: any) => rowToEntity<Payroll>((result[0].columns || (result[0] as any).lc), row));
  } catch (error) { logger.error('db-payroll', 'get_all_payrolls', 'Error getting all payrolls', error); return []; }
}

export function getQuarterlyPayrolls(year: number, quarter: number): Payroll[] {
  if (!db) return [];
  try {
    const quarterMonths: Record<number, string[]> = { 1: ['01','02','03'], 2: ['04','05','06'], 3: ['07','08','09'], 4: ['10','11','12'] };
    const months = quarterMonths[quarter];
    if (!months) return [];
    const result = db.exec("SELECT * FROM payroll WHERE pay_date >= ? AND pay_date <= ? AND status = 'approved' ORDER BY pay_date",
      [`${year}-${months[0]}-01`, `${year}-${months[2]}-31`]);
    if (result.length === 0) return [];
    return result[0].values.map((row: any) => rowToEntity<Payroll>((result[0].columns || (result[0] as any).lc), row));
  } catch (error) { logger.error('db-payroll', 'get_quarterly_payrolls', 'Error getting quarterly payrolls', error); return []; }
}

export function getAnnualPayrolls(employeeId: number, year: number): Payroll[] {
  if (!db) return [];
  try {
    const result = db.exec("SELECT * FROM payroll WHERE employee_id = ? AND strftime('%Y', pay_date) = ? AND status = 'approved' ORDER BY pay_date",
      [employeeId, year.toString()]);
    if (result.length === 0) return [];
    return result[0].values.map((row: any) => rowToEntity<Payroll>((result[0].columns || (result[0] as any).lc), row));
  } catch (error) { logger.error('db-payroll', 'get_annual_payrolls', 'Error getting annual payrolls', error); return []; }
}

// ==========================================
// FISCAL SETTINGS
// ==========================================

export function getFiscalSettings(): FiscalSettings {
  try {
    const res = db?.exec("SELECT * FROM company_data LIMIT 1");
    if (!res || res.length === 0 || res[0].values.length === 0) {
      return { tax_year_start: '2025-01-01', tax_frequency: 'monthly', sales_tax_method: 'accrual', default_tax_rate: 0.06, dr15_filing_day: 20, active: true };
    }
    const columns = (res[0].columns || (res[0] as any).lc);
    const data: any = {};
    columns.forEach((col: string, i: number) => { data[col] = res[0].values[0][i]; });
    return {
      id: data.id,
      tax_year_start: data.fiscal_year_start ? `2025-${data.fiscal_year_start}` : '2025-01-01',
      tax_frequency: data.tax_frequency || 'monthly',
      sales_tax_method: data.sales_tax_method || 'accrual',
      default_tax_rate: 0.06,
      dr15_filing_day: data.dr15_filing_day || 20,
      active: data.is_active ?? true
    };
  } catch (error) {
    logger.error('db-payroll', 'get_fiscal_settings', 'Error getting fiscal settings', error);
    return { tax_year_start: '2025-01-01', tax_frequency: 'monthly', sales_tax_method: 'accrual', default_tax_rate: 0.06, dr15_filing_day: 20, active: true };
  }
}

export function updateFiscalSettings(settings: Partial<FiscalSettings>): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };
  try {
    const current = db.exec("SELECT id FROM company_data LIMIT 1");
    if (!current || current.length === 0) throw new Error('No company data found');
    const companyId = current[0].values[0][0] as number;
    const updateData: any = {};
    if (settings.tax_year_start) { const parts = settings.tax_year_start.split('-'); if (parts.length >= 3) updateData.fiscal_year_start = `${parts[1]}-${parts[2]}`; }
    if (settings.tax_frequency) updateData.tax_frequency = settings.tax_frequency;
    if (settings.sales_tax_method) updateData.sales_tax_method = settings.sales_tax_method;
    if (settings.dr15_filing_day) updateData.dr15_filing_day = settings.dr15_filing_day;
    if (Object.keys(updateData).length === 0) return { success: true, message: 'Sin cambios' };
    const keys = Object.keys(updateData);
    const params = keys.map(k => updateData[k]);
    params.push(companyId);
    db.run(`UPDATE company_data SET ${keys.map(k => `${k} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, params);
    setTimeout(() => saveDatabase(), 1000);
    return { success: true, message: 'ConfiguraciÃ³n fiscal actualizada correctamente' };
  } catch (error) {
    logger.error('db-payroll', 'update_fiscal_settings', 'Error updating fiscal settings', error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

