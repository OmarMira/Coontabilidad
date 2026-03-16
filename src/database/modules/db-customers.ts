/**
 * Módulo 04 — Customers (Clientes)
 * Extraído de simple-db.ts líneas 3902–4271
 */

import { db, rowToEntity, PRIVILEGED_ROLES } from './db-core';
import { saveDatabase } from './db-persistence';
import { logAuditEvent } from './db-audit';
import { logger } from '../../core/logging/SystemLogger';
import type { Customer } from './db-types';

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
    paymentCount: Number(row.payment_terms || 30),
    tax_exempt: Boolean(Number(row.tax_exempt)),
    tax_id: row.tax_id ? String(row.tax_id) : undefined,
    assigned_salesperson: row.assigned_salesperson ? String(row.assigned_salesperson) : undefined,
    status: String(row.status || 'active') as 'active' | 'inactive' | 'suspended',
    notes: row.notes ? String(row.notes) : undefined,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString())
  };
};

export const addCustomer = async (customerData: Partial<Customer>, userId?: number): Promise<number> => {
  logger.debug('CustomerModule', 'add_customer_start', 'Iniciando proceso de agregar cliente', { customerName: customerData.name });

  if (!db) {
    logger.error('CustomerModule', 'add_customer_failed', 'Base de datos no inicializada al intentar agregar cliente');
    throw new Error('Database not initialized. Please wait for the system to load completely.');
  }

  try {
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
      customerData.tax_exempt ? 1 : 0,
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

    await logAuditEvent('customers', insertId, 'INSERT', null, customerData, userId);

    db.run('COMMIT');

    setTimeout(() => saveDatabase(), 1000);

    logger.info('CustomerModule', 'add_customer_success', `Cliente agregado exitosamente con ID: ${insertId}`, {
      customerId: insertId,
      customerName: customerData.name,
      customerEmail: customerData.email
    });

    return insertId;

  } catch (error) {
    logger.error('CustomerModule', 'add_customer_failed', `Error al agregar cliente: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      customerData: { name: customerData.name, email: customerData.email }
    }, error as Error);
    db?.run('ROLLBACK');
    throw error;
  }
};

export const getCustomers = (filters?: { userId?: number, role?: string }): Customer[] => {
  if (!db) return [];

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

    if (filters?.userId && filters?.role && !PRIVILEGED_ROLES.includes(filters.role)) {
      query += ` WHERE created_by = ?`;
      params.push(filters.userId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = db.exec(query, params);
    const customers: Customer[] = [];

    if (result && result.length > 0 && result[0].values) {
      const columns = (result[0].columns || (result[0] as any).lc);
      const values = result[0].values;

      values.forEach((row: any) => {
        const customerObj = rowToEntity<Record<string, unknown>>(columns, row);
        customers.push(processCustomerRow(customerObj));
      });
    }

    return customers;

  } catch (error) {
    console.error('Error getting customers:', error);
    return [];
  }
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
      const columns = (result[0].columns || (result[0] as any).lc);
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
      customerData.tax_exempt !== undefined ? (customerData.tax_exempt ? 1 : 0) : (oldCustomer.tax_exempt ? 1 : 0),
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

    logAuditEvent('customers', id, 'UPDATE', oldCustomer, customerData, userId);

    db.run('COMMIT');

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: `Cliente "${customerData.name || oldCustomer.name}" actualizado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error updating customer:', error);
    return { success: false, message: `Error al actualizar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

export const canDeleteCustomer = (customerId: number): { canDelete: boolean; reason?: string } => {
  if (!db) return { canDelete: false, reason: 'Database not initialized' };

  try {
    const invoiceCheck = db.exec(`SELECT COUNT(*) as count FROM invoices WHERE customer_id = ${customerId}`);
    const invoiceCount = invoiceCheck[0]?.values[0]?.[0] as number || 0;

    if (invoiceCount > 0) {
      return { canDelete: false, reason: `El cliente tiene ${invoiceCount} factura(s) asociada(s). No se puede eliminar.` };
    }

    const paymentCheck = db.exec(`SELECT COUNT(*) as count FROM payments WHERE customer_id = ${customerId}`);
    const paymentCount = paymentCheck[0]?.values[0]?.[0] as number || 0;

    if (paymentCount > 0) {
      return { canDelete: false, reason: `El cliente tiene ${paymentCount} pago(s) registrado(s). No se puede eliminar.` };
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
    const deleteCheck = canDeleteCustomer(id);
    if (!deleteCheck.canDelete) {
      return { success: false, message: deleteCheck.reason || 'No se puede eliminar el cliente' };
    }

    const customer = getCustomerById(id);
    if (!customer) {
      return { success: false, message: 'Cliente no encontrado' };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    stmt.run([id]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar el cliente' };
    }

    logAuditEvent('customers', id, 'DELETE', customer, null, userId);

    db.run('COMMIT');

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: `Cliente "${customer.name}" eliminado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error deleting customer:', error);
    return { success: false, message: `Error al eliminar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};
