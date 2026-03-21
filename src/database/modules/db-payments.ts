/**
 * Módulo 13 — Payments (Pagos de Clientes y Proveedores)
 * Extraído de simple-db.ts líneas 7563–7826
 */

import { db } from './db-core';
import { forceSaveDB } from './db-persistence';
import { logAuditEvent } from './db-audit';
import { isDateLocked } from './db-journal';
import { createJournalEntry } from './db-journal';
import { generatePaymentReceivedJournalEntry, generatePaymentSentJournalEntry } from './db-journal-auto';
import { logger } from '../../core/logging/SystemLogger';
import { getCustomerById } from './db-customers';
import { getSupplierById } from './db-suppliers';
import type { Payment, SupplierPayment, JournalDetail } from './db-types';

export const generatePaymentNumber = (): string => {
  if (!db) return '';
  try {
    const result = db.exec("SELECT COUNT(*) as count FROM payments");
    const count = (result[0]?.values[0]?.[0] as number || 0) + 1;
    return `PAY-C-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
  } catch (error) {
    return `PAY-C-${Date.now()}`;
  }
};

export const generateSupplierPaymentNumber = (): string => {
  if (!db) return '';
  try {
    const result = db.exec("SELECT COUNT(*) as count FROM supplier_payments");
    const count = (result[0]?.values[0]?.[0] as number || 0) + 1;
    return `PAY-S-${new Date().getFullYear()}-${count.toString().padStart(4, '0')}`;
  } catch (error) {
    return `PAY-S-${Date.now()}`;
  }
};

export const createPayment = (
  paymentData: Partial<Payment>,
  userId?: number
): { success: boolean; message: string; paymentId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  let transactionStarted = false;
  try {
    db.run('BEGIN TRANSACTION');
    transactionStarted = true;

    if (!paymentData.customer_id || !paymentData.amount) {
      throw new Error('Faltan datos requeridos (Cliente o Monto)');
    }

    const paymentDateStr = paymentData.payment_date || new Date().toISOString().split('T')[0];
    if (isDateLocked(paymentDateStr)) {
      throw new Error('ERROR CONTABLE: El periodo para esta fecha está cerrado o bloqueado.');
    }

    const paymentNumber = paymentData.payment_number || generatePaymentNumber();

    db.run(`
      INSERT INTO payments(
        customer_id, invoice_id, payment_number, payment_date, amount,
        payment_method, reference_number, notes, created_by
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paymentData.customer_id,
      paymentData.invoice_id || null,
      paymentNumber,
      paymentDateStr,
      paymentData.amount,
      paymentData.payment_method || 'cash',
      paymentData.reference_number || null,
      paymentData.notes || null,
      userId || 1
    ]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const paymentId = result[0]?.values[0]?.[0] as number;

    if (paymentData.invoice_id) {
      const invoiceResult = db.exec(`SELECT total_amount FROM invoices WHERE id = ${paymentData.invoice_id}`);
      if (invoiceResult.length > 0 && invoiceResult[0].values.length > 0) {
        const totalAmount = invoiceResult[0].values[0][0] as number;
        const paymentsResult = db.exec(`SELECT SUM(amount) FROM payments WHERE invoice_id = ${paymentData.invoice_id}`);
        const totalPaid = paymentsResult[0]?.values[0]?.[0] as number || 0;
        const newStatus = (Math.abs(totalPaid - totalAmount) < 0.01 || totalPaid > totalAmount) ? 'paid' : 'partial';
        db.run(`UPDATE invoices SET status = ? WHERE id = ?`, [newStatus, paymentData.invoice_id]);
      }
    }

    db.run('COMMIT');
    transactionStarted = false;

    const auditData = { ...paymentData, id: paymentId, payment_number: paymentNumber };
    logAuditEvent('payments', paymentId, 'INSERT', null, auditData, userId);

    const fullPayment: Payment = {
      id: paymentId,
      customer_id: paymentData.customer_id,
      invoice_id: paymentData.invoice_id,
      payment_number: paymentNumber,
      payment_date: paymentDateStr,
      amount: paymentData.amount,
      payment_method: paymentData.payment_method || 'cash',
      reference_number: paymentData.reference_number,
      notes: paymentData.notes,
      created_at: new Date().toISOString()
    };

    const customer = getCustomerById(paymentData.customer_id);
    if (customer) {
      try {
        generatePaymentReceivedJournalEntry(fullPayment as any, customer as any, userId);
      } catch (journalError) {
        logger.warn('Payments', 'journal_entry_failed', 'Error al generar asiento contable, pero pago creado', { journalError }, journalError as Error);
      }
    }

    logger.info('Payments', 'create_success', 'Pago de cliente creado correctamente', { paymentId, userId });
    return { success: true, message: 'Pago registrado correctamente', paymentId };

  } catch (error) {
    if (transactionStarted) {
      try { db.run('ROLLBACK'); } catch (_) {}
    }
    logger.error('Payments', 'create_failed', 'Error al crear pago', { error }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

export const addPayment = async (
  paymentData: Partial<SupplierPayment>,
  userId?: number
): Promise<{ success: boolean; message: string; paymentId?: number }> => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    if (!paymentData.supplier_id || !paymentData.amount) {
      throw new Error('Faltan datos requeridos (Proveedor o Monto)');
    }

    const paymentNumber = paymentData.payment_number || generateSupplierPaymentNumber();

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

    if (paymentData.bill_id) {
      const billResult = db.exec(`SELECT total_amount FROM bills WHERE id = ${paymentData.bill_id}`);
      if (billResult.length > 0 && billResult[0].values.length > 0) {
        const totalAmount = billResult[0].values[0][0] as number;
        const paymentsResult = db.exec(`SELECT SUM(amount) FROM supplier_payments WHERE bill_id = ${paymentData.bill_id}`);
        const totalPaid = paymentsResult[0]?.values[0]?.[0] as number || 0;
        const newStatus = (Math.abs(totalPaid - totalAmount) < 0.01 || totalPaid > totalAmount) ? 'paid' : 'partial';
        db.run(`UPDATE bills SET status = ? WHERE id = ?`, [newStatus, paymentData.bill_id]);
      }
    }

    const auditData = { ...paymentData, id: paymentId, payment_number: paymentNumber };
    logAuditEvent('supplier_payments', paymentId, 'INSERT', null, auditData, userId);

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
      generatePaymentSentJournalEntry(fullPayment as any, supplier as any, userId);
    }

    db.run('COMMIT');
    logger.info('Payments', 'add_payment_success', 'Pago a proveedor registrado', { paymentId, userId });

    await forceSaveDB();

    return { success: true, message: 'Pago registrado correctamente', paymentId };

  } catch (error) {
    db.run('ROLLBACK');
    logger.error('Payments', 'add_payment_failed', 'Error al crear pago a proveedor', { error }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};

export const createSupplierPayment = addPayment;
