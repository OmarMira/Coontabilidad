/**
 * MÃ³dulo 07 â€” Quotes (Cotizaciones)
 * ExtraÃ­do de simple-db.ts lÃ­neas 5109â€“5560
 */

import { db, rowToEntity } from './db-core';
import { saveDatabase } from './db-persistence';
import { logAuditEvent as logAuditAction } from './db-audit';
import { getFloridaTaxRate, createInvoice } from './db-invoices';
import { getCustomerById } from './db-customers';
import type { Quote, QuoteLine, Invoice, InvoiceItem } from './db-types';
import { logger } from '../../core/logging/SystemLogger';

const generateQuoteNumber = (): string => {
  if (!db) return `QT-${Date.now()}`;

  try {
    const result = db.exec("SELECT COUNT(*) as count FROM quotes");
    const count = result[0]?.values[0]?.[0] as number || 0;
    const year = new Date().getFullYear();
    return `QT-${year}-${String(count + 1).padStart(5, '0')}`;
  } catch (error) {
    return `QT-${Date.now()}`;
  }
};

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

    if (filters?.userId && filters?.role !== 'admin' && filters?.role !== 'auditor') {
      query += ' AND q.created_by = ?';
      params.push(filters.userId);
    }

    if (filters?.status) {
      query += ' AND q.status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY q.created_at DESC';

    const result = db.exec(query, params);
    if (!result[0]) return [];

    return result[0].values.map((row: any) =>
      rowToEntity<Quote>((result[0].columns || (result[0] as any).lc), row)
    );
  } catch (error) {
    logger.error('db-quotes', 'get_quotes', 'Error getting quotes', error);
    return [];
  }
};

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

    const quote = rowToEntity<Quote>((quoteResult[0].columns || (quoteResult[0] as any).lc), quoteResult[0].values[0]);

    const linesResult = db.exec(`
      SELECT ql.*, p.name as product_name, p.sku
      FROM quote_lines ql
      LEFT JOIN products p ON ql.product_id = p.id
      WHERE ql.quote_id = ?
    `, [id]);

    if (linesResult[0]) {
      quote.items = linesResult[0].values.map((row: any) =>
        rowToEntity<QuoteLine>((linesResult[0].columns || (linesResult[0] as any).lc), row)
      );
    }

    return quote;
  } catch (error) {
    logger.error('db-quotes', 'get_quote_by_id', 'Error getting quote by ID', error);
    return null;
  }
};

export const createQuote = (
  quoteData: Partial<Quote>,
  items: Partial<QuoteLine>[],
  userId?: number
): { success: boolean; message: string; quoteId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    if (!quoteData.customer_id) {
      return { success: false, message: 'Customer ID is required' };
    }

    if (!items || items.length === 0) {
      return { success: false, message: 'At least one item is required' };
    }

    const quoteNumber = quoteData.quote_number || generateQuoteNumber();

    const customer = getCustomerById(quoteData.customer_id);
    const county = customer?.florida_county || 'Miami-Dade';

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

    logAuditAction('quotes', quoteId, 'INSERT', null, {
      quote_number: quoteNumber,
      customer_id: quoteData.customer_id,
      total_amount: total,
      status: quoteData.status || 'draft'
    }, userId);

    setTimeout(() => saveDatabase(), 1000);

    return {
      success: true,
      message: `CotizaciÃ³n ${quoteNumber} creada exitosamente`,
      quoteId
    };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('db-quotes', 'create_quote', 'Error creating quote', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error creating quote'
    };
  }
};

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

    if (currentQuote.status === 'converted') {
      return { success: false, message: 'Cannot edit converted quotes' };
    }

    db.run('BEGIN TRANSACTION');

    const updateFields: string[] = [];
    const updateValues: any[] = [];

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

    if (items) {
      db.run('DELETE FROM quote_lines WHERE quote_id = ?', [id]);

      let subtotal = 0;
      let taxAmount = 0;

      const quote = getQuoteById(id);
      const county = (quote as any)?.florida_county || 'Miami-Dade';
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

      db.run(`
        UPDATE quotes
        SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [subtotal, taxAmount, total, id]);
    }

    db.run('COMMIT');

    logAuditAction('quotes', id, 'UPDATE', currentQuote, quoteData, userId);

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: 'CotizaciÃ³n actualizada exitosamente' };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('db-quotes', 'update_quote', 'Error updating quote', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error updating quote'
    };
  }
};

export const deleteQuote = (id: number, userId?: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const quote = getQuoteById(id);
    if (!quote) {
      return { success: false, message: 'Quote not found' };
    }

    if (quote.status === 'converted') {
      return { success: false, message: 'Cannot delete converted quotes' };
    }

    db.run('BEGIN TRANSACTION');

    db.run('DELETE FROM quote_lines WHERE quote_id = ?', [id]);
    db.run('DELETE FROM quotes WHERE id = ?', [id]);

    db.run('COMMIT');

    logAuditAction('quotes', id, 'DELETE', quote, null, userId);

    return { success: true, message: 'CotizaciÃ³n eliminada exitosamente' };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('db-quotes', 'delete_quote', 'Error deleting quote', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error deleting quote'
    };
  }
};

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

    const invoiceData: Partial<Invoice> = {
      customer_id: quote.customer_id,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      notes: `Convertida desde cotizaciÃ³n ${quote.quote_number}`
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
      db.run(`
        UPDATE quotes
        SET status = 'converted', converted_to_invoice_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [result.invoiceId, quoteId]);

      return {
        success: true,
        message: `CotizaciÃ³n convertida a factura exitosamente`,
        invoiceId: result.invoiceId
      };
    }

    return result;

  } catch (error) {
    logger.error('db-quotes', 'convert_quote_to_invoice', 'Error converting quote to invoice', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error converting quote'
    };
  }
};

