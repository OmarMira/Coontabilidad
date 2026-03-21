/**
 * MÃ³dulo 09 â€” Bills (Facturas de Compra)
 * ExtraÃ­do de simple-db.ts lÃ­neas 5942â€“6451
 */

import { db, rowToEntity, PRIVILEGED_ROLES } from './db-core';
import { saveDatabase, forceSaveDB } from './db-persistence';
import { logAuditEvent } from './db-audit';
import { isDateLocked } from './db-journal';
import { generatePurchaseJournalEntry } from './db-journal-auto';
import { getFloridaTaxRate } from './db-invoices';
import { getSupplierById } from './db-suppliers';
import { logger } from '../../core/logging/SystemLogger';
import type { Bill, BillItem, Supplier } from './db-types';

export const generateBillNumber = (): string => {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.exec("SELECT COUNT(*) as count FROM bills");
    const count = (result[0]?.values[0]?.[0] as number || 0) + 1;
    const year = new Date().getFullYear();
    return `BILL-${year}-${count.toString().padStart(4, '0')}`;
  } catch (error) {
    logger.error('db-bills', 'generate_bill_number', 'Error generating bill number', error);
    const timestamp = Date.now().toString().slice(-6);
    return `BILL-${new Date().getFullYear()}-${timestamp}`;
  }
};

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
      query += ` WHERE b.created_by = ?`;
      params.push(filters.userId);
    }

    query += ` ORDER BY b.created_at DESC`;

    const result = db.exec(query, params);

    if (!result[0]) return [];

    const bills: Bill[] = [];
    const columns = (result[0].columns || (result[0] as any).lc);

    result[0].values.forEach((row: any) => {
      const bill = rowToEntity<Bill & { supplier_name: string; supplier_business_name: string; supplier_email: string }>(columns, row);

      if (bill.supplier_name) {
        bill.supplier = {
          name: bill.supplier_name,
          business_name: bill.supplier_business_name,
          email: bill.supplier_email
        } as any as Supplier;
      }

      bills.push(bill);
    });

    return bills;
  } catch (error) {
    logger.error('db-bills', 'get_bills', 'Error getting bills', error);
    return [];
  }
};

export const getBillById = (id: number): Bill | null => {
  if (!db) return null;

  try {
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
    const columns = (billResult[0].columns || (billResult[0] as any).lc);

    const bill: any = {};
    columns.forEach((col: any, index: any) => {
      bill[col] = billRow[index];
    });

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
      const itemColumns = (itemsResult[0].columns || (itemsResult[0] as any).lc);
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
    logger.error('db-bills', 'get_bill_by_id', 'Error getting bill by ID', error);
    return null;
  }
};

export const createBill = (billData: Partial<Bill>, items: Partial<BillItem>[], userId?: number): { success: boolean; message: string; billId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    if (!billData.supplier_id) {
      return { success: false, message: 'Supplier ID is required' };
    }

    if (!items || items.length === 0) {
      return { success: false, message: 'At least one item is required' };
    }

    const issueDateStr = billData.issue_date || new Date().toISOString().split('T')[0];
    if (isDateLocked(issueDateStr)) {
      return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha estÃ¡ cerrado o bloqueado.' };
    }

    const billNumber = billData.bill_number || generateBillNumber();

    const supplier = getSupplierById(billData.supplier_id);
    const county = supplier?.florida_county || 'Miami-Dade';

    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      subtotal += lineTotal;
      if (item.taxable) {
        taxAmount += lineTotal * getFloridaTaxRate(county);
      }
    });

    const total = subtotal + taxAmount;

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

    logAuditEvent('bills', billId, 'INSERT', null, {
      bill_number: billNumber,
      supplier_id: billData.supplier_id,
      total_amount: total,
      status: billData.status || 'draft'
    }, userId);

    if (billData.status === 'approved' || billData.status === 'paid') {
      const fullBill = getBillById(billId);
      if (fullBill) {
        generatePurchaseJournalEntry(fullBill as any, userId).then(journalResult => {
          if (!journalResult.success) {
            logger.warn('db-bills', 'create_bill_journal', 'Warning: Could not generate journal entry for bill');
          }
        });
      }
    }

    setTimeout(() => saveDatabase(), 1000);

    return {
      success: true,
      message: `Factura de compra ${billNumber} creada correctamente`,
      billId
    };

  } catch (error) {
    logger.error('db-bills', 'create_bill', 'Error creating bill', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error creating bill'
    };
  }
};

export const getStatsWithSuppliers = (filters?: { userId?: number, role?: string }) => {
  if (!db) return { customers: 0, invoices: 0, revenue: 0, suppliers: 0, bills: 0, expenses: 0 };

  try {
    let customerQuery = "SELECT COUNT(*) as count FROM customers";
    let invoiceQuery = "SELECT COUNT(*) as count FROM invoices";
    let revenueQuery = "SELECT SUM(total_amount) as total FROM invoices WHERE status = 'paid'";
    let supplierQuery = "SELECT COUNT(*) as count FROM suppliers";
    let billQuery = "SELECT COUNT(*) as count FROM bills";
    let expenseQuery = "SELECT SUM(total_amount) as total FROM bills WHERE status = 'paid'";

    let params: any[] = [];
    if (filters?.userId && filters?.role && !PRIVILEGED_ROLES.includes(filters.role)) {
      customerQuery += " WHERE created_by = ?";
      invoiceQuery += " WHERE created_by = ?";
      revenueQuery += " AND created_by = ?";
      supplierQuery += " WHERE created_by = ?";
      billQuery += " WHERE created_by = ?";
      expenseQuery += " AND created_by = ?";
      params = [filters.userId];
    }

    const customerCount = db.exec(customerQuery, params)[0]?.values[0]?.[0] as number || 0;
    const invoiceCount = db.exec(invoiceQuery, params)[0]?.values[0]?.[0] as number || 0;
    const revenue = db.exec(revenueQuery, params)[0]?.values[0]?.[0] as number || 0;
    const supplierCount = db.exec(supplierQuery, params)[0]?.values[0]?.[0] as number || 0;
    const billCount = db.exec(billQuery, params)[0]?.values[0]?.[0] as number || 0;
    const expenses = db.exec(expenseQuery, params)[0]?.values[0]?.[0] as number || 0;

    return { customers: customerCount, invoices: invoiceCount, revenue, suppliers: supplierCount, bills: billCount, expenses };

  } catch (error) {
    logger.error('db-bills', 'get_stats_suppliers', 'Error getting stats with suppliers', error);
    return { customers: 0, invoices: 0, revenue: 0, suppliers: 0, bills: 0, expenses: 0 };
  }
};

export const updateBill = async (id: number, billData: Partial<Bill>, items?: Partial<BillItem>[], userId?: number): Promise<{ success: boolean; message: string }> => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const currentBill = getBillById(id);
    if (!currentBill) {
      return { success: false, message: 'Factura de compra no encontrada' };
    }

    const dateToCheck = billData.issue_date || currentBill.issue_date;
    if (isDateLocked(dateToCheck)) {
      return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha estÃ¡ cerrado o bloqueado.' };
    }

    db.run('BEGIN TRANSACTION');

    const updateFields: string[] = [];
    const updateValues: any[] = [];

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

      const updateQuery = `UPDATE bills SET ${updateFields.join(', ')} WHERE id = ?`;
      db.exec(updateQuery, updateValues);
    }

    if (items) {
      db.exec('DELETE FROM bill_lines WHERE bill_id = ?', [id]);

      const supplier = getSupplierById(currentBill.supplier_id);
      const county = supplier?.florida_county || 'Miami-Dade';

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
          taxAmount += lineTotal * getFloridaTaxRate(county);
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

      const total = subtotal + taxAmount;
      db.exec(`
        UPDATE bills
        SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
        WHERE id = ?
      `, [subtotal, taxAmount, total, userId || 1, id]);
    }

    logAuditEvent('bills', id, 'UPDATE', currentBill, billData, userId);

    db.run('COMMIT');

    await forceSaveDB();

    return { success: true, message: 'Factura de compra actualizada correctamente' };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('db-bills', 'update_bill', 'Error updating bill', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar la factura de compra'
    };
  }
};

export const deleteBill = (id: number, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const bill = getBillById(id);
    if (!bill) {
      return { success: false, message: 'Factura de compra no encontrada' };
    }

    if (bill.status === 'paid') {
      return { success: false, message: 'No se pueden eliminar facturas de compra pagadas' };
    }

    const paymentCheck = db.exec(`SELECT COUNT(*) as count FROM supplier_payments WHERE bill_id = ${id}`);
    const paymentCount = paymentCheck[0]?.values[0]?.[0] as number || 0;

    if (paymentCount > 0) {
      return {
        success: false,
        message: `La factura tiene ${paymentCount} pago(s) asociado(s). No se puede eliminar.`
      };
    }

    db.run('BEGIN TRANSACTION');

    db.exec('DELETE FROM bill_lines WHERE bill_id = ?', [id]);

    const stmt = db.prepare('DELETE FROM bills WHERE id = ?');
    stmt.run([id]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar la factura de compra' };
    }

    logAuditEvent('bills', id, 'DELETE', bill, null, userId);

    db.run('COMMIT');

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: `Factura de compra ${bill.bill_number} eliminada correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('db-bills', 'delete_bill', 'Error deleting bill', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al eliminar la factura de compra'
    };
  }
};

