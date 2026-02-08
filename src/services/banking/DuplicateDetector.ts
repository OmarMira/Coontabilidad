/**
 * DuplicateDetector - Detecta transacciones duplicadas
 * 
 * Usa exact matching y fuzzy matching para identificar transacciones
 * que ya fueron importadas previamente.
 */

import { ParsedTransaction } from './FileParserService';

export interface ExistingTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
}

export interface DuplicateResult {
  isDuplicate: boolean;
  confidence: number; // 0-100
  matchedTransactionId?: number;
  matchType?: 'exact' | 'fuzzy';
}

export class DuplicateDetector {
  
  /**
   * Detecta si una transacción es duplicada
   */
  static async detectDuplicate(
    transaction: ParsedTransaction,
    existingTransactions: ExistingTransaction[]
  ): Promise<DuplicateResult> {
    
    // Try exact match first
    const exactMatch = this.findExactMatch(transaction, existingTransactions);
    if (exactMatch) {
      return {
        isDuplicate: true,
        confidence: 100,
        matchedTransactionId: exactMatch.id,
        matchType: 'exact'
      };
    }
    
    // Try fuzzy match
    const fuzzyMatch = this.findFuzzyMatch(transaction, existingTransactions);
    if (fuzzyMatch) {
      return {
        isDuplicate: fuzzyMatch.confidence > 80,
        confidence: fuzzyMatch.confidence,
        matchedTransactionId: fuzzyMatch.transaction.id,
        matchType: 'fuzzy'
      };
    }
    
    return {
      isDuplicate: false,
      confidence: 0
    };
  }
  
  /**
   * Detecta duplicados en batch
   */
  static async detectDuplicatesBatch(
    transactions: ParsedTransaction[],
    existingTransactions: ExistingTransaction[]
  ): Promise<Map<number, DuplicateResult>> {
    const results = new Map<number, DuplicateResult>();
    
    for (let i = 0; i < transactions.length; i++) {
      const result = await this.detectDuplicate(transactions[i], existingTransactions);
      results.set(i, result);
    }
    
    return results;
  }
  
  /**
   * Encuentra un match exacto
   */
  private static findExactMatch(
    transaction: ParsedTransaction,
    existingTransactions: ExistingTransaction[]
  ): ExistingTransaction | null {
    
    for (const existing of existingTransactions) {
      if (
        existing.date === transaction.date &&
        Math.abs(existing.amount - transaction.amount) < 0.01 &&
        existing.description.trim() === transaction.description.trim()
      ) {
        return existing;
      }
    }
    
    return null;
  }
  
  /**
   * Encuentra un match fuzzy
   */
  private static findFuzzyMatch(
    transaction: ParsedTransaction,
    existingTransactions: ExistingTransaction[]
  ): { transaction: ExistingTransaction; confidence: number } | null {
    
    let bestMatch: { transaction: ExistingTransaction; confidence: number } | null = null;
    
    for (const existing of existingTransactions) {
      // Check date within ±3 days
      const dateDiff = Math.abs(
        new Date(existing.date).getTime() - new Date(transaction.date).getTime()
      ) / (1000 * 60 * 60 * 24);
      
      if (dateDiff > 3) continue;
      
      // Check amount is exact
      if (Math.abs(existing.amount - transaction.amount) >= 0.01) continue;
      
      // Calculate description similarity (Jaccard)
      const similarity = this.jaccardSimilarity(
        existing.description,
        transaction.description
      );
      
      // Calculate confidence score
      const dateScore = (3 - dateDiff) / 3 * 30; // Max 30 points
      const amountScore = 30; // Exact amount = 30 points
      const descScore = similarity * 40; // Max 40 points
      const confidence = dateScore + amountScore + descScore;
      
      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = { transaction: existing, confidence };
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Calcula la similitud de Jaccard entre dos strings
   */
  private static jaccardSimilarity(str1: string, str2: string): number {
    const tokens1 = this.tokenize(str1);
    const tokens2 = this.tokenize(str2);
    
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    if (union.size === 0) return 0;
    
    return intersection.size / union.size;
  }
  
  /**
   * Tokeniza un string (lowercase, remove special chars, split)
   */
  private static tokenize(str: string): string[] {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }
}
