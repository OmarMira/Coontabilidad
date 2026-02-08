import initSqlJs from 'sql.js';
import { BasicEncryption } from '../core/security/BasicEncryption';
import { logger } from '../core/logging/SystemLogger';
import { ViewManager } from './views/ViewManager';
import { DatabaseInitializer } from './DatabaseInitializer';
import { DatabaseService } from './DatabaseService';
import { SQLiteEngine } from '../core/database/SQLiteEngine';
import { MigrationEngine } from '../core/migrations/MigrationEngine';
import { verifyRoles } from '../utils/verifyRoles';
import { MassiveSeeder } from './seeding/MassiveSeeder';
import AuditTrailService from '../services/AuditTrailService';

// Instancia global de la base de datos (any para compatibilidad con sql.js)
let db: any = null;

// Instancia global de SQLiteEngine (wrapper tipado sobre sql.js)
let dbEngine: SQLiteEngine | null = null;

// Exportar la instancia de db para acceso externo
export { db };
export const getDB = () => db;

// Exportar la instancia de dbEngine para servicios tipados
export { dbEngine };

/**
 * Obtiene la instancia de SQLiteEngine
 * @throws Error si la base de datos no ha sido inicializada
 */
export const getDBEngine = (): SQLiteEngine => {
  if (!dbEngine) {
    throw new Error('Database engine not initialized. Call initDB() first.');
  }
  return dbEngine;
};

// --- SANDBOX SECURITY INTERCEPTOR ---
const GUEST_LIMIT_PER_TABLE = 20;

export async function checkGuestRestriction(userId: number | undefined, table: string, action: 'create' | 'update' | 'delete'): Promise<void> {
  if (!db || !userId) return;

  // Check user role
  try {
    const userRes = db.exec("SELECT r.name FROM users u JOIN user_roles r ON u.role_id = r.id WHERE u.id = ?", [userId]);
    if (!userRes.length || !userRes[0].values.length) return;

    const roleName = (userRes[0].values[0][0] as string).toLowerCase();

    // Only restrict 'guest' or 'demo' roles
    if (!['guest', 'demo', 'viewer'].includes(roleName)) return;

    // Rule 1: No modifications to 'users' table
    if (table === 'users') {
      throw new Error('SANDBOX SECURITY: Las cuentas demo no pueden modificar usuarios del sistema.');
    }

    // Rule 2: Limit records on ANY table creation
    if (action === 'create') {
      // Safe-guard against SQL injection in table name implies internal usage only
      const countRes = db.exec(`SELECT COUNT(*) FROM ${table}`);
      const count = countRes[0].values[0][0] as number;
      if (count >= GUEST_LIMIT_PER_TABLE) {
        throw new Error(`SANDBOX DEMO LIMIT: No puedes crear más de ${GUEST_LIMIT_PER_TABLE} registros en ${table} durante la demostración.`);
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('SANDBOX')) throw e;
    // Ignore other errors to not block logic if check fails (fail-open vs fail-close trade-off)
    // For security, usually fail-close, but here we assume DB errors shouldn't block admins if check fails.
  }
}

// ==========================================
// DASHBOARD & ANALYTICS
// ==========================================

export interface MonthlySummary {
  month: string;
  revenue: number;
  expenses: number;
}

// ------------------------------------------
// PROY ROLL (NOMINA) DATA TYPES
// ------------------------------------------

export interface Employee {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  hire_date: string;
  department?: string;
  position?: string;
  salary_type: 'monthly' | 'hourly';
  salary_rate: number;
  status: 'active' | 'inactive' | 'on_leave';
  florida_county?: string;
  
  // Payroll Engine Fields
  hourly_rate?: number;
  salary?: number;
  pay_type?: 'hourly' | 'salaried';
  filing_status?: 'single' | 'married' | 'married_separate' | 'head_of_household';
  allowances?: number;
  additional_withholding?: number;
  ytd_gross_pay?: number;
  ytd_federal_tax?: number;
  ytd_fica?: number;
  ytd_medicare?: number;
  ssn?: string;
}

export interface PayrollPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  pay_date: string;
  status: 'open' | 'processing' | 'closed' | 'cancelled';
  total_gross: number;
  total_net: number;
}

export interface PayrollEntry {
  id: number;
  employee_id: number;
  period_id: number;
  journal_entry_id?: number;
  gross_amount: number;
  deductions_amount: number;
  net_amount: number;
  status: 'draft' | 'verified' | 'paid';
  notes?: string;
}

export interface PayrollLineItem {
  id: number;
  payroll_entry_id: number;
  type: 'earning' | 'deduction';
  category: string;
  description: string;
  amount: number;
}

export interface PayrollSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  category: string;
  description?: string;
}

// Payroll Engine Interface
export interface Payroll {
  id?: number;
  employee_id: number;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  
  // Hours and rates
  regular_hours: number;
  overtime_hours: number;
  hourly_rate?: number;
  
  // Earnings
  regular_pay: number;
  overtime_pay: number;
  bonuses: number;
  commissions: number;
  gross_pay: number;
  
  // Taxes
  social_security_tax: number;
  medicare_tax: number;
  medicare_additional_tax: number;
  federal_income_tax: number;
  
  // Deductions
  other_deductions: number;
  total_deductions: number;
  
  // Net
  net_pay: number;
  
  // Journal entry
  journal_entry_id?: number;
  
  // Audit
  status: 'draft' | 'approved' | 'paid' | 'voided';
  processed_by?: number;
  processed_at?: string;
  approved_by?: number;
  approved_at?: string;
  
  created_at?: string;
  updated_at?: string;
}

export interface TaxBracket {
  id?: number;
  min_income: number;
  max_income?: number;
  fixed_amount: number;
  percentage: number;
  type?: 'monthly' | 'annual';
}

// =============================================
// INTERFACES DE ACTIVOS FIJOS (FIXED ASSETS)
// =============================================

export interface AssetCategory {
  id?: number;
  name: string;
  description?: string;
  default_useful_life_years?: number;
  default_depreciation_rate?: number;
  account_code?: string;
  depreciation_expense_account?: string;
  accumulated_depreciation_account?: string;
  is_active?: number;
  created_at?: string;
}

export interface FixedAsset {
  id?: number;
  asset_code: string;
  name: string;
  description?: string;
  category_id: number;
  acquisition_date: string;
  acquisition_cost: number;
  useful_life_years: number;
  useful_life_months: number;
  depreciation_method: 'straight_line' | 'declining_balance' | 'units_of_production';
  salvage_value?: number;
  current_value?: number;
  accumulated_depreciation?: number;
  status: 'active' | 'disposed' | 'fully_depreciated' | 'under_maintenance';
  location?: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  purchase_order?: string;
  supplier_id?: number;
  warranty_expiration?: string;
  notes?: string;
  disposal_date?: string;
  disposal_value?: number;
  disposal_reason?: string;
  created_at?: string;
  created_by?: number;
  updated_at?: string;
}

export interface AssetDepreciation {
  id?: number;
  asset_id: number;
  period_date: string;
  depreciation_amount: number;
  accumulated_depreciation: number;
  net_book_value: number;
  journal_entry_id?: number;
  is_posted?: number;
  created_at?: string;
}

/**
 * Obtiene un resumen mensual de ingresos y gastos para el Dashboard
 */
export function getMonthlyFinancialSummary(): MonthlySummary[] {
  if (!db) return [];
  try {
    const currentYear = new Date().getFullYear();
    const res = db.exec(`
      SELECT 
        strftime('%m', entry_date) as month,
        SUM(total_debit) as revenue
      FROM journal_entries
      WHERE strftime('%Y', entry_date) = ? AND description LIKE '%Venta%'
      GROUP BY month
      ORDER BY month ASC
    `, [currentYear.toString()]);

    const expenseRes = db.exec(`
      SELECT 
        strftime('%m', entry_date) as month,
        SUM(total_debit) as expenses
      FROM journal_entries
      WHERE strftime('%Y', entry_date) = ? AND description LIKE '%Compra%'
      GROUP BY month
      ORDER BY month ASC
    `, [currentYear.toString()]);

    // Mapear meses 01-12
    const summary: Record<string, MonthlySummary> = {};
    for (let i = 1; i <= 12; i++) {
      const m = i.toString().padStart(2, '0');
      summary[m] = { month: m, revenue: 0, expenses: 0 };
    }

    if (res.length > 0) {
      res[0].values.forEach((row: any) => {
        const m = row[0] as string;
        summary[m].revenue = row[1] as number;
      });
    }

    if (expenseRes.length > 0) {
      expenseRes[0].values.forEach((row: any) => {
        const m = row[0] as string;
        summary[m].expenses = row[1] as number;
      });
    }

    return Object.values(summary);
  } catch (e) {
    console.error('Error fetching monthly summary:', e);
    return [];
  }
}

// ==========================================
// EMPLOYEES & PAYROLL
// ==========================================

export function getEmployees(): Employee[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM employees ORDER BY last_name, first_name");
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<Employee>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching employees:', e);
    return [];
  }
}

export function getEmployeeById(id: number): Employee | null {
  if (!db) return null;
  try {
    const res = db.exec("SELECT * FROM employees WHERE id = ?", [id]);
    if (res.length === 0 || res[0].values.length === 0) return null;
    return rowToEntity<Employee>(res[0].columns, res[0].values[0]);
  } catch (e) {
    console.error('Error fetching employee:', e);
    return null;
  }
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

    return { success: true, message: 'Empleado registrado con éxito', id };
  } catch (e: any) {
    console.error('Error creating employee:', e);
    return { success: false, message: e.message };
  }
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
    return { success: true, message: 'Empleado actualizado con éxito' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export function getPayrollPeriods(): PayrollPeriod[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM payroll_periods ORDER BY start_date DESC");
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<PayrollPeriod>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching payroll periods:', e);
    return [];
  }
}

export function getPayrollSettings(): PayrollSetting[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM payroll_settings");
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<PayrollSetting>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching payroll settings:', e);
    return [];
  }
}

export function updatePayrollSetting(key: string, value: string): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    db.run("UPDATE payroll_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?", [value, key]);
    return { success: true, message: 'Configuración actualizada' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export function getTaxBrackets(): TaxBracket[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM tax_brackets ORDER BY min_income ASC");
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<TaxBracket>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching tax brackets:', e);
    return [];
  }
}

/**
 * Crea un nuevo rango de impuesto (Tax Bracket)
 */
export function createTaxBracket(bracket: Partial<TaxBracket>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validaciones básicas
    if (bracket.min_income === undefined || bracket.min_income < 0) {
      return { success: false, message: 'Ingreso mínimo inválido' };
    }
    if (bracket.fixed_amount === undefined || bracket.fixed_amount < 0) {
      return { success: false, message: 'Cuota fija inválida' };
    }
    if (bracket.percentage === undefined || bracket.percentage < 0 || bracket.percentage > 1) {
      return { success: false, message: 'Porcentaje debe estar entre 0 y 100' };
    }

    // Validar que no existan rangos solapados
    const existing = getTaxBrackets();
    for (const ex of existing) {
      const newMin = bracket.min_income;
      const newMax = bracket.max_income || Infinity;
      const exMin = ex.min_income;
      const exMax = ex.max_income || Infinity;

      // Detectar solapamiento
      if (
        (newMin >= exMin && newMin < exMax) ||
        (newMax > exMin && newMax <= exMax) ||
        (newMin <= exMin && newMax >= exMax)
      ) {
        return { success: false, message: `Rango solapa con rango existente: $${exMin} - ${exMax === Infinity ? 'En adelante' : '$' + exMax}` };
      }
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO tax_brackets (min_income, max_income, fixed_amount, percentage)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run([
      bracket.min_income,
      bracket.max_income || null,
      bracket.fixed_amount,
      bracket.percentage
    ]);
    stmt.free();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const bracketId = result[0]?.values[0]?.[0] as number;

    db.run('COMMIT');

    return { success: true, message: 'Rango de impuesto creado', id: bracketId };
  } catch (e: any) {
    db?.run('ROLLBACK');
    console.error('Error creating tax bracket:', e);
    return { success: false, message: e.message };
  }
}

/**
 * Actualiza un rango de impuesto existente
 */
export function updateTaxBracket(id: number, bracket: Partial<TaxBracket>): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run(`
      UPDATE tax_brackets 
      SET min_income = ?, max_income = ?, fixed_amount = ?, percentage = ?
      WHERE id = ?
    `, [
      bracket.min_income ?? 0,
      bracket.max_income ?? null,
      bracket.fixed_amount ?? 0,
      bracket.percentage ?? 0,
      id
    ]);

    return { success: true, message: 'Rango actualizado' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

/**
 * Elimina un rango de impuesto
 */
export function deleteTaxBracket(id: number): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('DELETE FROM tax_brackets WHERE id = ?', [id]);
    return { success: true, message: 'Rango eliminado' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// =============================================
// FUNCIONES DE ACTIVOS FIJOS (FIXED ASSETS)
// =============================================

/**
 * Obtiene todas las categorías de activos
 */
export function getAssetCategories(): AssetCategory[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM asset_categories WHERE is_active = 1 ORDER BY name");
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<AssetCategory>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching asset categories:', e);
    return [];
  }
}

/**
 * Crea una nueva categoría de activos
 */
export function createAssetCategory(category: Partial<AssetCategory>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  if (!category.name) return { success: false, message: 'El nombre de la categoría es requerido' };

  try {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO asset_categories (name, description, default_useful_life_years, default_depreciation_rate, account_code, depreciation_expense_account, accumulated_depreciation_account)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      category.name as string,
      category.description ?? null,
      category.default_useful_life_years ?? null,
      category.default_depreciation_rate ?? null,
      category.account_code ?? null,
      category.depreciation_expense_account ?? null,
      category.accumulated_depreciation_account ?? null
    ]);
    stmt.free();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const categoryId = result[0]?.values[0]?.[0] as number;

    db.run('COMMIT');
    return { success: true, message: 'Categoría creada', id: categoryId };
  } catch (e: any) {
    db?.run('ROLLBACK');
    return { success: false, message: e.message };
  }
}

/**
 * Obtiene todos los activos fijos
 */
export function getFixedAssets(status?: string): FixedAsset[] {
  if (!db) return [];
  try {
    let query = "SELECT * FROM fixed_assets";
    if (status) {
      query += ` WHERE status = '${status}'`;
    }
    query += " ORDER BY acquisition_date DESC";

    const res = db.exec(query);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<FixedAsset>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching fixed assets:', e);
    return [];
  }
}

/**
 * Obtiene un activo por ID con información de categoría
 */
export function getFixedAssetById(id: number): FixedAsset | null {
  if (!db) return null;
  try {
    const res = db.exec("SELECT * FROM fixed_assets WHERE id = ?", [id]);
    if (res.length === 0 || res[0].values.length === 0) return null;
    return rowToEntity<FixedAsset>(res[0].columns, res[0].values[0]);
  } catch (e) {
    console.error('Error fetching fixed asset:', e);
    return null;
  }
}

/**
 * Crea un nuevo activo fijo
 */
export function createFixedAsset(asset: Partial<FixedAsset>, userId: number): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Val idaciones
    if (!asset.name) return { success: false, message: 'El nombre es requerido' };
    if (!asset.category_id) return { success: false, message: 'La categoría es requerida' };
    if (!asset.acquisition_cost || asset.acquisition_cost <= 0) return { success: false, message: 'El costo de adquisición debe ser mayor a 0' };
    if (!asset.acquisition_date) return { success: false, message: 'La fecha de adquisición es requerida' };

    db.run('BEGIN TRANSACTION');

    // Generar código automático si no existe
    let assetCode = asset.asset_code;
    if (!assetCode) {
      const category = getAssetCategoryById(asset.category_id);
      const prefix = category?.name?.substring(0, 3).toUpperCase() || 'AST';
      const count = db.exec("SELECT COUNT(*) as count FROM fixed_assets")[0].values[0][0] as number;
      assetCode = `${prefix}-${String(count + 1).padStart(5, '0')}`;
    }

    const usefulLifeMonths = (asset.useful_life_years || 0) * 12;

    const stmt = db.prepare(`
      INSERT INTO fixed_assets (
        asset_code, name, description, category_id, acquisition_date, acquisition_cost,
        useful_life_years, useful_life_months, depreciation_method, salvage_value,
        current_value, accumulated_depreciation, status, location, serial_number,
        manufacturer, model, purchase_order, supplier_id, warranty_expiration, notes,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      assetCode as string,
      asset.name as string,
      asset.description ?? null,
      asset.category_id as number,
      asset.acquisition_date as string,
      asset.acquisition_cost as number,
      asset.useful_life_years ?? 0,
      usefulLifeMonths,
      asset.depreciation_method ?? 'straight_line',
      asset.salvage_value ?? 0,
      asset.acquisition_cost as number, // current_value inicialmente igual al costo
      0, // accumulated_depreciation
      asset.status ?? 'active',
      asset.location ?? null,
      asset.serial_number ?? null,
      asset.manufacturer ?? null,
      asset.model ?? null,
      asset.purchase_order ?? null,
      asset.supplier_id ?? null,
      asset.warranty_expiration ?? null,
      asset.notes ?? null,
      userId
    ]);
    stmt.free();

    const result = db.exec('SELECT last_insert_rowid() as id');
    const assetId = result[0]?.values[0]?.[0] as number;

    db.run('COMMIT');
    return { success: true, message: `Activo fijo creado: ${assetCode}`, id: assetId };
  } catch (e: any) {
    db?.run('ROLLBACK');
    return { success: false, message: e.message };
  }
}

/**
 * Actualiza un activo fijo
 */
export function updateFixedAsset(id: number, asset: Partial<FixedAsset>): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Get original asset for required fields
    const originalAsset = getFixedAssetById(id);
    if (!originalAsset) return { success: false, message: 'Activo no encontrado' };

    db.run(`
      UPDATE fixed_assets SET
        name = ?, description = ?, category_id = ?, location = ?,
        serial_number = ?, manufacturer = ?, model = ?, purchase_order = ?,
        supplier_id = ?, warranty_expiration = ?, notes = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      asset.name ?? originalAsset.name,
      asset.description ?? null,
      asset.category_id ?? originalAsset.category_id,
      asset.location ?? null,
      asset.serial_number ?? null,
      asset.manufacturer ?? null,
      asset.model ?? null,
      asset.purchase_order ?? null,
      asset.supplier_id ?? null,
      asset.warranty_expiration ?? null,
      asset.notes ?? null,
      asset.status ?? 'active',
      id
    ]);

    return { success: true, message: 'Activo actualizado' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

/**
 * Registra la disposición (venta/baja) de un activo
 */
export function disposeAsset(
  id: number,
  disposalDate: string,
  disposalValue: number,
  disposalReason: string,
  userId: number
): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const asset = getFixedAssetById(id);
    if (!asset) return { success: false, message: 'Activo no encontrado' };

    db.run('BEGIN TRANSACTION');

    // Actualizar activo
    db.run(`
      UPDATE fixed_assets SET
        status = 'disposed',
        disposal_date = ?,
        disposal_value = ?,
        disposal_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [disposalDate, disposalValue, disposalReason, id]);

    // Calcular ganancia/pérdida
    const netBookValue = (asset.current_value || asset.acquisition_cost) - (asset.accumulated_depreciation || 0);
    const gainLoss = disposalValue - netBookValue;

    // TODO: Crear asiento contable de disposición
    // Débito: Efectivo (disposalValue)
    // Débito: Depreciación Acumulada (accumulated_depreciation)
    // Débito/Crédito: Ganancia/Pérdida en venta
    // Crédito: Activo Fijo (acquisition_cost)

    db.run('COMMIT');
    return {
      success: true,
      message: `Activo dado de baja. ${gainLoss >= 0 ? 'Ganancia' : 'Pérdida'}: $${Math.abs(gainLoss).toFixed(2)}`
    };
  } catch (e: any) {
    db?.run('ROLLBACK');
    return { success: false, message: e.message };
  }
}

/**
 * Obtiene el historial de depreciaciones de un activo
 */
export function getAssetDepreciations(assetId: number): AssetDepreciation[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM asset_depreciations WHERE asset_id = ? ORDER BY period_date DESC", [assetId]);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<AssetDepreciation>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching asset depreciations:', e);
    return [];
  }
}

/**
 * Registra una depreciación mensual
 */
export function recordDepreciation(depreciation: Partial<AssetDepreciation>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  // Validate required fields
  if (!depreciation.asset_id) return { success: false, message: 'Asset ID requerido' };
  if (!depreciation.period_date) return { success: false, message: 'Fecha del período requerida' };
  if (depreciation.depreciation_amount == null) return { success: false, message: 'Monto de depreciación requerido' };
  if (depreciation.accumulated_depreciation == null) return { success: false, message: 'Depreciación acumulada requerida' };
  if (depreciation.net_book_value == null) return { success: false, message: 'Valor neto en libros requerido' };

  // Validar bloqueo de periodos
  if (isDateLocked(depreciation.period_date)) {
    return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado.' };
  }

  try {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO asset_depreciations (asset_id, period_date, depreciation_amount, accumulated_depreciation, net_book_value, is_posted)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      depreciation.asset_id as number,
      depreciation.period_date as string,
      depreciation.depreciation_amount as number,
      depreciation.accumulated_depreciation as number,
      depreciation.net_book_value as number,
      depreciation.is_posted ?? 0
    ]);
    stmt.free();

    // Actualizar activo con nueva depreciación acumulada
    db.run(`
      UPDATE fixed_assets SET
        accumulated_depreciation = ?,
        current_value = ?
      WHERE id = ?
    `, [
      depreciation.accumulated_depreciation as number,
      depreciation.net_book_value as number,
      depreciation.asset_id as number
    ]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const depId = result[0]?.values[0]?.[0] as number;

    db.run('COMMIT');
    return { success: true, message: 'Depreciación registrada', id: depId };
  } catch (e: any) {
    db?.run('ROLLBACK');
    return { success: false, message: e.message };
  }
}

/**
 * Calcula y registra la depreciación mensual de todos los activos activos
 */
export function calculateMonthlyDepreciation(periodDate: string, userId: number): { success: boolean; message: string; processed: number } {
  if (!db) return { success: false, message: 'Database not initialized', processed: 0 };

  try {
    const assets = getFixedAssets('active');
    let processed = 0;

    for (const asset of assets) {
      if (!asset.id) continue; // Skip assets without ID

      // Verificar si ya existe depreciación para este período
      const stmt = db.prepare("SELECT id FROM asset_depreciations WHERE asset_id = ? AND period_date = ?");
      stmt.bind([asset.id as number, periodDate]);
      const existing = stmt.step();
      stmt.free();

      if (existing) {
        continue; // Ya existe, skip
      }

      // Calcular depreciación mensual (método lineal)
      if (asset.depreciation_method === 'straight_line' && asset.useful_life_months > 0) {
        const depreciableAmount = asset.acquisition_cost - (asset.salvage_value || 0);
        const monthlyDepreciation = depreciableAmount / asset.useful_life_months;
        const currentAccumulated = asset.accumulated_depreciation || 0;
        const newAccumulated = currentAccumulated + monthlyDepreciation;
        const netBookValue = asset.acquisition_cost - newAccumulated;

        // No depreciar más allá del valor de salvamento
        if (netBookValue >= (asset.salvage_value || 0)) {
          recordDepreciation({
            asset_id: asset.id!,
            period_date: periodDate,
            depreciation_amount: monthlyDepreciation,
            accumulated_depreciation: newAccumulated,
            net_book_value: netBookValue
          });
          processed++;
        }
      }
    }

    return { success: true, message: `Depreciación calculada para ${processed} activos`, processed };
  } catch (e: any) {
    return { success: false, message: e.message, processed: 0 };
  }
}

/**
 * Helper: Obtiene categoría por ID
 */
function getAssetCategoryById(id: number): AssetCategory | null {
  if (!db) return null;
  try {
    const stmt = db.prepare("SELECT * FROM asset_categories WHERE id = ?");
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const result = stmt.getAsObject() as unknown as AssetCategory;
    stmt.free();
    return result;
  } catch (e) {
    return null;
  }
}

export function createPayrollPeriod(period: Partial<PayrollPeriod>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const stmt = db.prepare(`
      INSERT INTO payroll_periods (name, start_date, end_date, pay_date, status, total_gross, total_net)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      (period.name || '') as string,
      (period.start_date || '') as string,
      (period.end_date || '') as string,
      (period.pay_date || '') as string,
      (period.status || 'open') as string,
      (period.total_gross || 0) as number,
      (period.total_net || 0) as number
    ]);
    const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();
    return { success: true, message: 'Periodo creado con éxito', id };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export function getPayrollEntries(periodId: number): (PayrollEntry & { employee_name: string })[] {
  if (!db) return [];
  try {
    const res = db.exec(`
      SELECT pe.*, (e.first_name || ' ' || e.last_name) as employee_name 
      FROM payroll_entries pe
      JOIN employees e ON pe.employee_id = e.id
      WHERE pe.period_id = ?
    `, [periodId]);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<PayrollEntry & { employee_name: string }>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching payroll entries:', e);
    return [];
  }
}

export function createPayrollEntry(entry: Partial<PayrollEntry>, items: Partial<PayrollLineItem>[]): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare(`
      INSERT INTO payroll_entries (employee_id, period_id, gross_amount, deductions_amount, net_amount, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      (entry.employee_id) as number,
      (entry.period_id) as number,
      (entry.gross_amount) as number,
      (entry.deductions_amount || 0) as number,
      (entry.net_amount) as number,
      (entry.status || 'draft') as string,
      (entry.notes || null) as string | null
    ]);
    const entryId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();

    const itemStmt = db.prepare(`
      INSERT INTO payroll_line_items (payroll_entry_id, type, category, description, amount)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const item of items) {
      itemStmt.run([
        entryId,
        (item.type || 'earning') as string,
        (item.category || '') as string,
        (item.description || '') as string,
        (item.amount || 0) as number
      ]);
    }
    itemStmt.free();

    db.run("COMMIT");
    return { success: true, message: 'Nómina procesada para empleado', id: entryId };
  } catch (e: any) {
    db.run("ROLLBACK");
    return { success: false, message: e.message };
  }
}

export function getPayrollLineItems(entryId: number): PayrollLineItem[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM payroll_line_items WHERE payroll_entry_id = ?", [entryId]);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<PayrollLineItem>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching payroll line items:', e);
    return [];
  }
}

let isInitialized = false;
const opfsRoot: FileSystemDirectoryHandle | null = null;
const dbFile: FileSystemFileHandle | null = null;
let encryptionEnabled = false;
let currentPassword: string | null = null;

// Comprimir datos para localStorage
const compressData = async (data: Uint8Array): Promise<string> => {
  let dataBuffer: ArrayBuffer;
  if (data.buffer instanceof ArrayBuffer) {
    dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } else {
    const tempArray = new Uint8Array(data.length);
    tempArray.set(data);
    dataBuffer = tempArray.buffer;
  }
  return await BasicEncryption.compressData(new Uint8Array(dataBuffer));
};

// Cargar desde localStorage
const loadFromLocalStorage = async (): Promise<Uint8Array | null> => {
  try {
    const stored = localStorage.getItem('accountexpress-db');
    const isEncrypted = localStorage.getItem('accountexpress-encrypted') === 'true';

    if (!stored) return null;

    const decoded = atob(stored);
    let data = new Uint8Array(decoded.split('').map(char => char.charCodeAt(0)));

    if (isEncrypted && encryptionEnabled && currentPassword) {
      try {
        const { salt, iv, encrypted } = BasicEncryption.separateEncryptedData(data);
        const decryptedData = await BasicEncryption.decrypt(encrypted, salt, iv, currentPassword);
        const tempArray = new Uint8Array(decryptedData.length);
        tempArray.set(decryptedData);
        data = tempArray;
        console.log('Database decrypted from localStorage');
      } catch (error) {
        console.error('Failed to decrypt from localStorage:', error);
        return null;
      }
    }
    return data;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

// Configuración de persistencia
export const DB_NAME = 'accountexpress.db';
const BACKUP_INTERVAL = 30000; // 30 segundos

// Roles con privilegios de ver todos los datos (Admin, Contadores, Auditores)
export const PRIVILEGED_ROLES = ['admin', 'contador', 'auditor', 'viewer', 'accountant'];

/**
 * Mapea una fila de base de datos a una entidad tipada
 */
function rowToEntity<T>(columns: string[], row: initSqlJs.SqlValue[]): T {
  const entity = {} as Record<string, unknown>;
  columns.forEach((col, index) => {
    entity[col] = row[index];
  });
  return entity as unknown as T;
}

// ==========================================
// INTERFACES PARA CIERRE CONTABLE
// ==========================================

export interface FiscalYear {
  id?: number;
  year: number;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed' | 'locked';
  created_at?: string;
}

export interface AccountingPeriod {
  id?: number;
  fiscal_year_id: number;
  month: number;
  status: 'open' | 'closing' | 'closed' | 'locked';
  start_date: string;
  end_date: string;
  closed_at?: string;
  closed_by?: number;
}

// ==========================================
// CIERRE CONTABLE Y PERIODOS (CORE)
// ==========================================

export function getFiscalYears(): FiscalYear[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM fiscal_years ORDER BY year DESC");
    if (res.length > 0) {
      return res[0].values.map((row: any) => rowToEntity<FiscalYear>(res[0].columns, row));
    }
  } catch (e) { console.error(e); }
  return [];
}

export function getAccountingPeriods(fiscalYearId: number): AccountingPeriod[] {
  if (!db) return [];
  try {
    const res = db.exec("SELECT * FROM accounting_periods WHERE fiscal_year_id = ? ORDER BY month ASC", [fiscalYearId]);
    if (res.length > 0) {
      return res[0].values.map((row: any) => rowToEntity<AccountingPeriod>(res[0].columns, row));
    }
  } catch (e) { console.error(e); }
  return [];
}

/**
 * Verifica si una fecha específica pertenece a un periodo contable cerrado o bloqueado.
 */
export function isDateLocked(dateStr: string): boolean {
  if (!db) return false;
  try {
    const date = new Date(dateStr).toISOString().split('T')[0];
    const res = db.exec(`
      SELECT status 
      FROM accounting_periods
      WHERE date(?) BETWEEN date(start_date) AND date(end_date)
      AND status IN ('closed', 'locked')
    `, [date]);

    return res.length > 0 && res[0].values.length > 0;
  } catch (e) {
    return false;
  }
}

/**
 * Realiza el cierre de un periodo contable.
 */
export async function closePeriod(periodId: number, userId: number): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const periodRes = db.exec("SELECT * FROM accounting_periods WHERE id = ?", [periodId]);
    if (periodRes.length === 0) return { success: false, message: 'Periodo no encontrado' };
    const period = rowToEntity<AccountingPeriod>(periodRes[0].columns, periodRes[0].values[0]);

    if (period.status === 'closed' || period.status === 'locked') {
      return { success: false, message: 'El periodo ya está cerrado' };
    }

    const tb = db.exec(`
      SELECT SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit
      FROM journal_details jd
      JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE date(je.entry_date) BETWEEN date(?) AND date(?)
    `, [period.start_date, period.end_date]);

    const totalDebit = tb[0]?.values[0]?.[0] as number || 0;
    const totalCredit = tb[0]?.values[0]?.[1] as number || 0;

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return { success: false, message: 'No se puede cerrar: El balance no cuadra (Diferencia: ' + (totalDebit - totalCredit).toFixed(2) + ')' };
    }

    db.run(`
      UPDATE accounting_periods 
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP, closed_by = ?
      WHERE id = ?
    `, [userId, periodId]);

    return { success: true, message: `Periodo ${period.month} cerrado exitosamente` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Reabre un periodo contable previamente cerrado.
 */
export async function reopenPeriod(periodId: number, userId: number): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    db.run(`
      UPDATE accounting_periods 
      SET status = 'open', closed_at = NULL, closed_by = NULL
      WHERE id = ?
    `, [periodId]);
    return { success: true, message: 'Periodo reabierto exitosamente' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * Desbloquea un año fiscal.
 */
export async function unlockFiscalYear(yearId: number): Promise<{ success: boolean; message: string }> {
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    db.run("UPDATE fiscal_years SET status = 'open' WHERE id = ?", [yearId]);
    return { success: true, message: 'Año fiscal desbloqueado' };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export interface Customer {
  id: number;
  // Información personal
  name: string;
  business_name?: string;
  document_type: 'SSN' | 'EIN' | 'ITIN' | 'PASSPORT';
  document_number: string;
  business_type?: string;

  // Datos de contacto
  email: string;
  email_secondary?: string;
  phone: string;
  phone_secondary?: string;

  // Dirección
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  florida_county: string;

  // Datos comerciales
  credit_limit: number;
  payment_terms: number; // días
  tax_exempt: boolean;
  tax_id?: string;
  assigned_salesperson?: string;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface Supplier {
  id: number;
  // Información del proveedor
  name: string;
  business_name?: string;
  document_type: 'SSN' | 'EIN' | 'ITIN' | 'PASSPORT';
  document_number: string;
  business_type?: string;

  // Datos de contacto
  email: string;
  email_secondary?: string;
  phone: string;
  phone_secondary?: string;

  // Dirección
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  florida_county: string;

  // Datos comerciales
  credit_limit: number;
  payment_terms: number; // días
  tax_exempt: boolean;
  tax_id?: string;
  assigned_buyer?: string;

  // Metadatos
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
}

export interface KardexFilters {
  productId?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  referenceId?: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category_id?: number;
  category?: ProductCategory; // Para joins
  unit_of_measure: string; // unidad, pieza, kg, litro, etc.
  taxable: boolean;
  tax_rate?: number; // Tasa específica si es diferente a la estándar
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  supplier_id?: number;
  supplier?: Supplier; // Para joins
  barcode?: string;
  image_path?: string;
  weight?: number;
  dimensions?: string; // "LxWxH"
  is_service: boolean; // true para servicios, false para productos físicos
  service_duration?: number; // duración en minutos para servicios
  warranty_period?: number; // período de garantía en días
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  parent?: ProductCategory; // Para categorías jerárquicas
  tax_rate?: number; // Tasa de impuesto por defecto para la categoría
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: Customer; // Para joins
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
  created_by?: number;
  updated_by?: number;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id?: number;
  product?: Product; // Para joins
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  taxable: boolean;
  created_at: string;
}

export interface Bill {
  id: number;
  bill_number: string;
  supplier_id: number;
  supplier?: Supplier; // Para joins
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'received' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
  created_by?: number;
  updated_by?: number;
  items?: BillItem[];
}

export interface BillItem {
  id: number;
  bill_id: number;
  product_id?: number;
  product?: Product; // Para joins
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  taxable: boolean;
  created_at: string;
}

export interface Payment {
  id: number;
  customer_id: number;
  invoice_id?: number;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  reference_number?: string;
  notes?: string;
  created_at: string;
}

// ==========================================
// QUOTES (COTIZACIONES) INTERFACES
// ==========================================

export interface Quote {
  id: number;
  quote_number: string;
  customer_id: number;
  customer?: Customer;
  issue_date: string;
  expiration_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  converted_to_invoice_id?: number;
  notes?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  items?: QuoteLine[];
}

export interface QuoteLine {
  id: number;
  quote_id: number;
  product_id?: number;
  product?: Product;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  line_total: number;
  taxable: boolean;
  created_at: string;
}

export interface SupplierPayment {
  id: number;
  supplier_id: number;
  bill_id?: number;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  reference_number?: string;
  notes?: string;
  created_at: string;
}

// ==========================================
// INTERFACES PARA PLAN DE CUENTAS Y DOBLE ENTRADA
// ==========================================
// INTERFACES PARA CONTABILIDAD
// ==========================================

export interface ChartOfAccount {
  id?: number;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normal_balance: 'debit' | 'credit';
  parent_account?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  balance?: number; // Para cálculos
}

export interface JournalEntry {
  id?: number;
  entry_date: string;
  reference_number: string;
  reference?: string; // Temporary compatibility
  description: string;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  created_at?: string;
  created_by?: number;
  verified_by?: number;
  verified_at?: string;
  details?: JournalDetail[];
}



export interface JournalDetail {
  id?: number;
  journal_entry_id?: number;
  account_code: string;
  account?: ChartOfAccount; // Para joins
  debit_amount: number;
  credit_amount: number;
  description?: string;
}

// Interfaces para reportes Florida DR-15
export interface FloridaDR15Report {
  period: string; // "2024-Q1"
  totalTaxableSales: number;
  totalTaxCollected: number;
  countyBreakdown: Array<{
    county: string;
    rate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
  exemptSales: number;
  adjustments: Array<{
    description: string;
    amount: number;
    type: 'credit' | 'debit';
  }>;
  netTaxDue: number;
  dueDate: Date;
  filedBy?: number;
  filedAt?: Date;
  status: 'pending' | 'filed' | 'paid' | 'late';
}

// Interfaces para vistas de IA (solo lectura)
export interface FinancialSummary {
  report_type: string;
  total_assets: number;
  total_liabilities_equity: number;
  imbalance: number;
  period: string;
}

export interface TaxSummary {
  period: string;
  total_sales: number;
  taxable_sales: number;
  exempt_sales: number;
  total_tax_collected: number;
  counties_breakdown: Array<{
    county: string;
    sales: number;
    tax: number;
  }>;
}

export interface BankAccount {
  id: number;
  account_name: string;
  bank_name: string;
  account_number: string;
  account_type: 'checking' | 'savings' | 'credit' | 'other';
  routing_number?: string;
  balance: number;
  currency: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface BankTransaction {
  id: number;
  bank_account_id: number;
  transaction_date: string;
  description: string;
  amount: number;
  reference_number?: string;
  status: 'pending' | 'matched' | 'ignored';
  match_confidence?: number;
  matched_journal_entry_id?: number;
  import_batch_id?: string;
  created_at: string;
}

export interface ReconciliationStatement {
  id: number;
  bank_account_id: number;
  statement_date: string;
  statement_balance: number;
  system_balance: number;
  difference: number;
  status: 'pending' | 'in_progress' | 'reconciled' | 'discrepancy';
  reconciled_at?: string;
  reconciled_by?: number;
  notes?: string;
  created_at: string;
}

export interface ReconciliationMatch {
  id: number;
  statement_id: number;
  bank_transaction_id: number;
  journal_entry_id?: number;
  match_confidence: number;
  match_type: 'automatic' | 'manual' | 'suggested';
  matched_at: string;
  matched_by?: number;
  notes?: string;
}

export interface PaymentMethod {
  id: number;
  method_name: string;
  method_type: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  is_active: boolean;
  requires_reference: boolean;
  created_at: string;
}

export interface AuditEntry {
  id?: number;
  user_id?: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entity_type: string;
  entity_id?: number;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  timestamp?: string;
}

export interface UserSession {
  id?: number;
  user_id: number;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at?: string;
}

// ==========================================
// BUDGETS (PRESUPUESTOS)
// ==========================================

export interface Budget {
  id: number;
  budget_name: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  status: 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED';
  total_budget_amount: number;  // cents
  department?: string;
  notes?: string;
  alert_threshold_percentage?: number;  // Alert when variance exceeds this %
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
  annual_amount: number;  // cents
  distribution_type: 'EQUAL' | 'CUSTOM' | 'ZERO';
  notes?: string;
  created_at: string;
}

export interface BudgetPeriod {
  id: number;
  budget_line_id: number;
  period_type: 'MONTHLY' | 'QUARTERLY';
  period_number: number;  // 1-12 for months, 1-4 for quarters
  period_start_date: string;
  period_end_date: string;
  budgeted_amount: number;  // cents
  actual_amount?: number;  // cents
  variance_amount?: number;  // cents
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

// Flag global de modo demo
export let isDemoActive = false;

export const resetDB = async () => {
  if (dbEngine) {
    await dbEngine.close().catch(e => console.warn('Error closing DB:', e));
  }
  db = null;
  dbEngine = null;
  isInitialized = false;
  isDemoActive = false;
  logger.info('Database', 'reset', 'Base de datos reiniciada para cambio de modo');
};

export const initDB = async (password?: string, demoMode: boolean = false): Promise<any> => {
  if (isInitialized && db) {
    return db;
  }

  isDemoActive = demoMode;

  try {
    logger.info('Database', 'init_start', `Iniciando inicialización de base de datos SQLite (Demo: ${demoMode})`);

    // Configurar cifrado si se proporciona contraseña
    if (password && BasicEncryption.isSupported()) {
      encryptionEnabled = true;
      currentPassword = password;
      logger.info('Database', 'encryption_enabled', 'Cifrado habilitado con Web Crypto API');
    }

    // Inicializar sql.js
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        // En entorno de pruebas (Node.js), usar ruta de node_modules
        if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
          return `./node_modules/sql.js/dist/${file}`;
        }
        // En navegador, usar ruta pública
        return `/${file}`;
      }
    });

    logger.info('Database', 'sqljs_loaded', 'SQL.js cargado y base de datos inicializada');

    let dbData: Uint8Array | null = null;

    // Solo cargar persistencia si NO estamos en modo demo
    if (!demoMode) {
      // Cargar datos existentes
      const { loadDatabase } = await import('./PersistenceLayer');
      dbData = await loadDatabase();

      // Fallback a localStorage si no hay en IndexedDB
      if (!dbData) {
        try {
          dbData = await loadFromLocalStorage();
        } catch (e) { console.warn('LocalStorage load failed', e); }
      }
    } else {
      logger.warn('Database', 'demo_warning', '⚠️ MODO DEMO: Base de datos en RAM. Los datos se perderán al recargar.');
    }

    if (!db) {
      db = new SQL.Database(dbData || undefined);
    }

    // Crear instancia de SQLiteEngine y configurarla con la instancia de sql.js
    dbEngine = new SQLiteEngine();
    dbEngine.setDB(db);

    // Configurar modo demo en el motor
    if (demoMode) {
      dbEngine.setDemoMode(true);
    }

    logger.info('Database', 'engine_initialized', 'SQLiteEngine wrapper creado exitosamente');

    // Ejecutar inicialización de esquema
    await initializeSchema(db);

    // NUEVO: Ejecutar reparación profunda y seed de emergencia (Iron Core Protection)
    await DatabaseInitializer.initializeWithFix(db);

    // Configurar servicios adicionales solo si no es demo (para evitar sobrescribir datos reales)
    if (!demoMode) {
      setupAutoSave();
    }

    return db;
  } catch (error) {
    logger.error('Database', 'init_failed', 'Error fatal en inicialización', { error });
    throw error;
  } finally {
    isInitialized = true;
  }
};

const initializeSchema = async (db: any) => {
  // Tabla de clientes
  db.run(`
    CREATE TABLE IF NOT EXISTS customers(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    business_name TEXT,
    document_type TEXT DEFAULT 'SSN' CHECK(document_type IN('SSN', 'EIN', 'ITIN', 'PASSPORT')),
    document_number TEXT,
    business_type TEXT,
    email TEXT,
    email_secondary TEXT,
    phone TEXT,
    phone_secondary TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT DEFAULT 'Miami',
    state TEXT DEFAULT 'FL',
    zip_code TEXT,
    florida_county TEXT DEFAULT 'Miami-Dade',
    credit_limit DECIMAL(12, 2) DEFAULT 0.00,
    payment_terms INTEGER DEFAULT 30,
    tax_id TEXT,
    tax_exempt BOOLEAN DEFAULT 0,
    assigned_salesperson TEXT,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    preferred_payment_method TEXT,
    website TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1
  )
  `);

  // Tabla de proveedores
  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  business_name TEXT,
  document_type TEXT DEFAULT 'EIN' CHECK(document_type IN('SSN', 'EIN', 'ITIN', 'PASSPORT')),
  document_number TEXT,
  business_type TEXT,
  email TEXT,
  email_secondary TEXT,
  phone TEXT,
  phone_secondary TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT DEFAULT 'Miami',
  state TEXT DEFAULT 'FL',
  zip_code TEXT,
  florida_county TEXT DEFAULT 'Miami-Dade',
  credit_limit DECIMAL(12, 2) DEFAULT 0.00,
  payment_terms INTEGER DEFAULT 30,
  tax_exempt BOOLEAN DEFAULT 0,
  tax_id TEXT,
  assigned_buyer TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN('active', 'inactive', 'suspended')),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) DEFAULT 1,
  updated_by INTEGER REFERENCES users(id) DEFAULT 1
)
  `);

  // Tabla de categorías de productos
  db.run(`
    CREATE TABLE IF NOT EXISTS product_categories(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1,
    FOREIGN KEY(parent_id) REFERENCES product_categories(id)
  )
  `);

  // Tabla de productos expandida
  db.run(`
    CREATE TABLE IF NOT EXISTS products(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cost DECIMAL(10, 2) DEFAULT 0,
    category_id INTEGER,
    unit_of_measure TEXT DEFAULT 'unidad',
    taxable BOOLEAN DEFAULT 1,
    tax_rate DECIMAL(5, 2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 100,
    reorder_point INTEGER DEFAULT 10,
    supplier_id INTEGER,
    barcode TEXT,
    image_path TEXT,
    weight DECIMAL(8, 2),
    dimensions TEXT,
    is_service BOOLEAN DEFAULT 0,
    service_duration INTEGER, --minutos
      warranty_period INTEGER, --días
      notes TEXT,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1,
    FOREIGN KEY(category_id) REFERENCES product_categories(id),
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  )
  `);

  // Tabla de facturas
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'draft' CHECK(status IN('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  )
  `);

  // Tabla de líneas de factura
  db.run(`
    CREATE TABLE IF NOT EXISTS invoice_lines(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 3) DEFAULT 1.000,
    unit_price DECIMAL(10, 2) DEFAULT 0.00,
    line_total DECIMAL(12, 2) DEFAULT 0.00,
    taxable BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(invoice_id) REFERENCES invoices(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
  `);

  // Tabla de pagos
  db.run(`
    CREATE TABLE IF NOT EXISTS payments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    invoice_id INTEGER,
    payment_number TEXT UNIQUE NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN('cash', 'check', 'credit_card', 'bank_transfer', 'other')),
    reference_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER DEFAULT 1,
    FOREIGN KEY(customer_id) REFERENCES customers(id),
    FOREIGN KEY(invoice_id) REFERENCES invoices(id)
  )
  `);

  // Tabla de configuración de impuestos Florida
  db.run(`
    CREATE TABLE IF NOT EXISTS florida_tax_rates(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    county_name TEXT UNIQUE NOT NULL,
    state_rate DECIMAL(5, 4) DEFAULT 0.06,
    county_rate DECIMAL(5, 4) DEFAULT 0.0,
    total_rate DECIMAL(5, 4) DEFAULT 0.06,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);


  // Tabla de facturas de compra (bills)
  db.run(`
    CREATE TABLE IF NOT EXISTS bills(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number TEXT UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'draft' CHECK(status IN('draft', 'received', 'approved', 'paid', 'overdue', 'cancelled')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
  )
  `);

  // Tabla de líneas de factura de compra (bill_lines)
  db.run(`
    CREATE TABLE IF NOT EXISTS bill_lines(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,
    product_id INTEGER,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 3) DEFAULT 1.000,
    unit_price DECIMAL(10, 2) DEFAULT 0.00,
    line_total DECIMAL(12, 2) DEFAULT 0.00,
    taxable BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bill_id) REFERENCES bills(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
  `);

  // Tabla de pagos a proveedores (supplier_payments)
  db.run(`
    CREATE TABLE IF NOT EXISTS supplier_payments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    bill_id INTEGER,
    payment_number TEXT UNIQUE NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method TEXT DEFAULT 'check' CHECK(payment_method IN('cash', 'check', 'credit_card', 'bank_transfer', 'other')),
    reference_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY(bill_id) REFERENCES bills(id)
  )
  `);

  // ==========================================
  // TABLAS DE COTIZACIONES (QUOTES)
  // ==========================================

  // Tabla de cotizaciones (quotes)
  db.run(`
    CREATE TABLE IF NOT EXISTS quotes(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    expiration_date DATE,
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) DEFAULT 0.00,
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'draft' CHECK(status IN('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
    converted_to_invoice_id INTEGER,
    notes TEXT,
    terms TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1,
    FOREIGN KEY(customer_id) REFERENCES customers(id),
    FOREIGN KEY(converted_to_invoice_id) REFERENCES invoices(id)
  )
  `);

  // Tabla de l�neas de cotizaci�n (quote_lines)
  db.run(`
    CREATE TABLE IF NOT EXISTS quote_lines(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quote_id INTEGER NOT NULL,
    product_id INTEGER,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 3) DEFAULT 1.000,
    unit_price DECIMAL(10, 2) DEFAULT 0.00,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    line_total DECIMAL(12, 2) DEFAULT 0.00,
    taxable BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )
  `);

  // Tabla de auditoría con hash de integridad
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK(action IN('INSERT', 'UPDATE', 'DELETE')),
    old_values TEXT,
    new_values TEXT,
    user_id INTEGER DEFAULT 1,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    audit_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Nueva tabla de trazabilidad general
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_trail(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Tabla de datos de la empresa
  db.run(`
    CREATE TABLE IF NOT EXISTS company_data(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    legal_name TEXT NOT NULL,
    tax_id TEXT NOT NULL, --EIN o Tax ID
      address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'FL',
    zip_code TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    website TEXT,
    logo_path TEXT,
    fiscal_year_start TEXT DEFAULT '01-01', --MM - DD format
      currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'es',
    timezone TEXT DEFAULT 'America/New_York',
    --Configuraciones financieras
      sales_commission_rate DECIMAL(10, 2) DEFAULT 0.00,
    sales_commission_percentage DECIMAL(5, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 50.00,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    shipping_rate DECIMAL(10, 2) DEFAULT 0.00,
    shipping_percentage DECIMAL(5, 2) DEFAULT 0.00,
    reposition_policy_days INTEGER DEFAULT 32,
    late_fee_amount DECIMAL(10, 2) DEFAULT 0.00,
    late_fee_percentage DECIMAL(5, 2) DEFAULT 0.00,
    annual_interest_rate DECIMAL(5, 2) DEFAULT 0.00,
    grace_period_days INTEGER DEFAULT 0,
    documentation_cost DECIMAL(10, 2) DEFAULT 0.00,
    other_costs DECIMAL(10, 2) DEFAULT 0.00,
    chart_of_accounts_name TEXT DEFAULT 'Plan de Cuenta Ejemplo',
    date_format TEXT DEFAULT 'MM/DD/AAAA',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  )
  `);

  // Tabla de cuentas bancarias
  db.run(`
    CREATE TABLE IF NOT EXISTS bank_accounts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_type TEXT DEFAULT 'checking' CHECK(account_type IN('checking', 'savings', 'credit', 'other')),
    routing_number TEXT,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT 1,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Tabla de transacciones bancarias importadas (Conciliación)
  db.run(`
    CREATE TABLE IF NOT EXISTS bank_transactions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id),
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    reference_number TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN('pending', 'matched', 'ignored')),
    match_confidence DECIMAL(5, 2),
    matched_journal_entry_id INTEGER REFERENCES journal_entries(id),
    import_batch_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Tabla de métodos de pago
  db.run(`
    CREATE TABLE IF NOT EXISTS payment_methods(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    method_name TEXT UNIQUE NOT NULL,
    method_type TEXT CHECK(method_type IN('cash', 'check', 'credit_card', 'bank_transfer', 'other')),
    is_active BOOLEAN DEFAULT 1,
    requires_reference BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ==========================================
  // TABLAS DE CONCILIACI�N BANCARIA
  // ==========================================

  // Tabla de estados de conciliaci�n
  db.run(`
    CREATE TABLE IF NOT EXISTS reconciliation_statements(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id),
    statement_date DATE NOT NULL,
    statement_balance DECIMAL(12,2) NOT NULL,
    system_balance DECIMAL(12,2) NOT NULL,
    difference DECIMAL(12,2) GENERATED ALWAYS AS (statement_balance - system_balance),
    status TEXT CHECK(status IN ('pending', 'in_progress', 'reconciled', 'discrepancy')) DEFAULT 'pending',
    reconciled_at DATETIME,
    reconciled_by INTEGER REFERENCES users(id),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bank_account_id, statement_date)
  )
  `);

  // Tabla de matches de conciliaci�n
  db.run(`
    CREATE TABLE IF NOT EXISTS reconciliation_matches(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    statement_id INTEGER NOT NULL REFERENCES reconciliation_statements(id),
    bank_transaction_id INTEGER NOT NULL REFERENCES bank_transactions(id),
    journal_entry_id INTEGER REFERENCES journal_entries(id),
    match_confidence DECIMAL(3,2) DEFAULT 1.0,
    match_type TEXT CHECK(match_type IN ('automatic', 'manual', 'suggested')) DEFAULT 'manual',
    matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    matched_by INTEGER REFERENCES users(id),
    notes TEXT,
    UNIQUE(bank_transaction_id, journal_entry_id)
  )
  `);

  // ==========================================
  // TABLAS DE N�MINA (PAYROLL)
  // ==========================================

  // Tabla de empleados
  db.run(`
    CREATE TABLE IF NOT EXISTS employees(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    hire_date DATE NOT NULL,
    department TEXT,
    position TEXT,
    salary_type TEXT DEFAULT 'monthly' CHECK(salary_type IN('monthly', 'hourly')),
    salary_rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN('active', 'inactive', 'on_leave')),
    florida_county TEXT DEFAULT 'Miami-Dade',
    
    -- Payroll Engine Fields
    hourly_rate REAL,
    salary REAL,
    pay_type TEXT CHECK(pay_type IN('hourly', 'salaried')),
    filing_status TEXT CHECK(filing_status IN('single', 'married', 'married_separate', 'head_of_household')),
    allowances INTEGER DEFAULT 0,
    additional_withholding REAL DEFAULT 0,
    ytd_gross_pay REAL DEFAULT 0,
    ytd_federal_tax REAL DEFAULT 0,
    ytd_fica REAL DEFAULT 0,
    ytd_medicare REAL DEFAULT 0,
    ssn TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1
  )
  `);

  // Tabla de per�odos de n�mina
  db.run(`
    CREATE TABLE IF NOT EXISTS payroll_periods(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    status TEXT DEFAULT 'open' CHECK(status IN('open', 'processing', 'closed', 'cancelled')),
    total_gross DECIMAL(12, 2) DEFAULT 0,
    total_net DECIMAL(12, 2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1
  )
  `);

  // Tabla de entradas de n�mina
  db.run(`
    CREATE TABLE IF NOT EXISTS payroll_entries(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    period_id INTEGER NOT NULL REFERENCES payroll_periods(id),
    journal_entry_id INTEGER REFERENCES journal_entries(id),
    gross_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deductions_amount DECIMAL(12, 2) DEFAULT 0,
    net_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK(status IN('draft', 'verified', 'paid')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, period_id)
  )
  `);

  // Tabla de l�neas de n�mina (conceptos)
  db.run(`
    CREATE TABLE IF NOT EXISTS payroll_line_items(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_entry_id INTEGER NOT NULL REFERENCES payroll_entries(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN('earning', 'deduction')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Tabla de configuraciones de n�mina
  db.run(`
    CREATE TABLE IF NOT EXISTS payroll_settings(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Tabla de nómina procesada (Payroll Engine)
  db.run(`
    CREATE TABLE IF NOT EXISTS payroll(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    pay_date DATE NOT NULL,
    
    -- Horas y tasas
    regular_hours REAL NOT NULL DEFAULT 0,
    overtime_hours REAL NOT NULL DEFAULT 0,
    hourly_rate REAL,
    
    -- Ingresos
    regular_pay REAL NOT NULL DEFAULT 0,
    overtime_pay REAL NOT NULL DEFAULT 0,
    bonuses REAL NOT NULL DEFAULT 0,
    commissions REAL NOT NULL DEFAULT 0,
    gross_pay REAL NOT NULL,
    
    -- Impuestos
    social_security_tax REAL NOT NULL DEFAULT 0,
    medicare_tax REAL NOT NULL DEFAULT 0,
    medicare_additional_tax REAL NOT NULL DEFAULT 0,
    federal_income_tax REAL NOT NULL DEFAULT 0,
    
    -- Deducciones
    other_deductions REAL NOT NULL DEFAULT 0,
    total_deductions REAL NOT NULL,
    
    -- Neto
    net_pay REAL NOT NULL,
    
    -- Asiento contable
    journal_entry_id INTEGER REFERENCES journal_entries(id),
    
    -- Auditoría
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft', 'approved', 'paid', 'voided')),
    processed_by INTEGER REFERENCES users(id),
    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER REFERENCES users(id),
    approved_at DATETIME,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Índices para optimizar consultas de nómina
  db.run(`CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payroll_dates ON payroll(pay_period_start, pay_period_end)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_payroll_pay_date ON payroll(pay_date)`);

  // Tabla de logs del sistema
  db.run(`
    CREATE TABLE IF NOT EXISTS system_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    level TEXT CHECK(level IN('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')) NOT NULL,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id INTEGER DEFAULT 1,
    ip_address TEXT,
    user_agent TEXT,
    data TEXT,
    stack_trace TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at DATETIME,
    resolved_by INTEGER,
    session_id TEXT
  )
  `);

  // Old triggers code.

  // ==========================================
  // TABLAS PARA PLAN DE CUENTAS Y DOBLE ENTRADA
  // ==========================================

  // Tabla del plan de cuentas (chart of accounts) - DEBE IR PRIMERO
  db.run(`
    CREATE TABLE IF NOT EXISTS chart_of_accounts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_code TEXT UNIQUE NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK(account_type IN('asset', 'liability', 'equity', 'revenue', 'expense')),
    normal_balance TEXT NOT NULL CHECK(normal_balance IN('debit', 'credit')),
    parent_account TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1,
    FOREIGN KEY(parent_account) REFERENCES chart_of_accounts(account_code)
  )
  `);

  // Tabla de asientos contables (journal entries)
  db.run(`
    CREATE TABLE IF NOT EXISTS journal_entries(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date DATE NOT NULL,
    reference TEXT,
    description TEXT,
    notes TEXT,
    total_debit DECIMAL(15, 2) NOT NULL CHECK(total_debit >= 0),
    total_credit DECIMAL(15, 2) NOT NULL CHECK(total_credit >= 0),
    is_balanced BOOLEAN GENERATED ALWAYS AS(total_debit = total_credit) STORED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1,
    verified_by INTEGER REFERENCES users(id),
    verified_at DATETIME
  )
  `);

  // Tabla de detalles de asientos contables
  db.run(`
    CREATE TABLE IF NOT EXISTS journal_details(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
    account_code TEXT NOT NULL REFERENCES chart_of_accounts(account_code),
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    description TEXT,
    CHECK((debit_amount = 0 AND credit_amount > 0) OR(credit_amount = 0 AND debit_amount > 0))
    )
`);

  // ==========================================
  // PERÍODOS CONTABLES Y CIERRES
  // ==========================================

  // Tabla de períodos contables
  db.run(`
    CREATE TABLE IF NOT EXISTS accounting_periods(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    period_type TEXT NOT NULL CHECK(period_type IN('monthly', 'quarterly', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN('open', 'closed', 'locked')),
    closed_by INTEGER REFERENCES users(id),
    closed_at DATETIME,
    locked_by INTEGER REFERENCES users(id),
    locked_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1,
    CHECK(end_date > start_date),
    UNIQUE(start_date, end_date)
  )
  `);

  // Índices para períodos contables
  db.run(`CREATE INDEX IF NOT EXISTS idx_periods_dates ON accounting_periods(start_date, end_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_periods_status ON accounting_periods(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_periods_fiscal_year ON accounting_periods(fiscal_year)`);

  // Tabla de auditoría de cierres de períodos
  db.run(`
    CREATE TABLE IF NOT EXISTS period_closure_log(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_id INTEGER NOT NULL REFERENCES accounting_periods(id),
    action TEXT NOT NULL CHECK(action IN('closed', 'reopened', 'locked', 'unlocked')),
    performed_by INTEGER NOT NULL REFERENCES users(id),
    performed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    previous_status TEXT,
    new_status TEXT
  )
  `);

  // Índice para log de cierres
  db.run(`CREATE INDEX IF NOT EXISTS idx_closure_log_period ON period_closure_log(period_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_closure_log_date ON period_closure_log(performed_at)`);

  // ==========================================
  // REPORTES FISCALES FLORIDA
  // ==========================================

  db.run(`
    CREATE TABLE IF NOT EXISTS florida_tax_reports(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL UNIQUE, -- "2024-Q1"
      total_taxable_sales DECIMAL(15, 2) DEFAULT 0,
  total_tax_collected DECIMAL(15, 2) DEFAULT 0,
  exempt_sales DECIMAL(15, 2) DEFAULT 0,
  net_tax_due DECIMAL(15, 2) DEFAULT 0,
  due_date DATE,
  filed_by INTEGER,
  filed_at DATETIME,
  status TEXT DEFAULT 'pending' CHECK(status IN('pending', 'filed', 'paid', 'late')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
  `);

  // Tabla de desglose por condado para DR-15
  db.run(`
    CREATE TABLE IF NOT EXISTS florida_tax_report_counties(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL REFERENCES florida_tax_reports(id),
    county_name TEXT NOT NULL,
    tax_rate DECIMAL(5, 4) NOT NULL,
    taxable_amount DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Tabla de ajustes para DR-15
  db.run(`
    CREATE TABLE IF NOT EXISTS florida_tax_report_adjustments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL REFERENCES florida_tax_reports(id),
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    adjustment_type TEXT CHECK(adjustment_type IN('credit', 'debit')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ==========================================
  // VISTAS PARA IA (SOLO LECTURA) - ESPECIFICACIÓN COMPLETA
  // ==========================================

  // Vista de resumen financiero para IA - ORDEN N°1 CORREGIDA
  db.run(`
    CREATE VIEW IF NOT EXISTS financial_summary AS
SELECT
'balance_general' as reporte,
  COUNT(CASE WHEN account_type = 'asset' THEN 1 END) as total_activos,
  COUNT(CASE WHEN account_type IN('liability', 'equity') THEN 1 END) as total_pasivos_patrimonio
    FROM chart_of_accounts 
    WHERE is_active = 1
  `);

  // Vista de resumen de inventario para IA
  db.run(`
    CREATE VIEW IF NOT EXISTS inventory_summary AS
SELECT
'productos' as tipo,
  COUNT(*) as total_productos,
  SUM(CASE WHEN stock_quantity <= min_stock_level THEN 1 ELSE 0 END) as productos_bajo_stock,
  SUM(stock_quantity) as stock_total
    FROM products
    WHERE active = 1
  `);

  // Vista de resumen de impuestos Florida para IA - ORDEN N°1
  db.run(`
    CREATE VIEW IF NOT EXISTS tax_summary_florida AS
SELECT
t.county_name as county,
  COUNT(i.id) as facturas,
  SUM(i.total_amount) as base_imponible,
  SUM(i.tax_amount) as impuesto_calculado
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    JOIN florida_tax_rates t ON c.florida_county = t.county_name
    WHERE i.status = 'paid'
    GROUP BY t.county_name
  `);

  // Vista de resumen de auditoría para IA
  db.run(`
    CREATE VIEW IF NOT EXISTS audit_summary AS
SELECT
table_name,
  COUNT(*) as total_operaciones,
  MAX(timestamp) as ultima_operacion,
  COUNT(DISTINCT user_id) as usuarios_activos
    FROM audit_log
    WHERE timestamp >= date('now', '-30 days')
    GROUP BY table_name
    ORDER BY total_operaciones DESC
  `);

  // DROPEAR VISTAS ANTIGUAS
  db.run(`DROP VIEW IF EXISTS customers_summary`);
  db.run(`DROP VIEW IF EXISTS invoices_summary`);
  db.run(`DROP VIEW IF EXISTS v_clientes_reales`);
  db.run(`DROP VIEW IF EXISTS v_facturas_reales`);
  db.run(`DROP VIEW IF EXISTS v_proveedores_reales`);
  db.run(`DROP VIEW IF EXISTS datos_sistema`);

  // VISTA "TODO EN UNO" SOLICITADA
  db.run(`
    CREATE VIEW IF NOT EXISTS datos_sistema AS
SELECT
  (SELECT COUNT(*) FROM customers) as total_clientes,
  (SELECT GROUP_CONCAT(name, ', ') FROM(SELECT name FROM customers LIMIT 5)) as lista_clientes,
    (SELECT COUNT(*) FROM invoices) as facturas_venta,
      (SELECT COUNT(*) FROM bills) as facturas_compra,
        (SELECT MAX(total_amount) FROM invoices) as mayor_venta_monto,
          (SELECT invoice_number FROM invoices ORDER BY total_amount DESC LIMIT 1) as mayor_venta_numero,
            (SELECT COUNT(*) FROM suppliers) as total_proveedores,
              (SELECT IFNULL(SUM(stock_quantity * price), 0) FROM products) as valor_inventario
                `);

  // Vista de alertas para IA
  db.run(`
    CREATE VIEW IF NOT EXISTS alerts_summary AS
SELECT
'facturas_vencidas' as tipo_alerta,
  COUNT(*) as cantidad,
  'high' as prioridad
    FROM invoices 
    WHERE status = 'overdue'
    UNION ALL
SELECT
'stock_bajo' as tipo_alerta,
  COUNT(*) as cantidad,
  'medium' as prioridad
    FROM products 
    WHERE stock_quantity <= min_stock_level AND active = 1
    UNION ALL
SELECT
'clientes_inactivos' as tipo_alerta,
  COUNT(*) as cantidad,
  'low' as prioridad
    FROM customers 
    WHERE status = 'inactive'
  `);

  console.log('Database schema created successfully');
  console.log('Vistas _summary para IA creadas: financial_summary, tax_summary_florida - ORDEN N°1 IMPLEMENTADA');

  // ==========================================
  // TABLAS DE PRESUPUESTOS (BUDGETS) - FASE 2
  // ==========================================

  db.run(`
    CREATE TABLE IF NOT EXISTS budgets(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_name TEXT NOT NULL,
      fiscal_year INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT DEFAULT 'DRAFT' CHECK(status IN('DRAFT', 'APPROVED', 'ACTIVE', 'CLOSED')),
      total_budget_amount INTEGER DEFAULT 0, -- Store in cents
      department TEXT,
      notes TEXT,
      alert_threshold_percentage INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER REFERENCES users(id) DEFAULT 1,
      updated_by INTEGER REFERENCES users(id) DEFAULT 1,
      approved_by INTEGER REFERENCES users(id),
      approved_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS budget_lines(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      account_number INTEGER NOT NULL,
      annual_amount INTEGER DEFAULT 0, -- Store in cents
      distribution_type TEXT DEFAULT 'EQUAL' CHECK(distribution_type IN('EQUAL', 'CUSTOM', 'ZERO')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS budget_periods(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      budget_line_id INTEGER NOT NULL REFERENCES budget_lines(id) ON DELETE CASCADE,
      period_type TEXT DEFAULT 'MONTHLY' CHECK(period_type IN('MONTHLY', 'QUARTERLY')),
      period_number INTEGER NOT NULL,
      period_start_date DATE NOT NULL,
      period_end_date DATE NOT NULL,
      budgeted_amount INTEGER DEFAULT 0, -- Store in cents
      actual_amount INTEGER DEFAULT 0,
      variance_amount INTEGER DEFAULT 0,
      variance_percent DECIMAL(5, 2) DEFAULT 0.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);


  // Tabla de historial de conversaciones IA
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_conversations(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    intent TEXT,
    data_points_used INTEGER DEFAULT 0,
    tokens_used INTEGER DEFAULT 0,
    processing_time INTEGER,
    model_used TEXT,
    was_fallback BOOLEAN DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ==========================================
  // TABLAS NUEVAS FASE 3 (COMPLETE SCHEMA)
  // ==========================================

  // Tabla de ajustes manuales de inventario
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_adjustments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity_delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by INTEGER DEFAULT 1,
    adjusted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id),
    CHECK(quantity_delta != 0)
  )
  `);

  // Tabla de envíos fiscales DR-15
  db.run(`
    CREATE TABLE IF NOT EXISTS dr15_submissions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    total_tax_collected DECIMAL(15, 2) DEFAULT 0,
    total_taxable_sales DECIMAL(15, 2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK(status IN('draft', 'submitted', 'accepted', 'rejected')),
    submission_date DATETIME,
    confirmation_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_year, period_month)
  )
  `);

  // ==========================================
  // TABLAS MÓDULO ARD (Análisis de Recibos)
  // ==========================================
  db.run(`
    CREATE TABLE IF NOT EXISTS ard_documents(
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN('invoice_in', 'receipt', 'check', 'other')),
    status TEXT DEFAULT 'pending' CHECK(status IN('pending', 'analyzing', 'processed', 'converted', 'error')),
    file_size INTEGER,
    customer_id INTEGER REFERENCES customers(id),
    detected_amount DECIMAL(15, 2),
    detected_tax DECIMAL(15, 2),
    detected_date DATE,
    raw_analysis TEXT, --Almacena el JSON crudo del motor OCR / IA
      created_by INTEGER REFERENCES users(id) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // ==========================================
  // TRIGGERS CRÍTICOS FASE 2
  // ==========================================

  // 1. TRIGGER calculate_florida_tax (Aproximación en SQLite ya que no soporta lógica compleja en triggers)
  // Nota: SQLite triggers son limitados. La lógica compleja se mantiene en la capa de aplicación (FloridaTaxCalculator),
  // pero agregamos un trigger básico para mantener consistencia.
  db.run(`
    CREATE TRIGGER IF NOT EXISTS update_invoice_totals_after_insert
    AFTER INSERT ON invoice_lines
BEGIN
      UPDATE invoices
SET
subtotal = (SELECT SUM(line_total) FROM invoice_lines WHERE invoice_id = NEW.invoice_id),
tax_amount = (SELECT SUM(CASE WHEN taxable = 1 THEN line_total * 0.07 ELSE 0 END) FROM invoice_lines WHERE invoice_id = NEW.invoice_id),
total_amount = (SELECT SUM(line_total + (CASE WHEN taxable = 1 THEN line_total * 0.07 ELSE 0 END)) FROM invoice_lines WHERE invoice_id = NEW.invoice_id)
      WHERE id = NEW.invoice_id;
END;
`);

  // 2. TRIGGER update_inventory_on_sale (Simplificado para SQLite)
  db.run(`
    CREATE TRIGGER IF NOT EXISTS decrease_stock_on_invoice
    AFTER INSERT ON invoice_lines
BEGIN
      UPDATE products
      SET stock_quantity = stock_quantity - NEW.quantity
      WHERE id = NEW.product_id AND is_service = 0;
END;
`);

  // 5. TRIGGER auto_generate_numbers (Simulado con formateo en inserción o valores por defecto)

  // ==========================================
  // TABLAS SISTEMA DE COMPRAS (PRIORIDAD 1.1)
  // ==========================================

  // Tabla de Órdenes de Compra
  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_orders(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  order_number TEXT UNIQUE NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  expected_date DATE,
  status TEXT CHECK(status IN('draft', 'sent', 'approved', 'received', 'cancelled')) DEFAULT 'draft',
  total_amount DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
  `);

  // Tabla de Líneas de Orden de Compra
  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_order_lines(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    unit_price DECIMAL(15, 2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    line_total DECIMAL(15, 2) GENERATED ALWAYS AS(quantity * unit_price) STORED
  )
  `);

  // Tabla de Movimientos de Inventario (Kardex)
  db.run(`
    CREATE TABLE IF NOT EXISTS stock_movements(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL, --Positivo(Entrada) o Negativo(Salida)
      movement_type TEXT CHECK(movement_type IN('purchase', 'sale', 'adjustment', 'return', 'initial')) NOT NULL,
    reference_id INTEGER, --ID de Invoice, PO, o Adjustment
      reference_type TEXT CHECK(reference_type IN('invoice', 'purchase_order', 'adjustment', 'migration')),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Tabla de Ubicaciones/Almacenes (Locations)
  db.run(`
    CREATE TABLE IF NOT EXISTS locations(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    updated_by INTEGER REFERENCES users(id) DEFAULT 1
  )
  `);

  // Índices para optimización
  db.run(`CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stock_product ON stock_movements(product_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_stock_date ON stock_movements(created_at)`);


  // ==========================================
  // VISTAS OPTIMIZADAS PARA DEEPSEEK RAG (FASE 1.3 NUEVA)
  // ==========================================

  db.run(`
    CREATE VIEW IF NOT EXISTS v_ai_context_invoices AS
SELECT
'INVOICE_DATA' as data_type,
  i.id,
  i.invoice_number as number,
  i.issue_date as date,
  c.name as customer_name,
  i.total_amount as total,
  i.tax_amount,
  json_object(
    'status', i.status,
    'items_count', (SELECT COUNT(*) FROM invoice_lines WHERE invoice_id = i.id)
        ) as metadata
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
  `);

  db.run(`
    CREATE VIEW IF NOT EXISTS v_ai_context_financial AS
SELECT
'FINANCIAL_SNAPSHOT' as data_type,
  date('now') as snapshot_date,
  (SELECT SUM(total_amount) FROM invoices WHERE status = 'paid') as total_revenue,
    (SELECT SUM(total_amount) FROM bills WHERE status = 'paid') as total_expenses,
      ((SELECT IFNULL(SUM(total_amount), 0) FROM invoices WHERE status = 'paid') - (SELECT IFNULL(SUM(total_amount), 0) FROM bills WHERE status = 'paid')) as net_profit,
        (SELECT SUM(tax_amount) FROM invoices WHERE status = 'paid') as tax_liability,
          (SELECT SUM(balance) FROM bank_accounts) as cash_balance
            `);

  // Vista de resumen de n�mina para IA
  db.run(`
    CREATE VIEW IF NOT EXISTS v_payroll_summary AS
SELECT 
  strftime('%Y-%m', pe.created_at) as period,
  COUNT(DISTINCT pe.employee_id) as employees_count,
  SUM(pe.gross_amount) as total_gross,
  SUM(pe.net_amount) as total_net,
  SUM(pe.deductions_amount) as total_deductions,
  AVG(pe.gross_amount) as avg_gross_per_employee
FROM payroll_entries pe
WHERE pe.created_at >= date('now', '-12 months')
GROUP BY period
ORDER BY period DESC
  `);

  // Vista de estado de conciliaci�n bancaria para IA
  db.run(`
    CREATE VIEW IF NOT EXISTS v_bank_reconciliation_status AS
SELECT 
  ba.account_name,
  ba.bank_name,
  ba.balance as book_balance,
  COUNT(bt.id) as pending_transactions,
  SUM(CASE WHEN bt.status = 'pending' THEN bt.amount ELSE 0 END) as pending_amount,
  MAX(bt.transaction_date) as last_transaction_date,
  ba.is_active
FROM bank_accounts ba
LEFT JOIN bank_transactions bt ON ba.id = bt.bank_account_id
GROUP BY ba.id
  `);

  // Tabla de auditoría específica para IA
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_audit_log(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              action TEXT NOT NULL,
              query TEXT,
              security_validation TEXT,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
  `);

  // Tabla de Cadena de Auditoría Inmutable (Forensic Grade)
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_chain(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    user_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    previous_hash TEXT,
    current_hash TEXT
  )
  `);

  // ==========================================
  // TABLAS DE GESTIÓN DE USUARIOS Y ROLES
  // ==========================================

  // Tabla de roles de usuario
  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 0,
    permissions_json TEXT DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // Tabla de usuarios del sistema
  db.run(`
    CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(role_id) REFERENCES user_roles(id)
  )
  `);

  // --- MIGRACIONES EN CALIENTE (Para bases de datos existentes) ---

  // 1. Asegurar columna 'level' en user_roles
  try {
    db.run(`ALTER TABLE user_roles ADD COLUMN level INTEGER DEFAULT 0`);
    logger.info('Database', 'migration', 'Columna level agregada a user_roles');
  } catch (e) { /* ignore */ }

  // 2. Asegurar columna 'display_name' en users
  try {
    db.run(`ALTER TABLE users ADD COLUMN display_name TEXT`);
    // Poblar con username si estaba vacío
    db.run(`UPDATE users SET display_name = username WHERE display_name IS NULL`);
    logger.info('Database', 'migration', 'Columna display_name agregada a users');
  } catch (e) { /* ignore */ }

  // 3. Asegurar columna 'is_active' en users
  try {
    db.run(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1`);
  } catch (e) { /* ignore */ }

  // 4. Asegurar columnas de auditoría y aislamiento en tablas core
  const coreTables = ['customers', 'suppliers', 'invoices', 'bills', 'products', 'product_categories', 'bank_accounts', 'journal_entries', 'chart_of_accounts'];
  for (const table of coreTables) {
    try { db.run(`ALTER TABLE ${table} ADD COLUMN created_by INTEGER DEFAULT 1`); } catch (e) { /* ignore */ }
    try { db.run(`ALTER TABLE ${table} ADD COLUMN updated_by INTEGER DEFAULT 1`); } catch (e) { /* ignore */ }
  }

  // 5. Casos específicos para pagos
  try { db.run(`ALTER TABLE payments ADD COLUMN created_by INTEGER DEFAULT 1`); } catch (e) { /* ignore */ }
  try { db.run(`ALTER TABLE supplier_payments ADD COLUMN created_by INTEGER DEFAULT 1`); } catch (e) { /* ignore */ }

  // 5. Índices de Performance Multi-Usuario
  try {
    db.run(`CREATE INDEX IF NOT EXISTS idx_customers_created_by ON customers(created_by)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_suppliers_created_by ON suppliers(created_by)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_bills_created_by ON bills(created_by)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id)`);
  } catch (e) { /* ignore */ }

  logger.info('Database', 'schema_updated', 'Tablas de Gestión de Usuarios verificadas y actualizadas');

  // Insertar roles y usuarios iniciales (Idempotente)
  const seedUsersAndRoles = async (): Promise<void> => {
    if (!db) return;

    try {
      // 1. Roles
      const roleCountResult = db.exec("SELECT COUNT(*) as count FROM user_roles");
      const roleCount = roleCountResult[0]?.values[0]?.[0] as number || 0;

      if (roleCount === 0) {
        db.run(`
        INSERT INTO user_roles(name, description, level) VALUES
  ('admin', 'Administrador del sistema con acceso completo', 100),
  ('contador', 'Contador con acceso a módulos contables y reportes', 80),
  ('vendedor', 'Vendedor con acceso a clientes y facturación', 40),
  ('comprador', 'Comprador con acceso a proveedores y compras', 40),
  ('auditor', 'Auditor con acceso de solo lectura a todo el sistema', 20),
  ('viewer', 'Usuario de consulta básica', 10)
    `);
        logger.info('Database', 'roles_seeded', 'Roles de sistema creados: admin, contador, vendedor, comprador, auditor, viewer');
      }

      // 2. Usuarios
      const usersToVerify = [
        { username: 'admin', email: 'admin@empresa.com', display_name: 'Administrador Principal', password: 'admin123', role: 'admin' },
        { username: 'demo', email: 'demo@empresa.com', display_name: 'Usuario Demo', password: 'demo123', role: 'admin' },
        { username: 'vendedor1', email: 'vendedor1@empresa.com', display_name: 'Vendedor Test', password: 'vendedor123', role: 'vendedor' },
        { username: 'contador1', email: 'contador1@empresa.com', display_name: 'Contador Test', password: 'contador123', role: 'contador' },
        { username: 'auditor1', email: 'auditor1@empresa.com', display_name: 'Auditor Test', password: 'auditor123', role: 'auditor' }
      ];

      const rolesResult = db.exec("SELECT id, name FROM user_roles");
      const roleMap: Record<string, number> = {};
      rolesResult[0]?.values.forEach((row: any) => {
        roleMap[row[1] as string] = row[0] as number;
      });

      for (const sysUser of usersToVerify) {
        try {
          const existing = db.exec(`SELECT id FROM users WHERE username = ? `, [sysUser.username]);
          if (!existing[0] || existing[0].values.length === 0) {
            const hash = await hashPassword(sysUser.password);
            const roleId = roleMap[sysUser.role] || 1;

            db.run(`
            INSERT INTO users(username, email, full_name, display_name, password_hash, role_id, is_active)
VALUES(?, ?, ?, ?, ?, ?, 1)
          `, [sysUser.username, sysUser.email, sysUser.display_name, sysUser.display_name, hash, roleId]);

            logger.info('Database', 'user_seeded', `Usuario ${sysUser.username} (${sysUser.email}) creado correctamente`);
          } else {
            // Asegurarse de que esté activo y resetear password a default en este ambiente demo
            const hash = await hashPassword(sysUser.password);
            db.run(`UPDATE users SET is_active = 1, password_hash = ? WHERE username = ? `, [hash, sysUser.username]);
          }
        } catch (userErr) {
          logger.error('Database', 'seed_user_failed', `Error al procesar usuario ${sysUser.username} `, { error: userErr });
        }
      }

      // 3. ACTUALIZACIÓN FORZADA DE NIVELES (Fuera del loop)
      // 3. ACTUALIZACIÓN FORZADA DE NIVELES
      db.run(`UPDATE user_roles SET level = 100 WHERE name = 'admin'`);
      db.run(`UPDATE user_roles SET level = 80 WHERE name = 'contador'`);
      db.run(`UPDATE user_roles SET level = 40 WHERE name = 'vendedor' OR name = 'sales'`);
      db.run(`UPDATE user_roles SET level = 40 WHERE name = 'comprador' OR name = 'purchasing'`);
      db.run(`UPDATE user_roles SET level = 20 WHERE name = 'auditor'`);
      db.run(`UPDATE user_roles SET level = 10 WHERE name = 'viewer'`);
      logger.info('Database', 'roles_updated', 'Niveles de roles de sistema verificados y actualizados');

    } catch (error) {
      logger.error('Database', 'seed_auth_failed', 'Error al realizar el seed de autenticación', { error });
    }
  };

  /**
   * Migra la propiedad de datos existentes al usuario Admin (ID 1)
   * Cumple con el Paso 1 del Plan de Validación Multi-Usuario
   */
  const migrateDataOwnership = async (): Promise<void> => {
    if (!db) return;

    try {
      const tablesToCheck = [
        'customers', 'suppliers', 'products', 'invoices', 'bills',
        'payments', 'supplier_payments', 'chart_of_accounts', 'journal_entries'
      ];

      // Asegurar ID de admin es 1 (buscamos por username por seguridad)
      const adminRes = db.exec("SELECT id FROM users WHERE username = 'admin'");
      const adminId = (adminRes[0]?.values[0]?.[0] as number) || 1;

      let totalMigrated = 0;

      for (const table of tablesToCheck) {
        try {
          // Verificar si tabla existe
          const tableExists = db.exec(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${table}'`);
          if (tableExists.length === 0 || tableExists[0].values.length === 0) continue;

          // Verificar si tiene columna created_by
          const colInfo = db.exec(`PRAGMA table_info(${table})`);
          const hasCreatedBy = colInfo[0]?.values.some((col: any) => col[1] === 'created_by');

          if (hasCreatedBy) {
            db.run(`UPDATE ${table} SET created_by = ? WHERE created_by IS NULL OR created_by = 0`, [adminId]);
            db.run(`UPDATE ${table} SET updated_by = ? WHERE updated_by IS NULL OR updated_by = 0`, [adminId]);

            // Count changes? Sql.js doesn't return affected rows easily in basic exec without using changes()
            const changes = db.exec("SELECT changes()");
            totalMigrated += (changes[0]?.values[0]?.[0] as number) || 0;
          }
        } catch (e) {
          // Ignorar errores de tablas/columnas faltantes en esta etapa soft
          // console.warn(`Skipping migration for ${ table }: `, e);
        }
      }

      if (totalMigrated > 0) {
        logger.info('Database', 'migration_ownership', `Migrados ${totalMigrated} registros huérfanos a Admin ID ${adminId} `);
      }

    } catch (error) {
      logger.error('Database', 'migration_ownership_failed', 'Error migrando propiedad de datos', { error });
    }
  };

  // Insertar datos de ejemplo
  const insertSampleData = async (): Promise<void> => {
    if (!db) return;

    // ============================================
    // ORDEN SEGURO: Desactivar FKs durante seeding
    // ============================================
    db.run(`PRAGMA foreign_keys = OFF`);

    try {
      // PASO 1: Tablas maestras SIN dependencias
      // -----------------------------------------

      // 1.1 Métodos de Pago (Sin FK)
      db.run(`
      INSERT INTO payment_methods(name, type, is_active, requires_reference) VALUES
  ('Efectivo', 'cash', 1, 0),
  ('Transferencia Bancaria', 'bank_transfer', 1, 1),
  ('Cheque', 'check', 1, 1),
  ('Tarjeta de Crédito', 'credit_card', 1, 1),
  ('Zelle', 'digital', 1, 1)
    `);

      // 1.2 Datos de la Empresa (Sin FK)
      db.run(`
      INSERT INTO company_data(
      company_name, legal_name, address, city, state, zip_code, phone, email, tax_id,
      fiscal_year_start, currency, timezone, date_format, is_active
    ) VALUES(
      'Account Express Demo Inc.', 'Account Express Demo Inc.', '100 Biscayne Blvd', 'Miami', 'FL', '33132', '(305) 555-0000',
      'admin@accountexpress.com', 'US-DEMO-123',
      '01-01', 'USD', 'America/New_York', 'MM/DD/YYYY', 1
    )
      `);

      // PASO 2: Tablas con FK (después de maestras)
      // --------------------------------------------

      // Clientes de ejemplo con datos completos
      db.run(`
    INSERT INTO customers(
        name, business_name, document_type, document_number, business_type,
        email, phone, address_line1, city, state, zip_code, florida_county,
        credit_limit, payment_terms, assigned_salesperson
      ) VALUES
        (
          'John Smith', 'Acme Corp LLC', 'EIN', '12-3456789', 'Technology Services',
          'john@acmecorp.com', '(305) 555-0123', '1234 Biscayne Blvd', 'Miami', 'FL', '33132', 'Miami-Dade',
          50000.00, 30, 'Ana García'
        ),
        (
          'Maria Rodriguez', 'Florida Tech Solutions Inc', 'EIN', '98-7654321', 'Software Development',
          'maria@fltech.com', '(407) 555-0456', '5678 Orange Ave', 'Orlando', 'FL', '32801', 'Orange',
          25000.00, 15, 'Carlos López'
        ),
        (
          'Robert Johnson', 'Sunshine Retail Group', 'EIN', '45-6789012', 'Retail',
          'robert@sunshine.com', '(813) 555-0789', '9012 Tampa Bay Blvd', 'Tampa', 'FL', '33602', 'Hillsborough',
          75000.00, 45, 'Ana García'
        )
          `);

      // Los productos ya se insertan en insertInitialProducts

      // Facturas de ejemplo
      db.run(`
    INSERT INTO invoices(invoice_number, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, status) VALUES
  ('INV-2024-001', 1, '2024-01-15', '2024-02-14', 1500.00, 105.00, 1605.00, 'paid'),
  ('INV-2024-002', 2, '2024-01-20', '2024-02-04', 299.99, 19.50, 319.49, 'sent'),
  ('INV-2024-003', 3, '2024-01-25', '2024-03-10', 2500.00, 175.00, 2675.00, 'draft')
    `);

      // Líneas de factura de ejemplo
      db.run(`
    INSERT INTO invoice_lines(invoice_id, product_id, description, quantity, unit_price, line_total) VALUES
  (1, 1, 'Consultoría Contable - 10 horas', 10.000, 150.00, 1500.00),
  (2, 2, 'Software License - Anual', 1.000, 299.99, 299.99),
  (3, 3, 'Auditoría Fiscal Completa', 5.000, 500.00, 2500.00)
    `);

      // Pagos de ejemplo
      db.run(`
    INSERT INTO payments(customer_id, invoice_id, payment_number, payment_date, amount, payment_method, reference_number) VALUES
  (1, 1, 'PAY-2024-001', '2024-02-10', 1605.00, 'bank_transfer', 'TXN-789456123'),
  (2, NULL, 'PAY-2024-002', '2024-01-25', 500.00, 'check', 'CHK-001234')
    `);

      // Tasas de impuestos para condados principales (REPARACIÓN: Dedup)

      // 1. Limpieza de duplicados existentes
      db.run(`DELETE FROM florida_tax_rates WHERE id NOT IN(SELECT MIN(id) FROM florida_tax_rates GROUP BY county_name)`);

      // 2. Asegurar unicidad futura
      db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_florida_county ON florida_tax_rates(county_name)`);

      // 3. Insertar solo si no existen
      db.run(`
    INSERT OR IGNORE INTO florida_tax_rates(county_name, county_rate, total_rate) VALUES
  ('Miami-Dade', 0.01, 0.07),
  ('Orange', 0.005, 0.065),
  ('Hillsborough', 0.0075, 0.0675),
  ('Broward', 0.01, 0.07),
  ('Palm Beach', 0.01, 0.07)
    `);

      // Proveedores de ejemplo
      db.run(`
    INSERT INTO suppliers(
      name, business_name, document_type, document_number, business_type,
      email, phone, address_line1, city, state, zip_code, florida_county,
      credit_limit, payment_terms, assigned_buyer
    ) VALUES
      (
        'Tech Solutions Inc', 'Tech Solutions Incorporated', 'EIN', '87-6543210', 'Technology Supplier',
        'contact@techsolutions.com', '(305) 555-1001', '2500 NW 87th Ave', 'Miami', 'FL', '33172', 'Miami-Dade',
        100000.00, 30, 'Carlos López'
      ),
      (
        'Office Supplies Pro', 'Office Supplies Pro LLC', 'EIN', '76-5432109', 'Office Equipment',
        'sales@officesupplies.com', '(407) 555-2002', '1800 Colonial Dr', 'Orlando', 'FL', '32804', 'Orange',
        50000.00, 15, 'Ana García'
      ),
      (
        'Florida Business Services', 'FBS Corp', 'EIN', '65-4321098', 'Professional Services',
        'info@flbusiness.com', '(813) 555-3003', '4200 W Kennedy Blvd', 'Tampa', 'FL', '33609', 'Hillsborough',
        75000.00, 45, 'María Rodríguez'
      ),
      (
        'Global Logistics', 'Global Logistics Florida', 'EIN', '54-3210987', 'Logistics',
        'ops@globallogistics.com', '(305) 555-4004', '1000 Port Blvd', 'Miami', 'FL', '33132', 'Miami-Dade',
        120000.00, 30, 'Carlos López'
      ),
      (
        'Janitorial Experts', 'Janitorial Experts LLC', 'EIN', '43-2109876', 'Cleaning',
        'service@janitorial.com', '(407) 555-5005', '500 International Dr', 'Orlando', 'FL', '32819', 'Orange',
        5000.00, 7, 'Ana García'
      )
        `);

      // Facturas de compra de ejemplo
      db.run(`
    INSERT INTO bills(bill_number, supplier_id, issue_date, due_date, subtotal, tax_amount, total_amount, status) VALUES
  ('BILL-2024-001', 1, '2024-01-10', '2024-02-09', 2000.00, 140.00, 2140.00, 'approved'),
  ('BILL-2024-002', 2, '2024-01-15', '2024-01-30', 850.00, 55.25, 905.25, 'received'),
  ('BILL-2024-003', 3, '2024-01-20', '2024-03-05', 1500.00, 105.00, 1605.00, 'paid'),
  ('BILL-2024-004', 4, '2024-01-22', '2024-02-21', 500.00, 35.00, 535.00, 'approved')
    `);

      // Líneas de factura de compra de ejemplo
      db.run(`
    INSERT INTO bill_lines(bill_id, product_id, description, quantity, unit_price, line_total) VALUES
  (1, 2, 'Software Licenses - Bulk Purchase', 10.000, 200.00, 2000.00),
  (2, 4, 'Office Equipment Setup', 5.000, 170.00, 850.00),
  (3, 1, 'Professional Consulting Services', 10.000, 150.00, 1500.00),
  (4, 3, 'Shipping Fees', 1.000, 500.00, 500.00)
    `);

      // Asientos Contables de ejemplo (Journal Entries)
      db.run(`
    INSERT INTO journal_entries(entry_date, reference, description, total_debit, total_credit) VALUES
  ('2024-01-01', 'OB-2024', 'Asiento de Apertura', 100000.00, 100000.00),
  ('2024-01-15', 'INV-2024-001', 'Venta a John Smith', 1605.00, 1605.00),
  ('2024-01-20', 'BILL-2024-003', 'Pago a Florida Business Services', 1605.00, 1605.00)
    `);

      // Detalles de Asientos Contables (Journal Details)
      // 1. Apertura: Caja (1112) Debit 100k, Capital (3110) Credit 100k
      // 2. Venta: Cuentas por Cobrar (1121) Debit 1605, Ventas (4110) Credit 1500, Tax Payable (2121) Credit 105
      // 3. Compra: Gastos Profesionales (5240) Debit 1500, Tax Credit (1121?) Debit 105, Cash (1112) Credit 1605
      db.run(`
    INSERT INTO journal_details(journal_entry_id, account_code, debit_amount, credit_amount, description) VALUES
  (1, '1112', 100000.00, 0, 'Apertura de banco'),
  (1, '3110', 0, 100000.00, 'Aporte de capital'),
  (2, '1121', 1605.00, 0, 'Saldo deudor cliente'),
  (2, '4110', 0, 1500.00, 'Venta de productos'),
  (2, '2121', 0, 105.00, 'Impuesto ventas Florida'),
  (3, '5240', 1500.00, 0, 'Servicios profesionales recibidos'),
  (3, '2121', 105.00, 0, 'Crédito fiscal Florida'),
  (3, '1112', 0, 1605.00, 'Pago en efectivo/banco')
    `);

      console.log('Sample data and Journal Entries inserted successfully');
    } catch (error) {
      console.error('Error inserting sample data:', error);
      throw error;
    } finally {
      // PASO 3: Reactivar Foreign Keys
      // -------------------------------
      db.run(`PRAGMA foreign_keys = ON`);
      console.log('✅ Foreign Keys reactivadas - Base de datos segura');
    }
  };

  // Insertar categorías de productos iniciales
  const insertInitialProductCategories = async (): Promise<void> => {
    if (!db) return;

    db.run(`
    INSERT INTO product_categories(name, description, tax_rate, active, created_at, updated_at) VALUES
  ('Servicios Profesionales', 'Servicios de consultoría, asesoría y profesionales', 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Software y Licencias', 'Software, aplicaciones y licencias digitales', 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Hardware y Equipos', 'Equipos de cómputo, hardware y tecnología', 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Suministros de Oficina', 'Materiales, suministros y artículos de oficina', 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Servicios de Mantenimiento', 'Servicios de mantenimiento y soporte técnico', 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    console.log('Initial product categories inserted successfully');
  };

  // Insertar productos iniciales
  const insertInitialProducts = async (): Promise<void> => {
    if (!db) return;

    db.run(`
    INSERT INTO products(
      sku, name, description, price, cost, category_id, unit_of_measure,
      taxable, stock_quantity, min_stock_level, max_stock_level, reorder_point,
      is_service, active, created_at, updated_at
    ) VALUES
      ('SERV-001', 'Consultoría Contable', 'Servicios de consultoría contable y fiscal para empresas en Florida', 150.00, 75.00, 1, 'hora', 1, 0, 0, 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('SERV-002', 'Auditoría Fiscal', 'Servicios de auditoría y cumplimiento fiscal completo', 500.00, 250.00, 1, 'servicio', 1, 0, 0, 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('SERV-003', 'Preparación de Impuestos', 'Preparación y presentación de declaraciones de impuestos', 200.00, 100.00, 1, 'servicio', 1, 0, 0, 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('PROD-001', 'Licencia Software Contable', 'Licencia anual de software contable profesional', 299.99, 150.00, 2, 'unidad', 1, 50, 10, 100, 20, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('PROD-002', 'Configuración Hardware', 'Configuración e instalación de hardware contable', 199.99, 100.00, 3, 'servicio', 1, 0, 0, 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('PROD-003', 'Papel Bond A4', 'Resma de papel bond tamaño carta para impresión', 12.99, 8.50, 4, 'resma', 1, 100, 20, 200, 30, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('PROD-004', 'Tóner Impresora HP', 'Cartucho de tóner para impresoras HP LaserJet', 89.99, 55.00, 4, 'unidad', 1, 25, 5, 50, 10, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('SERV-004', 'Soporte Técnico', 'Servicios de soporte técnico y mantenimiento de sistemas', 120.00, 60.00, 5, 'hora', 1, 0, 0, 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);

    console.log('Initial products inserted successfully');
  };

  const insertInitialTaxRates = async (): Promise<void> => {
    if (!db) return;

    db.run(`
    INSERT INTO florida_tax_rates(county_name, state_rate, county_rate, total_rate) VALUES
  ('Miami-Dade', 0.06, 0.005, 0.065),
  ('Broward', 0.06, 0.00, 0.06),
  ('Palm Beach', 0.06, 0.00, 0.06),
  ('Orange', 0.06, 0.005, 0.065),
  ('Hillsborough', 0.06, 0.005, 0.065),
  ('Monroe', 0.06, 0.015, 0.075),
  ('Duval', 0.06, 0.0075, 0.0675),
  ('Pinellas', 0.06, 0.01, 0.07),
  ('Lee', 0.06, 0.01, 0.07)
    `);

    console.log('Initial tax rates inserted successfully (2026 rates)');
  };

  // Insertar configuraciones iniciales de n�mina
  const insertInitialPayrollSettings = async (): Promise<void> => {
    if (!db) return;

    try {
      db.run(`
        INSERT INTO payroll_settings(setting_key, setting_value, category, description) VALUES
        ('federal_tax_rate', '0.15', 'taxes', 'Tasa de impuesto federal por defecto'),
        ('state_tax_rate', '0.00', 'taxes', 'Tasa de impuesto estatal Florida (sin impuesto estatal)'),
        ('fica_tax_rate', '0.062', 'taxes', 'Tasa FICA (Social Security)'),
        ('medicare_tax_rate', '0.0145', 'taxes', 'Tasa Medicare'),
        ('pay_frequency', 'monthly', 'general', 'Frecuencia de pago por defecto'),
        ('overtime_rate', '1.5', 'general', 'Multiplicador para horas extras'),
        ('company_name', 'Account Express Demo Inc.', 'general', 'Nombre de la empresa para reportes'),
        ('ein_number', 'XX-XXXXXXX', 'general', 'N�mero de identificaci�n del empleador')
      `);
      console.log('Initial payroll settings inserted successfully');
    } catch (e) {
      console.error('Error inserting payroll settings:', e);
    }
  };

  // Ejecutar procesos de inicialización/seeding
  await seedUsersAndRoles();
  await migrateDataOwnership();

  // Verificar si ya existen categorías antes de insertar
  const catCount = db.exec("SELECT COUNT(*) FROM product_categories")[0]?.values[0]?.[0] || 0;
  if (catCount === 0) {
    await insertInitialProductCategories();
  }

  // Verificar si ya existen productos antes de insertar
  const prodCount = db.exec("SELECT COUNT(*) FROM products")[0]?.values[0]?.[0] || 0;
  if (prodCount === 0) {
    await insertInitialProducts();
  }

  // Verificar si ya existen tasas antes de insertar
  const taxCount = db.exec("SELECT COUNT(*) FROM florida_tax_rates")[0]?.values[0]?.[0] || 0;
  if (taxCount === 0) {
    await insertInitialTaxRates();
  }

  // Verificar si ya existen ubicaciones antes de insertar
  const locationCount = db.exec("SELECT COUNT(*) FROM locations")[0]?.values[0]?.[0] || 0;
  if (locationCount === 0) {
    const locationResult = createInitialLocations();
    if (locationResult.success) {
      logger.info('Database', 'locations_seeded', locationResult.message);
    }
  }

  // Verificar si ya existen configuraciones de n�mina antes de insertar
  const payrollSettingsCount = db.exec("SELECT COUNT(*) FROM payroll_settings")[0]?.values[0]?.[0] || 0;
  if (payrollSettingsCount === 0) {
    await insertInitialPayrollSettings();
  }

  // Verificar si ya existe plan de cuentas antes de insertar
  const chartCount = db.exec("SELECT COUNT(*) FROM chart_of_accounts")[0]?.values[0]?.[0] || 0;
  if (chartCount === 0) {
    const chartResult = await insertInitialChartOfAccounts();
    if (chartResult.success) {
      logger.info('Database', 'chart_seeded', chartResult.message);
    } else {
      logger.error('Database', 'chart_seed_failed', chartResult.message);
    }
  }

  logger.info('Database', 'initialization_complete', 'Esquema y datos iniciales verificados');
};

const setupAutoSave = (): void => {
  if (!db) return;

  setInterval(async () => {
    try {
      await saveDatabase();
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, BACKUP_INTERVAL);

  // Guardar al cerrar la ventana
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      saveDatabase().catch(console.error);
    });
  }

  console.log('Auto-save configured');
};

// Guardar base de datos
export const saveDatabase = async (): Promise<void> => {
  if (!db) return;

  try {
    let data = db.export();

    // Cifrar si está habilitado
    if (encryptionEnabled && currentPassword) {
      try {
        const encrypted = await BasicEncryption.encrypt(data, currentPassword);
        data = BasicEncryption.combineEncryptedData(encrypted.encrypted, encrypted.salt, encrypted.iv);
        console.log('Database encrypted before saving');
      } catch (error) {
        console.error('Encryption failed, saving unencrypted:', error);
      }
    }

    if (opfsRoot && dbFile) {
      // Guardar en OPFS - ensure proper ArrayBuffer type
      const writable = await (dbFile as any).createWritable();
      // Convert to proper ArrayBuffer if it's a SharedArrayBuffer
      let dataBuffer: ArrayBuffer;
      if (data.buffer instanceof ArrayBuffer) {
        dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      } else {
        // Handle SharedArrayBuffer case
        const tempArray = new Uint8Array(data.length);
        tempArray.set(data);
        dataBuffer = tempArray.buffer;
      }
      await writable.write(dataBuffer);
      await writable.close();
      console.log('Database saved to OPFS');
    } else {
      // Fallback a localStorage (comprimido)
      const compressed = await compressData(data);
      localStorage.setItem('accountexpress-db', compressed);
      localStorage.setItem('accountexpress-encrypted', encryptionEnabled.toString());
      console.log('Database saved to localStorage (compressed)');
    }
  } catch (error) {
    console.error('Error saving database:', error);
  }
};



// Verificar si el cifrado está habilitado
export const isEncryptionEnabled = (): boolean => {
  return encryptionEnabled;
};

// Cambiar contraseña de cifrado
export const changeEncryptionPassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
  if (!db || !encryptionEnabled) return false;

  try {
    // Verificar contraseña actual
    if (currentPassword !== oldPassword) {
      throw new Error('Invalid current password');
    }

    // Cambiar contraseña
    currentPassword = newPassword;

    // Guardar con nueva contraseña
    await saveDatabase();

    console.log('Encryption password changed successfully');
    return true;
  } catch (error) {
    console.error('Error changing encryption password:', error);
    return false;
  }
};

// Habilitar cifrado en base de datos existente
export const enableEncryption = async (password: string): Promise<boolean> => {
  if (!db || encryptionEnabled || !BasicEncryption.isSupported()) {
    return false;
  }

  try {
    encryptionEnabled = true;
    currentPassword = password;

    // Guardar base de datos cifrada
    await saveDatabase();

    console.log('Encryption enabled successfully');
    return true;
  } catch (error) {
    console.error('Error enabling encryption:', error);
    encryptionEnabled = false;
    currentPassword = null;
    return false;
  }
};

// Deshabilitar cifrado
export const disableEncryption = async (password: string): Promise<boolean> => {
  if (!db || !encryptionEnabled || currentPassword !== password) {
    return false;
  }

  try {
    encryptionEnabled = false;
    currentPassword = null;

    // Guardar base de datos sin cifrar
    await saveDatabase();

    console.log('Encryption disabled successfully');
    return true;
  } catch (error) {
    console.error('Error disabling encryption:', error);
    return false;
  }
};

// Verificar si la base de datos está lista
export const isDatabaseReady = (): boolean => {
  const ready = isInitialized && db !== null;
  console.log('Database ready check:', { isInitialized, dbExists: !!db, ready });
  return ready;
};

export const addCustomer = async (customerData: Partial<Customer>, userId?: number): Promise<number> => {
  logger.debug('CustomerModule', 'add_customer_start', 'Iniciando proceso de agregar cliente', { customerName: customerData.name });

  if (!db) {
    logger.error('CustomerModule', 'add_customer_failed', 'Base de datos no inicializada al intentar agregar cliente');
    throw new Error('Database not initialized. Please wait for the system to load completely.');
  }

  // SANDBOX CHECK
  await checkGuestRestriction(userId, 'customers', 'create');

  try {
    logger.debug('CustomerModule', 'add_customer_transaction', 'Iniciando transacción para agregar cliente');
    // Iniciar transacción
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO customers(
      name, business_name, document_type, document_number, business_type,
      email, email_secondary, phone, phone_secondary,
      address_line1, address_line2, city, state, zip_code, florida_county,
      credit_limit, payment_terms, tax_exempt, tax_id, assigned_salesperson,
      status, notes, updated_at, created_by, updated_by
    ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `);

    const values = [
      customerData.name || '',
      customerData.business_name || null,
      customerData.document_type || 'SSN',
      customerData.document_number || null,
      customerData.business_type || null,
      customerData.email || null,
      customerData.email_secondary || null,
      customerData.phone || null,
      customerData.phone_secondary || null,
      customerData.address_line1 || null,
      customerData.address_line2 || null,
      customerData.city || 'Miami',
      customerData.state || 'FL',
      customerData.zip_code || null,
      customerData.florida_county || 'Miami-Dade',
      customerData.credit_limit || 0,
      customerData.payment_terms || 30,
      customerData.tax_exempt ? 1 : 0, // Convert boolean to number
      customerData.tax_id || null,
      customerData.assigned_salesperson || null,
      customerData.status || 'active',
      customerData.notes || null,
      userId || 1,
      userId || 1
    ];

    stmt.run(values);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const insertId = insertResult[0]?.values[0]?.[0] as number || 0;

    stmt.free();

    // Registrar en auditoría
    await logAuditEvent('customers', insertId, 'INSERT', null, customerData, userId);

    // Confirmar transacción
    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    logger.info('CustomerModule', 'add_customer_success', `Cliente agregado exitosamente con ID: ${insertId} `, {
      customerId: insertId,
      customerName: customerData.name,
      customerEmail: customerData.email
    });

    return insertId;

  } catch (error) {
    logger.error('CustomerModule', 'add_customer_failed', `Error al agregar cliente: ${error instanceof Error ? error.message : 'Unknown error'} `, {
      customerData: { name: customerData.name, email: customerData.email }
    }, error as Error);
    db?.run('ROLLBACK');
    throw error;
  }
};

// Obtener todos los clientes (con filtro opcional por usuario/rol para aislamiento)
export const getCustomers = (filters?: { userId?: number, role?: string }): Customer[] => {
  console.log('=== GETTING CUSTOMERS ===', filters);
  console.log('Database initialized:', !!db);

  if (!db) {
    console.log('Database not initialized, returning empty array');
    return [];
  }

  try {
    let query = `
SELECT
id, name, business_name, document_type, document_number, business_type,
  email, email_secondary, phone, phone_secondary,
  address_line1, address_line2, city, state, zip_code, florida_county,
  credit_limit, payment_terms, tax_exempt, tax_id, assigned_salesperson,
  status, notes, created_at, updated_at
      FROM customers 
    `;

    const params: any[] = [];

    // Isolation Logic: Non-admin/audit/accountant users only see their own records
    // Assuming 'sales' role should is restricted. 
    // If role is NOT in system/privileged list, we filter.
    const privilegedRoles = ['admin', 'accountant', 'auditor', 'viewer']; // Viewer sees all? Adjust per requirement. 
    // User req: "Vendedor1 solo ve SUS registros". Viewer usually implies GLOBAL read only. 
    // If requirement says "usuarios no-admin no ven datos de otros", we can be strict.
    // Let's assume 'viewer' sees all for now, but 'sales'/'purchasing' are restricted.

    if (filters?.userId && filters?.role && !PRIVILEGED_ROLES.includes(filters.role)) {
      query += ` WHERE created_by = ? `;
      params.push(filters.userId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = db.exec(query, params);

    console.log('Raw query result:', result);

    // Convertir el resultado a array de objetos
    const customers: Customer[] = [];

    if (result && result.length > 0 && result[0].values) {
      const columns = result[0].columns;
      const values = result[0].values;

      values.forEach((row: initSqlJs.SqlValue[]) => {
        const customerObj = rowToEntity<Record<string, unknown>>(columns, row);
        customers.push(processCustomerRow(customerObj));
      });
    }

    console.log('Processed customers:', customers);
    console.log('Customer count:', customers.length);
    return customers;

  } catch (error) {
    console.error('Error getting customers:', error);
    return [];
  }
};

// Función auxiliar para procesar una fila de cliente
const processCustomerRow = (row: Record<string, unknown>): Customer => {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    business_name: row.business_name ? String(row.business_name) : undefined,
    document_type: String(row.document_type || 'SSN') as 'SSN' | 'EIN' | 'ITIN' | 'PASSPORT',
    document_number: String(row.document_number || ''),
    business_type: row.business_type ? String(row.business_type) : undefined,
    email: String(row.email || ''),
    email_secondary: row.email_secondary ? String(row.email_secondary) : undefined,
    phone: String(row.phone || ''),
    phone_secondary: row.phone_secondary ? String(row.phone_secondary) : undefined,
    address_line1: String(row.address_line1 || ''),
    address_line2: row.address_line2 ? String(row.address_line2) : undefined,
    city: String(row.city || 'Miami'),
    state: String(row.state || 'FL'),
    zip_code: String(row.zip_code || ''),
    florida_county: String(row.florida_county || 'Miami-Dade'),
    credit_limit: Number(row.credit_limit || 0),
    payment_terms: Number(row.payment_terms || 30),
    tax_exempt: Boolean(Number(row.tax_exempt)), // Convert from SQLite integer to boolean
    tax_id: row.tax_id ? String(row.tax_id) : undefined,
    assigned_salesperson: row.assigned_salesperson ? String(row.assigned_salesperson) : undefined,
    status: String(row.status || 'active') as 'active' | 'inactive' | 'suspended',
    notes: row.notes ? String(row.notes) : undefined,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString())
  };
};

export const getCustomerById = (id: number): Customer | null => {
  if (!db) return null;

  try {
    const result = db.exec(`
SELECT
id, name, business_name, document_type, document_number, business_type,
  email, email_secondary, phone, phone_secondary,
  address_line1, address_line2, city, state, zip_code, florida_county,
  credit_limit, payment_terms, tax_exempt, tax_id, assigned_salesperson,
  status, notes, created_at, updated_at
      FROM customers 
      WHERE id = ${id}
`);

    if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
      const columns = result[0].columns;
      const row = result[0].values[0];

      const customerObj: any = {};
      columns.forEach((col: string, index: number) => {
        customerObj[col] = row[index];
      });

      return processCustomerRow(customerObj);
    }

    return null;

  } catch (error) {
    console.error('Error getting customer by ID:', error);
    return null;
  }
};

export const updateCustomer = (id: number, customerData: Partial<Customer>, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Obtener valores anteriores para auditoría
    const oldCustomer = getCustomerById(id);
    if (!oldCustomer) {
      return { success: false, message: 'Cliente no encontrado' };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      UPDATE customers 
      SET name = ?, business_name = ?, document_type = ?, document_number = ?, business_type = ?,
  email = ?, email_secondary = ?, phone = ?, phone_secondary = ?,
  address_line1 = ?, address_line2 = ?, city = ?, state = ?, zip_code = ?, florida_county = ?,
  credit_limit = ?, payment_terms = ?, tax_exempt = ?, tax_id = ?, assigned_salesperson = ?,
  status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
    WHERE id = ?
      `);

    const values = [
      customerData.name || oldCustomer.name,
      customerData.business_name || oldCustomer.business_name || null,
      customerData.document_type || oldCustomer.document_type,
      customerData.document_number || oldCustomer.document_number,
      customerData.business_type || oldCustomer.business_type || null,
      customerData.email || oldCustomer.email,
      customerData.email_secondary || oldCustomer.email_secondary || null,
      customerData.phone || oldCustomer.phone,
      customerData.phone_secondary || oldCustomer.phone_secondary || null,
      customerData.address_line1 || oldCustomer.address_line1,
      customerData.address_line2 || oldCustomer.address_line2 || null,
      customerData.city || oldCustomer.city,
      customerData.state || oldCustomer.state,
      customerData.zip_code || oldCustomer.zip_code,
      customerData.florida_county || oldCustomer.florida_county,
      customerData.credit_limit !== undefined ? customerData.credit_limit : oldCustomer.credit_limit,
      customerData.payment_terms !== undefined ? customerData.payment_terms : oldCustomer.payment_terms,
      customerData.tax_exempt !== undefined ? (customerData.tax_exempt ? 1 : 0) : (oldCustomer.tax_exempt ? 1 : 0), // Convert boolean to number
      customerData.tax_id || oldCustomer.tax_id || null,
      customerData.assigned_salesperson || oldCustomer.assigned_salesperson || null,
      customerData.status || oldCustomer.status,
      customerData.notes || oldCustomer.notes || null,
      userId || 1,
      id
    ];

    stmt.run(values);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se realizaron cambios' };
    }

    // Registrar en auditoría
    logAuditEvent('customers', id, 'UPDATE', oldCustomer, customerData, userId);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    console.log(`Customer ${id} updated successfully`);
    return { success: true, message: `Cliente "${customerData.name || oldCustomer.name}" actualizado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error updating customer:', error);
    return { success: false, message: `Error al actualizar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'} ` };
  }
};

// Verificar si un cliente puede ser eliminado
export const canDeleteCustomer = (customerId: number): { canDelete: boolean; reason?: string } => {
  if (!db) return { canDelete: false, reason: 'Database not initialized' };

  try {
    // Verificar si tiene facturas
    const invoiceCheck = db.exec(`
      SELECT COUNT(*) as count FROM invoices WHERE customer_id = ${customerId}
`);
    const invoiceCount = invoiceCheck[0]?.values[0]?.[0] as number || 0;

    if (invoiceCount > 0) {
      return {
        canDelete: false,
        reason: `El cliente tiene ${invoiceCount} factura(s) asociada(s).No se puede eliminar.`
      };
    }

    // Verificar si tiene pagos
    const paymentCheck = db.exec(`
      SELECT COUNT(*) as count FROM payments WHERE customer_id = ${customerId}
`);
    const paymentCount = paymentCheck[0]?.values[0]?.[0] as number || 0;

    if (paymentCount > 0) {
      return {
        canDelete: false,
        reason: `El cliente tiene ${paymentCount} pago(s) registrado(s).No se puede eliminar.`
      };
    }

    return { canDelete: true };

  } catch (error) {
    console.error('Error checking if customer can be deleted:', error);
    return { canDelete: false, reason: 'Error al verificar las dependencias del cliente' };
  }
};

export const deleteCustomer = (id: number, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar si se puede eliminar
    const deleteCheck = canDeleteCustomer(id);
    if (!deleteCheck.canDelete) {
      return { success: false, message: deleteCheck.reason || 'No se puede eliminar el cliente' };
    }

    // Obtener datos del cliente para auditoría antes de eliminar
    const customer = getCustomerById(id);
    if (!customer) {
      return { success: false, message: 'Cliente no encontrado' };
    }

    db.run('BEGIN TRANSACTION');

    // Eliminar cliente
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    stmt.run([id]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar el cliente' };
    }

    // Registrar en auditoría
    logAuditEvent('customers', id, 'DELETE', customer, null, userId);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    console.log(`Customer ${id} deleted successfully`);
    return { success: true, message: `Cliente "${customer.name}" eliminado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error deleting customer:', error);
    return { success: false, message: `Error al eliminar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'} ` };
  }
};

// Función de auditoría mejorada
// Implementación SHA-256 Síncrona (Forensic Grade Offline)
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const k = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';

  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return ''; // ASCII check: only support 8-bit characters
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength);

  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;

    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

// Función auxiliar para exportar (Wrapper)
export const generateSimpleHash = (data: any): string => {
  // Asegurar consistencia de fechas en data
  return sha256(JSON.stringify(data));
};

// Función para generar hash de auditoría con chaining (Síncrona Real)
const generateAuditHash = async (auditData: any): Promise<string> => {
  try {
    let previousHash = '0';

    if (!auditData.previousHash) {
      // Uso síncrono de db.exec
      const lastHashResult = db?.exec(`
        SELECT audit_hash FROM audit_log 
        ORDER BY id DESC 
        LIMIT 1
  `);
      previousHash = lastHashResult?.[0]?.values?.[0]?.[0] as string || '0';
    } else {
      previousHash = auditData.previousHash;
    }

    const dataToHash = JSON.stringify({
      previousHash,
      tableName: auditData.tableName,
      recordId: auditData.recordId,
      action: auditData.action,
      oldValues: auditData.oldValues,
      newValues: auditData.newValues,
      timestamp: auditData.timestamp, // Debe ser ISO String 8601
      userId: auditData.userId
    });

    return sha256(dataToHash);

  } catch (error) {
    console.error('Error generating audit hash:', error);
    return sha256(Date.now().toString());
  }
};

// Función auxiliar para hash síncrono (para funciones no async)


const logAuditEvent = async (tableName: string, recordId: number, action: string, oldValues: any, newValues: any, userId?: number): Promise<void> => {
  if (!db) return;

  try {
    // Generar datos de auditoría
    const auditData = {
      tableName,
      recordId,
      action,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      timestamp: new Date().toISOString(),
      userId: userId || 1
    };

    // Generar hash con chaining
    const auditHash = await generateAuditHash(auditData);

    const stmt = db.prepare(`
      INSERT INTO audit_log(
    table_name, record_id, action, old_values, new_values,
    user_id, timestamp, audit_hash
  )
VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      tableName,
      recordId,
      action,
      auditData.oldValues,
      auditData.newValues,
      auditData.userId,
      auditData.timestamp,
      auditHash
    ]);

    stmt.free();

    logger.info('AuditSystem', 'log_event', `Audit event logged: ${action} on ${tableName} ID ${recordId} `, {
      tableName,
      recordId,
      action,
      auditHash: auditHash.substring(0, 8) + '...' // Log only first 8 chars for security
    });
  } catch (error) {
    logger.error('AuditSystem', 'log_event_failed', 'Error logging audit event', { tableName, recordId, action }, error as Error);
  }
};

// Obtener log de auditoría
export const getAuditLog = (limit: number = 100): Array<Record<string, any>> => {
  if (!db) return [];

  try {
    const stmt = db.prepare(`
SELECT * FROM audit_log 
      ORDER BY timestamp DESC
LIMIT ?
  `);

    const result = stmt.getAsObject([limit]);
    stmt.free();

    return Array.isArray(result) ? result as Array<Record<string, any>> : [];
  } catch (error) {
    console.error('Error getting audit log:', error);
    return [];
  }
};

// Obtener estadísticas de la base de datos
export const getDatabaseInfo = () => {
  if (!db) return null;

  try {
    const info = {
      size: db.export().length,
      tables: {} as Record<string, number>,
      lastBackup: localStorage.getItem('accountexpress-last-backup'),
      opfsSupported: !!opfsRoot,
      autoSaveEnabled: true
    };

    // Contar registros por tabla
    const tables = ['customers', 'products', 'florida_tax_rates', 'audit_log'];

    for (const table of tables) {
      try {
        const result = db.exec(`SELECT COUNT(*) as count FROM ${table} `);
        info.tables[table] = result[0]?.values[0]?.[0] as number || 0;
      } catch (error) {
        info.tables[table] = 0;
      }
    }

    return info;
  } catch (error) {
    console.error('Error getting database info:', error);
    return null;
  }
};

// Crear backup manual
export const createBackup = async (): Promise<string> => {
  if (!db) throw new Error('Database not initialized');

  try {
    await saveDatabase();
    const timestamp = new Date().toISOString();
    localStorage.setItem('accountexpress-last-backup', timestamp);

    console.log('Manual backup created at:', timestamp);
    return timestamp;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

export const getStats = () => {
  if (!db) return { customers: 0 };

  try {
    const customerResult = db.exec("SELECT COUNT(*) as count FROM customers");

    const customerCount = customerResult[0]?.values[0]?.[0] as number || 0;

    return {
      customers: customerCount
    };

  } catch (error) {
    console.error('Error getting stats:', error);
    return { customers: 0 };
  }
};

// Condados de Florida para el dropdown
export const FLORIDA_COUNTIES = [
  'Alachua', 'Baker', 'Bay', 'Bradford', 'Brevard', 'Broward', 'Calhoun',
  'Charlotte', 'Citrus', 'Clay', 'Collier', 'Columbia', 'DeSoto', 'Dixie',
  'Duval', 'Escambia', 'Flagler', 'Franklin', 'Gadsden', 'Gilchrist',
  'Glades', 'Gulf', 'Hamilton', 'Hardee', 'Hendry', 'Hernando', 'Highlands',
  'Hillsborough', 'Holmes', 'Indian River', 'Jackson', 'Jefferson', 'Lafayette',
  'Lake', 'Lee', 'Leon', 'Levy', 'Liberty', 'Madison', 'Manatee', 'Marion',
  'Martin', 'Miami-Dade', 'Monroe', 'Nassau', 'Okaloosa', 'Okeechobee',
  'Orange', 'Osceola', 'Palm Beach', 'Pasco', 'Pinellas', 'Polk', 'Putnam',
  'Santa Rosa', 'Sarasota', 'Seminole', 'St. Johns', 'St. Lucie', 'Sumter',
  'Suwannee', 'Taylor', 'Union', 'Volusia', 'Wakulla', 'Walton', 'Washington'
];

// ==========================================
// FUNCIONES CRUD PARA FACTURAS
// ==========================================

// Generar número de factura automático
export const generateInvoiceNumber = (): string => {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.exec("SELECT COUNT(*) as count FROM invoices");
    const count = (result[0]?.values[0]?.[0] as number || 0) + 1;
    const year = new Date().getFullYear();
    return `INV - ${year} -${count.toString().padStart(4, '0')} `;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    const timestamp = Date.now().toString().slice(-6);
    return `INV - ${new Date().getFullYear()} -${timestamp} `;
  }
};

// Obtener todas las facturas con información del cliente
// Obtener todas las facturas con información del cliente y aislamiento
export const getInvoices = (filters?: { userId?: number, role?: string }): Invoice[] => {
  if (!db) return [];

  try {
    let query = `
SELECT
i.*,
  c.name as customer_name,
  c.business_name as customer_business_name,
  c.email as customer_email
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
  `;

    const params: any[] = [];
    if (filters?.userId && filters?.role && !PRIVILEGED_ROLES.includes(filters.role)) {
      query += ` WHERE i.created_by = ? `;
      params.push(filters.userId);
    }

    query += ` ORDER BY i.created_at DESC`;

    const result = db.exec(query, params);

    if (!result[0]) return [];

    const invoices: Invoice[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: initSqlJs.SqlValue[]) => {
      const invoice = rowToEntity<Invoice & { customer_name: string; customer_business_name: string; customer_email: string }>(columns, row);

      // Agregar información del cliente
      invoice.customer = {
        name: invoice.customer_name,
        business_name: invoice.customer_business_name,
        email: invoice.customer_email
      } as Customer;

      invoices.push(invoice);
    });

    return invoices;
  } catch (error) {
    console.error('Error getting invoices:', error);
    return [];
  }
};

// Obtener factura por ID con líneas de factura
export const getInvoiceById = (id: number): Invoice | null => {
  if (!db) return null;

  try {
    // Obtener factura principal
    const invoiceResult = db.exec(`
SELECT
i.*,
  c.name as customer_name,
  c.business_name as customer_business_name,
  c.email as customer_email,
  c.phone as customer_phone,
  c.address_line1 as customer_address,
  c.city as customer_city,
  c.state as customer_state,
  c.zip_code as customer_zip
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
  `, [id]);

    if (!invoiceResult[0] || invoiceResult[0].values.length === 0) return null;

    const invoiceRow = invoiceResult[0].values[0];
    const columns = invoiceResult[0].columns;

    const invoice: any = {};
    columns.forEach((col: any, index: any) => {
      invoice[col] = invoiceRow[index];
    });

    // Agregar información del cliente
    invoice.customer = {
      name: invoice.customer_name,
      business_name: invoice.customer_business_name,
      email: invoice.customer_email,
      phone: invoice.customer_phone,
      address_line1: invoice.customer_address,
      city: invoice.customer_city,
      state: invoice.customer_state,
      zip_code: invoice.customer_zip
    };

    // Obtener líneas de factura
    const itemsResult = db.exec(`
      SELECT
il.*,
  p.name as product_name,
  p.sku as product_sku
      FROM invoice_lines il
      LEFT JOIN products p ON il.product_id = p.id
      WHERE il.invoice_id = ?
  ORDER BY il.id
    `, [id]);

    invoice.items = [];
    if (itemsResult[0]) {
      const itemColumns = itemsResult[0].columns;
      itemsResult[0].values.forEach((itemRow: any) => {
        const item: any = {};
        itemColumns.forEach((col: any, index: any) => {
          item[col] = itemRow[index];
        });

        if (item.product_id) {
          item.product = {
            name: item.product_name,
            sku: item.product_sku
          };
        }

        invoice.items.push(item);
      });
    }

    return invoice as Invoice;
  } catch (error) {
    console.error('Error getting invoice by ID:', error);
    return null;
  }
};

// Crear nueva factura
export const createInvoice = (invoiceData: Partial<Invoice>, items: Partial<InvoiceItem>[], userId?: number): { success: boolean; message: string; invoiceId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validaciones básicas
    if (!invoiceData.customer_id) {
      return { success: false, message: 'Customer ID is required' };
    }

    if (!items || items.length === 0) {
      return { success: false, message: 'At least one item is required' };
    }

    // Validar bloqueo de periodos
    const issueDateStr = invoiceData.issue_date || new Date().toISOString().split('T')[0];
    if (isDateLocked(issueDateStr)) {
      return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado.' };
    }

    // Generar número de factura si no se proporciona
    const invoiceNumber = invoiceData.invoice_number || generateInvoiceNumber();

    // Obtener condado del cliente para cálculo de impuestos
    const customer = getCustomerById(invoiceData.customer_id);
    const county = customer?.florida_county || 'Miami-Dade';

    // Calcular totales usando tasa dinámica
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      subtotal += lineTotal;
      if (item.taxable) {
        taxAmount += lineTotal * getFloridaTaxRate(county); // Usar tasa dinámica por condado
      }
    });

    const total = subtotal + taxAmount;

    // Insertar factura principal
    const stmt = db.prepare(`
      INSERT INTO invoices(
      invoice_number, customer_id, issue_date, due_date,
      subtotal, tax_amount, total_amount, status, notes,
      created_by, updated_by
    ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

    const issueDate = invoiceData.issue_date || new Date().toISOString().split('T')[0];
    const dueDate = invoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    stmt.run([
      invoiceNumber,
      invoiceData.customer_id,
      issueDate,
      dueDate,
      subtotal,
      taxAmount,
      total,
      invoiceData.status || 'draft',
      invoiceData.notes || '',
      userId || 1,
      userId || 1
    ]);

    const invoiceId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;

    // Insertar líneas de factura
    const itemStmt = db.prepare(`
      INSERT INTO invoice_lines(
        invoice_id, product_id, description, quantity, unit_price, line_total, taxable
      ) VALUES(?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      itemStmt.run([
        invoiceId,
        item.product_id || null,
        item.description || '',
        item.quantity || 1,
        item.unit_price || 0,
        lineTotal,
        item.taxable ? 1 : 0
      ]);
    });

    // Registrar en auditoría
    logAuditAction('invoices', invoiceId, 'INSERT', null, {
      invoice_number: invoiceNumber,
      customer_id: invoiceData.customer_id,
      total_amount: total,
      status: invoiceData.status || 'draft'
    }, userId);

    // GENERAR ASIENTO CONTABLE AUTOMÁTICO (DOBLE ENTRADA)
    if (invoiceData.status === 'sent' || invoiceData.status === 'paid') {
      const fullInvoice = getInvoiceById(invoiceId);
      if (fullInvoice) {
        const journalResult = generateSalesJournalEntry(fullInvoice, userId);
        if (!journalResult.success) {
          console.warn('Warning: Could not generate journal entry for invoice:', journalResult.message);
        } else {
          console.log('Journal entry created for invoice:', journalResult.entryId);
        }
      }
    }

    return {
      success: true,
      message: `Invoice ${invoiceNumber} created successfully`,
      invoiceId
    };

  } catch (error) {
    console.error('Error creating invoice:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error creating invoice'
    };
  }
};

// Actualizar factura
export const updateInvoice = (id: number, invoiceData: Partial<Invoice>, items?: Partial<InvoiceItem>[], userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Obtener factura actual para auditoría
    const currentInvoice = getInvoiceById(id);
    if (!currentInvoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // Validar bloqueo de periodos - usar fecha de la factura actual o la nueva si se está actualizando
    const dateToCheck = invoiceData.issue_date || currentInvoice.issue_date;
    if (isDateLocked(dateToCheck)) {
      return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado.' };
    }

    // Actualizar factura principal
    const updateFields = [];
    const updateValues = [];

    if (invoiceData.issue_date !== undefined) {
      updateFields.push('issue_date = ?');
      updateValues.push(invoiceData.issue_date);
    }

    if (invoiceData.due_date !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(invoiceData.due_date);
    }

    if (invoiceData.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(invoiceData.status);
    }

    if (invoiceData.notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(invoiceData.notes);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateFields.push('updated_by = ?');
      updateValues.push(userId || 1);
      updateValues.push(id);

      const updateQuery = `UPDATE invoices SET ${updateFields.join(', ')} WHERE id = ? `;
      db.exec(updateQuery, updateValues);
    }

    // Si se proporcionan items, actualizar líneas de factura
    if (items) {
      // Eliminar líneas existentes
      db.exec('DELETE FROM invoice_lines WHERE invoice_id = ?', [id]);

      // Insertar nuevas líneas
      let subtotal = 0;
      let taxAmount = 0;

      const itemStmt = db.prepare(`
        INSERT INTO invoice_lines(
        invoice_id, product_id, description, quantity, unit_price, line_total, taxable
      ) VALUES(?, ?, ?, ?, ?, ?, ?)
        `);

      // Obtener condado para recálculo de impuestos
      const invoice = getInvoiceById(id);
      const county = invoice?.customer?.florida_county || 'Miami-Dade';
      const taxRate = getFloridaTaxRate(county);

      items.forEach(item => {
        const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
        subtotal += lineTotal;
        if (item.taxable) {
          taxAmount += lineTotal * taxRate;
        }

        itemStmt.run([
          id,
          item.product_id || null,
          item.description || '',
          item.quantity || 1,
          item.unit_price || 0,
          lineTotal,
          item.taxable ? 1 : 0
        ]);
      });

      // Actualizar totales
      const total = subtotal + taxAmount;
      db.exec(`
        UPDATE invoices 
        SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
  WHERE id = ?
    `, [subtotal, taxAmount, total, userId || 1, id]);
    }

    // Registrar en auditoría
    logAuditAction('invoices', id, 'UPDATE', currentInvoice, invoiceData, userId);

    return { success: true, message: 'Invoice updated successfully' };

  } catch (error) {
    console.error('Error updating invoice:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error updating invoice'
    };
  }
};

// Eliminar factura
export const deleteInvoice = (id: number, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar si la factura existe
    const invoice = getInvoiceById(id);
    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // Verificar si la factura está pagada (no se puede eliminar)
    if (invoice.status === 'paid') {
      return { success: false, message: 'Cannot delete paid invoices' };
    }

    // Eliminar líneas de factura primero (por foreign key)
    db.exec('DELETE FROM invoice_lines WHERE invoice_id = ?', [id]);

    // Eliminar factura
    db.exec('DELETE FROM invoices WHERE id = ?', [id]);

    // Registrar en auditoría
    logAuditAction('invoices', id, 'DELETE', invoice, null, userId);

    return { success: true, message: 'Invoice deleted successfully' };

  } catch (error) {
    console.error('Error deleting invoice:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error deleting invoice'
    };
  }
};

// Obtener productos activos para el formulario de factura
export const getActiveProducts = (): Product[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT * FROM products 
      WHERE active = 1 
      ORDER BY name
  `);

    if (!result[0]) return [];

    const products: Product[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const product: any = {};
      columns.forEach((col: any, index: any) => {
        product[col] = row[index];
      });
      products.push(product as Product);
    });

    return products;
  } catch (error) {
    console.error('Error getting active products:', error);
    return [];
  }
};

// Calcular tasa de impuesto por condado de Florida dinámicamente
export const getFloridaTaxRate = (county: string): number => {
  if (!db) return 0.06; // Tasa base por defecto

  try {
    const result = db.exec(`
      SELECT total_rate FROM florida_tax_rates 
      WHERE county_name = ?
  ORDER BY effective_date DESC 
      LIMIT 1
  `, [county]);

    if (result && result.length > 0 && result[0].values.length > 0) {
      return Number(result[0].values[0][0]) || 0.06;
    }
  } catch (error) {
    console.error('Error getting tax rate for county:', county, error);
  }

  // Tasas de respaldo por condado de Florida (Seguir datos de insertInitialTaxRates)
  const fallbackRates: Record<string, number> = {
    'Miami-Dade': 0.07,
    'Broward': 0.07,
    'Orange': 0.065,
    'Hillsborough': 0.075,
    'Palm Beach': 0.07,
    'Pinellas': 0.07,
    'Duval': 0.075,
    'Lee': 0.065,
    'Polk': 0.07,
    'Brevard': 0.07,
    'Monroe': 0.075
  };

  return fallbackRates[county] || 0.06; // 6% tasa base de Florida
};

// Función mejorada para calcular impuestos con condado específico
export const calculateTaxAmount = (subtotal: number, county: string = 'Miami-Dade', taxableItems: boolean = true): { taxAmount: number; taxRate: number } => {
  if (!taxableItems || subtotal <= 0) {
    return { taxAmount: 0, taxRate: 0 };
  }

  const taxRate = getFloridaTaxRate(county);
  const taxAmount = subtotal * taxRate;

  return {
    taxAmount: Math.round(taxAmount * 100) / 100, // Redondear a 2 decimales
    taxRate
  };
};

// Función para validar integridad de cálculos financieros
export const validateFinancialCalculation = (subtotal: number, taxAmount: number, total: number, county: string): boolean => {
  const calculated = calculateTaxAmount(subtotal, county);
  const expectedTotal = subtotal + calculated.taxAmount;

  // Tolerancia de 1 centavo para errores de redondeo
  const tolerance = 0.01;

  return Math.abs(total - expectedTotal) <= tolerance &&
    Math.abs(taxAmount - calculated.taxAmount) <= tolerance;
};

// Actualizar estadísticas para incluir facturas
export const getStatsWithInvoices = () => {
  if (!db) return { customers: 0, invoices: 0, revenue: 0 };

  try {
    const customerResult = db.exec("SELECT COUNT(*) as count FROM customers");
    const invoiceResult = db.exec("SELECT COUNT(*) as count FROM invoices");
    const revenueResult = db.exec("SELECT SUM(total_amount) as total FROM invoices WHERE status = 'paid'");

    const customerCount = customerResult[0]?.values[0]?.[0] as number || 0;
    const invoiceCount = invoiceResult[0]?.values[0]?.[0] as number || 0;
    const revenue = revenueResult[0]?.values[0]?.[0] as number || 0;

    return {
      customers: customerCount,
      invoices: invoiceCount,
      revenue: revenue
    };

  } catch (error) {
    console.error('Error getting stats with invoices:', error);
    return { customers: 0, invoices: 0, revenue: 0 };
  }
};

// ==========================================
// FUNCIONES CRUD PARA PROVEEDORES
// ==========================================

// ==========================================
// FUNCIONES CRUD PARA COTIZACIONES (QUOTES)
// ==========================================

/**
 * Obtiene todas las cotizaciones con filtros opcionales
 */
export const getQuotes = (filters?: { userId?: number; role?: string; status?: string }): Quote[] => {
  if (!db) return [];

  try {
    let query = `
      SELECT q.*, c.name as customer_name, c.florida_county
      FROM quotes q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filtro por usuario y rol
    if (filters?.userId && filters?.role !== 'admin' && filters?.role !== 'auditor') {
      query += ' AND q.created_by = ?';
      params.push(filters.userId);
    }

    // Filtro por estado
    if (filters?.status) {
      query += ' AND q.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY q.created_at DESC';

    const result = db.exec(query, params);
    if (!result[0]) return [];

    return result[0].values.map((row: any) => rowToEntity<Quote>(result[0].columns, row));
  } catch (error) {
    console.error('Error getting quotes:', error);
    return [];
  }
};

/**
 * Obtiene una cotizaci�n por ID con sus l�neas
 */
export const getQuoteById = (id: number): Quote | null => {
  if (!db) return null;

  try {
    const quoteResult = db.exec(`
      SELECT q.*, c.name as customer_name, c.florida_county
      FROM quotes q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.id = ?
    `, [id]);

    if (!quoteResult[0] || quoteResult[0].values.length === 0) return null;

    const quote = rowToEntity<Quote>(quoteResult[0].columns, quoteResult[0].values[0]);

    // Obtener l�neas de cotizaci�n
    const linesResult = db.exec(`
      SELECT ql.*, p.name as product_name, p.sku
      FROM quote_lines ql
      LEFT JOIN products p ON ql.product_id = p.id
      WHERE ql.quote_id = ?
    `, [id]);

    if (linesResult[0]) {
      quote.items = linesResult[0].values.map((row: any) =>
        rowToEntity<QuoteLine>(linesResult[0].columns, row)
      );
    }

    return quote;
  } catch (error) {
    console.error('Error getting quote by ID:', error);
    return null;
  }
};

/**
 * Crea una nueva cotizaci�n
 */
export const createQuote = (
  quoteData: Partial<Quote>,
  items: Partial<QuoteLine>[],
  userId?: number
): { success: boolean; message: string; quoteId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validaciones
    if (!quoteData.customer_id) {
      return { success: false, message: 'Customer ID is required' };
    }

    if (!items || items.length === 0) {
      return { success: false, message: 'At least one item is required' };
    }

    // Generar n�mero de cotizaci�n
    const quoteNumber = quoteData.quote_number || generateQuoteNumber();

    // Obtener condado del cliente para c�lculo de impuestos
    const customer = getCustomerById(quoteData.customer_id);
    const county = customer?.florida_county || 'Miami-Dade';

    // Calcular totales
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const discount = (item.discount_percentage || 0) / 100;
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0) * (1 - discount);
      subtotal += lineTotal;
      if (item.taxable) {
        taxAmount += lineTotal * getFloridaTaxRate(county);
      }
    });

    const total = subtotal + taxAmount;

    // Insertar cotizaci�n
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO quotes(
        quote_number, customer_id, issue_date, expiration_date,
        subtotal, tax_amount, total_amount, status, notes, terms,
        created_by, updated_by
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const issueDate = quoteData.issue_date || new Date().toISOString().split('T')[0];
    const expirationDate = quoteData.expiration_date ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    stmt.run([
      quoteNumber,
      quoteData.customer_id,
      issueDate,
      expirationDate,
      subtotal,
      taxAmount,
      total,
      quoteData.status || 'draft',
      quoteData.notes || '',
      quoteData.terms || '',
      userId || 1,
      userId || 1
    ]);

    const quoteId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();

    // Insertar l�neas de cotizaci�n
    const itemStmt = db.prepare(`
      INSERT INTO quote_lines(
        quote_id, product_id, description, quantity, unit_price, 
        discount_percentage, line_total, taxable
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      const discount = (item.discount_percentage || 0) / 100;
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0) * (1 - discount);
      itemStmt.run([
        quoteId,
        item.product_id || null,
        item.description || '',
        item.quantity || 1,
        item.unit_price || 0,
        item.discount_percentage || 0,
        lineTotal,
        item.taxable ? 1 : 0
      ]);
    });
    itemStmt.free();

    db.run('COMMIT');

    // Registrar en auditor�a
    logAuditAction('quotes', quoteId, 'INSERT', null, {
      quote_number: quoteNumber,
      customer_id: quoteData.customer_id,
      total_amount: total,
      status: quoteData.status || 'draft'
    }, userId);

    return {
      success: true,
      message: `Cotizaci�n ${quoteNumber} creada exitosamente`,
      quoteId
    };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error creating quote:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error creating quote'
    };
  }
};

/**
 * Actualiza una cotizaci�n existente
 */
export const updateQuote = (
  id: number,
  quoteData: Partial<Quote>,
  items?: Partial<QuoteLine>[],
  userId?: number
): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const currentQuote = getQuoteById(id);
    if (!currentQuote) {
      return { success: false, message: 'Quote not found' };
    }

    // No permitir editar cotizaciones convertidas
    if (currentQuote.status === 'converted') {
      return { success: false, message: 'Cannot edit converted quotes' };
    }

    db.run('BEGIN TRANSACTION');

    // Actualizar cotizaci�n principal
    const updateFields = [];
    const updateValues = [];

    if (quoteData.issue_date !== undefined) {
      updateFields.push('issue_date = ?');
      updateValues.push(quoteData.issue_date);
    }

    if (quoteData.expiration_date !== undefined) {
      updateFields.push('expiration_date = ?');
      updateValues.push(quoteData.expiration_date);
    }

    if (quoteData.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(quoteData.status);
    }

    if (quoteData.notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(quoteData.notes);
    }

    if (quoteData.terms !== undefined) {
      updateFields.push('terms = ?');
      updateValues.push(quoteData.terms);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateFields.push('updated_by = ?');
      updateValues.push(userId || 1);
      updateValues.push(id);

      const updateQuery = `UPDATE quotes SET ${updateFields.join(', ')} WHERE id = ?`;
      db.run(updateQuery, updateValues);
    }

    // Si se proporcionan items, actualizar l�neas
    if (items) {
      // Eliminar l�neas existentes
      db.run('DELETE FROM quote_lines WHERE quote_id = ?', [id]);

      // Recalcular totales
      let subtotal = 0;
      let taxAmount = 0;

      const quote = getQuoteById(id);
      const county = quote?.customer?.florida_county || 'Miami-Dade';
      const taxRate = getFloridaTaxRate(county);

      const itemStmt = db.prepare(`
        INSERT INTO quote_lines(
          quote_id, product_id, description, quantity, unit_price,
          discount_percentage, line_total, taxable
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach(item => {
        const discount = (item.discount_percentage || 0) / 100;
        const lineTotal = (item.quantity || 1) * (item.unit_price || 0) * (1 - discount);
        subtotal += lineTotal;
        if (item.taxable) {
          taxAmount += lineTotal * taxRate;
        }

        itemStmt.run([
          id,
          item.product_id || null,
          item.description || '',
          item.quantity || 1,
          item.unit_price || 0,
          item.discount_percentage || 0,
          lineTotal,
          item.taxable ? 1 : 0
        ]);
      });
      itemStmt.free();

      const total = subtotal + taxAmount;

      // Actualizar totales
      db.run(`
        UPDATE quotes 
        SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [subtotal, taxAmount, total, id]);
    }

    db.run('COMMIT');

    // Registrar en auditor�a
    logAuditAction('quotes', id, 'UPDATE', currentQuote, quoteData, userId);

    return { success: true, message: 'Cotizaci�n actualizada exitosamente' };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error updating quote:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error updating quote'
    };
  }
};

/**
 * Elimina una cotizaci�n
 */
export const deleteQuote = (id: number, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const quote = getQuoteById(id);
    if (!quote) {
      return { success: false, message: 'Quote not found' };
    }

    // No permitir eliminar cotizaciones convertidas
    if (quote.status === 'converted') {
      return { success: false, message: 'Cannot delete converted quotes' };
    }

    db.run('BEGIN TRANSACTION');

    // Eliminar l�neas primero
    db.run('DELETE FROM quote_lines WHERE quote_id = ?', [id]);

    // Eliminar cotizaci�n
    db.run('DELETE FROM quotes WHERE id = ?', [id]);

    db.run('COMMIT');

    // Registrar en auditor�a
    logAuditAction('quotes', id, 'DELETE', quote, null, userId);

    return { success: true, message: 'Cotizaci�n eliminada exitosamente' };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error deleting quote:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error deleting quote'
    };
  }
};

/**
 * Convierte una cotizaci�n en factura
 */
export const convertQuoteToInvoice = (
  quoteId: number,
  userId?: number
): { success: boolean; message: string; invoiceId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const quote = getQuoteById(quoteId);
    if (!quote) {
      return { success: false, message: 'Quote not found' };
    }

    if (quote.status === 'converted') {
      return { success: false, message: 'Quote already converted' };
    }

    if (quote.status !== 'accepted') {
      return { success: false, message: 'Only accepted quotes can be converted' };
    }

    // Crear factura desde cotizaci�n
    const invoiceData: Partial<Invoice> = {
      customer_id: quote.customer_id,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      notes: `Convertida desde cotizaci�n ${quote.quote_number}`
    };

    const invoiceItems: Partial<InvoiceItem>[] = (quote.items || []).map(item => ({
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      taxable: item.taxable
    }));

    const result = createInvoice(invoiceData, invoiceItems, userId);

    if (result.success && result.invoiceId) {
      // Actualizar cotizaci�n como convertida
      db.run(`
        UPDATE quotes 
        SET status = 'converted', converted_to_invoice_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [result.invoiceId, quoteId]);

      return {
        success: true,
        message: `Cotizaci�n convertida a factura exitosamente`,
        invoiceId: result.invoiceId
      };
    }

    return result;

  } catch (error) {
    console.error('Error converting quote to invoice:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error converting quote'
    };
  }
};

/**
 * Genera n�mero de cotizaci�n autom�tico
 */
function generateQuoteNumber(): string {
  if (!db) return `QT-${Date.now()}`;

  try {
    const result = db.exec("SELECT COUNT(*) as count FROM quotes");
    const count = result[0]?.values[0]?.[0] as number || 0;
    const year = new Date().getFullYear();
    return `QT-${year}-${String(count + 1).padStart(5, '0')}`;
  } catch (error) {
    return `QT-${Date.now()}`;
  }
}

// ==========================================
// FUNCIONES CRUD PARA PROVEEDORES
// ==========================================

// Agregar proveedor
export const addSupplier = (supplierData: Partial<Supplier>, userId?: number): number => {
  console.log('=== ADD SUPPLIER FUNCTION ===');
  console.log('Database object:', db);
  console.log('Is initialized:', isInitialized);
  console.log('Supplier data:', supplierData);

  if (!db) {
    console.error('Database not initialized when trying to add supplier');
    throw new Error('Database not initialized. Please wait for the system to load completely.');
  }

  try {
    console.log('Starting transaction...');
    // Iniciar transacción
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO suppliers(
    name, business_name, document_type, document_number, business_type,
    email, email_secondary, phone, phone_secondary,
    address_line1, address_line2, city, state, zip_code, florida_county,
    credit_limit, payment_terms, tax_exempt, tax_id, assigned_buyer,
    status, notes, updated_at, created_by, updated_by
  ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
    `);

    const values = [
      supplierData.name || '',
      supplierData.business_name || null,
      supplierData.document_type || 'EIN',
      supplierData.document_number || null,
      supplierData.business_type || null,
      supplierData.email || null,
      supplierData.email_secondary || null,
      supplierData.phone || null,
      supplierData.phone_secondary || null,
      supplierData.address_line1 || null,
      supplierData.address_line2 || null,
      supplierData.city || 'Miami',
      supplierData.state || 'FL',
      supplierData.zip_code || null,
      supplierData.florida_county || 'Miami-Dade',
      supplierData.credit_limit || 0,
      supplierData.payment_terms || 30,
      supplierData.tax_exempt ? 1 : 0,
      supplierData.tax_id || null,
      supplierData.assigned_buyer || null,
      supplierData.status || 'active',
      supplierData.notes || null,
      userId || 1,
      userId || 1
    ];

    console.log('Executing insert with values:', values);
    stmt.run(values);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const insertId = insertResult[0]?.values[0]?.[0] as number || 0;
    console.log('Insert ID:', insertId);

    stmt.free();

    // Registrar en auditoría
    logAuditEvent('suppliers', insertId, 'INSERT', null, supplierData, userId);

    // Confirmar transacción
    db.run('COMMIT');
    console.log('Transaction committed');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    console.log(`Supplier added with ID: ${insertId} `);
    return insertId;

  } catch (error) {
    console.error('Error in addSupplier:', error);
    db?.run('ROLLBACK');
    throw error;
  }
};

// Obtener todos los proveedores
// Obtener todos los proveedores con aislamiento
export const getSuppliers = (filters?: { userId?: number, role?: string }): Supplier[] => {
  console.log('=== GETTING SUPPLIERS ===', filters);
  console.log('Database initialized:', !!db);

  if (!db) {
    console.log('Database not initialized, returning empty array');
    return [];
  }

  try {
    let query = `
SELECT
id, name, business_name, document_type, document_number, business_type,
  email, email_secondary, phone, phone_secondary,
  address_line1, address_line2, city, state, zip_code, florida_county,
  credit_limit, payment_terms, tax_exempt, tax_id, assigned_buyer,
  status, notes, created_at, updated_at
      FROM suppliers 
    `;

    const params: any[] = [];
    if (filters?.userId && filters?.role && !PRIVILEGED_ROLES.includes(filters.role)) {
      query += ` WHERE created_by = ? `;
      params.push(filters.userId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = db.exec(query, params);

    console.log('Raw query result:', result);

    // Convertir el resultado a array de objetos
    const suppliers: Supplier[] = [];

    if (result && result.length > 0 && result[0].values) {
      const columns = result[0].columns;
      const values = result[0].values;

      values.forEach((row: initSqlJs.SqlValue[]) => {
        const supplierObj = rowToEntity<Record<string, unknown>>(columns, row);
        suppliers.push(processSupplierRow(supplierObj));
      });
    }

    console.log('Processed suppliers:', suppliers);
    console.log('Supplier count:', suppliers.length);
    return suppliers;

  } catch (error) {
    console.error('Error getting suppliers:', error);
    return [];
  }
};

// Función auxiliar para procesar una fila de proveedor
const processSupplierRow = (row: any): Supplier => {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    business_name: row.business_name ? String(row.business_name) : undefined,
    document_type: String(row.document_type || 'EIN') as 'SSN' | 'EIN' | 'ITIN' | 'PASSPORT',
    document_number: String(row.document_number || ''),
    business_type: row.business_type ? String(row.business_type) : undefined,
    email: String(row.email || ''),
    email_secondary: row.email_secondary ? String(row.email_secondary) : undefined,
    phone: String(row.phone || ''),
    phone_secondary: row.phone_secondary ? String(row.phone_secondary) : undefined,
    address_line1: String(row.address_line1 || ''),
    address_line2: row.address_line2 ? String(row.address_line2) : undefined,
    city: String(row.city || 'Miami'),
    state: String(row.state || 'FL'),
    zip_code: String(row.zip_code || ''),
    florida_county: String(row.florida_county || 'Miami-Dade'),
    credit_limit: Number(row.credit_limit || 0),
    payment_terms: Number(row.payment_terms || 30),
    tax_exempt: Boolean(Number(row.tax_exempt)),
    tax_id: row.tax_id ? String(row.tax_id) : undefined,
    assigned_buyer: row.assigned_buyer ? String(row.assigned_buyer) : undefined,
    status: String(row.status || 'active') as 'active' | 'inactive' | 'suspended',
    notes: row.notes ? String(row.notes) : undefined,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString())
  };
};

// Obtener proveedor por ID
export const getSupplierById = (id: number): Supplier | null => {
  if (!db) return null;

  try {
    const result = db.exec(`
SELECT
id, name, business_name, document_type, document_number, business_type,
  email, email_secondary, phone, phone_secondary,
  address_line1, address_line2, city, state, zip_code, florida_county,
  credit_limit, payment_terms, tax_exempt, tax_id, assigned_buyer,
  status, notes, created_at, updated_at
      FROM suppliers 
      WHERE id = ${id}
`);

    if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
      const columns = result[0].columns;
      const row = result[0].values[0];

      const supplierObj: any = {};
      columns.forEach((col: string, index: number) => {
        supplierObj[col] = row[index];
      });

      return processSupplierRow(supplierObj);
    }

    return null;

  } catch (error) {
    console.error('Error getting supplier by ID:', error);
    return null;
  }
};

// Actualizar proveedor
export const updateSupplier = (id: number, supplierData: Partial<Supplier>, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Obtener valores anteriores para auditoría
    const oldSupplier = getSupplierById(id);
    if (!oldSupplier) {
      return { success: false, message: 'Proveedor no encontrado' };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      UPDATE suppliers 
      SET name = ?, business_name = ?, document_type = ?, document_number = ?, business_type = ?,
  email = ?, email_secondary = ?, phone = ?, phone_secondary = ?,
  address_line1 = ?, address_line2 = ?, city = ?, state = ?, zip_code = ?, florida_county = ?,
  credit_limit = ?, payment_terms = ?, tax_exempt = ?, tax_id = ?, assigned_buyer = ?,
  status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
    WHERE id = ?
      `);

    const values = [
      supplierData.name || oldSupplier.name,
      supplierData.business_name || oldSupplier.business_name || null,
      supplierData.document_type || oldSupplier.document_type,
      supplierData.document_number || oldSupplier.document_number,
      supplierData.business_type || oldSupplier.business_type || null,
      supplierData.email || oldSupplier.email,
      supplierData.email_secondary || oldSupplier.email_secondary || null,
      supplierData.phone || oldSupplier.phone,
      supplierData.phone_secondary || oldSupplier.phone_secondary || null,
      supplierData.address_line1 || oldSupplier.address_line1,
      supplierData.address_line2 || oldSupplier.address_line2 || null,
      supplierData.city || oldSupplier.city,
      supplierData.state || oldSupplier.state,
      supplierData.zip_code || oldSupplier.zip_code,
      supplierData.florida_county || oldSupplier.florida_county,
      supplierData.credit_limit !== undefined ? supplierData.credit_limit : oldSupplier.credit_limit,
      supplierData.payment_terms !== undefined ? supplierData.payment_terms : oldSupplier.payment_terms,
      supplierData.tax_exempt !== undefined ? (supplierData.tax_exempt ? 1 : 0) : (oldSupplier.tax_exempt ? 1 : 0),
      supplierData.tax_id || oldSupplier.tax_id || null,
      supplierData.assigned_buyer || oldSupplier.assigned_buyer || null,
      supplierData.status || oldSupplier.status,
      supplierData.notes || oldSupplier.notes || null,
      userId || 1,
      id
    ];

    stmt.run(values);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se realizaron cambios' };
    }

    // Registrar en auditoría
    logAuditEvent('suppliers', id, 'UPDATE', oldSupplier, supplierData, userId);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    console.log(`Supplier ${id} updated successfully`);
    return { success: true, message: `Proveedor "${supplierData.name || oldSupplier.name}" actualizado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error updating supplier:', error);
    return { success: false, message: `Error al actualizar el proveedor: ${error instanceof Error ? error.message : 'Error desconocido'} ` };
  }
};

// Verificar si un proveedor puede ser eliminado
export const canDeleteSupplier = (supplierId: number): { canDelete: boolean; reason?: string } => {
  if (!db) return { canDelete: false, reason: 'Database not initialized' };

  try {
    // Verificar si tiene facturas de compra
    const billCheck = db.exec(`
      SELECT COUNT(*) as count FROM bills WHERE supplier_id = ${supplierId}
`);
    const billCount = billCheck[0]?.values[0]?.[0] as number || 0;

    if (billCount > 0) {
      return {
        canDelete: false,
        reason: `El proveedor tiene ${billCount} factura(s) de compra asociada(s).No se puede eliminar.`
      };
    }

    // Verificar si tiene pagos
    const paymentCheck = db.exec(`
      SELECT COUNT(*) as count FROM supplier_payments WHERE supplier_id = ${supplierId}
`);
    const paymentCount = paymentCheck[0]?.values[0]?.[0] as number || 0;

    if (paymentCount > 0) {
      return {
        canDelete: false,
        reason: `El proveedor tiene ${paymentCount} pago(s) registrado(s).No se puede eliminar.`
      };
    }

    return { canDelete: true };

  } catch (error) {
    console.error('Error checking if supplier can be deleted:', error);
    return { canDelete: false, reason: 'Error al verificar las dependencias del proveedor' };
  }
};

// Eliminar proveedor
export const deleteSupplier = (id: number, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar si se puede eliminar
    const deleteCheck = canDeleteSupplier(id);
    if (!deleteCheck.canDelete) {
      return { success: false, message: deleteCheck.reason || 'No se puede eliminar el proveedor' };
    }

    // Obtener datos del proveedor para auditoría antes de eliminar
    const supplier = getSupplierById(id);
    if (!supplier) {
      return { success: false, message: 'Proveedor no encontrado' };
    }

    db.run('BEGIN TRANSACTION');

    // Eliminar proveedor
    const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?');
    stmt.run([id]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar el proveedor' };
    }

    // Registrar en auditoría
    logAuditEvent('suppliers', id, 'DELETE', supplier, null, userId);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    console.log(`Supplier ${id} deleted successfully`);
    return { success: true, message: `Proveedor "${supplier.name}" eliminado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error deleting supplier:', error);
    return { success: false, message: `Error al eliminar el proveedor: ${error instanceof Error ? error.message : 'Error desconocido'} ` };
  }
};

// ==========================================
// FUNCIONES CRUD PARA FACTURAS DE COMPRA (BILLS)
// ==========================================

// Generar número de factura de compra automático
export const generateBillNumber = (): string => {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.exec("SELECT COUNT(*) as count FROM bills");
    const count = (result[0]?.values[0]?.[0] as number || 0) + 1;
    const year = new Date().getFullYear();
    return `BILL - ${year} -${count.toString().padStart(4, '0')} `;
  } catch (error) {
    console.error('Error generating bill number:', error);
    const timestamp = Date.now().toString().slice(-6);
    return `BILL - ${new Date().getFullYear()} -${timestamp} `;
  }
};

// Obtener todas las facturas de compra con información del proveedor
// Obtener todas las facturas de compra con información del proveedor y aislamiento
export const getBills = (filters?: { userId?: number, role?: string }): Bill[] => {
  if (!db) return [];

  try {
    let query = `
SELECT
b.*,
  s.name as supplier_name,
  s.business_name as supplier_business_name,
  s.email as supplier_email
      FROM bills b
      LEFT JOIN suppliers s ON b.supplier_id = s.id
  `;

    const params: any[] = [];
    if (filters?.userId && filters?.role && !PRIVILEGED_ROLES.includes(filters.role)) {
      query += ` WHERE b.created_by = ? `;
      params.push(filters.userId);
    }

    query += ` ORDER BY b.created_at DESC`;

    const result = db.exec(query, params);

    if (!result[0]) return [];

    const bills: Bill[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: initSqlJs.SqlValue[]) => {
      const bill = rowToEntity<Bill & { supplier_name: string; supplier_business_name: string; supplier_email: string }>(columns, row);

      // Agregar información del proveedor
      bill.supplier = {
        name: bill.supplier_name,
        business_name: bill.supplier_business_name,
        email: bill.supplier_email
      } as Supplier;

      bills.push(bill);
    });

    return bills;
  } catch (error) {
    console.error('Error getting bills:', error);
    return [];
  }
};

// Obtener factura de compra por ID con líneas
export const getBillById = (id: number): Bill | null => {
  if (!db) return null;

  try {
    // Obtener factura principal
    const billResult = db.exec(`
SELECT
b.*,
  s.name as supplier_name,
  s.business_name as supplier_business_name,
  s.email as supplier_email,
  s.phone as supplier_phone,
  s.address_line1 as supplier_address,
  s.city as supplier_city,
  s.state as supplier_state,
  s.zip_code as supplier_zip
      FROM bills b
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      WHERE b.id = ?
  `, [id]);

    if (!billResult[0] || billResult[0].values.length === 0) return null;

    const billRow = billResult[0].values[0];
    const columns = billResult[0].columns;

    const bill: any = {};
    columns.forEach((col: any, index: any) => {
      bill[col] = billRow[index];
    });

    // Agregar información del proveedor
    bill.supplier = {
      name: bill.supplier_name,
      business_name: bill.supplier_business_name,
      email: bill.supplier_email,
      phone: bill.supplier_phone,
      address_line1: bill.supplier_address,
      city: bill.supplier_city,
      state: bill.supplier_state,
      zip_code: bill.supplier_zip
    };

    // Obtener líneas de factura
    const itemsResult = db.exec(`
      SELECT
bl.*,
  p.name as product_name,
  p.sku as product_sku
      FROM bill_lines bl
      LEFT JOIN products p ON bl.product_id = p.id
      WHERE bl.bill_id = ?
  ORDER BY bl.id
    `, [id]);

    bill.items = [];
    if (itemsResult[0]) {
      const itemColumns = itemsResult[0].columns;
      itemsResult[0].values.forEach((itemRow: any) => {
        const item: any = {};
        itemColumns.forEach((col: any, index: any) => {
          item[col] = itemRow[index];
        });

        if (item.product_id) {
          item.product = {
            name: item.product_name,
            sku: item.product_sku
          };
        }

        bill.items.push(item);
      });
    }

    return bill as Bill;
  } catch (error) {
    console.error('Error getting bill by ID:', error);
    return null;
  }
};

// Crear nueva factura de compra
export const createBill = (billData: Partial<Bill>, items: Partial<BillItem>[], userId?: number): { success: boolean; message: string; billId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validaciones básicas
    if (!billData.supplier_id) {
      return { success: false, message: 'Supplier ID is required' };
    }

    if (!items || items.length === 0) {
      return { success: false, message: 'At least one item is required' };
    }

    // Validar bloqueo de periodos
    const issueDateStr = billData.issue_date || new Date().toISOString().split('T')[0];
    if (isDateLocked(issueDateStr)) {
      return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado.' };
    }

    // Generar número de factura si no se proporciona
    const billNumber = billData.bill_number || generateBillNumber();

    // Obtener condado del proveedor para cálculo de impuestos
    const supplier = getSupplierById(billData.supplier_id);
    const county = supplier?.florida_county || 'Miami-Dade';

    // Calcular totales usando tasa dinámica
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      subtotal += lineTotal;
      if (item.taxable) {
        taxAmount += lineTotal * getFloridaTaxRate(county); // Usar tasa dinámica por condado
      }
    });

    const total = subtotal + taxAmount;

    // Insertar factura principal
    const stmt = db.prepare(`
      INSERT INTO bills(
      bill_number, supplier_id, issue_date, due_date,
      subtotal, tax_amount, total_amount, status, notes,
      created_by, updated_by
    ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

    const issueDate = billData.issue_date || new Date().toISOString().split('T')[0];
    const dueDate = billData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    stmt.run([
      billNumber,
      billData.supplier_id,
      issueDate,
      dueDate,
      subtotal,
      taxAmount,
      total,
      billData.status || 'draft',
      billData.notes || '',
      userId || 1,
      userId || 1
    ]);

    const billId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;

    // Insertar líneas de factura
    const itemStmt = db.prepare(`
      INSERT INTO bill_lines(
        bill_id, product_id, description, quantity, unit_price, line_total, taxable
      ) VALUES(?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      itemStmt.run([
        billId,
        item.product_id || null,
        item.description || '',
        item.quantity || 1,
        item.unit_price || 0,
        lineTotal,
        item.taxable ? 1 : 0
      ]);
    });

    // Registrar en auditoría
    logAuditEvent('bills', billId, 'INSERT', null, {
      bill_number: billNumber,
      supplier_id: billData.supplier_id,
      total_amount: total,
      status: billData.status || 'draft'
    }, userId);

    // GENERAR ASIENTO CONTABLE AUTOMÁTICO (DOBLE ENTRADA)
    if (billData.status === 'approved' || billData.status === 'paid') {
      const fullBill = getBillById(billId);
      if (fullBill) {
        const journalResult = generatePurchaseJournalEntry(fullBill, userId);
        if (!journalResult.success) {
          console.warn('Warning: Could not generate journal entry for bill:', journalResult.message);
        } else {
          console.log('Journal entry created for bill:', journalResult.entryId);
        }
      }
    }

    return {
      success: true,
      message: `Factura de compra ${billNumber} creada correctamente`,
      billId
    };

  } catch (error) {
    console.error('Error creating bill:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error creating bill'
    };
  }
};

// Actualizar estadísticas para incluir proveedores
// Actualizar estadísticas para incluir proveedores con aislamiento
export const getStatsWithSuppliers = (filters?: { userId?: number, role?: string }) => {
  if (!db) return { customers: 0, invoices: 0, revenue: 0, suppliers: 0, bills: 0, expenses: 0 };

  try {
    let customerQuery = "SELECT COUNT(*) as count FROM customers";
    let invoiceQuery = "SELECT COUNT(*) as count FROM invoices";
    let revenueQuery = "SELECT SUM(total_amount) as total FROM invoices WHERE status = 'paid'";
    let supplierQuery = "SELECT COUNT(*) as count FROM suppliers";
    let billQuery = "SELECT COUNT(*) as count FROM bills";
    let expenseQuery = "SELECT SUM(total_amount) as total FROM bills WHERE status = 'paid'";

    const params: any[] = [];

    if (filters?.userId && filters?.role && !PRIVILEGED_ROLES.includes(filters.role)) {
      customerQuery += " WHERE created_by = ?";
      invoiceQuery += " WHERE created_by = ?";
      revenueQuery += " AND created_by = ?";
      supplierQuery += " WHERE created_by = ?";
      billQuery += " WHERE created_by = ?";
      expenseQuery += " AND created_by = ?";
      params.push(filters.userId);
    }

    const customerCount = db.exec(customerQuery, params)[0]?.values[0]?.[0] as number || 0;
    const invoiceCount = db.exec(invoiceQuery, params)[0]?.values[0]?.[0] as number || 0;
    const revenue = db.exec(revenueQuery, params)[0]?.values[0]?.[0] as number || 0;
    const supplierCount = db.exec(supplierQuery, params)[0]?.values[0]?.[0] as number || 0;
    const billCount = db.exec(billQuery, params)[0]?.values[0]?.[0] as number || 0;
    const expenses = db.exec(expenseQuery, params)[0]?.values[0]?.[0] as number || 0;

    return {
      customers: customerCount,
      invoices: invoiceCount,
      revenue: revenue,
      suppliers: supplierCount,
      bills: billCount,
      expenses: expenses
    };

  } catch (error) {
    console.error('Error getting stats with suppliers:', error);
    return { customers: 0, invoices: 0, revenue: 0, suppliers: 0, bills: 0, expenses: 0 };
  }
};

// Actualizar factura de compra
export const updateBill = (id: number, billData: Partial<Bill>, items?: Partial<BillItem>[], userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Obtener factura actual para auditoría
    const currentBill = getBillById(id);
    if (!currentBill) {
      return { success: false, message: 'Factura de compra no encontrada' };
    }

    // Validar bloqueo de periodos - usar fecha de la factura actual o la nueva si se está actualizando
    const dateToCheck = billData.issue_date || currentBill.issue_date;
    if (isDateLocked(dateToCheck)) {
      return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado.' };
    }

    db.run('BEGIN TRANSACTION');

    // Actualizar factura principal
    const updateFields = [];
    const updateValues = [];

    if (billData.issue_date !== undefined) {
      updateFields.push('issue_date = ?');
      updateValues.push(billData.issue_date);
    }

    if (billData.due_date !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(billData.due_date);
    }

    if (billData.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(billData.status);
    }

    if (billData.notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(billData.notes);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateFields.push('updated_by = ?');
      updateValues.push(userId || 1);
      updateValues.push(id);

      const updateQuery = `UPDATE bills SET ${updateFields.join(', ')} WHERE id = ? `;
      db.exec(updateQuery, updateValues);
    }

    // Si se proporcionan items, actualizar líneas de factura
    if (items) {
      // Eliminar líneas existentes
      db.exec('DELETE FROM bill_lines WHERE bill_id = ?', [id]);

      // Obtener condado del proveedor para cálculo de impuestos
      const supplier = getSupplierById(currentBill.supplier_id);
      const county = supplier?.florida_county || 'Miami-Dade';

      // Insertar nuevas líneas y recalcular totales
      let subtotal = 0;
      let taxAmount = 0;

      const itemStmt = db.prepare(`
        INSERT INTO bill_lines(
        bill_id, product_id, description, quantity, unit_price, line_total, taxable
      ) VALUES(?, ?, ?, ?, ?, ?, ?)
        `);

      items.forEach(item => {
        const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
        subtotal += lineTotal;
        if (item.taxable) {
          taxAmount += lineTotal * getFloridaTaxRate(county); // Usar tasa dinámica por condado
        }

        itemStmt.run([
          id,
          item.product_id || null,
          item.description || '',
          item.quantity || 1,
          item.unit_price || 0,
          lineTotal,
          item.taxable ? 1 : 0
        ]);
      });

      itemStmt.free();

      // Actualizar totales
      const total = subtotal + taxAmount;
      db.exec(`
        UPDATE bills 
        SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
  WHERE id = ?
    `, [subtotal, taxAmount, total, userId || 1, id]);
    }

    // Registrar en auditoría
    logAuditEvent('bills', id, 'UPDATE', currentBill, billData, userId);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: 'Factura de compra actualizada correctamente' };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error updating bill:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar la factura de compra'
    };
  }
};

// Eliminar factura de compra
export const deleteBill = (id: number, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar si la factura existe
    const bill = getBillById(id);
    if (!bill) {
      return { success: false, message: 'Factura de compra no encontrada' };
    }

    // Verificar si la factura está pagada (no se puede eliminar)
    if (bill.status === 'paid') {
      return { success: false, message: 'No se pueden eliminar facturas de compra pagadas' };
    }

    // Verificar si tiene pagos asociados
    const paymentCheck = db.exec(`
      SELECT COUNT(*) as count FROM supplier_payments WHERE bill_id = ${id}
`);
    const paymentCount = paymentCheck[0]?.values[0]?.[0] as number || 0;

    if (paymentCount > 0) {
      return {
        success: false,
        message: `La factura tiene ${paymentCount} pago(s) asociado(s).No se puede eliminar.`
      };
    }

    db.run('BEGIN TRANSACTION');

    // Eliminar líneas de factura primero (por foreign key)
    db.exec('DELETE FROM bill_lines WHERE bill_id = ?', [id]);

    // Eliminar factura
    const stmt = db.prepare('DELETE FROM bills WHERE id = ?');
    stmt.run([id]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar la factura de compra' };
    }

    // Registrar en auditoría
    logAuditEvent('bills', id, 'DELETE', bill, null, userId);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: `Factura de compra ${bill.bill_number} eliminada correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error deleting bill:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al eliminar la factura de compra'
    };
  }
};

// ==========================================
// FUNCIONES CRUD PARA PLAN DE CUENTAS
// ==========================================

// Crear nueva cuenta contable
export const createChartOfAccount = (accountData: Partial<ChartOfAccount>): { success: boolean; message: string; accountId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    logger.info('ChartOfAccounts', 'create_start', `Creando cuenta: ${accountData.account_code} - ${accountData.account_name} `);

    // Validaciones básicas
    if (!accountData.account_code || !accountData.account_name || !accountData.account_type) {
      return { success: false, message: 'Código, nombre y tipo de cuenta son requeridos' };
    }

    // Verificar que el código no exista
    const existingAccount = db.exec(`SELECT account_code FROM chart_of_accounts WHERE account_code = ? `, [accountData.account_code]);
    if (existingAccount[0] && existingAccount[0].values.length > 0) {
      return { success: false, message: `El código de cuenta ${accountData.account_code} ya existe` };
    }

    // Verificar que la cuenta padre exista si se especifica
    if (accountData.parent_account) {
      const parentExists = db.exec(`SELECT account_code FROM chart_of_accounts WHERE account_code = ? `, [accountData.parent_account]);
      if (!parentExists[0] || parentExists[0].values.length === 0) {
        return { success: false, message: `La cuenta padre ${accountData.parent_account} no existe` };
      }
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO chart_of_accounts(
  account_code, account_name, account_type, normal_balance, parent_account,
  is_active, created_by, updated_by
) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      accountData.account_code || '',
      accountData.account_name || '',
      accountData.account_type || 'asset',
      accountData.normal_balance || 'debit',
      accountData.parent_account || null,
      accountData.is_active !== undefined ? (accountData.is_active ? 1 : 0) : 1,
      1, // TODO: Implementar sistema de usuarios
      1
    ]);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const insertId = insertResult[0]?.values[0]?.[0] as number || 0;

    stmt.free();

    // Registrar en auditoría
    logAuditEvent('chart_of_accounts', insertId, 'INSERT', null, accountData);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    logger.info('ChartOfAccounts', 'create_success', `Cuenta ${accountData.account_code} creada exitosamente`, {
      accountCode: accountData.account_code,
      accountId: insertId
    });

    return {
      success: true,
      message: `Cuenta ${accountData.account_code} - ${accountData.account_name} creada correctamente`,
      accountId: insertId
    };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('ChartOfAccounts', 'create_failed', `Error al crear cuenta: ${error instanceof Error ? error.message : 'Unknown error'} `, {
      accountData: { code: accountData.account_code, name: accountData.account_name }
    }, error as Error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear la cuenta'
    };
  }
};

// Obtener cuenta por código
export const getChartOfAccountByCode = (accountCode: string): ChartOfAccount | null => {
  if (!db) return null;

  try {
    const result = db.exec(`
SELECT
id, account_code, account_name, account_type, normal_balance,
  parent_account, is_active, created_at, updated_at, created_by, updated_by
      FROM chart_of_accounts 
      WHERE account_code = ?
  `, [accountCode]);

    if (!result[0] || result[0].values.length === 0) return null;

    const columns = result[0].columns;
    const row = result[0].values[0];

    const account: any = {};
    columns.forEach((col: any, index: any) => {
      account[col] = row[index];
    });

    account.is_active = Boolean(account.is_active);

    return account as ChartOfAccount;

  } catch (error) {
    logger.error('ChartOfAccounts', 'get_by_code_failed', `Error al obtener cuenta ${accountCode} `, { accountCode }, error as Error);
    return null;
  }
};

// Actualizar cuenta contable
export const updateChartOfAccount = (accountCode: string, accountData: Partial<ChartOfAccount>, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Obtener cuenta actual para auditoría
    const currentAccount = getChartOfAccountByCode(accountCode);
    if (!currentAccount) {
      return { success: false, message: 'Cuenta no encontrada' };
    }

    logger.info('ChartOfAccounts', 'update_start', `Actualizando cuenta: ${accountCode} `);

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      UPDATE chart_of_accounts 
      SET account_name = ?, account_type = ?, normal_balance = ?,
  parent_account = ?, is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE account_code = ?
  `);

    stmt.run([
      accountData.account_name || currentAccount.account_name,
      accountData.account_type || currentAccount.account_type,
      accountData.normal_balance || currentAccount.normal_balance,
      accountData.parent_account || currentAccount.parent_account || null,
      accountData.is_active !== undefined ? (accountData.is_active ? 1 : 0) : (currentAccount.is_active ? 1 : 0),
      userId || 1,
      accountCode
    ]);

    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se realizaron cambios' };
    }

    // Registrar en auditoría
    logAuditEvent('chart_of_accounts', currentAccount.id || 0, 'UPDATE', currentAccount, accountData, userId);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    logger.info('ChartOfAccounts', 'update_success', `Cuenta ${accountCode} actualizada exitosamente`);
    return { success: true, message: `Cuenta ${accountCode} actualizada correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('ChartOfAccounts', 'update_failed', `Error al actualizar cuenta ${accountCode} `, { accountCode }, error as Error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar la cuenta'
    };
  }
};

// Eliminar cuenta contable (solo si no tiene movimientos)
export const deleteChartOfAccount = (accountCode: string, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar que la cuenta exista
    const account = getChartOfAccountByCode(accountCode);
    if (!account) {
      return { success: false, message: 'Cuenta no encontrada' };
    }

    logger.info('ChartOfAccounts', 'delete_start', `Eliminando cuenta: ${accountCode} `);

    // Verificar que no tenga cuentas hijas
    const childrenCheck = db.exec(`SELECT COUNT(*) as count FROM chart_of_accounts WHERE parent_account = ? `, [accountCode]);
    const childrenCount = childrenCheck[0]?.values[0]?.[0] as number || 0;

    if (childrenCount > 0) {
      return {
        success: false,
        message: `La cuenta tiene ${childrenCount} cuenta(s) hija(s).No se puede eliminar.`
      };
    }

    // Verificar que no tenga movimientos en journal_details
    const movementsCheck = db.exec(`SELECT COUNT(*) as count FROM journal_details WHERE account_code = ? `, [accountCode]);
    const movementsCount = movementsCheck[0]?.values[0]?.[0] as number || 0;

    if (movementsCount > 0) {
      return {
        success: false,
        message: `La cuenta tiene ${movementsCount} movimiento(s) contable(s).No se puede eliminar.`
      };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare('DELETE FROM chart_of_accounts WHERE account_code = ?');
    stmt.run([accountCode]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar la cuenta' };
    }

    // Registrar en auditoría
    logAuditEvent('chart_of_accounts', account.id || 0, 'DELETE', account, null, userId);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    logger.info('ChartOfAccounts', 'delete_success', `Cuenta ${accountCode} eliminada exitosamente`);
    return { success: true, message: `Cuenta ${accountCode} eliminada correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('ChartOfAccounts', 'delete_failed', `Error al eliminar cuenta ${accountCode} `, { accountCode }, error as Error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al eliminar la cuenta'
    };
  }
};

// Insertar plan de cuentas inicial
export const insertInitialChartOfAccounts = async (): Promise<{ success: boolean; message: string }> => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    logger.info('ChartOfAccounts', 'init_start', 'Insertando plan de cuentas inicial');

    // Verificar si ya existen cuentas
    const existingAccounts = db.exec("SELECT COUNT(*) as count FROM chart_of_accounts");
    const accountCount = existingAccounts[0]?.values[0]?.[0] as number || 0;

    if (accountCount > 0) {
      logger.info('ChartOfAccounts', 'init_skip', `Plan de cuentas ya existe: ${accountCount} cuentas`);
      return { success: true, message: 'Plan de cuentas ya existe' };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO chart_of_accounts(
    account_code, account_name, account_type, normal_balance, parent_account,
    is_active, created_by, updated_by
  ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Plan de Cuentas Completo - US GAAP para Florida
    const initialAccounts = [
      // ========== 1000 - ACTIVOS ==========
      { account_code: '1000', account_name: 'ACTIVOS', account_type: 'asset', normal_balance: 'debit', parent_account: null, is_active: true },

      // 1100 - Activos Corrientes
      { account_code: '1100', account_name: 'Activos Corrientes', account_type: 'asset', normal_balance: 'debit', parent_account: '1000', is_active: true },
      { account_code: '1110', account_name: 'Efectivo y Equivalentes', account_type: 'asset', normal_balance: 'debit', parent_account: '1100', is_active: true },
      { account_code: '1111', account_name: 'Caja Chica', account_type: 'asset', normal_balance: 'debit', parent_account: '1110', is_active: true },
      { account_code: '1112', account_name: 'Cuenta Corriente - Bank of America', account_type: 'asset', normal_balance: 'debit', parent_account: '1110', is_active: true },
      { account_code: '1113', account_name: 'Cuenta de Ahorros', account_type: 'asset', normal_balance: 'debit', parent_account: '1110', is_active: true },
      { account_code: '1114', account_name: 'Cuenta Payroll', account_type: 'asset', normal_balance: 'debit', parent_account: '1110', is_active: true },

      { account_code: '1120', account_name: 'Cuentas por Cobrar', account_type: 'asset', normal_balance: 'debit', parent_account: '1100', is_active: true },
      { account_code: '1121', account_name: 'Cuentas por Cobrar - Clientes', account_type: 'asset', normal_balance: 'debit', parent_account: '1120', is_active: true },
      { account_code: '1122', account_name: 'Provisi�n para Cuentas Incobrables', account_type: 'asset', normal_balance: 'credit', parent_account: '1120', is_active: true },
      { account_code: '1123', account_name: 'Otras Cuentas por Cobrar', account_type: 'asset', normal_balance: 'debit', parent_account: '1120', is_active: true },

      { account_code: '1130', account_name: 'Inventario', account_type: 'asset', normal_balance: 'debit', parent_account: '1100', is_active: true },
      { account_code: '1131', account_name: 'Inventario - Productos Terminados', account_type: 'asset', normal_balance: 'debit', parent_account: '1130', is_active: true },
      { account_code: '1132', account_name: 'Inventario - Materias Primas', account_type: 'asset', normal_balance: 'debit', parent_account: '1130', is_active: true },
      { account_code: '1133', account_name: 'Inventario - Productos en Proceso', account_type: 'asset', normal_balance: 'debit', parent_account: '1130', is_active: true },

      { account_code: '1140', account_name: 'Gastos Pagados por Anticipado', account_type: 'asset', normal_balance: 'debit', parent_account: '1100', is_active: true },
      { account_code: '1141', account_name: 'Seguros Pagados por Anticipado', account_type: 'asset', normal_balance: 'debit', parent_account: '1140', is_active: true },
      { account_code: '1142', account_name: 'Alquileres Pagados por Anticipado', account_type: 'asset', normal_balance: 'debit', parent_account: '1140', is_active: true },

      // 1200 - Activos No Corrientes
      { account_code: '1200', account_name: 'Activos No Corrientes', account_type: 'asset', normal_balance: 'debit', parent_account: '1000', is_active: true },
      { account_code: '1210', account_name: 'Propiedad, Planta y Equipo', account_type: 'asset', normal_balance: 'debit', parent_account: '1200', is_active: true },
      { account_code: '1211', account_name: 'Terrenos', account_type: 'asset', normal_balance: 'debit', parent_account: '1210', is_active: true },
      { account_code: '1212', account_name: 'Edificios', account_type: 'asset', normal_balance: 'debit', parent_account: '1210', is_active: true },
      { account_code: '1213', account_name: 'Depreciaci�n Acumulada - Edificios', account_type: 'asset', normal_balance: 'credit', parent_account: '1210', is_active: true },
      { account_code: '1214', account_name: 'Maquinaria y Equipo', account_type: 'asset', normal_balance: 'debit', parent_account: '1210', is_active: true },
      { account_code: '1215', account_name: 'Depreciaci�n Acumulada - Maquinaria', account_type: 'asset', normal_balance: 'credit', parent_account: '1210', is_active: true },
      { account_code: '1216', account_name: 'Veh�culos', account_type: 'asset', normal_balance: 'debit', parent_account: '1210', is_active: true },
      { account_code: '1217', account_name: 'Depreciaci�n Acumulada - Veh�culos', account_type: 'asset', normal_balance: 'credit', parent_account: '1210', is_active: true },
      { account_code: '1218', account_name: 'Mobiliario y Equipo de Oficina', account_type: 'asset', normal_balance: 'debit', parent_account: '1210', is_active: true },
      { account_code: '1219', account_name: 'Depreciaci�n Acumulada - Mobiliario', account_type: 'asset', normal_balance: 'credit', parent_account: '1210', is_active: true },

      { account_code: '1220', account_name: 'Activos Intangibles', account_type: 'asset', normal_balance: 'debit', parent_account: '1200', is_active: true },
      { account_code: '1221', account_name: 'Goodwill', account_type: 'asset', normal_balance: 'debit', parent_account: '1220', is_active: true },
      { account_code: '1222', account_name: 'Patentes y Marcas', account_type: 'asset', normal_balance: 'debit', parent_account: '1220', is_active: true },
      { account_code: '1223', account_name: 'Software', account_type: 'asset', normal_balance: 'debit', parent_account: '1220', is_active: true },
      { account_code: '1224', account_name: 'Amortizaci�n Acumulada - Intangibles', account_type: 'asset', normal_balance: 'credit', parent_account: '1220', is_active: true },

      // ========== 2000 - PASIVOS ==========
      { account_code: '2000', account_name: 'PASIVOS', account_type: 'liability', normal_balance: 'credit', parent_account: null, is_active: true },

      // 2100 - Pasivos Corrientes
      { account_code: '2100', account_name: 'Pasivos Corrientes', account_type: 'liability', normal_balance: 'credit', parent_account: '2000', is_active: true },
      { account_code: '2110', account_name: 'Cuentas por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2100', is_active: true },
      { account_code: '2111', account_name: 'Cuentas por Pagar - Proveedores', account_type: 'liability', normal_balance: 'credit', parent_account: '2110', is_active: true },
      { account_code: '2112', account_name: 'Otras Cuentas por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2110', is_active: true },

      { account_code: '2120', account_name: 'Impuestos por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2100', is_active: true },
      { account_code: '2121', account_name: 'Impuesto sobre Ventas por Pagar (Sales Tax)', account_type: 'liability', normal_balance: 'credit', parent_account: '2120', is_active: true },
      { account_code: '2122', account_name: 'Impuesto Federal por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2120', is_active: true },
      { account_code: '2123', account_name: 'Impuesto Estatal FL por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2120', is_active: true },
      { account_code: '2124', account_name: 'Payroll Taxes por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2120', is_active: true },

      { account_code: '2130', account_name: 'N�mina por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2100', is_active: true },
      { account_code: '2131', account_name: 'Sueldos y Salarios por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2130', is_active: true },
      { account_code: '2132', account_name: 'Retenciones por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2130', is_active: true },

      { account_code: '2140', account_name: 'Pr�stamos a Corto Plazo', account_type: 'liability', normal_balance: 'credit', parent_account: '2100', is_active: true },
      { account_code: '2141', account_name: 'L�nea de Cr�dito', account_type: 'liability', normal_balance: 'credit', parent_account: '2140', is_active: true },
      { account_code: '2142', account_name: 'Porci�n Corriente de Deuda a Largo Plazo', account_type: 'liability', normal_balance: 'credit', parent_account: '2140', is_active: true },

      // 2200 - Pasivos No Corrientes
      { account_code: '2200', account_name: 'Pasivos No Corrientes', account_type: 'liability', normal_balance: 'credit', parent_account: '2000', is_active: true },
      { account_code: '2210', account_name: 'Pr�stamos a Largo Plazo', account_type: 'liability', normal_balance: 'credit', parent_account: '2200', is_active: true },
      { account_code: '2211', account_name: 'Hipotecas por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2210', is_active: true },
      { account_code: '2212', account_name: 'Pr�stamos Bancarios a Largo Plazo', account_type: 'liability', normal_balance: 'credit', parent_account: '2210', is_active: true },

      // ========== 3000 - PATRIMONIO ==========
      { account_code: '3000', account_name: 'PATRIMONIO', account_type: 'equity', normal_balance: 'credit', parent_account: null, is_active: true },
      { account_code: '3100', account_name: 'Capital Social', account_type: 'equity', normal_balance: 'credit', parent_account: '3000', is_active: true },
      { account_code: '3110', account_name: 'Common Stock', account_type: 'equity', normal_balance: 'credit', parent_account: '3100', is_active: true },
      { account_code: '3120', account_name: 'Preferred Stock', account_type: 'equity', normal_balance: 'credit', parent_account: '3100', is_active: true },
      { account_code: '3200', account_name: 'Utilidades Retenidas', account_type: 'equity', normal_balance: 'credit', parent_account: '3000', is_active: true },
      { account_code: '3210', account_name: 'Utilidades del Ejercicio Actual', account_type: 'equity', normal_balance: 'credit', parent_account: '3200', is_active: true },
      { account_code: '3220', account_name: 'Utilidades de Ejercicios Anteriores', account_type: 'equity', normal_balance: 'credit', parent_account: '3200', is_active: true },
      { account_code: '3300', account_name: 'Dividendos', account_type: 'equity', normal_balance: 'debit', parent_account: '3000', is_active: true },
      { account_code: '3400', account_name: 'Owner\'s Draw', account_type: 'equity', normal_balance: 'debit', parent_account: '3000', is_active: true },

      // ========== 4000 - INGRESOS ==========
      { account_code: '4000', account_name: 'INGRESOS', account_type: 'revenue', normal_balance: 'credit', parent_account: null, is_active: true },
      { account_code: '4100', account_name: 'Ingresos Operacionales', account_type: 'revenue', normal_balance: 'credit', parent_account: '4000', is_active: true },
      { account_code: '4110', account_name: 'Ventas de Productos', account_type: 'revenue', normal_balance: 'credit', parent_account: '4100', is_active: true },
      { account_code: '4120', account_name: 'Ventas de Servicios', account_type: 'revenue', normal_balance: 'credit', parent_account: '4100', is_active: true },
      { account_code: '4130', account_name: 'Devoluciones y Descuentos sobre Ventas', account_type: 'revenue', normal_balance: 'debit', parent_account: '4100', is_active: true },
      { account_code: '4200', account_name: 'Otros Ingresos', account_type: 'revenue', normal_balance: 'credit', parent_account: '4000', is_active: true },
      { account_code: '4210', account_name: 'Ingresos por Intereses', account_type: 'revenue', normal_balance: 'credit', parent_account: '4200', is_active: true },
      { account_code: '4220', account_name: 'Ganancia en Venta de Activos', account_type: 'revenue', normal_balance: 'credit', parent_account: '4200', is_active: true },
      { account_code: '4230', account_name: 'Ingresos Diversos', account_type: 'revenue', normal_balance: 'credit', parent_account: '4200', is_active: true },

      // ========== 5000 - COSTO DE VENTAS ==========
      { account_code: '5000', account_name: 'COSTO DE VENTAS', account_type: 'expense', normal_balance: 'debit', parent_account: null, is_active: true },
      { account_code: '5100', account_name: 'Costo de Productos Vendidos', account_type: 'expense', normal_balance: 'debit', parent_account: '5000', is_active: true },
      { account_code: '5110', account_name: 'Compras de Mercanc�a', account_type: 'expense', normal_balance: 'debit', parent_account: '5100', is_active: true },
      { account_code: '5120', account_name: 'Fletes y Acarreos', account_type: 'expense', normal_balance: 'debit', parent_account: '5100', is_active: true },
      { account_code: '5200', account_name: 'Costo de Servicios', account_type: 'expense', normal_balance: 'debit', parent_account: '5000', is_active: true },
      { account_code: '5210', account_name: 'Mano de Obra Directa', account_type: 'expense', normal_balance: 'debit', parent_account: '5200', is_active: true },
      { account_code: '5220', account_name: 'Materiales Directos', account_type: 'expense', normal_balance: 'debit', parent_account: '5200', is_active: true },

      // ========== 6000 - GASTOS OPERACIONALES ==========
      { account_code: '6000', account_name: 'GASTOS OPERACIONALES', account_type: 'expense', normal_balance: 'debit', parent_account: null, is_active: true },

      // 6100 - Gastos de Ventas
      { account_code: '6100', account_name: 'Gastos de Ventas', account_type: 'expense', normal_balance: 'debit', parent_account: '6000', is_active: true },
      { account_code: '6110', account_name: 'Sueldos - Personal de Ventas', account_type: 'expense', normal_balance: 'debit', parent_account: '6100', is_active: true },
      { account_code: '6120', account_name: 'Comisiones de Ventas', account_type: 'expense', normal_balance: 'debit', parent_account: '6100', is_active: true },
      { account_code: '6130', account_name: 'Publicidad y Marketing', account_type: 'expense', normal_balance: 'debit', parent_account: '6100', is_active: true },
      { account_code: '6140', account_name: 'Gastos de Viaje - Ventas', account_type: 'expense', normal_balance: 'debit', parent_account: '6100', is_active: true },

      // 6200 - Gastos Administrativos
      { account_code: '6200', account_name: 'Gastos Administrativos', account_type: 'expense', normal_balance: 'debit', parent_account: '6000', is_active: true },
      { account_code: '6210', account_name: 'Sueldos - Personal Administrativo', account_type: 'expense', normal_balance: 'debit', parent_account: '6200', is_active: true },
      { account_code: '6220', account_name: 'Alquiler de Oficina', account_type: 'expense', normal_balance: 'debit', parent_account: '6200', is_active: true },
      { account_code: '6230', account_name: 'Servicios P�blicos', account_type: 'expense', normal_balance: 'debit', parent_account: '6200', is_active: true },
      { account_code: '6240', account_name: 'Tel�fono e Internet', account_type: 'expense', normal_balance: 'debit', parent_account: '6200', is_active: true },
      { account_code: '6250', account_name: 'Suministros de Oficina', account_type: 'expense', normal_balance: 'debit', parent_account: '6200', is_active: true },
      { account_code: '6260', account_name: 'Seguros', account_type: 'expense', normal_balance: 'debit', parent_account: '6200', is_active: true },
      { account_code: '6270', account_name: 'Honorarios Profesionales', account_type: 'expense', normal_balance: 'debit', parent_account: '6200', is_active: true },
      { account_code: '6280', account_name: 'Depreciaci�n y Amortizaci�n', account_type: 'expense', normal_balance: 'debit', parent_account: '6200', is_active: true },
      { account_code: '6290', account_name: 'Gastos de Mantenimiento', account_type: 'expense', normal_balance: 'debit', parent_account: '6200', is_active: true },

      // 6300 - Gastos Financieros
      { account_code: '6300', account_name: 'Gastos Financieros', account_type: 'expense', normal_balance: 'debit', parent_account: '6000', is_active: true },
      { account_code: '6310', account_name: 'Intereses sobre Pr�stamos', account_type: 'expense', normal_balance: 'debit', parent_account: '6300', is_active: true },
      { account_code: '6320', account_name: 'Comisiones Bancarias', account_type: 'expense', normal_balance: 'debit', parent_account: '6300', is_active: true },
      { account_code: '6330', account_name: 'P�rdida en Venta de Activos', account_type: 'expense', normal_balance: 'debit', parent_account: '6300', is_active: true },

      // 6400 - Impuestos
      { account_code: '6400', account_name: 'Impuestos', account_type: 'expense', normal_balance: 'debit', parent_account: '6000', is_active: true },
      { account_code: '6410', account_name: 'Impuesto sobre la Renta', account_type: 'expense', normal_balance: 'debit', parent_account: '6400', is_active: true },
      { account_code: '6420', account_name: 'Impuestos Locales y Estatales', account_type: 'expense', normal_balance: 'debit', parent_account: '6400', is_active: true },
      { account_code: '6430', account_name: 'Property Tax', account_type: 'expense', normal_balance: 'debit', parent_account: '6400', is_active: true }
    ];

    initialAccounts.forEach(account => {
      stmt.run([
        account.account_code,
        account.account_name,
        account.account_type,
        account.normal_balance,
        account.parent_account,
        account.is_active ? 1 : 0,
        1, // created_by
        1  // updated_by
      ]);
    });

    stmt.free();

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    logger.info('ChartOfAccounts', 'init_success', `Plan de cuentas inicial insertado: ${initialAccounts.length} cuentas`);
    return {
      success: true,
      message: `Plan de cuentas inicial creado con ${initialAccounts.length} cuentas`
    };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('ChartOfAccounts', 'init_failed', 'Error al insertar plan de cuentas inicial', null, error as Error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear plan de cuentas inicial'
    };
  }
};

// Función auxiliar para auditoría (alias para compatibilidad)
const logAuditAction = logAuditEvent;

// Función para verificar integridad de la cadena de auditoría
export const verifyAuditIntegrity = async (): Promise<{ isValid: boolean; errors: string[]; totalRecords: number }> => {
  if (!db) {
    return { isValid: false, errors: ['Database not initialized'], totalRecords: 0 };
  }

  try {
    logger.info('AuditSystem', 'verify_integrity_start', 'Iniciando verificación de integridad de auditoría');

    const result = db.exec(`
      SELECT id, table_name, record_id, action, old_values, new_values,
  user_id, timestamp, audit_hash
      FROM audit_log 
      ORDER BY id ASC
    `);

    if (!result[0] || result[0].values.length === 0) {
      return { isValid: true, errors: [], totalRecords: 0 };
    }

    const records = result[0].values;
    const errors: string[] = [];
    let previousHash = '0';

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const [id, tableName, recordId, action, oldValues, newValues, userId, timestamp, storedHash] = record;

      // Recrear el hash esperado
      const auditData = {
        tableName,
        recordId,
        action,
        oldValues,
        newValues,
        timestamp,
        userId
      };

      const expectedHash = await generateAuditHash({
        ...auditData,
        previousHash
      });

      if (expectedHash !== storedHash) {
        errors.push(`Record ID ${id}: Hash mismatch.Expected: ${expectedHash.substring(0, 8)}..., Found: ${storedHash?.toString().substring(0, 8)}...`);
      }

      previousHash = storedHash as string;
    }

    const isValid = errors.length === 0;

    logger.info('AuditSystem', 'verify_integrity_complete', 'Verificación de integridad completada', {
      totalRecords: records.length,
      isValid,
      errorsFound: errors.length
    });

    return {
      isValid,
      errors,
      totalRecords: records.length
    };

  } catch (error) {
    logger.error('AuditSystem', 'verify_integrity_failed', 'Error al verificar integridad de auditoría', null, error as Error);
    return {
      isValid: false,
      errors: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'} `],
      totalRecords: 0
    };
  }
};

// Función para obtener estadísticas de auditoría
export const getAuditStats = (): { totalRecords: number; byTable: Record<string, number>; byAction: Record<string, number>; lastRecord: string } => {
  if (!db) {
    return { totalRecords: 0, byTable: {}, byAction: {}, lastRecord: 'N/A' };
  }

  try {
    // Total de registros
    const totalResult = db.exec('SELECT COUNT(*) as count FROM audit_log');
    const totalRecords = totalResult[0]?.values[0]?.[0] as number || 0;

    // Por tabla
    const tableResult = db.exec(`
      SELECT table_name, COUNT(*) as count 
      FROM audit_log 
      GROUP BY table_name 
      ORDER BY count DESC
  `);

    const byTable: Record<string, number> = {};
    if (tableResult[0]) {
      tableResult[0].values.forEach((row: any) => {
        byTable[row[0] as string] = row[1] as number;
      });
    }

    // Por acción
    const actionResult = db.exec(`
      SELECT action, COUNT(*) as count 
      FROM audit_log 
      GROUP BY action 
      ORDER BY count DESC
  `);

    const byAction: Record<string, number> = {};
    if (actionResult[0]) {
      actionResult[0].values.forEach((row: any) => {
        byAction[row[0] as string] = row[1] as number;
      });
    }

    // Último registro
    const lastResult = db.exec(`
      SELECT timestamp FROM audit_log 
      ORDER BY id DESC 
      LIMIT 1
  `);
    const lastRecord = lastResult[0]?.values[0]?.[0] as string || 'N/A';

    return {
      totalRecords,
      byTable,
      byAction,
      lastRecord
    };

  } catch (error) {
    logger.error('AuditSystem', 'get_stats_failed', 'Error al obtener estadísticas de auditoría', null, error as Error);
    return { totalRecords: 0, byTable: {}, byAction: {}, lastRecord: 'N/A' };
  }
};

// ==========================================
// FUNCIONES CRUD PARA PLAN DE CUENTAS
// ==========================================

// Obtener todas las cuentas del plan de cuentas
export const getChartOfAccounts = (): ChartOfAccount[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
SELECT
account_code, account_name, account_type, normal_balance, parent_account,
  is_active, created_at, updated_at, created_by, updated_by
      FROM chart_of_accounts 
      WHERE is_active = 1
      ORDER BY account_code
  `);

    if (!result[0]) return [];

    const accounts: ChartOfAccount[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const account: any = {};
      columns.forEach((col: any, index: any) => {
        account[col] = row[index];
      });

      // Calcular balance actual
      account.balance = getAccountBalance(account.account_code);

      accounts.push(account as ChartOfAccount);
    });

    return accounts;
  } catch (error) {
    console.error('Error getting chart of accounts:', error);
    return [];
  }
};

// Obtener balance de una cuenta específica
export const getAccountBalance = (accountCode: string): number => {
  if (!db) return 0;

  try {
    const result = db.exec(`
SELECT
coa.normal_balance,
  COALESCE(SUM(jd.debit_amount), 0) as total_debits,
  COALESCE(SUM(jd.credit_amount), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_details jd ON coa.account_code = jd.account_code
      WHERE coa.account_code = ?
  GROUP BY coa.account_code, coa.normal_balance
    `, [accountCode]);

    if (!result[0] || result[0].values.length === 0) return 0;

    const [normalBalance, totalDebits, totalCredits] = result[0].values[0];
    const debits = Number(totalDebits) || 0;
    const credits = Number(totalCredits) || 0;

    // Calcular balance según el tipo normal de la cuenta
    if (normalBalance === 'debit') {
      return debits - credits;
    } else {
      return credits - debits;
    }
  } catch (error) {
    console.error('Error getting account balance:', error);
    return 0;
  }
};



// Función de diagnóstico para verificar el estado del sistema contable
export const diagnoseAccountingSystem = async (): Promise<{ success: boolean; message: string; details: any }> => {
  if (!db) {
    return {
      success: false,
      message: 'Database not initialized',
      details: { error: 'Database connection not available' }
    };
  }

  try {
    logger.info('AccountingDiagnosis', 'start_diagnosis', 'Iniciando diagnóstico del sistema contable');

    // Verificar que las tablas de contabilidad existan
    const tablesResult = db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type = 'table' AND name IN('chart_of_accounts', 'journal_entries', 'journal_details')
      ORDER BY name
    `);

    const existingTables = tablesResult[0]?.values.map((row: any) => row[0]) || [];
    logger.info('AccountingDiagnosis', 'tables_check', `Tablas encontradas: ${existingTables.join(', ')} `);

    // Verificar que el plan de cuentas tenga datos
    const accountsResult = db.exec('SELECT COUNT(*) as count FROM chart_of_accounts');
    const accountCount = accountsResult[0]?.values[0]?.[0] as number || 0;
    logger.info('AccountingDiagnosis', 'accounts_count', `Cuentas en el plan: ${accountCount} `);

    // Verificar estructura de algunas cuentas principales
    const mainAccountsResult = db.exec(`
      SELECT account_code, account_name, account_type 
      FROM chart_of_accounts 
      WHERE account_code IN('1000', '2000', '3000', '4000', '5000')
      ORDER BY account_code
    `);

    const mainAccounts = mainAccountsResult[0]?.values || [];
    logger.info('AccountingDiagnosis', 'main_accounts', `Cuentas principales: ${mainAccounts.length} `);

    // Verificar integridad de asientos contables
    const journalResult = db.exec('SELECT COUNT(*) as count FROM journal_entries');
    const journalCount = journalResult[0]?.values[0]?.[0] as number || 0;
    logger.info('AccountingDiagnosis', 'journal_entries', `Asientos contables: ${journalCount} `);

    const diagnosis = {
      tablesExist: existingTables.length === 3,
      accountsCount: accountCount,
      journalCount,
      mainAccounts: mainAccounts.length,
      existingTables,
      mainAccountsData: mainAccounts
    };

    if (existingTables.length < 3) {
      logger.error('AccountingDiagnosis', 'missing_tables', 'Faltan tablas de contabilidad', {
        expected: ['chart_of_accounts', 'journal_entries', 'journal_details'],
        found: existingTables
      });
      return {
        success: false,
        message: 'Faltan tablas de contabilidad',
        details: diagnosis
      };
    }

    if (accountCount === 0) {
      logger.warn('AccountingDiagnosis', 'empty_chart', 'Plan de cuentas vacío, insertando datos iniciales');
      // Intentar insertar plan de cuentas inicial
      try {
        const insertResult = await insertInitialChartOfAccounts();
        if (!insertResult.success) {
          logger.error('AccountingDiagnosis', 'insert_failed', 'Error al insertar plan de cuentas inicial', { error: insertResult.message });
          return {
            success: false,
            message: 'Error al inicializar plan de cuentas',
            details: { ...diagnosis, insertError: insertResult.message }
          };
        }
      } catch (insertError) {
        logger.error('AccountingDiagnosis', 'insert_error', 'Excepción al insertar plan de cuentas', null, insertError as Error);
      }
    }

    logger.info('AccountingDiagnosis', 'diagnosis_complete', 'Diagnóstico completado exitosamente', diagnosis);
    return {
      success: true,
      message: 'Sistema contable funcionando correctamente',
      details: diagnosis
    };

  } catch (error) {
    logger.critical('AccountingDiagnosis', 'diagnosis_failed', 'Error crítico en diagnóstico', null, error as Error);
    return {
      success: false,
      message: `Error en diagnóstico: ${error instanceof Error ? error.message : 'Unknown error'} `,
      details: { error: error instanceof Error ? error.stack : 'Unknown error' }
    };
  }
};



// Crear asiento contable automático
export const createJournalEntry = (
  entryData: Partial<JournalEntry>,
  details: Partial<JournalDetail>[],
  userId?: number
): { success: boolean; message: string; entryId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validar bloqueo de periodos
    const entryDate = entryData.entry_date || new Date().toISOString().split('T')[0];
    if (isDateLocked(entryDate)) {
      return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado.' };
    }

    // Validaciones críticas para integridad contable
    if (!details || details.length < 2) {
      return { success: false, message: 'Un asiento contable debe tener al menos 2 líneas' };
    }

    // Calcular totales
    let totalDebits = 0;
    let totalCredits = 0;

    details.forEach(detail => {
      totalDebits += Number(detail.debit_amount) || 0;
      totalCredits += Number(detail.credit_amount) || 0;
    });

    // VALIDACIÓN CRÍTICA: El asiento debe estar balanceado
    // VALIDACIÓN CRÍTICA: El asiento debe estar balanceado (Forensic Level)
    const diff = Math.abs(totalDebits - totalCredits);
    if (diff > 0.01) {
      // Lanzar error duro para prevenir persistencia
      const msg = `VIOLACIÓN DE PARTIDA DOBLE: Asiento desbalanceado por $${diff.toFixed(2)}.Débitos: $${totalDebits.toFixed(2)}, Créditos: $${totalCredits.toFixed(2)} `;
      console.error(msg);
      throw new Error(msg); // Stop execution immediately
    }

    db.run('BEGIN TRANSACTION');

    // Insertar asiento principal
    const stmt = db.prepare(`
      INSERT INTO journal_entries(
      entry_date, reference, description, total_debit, total_credit, created_by, updated_by
    ) VALUES(?, ?, ?, ?, ?, ?, ?)
      `);

    stmt.run([
      entryDate,
      entryData.reference_number || entryData.reference || null,
      entryData.description || null,
      totalDebits,
      totalCredits,
      userId || 1,
      userId || 1
    ]);

    const entryId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();

    // Insertar detalles del asiento
    const detailStmt = db.prepare(`
      INSERT INTO journal_details(
        journal_entry_id, account_code, debit_amount, credit_amount, description
      ) VALUES(?, ?, ?, ?, ?)
    `);

    details.forEach(detail => {
      // Validar que la cuenta exista
      if (!db) throw new Error('Database not initialized');

      const accountExists = db.exec(`SELECT account_code FROM chart_of_accounts WHERE account_code = ? `, [detail.account_code || '']);
      if (!accountExists[0] || accountExists[0].values.length === 0) {
        throw new Error(`La cuenta ${detail.account_code || 'undefined'} no existe en el plan de cuentas`);
      }

      detailStmt.run([
        entryId,
        detail.account_code || '',
        Number(detail.debit_amount) || 0,
        Number(detail.credit_amount) || 0,
        detail.description || ''
      ]);
    });

    detailStmt.free();

    // Registrar en auditoría
    logAuditEvent('journal_entries', entryId, 'INSERT', null, {
      entry_date: entryDate,
      reference_number: entryData.reference_number,
      total_debit: totalDebits,
      total_credit: totalCredits,
      details_count: details.length
    }, userId);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    return {
      success: true,
      message: `Asiento contable creado correctamente(ID: ${entryId})`,
      entryId
    };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error creating journal entry:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear el asiento contable'
    };
  }
};

// Obtener asientos contables con detalles y aislamiento
export const getJournalEntries = (limit: number = 50, filters?: { userId?: number, role?: string }): JournalEntry[] => {
  if (!db) return [];

  try {
    let query = `
SELECT
id, entry_date, reference, description, total_debit, total_credit,
  is_balanced, created_at, created_by, verified_by, verified_at
      FROM journal_entries 
    `;

    const params: any[] = [];

    if (filters?.userId && filters?.role && !PRIVILEGED_ROLES.includes(filters.role)) {
      query += ` WHERE created_by = ? `;
      params.push(filters.userId);
    }

    query += ` ORDER BY entry_date DESC, id DESC LIMIT ? `;
    params.push(limit);

    const result = db.exec(query, params);

    if (!result[0]) return [];

    const entries: JournalEntry[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const entry: any = {};
      columns.forEach((col: any, index: any) => {
        entry[col] = row[index];
      });

      // Obtener detalles del asiento
      entry.details = getJournalEntryDetails(entry.id);

      entries.push(entry as JournalEntry);
    });

    return entries;
  } catch (error) {
    console.error('Error getting journal entries:', error);
    return [];
  }
};

// Obtener detalles de un asiento específico
export const getJournalEntryDetails = (entryId: number): JournalDetail[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT
jd.id, jd.journal_entry_id, jd.account_code, jd.debit_amount,
  jd.credit_amount, jd.description,
  coa.account_name, coa.account_type, coa.normal_balance
      FROM journal_details jd
      JOIN chart_of_accounts coa ON jd.account_code = coa.account_code
      WHERE jd.journal_entry_id = ?
  ORDER BY jd.id
    `, [entryId]);

    if (!result[0]) return [];

    const details: JournalDetail[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const detail: any = {};
      columns.forEach((col: any, index: any) => {
        detail[col] = row[index];
      });

      // Agregar información de la cuenta
      detail.account = {
        account_code: detail.account_code,
        account_name: detail.account_name,
        account_type: detail.account_type,
        normal_balance: detail.normal_balance
      };

      details.push(detail as JournalDetail);
    });

    return details;
  } catch (error) {
    console.error('Error getting journal entry details:', error);
    return [];
  }
};

// ==========================================
// FUNCIONES PARA GENERAR ASIENTOS AUTOMÁTICOS
// ==========================================

// Generar asiento automático para factura de venta
export const generateSalesJournalEntry = (invoice: Invoice, userId?: number): { success: boolean; message: string; entryId?: number } => {
  if (!invoice.customer) {
    return { success: false, message: 'Información del cliente requerida' };
  }

  const details: Partial<JournalDetail>[] = [
    // Débito: Cuentas por Cobrar
    {
      account_code: '1121',
      debit_amount: invoice.total_amount,
      credit_amount: 0,
      description: `Factura ${invoice.invoice_number} - ${invoice.customer.name} `
    },
    // Crédito: Ventas
    {
      account_code: '4110',
      debit_amount: 0,
      credit_amount: invoice.subtotal,
      description: `Venta - Factura ${invoice.invoice_number} `
    }
  ];

  // Si hay impuestos, agregar línea de impuestos por pagar
  if (invoice.tax_amount > 0) {
    details.push({
      account_code: '2121',
      debit_amount: 0,
      credit_amount: invoice.tax_amount,
      description: `Impuesto Florida - Factura ${invoice.invoice_number} `
    });
  }

  return createJournalEntry({
    entry_date: invoice.issue_date,
    reference_number: `INV - ${invoice.invoice_number} `,
    description: `Venta a ${invoice.customer.name} - Factura ${invoice.invoice_number} `
  }, details, userId);
};

// Generar asiento automático para factura de compra
export const generatePurchaseJournalEntry = (bill: Bill, userId?: number): { success: boolean; message: string; entryId?: number } => {
  if (!bill.supplier) {
    return { success: false, message: 'Información del proveedor requerida' };
  }

  const details: Partial<JournalDetail>[] = [
    // Débito: Gastos o Inventario (simplificado como gastos operativos)
    {
      account_code: '5200',
      debit_amount: bill.subtotal,
      credit_amount: 0,
      description: `Compra - Factura ${bill.bill_number} `
    },
    // Crédito: Cuentas por Pagar
    {
      account_code: '2111',
      debit_amount: 0,
      credit_amount: bill.total_amount,
      description: `Factura ${bill.bill_number} - ${bill.supplier.name} `
    }
  ];

  // Si hay impuestos, agregar línea de impuestos
  if (bill.tax_amount > 0) {
    details.push({
      account_code: '5510',
      debit_amount: bill.tax_amount,
      credit_amount: 0,
      description: `Impuesto Florida - Factura ${bill.bill_number} `
    });
  }

  return createJournalEntry({
    entry_date: bill.issue_date,
    reference_number: `BILL - ${bill.bill_number} `,
    description: `Compra a ${bill.supplier.name} - Factura ${bill.bill_number} `
  }, details, userId);
};

// Generar asiento automático para pago recibido
export const generatePaymentReceivedJournalEntry = (payment: Payment, customer: Customer, userId?: number): { success: boolean; message: string; entryId?: number } => {
  const details: Partial<JournalDetail>[] = [
    // Débito: Efectivo/Banco
    {
      account_code: payment.payment_method === 'cash' ? '1111' : '1112',
      debit_amount: payment.amount,
      credit_amount: 0,
      description: `Pago recibido ${payment.payment_number} - ${customer.name} `
    },
    // Crédito: Cuentas por Cobrar
    {
      account_code: '1121',
      debit_amount: 0,
      credit_amount: payment.amount,
      description: `Pago ${payment.payment_number} - ${customer.name} `
    }
  ];

  return createJournalEntry({
    entry_date: payment.payment_date,
    reference_number: `PAY - ${payment.payment_number} `,
    description: `Pago recibido de ${customer.name} - ${payment.payment_number} `
  }, details, userId);
};

// ==========================================
// FUNCIONES PARA GESTIÓN DE PAGOS (CLIENTES Y PROVEEDORES)
// ==========================================

export const generatePaymentNumber = (): string => {
  if (!db) return '';
  try {
    const result = db.exec("SELECT COUNT(*) as count FROM payments");
    const count = (result[0]?.values[0]?.[0] as number || 0) + 1;
    return `PAY - C - ${new Date().getFullYear()} -${count.toString().padStart(4, '0')} `;
  } catch (error) {
    return `PAY - C - ${Date.now()} `;
  }
};

export const generateSupplierPaymentNumber = (): string => {
  if (!db) return '';
  try {
    const result = db.exec("SELECT COUNT(*) as count FROM supplier_payments");
    const count = (result[0]?.values[0]?.[0] as number || 0) + 1;
    return `PAY - S - ${new Date().getFullYear()} -${count.toString().padStart(4, '0')} `;
  } catch (error) {
    return `PAY - S - ${Date.now()} `;
  }
};

/**
 * Crea un pago de cliente (Customer Payment)
 */
export const createPayment = (paymentData: Partial<Payment>, userId?: number): { success: boolean; message: string; paymentId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  let transactionStarted = false;
  try {
    db.run('BEGIN TRANSACTION');
    transactionStarted = true;

    // 1. Validaciones básicas
    if (!paymentData.customer_id || !paymentData.amount) {
      throw new Error('Faltan datos requeridos (Cliente o Monto)');
    }

    // 2. Validar bloqueo de periodos
    const paymentDateStr = paymentData.payment_date || new Date().toISOString().split('T')[0];
    if (isDateLocked(paymentDateStr)) {
      throw new Error('ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado.');
    }

    // 2. Generar número si no existe
    const paymentNumber = paymentData.payment_number || generatePaymentNumber();

    // 3. Insertar pago
    db.run(`
      INSERT INTO payments(
    customer_id, invoice_id, payment_number, payment_date, amount,
    payment_method, reference_number, notes, created_by
  ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paymentData.customer_id,
      paymentData.invoice_id || null,
      paymentNumber,
      paymentData.payment_date || new Date().toISOString().split('T')[0],
      paymentData.amount,
      paymentData.payment_method || 'cash',
      paymentData.reference_number || null,
      paymentData.notes || null,
      userId || 1
    ]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const paymentId = result[0]?.values[0]?.[0] as number;

    // 4. Actualizar estado de factura (si aplica)
    if (paymentData.invoice_id) {
      // Obtener total de la factura
      const invoiceResult = db.exec(`SELECT total_amount FROM invoices WHERE id = ${paymentData.invoice_id} `);
      if (invoiceResult.length > 0 && invoiceResult[0].values.length > 0) {
        const totalAmount = invoiceResult[0].values[0][0] as number;

        // Obtener pagos previos de esta factura (incluyendo este)
        const paymentsResult = db.exec(`SELECT SUM(amount) FROM payments WHERE invoice_id = ${paymentData.invoice_id} `);
        const totalPaid = paymentsResult[0]?.values[0]?.[0] as number || 0;

        let newStatus = 'partial';
        // Tolerancia pequeña para errores de punto flotante
        if (Math.abs(totalPaid - totalAmount) < 0.01 || totalPaid > totalAmount) {
          newStatus = 'paid';
        }

        db.run(`UPDATE invoices SET status = ? WHERE id = ? `, [newStatus, paymentData.invoice_id]);
      }
    }

    db.run('COMMIT');
    transactionStarted = false;

    // 5. Auditoría (después del COMMIT para evitar problemas de transacción)
    const auditData = { ...paymentData, id: paymentId, payment_number: paymentNumber };
    logAuditEvent('payments', paymentId, 'INSERT', null, auditData, userId);

    // 6. Generar Asiento Contable (después del COMMIT para evitar transacciones anidadas)
    const fullPayment: Payment = {
      id: paymentId,
      customer_id: paymentData.customer_id,
      invoice_id: paymentData.invoice_id,
      payment_number: paymentNumber,
      payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
      amount: paymentData.amount,
      payment_method: paymentData.payment_method || 'cash',
      reference_number: paymentData.reference_number,
      notes: paymentData.notes,
      created_at: new Date().toISOString()
    };

    const customer = getCustomerById(paymentData.customer_id);
    if (customer) {
      try {
        generatePaymentReceivedJournalEntry(fullPayment, customer, userId);
      } catch (journalError) {
        logger.warn('Payments', 'journal_entry_failed', 'Error al generar asiento contable, pero pago creado', { journalError }, journalError as Error);
      }
    }

    logger.info('Payments', 'create_success', 'Pago de cliente creado correctamente', { paymentId, userId });
    return { success: true, message: 'Pago registrado correctamente', paymentId };

  } catch (error) {
    if (transactionStarted) {
      try {
        db.run('ROLLBACK');
      } catch (rollbackError) {
        logger.error('Payments', 'rollback_failed', 'Error al hacer rollback', { rollbackError }, rollbackError as Error);
      }
    }
    logger.error('Payments', 'create_failed', 'Error al crear pago', { error }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

/**
 * Generar asiento automático para pago realizado (a proveedor)
 */
export const generatePaymentSentJournalEntry = (payment: SupplierPayment, supplier: Supplier, userId?: number): { success: boolean; message: string; entryId?: number } => {
  const details: Partial<JournalDetail>[] = [
    // Débito: Cuentas por Pagar (Disminuye pasivo)
    {
      account_code: '2111', // Cuentas por Pagar - Proveedores
      debit_amount: payment.amount,
      credit_amount: 0,
      description: `Pago a proveedor ${supplier.name} - ${payment.payment_number} `
    },
    // Crédito: Efectivo/Banco (Disminuye activo)
    {
      account_code: payment.payment_method === 'cash' ? '1111' : '1112',
      debit_amount: 0,
      credit_amount: payment.amount,
      description: `Pago realizado ${payment.payment_number} - ${supplier.name} `
    }
  ];

  return createJournalEntry({
    entry_date: payment.payment_date,
    reference_number: `PAY - ${payment.payment_number} `,
    description: `Pago a ${supplier.name} - ${payment.payment_number} `
  }, details, userId);
};

/**
 * Crea un pago a proveedor (Supplier Payment) - Alias: addPayment
 */
export const addPayment = (paymentData: Partial<SupplierPayment>, userId?: number): { success: boolean; message: string; paymentId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    // 1. Validaciones básicas
    if (!paymentData.supplier_id || !paymentData.amount) {
      throw new Error('Faltan datos requeridos (Proveedor o Monto)');
    }

    // 2. Generar número si no existe
    const paymentNumber = paymentData.payment_number || generateSupplierPaymentNumber();

    // 3. Insertar pago en tabla supplier_payments (necesita existir en schema!)
    // Verificamos si existe la tabla supplier_payments, si no usamos payments con flag o similar?
    // En createSchema linea 954 se crea supplier_payments. Confío en que existe.

    db.run(`
      INSERT INTO supplier_payments(
    supplier_id, bill_id, payment_number, payment_date, amount,
    payment_method, reference_number, notes, created_by
  ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paymentData.supplier_id,
      paymentData.bill_id || null,
      paymentNumber,
      paymentData.payment_date || new Date().toISOString().split('T')[0],
      paymentData.amount,
      paymentData.payment_method || 'cash',
      paymentData.reference_number || null,
      paymentData.notes || null,
      userId || 1
    ]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const paymentId = result[0]?.values[0]?.[0] as number;

    // 4. Actualizar estado de factura de compra (si aplica)
    if (paymentData.bill_id) {
      const billResult = db.exec(`SELECT total_amount FROM bills WHERE id = ${paymentData.bill_id} `);
      if (billResult.length > 0 && billResult[0].values.length > 0) {
        const totalAmount = billResult[0].values[0][0] as number;

        const paymentsResult = db.exec(`SELECT SUM(amount) FROM supplier_payments WHERE bill_id = ${paymentData.bill_id} `);
        const totalPaid = paymentsResult[0]?.values[0]?.[0] as number || 0;

        let newStatus = 'partial';
        if (Math.abs(totalPaid - totalAmount) < 0.01 || totalPaid > totalAmount) {
          newStatus = 'paid';
        }

        db.run(`UPDATE bills SET status = ? WHERE id = ? `, [newStatus, paymentData.bill_id]);
      }
    }

    // 5. Auditoría
    const auditData = { ...paymentData, id: paymentId, payment_number: paymentNumber };
    logAuditEvent('supplier_payments', paymentId, 'INSERT', null, auditData, userId);

    // 6. Generar Asiento Contable
    const fullPayment: SupplierPayment = {
      id: paymentId,
      supplier_id: paymentData.supplier_id,
      bill_id: paymentData.bill_id,
      payment_number: paymentNumber,
      payment_date: paymentData.payment_date || new Date().toISOString().split('T')[0],
      amount: paymentData.amount,
      payment_method: paymentData.payment_method || 'cash',
      reference_number: paymentData.reference_number,
      notes: paymentData.notes,
      created_at: new Date().toISOString()
    };

    const supplier = getSupplierById(paymentData.supplier_id);
    if (supplier) {
      generatePaymentSentJournalEntry(fullPayment, supplier, userId);
    }

    db.run('COMMIT');
    logger.info('Payments', 'add_payment_success', 'Pago a proveedor registrado', { paymentId, userId });
    return { success: true, message: 'Pago registrado correctamente', paymentId };

  } catch (error) {
    db.run('ROLLBACK');
    logger.error('Payments', 'add_payment_failed', 'Error al crear pago a proveedor', { error }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

/**
 * Create alias for consistency if needed, but keeping addPayment as primary for supplier payments per request
 */
export const createSupplierPayment = addPayment; // Alias for consistency

// ==========================================
// FUNCIONES PARA REPORTES CONTABLES
// ==========================================

// Generar Balance General
export const generateBalanceSheet = (asOfDate?: string): { assets: ChartOfAccount[], liabilities: ChartOfAccount[], equity: ChartOfAccount[], totalAssets: number, totalLiabilitiesEquity: number, isBalanced: boolean } => {
  if (!db) return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesEquity: 0, isBalanced: false };

  try {
    const dateFilter = asOfDate ? `AND je.entry_date <= '${asOfDate}'` : '';

    const result = db.exec(`
SELECT
coa.account_code, coa.account_name, coa.account_type, coa.normal_balance,
  COALESCE(SUM(jd.debit_amount), 0) as total_debits,
  COALESCE(SUM(jd.credit_amount), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_details jd ON coa.account_code = jd.account_code
      LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE coa.account_type IN('asset', 'liability', 'equity') 
        AND coa.is_active = 1 
        ${dateFilter}
      GROUP BY coa.account_code, coa.account_name, coa.account_type, coa.normal_balance
      ORDER BY coa.account_code
  `);

    if (!result[0]) return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesEquity: 0, isBalanced: false };

    const assets: ChartOfAccount[] = [];
    const liabilities: ChartOfAccount[] = [];
    const equity: ChartOfAccount[] = [];
    let totalAssets = 0;
    let totalLiabilitiesEquity = 0;

    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const account: any = {};
      columns.forEach((col: any, index: any) => {
        account[col] = row[index];
      });

      const debits = Number(account.total_debits) || 0;
      const credits = Number(account.total_credits) || 0;

      // Calcular balance según tipo normal
      if (account.normal_balance === 'debit') {
        account.balance = debits - credits;
      } else {
        account.balance = credits - debits;
      }

      // Clasificar por tipo de cuenta
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

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilitiesEquity,
      isBalanced
    };

  } catch (error) {
    console.error('Error generating balance sheet:', error);
    return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesEquity: 0, isBalanced: false };
  }
};

// Generar Estado de Resultados
export const generateIncomeStatement = (fromDate: string, toDate: string): { revenue: ChartOfAccount[], expenses: ChartOfAccount[], totalRevenue: number, totalExpenses: number, netIncome: number } => {
  if (!db) return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 };

  try {
    const result = db.exec(`
SELECT
coa.account_code, coa.account_name, coa.account_type, coa.normal_balance,
  COALESCE(SUM(jd.debit_amount), 0) as total_debits,
  COALESCE(SUM(jd.credit_amount), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_details jd ON coa.account_code = jd.account_code
      LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE coa.account_type IN('revenue', 'expense') 
        AND coa.is_active = 1 
        AND je.entry_date BETWEEN ? AND ?
  GROUP BY coa.account_code, coa.account_name, coa.account_type, coa.normal_balance
      ORDER BY coa.account_code
    `, [fromDate, toDate]);

    if (!result[0]) return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 };

    const revenue: ChartOfAccount[] = [];
    const expenses: ChartOfAccount[] = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const account: any = {};
      columns.forEach((col: any, index: any) => {
        account[col] = row[index];
      });

      const debits = Number(account.total_debits) || 0;
      const credits = Number(account.total_credits) || 0;

      // Calcular balance según tipo normal
      if (account.normal_balance === 'debit') {
        account.balance = debits - credits;
      } else {
        account.balance = credits - debits;
      }

      // Clasificar por tipo de cuenta
      if (account.account_type === 'revenue') {
        revenue.push(account);
        totalRevenue += account.balance;
      } else if (account.account_type === 'expense') {
        expenses.push(account);
        totalExpenses += account.balance;
      }
    });

    const netIncome = totalRevenue - totalExpenses;

    return {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome
    };

  } catch (error) {
    console.error('Error generating income statement:', error);
    return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 };
  }
};

/**
 * Genera el asiento de cierre de resultados (Ingresos y Gastos).
 * Transfiere los saldos a la cuenta de Utilidades Retenidas (3130).
 */
export const generateClosingEntry = (fromDate: string, toDate: string, userId?: number): { success: boolean; message: string; entryId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const incomeData = generateIncomeStatement(fromDate, toDate);
    const details: Partial<JournalDetail>[] = [];

    // 1. Debitar Ingresos (Saldos acreedores -> Débito para cerrar)
    incomeData.revenue.forEach(acc => {
      if (Math.abs(acc.balance || 0) > 0.01) {
        details.push({
          account_code: acc.account_code,
          debit_amount: Math.abs(acc.balance || 0),
          credit_amount: 0,
          description: `Cierre de cuenta de ingresos - Periodo ${fromDate} a ${toDate} `
        });
      }
    });

    // 2. Acreditar Gastos (Saldos deudores -> Crédito para cerrar)
    incomeData.expenses.forEach(acc => {
      if (Math.abs(acc.balance || 0) > 0.01) {
        details.push({
          account_code: acc.account_code,
          debit_amount: 0,
          credit_amount: Math.abs(acc.balance || 0),
          description: `Cierre de cuenta de gastos - Periodo ${fromDate} a ${toDate} `
        });
      }
    });

    if (details.length === 0) {
      return { success: false, message: 'No hay saldos en cuentas de resultados para cerrar en este periodo.' };
    }

    // 3. Diferencia va a Utilidades Retenidas (Equity) - 3130
    if (Math.abs(incomeData.netIncome) > 0.01) {
      const isProfit = incomeData.netIncome > 0;
      details.push({
        account_code: '3130', // Utilidades Retenidas / Del Ejercicio
        debit_amount: isProfit ? 0 : Math.abs(incomeData.netIncome),
        credit_amount: isProfit ? Math.abs(incomeData.netIncome) : 0,
        description: isProfit ? 'Registro de Utilidad del Periodo' : 'Registro de Pérdida del Periodo'
      });
    }

    return createJournalEntry({
      entry_date: toDate,
      reference_number: `CLOSE - ${toDate.slice(0, 7)} `,
      description: `ASIENTO DE CIERRE DE RESULTADOS: Periodo ${fromDate} a ${toDate} `
    }, details, userId);

  } catch (error: any) {
    return { success: false, message: 'Error al generar asiento de cierre: ' + error.message };
  }
};

// Generar Estado de Flujo de Efectivo (Método Indirecto)
export const getCashFlowStatement = (fromDate: string, toDate: string): {
  netIncome: number,
  operatingActivities: { title: string, amount: number }[],
  investingActivities: { title: string, amount: number }[],
  financingActivities: { title: string, amount: number }[],
  netIncreaseInCash: number,
  startingCash: number,
  endingCash: number
} => {
  if (!db) return { netIncome: 0, operatingActivities: [], investingActivities: [], financingActivities: [], netIncreaseInCash: 0, startingCash: 0, endingCash: 0 };

  try {
    // 1. Obtener Net Income del periodo
    const incomeStatement = generateIncomeStatement(fromDate, toDate);
    const netIncome = incomeStatement.netIncome;

    // 2. Calcular cambios en Working Capital
    // Necesitamos saldos al inicio y al final
    const startBalanceSheet = generateBalanceSheet(new Date(new Date(fromDate).getTime() - 86400000).toISOString().split('T')[0]);
    const endBalanceSheet = generateBalanceSheet(toDate);

    const operatingActivities: { title: string, amount: number }[] = [];
    let operatingTotal = netIncome;

    // Ajuste por Cuentas por Cobrar (Asset: Increase = Cash Decrease)
    const startAR = startBalanceSheet.assets.filter(a => a.account_name.toLowerCase().includes('cobrar')).reduce((sum, a) => sum + (a.balance || 0), 0);
    const endAR = endBalanceSheet.assets.filter(a => a.account_name.toLowerCase().includes('cobrar')).reduce((sum, a) => sum + (a.balance || 0), 0);
    const deltaAR = endAR - startAR;
    if (deltaAR !== 0) {
      operatingActivities.push({ title: deltaAR > 0 ? 'Aumento en Cuentas por Cobrar' : 'Disminución en Cuentas por Cobrar', amount: -deltaAR });
      operatingTotal -= deltaAR;
    }

    // Ajuste por Inventario (Asset: Increase = Cash Decrease)
    const startInv = startBalanceSheet.assets.filter(a => a.account_name.toLowerCase().includes('inventario')).reduce((sum, a) => sum + (a.balance || 0), 0);
    const endInv = endBalanceSheet.assets.filter(a => a.account_name.toLowerCase().includes('inventario')).reduce((sum, a) => sum + (a.balance || 0), 0);
    const deltaInv = endInv - startInv;
    if (deltaInv !== 0) {
      operatingActivities.push({ title: deltaInv > 0 ? 'Aumento en Inventario' : 'Disminución en Inventario', amount: -deltaInv });
      operatingTotal -= deltaInv;
    }

    // Ajuste por Cuentas por Pagar (Liability: Increase = Cash Increase)
    const startAP = startBalanceSheet.liabilities.filter(l => l.account_name.toLowerCase().includes('pagar')).reduce((sum, l) => sum + (l.balance || 0), 0);
    const endAP = endBalanceSheet.liabilities.filter(l => l.account_name.toLowerCase().includes('pagar')).reduce((sum, l) => sum + (l.balance || 0), 0);
    const deltaAP = endAP - startAP;
    if (deltaAP !== 0) {
      operatingActivities.push({ title: deltaAP > 0 ? 'Aumento en Cuentas por Pagar' : 'Disminución en Cuentas por Pagar', amount: deltaAP });
      operatingTotal += deltaAP;
    }

    // 3. Investing & Financing (Simplificado para este sistema)
    const investingActivities: { title: string, amount: number }[] = [];
    const financingActivities: { title: string, amount: number }[] = [];

    // 4. Calcular Efectivo Neto
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

// ==========================================
// GESTIÓN DE DATOS DE LA EMPRESA
// ==========================================

export interface CompanyData {
  id: number;
  company_name: string;
  legal_name: string;
  tax_id: string; // EIN o Tax ID
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website?: string;
  logo_path?: string;
  fiscal_year_start: string; // MM-DD format
  currency: string;
  language: string;
  timezone: string;
  // Configuraciones financieras
  sales_commission_rate: number;
  sales_commission_percentage: number;
  discount_amount: number;
  discount_percentage: number;
  shipping_rate: number;
  shipping_percentage: number;
  reposition_policy_days: number;
  late_fee_amount: number;
  late_fee_percentage: number;
  annual_interest_rate: number;
  grace_period_days: number;
  documentation_cost: number;
  other_costs: number;
  chart_of_accounts_name: string;
  date_format: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Generar Aging Report (Antigüedad de Cuentas)
export const getAgingReport = (type: 'receivable' | 'payable'): {
  total: number,
  buckets: { [key: string]: { amount: number, percentage: number } },
  details: { name: string, amount: number, days: number, bucket: string }[]
} => {
  if (!db) return { total: 0, buckets: {}, details: [] };

  try {
    const table = type === 'receivable' ? 'invoices' : 'bills';
    const entityTable = type === 'receivable' ? 'customers' : 'suppliers';
    const entityIdField = type === 'receivable' ? 'customer_id' : 'supplier_id';

    const result = db.exec(`
SELECT
e.name,
  t.total_amount,
  t.due_date,
  (julianday('now') - julianday(t.due_date)) as days_overdue
      FROM ${table} t
      JOIN ${entityTable} e ON t.${entityIdField} = e.id
      WHERE t.status IN('pending', 'partial', 'overdue')
    `);

    if (!result[0]) return { total: 0, buckets: {}, details: [] };

    const buckets: any = {
      'current': { amount: 0, percentage: 0 },
      '1-30': { amount: 0, percentage: 0 },
      '31-60': { amount: 0, percentage: 0 },
      '61-90': { amount: 0, percentage: 0 },
      '90+': { amount: 0, percentage: 0 }
    };

    let total = 0;
    const details: any[] = [];

    const columns = result[0].columns;
    result[0].values.forEach((row: any) => {
      const name = row[0] as string;
      const amount = Number(row[1]) || 0;
      const days = Math.floor(Number(row[3]) || 0);

      let bucket = 'current';
      if (days > 90) bucket = '90+';
      else if (days > 60) bucket = '61-90';
      else if (days > 30) bucket = '31-60';
      else if (days > 0) bucket = '1-30';

      buckets[bucket].amount += amount;
      total += amount;

      details.push({ name, amount, days, bucket });
    });

    // Calcular porcentajes
    if (total > 0) {
      Object.keys(buckets).forEach(key => {
        buckets[key].percentage = (buckets[key].amount / total) * 100;
      });
    }

    return { total, buckets, details };

  } catch (error) {
    console.error('Error generating aging report:', error);
    return { total: 0, buckets: {}, details: [] };
  }
};

// Obtener Auxiliar de Cuenta (Account Ledger)
export const getAccountLedger = (accountCode: string, fromDate: string, toDate: string): {
  account: any,
  startingBalance: number,
  transactions: any[],
  endingBalance: number,
  totalDebit: number,
  totalCredit: number
} => {
  if (!db) return { account: null, startingBalance: 0, transactions: [], endingBalance: 0, totalDebit: 0, totalCredit: 0 };

  try {
    // 1. Obtener info de la cuenta
    const accResult = db.exec(`SELECT * FROM chart_of_accounts WHERE account_code = ? `, [accountCode]);
    if (!accResult[0]) return { account: null, startingBalance: 0, transactions: [], endingBalance: 0, totalDebit: 0, totalCredit: 0 };

    const account: any = {};
    accResult[0].columns.forEach((col: any, i: any) => account[col] = accResult[0].values[0][i]);

    // 2. Calcular saldo inicial (antes de fromDate)
    const startBalResult = db.exec(`
      SELECT
COALESCE(SUM(debit_amount), 0) as debits,
  COALESCE(SUM(credit_amount), 0) as credits
      FROM journal_details jd
      JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE jd.account_code = ? AND je.entry_date < ?
  `, [accountCode, fromDate]);

    const startDebits = Number(startBalResult[0].values[0][0]);
    const startCredits = Number(startBalResult[0].values[0][1]);
    const startingBalance = account.normal_balance === 'debit' ? (startDebits - startCredits) : (startCredits - startDebits);

    // 3. Obtener transacciones en el periodo
    const txResult = db.exec(`
      SELECT
je.entry_date,
  je.reference,
  jd.description,
  jd.debit_amount,
  jd.credit_amount,
  je.id as journal_id
      FROM journal_details jd
      JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE jd.account_code = ? AND je.entry_date BETWEEN ? AND ?
  ORDER BY je.entry_date ASC, je.id ASC
    `, [accountCode, fromDate, toDate]);

    const transactions: any[] = [];
    let runningBalance = startingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    if (txResult[0]) {
      const cols = txResult[0].columns;
      txResult[0].values.forEach((row: any) => {
        const tx: any = {};
        cols.forEach((col: any, i: any) => tx[col] = row[i]);

        totalDebit += tx.debit_amount;
        totalCredit += tx.credit_amount;

        if (account.normal_balance === 'debit') {
          runningBalance += (tx.debit_amount - tx.credit_amount);
        } else {
          runningBalance += (tx.credit_amount - tx.debit_amount);
        }

        tx.running_balance = runningBalance;
        transactions.push(tx);
      });
    }

    return {
      account,
      startingBalance,
      transactions,
      endingBalance: runningBalance,
      totalDebit,
      totalCredit
    };

  } catch (error) {
    console.error('Error generating account ledger:', error);
    return { account: null, startingBalance: 0, transactions: [], endingBalance: 0, totalDebit: 0, totalCredit: 0 };
  }
};

export function getCompanyData(): CompanyData | null {
  try {
    logger.info('CompanyData', 'get_start', 'Obteniendo datos de la empresa');

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const result = db.exec(`
SELECT * FROM company_data WHERE is_active = 1 LIMIT 1
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      logger.warn('CompanyData', 'not_found', 'No se encontraron datos de empresa');
      return null;
    }

    const row = result[0].values[0];
    const company: CompanyData = {
      id: row[0] as number,
      company_name: row[1] as string,
      legal_name: row[2] as string,
      tax_id: row[3] as string,
      address: row[4] as string,
      city: row[5] as string,
      state: row[6] as string,
      zip_code: row[7] as string,
      phone: row[8] as string,
      email: row[9] as string,
      website: row[10] as string || '',
      logo_path: row[11] as string || '',
      fiscal_year_start: row[12] as string,
      currency: row[13] as string,
      language: row[14] as string,
      timezone: row[15] as string,
      sales_commission_rate: Number(row[16]) || 0,
      sales_commission_percentage: Number(row[17]) || 0,
      discount_amount: Number(row[18]) || 50,
      discount_percentage: Number(row[19]) || 0,
      shipping_rate: Number(row[20]) || 0,
      shipping_percentage: Number(row[21]) || 0,
      reposition_policy_days: Number(row[22]) || 32,
      late_fee_amount: Number(row[23]) || 0,
      late_fee_percentage: Number(row[24]) || 0,
      annual_interest_rate: Number(row[25]) || 0,
      grace_period_days: Number(row[26]) || 0,
      documentation_cost: Number(row[27]) || 0,
      other_costs: Number(row[28]) || 0,
      chart_of_accounts_name: row[29] as string || 'Plan de Cuenta Ejemplo',
      date_format: row[30] as string || 'MM/DD/AAAA',
      created_at: row[31] as string,
      updated_at: row[32] as string,
      is_active: Boolean(row[33])
    };

    logger.info('CompanyData', 'get_success', 'Datos de empresa obtenidos', { company_name: company.company_name });
    return company;

  } catch (error) {
    logger.error('CompanyData', 'get_failed', 'Error al obtener datos de empresa', null, error as Error);
    throw error;
  }
}

export function updateCompanyData(companyData: Partial<CompanyData>): { success: boolean; message: string; warnings?: string[] } {
  try {
    logger.info('CompanyData', 'update_start', 'Actualizando datos de empresa', companyData);

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Verificar si hay datos contables asociados
    const warnings: string[] = [];
    const accountingDataCheck = checkAccountingDataAssociation();

    if (accountingDataCheck.hasData) {
      warnings.push('⚠️ ADVERTENCIA: Esta empresa tiene datos contables asociados');
      warnings.push(`📊 ${accountingDataCheck.invoices} facturas, ${accountingDataCheck.customers} clientes, ${accountingDataCheck.suppliers} proveedores`);

      // Si se está cambiando el nombre de la empresa y hay datos contables
      if (companyData.company_name || companyData.legal_name) {
        warnings.push('🔄 Cambiar el nombre puede afectar reportes y documentos existentes');
        warnings.push('📋 Se recomienda crear un respaldo antes de continuar');
      }
    }

    // Obtener datos actuales
    const currentData = getCompanyData();
    if (!currentData) {
      throw new Error('No se encontraron datos de empresa para actualizar');
    }

    // Preparar datos para actualización
    const updateData = {
      ...currentData,
      ...companyData,
      updated_at: new Date().toISOString()
    };

    // Ejecutar actualización
    const stmt = db.prepare(`
      UPDATE company_data SET
company_name = ?,
  legal_name = ?,
  tax_id = ?,
  address = ?,
  city = ?,
  state = ?,
  zip_code = ?,
  phone = ?,
  email = ?,
  website = ?,
  logo_path = ?,
  fiscal_year_start = ?,
  currency = ?,
  language = ?,
  timezone = ?,
  sales_commission_rate = ?,
  sales_commission_percentage = ?,
  discount_amount = ?,
  discount_percentage = ?,
  shipping_rate = ?,
  shipping_percentage = ?,
  reposition_policy_days = ?,
  late_fee_amount = ?,
  late_fee_percentage = ?,
  annual_interest_rate = ?,
  grace_period_days = ?,
  documentation_cost = ?,
  other_costs = ?,
  chart_of_accounts_name = ?,
  date_format = ?,
  updated_at = ?
    WHERE id = ? AND is_active = 1
      `);

    stmt.run([
      updateData.company_name,
      updateData.legal_name,
      updateData.tax_id,
      updateData.address,
      updateData.city,
      updateData.state,
      updateData.zip_code,
      updateData.phone,
      updateData.email,
      updateData.website || null,
      updateData.logo_path || null,
      updateData.fiscal_year_start,
      updateData.currency,
      updateData.language,
      updateData.timezone,
      updateData.sales_commission_rate || 0,
      updateData.sales_commission_percentage || 0,
      updateData.discount_amount || 50,
      updateData.discount_percentage || 0,
      updateData.shipping_rate || 0,
      updateData.shipping_percentage || 0,
      updateData.reposition_policy_days || 32,
      updateData.late_fee_amount || 0,
      updateData.late_fee_percentage || 0,
      updateData.annual_interest_rate || 0,
      updateData.grace_period_days || 0,
      updateData.documentation_cost || 0,
      updateData.other_costs || 0,
      updateData.chart_of_accounts_name || 'Plan de Cuenta Ejemplo',
      updateData.date_format || 'MM/DD/AAAA',
      updateData.updated_at,
      currentData.id
    ]);

    // Registrar en auditoría
    const auditData = {
      old_name: currentData.company_name,
      new_name: updateData.company_name,
      changes: Object.keys(companyData),
      has_accounting_data: accountingDataCheck.hasData
    };

    logAuditEvent('company_data', currentData.id, 'UPDATE', JSON.stringify(currentData), JSON.stringify(updateData));

    logger.info('CompanyData', 'update_success', 'Datos de empresa actualizados', {
      company_id: currentData.id,
      changes: Object.keys(companyData),
      warnings_count: warnings.length
    });

    return {
      success: true,
      message: 'Datos de la empresa actualizados correctamente',
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    logger.error('CompanyData', 'update_failed', 'Error al actualizar datos de empresa', null, error as Error);
    return {
      success: false,
      message: `Error al actualizar datos de empresa: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

// ==========================================
// MÓDULO ARD (Gestión de Archivos y Recibos)
// ==========================================

export function getARDDocuments(): any[] {
  if (!db) return [];
  try {
    const result = db.exec('SELECT * FROM ard_documents ORDER BY created_at DESC');
    if (!result[0]) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any) => {
      const doc: any = {};
      columns.forEach((col: any, i: any) => doc[col] = row[i]);
      return doc;
    });
  } catch (e) {
    console.error('Error fetching ARD docs:', e);
    return [];
  }
}

export function saveARDDocument(doc: any): { success: boolean; id: string } {
  if (!db) return { success: false, id: '' };
  try {
    db.run(`
      INSERT INTO ard_documents(id, name, type, status, file_size, detected_amount, detected_tax, detected_date, raw_analysis)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
      doc.id, doc.name, doc.type, doc.status, doc.fileSize,
      doc.detectedAmount || 0, doc.detectedTax || 0,
      doc.detectedDate || new Date().toISOString().split('T')[0],
      doc.rawAnalysis || '{}'
    ]);
    return { success: true, id: doc.id };
  } catch (e) {
    console.error('Error saving ARD doc:', e);
    return { success: false, id: '' };
  }
}

export function updateARDDocumentStatus(id: string, status: string, results?: any): void {
  if (!db) return;
  try {
    if (results) {
      db.run(`
        UPDATE ard_documents 
        SET status = ?,
  detected_amount = ?,
  detected_tax = ?,
  raw_analysis = ?,
  updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
  `, [status, results.amount, results.tax, JSON.stringify(results), id]);
    } else {
      db.run('UPDATE ard_documents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
    }
  } catch (e) {
    console.error('Error updating ARD doc:', e);
  }
}

export function deleteARDDocument(id: string): void {
  if (!db) return;
  db.run('DELETE FROM ard_documents WHERE id = ?', [id]);
}

export function assignCustomerToARDDocument(documentId: string, customerId: number): void {
  if (!db) return;
  db.run('UPDATE ard_documents SET customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [customerId, documentId]);
}

export function getARDCustomerSummary(): any[] {
  if (!db) return [];
  try {
    const query = `
      SELECT
c.id,
  c.name,
  COUNT(a.id) as total_docs,
  SUM(CASE WHEN a.status = 'processed' THEN 1 ELSE 0 END) as pending_conversion,
  SUM(CASE WHEN a.status = 'converted' THEN 1 ELSE 0 END) as total_converted,
  SUM(a.detected_amount) as total_volume
      FROM customers c
      INNER JOIN ard_documents a ON c.id = a.customer_id
      GROUP BY c.id
      ORDER BY total_docs DESC
  `;
    const result = db.exec(query);
    if (!result[0]) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any) => {
      const obj: any = {};
      columns.forEach((col: any, i: any) => obj[col] = row[i]);
      return obj;
    });
  } catch (e) {
    console.error('Error fetching ARD customer summary:', e);
    return [];
  }
}

export function checkAccountingDataAssociation(): { hasData: boolean; customers: number; suppliers: number; invoices: number; bills: number } {
  try {
    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Contar registros en tablas principales
    const customersResult = db.exec('SELECT COUNT(*) as count FROM customers WHERE is_active = 1');
    const suppliersResult = db.exec('SELECT COUNT(*) as count FROM suppliers WHERE is_active = 1');
    const invoicesResult = db.exec('SELECT COUNT(*) as count FROM invoices');
    const billsResult = db.exec('SELECT COUNT(*) as count FROM bills');

    const customers = customersResult[0]?.values[0]?.[0] as number || 0;
    const suppliers = suppliersResult[0]?.values[0]?.[0] as number || 0;
    const invoices = invoicesResult[0]?.values[0]?.[0] as number || 0;
    const bills = billsResult[0]?.values[0]?.[0] as number || 0;

    const hasData = customers > 0 || suppliers > 0 || invoices > 0 || bills > 0;

    return { hasData, customers, suppliers, invoices, bills };

  } catch (error) {
    logger.error('CompanyData', 'check_association_failed', 'Error al verificar asociaciones contables', null, error as Error);
    return { hasData: false, customers: 0, suppliers: 0, invoices: 0, bills: 0 };
  }
}

export function initializeCompanyData(): void {
  try {
    logger.info('CompanyData', 'init_start', 'Inicializando datos de empresa por defecto');

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Verificar si ya existen datos
    const existing = getCompanyData();
    if (existing) {
      logger.info('CompanyData', 'init_skip', 'Datos de empresa ya existen');
      return;
    }

    // Crear datos por defecto
    const defaultCompany: Omit<CompanyData, 'id'> = {
      company_name: 'Mi Empresa',
      legal_name: 'Mi Empresa LLC',
      tax_id: '00-0000000',
      address: '123 Main Street',
      city: 'Miami',
      state: 'FL',
      zip_code: '33101',
      phone: '+1 (305) 000-0000',
      email: 'info@miempresa.com',
      website: 'www.miempresa.com',
      logo_path: '',
      fiscal_year_start: '01-01', // Enero 1
      currency: 'USD',
      language: 'es',
      timezone: 'America/New_York',
      // Configuraciones financieras por defecto
      sales_commission_rate: 0,
      sales_commission_percentage: 0,
      discount_amount: 50,
      discount_percentage: 0,
      shipping_rate: 0,
      shipping_percentage: 0,
      reposition_policy_days: 32,
      late_fee_amount: 0,
      late_fee_percentage: 0,
      annual_interest_rate: 0,
      grace_period_days: 0,
      documentation_cost: 0,
      other_costs: 0,
      chart_of_accounts_name: 'Plan de Cuenta Ejemplo',
      date_format: 'MM/DD/AAAA',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    };

    const stmt = db.prepare(`
      INSERT INTO company_data(
    company_name, legal_name, tax_id, address, city, state, zip_code,
    phone, email, website, logo_path, fiscal_year_start, currency,
    language, timezone, sales_commission_rate, sales_commission_percentage,
    discount_amount, discount_percentage, shipping_rate, shipping_percentage,
    reposition_policy_days, late_fee_amount, late_fee_percentage,
    annual_interest_rate, grace_period_days, documentation_cost,
    other_costs, chart_of_accounts_name, date_format,
    created_at, updated_at, is_active
  ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      defaultCompany.company_name,
      defaultCompany.legal_name,
      defaultCompany.tax_id,
      defaultCompany.address,
      defaultCompany.city,
      defaultCompany.state,
      defaultCompany.zip_code,
      defaultCompany.phone,
      defaultCompany.email,
      defaultCompany.website || null,
      defaultCompany.logo_path || null,
      defaultCompany.fiscal_year_start,
      defaultCompany.currency,
      defaultCompany.language,
      defaultCompany.timezone,
      defaultCompany.sales_commission_rate,
      defaultCompany.sales_commission_percentage,
      defaultCompany.discount_amount,
      defaultCompany.discount_percentage,
      defaultCompany.shipping_rate,
      defaultCompany.shipping_percentage,
      defaultCompany.reposition_policy_days,
      defaultCompany.late_fee_amount,
      defaultCompany.late_fee_percentage,
      defaultCompany.annual_interest_rate,
      defaultCompany.grace_period_days,
      defaultCompany.documentation_cost,
      defaultCompany.other_costs,
      defaultCompany.chart_of_accounts_name,
      defaultCompany.date_format,
      defaultCompany.created_at,
      defaultCompany.updated_at,
      defaultCompany.is_active ? 1 : 0
    ]);

    logger.info('CompanyData', 'init_success', 'Datos de empresa inicializados por defecto');

  } catch (error) {
    logger.error('CompanyData', 'init_failed', 'Error al inicializar datos de empresa', null, error as Error);
    throw error;
  }
}
// ==========================================
// GESTIÓN DE CATEGORÍAS DE PRODUCTOS
// ==========================================

export function getProductCategories(): ProductCategory[] {
  try {
    logger.info('ProductCategories', 'get_start', 'Obteniendo categorías de productos');

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const result = db.exec(`
SELECT
c.*,
  p.name as parent_name
      FROM product_categories c
      LEFT JOIN product_categories p ON c.parent_id = p.id
      WHERE c.active = 1
      ORDER BY c.name
  `);

    if (result.length === 0) {
      logger.info('ProductCategories', 'get_empty', 'No se encontraron categorías');
      return [];
    }

    const categories: ProductCategory[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const category: any = {};

      columns.forEach((col: any, index: any) => {
        category[col] = row[index];
      });

      categories.push(category as ProductCategory);
    });

    logger.info('ProductCategories', 'get_success', 'Categorías obtenidas', { count: categories.length });
    return categories;

  } catch (error) {
    logger.error('ProductCategories', 'get_failed', 'Error al obtener categorías', null, error as Error);
    return [];
  }
}

export function createProductCategory(categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>, userId?: number): { success: boolean; message: string; id?: number } {
  try {
    logger.info('ProductCategories', 'create_start', 'Creando categoría de producto', categoryData);

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Validar datos requeridos
    if (!categoryData.name?.trim()) {
      return { success: false, message: 'El nombre de la categoría es requerido' };
    }

    // Verificar que no exista una categoría con el mismo nombre
    const existingResult = db.exec(`
      SELECT id FROM product_categories 
      WHERE LOWER(name) = LOWER(?) AND active = 1
  `, [categoryData.name.trim()]);

    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
      return { success: false, message: 'Ya existe una categoría con ese nombre' };
    }

    const stmt = db.prepare(`
      INSERT INTO product_categories(
    name, description, parent_id, tax_rate, active, created_at, updated_at, created_by, updated_by
  ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    stmt.run([
      categoryData.name.trim(),
      categoryData.description || null,
      categoryData.parent_id || null,
      categoryData.tax_rate || 0,
      categoryData.active ? 1 : 0,
      now,
      now,
      userId || 1,
      userId || 1
    ]);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const categoryId = insertResult[0]?.values[0]?.[0] as number || 0;

    stmt.free();

    // Registrar en auditoría
    logAuditEvent('product_categories', categoryId, 'INSERT', null, JSON.stringify(categoryData), userId);

    logger.info('ProductCategories', 'create_success', 'Categoría creada', { id: categoryId, name: categoryData.name });

    return {
      success: true,
      message: `Categoría "${categoryData.name}" creada correctamente`,
      id: categoryId
    };

  } catch (error) {
    logger.error('ProductCategories', 'create_failed', 'Error al crear categoría', categoryData, error as Error);
    return {
      success: false,
      message: `Error al crear categoría: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

export function updateProductCategory(id: number, categoryData: Partial<ProductCategory>, userId?: number): { success: boolean; message: string } {
  try {
    logger.info('ProductCategories', 'update_start', 'Actualizando categoría', { id, ...categoryData });

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Obtener datos actuales para auditoría
    const currentResult = db.exec('SELECT * FROM product_categories WHERE id = ?', [id]);
    if (currentResult.length === 0 || currentResult[0].values.length === 0) {
      return { success: false, message: 'Categoría no encontrada' };
    }

    const stmt = db.prepare(`
      UPDATE product_categories SET
name = COALESCE(?, name),
  description = COALESCE(?, description),
  parent_id = COALESCE(?, parent_id),
  tax_rate = COALESCE(?, tax_rate),
  active = COALESCE(?, active),
  updated_at = ?,
  updated_by = ?
    WHERE id = ?
      `);

    stmt.run([
      categoryData.name || null,
      categoryData.description || null,
      categoryData.parent_id || null,
      categoryData.tax_rate || null,
      categoryData.active !== undefined ? (categoryData.active ? 1 : 0) : null,
      new Date().toISOString(),
      userId || 1,
      id
    ]);

    // Registrar en auditoría
    logAuditEvent('product_categories', id, 'UPDATE', JSON.stringify(currentResult[0].values[0]), JSON.stringify(categoryData), userId);

    logger.info('ProductCategories', 'update_success', 'Categoría actualizada', { id });

    return {
      success: true,
      message: 'Categoría actualizada correctamente'
    };

  } catch (error) {
    logger.error('ProductCategories', 'update_failed', 'Error al actualizar categoría', { id, ...categoryData }, error as Error);
    return {
      success: false,
      message: `Error al actualizar categoría: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

export function deleteProductCategory(id: number, userId?: number): { success: boolean; message: string } {
  try {
    logger.info('ProductCategories', 'delete_start', 'Eliminando categoría', { id });

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Verificar si hay productos asociados
    const productsResult = db.exec('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND active = 1', [id]);
    const productCount = productsResult[0]?.values[0]?.[0] as number || 0;

    if (productCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${productCount} producto(s) asociado(s)`
      };
    }

    // Verificar si hay subcategorías
    const subcategoriesResult = db.exec('SELECT COUNT(*) as count FROM product_categories WHERE parent_id = ? AND active = 1', [id]);
    const subcategoryCount = subcategoriesResult[0]?.values[0]?.[0] as number || 0;

    if (subcategoryCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${subcategoryCount} subcategoría(s)`
      };
    }

    // Obtener datos actuales para auditoría
    const currentResult = db.exec('SELECT * FROM product_categories WHERE id = ?', [id]);

    // Marcar como inactiva en lugar de eliminar físicamente
    const stmt = db.prepare('UPDATE product_categories SET active = 0, updated_at = ? WHERE id = ?');
    stmt.run([new Date().toISOString(), id]);

    // Registrar en auditoría
    logAuditEvent('product_categories', id, 'DELETE', JSON.stringify(currentResult[0]?.values[0]), null, userId);

    logger.info('ProductCategories', 'delete_success', 'Categoría eliminada', { id });

    return {
      success: true,
      message: 'Categoría eliminada correctamente'
    };

  } catch (error) {
    logger.error('ProductCategories', 'delete_failed', 'Error al eliminar categoría', { id }, error as Error);
    return {
      success: false,
      message: `Error al eliminar categoría: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

// ==========================================
// GESTIÓN DE PRODUCTOS EXPANDIDA
// ==========================================

export function getProducts(): Product[] {
  try {
    logger.info('Products', 'get_start', 'Obteniendo productos');

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const result = db.exec(`
SELECT
p.*,
  c.name as category_name,
  s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.active = 1
      ORDER BY p.name
  `);

    if (result.length === 0) {
      logger.info('Products', 'get_empty', 'No se encontraron productos');
      return [];
    }

    const products: Product[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const product: any = {};

      columns.forEach((col: any, index: any) => {
        if (col === 'category_name' && row[index]) {
          product.category = { name: row[index] as string } as ProductCategory;
        } else if (col === 'supplier_name' && row[index]) {
          product.supplier = { name: row[index] as string } as Supplier;
        } else {
          product[col] = row[index];
        }
      });

      products.push(product as Product);
    });

    logger.info('Products', 'get_success', 'Productos obtenidos', { count: products.length });
    return products;

  } catch (error) {
    logger.error('Products', 'get_failed', 'Error al obtener productos', null, error as Error);
    return [];
  }
}

export function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>, userId?: number): { success: boolean; message: string; id?: number } {
  try {
    logger.info('Products', 'create_start', 'Creando producto', productData);

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Validar datos requeridos
    if (!productData.sku?.trim()) {
      return { success: false, message: 'El SKU es requerido' };
    }

    if (!productData.name?.trim()) {
      return { success: false, message: 'El nombre del producto es requerido' };
    }

    if (productData.price < 0) {
      return { success: false, message: 'El precio no puede ser negativo' };
    }

    // Verificar que no exista un producto con el mismo SKU
    const existingResult = db.exec(`
      SELECT id FROM products 
      WHERE LOWER(sku) = LOWER(?) AND active = 1
  `, [productData.sku.trim()]);

    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
      return { success: false, message: 'Ya existe un producto con ese SKU' };
    }

    const stmt = db.prepare(`
      INSERT INTO products(
    sku, name, description, price, cost, category_id, unit_of_measure,
    taxable, tax_rate, stock_quantity, min_stock_level, max_stock_level,
    reorder_point, supplier_id, barcode, image_path, weight, dimensions,
    is_service, service_duration, warranty_period, notes, active,
    created_at, updated_at, created_by, updated_by
  ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    stmt.run([
      productData.sku.trim(),
      productData.name.trim(),
      productData.description || null,
      productData.price,
      productData.cost || 0,
      productData.category_id || null,
      productData.unit_of_measure || 'unidad',
      productData.taxable ? 1 : 0,
      productData.tax_rate || null,
      productData.stock_quantity || 0,
      productData.min_stock_level || 0,
      productData.max_stock_level || 100,
      productData.reorder_point || 10,
      productData.supplier_id || null,
      productData.barcode || null,
      productData.image_path || null,
      productData.weight || null,
      productData.dimensions || null,
      productData.is_service ? 1 : 0,
      productData.service_duration || null,
      productData.warranty_period || null,
      productData.notes || null,
      productData.active ? 1 : 0,
      now,
      now,
      userId || 1,
      userId || 1
    ]);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const productId = insertResult[0]?.values[0]?.[0] as number || 0;

    stmt.free();

    // Registrar en auditoría
    logAuditEvent('products', productId, 'INSERT', null, JSON.stringify(productData), userId);

    logger.info('Products', 'create_success', 'Producto creado', { id: productId, sku: productData.sku });

    return {
      success: true,
      message: `Producto "${productData.name}" creado correctamente`,
      id: productId
    };

  } catch (error) {
    logger.error('Products', 'create_failed', 'Error al crear producto', productData, error as Error);
    return {
      success: false,
      message: `Error al crear producto: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

export function updateProduct(id: number, productData: Partial<Product>, userId?: number): { success: boolean; message: string } {
  try {
    logger.info('Products', 'update_start', 'Actualizando producto', { id, ...productData });

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Obtener datos actuales para auditoría
    const currentResult = db.exec('SELECT * FROM products WHERE id = ?', [id]);
    if (currentResult.length === 0 || currentResult[0].values.length === 0) {
      return { success: false, message: 'Producto no encontrado' };
    }

    // Validar SKU único si se está actualizando
    if (productData.sku) {
      const existingResult = db.exec(`
        SELECT id FROM products 
        WHERE LOWER(sku) = LOWER(?) AND id != ? AND active = 1
  `, [productData.sku.trim(), id]);

      if (existingResult.length > 0 && existingResult[0].values.length > 0) {
        return { success: false, message: 'Ya existe otro producto con ese SKU' };
      }
    }

    const stmt = db.prepare(`
      UPDATE products SET
sku = COALESCE(?, sku),
  name = COALESCE(?, name),
  description = COALESCE(?, description),
  price = COALESCE(?, price),
  cost = COALESCE(?, cost),
  category_id = COALESCE(?, category_id),
  unit_of_measure = COALESCE(?, unit_of_measure),
  taxable = COALESCE(?, taxable),
  tax_rate = COALESCE(?, tax_rate),
  stock_quantity = COALESCE(?, stock_quantity),
  min_stock_level = COALESCE(?, min_stock_level),
  max_stock_level = COALESCE(?, max_stock_level),
  reorder_point = COALESCE(?, reorder_point),
  supplier_id = COALESCE(?, supplier_id),
  barcode = COALESCE(?, barcode),
  image_path = COALESCE(?, image_path),
  weight = COALESCE(?, weight),
  dimensions = COALESCE(?, dimensions),
  is_service = COALESCE(?, is_service),
  service_duration = COALESCE(?, service_duration),
  warranty_period = COALESCE(?, warranty_period),
  notes = COALESCE(?, notes),
  active = COALESCE(?, active),
  updated_at = ?,
  updated_by = ?
    WHERE id = ?
      `);

    stmt.run([
      productData.sku || null,
      productData.name || null,
      productData.description || null,
      productData.price || null,
      productData.cost || null,
      productData.category_id || null,
      productData.unit_of_measure || null,
      productData.taxable !== undefined ? (productData.taxable ? 1 : 0) : null,
      productData.tax_rate || null,
      productData.stock_quantity || null,
      productData.min_stock_level || null,
      productData.max_stock_level || null,
      productData.reorder_point || null,
      productData.supplier_id || null,
      productData.barcode || null,
      productData.image_path || null,
      productData.weight || null,
      productData.dimensions || null,
      productData.is_service !== undefined ? (productData.is_service ? 1 : 0) : null,
      productData.service_duration || null,
      productData.warranty_period || null,
      productData.notes || null,
      productData.active !== undefined ? (productData.active ? 1 : 0) : null,
      new Date().toISOString(),
      userId || 1,
      id
    ]);

    // Registrar en auditoría
    logAuditEvent('products', id, 'UPDATE', JSON.stringify(currentResult[0].values[0]), JSON.stringify(productData), userId);

    logger.info('Products', 'update_success', 'Producto actualizado', { id });

    return {
      success: true,
      message: 'Producto actualizado correctamente'
    };

  } catch (error) {
    logger.error('Products', 'update_failed', 'Error al actualizar producto', { id, ...productData }, error as Error);
    return {
      success: false,
      message: `Error al actualizar producto: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

export function deleteProduct(id: number, userId?: number): { success: boolean; message: string } {
  try {
    logger.info('Products', 'delete_start', 'Eliminando producto', { id });

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Verificar si el producto está siendo usado en facturas
    const invoiceItemsResult = db.exec('SELECT COUNT(*) as count FROM invoice_lines WHERE product_id = ?', [id]);
    const invoiceItemCount = invoiceItemsResult[0]?.values[0]?.[0] as number || 0;

    if (invoiceItemCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar el producto porque está siendo usado en ${invoiceItemCount} factura(s)`
      };
    }

    // Verificar si el producto está siendo usado en facturas de compra
    const billItemsResult = db.exec('SELECT COUNT(*) as count FROM bill_lines WHERE product_id = ?', [id]);
    const billItemCount = billItemsResult[0]?.values[0]?.[0] as number || 0;

    if (billItemCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar el producto porque está siendo usado en ${billItemCount} factura(s) de compra`
      };
    }

    // Obtener datos actuales para auditoría
    const currentResult = db.exec('SELECT * FROM products WHERE id = ?', [id]);

    // Marcar como inactivo en lugar de eliminar físicamente
    const stmt = db.prepare('UPDATE products SET active = 0, updated_at = ? WHERE id = ?');
    stmt.run([new Date().toISOString(), id]);

    // Registrar en auditoría
    logAuditEvent('products', id, 'DELETE', JSON.stringify(currentResult[0]?.values[0]), null, userId);

    logger.info('Products', 'delete_success', 'Producto eliminado', { id });

    return {
      success: true,
      message: 'Producto eliminado correctamente'
    };

  } catch (error) {
    logger.error('Products', 'delete_failed', 'Error al eliminar producto', { id }, error as Error);
    return {
      success: false,
      message: `Error al eliminar producto: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

export function getProductById(id: number): Product | null {
  try {
    if (!db) return null;

    const result = db.exec(`
SELECT
p.*,
  c.name as category_name,
  s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
  `, [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const product: any = {};

    columns.forEach((col: any, index: any) => {
      if (col === 'category_name' && row[index]) {
        product.category = { name: row[index] as string } as ProductCategory;
      } else if (col === 'supplier_name' && row[index]) {
        product.supplier = { name: row[index] as string } as Supplier;
      } else {
        product[col] = row[index];
      }
    });

    return product as Product;
  } catch (error) {
    logger.error('Products', 'get_by_id_failed', 'Error al obtener producto por ID', { id }, error as Error);
    return null;
  }
}

export function updateProductStock(productId: number, quantity: number, operation: 'add' | 'subtract'): { success: boolean; message: string } {
  try {
    logger.info('Products', 'update_stock_start', 'Actualizando stock de producto', { productId, quantity, operation });

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const product = getProductById(productId);
    if (!product) {
      return { success: false, message: 'Producto no encontrado' };
    }

    let newStock: number;
    if (operation === 'add') {
      newStock = product.stock_quantity + quantity;
    } else {
      newStock = product.stock_quantity - quantity;
      if (newStock < 0) {
        return { success: false, message: 'Stock insuficiente' };
      }
    }

    const stmt = db.prepare('UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?');
    stmt.run([newStock, new Date().toISOString(), productId]);

    // Registrar en auditoría
    logAuditEvent('products', productId, 'UPDATE',
      JSON.stringify({ stock_quantity: product.stock_quantity }),
      JSON.stringify({ stock_quantity: newStock, operation, quantity })
    );

    logger.info('Products', 'update_stock_success', 'Stock actualizado', {
      productId,
      oldStock: product.stock_quantity,
      newStock,
      operation,
      quantity
    });

    return {
      success: true,
      message: `Stock actualizado.Nuevo stock: ${newStock} `
    };

  } catch (error) {
    logger.error('Products', 'update_stock_failed', 'Error al actualizar stock', { productId, quantity, operation }, error as Error);
    return {
      success: false,
      message: `Error al actualizar stock: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

export function getProductsLowStock(): Product[] {
  try {
    logger.info('Products', 'get_low_stock_start', 'Obteniendo productos con stock bajo');

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const result = db.exec(`
SELECT
p.*,
  c.name as category_name,
  s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.active = 1 
        AND p.is_service = 0 
        AND p.stock_quantity <= p.reorder_point
      ORDER BY p.stock_quantity ASC
  `);

    if (result.length === 0) {
      return [];
    }

    const products: Product[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const product: any = {};

      columns.forEach((col: any, index: any) => {
        if (col === 'category_name' && row[index]) {
          product.category = { name: row[index] as string } as ProductCategory;
        } else if (col === 'supplier_name' && row[index]) {
          product.supplier = { name: row[index] as string } as Supplier;
        } else {
          product[col] = row[index];
        }
      });

      products.push(product as Product);
    });

    logger.info('Products', 'get_low_stock_success', 'Productos con stock bajo obtenidos', { count: products.length });
    return products;

  } catch (error) {
    logger.error('Products', 'get_low_stock_failed', 'Error al obtener productos con stock bajo', null, error as Error);
    return [];
  }
}

// ==========================================
// FUNCIONES PARA REPORTES FLORIDA DR-15
// ==========================================

/**
 * Calcula el reporte DR-15 para un período específico
 * Cumple con requisitos legales de Florida
 */
export function calculateFloridaDR15Report(period: string): FloridaDR15Report | null {
  if (!db) {
    logger.error('DR15', 'calculate_no_db', 'Base de datos no disponible');
    return null;
  }

  try {
    logger.info('DR15', 'calculate_start', 'Calculando reporte DR-15', { period });

    // Determinar rango de fechas según el período
    const { startDate, endDate } = parsePeriod(period);

    // Obtener todas las facturas del período
    const invoicesResult = db.exec(`
SELECT
i.id,
  i.subtotal,
  i.tax_amount,
  i.total_amount,
  c.florida_county,
  c.tax_exempt
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.issue_date >= ? AND i.issue_date <= ?
  AND i.status IN('sent', 'paid')
    `, [startDate, endDate]);

    if (invoicesResult.length === 0 || invoicesResult[0].values.length === 0) {
      logger.warn('DR15', 'calculate_no_data', 'No hay facturas para el período', { period });
      return createEmptyDR15Report(period);
    }

    let totalTaxableSales = 0;
    let totalTaxCollected = 0;
    let exemptSales = 0;
    const countyBreakdown: { [county: string]: { rate: number; taxableAmount: number; taxAmount: number } } = {};

    // Procesar cada factura
    invoicesResult[0].values.forEach((row: any) => {
      const subtotal = Number(row[1]) || 0;
      const taxAmount = Number(row[2]) || 0;
      const county = row[4] as string || 'Miami-Dade';
      const isExempt = Boolean(row[5]);

      if (isExempt) {
        exemptSales += subtotal;
      } else {
        totalTaxableSales += subtotal;
        totalTaxCollected += taxAmount;

        // Agrupar por condado
        if (!countyBreakdown[county]) {
          const taxRate = getFloridaTaxRate(county);
          countyBreakdown[county] = {
            rate: taxRate,
            taxableAmount: 0,
            taxAmount: 0
          };
        }

        countyBreakdown[county].taxableAmount += subtotal;
        countyBreakdown[county].taxAmount += taxAmount;
      }
    });

    // Crear el reporte
    const report: FloridaDR15Report = {
      period,
      totalTaxableSales,
      totalTaxCollected,
      countyBreakdown: Object.entries(countyBreakdown).map(([county, data]) => ({
        county,
        rate: data.rate,
        taxableAmount: data.taxableAmount,
        taxAmount: data.taxAmount
      })),
      exemptSales,
      adjustments: [], // Se pueden agregar manualmente después
      netTaxDue: totalTaxCollected,
      dueDate: calculateDueDate(period),
      status: 'pending'
    };

    logger.info('DR15', 'calculate_success', 'Reporte DR-15 calculado', {
      period,
      totalTaxableSales,
      totalTaxCollected,
      counties: Object.keys(countyBreakdown).length
    });

    return report;

  } catch (error) {
    logger.error('DR15', 'calculate_failed', 'Error al calcular reporte DR-15', { period }, error as Error);
    return null;
  }
}

/**
 * Guarda un reporte DR-15 en la base de datos
 */
export function saveDR15Report(report: FloridaDR15Report): { success: boolean; message: string; id?: number } {
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  try {
    logger.info('DR15', 'save_start', 'Guardando reporte DR-15', { period: report.period });

    // Verificar si ya existe un reporte para este período
    const existingResult = db.exec(`
      SELECT id FROM florida_tax_reports WHERE period = ?
  `, [report.period]);

    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
      return { success: false, message: `Ya existe un reporte para el período ${report.period} ` };
    }

    // Insertar reporte principal
    const insertResult = db.exec(`
      INSERT INTO florida_tax_reports(
    period, total_taxable_sales, total_tax_collected, exempt_sales,
    net_tax_due, due_date, status
  ) VALUES(?, ?, ?, ?, ?, ?, ?)
    `, [
      report.period,
      report.totalTaxableSales,
      report.totalTaxCollected,
      report.exemptSales,
      report.netTaxDue,
      report.dueDate.toISOString().split('T')[0],
      report.status
    ]);

    // Obtener el ID del reporte insertado
    const reportId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;

    // Insertar desglose por condado
    report.countyBreakdown.forEach(county => {
      db!.exec(`
        INSERT INTO florida_tax_report_counties(
      report_id, county_name, tax_rate, taxable_amount, tax_amount
    ) VALUES(?, ?, ?, ?, ?)
      `, [reportId, county.county, county.rate, county.taxableAmount, county.taxAmount]);
    });

    // Insertar ajustes si existen
    report.adjustments.forEach(adjustment => {
      db!.exec(`
        INSERT INTO florida_tax_report_adjustments(
        report_id, description, amount, type
      ) VALUES(?, ?, ?, ?)
        `, [reportId, adjustment.description, adjustment.amount, adjustment.type]);
    });

    // Registrar en auditoría
    const auditData = {
      period: report.period,
      total_tax: report.totalTaxCollected,
      counties: report.countyBreakdown.length
    };

    db.exec(`
      INSERT INTO audit_log(table_name, record_id, action, new_values, user_id, audit_hash)
VALUES(?, ?, ?, ?, ?, ?)
    `, [
      'florida_tax_reports',
      reportId,
      'INSERT',
      JSON.stringify(auditData),
      1,
      generateSimpleHash(auditData)
    ]);

    logger.info('DR15', 'save_success', 'Reporte DR-15 guardado correctamente', {
      period: report.period,
      reportId
    });

    return {
      success: true,
      message: `Reporte DR - 15 para ${report.period} guardado correctamente`,
      id: reportId
    };

  } catch (error) {
    logger.error('DR15', 'save_failed', 'Error al guardar reporte DR-15', { period: report.period }, error as Error);
    return {
      success: false,
      message: `Error al guardar reporte: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

/**
 * Obtiene todos los reportes DR-15 guardados
 */
export function getDR15Reports(): FloridaDR15Report[] {
  if (!db) {
    logger.error('DR15', 'get_reports_no_db', 'Base de datos no disponible');
    return [];
  }

  try {
    logger.info('DR15', 'get_reports_start', 'Obteniendo reportes DR-15');

    const reportsResult = db.exec(`
SELECT
id, period, total_taxable_sales, total_tax_collected, exempt_sales,
  net_tax_due, due_date, status, filed_by, filed_at
      FROM florida_tax_reports
      ORDER BY period DESC
  `);

    if (reportsResult.length === 0 || reportsResult[0].values.length === 0) {
      logger.info('DR15', 'get_reports_empty', 'No hay reportes DR-15 guardados');
      return [];
    }

    const reports: FloridaDR15Report[] = [];

    for (const row of reportsResult[0].values) {
      const reportId = row[0] as number;
      const period = row[1] as string;

      // Obtener desglose por condado
      const countiesResult = db.exec(`
        SELECT county_name, tax_rate, taxable_amount, tax_amount
        FROM florida_tax_report_counties
        WHERE report_id = ?
  `, [reportId]);

      const countyBreakdown = countiesResult.length > 0 ?
        countiesResult[0].values.map((countyRow: any) => ({
          county: countyRow[0] as string,
          rate: Number(countyRow[1]),
          taxableAmount: Number(countyRow[2]),
          taxAmount: Number(countyRow[3])
        })) : [];

      // Obtener ajustes
      const adjustmentsResult = db.exec(`
        SELECT description, amount, type
        FROM florida_tax_report_adjustments
        WHERE report_id = ?
  `, [reportId]);

      const adjustments = adjustmentsResult.length > 0 ?
        adjustmentsResult[0].values.map((adjRow: any) => ({
          description: adjRow[0] as string,
          amount: Number(adjRow[1]),
          type: adjRow[2] as 'credit' | 'debit'
        })) : [];

      const report: FloridaDR15Report = {
        period,
        totalTaxableSales: Number(row[2]) || 0,
        totalTaxCollected: Number(row[3]) || 0,
        countyBreakdown,
        exemptSales: Number(row[4]) || 0,
        adjustments,
        netTaxDue: Number(row[5]) || 0,
        dueDate: new Date(row[6] as string),
        filedBy: row[7] as number || undefined,
        filedAt: row[8] ? new Date(row[8] as string) : undefined,
        status: row[9] as 'pending' | 'filed' | 'paid' | 'late'
      };

      reports.push(report);
    }

    logger.info('DR15', 'get_reports_success', 'Reportes DR-15 obtenidos', { count: reports.length });
    return reports;

  } catch (error) {
    logger.error('DR15', 'get_reports_failed', 'Error al obtener reportes DR-15', null, error as Error);
    return [];
  }
}

/**
 * Obtiene todas las tasas de impuesto de Florida de la DB
 */
export function getAllFloridaTaxRates(): { id: number; county: string; stateRate: number; discretionaryRate: number; totalRate: number }[] {
  if (!db) return [];
  try {
    const result = db.exec("SELECT id, county_name as county, state_rate as stateRate, county_rate as discretionaryRate, total_rate as totalRate FROM florida_tax_rates");
    if (result.length === 0 || result[0].values.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any) => rowToEntity<any>(columns, row as initSqlJs.SqlValue[]));
  } catch (error) {
    console.error('Error getting all tax rates:', error);
    return [];
  }
}

/**
 * Marca un reporte DR-15 como presentado
 */
export function markDR15ReportAsFiled(period: string, filedBy: number = 1): { success: boolean; message: string } {
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  try {
    logger.info('DR15', 'mark_filed_start', 'Marcando reporte como presentado', { period, filedBy });

    const result = db.exec(`
      UPDATE florida_tax_reports 
      SET status = 'filed', filed_by = ?, filed_at = CURRENT_TIMESTAMP
      WHERE period = ?
  `, [filedBy, period]);

    logger.info('DR15', 'mark_filed_success', 'Reporte marcado como presentado', { period });

    return {
      success: true,
      message: `Reporte DR - 15 para ${period} marcado como presentado`
    };

  } catch (error) {
    logger.error('DR15', 'mark_filed_failed', 'Error al marcar reporte como presentado', { period }, error as Error);
    return {
      success: false,
      message: `Error al actualizar reporte: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

// ==========================================
// FUNCIONES AUXILIARES PARA DR-15
// ==========================================

/**
 * Parsea un período (ej: "2024-Q1") y devuelve fechas de inicio y fin
 */
function parsePeriod(period: string): { startDate: string; endDate: string } {
  const [year, quarter] = period.split('-');
  const yearNum = parseInt(year);

  if (quarter.startsWith('Q')) {
    const quarterNum = parseInt(quarter.substring(1));
    const startMonth = (quarterNum - 1) * 3 + 1;
    const endMonth = quarterNum * 3;

    return {
      startDate: `${yearNum} -${startMonth.toString().padStart(2, '0')}-01`,
      endDate: `${yearNum} -${endMonth.toString().padStart(2, '0')} -${getLastDayOfMonth(yearNum, endMonth)} `
    };
  } else {
    // Período mensual (ej: "2024-01")
    const month = parseInt(quarter);
    return {
      startDate: `${yearNum} -${month.toString().padStart(2, '0')}-01`,
      endDate: `${yearNum} -${month.toString().padStart(2, '0')} -${getLastDayOfMonth(yearNum, month)} `
    };
  }
}

/**
 * Obtiene el último día del mes
 */
function getLastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return lastDay.toString().padStart(2, '0');
}

/**
 * Calcula la fecha de vencimiento para un período
 */
function calculateDueDate(period: string): Date {
  const { endDate } = parsePeriod(period);
  const periodEnd = new Date(endDate);

  // DR-15 vence el día 20 del mes siguiente al período
  const dueDate = new Date(periodEnd);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(20);

  return dueDate;
}

/**
 * Crea un reporte DR-15 vacío para períodos sin datos
 */
function createEmptyDR15Report(period: string): FloridaDR15Report {
  return {
    period,
    totalTaxableSales: 0,
    totalTaxCollected: 0,
    countyBreakdown: [],
    exemptSales: 0,
    adjustments: [],
    netTaxDue: 0,
    dueDate: calculateDueDate(period),
    status: 'pending'
  };
}

/**
 * Genera períodos disponibles para reportes
 */
export function getAvailableDR15Periods(): string[] {
  const periods: string[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Generar últimos 8 trimestres
  for (let year = currentYear - 1; year <= currentYear; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const period = `${year} -Q${quarter} `;
      const { endDate } = parsePeriod(period);

      // Solo incluir períodos que ya han terminado
      if (new Date(endDate) < currentDate) {
        periods.push(period);
      }
    }
  }

  return periods.reverse(); // Más recientes primero
}

// ==========================================
// FUNCIONES PARA MÉTODOS DE PAGO
// ==========================================

/**
 * Obtiene todos los métodos de pago activos
 */
export function getPaymentMethods(): PaymentMethod[] {
  if (!db) {
    logger.error('PaymentMethods', 'get_no_db', 'Base de datos no disponible');
    return [];
  }

  try {
    logger.info('PaymentMethods', 'get_start', 'Obteniendo métodos de pago');

    const result = db.exec(`
      SELECT id, method_name, method_type, is_active, requires_reference, created_at
      FROM payment_methods
      WHERE is_active = 1
      ORDER BY method_name ASC
  `);

    if (result.length === 0) {
      logger.info('PaymentMethods', 'get_empty', 'No hay métodos de pago');
      return [];
    }

    const paymentMethods: PaymentMethod[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const paymentMethod: any = {};
      columns.forEach((col: any, index: any) => {
        paymentMethod[col] = row[index];
      });
      paymentMethods.push(paymentMethod as PaymentMethod);
    });

    logger.info('PaymentMethods', 'get_success', 'Métodos de pago obtenidos', { count: paymentMethods.length });
    return paymentMethods;

  } catch (error) {
    logger.error('PaymentMethods', 'get_failed', 'Error al obtener métodos de pago', null, error as Error);
    return [];
  }
}

/**
 * Obtiene todos los métodos de pago (incluyendo inactivos)
 */
export function getAllPaymentMethods(): PaymentMethod[] {
  if (!db) {
    logger.error('PaymentMethods', 'get_all_no_db', 'Base de datos no disponible');
    return [];
  }

  try {
    logger.info('PaymentMethods', 'get_all_start', 'Obteniendo todos los métodos de pago');

    const result = db.exec(`
      SELECT id, method_name, method_type, is_active, requires_reference, created_at
      FROM payment_methods
      ORDER BY method_name ASC
  `);

    if (result.length === 0) {
      logger.info('PaymentMethods', 'get_all_empty', 'No hay métodos de pago');
      return [];
    }

    const paymentMethods: PaymentMethod[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: any) => {
      const paymentMethod: any = {};
      columns.forEach((col: any, index: any) => {
        paymentMethod[col] = row[index];
      });
      paymentMethods.push(paymentMethod as PaymentMethod);
    });

    logger.info('PaymentMethods', 'get_all_success', 'Todos los métodos de pago obtenidos', { count: paymentMethods.length });
    return paymentMethods;

  } catch (error) {
    logger.error('PaymentMethods', 'get_all_failed', 'Error al obtener todos los métodos de pago', null, error as Error);
    return [];
  }
}

/**
 * Crea un nuevo método de pago
 */
export function createPaymentMethod(methodData: Omit<PaymentMethod, 'id' | 'created_at'>): { success: boolean; message: string; id?: number } {
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  try {
    logger.info('PaymentMethods', 'create_start', 'Creando método de pago', methodData);

    // Verificar que no exista un método con el mismo nombre
    const existingResult = db.exec(`
      SELECT id FROM payment_methods WHERE method_name = ?
  `, [methodData.method_name]);

    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
      return { success: false, message: `Ya existe un método de pago con el nombre "${methodData.method_name}"` };
    }

    // Insertar nuevo método de pago
    db.exec(`
      INSERT INTO payment_methods(method_name, method_type, is_active, requires_reference)
VALUES(?, ?, ?, ?)
  `, [
      methodData.method_name,
      methodData.method_type,
      methodData.is_active ? 1 : 0,
      methodData.requires_reference ? 1 : 0
    ]);

    // Obtener el ID del método insertado
    const newId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;

    // Registrar en auditoría
    const auditData = {
      method_name: methodData.method_name,
      method_type: methodData.method_type,
      is_active: methodData.is_active
    };

    db.exec(`
      INSERT INTO audit_log(table_name, record_id, action, new_values, user_id, audit_hash)
VALUES(?, ?, ?, ?, ?, ?)
    `, [
      'payment_methods',
      newId,
      'INSERT',
      JSON.stringify(auditData),
      1,
      generateSimpleHash(auditData)
    ]);

    logger.info('PaymentMethods', 'create_success', 'Método de pago creado correctamente', {
      id: newId,
      method_name: methodData.method_name
    });

    return {
      success: true,
      message: `Método de pago "${methodData.method_name}" creado correctamente`,
      id: newId
    };

  } catch (error) {
    logger.error('PaymentMethods', 'create_failed', 'Error al crear método de pago', methodData, error as Error);
    return {
      success: false,
      message: `Error al crear método de pago: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

/**
 * Actualiza un método de pago existente
 */
export function updatePaymentMethod(id: number, methodData: Partial<PaymentMethod>): { success: boolean; message: string } {
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  try {
    logger.info('PaymentMethods', 'update_start', 'Actualizando método de pago', { id, ...methodData });

    // Verificar que el método existe
    const existingResult = db.exec(`
      SELECT id, method_name FROM payment_methods WHERE id = ?
  `, [id]);

    if (existingResult.length === 0 || existingResult[0].values.length === 0) {
      return { success: false, message: 'Método de pago no encontrado' };
    }

    const currentName = existingResult[0].values[0][1] as string;

    // Si se está cambiando el nombre, verificar que no exista otro con el mismo nombre
    if (methodData.method_name && methodData.method_name !== currentName) {
      const duplicateResult = db.exec(`
        SELECT id FROM payment_methods WHERE method_name = ? AND id != ?
  `, [methodData.method_name, id]);

      if (duplicateResult.length > 0 && duplicateResult[0].values.length > 0) {
        return { success: false, message: `Ya existe un método de pago con el nombre "${methodData.method_name}"` };
      }
    }

    // Construir la consulta de actualización dinámicamente
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (methodData.method_name !== undefined) {
      updateFields.push('method_name = ?');
      updateValues.push(methodData.method_name);
    }

    if (methodData.method_type !== undefined) {
      updateFields.push('method_type = ?');
      updateValues.push(methodData.method_type);
    }

    if (methodData.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(methodData.is_active ? 1 : 0);
    }

    if (methodData.requires_reference !== undefined) {
      updateFields.push('requires_reference = ?');
      updateValues.push(methodData.requires_reference ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return { success: false, message: 'No hay campos para actualizar' };
    }

    updateValues.push(id);

    // Ejecutar actualización
    db.exec(`
      UPDATE payment_methods 
      SET ${updateFields.join(', ')}
      WHERE id = ?
  `, updateValues);

    // Registrar en auditoría
    db.exec(`
      INSERT INTO audit_log(table_name, record_id, action, new_values, user_id, audit_hash)
VALUES(?, ?, ?, ?, ?, ?)
    `, [
      'payment_methods',
      id,
      'UPDATE',
      JSON.stringify(methodData),
      1,
      generateSimpleHash(methodData)
    ]);

    logger.info('PaymentMethods', 'update_success', 'Método de pago actualizado correctamente', { id });

    return {
      success: true,
      message: 'Método de pago actualizado correctamente'
    };

  } catch (error) {
    logger.error('PaymentMethods', 'update_failed', 'Error al actualizar método de pago', { id, ...methodData }, error as Error);
    return {
      success: false,
      message: `Error al actualizar método de pago: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

/**
 * Elimina un método de pago (soft delete - marca como inactivo)
 */
export function deletePaymentMethod(id: number): { success: boolean; message: string } {
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  try {
    logger.info('PaymentMethods', 'delete_start', 'Eliminando método de pago', { id });

    // Verificar que el método existe
    const existingResult = db.exec(`
      SELECT id, method_name FROM payment_methods WHERE id = ?
  `, [id]);

    if (existingResult.length === 0 || existingResult[0].values.length === 0) {
      return { success: false, message: 'Método de pago no encontrado' };
    }

    const methodName = existingResult[0].values[0][1] as string;

    // Verificar si el método está siendo usado en pagos
    const usageResult = db.exec(`
      SELECT COUNT(*) as count FROM(
    SELECT 1 FROM payments WHERE payment_method = ?
      UNION ALL
        SELECT 1 FROM supplier_payments WHERE payment_method = ?
      )
  `, [methodName.toLowerCase().replace(' ', '_'), methodName.toLowerCase().replace(' ', '_')]);

    const usageCount = usageResult[0].values[0][0] as number;

    if (usageCount > 0) {
      // Si está en uso, solo marcar como inactivo
      db.exec(`
        UPDATE payment_methods 
        SET is_active = 0
        WHERE id = ?
  `, [id]);

      logger.info('PaymentMethods', 'delete_soft', 'Método de pago marcado como inactivo (en uso)', { id, methodName });

      return {
        success: true,
        message: `Método de pago "${methodName}" desactivado(estaba en uso en ${usageCount} transacciones)`
      };
    } else {
      // Si no está en uso, eliminar completamente
      db.exec(`
        DELETE FROM payment_methods WHERE id = ?
  `, [id]);

      // Registrar en auditoría
      db.exec(`
        INSERT INTO audit_log(table_name, record_id, action, old_values, user_id, audit_hash)
VALUES(?, ?, ?, ?, ?, ?)
      `, [
        'payment_methods',
        id,
        'DELETE',
        JSON.stringify({ method_name: methodName }),
        1,
        generateSimpleHash({ method_name: methodName })
      ]);

      logger.info('PaymentMethods', 'delete_hard', 'Método de pago eliminado completamente', { id, methodName });

      return {
        success: true,
        message: `Método de pago "${methodName}" eliminado correctamente`
      };
    }

  } catch (error) {
    logger.error('PaymentMethods', 'delete_failed', 'Error al eliminar método de pago', { id }, error as Error);
    return {
      success: false,
      message: `Error al eliminar método de pago: ${error instanceof Error ? error.message : 'Error desconocido'} `
    };
  }
}

/**
 * Obtiene un método de pago por ID
 */
export function getPaymentMethodById(id: number): PaymentMethod | null {
  if (!db) {
    logger.error('PaymentMethods', 'get_by_id_no_db', 'Base de datos no disponible');
    return null;
  }

  try {
    logger.info('PaymentMethods', 'get_by_id_start', 'Obteniendo método de pago por ID', { id });

    const result = db.exec(`
      SELECT id, method_name, method_type, is_active, requires_reference, created_at
      FROM payment_methods
      WHERE id = ?
  `, [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      logger.warn('PaymentMethods', 'get_by_id_not_found', 'Método de pago no encontrado', { id });
      return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;

    const paymentMethod: any = {};
    columns.forEach((col: any, index: any) => {
      paymentMethod[col] = row[index];
    });

    logger.info('PaymentMethods', 'get_by_id_success', 'Método de pago obtenido', { id });
    return paymentMethod as PaymentMethod;

  } catch (error) {
    logger.error('PaymentMethods', 'get_by_id_failed', 'Error al obtener método de pago', { id }, error as Error);
    return null;
  }
}

/**
 * Verifica si se puede eliminar un método de pago
 */
export function canDeletePaymentMethod(id: number): { canDelete: boolean; reason?: string } {
  if (!db) {
    return { canDelete: false, reason: 'Base de datos no disponible' };
  }

  try {
    // Verificar que el método existe
    const existingResult = db.exec(`
      SELECT method_name FROM payment_methods WHERE id = ?
  `, [id]);

    if (existingResult.length === 0 || existingResult[0].values.length === 0) {
      return { canDelete: false, reason: 'Método de pago no encontrado' };
    }

    const methodName = existingResult[0].values[0][0] as string;

    // Verificar si está siendo usado
    const usageResult = db.exec(`
      SELECT COUNT(*) as count FROM(
    SELECT 1 FROM payments WHERE payment_method = ?
      UNION ALL
        SELECT 1 FROM supplier_payments WHERE payment_method = ?
      )
    `, [methodName.toLowerCase().replace(' ', '_'), methodName.toLowerCase().replace(' ', '_')]);

    const usageCount = usageResult[0].values[0][0] as number;

    if (usageCount > 0) {
      return {
        canDelete: false,
        reason: `El método de pago está siendo usado en ${usageCount} transacciones.Solo se puede desactivar.`
      };
    }

    return { canDelete: true };

  } catch (error) {
    logger.error('PaymentMethods', 'can_delete_failed', 'Error al verificar si se puede eliminar método de pago', { id }, error as Error);
    return { canDelete: false, reason: 'Error al verificar el método de pago' };
  }
}
// ==========================================
// FUNCIONES PARA CUENTAS BANCARIAS
// ==========================================

/**
 * Obtiene todas las cuentas bancarias
 */
export function getBankAccounts(): BankAccount[] {
  if (!db) {
    logger.error('BankAccounts', 'get_all_no_db', 'Base de datos no disponible');
    return [];
  }

  try {
    const result = db.exec("SELECT * FROM bank_accounts ORDER BY account_name");

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    return result[0].values.map((row: any) => {
      const account: any = {};
      columns.forEach((col: any, index: any) => {
        account[col] = row[index];
      });
      return account as BankAccount;
    });
  } catch (error) {
    logger.error('BankAccounts', 'get_failed', 'Error al obtener cuentas bancarias', null, error as Error);
    return [];
  }
}

/**
 * Obtiene una cuenta bancaria por ID
 */
export function getBankAccountById(id: number): BankAccount | null {
  if (!db) return null;

  try {
    const result = db.exec("SELECT * FROM bank_accounts WHERE id = ?", [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const account: any = {};

    columns.forEach((col: any, index: any) => {
      account[col] = row[index];
    });

    return account as BankAccount;
  } catch (error) {
    logger.error('BankAccounts', 'get_by_id_failed', 'Error al obtener cuenta bancaria', { id }, error as Error);
    return null;
  }
}

/**
 * Crea una nueva cuenta bancaria
 */
export function createBankAccount(data: Omit<BankAccount, 'id' | 'created_at'>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    const stmt = db.prepare(`
      INSERT INTO bank_accounts(
        account_name, bank_name, account_number, account_type,
        routing_number, balance, currency, is_active, notes
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

    stmt.run([
      data.account_name,
      data.bank_name,
      data.account_number,
      data.account_type,
      data.routing_number || null,
      data.balance || 0,
      data.currency || 'USD',
      data.is_active ? 1 : 0,
      data.notes || null
    ]);

    const idResult = db.exec("SELECT last_insert_rowid()");
    const id = idResult[0].values[0][0] as number;

    // Auditoría
    db.exec(`
      INSERT INTO audit_log(table_name, record_id, action, new_values, user_id, audit_hash)
VALUES(?, ?, ?, ?, ?, ?)
    `, [
      'bank_accounts',
      id,
      'INSERT',
      JSON.stringify(data),
      1,
      generateSimpleHash(data)
    ]);

    logger.info('BankAccounts', 'create_success', 'Cuenta bancaria creada', { id });
    return { success: true, message: 'Cuenta bancaria creada correctamente', id };
  } catch (error) {
    logger.error('BankAccounts', 'create_failed', 'Error al crear cuenta bancaria', null, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

/**
 * Actualiza una cuenta bancaria existente
 */
export function updateBankAccount(id: number, data: Partial<BankAccount>): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Lista de campos actualizables
    const fields = ['account_name', 'bank_name', 'account_number', 'account_type', 'routing_number', 'balance', 'currency', 'is_active', 'notes'];

    fields.forEach(field => {
      if ((data as any)[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        let val = (data as any)[field];
        if (typeof val === 'boolean') val = val ? 1 : 0;
        updateValues.push(val);
      }
    });

    if (updateFields.length === 0) {
      return { success: false, message: 'No hay datos para actualizar' };
    }

    updateValues.push(id);

    const stmt = db.prepare(`UPDATE bank_accounts SET ${updateFields.join(', ')} WHERE id = ? `);
    stmt.run(updateValues);

    // Auditoría
    db.exec(`
      INSERT INTO audit_log(table_name, record_id, action, new_values, user_id, audit_hash)
VALUES(?, ?, ?, ?, ?, ?)
  `, [
      'bank_accounts',
      id,
      'UPDATE',
      JSON.stringify(data),
      1,
      generateSimpleHash(data)
    ]);

    logger.info('BankAccounts', 'update_success', 'Cuenta bancaria actualizada', { id });
    return { success: true, message: 'Cuenta bancaria actualizada correctamente' };
  } catch (error) {
    logger.error('BankAccounts', 'update_failed', 'Error al actualizar cuenta bancaria', { id }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

/**
 * Elimina una cuenta bancaria (o la desactiva si tiene saldo)
 */
export function deleteBankAccount(id: number): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    // Verificar saldo
    const account = getBankAccountById(id);
    if (!account) return { success: false, message: 'Cuenta no encontrada' };

    if (account.balance !== 0) {
      return { success: false, message: 'No se puede eliminar una cuenta con saldo diferente a 0. Ajuste el saldo o desactívela.' };
    }

    // Por seguridad, preferimos Soft Delete para bancos
    db.exec("UPDATE bank_accounts SET is_active = 0 WHERE id = ?", [id]);

    // Auditoría
    db.exec(`
      INSERT INTO audit_log(table_name, record_id, action, old_values, user_id, audit_hash)
VALUES(?, ?, ?, ?, ?, ?)
  `, [
      'bank_accounts',
      id,
      'DELETE', // Marcamos como DELETE en auditoría aunque sea soft delete para indicar la intención
      JSON.stringify(account),
      1,
      generateSimpleHash(account)
    ]);

    logger.info('BankAccounts', 'delete_success', 'Cuenta bancaria desactivada/eliminada', { id });
    return { success: true, message: 'Cuenta bancaria eliminada correctamente' };
  } catch (error) {
    logger.error('BankAccounts', 'delete_failed', 'Error al eliminar cuenta bancaria', { id }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

// ==========================================
// FUNCIONES DE CONCILIACI�N BANCARIA
// ==========================================

/**
 * Obtiene todos los estados de conciliaci�n
 */
export function getReconciliationStatements(accountId?: number): ReconciliationStatement[] {
  if (!db) return [];
  try {
    let query = "SELECT * FROM reconciliation_statements";
    const params: any[] = [];

    if (accountId) {
      query += " WHERE bank_account_id = ?";
      params.push(accountId);
    }

    query += " ORDER BY statement_date DESC";

    const res = db.exec(query, params);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<ReconciliationStatement>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching reconciliation statements:', e);
    return [];
  }
}

/**
 * Crea un nuevo estado de conciliaci�n
 */
export function createReconciliationStatement(data: Omit<ReconciliationStatement, 'id' | 'created_at' | 'difference'>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const stmt = db.prepare(`
      INSERT INTO reconciliation_statements (bank_account_id, statement_date, statement_balance, system_balance, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      data.bank_account_id,
      data.statement_date,
      data.statement_balance,
      data.system_balance,
      data.status || 'pending',
      data.notes || null
    ]);

    const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();

    return { success: true, message: 'Estado de conciliaci�n creado', id };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

/**
 * Obtiene transacciones bancarias no conciliadas
 */
export function getUnreconciledTransactions(accountId: number): BankTransaction[] {
  if (!db) return [];
  try {
    const res = db.exec(`
      SELECT bt.* FROM bank_transactions bt
      LEFT JOIN reconciliation_matches rm ON bt.id = rm.bank_transaction_id
      WHERE bt.bank_account_id = ? AND rm.id IS NULL AND bt.status = 'pending'
      ORDER BY bt.transaction_date DESC
    `, [accountId]);

    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<BankTransaction>(res[0].columns, row));
  } catch (e) {
    console.error('Error fetching unreconciled transactions:', e);
    return [];
  }
}

/**
 * Busca asientos contables similares para matching
 */
export function findSimilarJournalEntries(transaction: BankTransaction): JournalEntry[] {
  if (!db) return [];
  try {
    // Buscar por monto exacto y fecha cercana (�3 d�as)
    const res = db.exec(`
      SELECT je.* FROM journal_entries je
      WHERE ABS(je.total_debit - ?) < 0.01 
      AND ABS(JULIANDAY(je.entry_date) - JULIANDAY(?)) <= 3
      AND je.id NOT IN (
        SELECT COALESCE(rm.journal_entry_id, 0) FROM reconciliation_matches rm WHERE rm.journal_entry_id IS NOT NULL
      )
      ORDER BY ABS(JULIANDAY(je.entry_date) - JULIANDAY(?)) ASC
      LIMIT 5
    `, [Math.abs(transaction.amount), transaction.transaction_date, transaction.transaction_date]);

    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<JournalEntry>(res[0].columns, row));
  } catch (e) {
    console.error('Error finding similar journal entries:', e);
    return [];
  }
}

/**
 * Crea un match de conciliaci�n
 */
export function createReconciliationMatch(data: Omit<ReconciliationMatch, 'id' | 'matched_at'>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare(`
      INSERT INTO reconciliation_matches (statement_id, bank_transaction_id, journal_entry_id, match_confidence, match_type, matched_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      data.statement_id,
      data.bank_transaction_id,
      data.journal_entry_id || null,
      data.match_confidence,
      data.match_type || 'manual',
      data.matched_by || null,
      data.notes || null
    ]);

    const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();

    // Actualizar estado de la transacci�n bancaria
    db.run("UPDATE bank_transactions SET status = 'matched' WHERE id = ?", [data.bank_transaction_id]);

    db.run("COMMIT");
    return { success: true, message: 'Match de conciliaci�n creado', id };
  } catch (e: any) {
    db.run("ROLLBACK");
    return { success: false, message: e.message };
  }
}

/**
 * Auto-matching inteligente de transacciones
 */
export function autoMatchTransactions(statementId: number): { success: boolean; message: string; matchesFound: number } {
  if (!db) return { success: false, message: 'Database not initialized', matchesFound: 0 };

  try {
    // Obtener el statement
    const statementRes = db.exec("SELECT * FROM reconciliation_statements WHERE id = ?", [statementId]);
    if (statementRes.length === 0) {
      return { success: false, message: 'Statement no encontrado', matchesFound: 0 };
    }

    const statement = rowToEntity<ReconciliationStatement>(statementRes[0].columns, statementRes[0].values[0]);

    // Obtener transacciones no conciliadas
    const transactions = getUnreconciledTransactions(statement.bank_account_id);
    let matchesFound = 0;

    for (const transaction of transactions) {
      const similarEntries = findSimilarJournalEntries(transaction);

      if (similarEntries.length > 0) {
        const bestMatch = similarEntries[0];
        const confidence = calculateMatchConfidence(transaction, bestMatch);

        if (confidence >= 0.8) { // Solo auto-match con alta confianza
          const result = createReconciliationMatch({
            statement_id: statementId,
            bank_transaction_id: transaction.id,
            journal_entry_id: bestMatch.id,
            match_confidence: confidence,
            match_type: 'automatic',
            matched_by: undefined
          });

          if (result.success) {
            matchesFound++;
          }
        }
      }
    }

    return { success: true, message: `${matchesFound} matches autom�ticos creados`, matchesFound };
  } catch (e: any) {
    return { success: false, message: e.message, matchesFound: 0 };
  }
}

/**
 * Calcula la confianza de un match
 */
function calculateMatchConfidence(transaction: BankTransaction, entry: JournalEntry): number {
  let confidence = 0;

  // Mismo monto: +40%
  if (Math.abs(Math.abs(transaction.amount) - entry.total_debit) < 0.01) {
    confidence += 0.4;
  }

  // Fecha cercana: +30% (m�ximo si es el mismo d�a)
  const daysDiff = Math.abs(new Date(transaction.transaction_date).getTime() - new Date(entry.entry_date).getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff <= 3) {
    confidence += 0.3 * (1 - daysDiff / 3);
  }

  // Descripci�n similar: +20%
  if (transaction.description && entry.description) {
    const similarity = calculateStringSimilarity(transaction.description.toLowerCase(), entry.description.toLowerCase());
    confidence += 0.2 * similarity;
  }

  // Referencia similar: +10%
  if (transaction.reference_number && entry.reference_number && transaction.reference_number === entry.reference_number) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}

/**
 * Calcula similitud entre strings (algoritmo simple)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  let matches = 0;
  for (const word1 of words1) {
    if (word1.length > 2 && words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      matches++;
    }
  }

  return matches / Math.max(words1.length, words2.length);
}

/**
 * Obtiene todos los movimientos de inventario
 */
export function getInventoryMovements(): any[] {
  if (!db) return [];
  try {
    const result = db.exec(`
      SELECT m.*, p.name as product_name, p.sku as product_sku 
      FROM inventory_movements m
      JOIN products p ON m.product_id = p.id
      ORDER BY m.date DESC
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    return result[0].values.map((row: any) => {
      const obj: any = {};
      columns.forEach((col: any, index: any) => {
        obj[col] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return [];
  }
}

// ==========================================
// REPORTES CONTABLES: BALANCE DE COMPROBACIÓN
// ==========================================

export interface TrialBalanceRow {
  account_code: string;
  account_name: string;
  account_type: string;
  normal_balance: 'debit' | 'credit';
  previous_debit: number;
  previous_credit: number;
  period_debit: number;
  period_credit: number;
  total_debit: number;
  total_credit: number;
  initial_balance: number;
  final_balance: number;
}

export function getTrialBalanceReport(year: number, month: number): TrialBalanceRow[] {
  if (!db) return [];

  try {
    const startDate = `${year} -${String(month).padStart(2, '0')}-01`;
    const nextMonth = new Date(year, month, 0);
    const endDate = nextMonth.toISOString().split('T')[0];

    const query = `
SELECT
ca.account_code,
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
      GROUP BY ca.account_code, ca.account_name, ca.account_type, ca.normal_balance
      HAVING prev_debit != 0 OR prev_credit != 0 OR period_debit != 0 OR period_credit != 0
      ORDER BY ca.account_code ASC
  `;

    const result = db.exec(query, [startDate, startDate, startDate, endDate, startDate, endDate]);

    if (!result.length || !result[0].values.length) return [];

    return result[0].values.map((row: any) => {
      const account_code = String(row[0]);
      const account_name = String(row[1]);
      const account_type = String(row[2]);
      const normal_balance = row[3] as 'debit' | 'credit';
      const previous_debit = Number(row[4]);
      const previous_credit = Number(row[5]);
      const debit = Number(row[6]);
      const credit = Number(row[7]);

      let initial_balance = 0;
      if (normal_balance === 'debit') {
        initial_balance = previous_debit - previous_credit;
      } else {
        initial_balance = previous_credit - previous_debit;
      }

      const total_debit = previous_debit + debit;
      const total_credit = previous_credit + credit;

      let final_balance = 0;
      if (normal_balance === 'debit') {
        final_balance = total_debit - total_credit;
      } else {
        final_balance = total_credit - total_debit;
      }

      return {
        account_code,
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
  } catch (e) {
    return [];
  }
}

export function validateAccountingIntegrity(): { isValid: boolean; errors: string[] } {
  if (!db) return { isValid: false, errors: ['Database not initialized'] };
  const errors: string[] = [];

  const res = db.exec("SELECT id, entry_date, description, total_debit, total_credit FROM journal_entries WHERE ABS(total_debit - total_credit) > 0.001");
  if (res.length && res[0].values.length > 0) {
    res[0].values.forEach((row: any) => {
      errors.push(`Asiento #${row[0]} (${row[1]}) descuadrado por $${Math.abs(Number(row[3]) - Number(row[4])).toFixed(2)} `);
    });
  }

  return { isValid: errors.length === 0, errors };
}


// ==========================================
// REPORTES CONTABLES: ESTADO DE RESULTADOS (P&L)
// ==========================================

export interface IncomeStatementItem {
  account_code: string;
  account_name: string;
  account_type: string;
  balance: number;
}

export function getIncomeStatementReport(startDate: string, endDate: string): IncomeStatementItem[] {
  if (!db) return [];

  try {
    const query = `
SELECT
ca.account_code,
  ca.account_name,
  ca.account_type,
  SUM(jd.debit_amount) as total_debit,
  SUM(jd.credit_amount) as total_credit
      FROM chart_of_accounts ca
      JOIN journal_details jd ON ca.account_code = jd.account_code
      JOIN journal_entries je ON jd.journal_entry_id = je.id
WHERE
je.entry_date BETWEEN '${startDate}' AND '${endDate}' AND
  (LOWER(ca.account_type) = 'revenue' OR LOWER(ca.account_type) = 'expense')
      GROUP BY ca.account_code, ca.account_name, ca.account_type
      ORDER BY ca.account_code ASC
    `;

    const result = db.exec(query);
    if (!result.length || !result[0].values.length) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any) => {
      const r: any = {};
      columns.forEach((col: any, i: any) => r[col] = row[i]);

      const type = String(r.account_type).toLowerCase();
      const debit = Number(r.total_debit);
      const credit = Number(r.total_credit);

      let netBalance = 0;

      // Calcular saldo neto según naturaleza
      // Revenue (Ventas): Acreedor (Crédito aumenta) -> Saldo = Crédito - Débito
      // Expense (Gastos): Deudor (Débito aumenta) -> Saldo = Débito - Crédito
      if (type === 'revenue') {
        netBalance = credit - debit;
      } else {
        // expense
        netBalance = debit - credit;
      }

      return {
        account_code: String(r.account_code),
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

// ==========================================
// MÓDULO 20: CONCILIACIÓN BANCARIA - FUNCIONES
// ==========================================

export const insertBankTransactions = (
  transactions: Partial<BankTransaction>[]
): { success: boolean; message: string; importedCount: number } => {
  if (!db) return { success: false, message: 'Database not initialized', importedCount: 0 };

  try {
    db.run('BEGIN TRANSACTION');
    let count = 0;

    // Generar batch ID único
    const batchId = `BATCH - ${Date.now()} -${Math.floor(Math.random() * 1000)} `;

    const stmt = db.prepare(`
      INSERT INTO bank_transactions(
    bank_account_id, transaction_date, description, amount, reference_number,
    status, import_batch_id
  ) VALUES(?, ?, ?, ?, ?, ?, ?)
    `);

    for (const txn of transactions) {
      if (!txn.bank_account_id || !txn.transaction_date || !txn.amount) continue;

      stmt.run([
        txn.bank_account_id,
        txn.transaction_date,
        txn.description || 'Imported Transaction',
        txn.amount,
        txn.reference_number || null,
        'pending',
        batchId
      ]);
      count++;
    }

    stmt.free();
    db.run('COMMIT');
    return { success: true, message: 'Transactions imported successfully', importedCount: count };
  } catch (error) {
    db.run('ROLLBACK');
    logger.error('Database', 'import_bank_txn_failed', 'Error importing bank transactions', { error });
    return { success: false, message: `Error importing transactions: ${error instanceof Error ? error.message : 'Unknown error'} `, importedCount: 0 };
  }
};

export const getBankTransactions = (
  accountId: number,
  status?: 'pending' | 'matched' | 'ignored'
): BankTransaction[] => {
  if (!db) return [];
  try {
    let query = `SELECT * FROM bank_transactions WHERE bank_account_id = ${accountId} `;
    if (status) {
      query += ` AND status = '${status}'`;
    }
    query += ` ORDER BY transaction_date DESC`;

    const result = db.exec(query);
    if (!result.length || !result[0].values.length) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any) => rowToEntity<BankTransaction>(columns, row));
  } catch (error) {
    logger.error('Database', 'get_bank_txn_failed', 'Error getting bank entries', { accountId }, error as Error);
    return [];
  }
};

export interface MatchCandidate {
  entry: JournalEntry;
  confidence: number;
  matchType: 'exact' | 'fuzzy_date' | 'amount_only';
  reason: string;
}

export const findPotentialMatches = (transaction: BankTransaction): MatchCandidate[] => {
  if (!db) return [];
  try {
    // FORENSIC IMPLEMENTATION: Precision Matching
    // 1. Usar tolerancia de centavos para evitar errores de punto flotante
    const targetAmount = Math.abs(transaction.amount);
    const tolerance = 0.01;

    // 2. Definir ventana de búsqueda optimizada (±7 días)
    const txnDate = new Date(transaction.transaction_date);
    const minDate = new Date(txnDate); minDate.setDate(minDate.getDate() - 7);
    const maxDate = new Date(txnDate); maxDate.setDate(maxDate.getDate() + 7);

    // SQLite dates are strings YYYY-MM-DD
    const minDateStr = minDate.toISOString().split('T')[0];
    const maxDateStr = maxDate.toISOString().split('T')[0];

    // 3. Ejecutar búsqueda indexable
    const query = `
SELECT * FROM journal_entries 
      WHERE ABS(total_debit - ${targetAmount}) < ${tolerance}
      AND entry_date BETWEEN '${minDateStr}' AND '${maxDateStr}'
      ORDER BY entry_date ASC
    `;

    const result = db.exec(query);
    if (!result.length || !result[0].values.length) return [];

    const columns = result[0].columns;
    const entries = result[0].values.map((row: any) => rowToEntity<JournalEntry>(columns, row));

    const candidates: MatchCandidate[] = [];

    for (const entry of entries) {
      const entryDate = new Date(entry.entry_date);
      // Calcular diferencia en días (ignorando horas)
      const diffTime = Math.abs(txnDate.getTime() - entryDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let confidence = 0;
      let matchType: 'exact' | 'fuzzy_date' | 'amount_only' = 'amount_only';
      let reason = '';

      if (diffDays === 0) {
        confidence = 1.0;
        matchType = 'exact';
        reason = 'Monto exacto y fecha exacta (100%)';
      } else if (diffDays <= 1) {
        confidence = 0.95;
        matchType = 'fuzzy_date';
        reason = `Monto exacto, diferencia de 1 día`;
      } else if (diffDays <= 3) {
        confidence = 0.80;
        matchType = 'fuzzy_date';
        reason = `Monto exacto, diferencia de ${diffDays} días`;
      } else {
        confidence = 0.50;
        matchType = 'amount_only';
        reason = `Monto coincide, fecha distante(${diffDays} días)`;
      }

      // Buscar detalles para enriquecer contexto (si es posible)
      // (Opcional en fase MVP, pero robusto para el futuro)

      candidates.push({ entry, confidence, matchType, reason });
    }

    // Ordenar por confianza descendente
    return candidates.sort((a, b) => b.confidence - a.confidence);

  } catch (error) {
    logger.error('Database', 'find_matches_failed', 'Error finding matches (Forensic Logic)', { txId: transaction.id }, error as Error);
    return [];
  }
};

/**
 * Confirma una conciliación entre una transacción bancaria y un asiento contable
 * FORENSIC IMPLEMENTATION: Updates status, links IDs, and logs to AUDIT CHAIN
 */
export const confirmMatch = (bankTransactionId: number, journalEntryId: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    // 1. Verificar estado actual
    const txCheck = db.exec(`SELECT status, amount FROM bank_transactions WHERE id = ${bankTransactionId} `);
    if (!txCheck[0] || !txCheck[0].values.length) {
      throw new Error('Transacción bancaria no encontrada');
    }
    const currentStatus = txCheck[0].values[0][0];

    if (currentStatus === 'matched') {
      throw new Error('La transacción ya está conciliada');
    }

    // 2. Actualizar transacción
    db.run(`
      UPDATE bank_transactions 
      SET status = 'matched', matched_journal_entry_id = ?, match_confidence = 1.0
      WHERE id = ?
  `, [journalEntryId, bankTransactionId]);

    // 3. Insertar en Audit Chain (Inmutabilidad)
    const timestamp = new Date().toISOString();
    const auditData = { bankTransactionId, journalEntryId, timestamp };
    const auditHash = generateSimpleHash(auditData); // Placeholder for real crypto hash

    db.run(`
      INSERT INTO audit_chain(table_name, record_id, action, old_value, new_value, user_id, timestamp, current_hash)
VALUES('bank_transactions', ?, 'MATCH', 'pending', 'matched', 1, ?, ?)
    `, [bankTransactionId, timestamp, auditHash]);

    db.run('COMMIT');
    return { success: true, message: 'Conciliación confirmada correctamente' };

  } catch (error) {
    db.run('ROLLBACK');
    logger.error('Database', 'confirm_match_failed', 'Error matching transaction', { bankTransactionId, journalEntryId }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido al conciliar' };
  }
};

/**
 * Deshace una conciliación existente
 */
export const unmatchTransaction = (bankTransactionId: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    // 1. Obtener datos anteriores para auditoría
    const txCheck = db.exec(`SELECT matched_journal_entry_id FROM bank_transactions WHERE id = ${bankTransactionId} `);
    if (!txCheck[0] || !txCheck[0].values.length) throw new Error('Transacción no encontrada');

    const previousMatchId = txCheck[0].values[0][0];

    // 2. Revertir estado
    db.run(`
      UPDATE bank_transactions 
      SET status = 'pending', matched_journal_entry_id = NULL, match_confidence = NULL
      WHERE id = ?
  `, [bankTransactionId]);

    // 3. Registrar en Audit Chain
    const timestamp = new Date().toISOString();
    const auditData = { bankTransactionId, action: 'UNMATCH', previousMatchId, timestamp };
    const auditHash = generateSimpleHash(auditData);

    db.run(`
      INSERT INTO audit_chain(table_name, record_id, action, old_value, new_value, user_id, timestamp, current_hash)
VALUES('bank_transactions', ?, 'UNMATCH', 'matched', 'pending', 1, ?, ?)
    `, [bankTransactionId, timestamp, auditHash]);

    db.run('COMMIT');
    return { success: true, message: 'Conciliación revertida correctamente' };

  } catch (error) {
    db.run('ROLLBACK');
    logger.error('Database', 'unmatch_failed', 'Error unmatching transaction', { bankTransactionId }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido al desconciliar' };
  }
};

export const restoreDatabaseFromBackup = async (data: Uint8Array): Promise<void> => {
  try {
    if (opfsRoot) {
      const fileHandle = await (opfsRoot as any).getFileHandle(DB_NAME, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(data as any);
      await writable.close();
      logger.info('Database', 'restore_success', 'Backup restaurado en OPFS');
    } else {
      // LocalStorage Fallback (Limited support)
      logger.warn('Database', 'restore_warning', 'Restaurando en modo sin OPFS (experimental)');
    }

    // Force reload
    window.location.reload();
  } catch (e) {
    logger.error('Database', 'restore_error', 'Fallo al restaurar backup', null, e as Error);
    throw e;
  }
};

// ==========================================
// GESTIÓN DE USUARIOS Y ROLES
// ==========================================

/**
 * Hash de contraseña usando PBKDF2 (compatible con Web Crypto API)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generar salt aleatorio
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Importar password como clave
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derivar hash usando PBKDF2 (NASA/OWASP 2024: 600k iterations)
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 600000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  // Combinar salt + hash en formato base64
  const hashArray = new Uint8Array(hashBuffer);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  return btoa(String.fromCharCode(...combined));
};

/**
 * Verificar contraseña contra hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);

    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 600000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const computedHash = new Uint8Array(hashBuffer);

    // Comparación constante en tiempo
    if (computedHash.length !== storedHash.length) return false;
    let diff = 0;
    for (let i = 0; i < computedHash.length; i++) {
      diff |= computedHash[i] ^ storedHash[i];
    }
    return diff === 0;
  } catch (error) {
    logger.error('Auth', 'verify_password_failed', 'Error verifying password', {}, error as Error);
    return false;
  }
};



/**
 * Crear un nuevo usuario
 */
export const createUser = async (userData: {
  username: string;
  email?: string;
  full_name?: string;
  display_name: string;
  password: string;
  role_id: number;
}): Promise<{ success: boolean; message: string; userId?: number }> => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validar que el username o email no exista
    const emailToCheck = userData.email || userData.username;
    const existing = db.exec(`SELECT id FROM users WHERE username = ? OR email = ? `, [userData.username, emailToCheck]);
    if (existing[0]?.values.length > 0) {
      return { success: false, message: 'El nombre de usuario o email ya existe' };
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(userData.password);

    // Insertar usuario
    db.run(`
      INSERT INTO users(username, email, full_name, display_name, password_hash, role_id, is_active)
VALUES(?, ?, ?, ?, ?, ?, 1)
    `, [
      userData.username,
      userData.email || userData.username,
      userData.full_name || userData.display_name,
      userData.display_name,
      passwordHash,
      userData.role_id
    ]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const userId = result[0]?.values[0]?.[0] as number;

    logger.info('Users', 'user_created', `Usuario creado: ${userData.username} `, { userId });

    return { success: true, message: 'Usuario creado correctamente', userId };
  } catch (error) {
    logger.error('Users', 'create_user_failed', 'Error creating user', { username: userData.username }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

/**
 * Obtener todos los usuarios
 */
export const getUsers = (filters?: { activeOnly?: boolean }): any[] => {
  if (!db) return [];

  try {
    let query = `
      SELECT u.id, u.username, u.email, u.full_name, u.display_name, u.role_id, u.is_active,
  u.last_login, u.created_at, u.updated_at,
  r.name as role_name, r.description as role_description, r.level as role_level,
  r.permissions_json
      FROM users u
      LEFT JOIN user_roles r ON u.role_id = r.id
  `;

    if (filters?.activeOnly) {
      query += ' WHERE u.is_active = 1';
    }

    query += ' ORDER BY u.created_at DESC';

    const result = db.exec(query);
    if (!result[0]) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any) => {
      const user: any = {};
      columns.forEach((col: any, index: any) => {
        user[col] = row[index];
      });
      return user;
    });
  } catch (error) {
    logger.error('Users', 'get_users_failed', 'Error getting users', {}, error as Error);
    return [];
  }
};

/**
 * Obtener usuario por username
 */
export const getUserByUsername = (username: string): any | null => {
  if (!db) return null;

  try {
    const result = db.exec(`
      SELECT u.id, u.username, u.email, u.full_name, u.display_name, u.password_hash, u.role_id, u.is_active,
  u.last_login, u.created_at, u.updated_at,
  r.name as role_name, r.description as role_description, r.level as role_level,
  r.permissions_json
      FROM users u
      LEFT JOIN user_roles r ON u.role_id = r.id
      WHERE u.username = ? OR u.email = ?
  `, [username, username]);

    if (!result[0] || result[0].values.length === 0) return null;

    const columns = result[0].columns;
    const row = result[0].values[0];
    const user: any = {};
    columns.forEach((col: any, index: any) => {
      user[col] = row[index];
    });

    return user;
  } catch (error) {
    logger.error('Users', 'get_user_failed', 'Error getting user by username', { username }, error as Error);
    return null;
  }
};

/**
 * Actualizar usuario
 */
export const updateUser = (id: number, updates: {
  email?: string;
  full_name?: string;
  display_name?: string;
  role_id?: number;
  is_active?: boolean;
  last_login?: string;
}): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const setParts: string[] = [];
    const values: any[] = [];

    if (updates.email !== undefined) {
      setParts.push('email = ?');
      values.push(updates.email);
    }
    if (updates.full_name !== undefined) {
      setParts.push('full_name = ?');
      values.push(updates.full_name);
    }
    if (updates.display_name !== undefined) {
      setParts.push('display_name = ?');
      values.push(updates.display_name);
    }
    if (updates.role_id !== undefined) {
      setParts.push('role_id = ?');
      values.push(updates.role_id);
    }
    if (updates.is_active !== undefined) {
      setParts.push('is_active = ?');
      values.push(updates.is_active ? 1 : 0);
    }
    if (updates.last_login !== undefined) {
      setParts.push('last_login = ?');
      values.push(updates.last_login);
    }

    setParts.push('updated_at = CURRENT_TIMESTAMP');

    if (setParts.length === 1) {
      return { success: false, message: 'No hay cambios para actualizar' };
    }

    values.push(id);

    db.run(`UPDATE users SET ${setParts.join(', ')} WHERE id = ? `, values);

    logger.info('Users', 'user_updated', `Usuario actualizado: ${id} `, { updates });

    return { success: true, message: 'Usuario actualizado correctamente' };
  } catch (error) {
    logger.error('Users', 'update_user_failed', 'Error updating user', { id, updates }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

/**
 * Desactivar usuario (soft delete)
 */
export const deactivateUser = (id: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    logger.info('Users', 'user_deactivated', `Usuario desactivado: ${id} `);

    return { success: true, message: 'Usuario desactivado correctamente' };
  } catch (error) {
    logger.error('Users', 'deactivate_user_failed', 'Error deactivating user', { id }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

/**
 * Obtener todos los roles
 */
export const getUserRoles = (): any[] => {
  if (!db) return [];

  try {
    const result = db.exec('SELECT * FROM user_roles ORDER BY level DESC');
    if (!result[0]) return [];

    const columns = result[0].columns;
    return result[0].values.map((row: any) => {
      const role: any = {};
      columns.forEach((col: any, index: any) => {
        role[col] = row[index];
      });
      return role;
    });
  } catch (error) {
    logger.error('Users', 'get_roles_failed', 'Error getting user roles', {}, error as Error);
    return [];
  }
};

/**
 * Actualizar contraseña de usuario
 */
export const updateUserPassword = async (id: number, newPassword: string): Promise<{ success: boolean; message: string }> => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const passwordHash = await hashPassword(newPassword);

    db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [passwordHash, id]);

    logger.info('Users', 'password_updated', `Contraseña actualizada para usuario: ${id} `);

    return { success: true, message: 'Contraseña actualizada correctamente' };
  } catch (error) {
    logger.error('Users', 'update_password_failed', 'Error updating password', { id }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

// Añadir al final de simple-db.ts

// ==========================================
// GESTIÓN DE ROLES (CRUD COMPLETO)
// ==========================================

/**
 * Crear un nuevo rol
 */
export const createUserRole = (roleData: {
  name: string;
  description: string;
  level: number;
}): { success: boolean; message: string; roleId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validar que el nombre no exista
    const existing = db.exec(`SELECT id FROM user_roles WHERE name = '${roleData.name}'`);
    if (existing[0]?.values.length > 0) {
      return { success: false, message: 'Ya existe un rol con ese nombre' };
    }

    // Insertar rol
    db.run(`
      INSERT INTO user_roles(name, description, level)
VALUES(?, ?, ?)
    `, [roleData.name, roleData.description, roleData.level]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const roleId = result[0]?.values[0]?.[0] as number;

    logger.info('Roles', 'role_created', `Rol creado: ${roleData.name} `, { roleId });

    return { success: true, message: 'Rol creado correctamente', roleId };
  } catch (error) {
    logger.error('Roles', 'create_role_failed', 'Error creating role', { name: roleData.name }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

/**
 * Actualizar un rol existente
 */
export const updateUserRole = (id: number, updates: {
  name?: string;
  description?: string;
  level?: number;
}): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar que el rol existe
    const roleCheck = db.exec(`SELECT id FROM user_roles WHERE id = ${id} `);
    if (!roleCheck[0] || roleCheck[0].values.length === 0) {
      return { success: false, message: 'Rol no encontrado' };
    }

    // Si se está cambiando el nombre, verificar que no exista otro con ese nombre
    if (updates.name) {
      const existing = db.exec(`SELECT id FROM user_roles WHERE name = '${updates.name}' AND id != ${id} `);
      if (existing[0]?.values.length > 0) {
        return { success: false, message: 'Ya existe otro rol con ese nombre' };
      }
    }

    const setParts: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      setParts.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setParts.push('description = ?');
      values.push(updates.description);
    }
    if (updates.level !== undefined) {
      setParts.push('level = ?');
      values.push(updates.level);
    }

    if (setParts.length === 0) {
      return { success: false, message: 'No hay cambios para actualizar' };
    }

    values.push(id);

    db.run(`UPDATE user_roles SET ${setParts.join(', ')} WHERE id = ? `, values);

    logger.info('Roles', 'role_updated', `Rol actualizado: ${id} `, { updates });

    return { success: true, message: 'Rol actualizado correctamente' };
  } catch (error) {
    logger.error('Roles', 'update_role_failed', 'Error updating role', { id, updates }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

/**
 * Eliminar un rol (solo si no tiene usuarios asignados)
 */
export const deleteUserRole = (id: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar que el rol existe
    const roleCheck = db.exec(`SELECT name FROM user_roles WHERE id = ${id} `);
    if (!roleCheck[0] || roleCheck[0].values.length === 0) {
      return { success: false, message: 'Rol no encontrado' };
    }

    const roleName = roleCheck[0].values[0][0] as string;

    // No permitir eliminar roles del sistema (admin, accountant, viewer)
    if (['admin', 'accountant', 'viewer'].includes(roleName)) {
      return { success: false, message: 'No se pueden eliminar los roles del sistema' };
    }

    // Verificar que no haya usuarios con este rol
    const usersWithRole = db.exec(`SELECT COUNT(*) as count FROM users WHERE role_id = ${id} `);
    const userCount = usersWithRole[0]?.values[0]?.[0] as number || 0;

    if (userCount > 0) {
      return { success: false, message: `No se puede eliminar el rol porque tiene ${userCount} usuario(s) asignado(s)` };
    }

    // Eliminar rol
    db.run('DELETE FROM user_roles WHERE id = ?', [id]);

    logger.info('Roles', 'role_deleted', `Rol eliminado: ${roleName} `, { id });

    return { success: true, message: 'Rol eliminado correctamente' };
  } catch (error) {
    logger.error('Roles', 'delete_role_failed', 'Error deleting role', { id }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};
// ==========================================
// MÓDULO DE COMPRAS Y STOCK (CRUD)
// ==========================================

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  order_number: string;
  order_date: string;
  expected_date?: string;
  status: 'draft' | 'sent' | 'approved' | 'received' | 'cancelled';
  total_amount: number;
  notes?: string;
  items?: PurchaseOrderItem[];
  supplier_name?: string; // Join
  created_at?: string;
  created_by?: number;
}

export interface PurchaseOrderItem {
  id?: number;
  purchase_order_id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  received_quantity?: number;
  product_name?: string; // Join
}

export interface StockMovement {
  id: number;
  product_id: number;
  quantity: number;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'initial';
  reference_id: number;
  reference_type: 'invoice' | 'purchase_order' | 'adjustment' | 'migration';
  notes?: string;
  created_at: string;
  created_by: number;
}

export const getPurchaseOrders = (filters: { status?: string, supplier_id?: number } = {}): PurchaseOrder[] => {
  if (!db) return [];
  try {
    let query = `
      SELECT po.*, s.name as supplier_name 
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE 1 = 1
  `;
    const params: any[] = [];

    if (filters.status) {
      query += ` AND po.status = ? `;
      params.push(filters.status);
    }
    if (filters.supplier_id) {
      query += ` AND po.supplier_id = ? `;
      params.push(filters.supplier_id);
    }

    query += ` ORDER BY po.created_at DESC`;

    const res = db.exec(query, params);
    if (res.length > 0 && res[0].values.length > 0) {
      const cols = res[0].columns;
      return res[0].values.map((row: any) => {
        const po: any = {};
        cols.forEach((col: any, i: any) => po[col] = row[i]);
        return po as PurchaseOrder;
      });
    }
    return [];
  } catch (e) {
    logger.error('PurchaseOrders', 'get', 'Error fetching POs', e);
    return [];
  }
};

export const createPurchaseOrder = (order: Omit<PurchaseOrder, 'id'>): { success: boolean, id?: number, message?: string } => {
  if (!db) return { success: false, message: 'DB not initialized' };
  try {
    db.run('BEGIN TRANSACTION');

    // 1. Insert header
    db.run(`
      INSERT INTO purchase_orders(supplier_id, order_number, order_date, expected_date, status, total_amount, notes, created_by)
VALUES(?, ?, ?, ?, ?, ?, ?, ?)
  `, [
      order.supplier_id,
      order.order_number,
      order.order_date,
      order.expected_date || null,
      order.status || 'draft',
      order.total_amount,
      order.notes || null,
      order.created_by || 1
    ]);

    const res = db.exec('SELECT last_insert_rowid() as id');
    const poId = res[0].values[0][0];

    // 2. Insert items
    if (order.items && order.items.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO purchase_order_lines(purchase_order_id, product_id, quantity, unit_price)
VALUES(?, ?, ?, ?)
      `);
      for (const item of order.items) {
        stmt.run([poId, item.product_id, item.quantity, item.unit_price]);
      }
      stmt.free();
    }

    logAuditEvent('purchase_orders', poId as number, 'create', null, { order_number: order.order_number }, order.created_by || 1);

    db.run('COMMIT');
    return { success: true, id: poId as number };
  } catch (e) {
    db.run('ROLLBACK');
    logger.error('PurchaseOrders', 'create', 'Failed to create PO', e);
    return { success: false, message: (e as Error).message };
  }
};

export const receivePurchaseOrder = (poId: number, userId: number = 1): { success: boolean, message?: string } => {
  if (!db) return { success: false, message: 'DB not initialized' };
  try {
    // 1. Obtener items de la orden
    const res = db.exec(`SELECT * FROM purchase_order_lines WHERE purchase_order_id = ? `, [poId]);
    if (res.length === 0 || res[0].values.length === 0) {
      return { success: false, message: 'Order has no items' };
    }

    const cols = res[0].columns;
    const items = res[0].values.map((row: any) => {
      const item: any = {};
      cols.forEach((col: any, i: any) => item[col] = row[i]);
      return item as PurchaseOrderItem;
    });

    db.run('BEGIN TRANSACTION');

    // 2. Actualizar estado de la orden
    db.run(`UPDATE purchase_orders SET status = 'received', updated_at = CURRENT_TIMESTAMP WHERE id = ? `, [poId]);

    // 3. Procesar cada item: aumentar stock y registrar movimiento
    for (const item of items) {
      // A. Actualizar cantidad recibida en la línea (asumimos recepción total por simplicidad en v1)
      db.run(`UPDATE purchase_order_lines SET received_quantity = ? WHERE id = ? `, [item.quantity, item.id as number]);

      // B. Actualizar Maestro de Productos
      db.run(`UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ? `, [item.quantity, item.product_id]);

      // C. Registrar Movimiento en Kardex
      db.run(`
            INSERT INTO stock_movements(product_id, quantity, movement_type, reference_id, reference_type, created_by)
VALUES(?, ?, 'purchase', ?, 'purchase_order', ?)
  `, [item.product_id, item.quantity, poId, userId]);
    }

    logAuditEvent('purchase_orders', poId, 'receive', null, { status: 'received' }, userId);

    db.run('COMMIT');
    return { success: true };
  } catch (e) {
    db.run('ROLLBACK');
    logger.error('PurchaseOrders', 'receive', 'Failed to receive PO', e);
    return { success: false, message: (e as Error).message };
  }
};

export const getStockMovements = (productId?: number): StockMovement[] => {
  if (!db) return [];
  try {
    let query = "SELECT * FROM stock_movements";
    const params: any[] = [];
    if (productId) {
      query += " WHERE product_id = ?";
      params.push(productId);
    }
    query += " ORDER BY created_at DESC LIMIT 100";

    const res = db.exec(query, params);
    if (res.length > 0 && res[0].values.length > 0) {
      const cols = res[0].columns;
      return res[0].values.map((row: any) => {
        const sm: any = {};
        cols.forEach((col: any, i: any) => sm[col] = row[i]);
        return sm as StockMovement;
      });
    }
    return [];
  } catch (e) {
    return [];
  }
};

// Validar y asegurar esquema de inventario avanzado
const ensureInventorySchema = async (): Promise<void> => {
  if (!db) return;

  // 1. Tabla de Ajustes de Inventario (Header)
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_adjustments(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adjustment_number TEXT UNIQUE NOT NULL,
    adjustment_date DATE DEFAULT CURRENT_DATE,
    reason TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN('draft', 'applied', 'cancelled')),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
  `);

  // 2. Tabla de Items de Ajuste
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_adjustment_items(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adjustment_id INTEGER NOT NULL REFERENCES inventory_adjustments(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity_adjustment INTEGER NOT NULL, --Puede ser negativo
      current_stock_snapshot INTEGER, --Stock antes del ajuste
      notes TEXT
  )
  `);

  // 3. Trigger para ventas (Impacto automático en Kardex y Stock)
  // Sincroniza la venta (Invoice) con el inventario
  try {
    db.run(`
      CREATE TRIGGER IF NOT EXISTS decrease_stock_on_invoice
      AFTER INSERT ON invoice_lines
BEGIN
--1. Reducir stock físico
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;

--2. Registrar movimiento en Kardex
        INSERT INTO stock_movements(product_id, quantity, movement_type, reference_id, reference_type, created_by)
VALUES(NEW.product_id, -NEW.quantity, 'sale', NEW.invoice_id, 'invoice', 1);
END;
`);
    logger.info('Database', 'trigger_created', 'Trigger decrease_stock_on_invoice verificado');
  } catch (e) {
    logger.warn('Database', 'trigger_error', 'No se pudo crear trigger de inventario', e);
  }
};

// ==========================================
// KARDEX SYSTEM COMPONENT
// ==========================================

export interface KardexEntry extends StockMovement {
  product_name: string;
  product_sku: string;
  user_name?: string;
  formatted_date?: string;
}

export const getKardexMovements = (filters: KardexFilters = {}): KardexEntry[] => {
  if (!db) return [];
  try {
    let query = `
SELECT
sm.*,
  p.name as product_name,
  p.sku as product_sku,
  u.display_name as user_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE 1 = 1
  `;

    const params: any[] = [];

    if (filters.productId) {
      query += ` AND sm.product_id = ? `;
      params.push(filters.productId);
    }

    if (filters.type) {
      query += ` AND sm.movement_type = ? `;
      params.push(filters.type);
    }

    if (filters.startDate) {
      query += ` AND date(sm.created_at) >= date(?)`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND date(sm.created_at) <= date(?)`;
      params.push(filters.endDate);
    }

    if (filters.referenceId) {
      query += ` AND sm.reference_id = ? `;
      params.push(filters.referenceId);
    }

    // Ordenamiento: Si filtramos por producto, ASC para calcular running totals en UI.
    // Si es vista general, DESC para ver lo último.
    if (filters.productId) {
      query += ` ORDER BY sm.created_at ASC`;
    } else {
      query += ` ORDER BY sm.created_at DESC`;
    }

    const res = db.exec(query, params);
    if (res.length > 0 && res[0].values.length > 0) {
      const cols = res[0].columns;
      return res[0].values.map((row: any) => {
        const item: any = {};
        cols.forEach((col: any, i: any) => item[col] = row[i]);
        // Format date friendly
        try {
          item.formatted_date = new Date(item.created_at).toLocaleString();
        } catch (e) { item.formatted_date = item.created_at; }
        return item as KardexEntry;
      });
    }
    return [];
  } catch (e) {
    logger.error('Kardex', 'get_movements', 'Error fetching Kardex', e);
    return [];
  }
};


// ==========================================
// FUNCIONES CRUD PARA SISTEMA DE INVENTARIO
// ==========================================

/**
 * Crear un nuevo movimiento de inventario
 */
export function createInventoryMovement(movementData: {
  product_id: number;
  quantity: number;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'initial';
  reference_id?: number;
  reference_type?: 'invoice' | 'purchase_order' | 'adjustment' | 'migration';
  notes?: string;
  created_by?: number;
}): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO stock_movements(
        product_id, quantity, movement_type, reference_id, reference_type, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      movementData.product_id,
      movementData.quantity,
      movementData.movement_type,
      movementData.reference_id || null,
      movementData.reference_type || null,
      movementData.notes || null,
      movementData.created_by || 1
    ]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const movementId = result[0]?.values[0]?.[0] as number;

    // Actualizar stock del producto
    if (movementData.movement_type === 'purchase' || movementData.movement_type === 'return') {
      // Entrada de inventario
      db.run('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [movementData.quantity, movementData.product_id]);
    } else if (movementData.movement_type === 'sale' || movementData.movement_type === 'adjustment') {
      // Salida de inventario
      db.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [Math.abs(movementData.quantity), movementData.product_id]);
    }

    stmt.free();
    db.run('COMMIT');

    logger.info('Inventory', 'movement_created', `Movimiento de inventario creado: ${movementId}`, { movementData });
    return { success: true, message: 'Movimiento de inventario creado exitosamente', id: movementId };

  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Inventory', 'movement_create_failed', 'Error al crear movimiento de inventario', { error: error.message });
    return { success: false, message: error.message };
  }
}

/**
 * Obtener movimientos de inventario con filtros
 */
export function getInventoryMovementsWithFilters(filters: {
  productId?: number;
  movementType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
} = {}): any[] {
  if (!db) return [];

  try {
    let query = `
      SELECT 
        sm.*,
        p.name as product_name,
        p.sku as product_sku,
        u.display_name as created_by_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters.productId) {
      query += ' AND sm.product_id = ?';
      params.push(filters.productId);
    }

    if (filters.movementType) {
      query += ' AND sm.movement_type = ?';
      params.push(filters.movementType);
    }

    if (filters.startDate) {
      query += ' AND date(sm.created_at) >= date(?)';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND date(sm.created_at) <= date(?)';
      params.push(filters.endDate);
    }

    query += ' ORDER BY sm.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const res = db.exec(query, params);
    if (res.length === 0) return [];

    return res[0].values.map((row: any) => rowToEntity<any>(res[0].columns, row));
  } catch (error) {
    logger.error('Inventory', 'get_movements_failed', 'Error al obtener movimientos de inventario', { error });
    return [];
  }
}

/**
 * Crear una nueva ubicaci�n/almac�n
 */
export function createLocation(locationData: {
  name: string;
  code: string;
  address?: string;
  description?: string;
  is_active?: boolean;
  created_by?: number;
}): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar que el c�digo no exista
    const existingLocation = db.exec('SELECT id FROM locations WHERE code = ?', [locationData.code]);
    if (existingLocation[0] && existingLocation[0].values.length > 0) {
      return { success: false, message: `El c�digo de ubicaci�n ${locationData.code} ya existe` };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO locations(name, code, address, description, is_active, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      locationData.name,
      locationData.code,
      locationData.address || null,
      locationData.description || null,
      locationData.is_active !== false ? 1 : 0,
      locationData.created_by || 1,
      locationData.created_by || 1
    ]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const locationId = result[0]?.values[0]?.[0] as number;

    stmt.free();
    db.run('COMMIT');

    logger.info('Inventory', 'location_created', `Ubicaci�n creada: ${locationId}`, { locationData });
    return { success: true, message: 'Ubicaci�n creada exitosamente', id: locationId };

  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Inventory', 'location_create_failed', 'Error al crear ubicaci�n', { error: error.message });
    return { success: false, message: error.message };
  }
}

/**
 * Obtener todas las ubicaciones
 */
export function getLocations(activeOnly: boolean = true): any[] {
  if (!db) return [];

  try {
    let query = 'SELECT * FROM locations';
    const params: any[] = [];

    if (activeOnly) {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY name ASC';

    const res = db.exec(query, params);
    if (res.length === 0) return [];

    return res[0].values.map((row: any) => rowToEntity<any>(res[0].columns, row));
  } catch (error) {
    logger.error('Inventory', 'get_locations_failed', 'Error al obtener ubicaciones', { error });
    return [];
  }
}

/**
 * Actualizar una ubicaci�n
 */
export function updateLocation(id: number, locationData: {
  name?: string;
  code?: string;
  address?: string;
  description?: string;
  is_active?: boolean;
  updated_by?: number;
}): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar que la ubicaci�n existe
    const existingLocation = db.exec('SELECT id FROM locations WHERE id = ?', [id]);
    if (!existingLocation[0] || existingLocation[0].values.length === 0) {
      return { success: false, message: 'Ubicaci�n no encontrada' };
    }

    // Si se est� cambiando el c�digo, verificar que no exista
    if (locationData.code) {
      const codeExists = db.exec('SELECT id FROM locations WHERE code = ? AND id != ?', [locationData.code, id]);
      if (codeExists[0] && codeExists[0].values.length > 0) {
        return { success: false, message: `El c�digo ${locationData.code} ya est� en uso` };
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (locationData.name !== undefined) {
      updates.push('name = ?');
      params.push(locationData.name);
    }

    if (locationData.code !== undefined) {
      updates.push('code = ?');
      params.push(locationData.code);
    }

    if (locationData.address !== undefined) {
      updates.push('address = ?');
      params.push(locationData.address);
    }

    if (locationData.description !== undefined) {
      updates.push('description = ?');
      params.push(locationData.description);
    }

    if (locationData.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(locationData.is_active ? 1 : 0);
    }

    updates.push('updated_by = ?', 'updated_at = CURRENT_TIMESTAMP');
    params.push(locationData.updated_by || 1);

    params.push(id);

    db.run(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`, params);

    logger.info('Inventory', 'location_updated', `Ubicaci�n actualizada: ${id}`, { locationData });
    return { success: true, message: 'Ubicaci�n actualizada exitosamente' };

  } catch (error: any) {
    logger.error('Inventory', 'location_update_failed', 'Error al actualizar ubicaci�n', { error: error.message });
    return { success: false, message: error.message };
  }
}

/**
 * Eliminar una ubicaci�n
 */
export function deleteLocation(id: number, userId: number = 1): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar que la ubicaci�n existe
    const existingLocation = db.exec('SELECT id, name FROM locations WHERE id = ?', [id]);
    if (!existingLocation[0] || existingLocation[0].values.length === 0) {
      return { success: false, message: 'Ubicaci�n no encontrada' };
    }

    const locationName = existingLocation[0].values[0][1] as string;

    // En lugar de eliminar f�sicamente, marcar como inactiva
    db.run('UPDATE locations SET is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [userId, id]);

    logger.info('Inventory', 'location_deleted', `Ubicaci�n desactivada: ${id} - ${locationName}`, { userId });
    return { success: true, message: `Ubicaci�n "${locationName}" desactivada exitosamente` };

  } catch (error: any) {
    logger.error('Inventory', 'location_delete_failed', 'Error al eliminar ubicaci�n', { error: error.message });
    return { success: false, message: error.message };
  }
}

/**
 * Crear datos iniciales de ubicaciones
 */
export function createInitialLocations(): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar si ya existen ubicaciones
    const existingLocations = db.exec('SELECT COUNT(*) as count FROM locations');
    const locationCount = existingLocations[0]?.values[0]?.[0] as number || 0;

    if (locationCount > 0) {
      return { success: true, message: 'Las ubicaciones ya existen' };
    }

    const initialLocations = [
      { name: 'Almac�n Principal', code: 'ALM-001', address: 'Bodega Central', description: 'Almac�n principal de la empresa' },
      { name: 'Tienda', code: 'TDA-001', address: 'Local comercial', description: '�rea de ventas al p�blico' },
      { name: 'Oficina', code: 'OFC-001', address: '�rea administrativa', description: 'Suministros de oficina' }
    ];

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO locations(name, code, address, description, is_active, created_by, updated_by)
      VALUES (?, ?, ?, ?, 1, 1, 1)
    `);

    initialLocations.forEach(location => {
      stmt.run([location.name, location.code, location.address, location.description]);
    });

    stmt.free();
    db.run('COMMIT');

    logger.info('Inventory', 'initial_locations_created', `Ubicaciones iniciales creadas: ${initialLocations.length}`);
    return { success: true, message: `${initialLocations.length} ubicaciones iniciales creadas exitosamente` };

  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Inventory', 'initial_locations_failed', 'Error al crear ubicaciones iniciales', { error: error.message });
    return { success: false, message: error.message };
  }
}


// ==========================================
// BUDGETS (PRESUPUESTOS) - CRUD FUNCTIONS
// ==========================================

/**
 * Helper: Get account name by account number
 */
function getAccountNameByNumber(accountNumber: number): string | null {
  if (!db) return null;
  try {
    const res = db.exec('SELECT name FROM chart_of_accounts WHERE code = ?', [accountNumber.toString()]);
    if (res.length === 0 || res[0].values.length === 0) return null;
    return res[0].values[0][0] as string;
  } catch (error) {
    return null;
  }
}

/**
 * Helper: Generate budget periods for a budget line
 */
function generateBudgetPeriods(
  lineId: number,
  fiscalYear: number,
  annualAmount: number,
  distributionType: 'EQUAL' | 'CUSTOM' | 'ZERO'
): void {
  const monthlyAmount = distributionType === 'EQUAL'
    ? Math.round(annualAmount / 12)
    : 0;

  for (let month = 1; month <= 12; month++) {
    const lastDay = getLastDayOfMonth(fiscalYear, month);
    const periodStartDate = `${fiscalYear}-${month.toString().padStart(2, '0')}-01`;
    const periodEndDate = `${fiscalYear}-${month.toString().padStart(2, '0')}-${lastDay}`;

    db?.run(`
      INSERT INTO budget_periods (
        budget_line_id, period_type, period_number,
        period_start_date, period_end_date, budgeted_amount
      ) VALUES (?, 'MONTHLY', ?, ?, ?, ?)
    `, [lineId, month, periodStartDate, periodEndDate, monthlyAmount]);
  }
}

/**
 * Create a new budget with lines and periods.
 *
 * Validates CP-1 (Balance Invariant): Sum of lines = total budget (±1 cent tolerance)
 * Uses transactions for atomicity.
 */
export function createBudget(
  budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'>,
  budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[]
): { success: boolean; message: string; id?: number } {
  if (!db) {
    return { success: false, message: 'Database not initialized' };
  }

  try {
    // Validate CP-1: Balance Invariant
    const linesTotal = budgetLines.reduce((sum, line) => sum + line.annual_amount, 0);
    if (Math.abs(linesTotal - budgetData.total_budget_amount) > 1) {
      return {
        success: false,
        message: `Total de líneas (${(linesTotal / 100).toFixed(2)}) no coincide con total del presupuesto (${(budgetData.total_budget_amount / 100).toFixed(2)})`
      };
    }

    db.run('BEGIN TRANSACTION');

    // Insert budget
    db.exec(`
      INSERT INTO budgets (
        budget_name, fiscal_year, start_date, end_date, status,
        total_budget_amount, department, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      budgetData.budget_name,
      budgetData.fiscal_year,
      budgetData.start_date,
      budgetData.end_date,
      budgetData.status,
      budgetData.total_budget_amount,
      budgetData.department || null,
      budgetData.notes || null,
      budgetData.created_by || null
    ]);

    const budgetId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

    // Insert budget lines
    for (const line of budgetLines) {
      db.exec(`
        INSERT INTO budget_lines (
          budget_id, account_number, annual_amount, distribution_type, notes
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        budgetId,
        line.account_number,
        line.annual_amount,
        line.distribution_type,
        line.notes || null
      ]);

      const lineId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

      // Generate periods for this line
      generateBudgetPeriods(lineId, budgetData.fiscal_year, line.annual_amount, line.distribution_type);
    }

    db.run('COMMIT');

    // Audit logging
    AuditTrailService.logAction({
      user_id: budgetData.created_by || 1,
      action: 'CREATE',
      entity_type: 'budget',
      entity_id: budgetId.toString(),
      new_value: JSON.stringify({ budget_name: budgetData.budget_name, fiscal_year: budgetData.fiscal_year, total: budgetData.total_budget_amount })
    });

    logger.info('Budgets', 'budget_created', `Presupuesto creado: ${budgetData.budget_name}`, { budgetId, linesCount: budgetLines.length });
    return { success: true, message: 'Presupuesto creado exitosamente', id: budgetId };

  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Budgets', 'budget_creation_failed', 'Error al crear presupuesto', { error: error.message });
    return { success: false, message: error.message };
  }
}

/**
 * Get all budgets with optional filters.
 * Implements role-based access control.
 */
export function getBudgets(filters?: {
  fiscal_year?: number;
  status?: string;
  userId?: number;
  role?: string;
}): Budget[] {
  if (!db) return [];

  try {
    let query = 'SELECT * FROM budgets WHERE 1=1';
    const params: any[] = [];

    if (filters?.fiscal_year) {
      query += ' AND fiscal_year = ?';
      params.push(filters.fiscal_year);
    }

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    // Role-based access
    const privilegedRoles = ['admin', 'contador', 'auditor'];
    if (filters?.userId && filters?.role && !privilegedRoles.includes(filters.role)) {
      query += ' AND created_by = ?';
      params.push(filters.userId);
    }

    query += ' ORDER BY fiscal_year DESC, budget_name ASC';

    const res = db.exec(query, params);
    if (res.length === 0) return [];

    return res[0].values.map((row: any) => rowToEntity<Budget>(res[0].columns, row));
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
}

/**
 * Get budget by ID.
 */
export function getBudgetById(id: number): Budget | null {
  if (!db) return null;

  try {
    const res = db.exec('SELECT * FROM budgets WHERE id = ?', [id]);
    if (res.length === 0 || res[0].values.length === 0) return null;

    return rowToEntity<Budget>(res[0].columns, res[0].values[0]);
  } catch (error) {
    console.error('Error fetching budget:', error);
    return null;
  }
}

/**
 * Get budget lines for a budget.
 */
export function getBudgetLines(budgetId: number): BudgetLine[] {
  if (!db) return [];

  try {
    const res = db.exec('SELECT * FROM budget_lines WHERE budget_id = ? ORDER BY account_number ASC', [budgetId]);
    if (res.length === 0) return [];

    return res[0].values.map((row: any) => rowToEntity<BudgetLine>(res[0].columns, row));
  } catch (error) {
    console.error('Error fetching budget lines:', error);
    return [];
  }
}

/**
 * Get budget periods for a budget line.
 */
export function getBudgetPeriods(budgetLineId: number): BudgetPeriod[] {
  if (!db) return [];

  try {
    const res = db.exec('SELECT * FROM budget_periods WHERE budget_line_id = ? ORDER BY period_number ASC', [budgetLineId]);
    if (res.length === 0) return [];

    return res[0].values.map((row: any) => rowToEntity<BudgetPeriod>(res[0].columns, row));
  } catch (error) {
    console.error('Error fetching budget periods:', error);
    return [];
  }
}

/**
 * Update a budget.
 * Validates CP-3: Only DRAFT budgets can have lines edited.
 */
export function updateBudget(
  id: number,
  budgetData: Partial<Budget>,
  budgetLines?: Partial<BudgetLine>[]
): { success: boolean; message: string } {
  if (!db) {
    return { success: false, message: 'Database not initialized' };
  }

  try {
    const existing = getBudgetById(id);
    if (!existing) {
      return { success: false, message: 'Presupuesto no encontrado' };
    }

    // Prevent editing if status is not DRAFT
    if (existing.status !== 'DRAFT' && budgetLines) {
      return { success: false, message: 'No se puede editar un presupuesto que no está en borrador' };
    }

    db.run('BEGIN TRANSACTION');

    // Update budget master
    const updates: string[] = [];
    const params: any[] = [];

    if (budgetData.budget_name !== undefined) {
      updates.push('budget_name = ?');
      params.push(budgetData.budget_name);
    }
    if (budgetData.status !== undefined) {
      updates.push('status = ?');
      params.push(budgetData.status);
    }
    if (budgetData.department !== undefined) {
      updates.push('department = ?');
      params.push(budgetData.department);
    }
    if (budgetData.notes !== undefined) {
      updates.push('notes = ?');
      params.push(budgetData.notes);
    }
    if (budgetData.updated_by !== undefined) {
      updates.push('updated_by = ?');
      params.push(budgetData.updated_by);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    if (updates.length > 1) {
      db.run(`UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Update budget lines if provided
    if (budgetLines) {
      // Delete existing lines and periods (CASCADE will delete periods)
      db.run('DELETE FROM budget_lines WHERE budget_id = ?', [id]);

      // Recalculate total
      const newTotal = budgetLines.reduce((sum, line) => sum + (line.annual_amount || 0), 0);

      // Insert new lines
      for (const line of budgetLines) {
        db.exec(`
          INSERT INTO budget_lines (
            budget_id, account_number, annual_amount, distribution_type, notes
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          id,
          line.account_number,
          line.annual_amount,
          line.distribution_type || 'EQUAL',
          line.notes || null
        ]);

        const lineId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

        // Generate periods
        generateBudgetPeriods(lineId, existing.fiscal_year, line.annual_amount || 0, line.distribution_type || 'EQUAL');
      }

      // Update total
      db.run('UPDATE budgets SET total_budget_amount = ? WHERE id = ?', [newTotal, id]);
    }

    db.run('COMMIT');

    // Audit logging
    AuditTrailService.logAction({
      user_id: budgetData.updated_by || 1,
      action: 'UPDATE',
      entity_type: 'budget',
      entity_id: id.toString(),
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

/**
 * Delete a budget.
 * Validates CP-3: Only DRAFT budgets can be deleted.
 */
export function deleteBudget(id: number): { success: boolean; message: string } {
  if (!db) {
    return { success: false, message: 'Database not initialized' };
  }

  try {
    const existing = getBudgetById(id);
    if (!existing) {
      return { success: false, message: 'Presupuesto no encontrado' };
    }

    // Only allow deleting DRAFT budgets
    if (existing.status !== 'DRAFT') {
      return { success: false, message: 'Solo se pueden eliminar presupuestos en borrador' };
    }

    db.run('DELETE FROM budgets WHERE id = ?', [id]);

    // Audit logging
    AuditTrailService.logAction({
      user_id: 1, // System user for deletions
      action: 'DELETE',
      entity_type: 'budget',
      entity_id: id.toString(),
      old_value: JSON.stringify({ budget_name: existing.budget_name, fiscal_year: existing.fiscal_year })
    });

    logger.info('Budgets', 'budget_deleted', `Presupuesto eliminado: ${id}`);
    return { success: true, message: 'Presupuesto eliminado exitosamente' };

  } catch (error: any) {
    logger.error('Budgets', 'budget_deletion_failed', 'Error al eliminar presupuesto', { error: error.message });
    return { success: false, message: error.message };
  }
}

/**
 * Approve a budget.
 * Validates CP-3: State Transition Validity - only DRAFT can be approved.
 */
export function approveBudget(id: number, userId: number): { success: boolean; message: string } {
  if (!db) {
    return { success: false, message: 'Database not initialized' };
  }

  try {
    const existing = getBudgetById(id);
    if (!existing) {
      return { success: false, message: 'Presupuesto no encontrado' };
    }

    // CP-3: State Transition Validity - only DRAFT can be approved
    if (existing.status !== 'DRAFT') {
      return { success: false, message: 'Solo se pueden aprobar presupuestos en borrador' };
    }

    db.run(`
      UPDATE budgets 
      SET status = 'APPROVED', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userId, id]);

    // Audit logging
    AuditTrailService.logAction({
      user_id: userId,
      action: 'UPDATE', // Changed from 'APPROVE' to 'UPDATE'
      entity_type: 'budget',
      entity_id: id.toString(),
      old_value: JSON.stringify({ status: 'DRAFT' }),
      new_value: JSON.stringify({ status: 'APPROVED', approved_by: userId })
    });

    logger.info('Budgets', 'budget_approved', `Presupuesto aprobado: ${id} por usuario ${userId}`);
    return { success: true, message: 'Presupuesto aprobado exitosamente' };

  } catch (error: any) {
    logger.error('Budgets', 'budget_approval_failed', 'Error al aprobar presupuesto', { error: error.message });
    return { success: false, message: error.message };
  }
}

/**
 * Calculate actuals by account from journal entries.
 * Used for variance analysis.
 */
export function calculateActualsByAccount(
  accountNumber: number,
  startDate: string,
  endDate: string
): number {
  if (!db) return 0;

  try {
    const res = db.exec(`
      SELECT 
        SUM(CASE WHEN debit > 0 THEN debit ELSE 0 END) as total_debit,
        SUM(CASE WHEN credit > 0 THEN credit ELSE 0 END) as total_credit
      FROM journal_entry_lines
      INNER JOIN journal_entries ON journal_entries.id = journal_entry_lines.entry_id
      WHERE 
        account_number = ? AND
        entry_date >= ? AND
        entry_date <= ? AND
        journal_entries.status = 'posted'
    `, [accountNumber, startDate, endDate]);

    if (res.length === 0 || res[0].values.length === 0) return 0;

    const totalDebit = res[0].values[0][0] || 0;
    const totalCredit = res[0].values[0][1] || 0;

    // For expense accounts (5xxx): net = debits - credits
    // For revenue accounts (4xxx): net = credits - debits
    return accountNumber >= 5000
      ? totalDebit - totalCredit
      : totalCredit - totalDebit;
  } catch (error) {
    console.error('Error calculating actuals:', error);
    return 0;
  }
}

/**
 * Get budget variance analysis for all lines in a budget.
 * Calculates YTD budget, actual, and variance for each account.
 */
export function getBudgetVarianceAnalysis(
  budgetId: number,
  asOfDate?: string
): BudgetVarianceAnalysis[] {
  if (!db) return [];

  const currentDate = asOfDate || new Date().toISOString().split('T')[0];
  const budget = getBudgetById(budgetId);
  if (!budget) return [];

  const lines = getBudgetLines(budgetId);

  return lines.map(line => {
    const periods = getBudgetPeriods(line.id);
    const accountNumber = line.account_number;

    // Calculate YTD budget (sum of periods up to currentDate)
    const ytdBudget = periods
      .filter(p => p.period_end_date <= currentDate)
      .reduce((sum, p) => sum + p.budgeted_amount, 0);

    // Calculate YTD actual
    const ytdActual = calculateActualsByAccount(accountNumber, budget.start_date, currentDate);

    // Calculate variance
    const ytdVariance = ytdActual - ytdBudget;
    const ytdVariancePercent = ytdBudget !== 0 ? (ytdVariance / ytdBudget) * 100 : 0;

    // Get account name (fallback if not found)
    const accountName = getAccountNameByNumber(accountNumber) || `Account ${accountNumber}`;

    return {
      budget_id: budgetId,
      budget_name: budget.budget_name,
      account_number: accountNumber,
      account_name: accountName,
      annual_budget: line.annual_amount,
      ytd_budget: ytdBudget,
      ytd_actual: ytdActual,
      ytd_variance: ytdVariance,
      ytd_variance_percent: ytdVariancePercent,
      periods: periods.map(p => {
        const periodActual = calculateActualsByAccount(accountNumber, p.period_start_date, p.period_end_date);
        const periodVariance = periodActual - p.budgeted_amount;
        const periodVariancePercent = p.budgeted_amount !== 0 ? (periodVariance / p.budgeted_amount) * 100 : 0;

        // Determine if favorable (depends on account type)
        // Expense (5xxx): favorable if under budget (negative variance)
        // Revenue (4xxx): favorable if over budget (positive variance)
        const periodIsFavorable = accountNumber >= 5000 ? periodVariance < 0 : periodVariance > 0;

        return {
          period_number: p.period_number,
          period_name: new Date(p.period_start_date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
          budgeted: p.budgeted_amount,
          actual: periodActual,
          variance: periodVariance,
          variance_percent: periodVariancePercent,
          is_favorable: periodIsFavorable
        };
      })
    };
  });
}


// ==========================================
// BUDGETS - VARIANCE & ANALYSIS FUNCTIONS
// ==========================================

/**
 * Update period actuals for all periods in a budget.
 * Calculates actual amounts from journal entries and updates budget_periods table.
 */
export function updatePeriodActuals(budgetId: number): { success: boolean; message: string; periodsUpdated: number } {
  if (!db) {
    return { success: false, message: 'Database not initialized', periodsUpdated: 0 };
  }

  try {
    const budget = getBudgetById(budgetId);
    if (!budget) {
      return { success: false, message: 'Presupuesto no encontrado', periodsUpdated: 0 };
    }

    const lines = getBudgetLines(budgetId);
    let periodsUpdated = 0;

    db.run('BEGIN TRANSACTION');

    for (const line of lines) {
      const periods = getBudgetPeriods(line.id);

      for (const period of periods) {
        // Calculate actual for this period
        const actualAmount = calculateActualsByAccount(
          line.account_number,
          period.period_start_date,
          period.period_end_date
        );

        // Calculate variance
        const variance = actualAmount - period.budgeted_amount;
        const variancePercent = period.budgeted_amount !== 0
          ? (variance / period.budgeted_amount) * 100
          : 0;

        // Update period
        db.run(`
          UPDATE budget_periods 
          SET actual_amount = ?, variance_amount = ?, variance_percent = ?
          WHERE id = ?
        `, [actualAmount, variance, variancePercent, period.id]);

        periodsUpdated++;
      }
    }

    db.run('COMMIT');

    logger.info('Budgets', 'periods_updated', `Períodos actualizados: ${periodsUpdated} para presupuesto ${budgetId}`);
    return { success: true, message: `${periodsUpdated} períodos actualizados`, periodsUpdated };

  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Budgets', 'period_update_failed', 'Error al actualizar períodos', { error: error.message });
    return { success: false, message: error.message, periodsUpdated: 0 };
  }
}

/**
 * Get budget summary with aggregated metrics.
 * Returns totals, variance, and status indicators.
 */
export function getBudgetSummary(budgetId: number): {
  budget_id: number;
  budget_name: string;
  fiscal_year: number;
  status: string;
  total_budgeted: number;
  total_actual: number;
  total_variance: number;
  total_variance_percent: number;
  lines_count: number;
  lines_over_budget: number;
  lines_under_budget: number;
  lines_on_budget: number;
  alert_count: number;
} | null {
  if (!db) return null;

  try {
    const budget = getBudgetById(budgetId);
    if (!budget) return null;

    const lines = getBudgetLines(budgetId);
    const varianceAnalysis = getBudgetVarianceAnalysis(budgetId);

    // Calculate totals
    const totalBudgeted = lines.reduce((sum, line) => sum + line.annual_amount, 0);
    const totalActual = varianceAnalysis.reduce((sum, va) => sum + va.ytd_actual, 0);
    const totalVariance = totalActual - totalBudgeted;
    const totalVariancePercent = totalBudgeted !== 0 ? (totalVariance / totalBudgeted) * 100 : 0;

    // Count lines by status
    let linesOverBudget = 0;
    let linesUnderBudget = 0;
    let linesOnBudget = 0;
    let alertCount = 0;

    const alertThreshold = budget.alert_threshold_percentage || 10;

    for (const va of varianceAnalysis) {
      const variancePercent = Math.abs(va.ytd_variance_percent);

      if (variancePercent > alertThreshold) {
        alertCount++;
      }

      if (va.ytd_variance > 0) {
        linesOverBudget++;
      } else if (va.ytd_variance < 0) {
        linesUnderBudget++;
      } else {
        linesOnBudget++;
      }
    }

    return {
      budget_id: budgetId,
      budget_name: budget.budget_name,
      fiscal_year: budget.fiscal_year,
      status: budget.status,
      total_budgeted: totalBudgeted,
      total_actual: totalActual,
      total_variance: totalVariance,
      total_variance_percent: totalVariancePercent,
      lines_count: lines.length,
      lines_over_budget: linesOverBudget,
      lines_under_budget: linesUnderBudget,
      lines_on_budget: linesOnBudget,
      alert_count: alertCount
    };

  } catch (error) {
    console.error('Error getting budget summary:', error);
    return null;
  }
}

/**
 * Generate budget alerts for lines exceeding threshold.
 * Returns array of alerts for lines that exceed the configured threshold.
 */
export function generateBudgetAlerts(budgetId: number): Array<{
  budget_id: number;
  budget_line_id: number;
  account_number: number;
  account_name: string;
  alert_type: 'over_budget' | 'under_budget';
  severity: 'warning' | 'critical';
  variance_amount: number;
  variance_percent: number;
  threshold_percent: number;
  message: string;
}> {
  if (!db) return [];

  try {
    const budget = getBudgetById(budgetId);
    if (!budget) return [];

    const alertThreshold = budget.alert_threshold_percentage || 10;
    const varianceAnalysis = getBudgetVarianceAnalysis(budgetId);
    const alerts: Array<any> = [];

    for (const va of varianceAnalysis) {
      const variancePercent = Math.abs(va.ytd_variance_percent);

      // Check if variance exceeds threshold
      if (variancePercent > alertThreshold) {
        const isOverBudget = va.ytd_variance > 0;
        const severity = variancePercent > (alertThreshold * 2) ? 'critical' : 'warning';

        // Get budget line ID
        const lines = getBudgetLines(budgetId);
        const line = lines.find(l => l.account_number === va.account_number);

        if (line) {
          alerts.push({
            budget_id: budgetId,
            budget_line_id: line.id,
            account_number: va.account_number,
            account_name: va.account_name,
            alert_type: isOverBudget ? 'over_budget' : 'under_budget',
            severity: severity,
            variance_amount: va.ytd_variance,
            variance_percent: va.ytd_variance_percent,
            threshold_percent: alertThreshold,
            message: `${va.account_name}: ${isOverBudget ? 'Sobre' : 'Bajo'} presupuesto por ${Math.abs(variancePercent).toFixed(1)}% (${(Math.abs(va.ytd_variance) / 100).toFixed(2)})`
          });
        }
      }
    }

    // Log alerts if any
    if (alerts.length > 0) {
      logger.warn('Budgets', 'alerts_generated', `${alerts.length} alertas generadas para presupuesto ${budgetId}`, {
        budgetId,
        alertCount: alerts.length
      });
    }

    return alerts;

  } catch (error) {
    console.error('Error generating budget alerts:', error);
    return [];
  }
}

/**
 * Get budget execution status.
 * Returns overall execution metrics and status.
 */
export function getBudgetExecutionStatus(budgetId: number): {
  budget_id: number;
  execution_percent: number;
  status: 'on_track' | 'at_risk' | 'over_budget';
  days_elapsed: number;
  days_remaining: number;
  period_progress_percent: number;
  budget_consumed_percent: number;
  pace_indicator: 'ahead' | 'on_pace' | 'behind';
} | null {
  if (!db) return null;

  try {
    const budget = getBudgetById(budgetId);
    if (!budget) return null;

    const summary = getBudgetSummary(budgetId);
    if (!summary) return null;

    // Calculate time progress
    const startDate = new Date(budget.start_date);
    const endDate = new Date(budget.end_date);
    const currentDate = new Date();

    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = totalDays - daysElapsed;
    const periodProgressPercent = (daysElapsed / totalDays) * 100;

    // Calculate budget consumption
    const budgetConsumedPercent = summary.total_budgeted !== 0
      ? (summary.total_actual / summary.total_budgeted) * 100
      : 0;

    // Calculate execution percent (actual vs budgeted for elapsed time)
    const expectedSpending = (summary.total_budgeted * periodProgressPercent) / 100;
    const executionPercent = expectedSpending !== 0
      ? (summary.total_actual / expectedSpending) * 100
      : 0;

    // Determine pace
    let paceIndicator: 'ahead' | 'on_pace' | 'behind';
    if (budgetConsumedPercent > periodProgressPercent + 5) {
      paceIndicator = 'ahead'; // Spending faster than time
    } else if (budgetConsumedPercent < periodProgressPercent - 5) {
      paceIndicator = 'behind'; // Spending slower than time
    } else {
      paceIndicator = 'on_pace';
    }

    // Determine status
    let status: 'on_track' | 'at_risk' | 'over_budget';
    if (summary.alert_count === 0 && paceIndicator === 'on_pace') {
      status = 'on_track';
    } else if (summary.alert_count > 0 || paceIndicator === 'ahead') {
      status = 'at_risk';
    } else {
      status = budgetConsumedPercent > 100 ? 'over_budget' : 'on_track';
    }

    return {
      budget_id: budgetId,
      execution_percent: executionPercent,
      status: status,
      days_elapsed: daysElapsed,
      days_remaining: daysRemaining,
      period_progress_percent: periodProgressPercent,
      budget_consumed_percent: budgetConsumedPercent,
      pace_indicator: paceIndicator
    };

  } catch (error) {
    console.error('Error getting budget execution status:', error);
    return null;
  }
}

/**
 * Persist DB explicitly to IndexedDB (and LocalStorage as fallback if configured)
 * This bypasses the SQLiteEngine's sync if running in sql.js compatibility mode.
 */
export const forceSaveDB = async () => {
  if (!db || typeof db.export !== 'function') return;

  try {
    const data = db.export();
    // Save to PersistenceLayer (IndexedDB)
    const { saveDatabase } = await import('./PersistenceLayer');
    await saveDatabase(data);
    logger.info('Database', 'forced_save', 'Base de datos guardada forzadamente');
  } catch (e) {
    logger.error('Database', 'save_fail', 'Fallo al forzar guardado', e);
  }
};


/**
 * Verifica si existen usuarios REALES en el sistema (excluye usuarios demo/guest)
 * Usado para determinar si mostrar el Initial Setup Wizard
 * 
 * IMPORTANTE: Ignora usuarios con username 'demo.admin' o 'guest' para que
 * el wizard se muestre correctamente incluso si existe una sesión demo activa.
 */
export function hasUsers(): boolean {
  if (!db) return false;
  try {
    // Excluir usuarios demo/guest del conteo
    const result = db.exec(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE username NOT IN ('demo.admin', 'guest', 'demo@volatile.local')
    `);
    if (result.length > 0 && result[0].values.length > 0) {
      const count = result[0].values[0][0] as number;
      return count > 0;
    }
    return false;
  } catch (error) {
    console.error('Error checking if users exist:', error);
    return false;
  }
}

// ==========================================
// PAYROLL ENGINE FUNCTIONS (Phase 4)
// ==========================================

/**
 * Get payroll by ID
 */
export function getPayroll(payrollId: number): Payroll | null {
  if (!db) return null;
  
  try {
    const result = db.exec('SELECT * FROM payroll WHERE id = ?', [payrollId]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    
    return rowToEntity<Payroll>(result[0].columns, result[0].values[0]);
  } catch (error) {
    console.error('Error getting payroll:', error);
    return null;
  }
}

/**
 * Get all payrolls for an employee
 */
export function getEmployeePayrolls(employeeId: number, year?: number): Payroll[] {
  if (!db) return [];
  
  try {
    let query = 'SELECT * FROM payroll WHERE employee_id = ?';
    const params: any[] = [employeeId];
    
    if (year) {
      query += ' AND strftime("%Y", pay_date) = ?';
      params.push(year.toString());
    }
    
    query += ' ORDER BY pay_date DESC';
    
    const result = db.exec(query, params);
    if (result.length === 0) return [];
    
    return result[0].values.map((row: any) => rowToEntity<Payroll>(result[0].columns, row));
  } catch (error) {
    console.error('Error getting employee payrolls:', error);
    return [];
  }
}

/**
 * Get all payrolls with filters
 */
export function getAllPayrolls(filters?: {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
  status?: 'draft' | 'approved' | 'voided';
}): Payroll[] {
  if (!db) return [];
  
  try {
    let query = 'SELECT * FROM payroll WHERE 1=1';
    const params: any[] = [];
    
    if (filters?.employeeId) {
      query += ' AND employee_id = ?';
      params.push(filters.employeeId);
    }
    
    if (filters?.startDate) {
      query += ' AND pay_date >= ?';
      params.push(filters.startDate);
    }
    
    if (filters?.endDate) {
      query += ' AND pay_date <= ?';
      params.push(filters.endDate);
    }
    
    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    
    query += ' ORDER BY pay_date DESC, created_at DESC';
    
    const result = db.exec(query, params);
    if (result.length === 0) return [];
    
    return result[0].values.map((row: any) => rowToEntity<Payroll>(result[0].columns, row));
  } catch (error) {
    console.error('Error getting all payrolls:', error);
    return [];
  }
}

/**
 * Get payrolls for a specific quarter (for Form 941)
 */
export function getQuarterlyPayrolls(year: number, quarter: number): Payroll[] {
  if (!db) return [];
  
  try {
    const quarterMonths = {
      1: ['01', '02', '03'],
      2: ['04', '05', '06'],
      3: ['07', '08', '09'],
      4: ['10', '11', '12']
    };
    
    const months = quarterMonths[quarter as keyof typeof quarterMonths];
    if (!months) return [];
    
    const startDate = `${year}-${months[0]}-01`;
    const endDate = `${year}-${months[2]}-31`;
    
    const query = `
      SELECT * FROM payroll 
      WHERE pay_date >= ? AND pay_date <= ?
      AND status = 'approved'
      ORDER BY pay_date
    `;
    
    const result = db.exec(query, [startDate, endDate]);
    if (result.length === 0) return [];
    
    return result[0].values.map((row: any) => rowToEntity<Payroll>(result[0].columns, row));
  } catch (error) {
    console.error('Error getting quarterly payrolls:', error);
    return [];
  }
}

/**
 * Get annual payrolls for W-2 generation
 */
export function getAnnualPayrolls(employeeId: number, year: number): Payroll[] {
  if (!db) return [];
  
  try {
    const query = `
      SELECT * FROM payroll 
      WHERE employee_id = ?
      AND strftime('%Y', pay_date) = ?
      AND status = 'approved'
      ORDER BY pay_date
    `;
    
    const result = db.exec(query, [employeeId, year.toString()]);
    if (result.length === 0) return [];
    
    return result[0].values.map((row: any) => rowToEntity<Payroll>(result[0].columns, row));
  } catch (error) {
    console.error('Error getting annual payrolls:', error);
    return [];
  }
}
