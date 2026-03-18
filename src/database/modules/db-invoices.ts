/**
 * MÃ³dulo 06 â€” Invoices (Facturas de Venta)
 * ExtraÃ­do de simple-db.ts lÃ­neas 4533â€“5101
 */

import { db, rowToEntity, PRIVILEGED_ROLES } from './db-core';
import { saveDatabase } from './db-persistence';
import { logAuditEvent as logAuditAction } from './db-audit';
import { isDateLocked } from './db-journal';
import { generateSalesJournalEntry } from './db-journal-auto';
import type { Invoice, InvoiceItem, Product, Customer } from './db-types';
import { logger } from '../../core/logging/SystemLogger';

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

export const generateInvoiceNumber = (): string => {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.exec("SELECT COUNT(*) as count FROM invoices");
    const count = (result[0]?.values[0]?.[0] as number || 0) + 1;
    const year = new Date().getFullYear();
    return `INV-${year}-${count.toString().padStart(4, '0')}`;
  } catch (error) {
    logger.error('db-invoices', 'generate_invoice_number', 'Error generating invoice number', error);
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${new Date().getFullYear()}-${timestamp}`;
  }
};

export const getFloridaTaxRate = (county: string): number => {
  if (!db) return 0.06;

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
    logger.error('db-invoices', 'get_tax_rate', 'Error getting tax rate for county', error);
  }

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

  return fallbackRates[county] || 0.06;
};

export const calculateTaxAmount = (subtotal: number, county: string = 'Miami-Dade', taxableItems: boolean = true): { taxAmount: number; taxRate: number } => {
  if (!taxableItems || subtotal <= 0) {
    return { taxAmount: 0, taxRate: 0 };
  }

  const taxRate = getFloridaTaxRate(county);
  const taxAmount = subtotal * taxRate;

  return {
    taxAmount: Math.round(taxAmount * 100) / 100,
    taxRate
  };
};

export const validateFinancialCalculation = (subtotal: number, taxAmount: number, total: number, county: string): boolean => {
  const calculated = calculateTaxAmount(subtotal, county);
  const expectedTotal = subtotal + calculated.taxAmount;
  const tolerance = 0.01;

  return Math.abs(total - expectedTotal) <= tolerance &&
    Math.abs(taxAmount - calculated.taxAmount) <= tolerance;
};

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
      query += ` WHERE i.created_by = ?`;
      params.push(filters.userId);
    }

    query += ` ORDER BY i.created_at DESC`;

    const result = db.exec(query, params);

    if (!result[0]) return [];

    const invoices: Invoice[] = [];
    const columns = (result[0].columns || (result[0] as any).lc);

    result[0].values.forEach((row: any) => {
      const invoice = rowToEntity<Invoice & { customer_name: string; customer_business_name: string; customer_email: string }>(columns, row);

      invoice.customer = {
        name: invoice.customer_name,
        business_name: invoice.customer_business_name,
        email: invoice.customer_email
      } as Customer;

      invoices.push(invoice);
    });

    return invoices;
  } catch (error) {
    logger.error('db-invoices', 'get_invoices', 'Error getting invoices', error);
    return [];
  }
};

export const getInvoiceById = (id: number): Invoice | null => {
  if (!db) return null;

  try {
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
    const columns = (invoiceResult[0].columns || (invoiceResult[0] as any).lc);

    const invoice: any = {};
    columns.forEach((col: any, index: any) => {
      invoice[col] = invoiceRow[index];
    });

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

        invoice.items.push(item);
      });
    }

    return invoice as Invoice;
  } catch (error) {
    logger.error('db-invoices', 'get_invoice_by_id', 'Error getting invoice by ID', error);
    return null;
  }
};

export const createInvoice = (invoiceData: Partial<Invoice>, items: Partial<InvoiceItem>[], userId?: number): { success: boolean; message: string; invoiceId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    if (!invoiceData.customer_id) {
      return { success: false, message: 'Customer ID is required' };
    }

    if (!items || items.length === 0) {
      return { success: false, message: 'At least one item is required' };
    }

    const issueDateStr = invoiceData.issue_date || new Date().toISOString().split('T')[0];
    if (isDateLocked(issueDateStr)) {
      return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha estÃ¡ cerrado o bloqueado.' };
    }

    const invoiceNumber = invoiceData.invoice_number || generateInvoiceNumber();

    const customerResult = db.exec(`SELECT florida_county FROM customers WHERE id = ?`, [invoiceData.customer_id]);
    const county = customerResult[0]?.values[0]?.[0] as string || 'Miami-Dade';

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

    logAuditAction('invoices', invoiceId, 'INSERT', null, {
      invoice_number: invoiceNumber,
      customer_id: invoiceData.customer_id,
      total_amount: total,
      status: invoiceData.status || 'draft'
    }, userId);

    if (invoiceData.status === 'sent' || invoiceData.status === 'paid') {
      const fullInvoice = getInvoiceById(invoiceId);
      if (fullInvoice) {
        generateSalesJournalEntry(fullInvoice as any, userId).then(journalResult => {
          if (!journalResult.success) {
            logger.warn('db-invoices', 'create_invoice_journal', 'Warning: Could not generate journal entry for invoice');
          }
        });
      }
    }

    setTimeout(() => saveDatabase(), 1000);

    return {
      success: true,
      message: `Invoice ${invoiceNumber} created successfully`,
      invoiceId
    };

  } catch (error) {
    logger.error('db-invoices', 'create_invoice', 'Error creating invoice', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error creating invoice'
    };
  }
};

export const updateInvoice = (id: number, invoiceData: Partial<Invoice>, items?: Partial<InvoiceItem>[], userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const currentInvoice = getInvoiceById(id);
    if (!currentInvoice) {
      return { success: false, message: 'Invoice not found' };
    }

    const dateToCheck = invoiceData.issue_date || currentInvoice.issue_date;
    if (isDateLocked(dateToCheck)) {
      return { success: false, message: 'ERROR CONTABLE: El periodo para esta fecha estÃ¡ cerrado o bloqueado.' };
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

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

      const updateQuery = `UPDATE invoices SET ${updateFields.join(', ')} WHERE id = ?`;
      db.exec(updateQuery, updateValues);
    }

    if (items) {
      db.exec('DELETE FROM invoice_lines WHERE invoice_id = ?', [id]);

      let subtotal = 0;
      let taxAmount = 0;

      const itemStmt = db.prepare(`
        INSERT INTO invoice_lines(
          invoice_id, product_id, description, quantity, unit_price, line_total, taxable
        ) VALUES(?, ?, ?, ?, ?, ?, ?)
      `);

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

      const total = subtotal + taxAmount;
      db.exec(`
        UPDATE invoices
        SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
        WHERE id = ?
      `, [subtotal, taxAmount, total, userId || 1, id]);
    }

    logAuditAction('invoices', id, 'UPDATE', currentInvoice, invoiceData, userId);

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: 'Invoice updated successfully' };

  } catch (error) {
    logger.error('db-invoices', 'update_invoice', 'Error updating invoice', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error updating invoice'
    };
  }
};

export const deleteInvoice = (id: number, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const invoice = getInvoiceById(id);
    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    if (invoice.status === 'paid') {
      return { success: false, message: 'Cannot delete paid invoices' };
    }

    db.exec('DELETE FROM invoice_lines WHERE invoice_id = ?', [id]);
    db.exec('DELETE FROM invoices WHERE id = ?', [id]);

    logAuditAction('invoices', id, 'DELETE', invoice, null, userId);

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: 'Invoice deleted successfully' };

  } catch (error) {
    logger.error('db-invoices', 'delete_invoice', 'Error deleting invoice', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error deleting invoice'
    };
  }
};

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
    const columns = (result[0].columns || (result[0] as any).lc);

    result[0].values.forEach((row: any) => {
      const product: any = {};
      columns.forEach((col: any, index: any) => {
        product[col] = row[index];
      });
      products.push(product as Product);
    });

    return products;
  } catch (error) {
    logger.error('db-invoices', 'get_active_products', 'Error getting active products', error);
    return [];
  }
};

export const getStatsWithInvoices = () => {
  if (!db) return { customers: 0, invoices: 0, revenue: 0 };

  try {
    const customerResult = db.exec("SELECT COUNT(*) as count FROM customers");
    const invoiceResult = db.exec("SELECT COUNT(*) as count FROM invoices");
    const revenueResult = db.exec("SELECT SUM(total_amount) as total FROM invoices WHERE status = 'paid'");

    const customerCount = customerResult[0]?.values[0]?.[0] as number || 0;
    const invoiceCount = invoiceResult[0]?.values[0]?.[0] as number || 0;
    const revenue = revenueResult[0]?.values[0]?.[0] as number || 0;

    return { customers: customerCount, invoices: invoiceCount, revenue };

  } catch (error) {
    logger.error('db-invoices', 'get_stats_invoices', 'Error getting stats with invoices', error);
    return { customers: 0, invoices: 0, revenue: 0 };
  }
};

