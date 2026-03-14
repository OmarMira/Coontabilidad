/**
 * Módulo 08 — Suppliers (Proveedores)
 * Extraído de simple-db.ts líneas 5583–5935
 */

import { db } from '../simple-db';
import { saveDatabase, logAuditEvent, rowToEntity, PRIVILEGED_ROLES } from '../simple-db';
import type { Supplier } from './db-types';

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
    paymentCount: Number(row.payment_terms || 30),
    tax_exempt: Boolean(Number(row.tax_exempt)),
    tax_id: row.tax_id ? String(row.tax_id) : undefined,
    assigned_buyer: row.assigned_buyer ? String(row.assigned_buyer) : undefined,
    status: String(row.status || 'active') as 'active' | 'inactive' | 'suspended',
    notes: row.notes ? String(row.notes) : undefined,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString())
  };
};

export const addSupplier = (supplierData: Partial<Supplier>, userId?: number): number => {
  if (!db) {
    throw new Error('Database not initialized. Please wait for the system to load completely.');
  }

  try {
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

    stmt.run(values);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const insertId = insertResult[0]?.values[0]?.[0] as number || 0;

    stmt.free();

    logAuditEvent('suppliers', insertId, 'INSERT', null, supplierData, userId);

    db.run('COMMIT');

    setTimeout(() => saveDatabase(), 1000);

    return insertId;

  } catch (error) {
    db?.run('ROLLBACK');
    throw error;
  }
};

export const getSuppliers = (filters?: { userId?: number, role?: string }): Supplier[] => {
  if (!db) return [];

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
      query += ` WHERE created_by = ?`;
      params.push(filters.userId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = db.exec(query, params);
    const suppliers: Supplier[] = [];

    if (result && result.length > 0 && result[0].values) {
      const columns = (result[0].columns || (result[0] as any).lc);
      const values = result[0].values;

      values.forEach((row: any) => {
        const supplierObj = rowToEntity<Record<string, unknown>>(columns, row);
        suppliers.push(processSupplierRow(supplierObj));
      });
    }

    return suppliers;

  } catch (error) {
    console.error('Error getting suppliers:', error);
    return [];
  }
};

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
      const columns = (result[0].columns || (result[0] as any).lc);
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

export const updateSupplier = (id: number, supplierData: Partial<Supplier>, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
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

    logAuditEvent('suppliers', id, 'UPDATE', oldSupplier, supplierData, userId);

    db.run('COMMIT');

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: `Proveedor "${supplierData.name || oldSupplier.name}" actualizado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error updating supplier:', error);
    return { success: false, message: `Error al actualizar el proveedor: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

export const canDeleteSupplier = (supplierId: number): { canDelete: boolean; reason?: string } => {
  if (!db) return { canDelete: false, reason: 'Database not initialized' };

  try {
    const billCheck = db.exec(`SELECT COUNT(*) as count FROM bills WHERE supplier_id = ${supplierId}`);
    const billCount = billCheck[0]?.values[0]?.[0] as number || 0;

    if (billCount > 0) {
      return { canDelete: false, reason: `El proveedor tiene ${billCount} factura(s) de compra asociada(s). No se puede eliminar.` };
    }

    const paymentCheck = db.exec(`SELECT COUNT(*) as count FROM supplier_payments WHERE supplier_id = ${supplierId}`);
    const paymentCount = paymentCheck[0]?.values[0]?.[0] as number || 0;

    if (paymentCount > 0) {
      return { canDelete: false, reason: `El proveedor tiene ${paymentCount} pago(s) registrado(s). No se puede eliminar.` };
    }

    return { canDelete: true };

  } catch (error) {
    console.error('Error checking if supplier can be deleted:', error);
    return { canDelete: false, reason: 'Error al verificar las dependencias del proveedor' };
  }
};

export const deleteSupplier = (id: number, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const deleteCheck = canDeleteSupplier(id);
    if (!deleteCheck.canDelete) {
      return { success: false, message: deleteCheck.reason || 'No se puede eliminar el proveedor' };
    }

    const supplier = getSupplierById(id);
    if (!supplier) {
      return { success: false, message: 'Proveedor no encontrado' };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?');
    stmt.run([id]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar el proveedor' };
    }

    logAuditEvent('suppliers', id, 'DELETE', supplier, null, userId);

    db.run('COMMIT');

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: `Proveedor "${supplier.name}" eliminado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error deleting supplier:', error);
    return { success: false, message: `Error al eliminar el proveedor: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};
