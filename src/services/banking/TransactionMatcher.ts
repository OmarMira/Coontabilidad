/**
 * TransactionMatcher - Vincula transacciones con facturas/gastos
 * 
 * Busca matches inteligentes entre transacciones bancarias importadas
 * y facturas/gastos pendientes de pago.
 */

import { ParsedTransaction } from './FileParserService';

export interface Invoice {
  id: number;
  invoice_number: string;
  total: number;
  date: string;
  customer_name: string;
}

export interface Bill {
  id: number;
  bill_number: string;
  total: number;
  date: string;
  supplier_name: string;
}

export interface MatchResult {
  matched: boolean;
  matchType: 'invoice' | 'bill' | null;
  matchedId: number | null;
  matchedName: string | null;
  confidence: number; // 0-100
}

export class TransactionMatcher {
  
  /**
   * Busca matches para una transacción
   */
  static async matchTransaction(
    transaction: ParsedTransaction,
    unpaidInvoices: Invoice[],
    unpaidBills: Bill[]
  ): Promise<MatchResult> {
    
    // Determine transaction type
    const isDebit = transaction.amount < 0;
    const isCredit = transaction.amount > 0;
    
    // Match debits with invoices (customer payments)
    if (isCredit) {
      const invoiceMatch = this.matchWithInvoices(transaction, unpaidInvoices);
      if (invoiceMatch) {
        return invoiceMatch;
      }
    }
    
    // Match credits with bills (supplier payments)
    if (isDebit) {
      const billMatch = this.matchWithBills(transaction, unpaidBills);
      if (billMatch) {
        return billMatch;
      }
    }
    
    return {
      matched: false,
      matchType: null,
      matchedId: null,
      matchedName: null,
      confidence: 0
    };
  }
  
  /**
   * Busca matches con facturas (para créditos/depósitos)
   */
  private static matchWithInvoices(
    transaction: ParsedTransaction,
    invoices: Invoice[]
  ): MatchResult | null {
    
    let bestMatch: { invoice: Invoice; confidence: number } | null = null;
    
    for (const invoice of invoices) {
      // Check amount tolerance (±1%)
      const amountDiff = Math.abs(Math.abs(transaction.amount) - invoice.total);
      const amountTolerance = invoice.total * 0.01;
      
      if (amountDiff > amountTolerance) continue;
      
      // Check date window (±7 days)
      const dateDiff = Math.abs(
        new Date(transaction.date).getTime() - new Date(invoice.date).getTime()
      ) / (1000 * 60 * 60 * 24);
      
      if (dateDiff > 7) continue;
      
      // Check description similarity
      const descriptionMatch = this.checkDescriptionMatch(
        transaction.description,
        [invoice.invoice_number, invoice.customer_name]
      );
      
      // Calculate confidence
      const amountScore = (1 - amountDiff / amountTolerance) * 40; // Max 40 points
      const dateScore = (7 - dateDiff) / 7 * 30; // Max 30 points
      const descScore = descriptionMatch ? 30 : 0; // 30 points if match
      const confidence = amountScore + dateScore + descScore;
      
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { invoice, confidence };
      }
    }
    
    if (bestMatch && bestMatch.confidence > 80) {
      return {
        matched: true,
        matchType: 'invoice',
        matchedId: bestMatch.invoice.id,
        matchedName: `Invoice ${bestMatch.invoice.invoice_number} - ${bestMatch.invoice.customer_name}`,
        confidence: Math.round(bestMatch.confidence)
      };
    }
    
    return null;
  }
  
  /**
   * Busca matches con gastos (para débitos/pagos)
   */
  private static matchWithBills(
    transaction: ParsedTransaction,
    bills: Bill[]
  ): MatchResult | null {
    
    let bestMatch: { bill: Bill; confidence: number } | null = null;
    
    for (const bill of bills) {
      // Check amount tolerance (±1%)
      const amountDiff = Math.abs(Math.abs(transaction.amount) - bill.total);
      const amountTolerance = bill.total * 0.01;
      
      if (amountDiff > amountTolerance) continue;
      
      // Check date window (±7 days)
      const dateDiff = Math.abs(
        new Date(transaction.date).getTime() - new Date(bill.date).getTime()
      ) / (1000 * 60 * 60 * 24);
      
      if (dateDiff > 7) continue;
      
      // Check description similarity
      const descriptionMatch = this.checkDescriptionMatch(
        transaction.description,
        [bill.bill_number, bill.supplier_name]
      );
      
      // Calculate confidence
      const amountScore = (1 - amountDiff / amountTolerance) * 40; // Max 40 points
      const dateScore = (7 - dateDiff) / 7 * 30; // Max 30 points
      const descScore = descriptionMatch ? 30 : 0; // 30 points if match
      const confidence = amountScore + dateScore + descScore;
      
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { bill, confidence };
      }
    }
    
    if (bestMatch && bestMatch.confidence > 80) {
      return {
        matched: true,
        matchType: 'bill',
        matchedId: bestMatch.bill.id,
        matchedName: `Bill ${bestMatch.bill.bill_number} - ${bestMatch.bill.supplier_name}`,
        confidence: Math.round(bestMatch.confidence)
      };
    }
    
    return null;
  }
  
  /**
   * Verifica si la descripción contiene alguna de las keywords
   */
  private static checkDescriptionMatch(description: string, keywords: string[]): boolean {
    const descLower = description.toLowerCase();
    return keywords.some(keyword => 
      descLower.includes(keyword.toLowerCase())
    );
  }
}
