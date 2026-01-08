import { BankTransaction } from '@/database/simple-db';

export interface DuplicateMatch {
    existingTransaction: BankTransaction;
    newTransaction: Partial<BankTransaction>;
    matchScore: number; // 0-100
    matchReasons: string[];
}

export interface DuplicateDetectionResult {
    hasDuplicates: boolean;
    potentialDuplicates: DuplicateMatch[];
    safeToImport: Partial<BankTransaction>[];
}

/**
 * Service for detecting potential duplicate bank transactions
 * Uses multiple heuristics: exact match, fuzzy match, date proximity
 */
export class DuplicateDetectionService {

    /**
     * Finds potential duplicates by comparing new transactions against existing ones
     * @param bankAccountId - The bank account ID to check against
     * @param newTransactions - Transactions to be imported
     * @param existingTransactions - Already imported transactions
     * @returns Detection result with duplicates and safe transactions
     */
    static findPotentialDuplicates(
        bankAccountId: number,
        newTransactions: Partial<BankTransaction>[],
        existingTransactions: BankTransaction[]
    ): DuplicateDetectionResult {

        const potentialDuplicates: DuplicateMatch[] = [];
        const safeToImport: Partial<BankTransaction>[] = [];

        // Filter existing transactions for this account only
        const accountTransactions = existingTransactions.filter(
            tx => tx.bank_account_id === bankAccountId
        );

        for (const newTx of newTransactions) {
            let isDuplicate = false;

            for (const existingTx of accountTransactions) {
                const match = this.calculateMatchScore(newTx, existingTx);

                if (match.matchScore >= 80) {
                    // High confidence duplicate
                    potentialDuplicates.push({
                        existingTransaction: existingTx,
                        newTransaction: newTx,
                        matchScore: match.matchScore,
                        matchReasons: match.matchReasons
                    });
                    isDuplicate = true;
                    break; // Stop checking once we find a duplicate
                }
            }

            if (!isDuplicate) {
                safeToImport.push(newTx);
            }
        }

        return {
            hasDuplicates: potentialDuplicates.length > 0,
            potentialDuplicates,
            safeToImport
        };
    }

    /**
     * Calculates match score between two transactions
     * @returns Match score (0-100) and reasons
     */
    private static calculateMatchScore(
        newTx: Partial<BankTransaction>,
        existingTx: BankTransaction
    ): { matchScore: number; matchReasons: string[] } {

        let score = 0;
        const reasons: string[] = [];

        // 1. Exact Amount Match (40 points)
        if (newTx.amount === existingTx.amount) {
            score += 40;
            reasons.push('Monto exacto');
        } else if (Math.abs((newTx.amount || 0) - existingTx.amount) < 0.01) {
            // Within 1 cent (floating point tolerance)
            score += 35;
            reasons.push('Monto casi exacto');
        }

        // 2. Date Match (30 points)
        if (newTx.transaction_date === existingTx.transaction_date) {
            score += 30;
            reasons.push('Fecha exacta');
        } else if (this.isDateWithinDays(newTx.transaction_date, existingTx.transaction_date, 1)) {
            score += 20;
            reasons.push('Fecha cercana (±1 día)');
        }

        // 3. Reference Number Match (20 points)
        if (newTx.reference_number && existingTx.reference_number) {
            if (newTx.reference_number === existingTx.reference_number) {
                score += 20;
                reasons.push('Número de referencia exacto');
            }
        }

        // 4. Description Similarity (10 points)
        const descSimilarity = this.calculateStringSimilarity(
            newTx.description || '',
            existingTx.description
        );
        if (descSimilarity > 0.8) {
            score += 10;
            reasons.push('Descripción similar');
        } else if (descSimilarity > 0.5) {
            score += 5;
            reasons.push('Descripción parcialmente similar');
        }

        return { matchScore: score, matchReasons: reasons };
    }

    /**
     * Checks if two dates are within N days of each other
     */
    private static isDateWithinDays(date1: string | undefined, date2: string, days: number): boolean {
        if (!date1) return false;

        try {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            const diffMs = Math.abs(d1.getTime() - d2.getTime());
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            return diffDays <= days;
        } catch {
            return false;
        }
    }

    /**
     * Calculates string similarity using Levenshtein distance
     * Returns a value between 0 (completely different) and 1 (identical)
     */
    private static calculateStringSimilarity(str1: string, str2: string): number {
        const s1 = str1.toUpperCase().trim();
        const s2 = str2.toUpperCase().trim();

        if (s1 === s2) return 1;
        if (s1.length === 0 || s2.length === 0) return 0;

        // Simple Levenshtein distance
        const matrix: number[][] = [];

        for (let i = 0; i <= s2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= s1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= s2.length; i++) {
            for (let j = 1; j <= s1.length; j++) {
                if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        const distance = matrix[s2.length][s1.length];
        const maxLength = Math.max(s1.length, s2.length);
        return 1 - (distance / maxLength);
    }

    /**
     * Generates a human-readable summary of duplicate detection results
     */
    static generateDuplicateSummary(result: DuplicateDetectionResult): string {
        if (!result.hasDuplicates) {
            return `✅ No se detectaron duplicados. ${result.safeToImport.length} transacciones listas para importar.`;
        }

        const duplicateCount = result.potentialDuplicates.length;
        const safeCount = result.safeToImport.length;

        let summary = `⚠️ Se detectaron ${duplicateCount} posibles duplicados:\n\n`;

        result.potentialDuplicates.slice(0, 5).forEach((dup, idx) => {
            summary += `${idx + 1}. ${dup.newTransaction.description} - $${dup.newTransaction.amount?.toFixed(2)}\n`;
            summary += `   Coincide con: ${dup.existingTransaction.description} (${dup.existingTransaction.transaction_date})\n`;
            summary += `   Confianza: ${dup.matchScore}% - ${dup.matchReasons.join(', ')}\n\n`;
        });

        if (duplicateCount > 5) {
            summary += `... y ${duplicateCount - 5} más.\n\n`;
        }

        summary += `${safeCount} transacciones son seguras para importar.`;

        return summary;
    }
}
