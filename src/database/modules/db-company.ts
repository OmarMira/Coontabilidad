/**
 * Módulo 15 — Company Data, Aging Reports y ARD
 * Extraído de simple-db.ts líneas 8240–8871
 */

import { db, rowToEntity } from './db-core';
import { forceSaveDB } from './db-persistence';
import { logAuditEvent } from './db-audit';
import { logger } from '../../core/logging/SystemLogger';
import type { CompanyData } from './db-types';

const defaultCompanyData: Omit<CompanyData, 'id'> = {
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
  fiscal_year_start: '01-01',
  fiscal_year_end: '12-31',
  currency: 'USD',
  language: 'es',
  timezone: 'America/New_York',
  chart_of_accounts_name: 'Plan de Cuenta Ejemplo',
  date_format: 'MM/DD/AAAA',
  netIncreaseInCash: 0,
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
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true
};

export const getAgingReport = (type: 'receivable' | 'payable'): {
  total: number;
  buckets: { [key: string]: { amount: number; percentage: number } };
  details: { name: string; amount: number; days: number; bucket: string }[];
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

export const getAccountLedger = (accountCode: string, fromDate: string, toDate: string): {
  account: any;
  startingBalance: number;
  transactions: any[];
  endingBalance: number;
  totalDebit: number;
  totalCredit: number;
} => {
  if (!db) return { account: null, startingBalance: 0, transactions: [], endingBalance: 0, totalDebit: 0, totalCredit: 0 };

  try {
    const accResult = db.exec(`SELECT * FROM chart_of_accounts WHERE account_code = ?`, [accountCode]);
    if (!accResult[0]) return { account: null, startingBalance: 0, transactions: [], endingBalance: 0, totalDebit: 0, totalCredit: 0 };

    const account: any = {};
    (accResult[0].columns || (accResult[0] as any).lc).forEach((col: any, i: any) => account[col] = accResult[0].values[0][i]);

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
    const startingBalance = account.normal_balance === 'debit'
      ? (startDebits - startCredits)
      : (startCredits - startDebits);

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
      const cols = (txResult[0].columns || (txResult[0] as any).lc);
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

    return { account, startingBalance, transactions, endingBalance: runningBalance, totalDebit, totalCredit };

  } catch (error) {
    console.error('Error generating account ledger:', error);
    return { account: null, startingBalance: 0, transactions: [], endingBalance: 0, totalDebit: 0, totalCredit: 0 };
  }
};

export function getCompanyData(): CompanyData | null {
  try {
    if (!db) throw new Error('Base de datos no inicializada');

    const result = db.exec(`
      SELECT
        id,
        name as company_name,
        name as legal_name,
        tax_id,
        address,
        city,
        state,
        zip as zip_code,
        phone,
        email,
        website,
        currency_code as currency,
        is_active,
        fiscal_year_start,
        fiscal_year_end,
        netIncreaseInCash
      FROM company_data
      WHERE is_active = 1
      LIMIT 1
    `);

    if (result.length === 0 || result[0].values.length === 0) return null;

    const row = result[0].values[0];
    const columns = (result[0].columns || (result[0] as any).lc);
    if (!columns || !Array.isArray(columns)) return null;

    const company = rowToEntity<CompanyData>(columns, row);
    if (!company.fiscal_year_end) company.fiscal_year_end = '12-31';
    if (company.netIncreaseInCash === undefined) company.netIncreaseInCash = 0;

    return company;

  } catch (error) {
    logger.error('CompanyData', 'get_error', 'Error al obtener datos de empresa', null, error as Error);
    return null;
  }
}

export async function updateCompanyData(
  companyData: Partial<CompanyData>
): Promise<{ success: boolean; message: string; warnings?: string[] }> {
  try {
    if (!db) throw new Error('Base de datos no inicializada');

    const warnings: string[] = [];
    const accountingDataCheck = checkAccountingDataAssociation();

    if (accountingDataCheck.hasData) {
      warnings.push('ADVERTENCIA: Esta empresa tiene datos contables asociados');
      if (companyData.company_name || companyData.legal_name) {
        warnings.push('Cambiar el nombre puede afectar reportes y documentos existentes');
      }
    }

    const sqlRun = (sql: string, params: any[]): void => {
      const stmt = db!.prepare(sql);
      try { stmt.run(params); } finally { stmt.free(); }
    };

    const rowCount = db.exec("SELECT COUNT(*) FROM company_data")[0]?.values[0]?.[0] as number ?? 0;

    if (rowCount === 0) {
      sqlRun(`
        INSERT INTO company_data (
          name, tax_id, address, city, state, zip,
          phone, email, website, fiscal_year_start, currency_code,
          is_active, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `, [
        companyData.company_name || 'Mi Empresa LLC',
        companyData.tax_id || '00-0000000',
        companyData.address || '',
        companyData.city || '',
        companyData.state || 'FL',
        companyData.zip_code || '',
        companyData.phone || '',
        companyData.email || '',
        companyData.website || null,
        companyData.fiscal_year_start || '01-01',
        companyData.currency || 'USD',
        new Date().toISOString()
      ]);
      try { await forceSaveDB(); } catch (_) { }
      return { success: true, message: 'Datos de empresa creados correctamente' };
    }

    const currentData = getCompanyData();
    if (!currentData) {
      sqlRun(`
        UPDATE company_data SET
          name = ?, tax_id = ?, address = ?, city = ?, state = ?, zip = ?,
          phone = ?, email = ?, updated_at = ?
        WHERE is_active = 1
      `, [
        companyData.company_name || '',
        companyData.tax_id || '',
        companyData.address || '',
        companyData.city || '',
        companyData.state || 'FL',
        companyData.zip_code || '',
        companyData.phone || '',
        companyData.email || '',
        new Date().toISOString()
      ]);
      try { await forceSaveDB(); } catch (_) { }
      return { success: true, message: 'Datos de empresa actualizados correctamente' };
    }

    const cleanInput = Object.fromEntries(
      Object.entries(companyData).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const updateData = { ...currentData, ...cleanInput, updated_at: new Date().toISOString() };

    sqlRun(`
      UPDATE company_data SET
        name = ?, tax_id = ?, address = ?, city = ?, state = ?, zip = ?,
        phone = ?, email = ?, website = ?, logo_path = ?,
        fiscal_year_start = ?, currency_code = ?,
        sales_commission_percentage = ?, shipping_rate = ?,
        late_fee_percentage = ?, grace_period_days = ?,
        fiscal_year_end = ?, netIncreaseInCash = ?, updated_at = ?
      WHERE id = ? AND is_active = 1
    `, [
      updateData.company_name,
      updateData.tax_id,
      updateData.address,
      updateData.city,
      updateData.state,
      updateData.zip_code,
      updateData.phone,
      updateData.email,
      updateData.website || null,
      updateData.logo_path || null,
      updateData.fiscal_year_start || '01-01',
      updateData.currency || 'USD',
      updateData.sales_commission_percentage || 0,
      updateData.shipping_rate || 0,
      updateData.late_fee_percentage || 0,
      updateData.grace_period_days || 0,
      updateData.fiscal_year_end || '12-31',
      updateData.netIncreaseInCash || 0,
      updateData.updated_at,
      currentData.id
    ]);

    logAuditEvent('company_data', currentData.id, 'UPDATE', JSON.stringify(currentData), JSON.stringify(updateData));

    await forceSaveDB();

    return {
      success: true,
      message: 'Datos de la empresa actualizados correctamente',
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    logger.error('CompanyData', 'update_failed', 'Error al actualizar datos de empresa', null, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export function checkAccountingDataAssociation(): {
  hasData: boolean; customers: number; suppliers: number; invoices: number; bills: number;
} {
  try {
    if (!db) throw new Error('Base de datos no inicializada');

    const customers = db.exec('SELECT COUNT(*) FROM customers WHERE is_active = 1')[0]?.values[0]?.[0] as number || 0;
    const suppliers = db.exec('SELECT COUNT(*) FROM suppliers WHERE is_active = 1')[0]?.values[0]?.[0] as number || 0;
    const invoices = db.exec('SELECT COUNT(*) FROM invoices')[0]?.values[0]?.[0] as number || 0;
    const bills = db.exec('SELECT COUNT(*) FROM bills')[0]?.values[0]?.[0] as number || 0;

    return { hasData: customers > 0 || suppliers > 0 || invoices > 0 || bills > 0, customers, suppliers, invoices, bills };

  } catch (error) {
    logger.error('CompanyData', 'check_failed', 'Error al verificar asociaciones', null, error as Error);
    return { hasData: false, customers: 0, suppliers: 0, invoices: 0, bills: 0 };
  }
}

export function initializeCompanyData(): void {
  try {
    if (!db) throw new Error('Base de datos no inicializada');

    const existing = getCompanyData();
    if (existing) return;

    const stmt = db.prepare(`
      INSERT INTO company_data(
        name, tax_id, address, city, state, zip,
        phone, email, website, logo_path, fiscal_year_start, currency_code,
        sales_commission_percentage, shipping_rate, late_fee_percentage,
        grace_period_days, fiscal_year_end, netIncreaseInCash,
        created_at, updated_at, is_active
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      defaultCompanyData.company_name,
      defaultCompanyData.tax_id,
      defaultCompanyData.address,
      defaultCompanyData.city,
      defaultCompanyData.state,
      defaultCompanyData.zip_code,
      defaultCompanyData.phone,
      defaultCompanyData.email,
      defaultCompanyData.website || null,
      defaultCompanyData.logo_path || null,
      defaultCompanyData.fiscal_year_start,
      defaultCompanyData.currency,
      defaultCompanyData.sales_commission_percentage || 0,
      defaultCompanyData.shipping_rate || 0,
      defaultCompanyData.late_fee_percentage || 0,
      defaultCompanyData.grace_period_days || 0,
      defaultCompanyData.fiscal_year_end,
      defaultCompanyData.netIncreaseInCash,
      defaultCompanyData.created_at,
      defaultCompanyData.updated_at,
      defaultCompanyData.is_active ? 1 : 0
    ]);
    stmt.free();

    logger.info('CompanyData', 'init_success', 'Datos de empresa inicializados por defecto');

  } catch (error) {
    logger.error('CompanyData', 'init_failed', 'Error al inicializar datos de empresa', null, error as Error);
    throw error;
  }
}

export function getARDDocuments(): any[] {
  if (!db) return [];
  try {
    const result = db.exec('SELECT * FROM ard_documents ORDER BY created_at DESC');
    if (!result[0]) return [];
    const columns = (result[0].columns || (result[0] as any).lc);
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
        SET status = ?, detected_amount = ?, detected_tax = ?, raw_analysis = ?, updated_at = CURRENT_TIMESTAMP
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
    const result = db.exec(`
      SELECT
        c.id, c.name,
        COUNT(a.id) as total_docs,
        SUM(CASE WHEN a.status = 'processed' THEN 1 ELSE 0 END) as pending_conversion,
        SUM(CASE WHEN a.status = 'converted' THEN 1 ELSE 0 END) as total_converted,
        SUM(a.detected_amount) as total_volume
      FROM customers c
      INNER JOIN ard_documents a ON c.id = a.customer_id
      GROUP BY c.id
      ORDER BY total_docs DESC
    `);
    if (!result[0]) return [];
    const columns = (result[0].columns || (result[0] as any).lc);
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
