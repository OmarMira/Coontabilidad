import { logger } from '../core/logging/SystemLogger';
// reconciliation.worker.ts - Worker para matching masivo de conciliaciÃ³n bancaria
import type { BankTransaction, JournalEntry, ReconciliationMatch } from '@/database/modules/db-types';

export interface ReconciliationTask {
  type: 'AUTO_MATCH' | 'BULK_ANALYSIS' | 'DISCREPANCY_DETECTION';
  statementId: number;
  transactions: BankTransaction[];
  journalEntries?: JournalEntry[];
  matchingCriteria?: MatchingCriteria;
}

export interface MatchingCriteria {
  amountTolerance: number; // Tolerancia en monto (ej: 0.01 para 1 centavo)
  dateTolerance: number; // Tolerancia en dÃ­as
  minConfidence: number; // Confianza mÃ­nima para auto-match
  enableFuzzyMatching: boolean; // Matching por descripciÃ³n similar
}

export interface ReconciliationResult {
  statementId: number;
  matches: PotentialMatch[];
  summary: {
    totalTransactions: number;
    highConfidenceMatches: number;
    mediumConfidenceMatches: number;
    needsReview: number;
    unmatched: number;
    processingTime: number;
  };
  discrepancies?: Discrepancy[];
}

export interface PotentialMatch {
  transactionId: number;
  potentialMatches: MatchCandidate[];
  bestMatch: MatchCandidate | null;
  confidence: number;
  autoMatchable: boolean;
}

export interface MatchCandidate {
  journalEntryId: number | undefined;
  confidence: number;
  matchReasons: string[];
  amount: number;
  date: string;
  description: string;
}

export interface Discrepancy {
  type: 'amount_mismatch' | 'date_mismatch' | 'missing_transaction' | 'duplicate_entry';
  severity: 'low' | 'medium' | 'high';
  description: string;
  transactionId?: number;
  journalEntryId?: number;
  suggestedAction: string;
}

// Worker message handler
self.onmessage = async (event: MessageEvent) => {
  const { type, taskId, payload } = event.data;

  if (type !== 'EXECUTE_TASK') {
    return;
  }

  const startTime = performance.now();

  try {
    const task = payload as ReconciliationTask;
    let result: ReconciliationResult;

    switch (task.type) {
      case 'AUTO_MATCH':
        result = await performAutoMatching(task);
        break;

      case 'BULK_ANALYSIS':
        result = await performBulkAnalysis(task);
        break;

      case 'DISCREPANCY_DETECTION':
        result = await detectDiscrepancies(task);
        break;

      default:
        throw new Error(`Tipo de tarea no soportado: ${task.type}`);
    }

    const endTime = performance.now();
    result.summary.processingTime = endTime - startTime;

    // Send success response
    self.postMessage({
      taskId,
      type: 'TASK_COMPLETE',
      payload: result
    });

  } catch (error) {
    logger.error('reconciliation.worker', 'error', 'Error in reconciliation worker:', error);
    
    // Send error response
    self.postMessage({
      taskId,
      type: 'TASK_ERROR',
      error: error instanceof Error ? error.message : 'Error desconocido en worker de conciliaciÃ³n'
    });
  }
};

async function performAutoMatching(task: ReconciliationTask): Promise<ReconciliationResult> {
  const { transactions, journalEntries = [], matchingCriteria } = task;
  const criteria = matchingCriteria || getDefaultCriteria();
  
  const matches: PotentialMatch[] = [];
  let highConfidence = 0;
  let mediumConfidence = 0;
  let needsReview = 0;
  let unmatched = 0;

  for (const transaction of transactions) {
    const potentialMatches = findPotentialMatches(transaction, journalEntries, criteria);
    const bestMatch = potentialMatches.length > 0 ? potentialMatches[0] : null;
    const confidence = bestMatch ? bestMatch.confidence : 0;
    
    const match: PotentialMatch = {
      transactionId: transaction.id,
      potentialMatches: potentialMatches.slice(0, 5), // Top 5 matches
      bestMatch,
      confidence,
      autoMatchable: confidence >= criteria.minConfidence
    };
    
    matches.push(match);
    
    // Categorizar por confianza
    if (confidence >= 0.8) {
      highConfidence++;
    } else if (confidence >= 0.5) {
      mediumConfidence++;
    } else if (confidence >= 0.3) {
      needsReview++;
    } else {
      unmatched++;
    }

    // Yield control periodically for large batches
    if (matches.length % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return {
    statementId: task.statementId,
    matches,
    summary: {
      totalTransactions: transactions.length,
      highConfidenceMatches: highConfidence,
      mediumConfidenceMatches: mediumConfidence,
      needsReview,
      unmatched,
      processingTime: 0 // Will be set by caller
    }
  };
}

async function performBulkAnalysis(task: ReconciliationTask): Promise<ReconciliationResult> {
  // AnÃ¡lisis completo incluyendo detecciÃ³n de patrones
  const autoMatchResult = await performAutoMatching(task);
  
  // AnÃ¡lisis adicional de patrones
  const patterns = analyzeTransactionPatterns(task.transactions);
  
  // Agregar informaciÃ³n de patrones a los matches
  autoMatchResult.matches.forEach(match => {
    const transaction = task.transactions.find(t => t.id === match.transactionId);
    if (transaction && patterns.has(transaction.description)) {
      const pattern = patterns.get(transaction.description)!;
      if (pattern.frequency > 3) { // TransacciÃ³n recurrente
        match.confidence = Math.min(match.confidence + 0.1, 1.0);
      }
    }
  });

  return autoMatchResult;
}

async function detectDiscrepancies(task: ReconciliationTask): Promise<ReconciliationResult> {
  const result = await performAutoMatching(task);
  const discrepancies: Discrepancy[] = [];

  // Detectar transacciones duplicadas
  const amountGroups = new Map<number, BankTransaction[]>();
  task.transactions.forEach(t => {
    const amount = Math.round(t.amount * 100) / 100; // Redondear a centavos
    if (!amountGroups.has(amount)) {
      amountGroups.set(amount, []);
    }
    amountGroups.get(amount)!.push(t);
  });

  amountGroups.forEach((transactions, amount) => {
    if (transactions.length > 1) {
      // Verificar si son realmente duplicados (misma fecha y descripciÃ³n similar)
      for (let i = 0; i < transactions.length - 1; i++) {
        for (let j = i + 1; j < transactions.length; j++) {
          const t1 = transactions[i];
          const t2 = transactions[j];
          
          const daysDiff = Math.abs(new Date(t1.transaction_date).getTime() - new Date(t2.transaction_date).getTime()) / (1000 * 60 * 60 * 24);
          const descSimilarity = calculateStringSimilarity(t1.description, t2.description);
          
          if (daysDiff <= 1 && descSimilarity > 0.8) {
            discrepancies.push({
              type: 'duplicate_entry',
              severity: 'medium',
              description: `Posible transacciÃ³n duplicada: $${amount} en ${t1.transaction_date}`,
              transactionId: t1.id,
              suggestedAction: 'Revisar y eliminar duplicado si es necesario'
            });
          }
        }
      }
    }
  });

  // Detectar montos inusuales (outliers)
  const amounts = task.transactions.map(t => Math.abs(t.amount));
  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length);
  
  task.transactions.forEach(t => {
    const amount = Math.abs(t.amount);
    if (amount > avgAmount + (3 * stdDev)) { // 3 desviaciones estÃ¡ndar
      discrepancies.push({
        type: 'amount_mismatch',
        severity: 'low',
        description: `Monto inusualmente alto: $${amount.toLocaleString()}`,
        transactionId: t.id,
        suggestedAction: 'Verificar la exactitud del monto'
      });
    }
  });

  result.discrepancies = discrepancies;
  return result;
}

function findPotentialMatches(transaction: BankTransaction, journalEntries: JournalEntry[], criteria: MatchingCriteria): MatchCandidate[] {
  const candidates: MatchCandidate[] = [];
  
  for (const entry of journalEntries) {
    const confidence = calculateMatchConfidence(transaction, entry, criteria);
    
    if (confidence > 0.1) { // Solo incluir matches con algo de confianza
      const reasons = getMatchReasons(transaction, entry, criteria);
      
      candidates.push({
        journalEntryId: entry.id,
        confidence,
        matchReasons: reasons,
        amount: entry.total_debit,
        date: entry.entry_date,
        description: entry.description || ''
      });
    }
  }
  
  // Ordenar por confianza descendente
  return candidates.sort((a, b) => b.confidence - a.confidence);
}

function calculateMatchConfidence(transaction: BankTransaction, entry: JournalEntry, criteria: MatchingCriteria): number {
  let confidence = 0;
  
  // Matching por monto
  const amountDiff = Math.abs(Math.abs(transaction.amount) - entry.total_debit);
  if (amountDiff <= criteria.amountTolerance) {
    confidence += 0.4; // 40% por monto exacto
  } else if (amountDiff <= criteria.amountTolerance * 10) {
    confidence += 0.2; // 20% por monto cercano
  }
  
  // Matching por fecha
  const daysDiff = Math.abs(new Date(transaction.transaction_date).getTime() - new Date(entry.entry_date).getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff <= criteria.dateTolerance) {
    confidence += 0.3 * (1 - daysDiff / criteria.dateTolerance); // Hasta 30% por fecha
  }
  
  // Matching por descripciÃ³n (si estÃ¡ habilitado)
  if (criteria.enableFuzzyMatching && transaction.description && entry.description) {
    const similarity = calculateStringSimilarity(transaction.description.toLowerCase(), entry.description.toLowerCase());
    confidence += 0.2 * similarity; // Hasta 20% por descripciÃ³n
  }
  
  // Matching por referencia
  if (transaction.reference_number && entry.reference_number && transaction.reference_number === entry.reference_number) {
    confidence += 0.1; // 10% por referencia exacta
  }
  
  return Math.min(confidence, 1.0);
}

function getMatchReasons(transaction: BankTransaction, entry: JournalEntry, criteria: MatchingCriteria): string[] {
  const reasons: string[] = [];
  
  const amountDiff = Math.abs(Math.abs(transaction.amount) - entry.total_debit);
  if (amountDiff <= criteria.amountTolerance) {
    reasons.push('Monto exacto');
  } else if (amountDiff <= criteria.amountTolerance * 10) {
    reasons.push('Monto similar');
  }
  
  const daysDiff = Math.abs(new Date(transaction.transaction_date).getTime() - new Date(entry.entry_date).getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff <= criteria.dateTolerance) {
    if (daysDiff === 0) {
      reasons.push('Misma fecha');
    } else {
      reasons.push(`Fecha cercana (${Math.round(daysDiff)} dÃ­as)`);
    }
  }
  
  if (transaction.description && entry.description) {
    const similarity = calculateStringSimilarity(transaction.description.toLowerCase(), entry.description.toLowerCase());
    if (similarity > 0.7) {
      reasons.push('DescripciÃ³n similar');
    }
  }
  
  if (transaction.reference_number && entry.reference_number && transaction.reference_number === entry.reference_number) {
    reasons.push('Misma referencia');
  }
  
  return reasons;
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let matches = 0;
  for (const word1 of words1) {
    if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      matches++;
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

function analyzeTransactionPatterns(transactions: BankTransaction[]): Map<string, { frequency: number; avgAmount: number }> {
  const patterns = new Map<string, { frequency: number; totalAmount: number; count: number }>();
  
  transactions.forEach(t => {
    const key = t.description.toLowerCase().trim();
    if (!patterns.has(key)) {
      patterns.set(key, { frequency: 0, totalAmount: 0, count: 0 });
    }
    
    const pattern = patterns.get(key)!;
    pattern.frequency++;
    pattern.totalAmount += Math.abs(t.amount);
    pattern.count++;
  });
  
  // Convertir a formato final
  const result = new Map<string, { frequency: number; avgAmount: number }>();
  patterns.forEach((value, key) => {
    result.set(key, {
      frequency: value.frequency,
      avgAmount: value.totalAmount / value.count
    });
  });
  
  return result;
}

function getDefaultCriteria(): MatchingCriteria {
  return {
    amountTolerance: 0.01, // 1 centavo
    dateTolerance: 3, // 3 dÃ­as
    minConfidence: 0.8, // 80% confianza mÃ­nima para auto-match
    enableFuzzyMatching: true
  };
}

// Export types for main thread
