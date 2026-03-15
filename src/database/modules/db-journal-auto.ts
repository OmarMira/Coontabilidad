/**
 * Módulo 12 — Journal Entries Automáticos
 * Extraído de simple-db.ts líneas 7452–7557 y 7701–7724
 */

import { db } from '../simple-db';
import { createJournalEntry } from './db-journal';
import type { Invoice, Bill, Payment, SupplierPayment, Customer, Supplier, JournalDetail } from './db-types';

// Generar asiento automático para factura de venta
export const generateSalesJournalEntry = async (
  invoice: Invoice,
  userId?: number
): Promise<{ success: boolean; message: string; entryId?: number }> => {
  if (!invoice.customer) {
    return { success: false, message: 'Información del cliente requerida' };
  }

  const details: Partial<JournalDetail>[] = [
    {
      account_code: '1121',
      debit_amount: invoice.total_amount,
      credit_amount: 0,
      description: `Factura ${invoice.invoice_number} - ${invoice.customer.name}`
    },
    {
      account_code: '4110',
      debit_amount: 0,
      credit_amount: invoice.subtotal,
      description: `Venta - Factura ${invoice.invoice_number}`
    }
  ];

  if (invoice.tax_amount > 0) {
    details.push({
      account_code: '2121',
      debit_amount: 0,
      credit_amount: invoice.tax_amount,
      description: `Impuesto Florida - Factura ${invoice.invoice_number}`
    });
  }

  return createJournalEntry({
    entry_date: invoice.issue_date,
    reference_number: `INV-${invoice.invoice_number}`,
    description: `Venta a ${invoice.customer.name} - Factura ${invoice.invoice_number}`
  }, details, userId);
};

// Generar asiento automático para factura de compra
export const generatePurchaseJournalEntry = async (
  bill: Bill,
  userId?: number
): Promise<{ success: boolean; message: string; entryId?: number }> => {
  if (!bill.supplier) {
    return { success: false, message: 'Información del proveedor requerida' };
  }

  const details: Partial<JournalDetail>[] = [
    {
      account_code: '5200',
      debit_amount: bill.subtotal,
      credit_amount: 0,
      description: `Compra - Factura ${bill.bill_number}`
    },
    {
      account_code: '2111',
      debit_amount: 0,
      credit_amount: bill.total_amount,
      description: `Factura ${bill.bill_number} - ${bill.supplier.name}`
    }
  ];

  if (bill.tax_amount > 0) {
    details.push({
      account_code: '5510',
      debit_amount: bill.tax_amount,
      credit_amount: 0,
      description: `Impuesto Florida - Factura ${bill.bill_number}`
    });
  }

  return createJournalEntry({
    entry_date: bill.issue_date,
    reference_number: `BILL-${bill.bill_number}`,
    description: `Compra a ${bill.supplier.name} - Factura ${bill.bill_number}`
  }, details, userId);
};

// Generar asiento automático para pago recibido (de cliente)
export const generatePaymentReceivedJournalEntry = async (
  payment: Payment,
  customer: Customer,
  userId?: number
): Promise<{ success: boolean; message: string; entryId?: number }> => {
  const details: Partial<JournalDetail>[] = [
    {
      account_code: payment.payment_method === 'cash' ? '1111' : '1112',
      debit_amount: payment.amount,
      credit_amount: 0,
      description: `Pago recibido ${payment.payment_number} - ${customer.name}`
    },
    {
      account_code: '1121',
      debit_amount: 0,
      credit_amount: payment.amount,
      description: `Pago ${payment.payment_number} - ${customer.name}`
    }
  ];

  return createJournalEntry({
    entry_date: payment.payment_date,
    reference_number: `PAY-${payment.payment_number}`,
    description: `Pago recibido de ${customer.name} - ${payment.payment_number}`
  }, details, userId);
};

// Generar asiento automático para pago realizado (a proveedor)
export const generatePaymentSentJournalEntry = async (
  payment: SupplierPayment,
  supplier: Supplier,
  userId?: number
): Promise<{ success: boolean; message: string; entryId?: number }> => {
  const details: Partial<JournalDetail>[] = [
    {
      account_code: '2111',
      debit_amount: payment.amount,
      credit_amount: 0,
      description: `Pago a proveedor ${supplier.name} - ${payment.payment_number}`
    },
    {
      account_code: payment.payment_method === 'cash' ? '1111' : '1112',
      debit_amount: 0,
      credit_amount: payment.amount,
      description: `Pago realizado ${payment.payment_number} - ${supplier.name}`
    }
  ];

  return createJournalEntry({
    entry_date: payment.payment_date,
    reference_number: `PAY-${payment.payment_number}`,
    description: `Pago a ${supplier.name} - ${payment.payment_number}`
  }, details, userId);
};
