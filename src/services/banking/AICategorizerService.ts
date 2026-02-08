/**
 * AICategorizerService - Categoriza transacciones usando ML
 * 
 * Implementa un clasificador Naive Bayes simple para categorizar
 * transacciones bancarias basándose en la descripción.
 */

import { ParsedTransaction } from './FileParserService';

export interface TrainingExample {
  description: string;
  category: string;
  amount?: number;
  transactionType?: 'debit' | 'credit';
}

export interface CategorizationResult {
  category: string;
  confidence: number; // 0-100
  autoSelected: boolean;
}

interface CategoryStats {
  count: number;
  tokenCounts: Map<string, number>;
  totalTokens: number;
}

export class AICategorizerService {
  private categoryStats: Map<string, CategoryStats> = new Map();
  private totalExamples: number = 0;
  private vocabulary: Set<string> = new Set();
  
  /**
   * Entrena el modelo con datos históricos
   */
  train(examples: TrainingExample[]): void {
    this.categoryStats.clear();
    this.vocabulary.clear();
    this.totalExamples = examples.length;
    
    // Build category statistics
    for (const example of examples) {
      const tokens = this.extractFeatures(example.description);
      
      if (!this.categoryStats.has(example.category)) {
        this.categoryStats.set(example.category, {
          count: 0,
          tokenCounts: new Map(),
          totalTokens: 0
        });
      }
      
      const stats = this.categoryStats.get(example.category)!;
      stats.count++;
      
      for (const token of tokens) {
        this.vocabulary.add(token);
        stats.tokenCounts.set(token, (stats.tokenCounts.get(token) || 0) + 1);
        stats.totalTokens++;
      }
    }
  }
  
  /**
   * Categoriza una transacción
   */
  categorize(transaction: ParsedTransaction): CategorizationResult {
    if (this.categoryStats.size === 0) {
      return {
        category: 'Uncategorized',
        confidence: 0,
        autoSelected: false
      };
    }
    
    const tokens = this.extractFeatures(transaction.description);
    let bestCategory = '';
    let bestProbability = -Infinity;
    
    // Calculate probability for each category
    for (const [category, stats] of this.categoryStats.entries()) {
      const probability = this.calculateProbability(tokens, category, stats);
      
      if (probability > bestProbability) {
        bestProbability = probability;
        bestCategory = category;
      }
    }
    
    // Convert log probability to confidence score (0-100)
    const confidence = this.probabilityToConfidence(bestProbability);
    
    return {
      category: bestCategory,
      confidence,
      autoSelected: confidence > 70
    };
  }
  
  /**
   * Categoriza múltiples transacciones
   */
  categorizeBatch(transactions: ParsedTransaction[]): CategorizationResult[] {
    return transactions.map(t => this.categorize(t));
  }
  
  /**
   * Agrega un ejemplo de entrenamiento
   */
  addTrainingExample(example: TrainingExample): void {
    const tokens = this.extractFeatures(example.description);
    
    if (!this.categoryStats.has(example.category)) {
      this.categoryStats.set(example.category, {
        count: 0,
        tokenCounts: new Map(),
        totalTokens: 0
      });
    }
    
    const stats = this.categoryStats.get(example.category)!;
    stats.count++;
    this.totalExamples++;
    
    for (const token of tokens) {
      this.vocabulary.add(token);
      stats.tokenCounts.set(token, (stats.tokenCounts.get(token) || 0) + 1);
      stats.totalTokens++;
    }
  }
  
  /**
   * Extrae features de una descripción
   */
  private extractFeatures(description: string): string[] {
    // Tokenize and normalize
    const tokens = description
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2); // Remove short tokens
    
    // Remove common stopwords
    const stopwords = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'are', 'was', 'were']);
    return tokens.filter(token => !stopwords.has(token));
  }
  
  /**
   * Calcula la probabilidad de una categoría dado los tokens (Naive Bayes)
   */
  private calculateProbability(
    tokens: string[],
    category: string,
    stats: CategoryStats
  ): number {
    // P(category)
    const priorProbability = Math.log(stats.count / this.totalExamples);
    
    // P(tokens | category) using Laplace smoothing
    let tokenProbability = 0;
    const vocabularySize = this.vocabulary.size;
    
    for (const token of tokens) {
      const tokenCount = stats.tokenCounts.get(token) || 0;
      // Laplace smoothing: (count + 1) / (total + vocabulary_size)
      const probability = (tokenCount + 1) / (stats.totalTokens + vocabularySize);
      tokenProbability += Math.log(probability);
    }
    
    // P(category | tokens) ∝ P(category) * P(tokens | category)
    return priorProbability + tokenProbability;
  }
  
  /**
   * Convierte log probability a confidence score (0-100)
   */
  private probabilityToConfidence(logProbability: number): number {
    // Normalize log probability to 0-100 range
    // This is a heuristic mapping
    const normalized = Math.exp(logProbability);
    const confidence = Math.min(100, Math.max(0, normalized * 100));
    return Math.round(confidence);
  }
  
  /**
   * Obtiene estadísticas del modelo
   */
  getStats(): {
    totalExamples: number;
    totalCategories: number;
    vocabularySize: number;
  } {
    return {
      totalExamples: this.totalExamples,
      totalCategories: this.categoryStats.size,
      vocabularySize: this.vocabulary.size
    };
  }
}
