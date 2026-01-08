import { BankTransaction } from '@/database/simple-db';
import { DuplicateDetectionService, DuplicateDetectionResult } from './DuplicateDetectionService';

export interface BankImportOptions {
    skipDuplicateCheck?: boolean;
    autoSkipDuplicates?: boolean; // If true, automatically skip duplicates without asking
}

export interface BankImportResult {
    success: boolean;
    message: string;
    importedCount: number;
    skippedCount?: number;
    duplicateDetection?: DuplicateDetectionResult;
}

/**
 * Enhanced bank transaction import service with duplicate detection
 */
export class BankImportService {

    /**
     * Validates and prepares transactions for import with duplicate detection
     * @param bankAccountId - Target bank account
     * @param newTransactions - Transactions to import
     * @param existingTransactions - Already imported transactions
     * @param options - Import options
     * @returns Validation result with duplicates detected
     */
    static validateImport(
        bankAccountId: number,
        newTransactions: Partial<BankTransaction>[],
        existingTransactions: BankTransaction[],
        options: BankImportOptions = {}
    ): BankImportResult {

        // 1. Validate amounts (detect potential cents/dollars confusion)
        const validationErrors = this.validateAmounts(newTransactions);
        if (validationErrors.length > 0) {
            return {
                success: false,
                message: `Errores de validación: ${validationErrors.join(', ')}`,
                importedCount: 0
            };
        }

        // 2. Duplicate detection (unless skipped)
        if (!options.skipDuplicateCheck) {
            const duplicateResult = DuplicateDetectionService.findPotentialDuplicates(
                bankAccountId,
                newTransactions,
                existingTransactions
            );

            if (duplicateResult.hasDuplicates) {
                const summary = DuplicateDetectionService.generateDuplicateSummary(duplicateResult);

                return {
                    success: false,
                    message: summary,
                    importedCount: 0,
                    skippedCount: duplicateResult.potentialDuplicates.length,
                    duplicateDetection: duplicateResult
                };
            }
        }

        // 3. All validations passed
        return {
            success: true,
            message: `${newTransactions.length} transacciones listas para importar`,
            importedCount: 0 // Not imported yet, just validated
        };
    }

    /**
     * Validates transaction amounts to detect potential cents/dollars confusion
     * @param transactions - Transactions to validate
     * @returns Array of validation error messages
     */
    private static validateAmounts(transactions: Partial<BankTransaction>[]): string[] {
        const errors: string[] = [];

        transactions.forEach((tx, index) => {
            if (!tx.amount) {
                errors.push(`Transacción ${index + 1}: Monto faltante`);
                return;
            }

            // Check for suspiciously large amounts (possible cents confusion)
            // If amount > $1,000,000, it might be cents instead of dollars
            if (Math.abs(tx.amount) > 1000000) {
                errors.push(
                    `Transacción ${index + 1} (${tx.description}): ` +
                    `Monto sospechosamente alto: $${tx.amount.toFixed(2)}. ` +
                    `¿Podría ser un error de conversión cents/dollars?`
                );
            }

            // Check for invalid amounts
            if (isNaN(tx.amount)) {
                errors.push(`Transacción ${index + 1}: Monto inválido (NaN)`);
            }

            // Check for amounts with too many decimal places
            const decimalPlaces = (tx.amount.toString().split('.')[1] || '').length;
            if (decimalPlaces > 2) {
                errors.push(
                    `Transacción ${index + 1}: Monto con demasiados decimales (${decimalPlaces}). ` +
                    `Se esperan máximo 2 decimales.`
                );
            }
        });

        return errors;
    }

    /**
     * Generates a detailed import summary
     */
    static generateImportSummary(
        totalTransactions: number,
        importedCount: number,
        skippedCount: number,
        duplicateDetection?: DuplicateDetectionResult
    ): string {
        let summary = `📊 Resumen de Importación:\n\n`;
        summary += `Total de transacciones procesadas: ${totalTransactions}\n`;
        summary += `✅ Importadas exitosamente: ${importedCount}\n`;

        if (skippedCount > 0) {
            summary += `⏭️ Omitidas (duplicados): ${skippedCount}\n`;
        }

        if (duplicateDetection && duplicateDetection.hasDuplicates) {
            summary += `\n⚠️ Duplicados detectados:\n`;
            duplicateDetection.potentialDuplicates.slice(0, 3).forEach((dup, idx) => {
                summary += `  ${idx + 1}. ${dup.newTransaction.description} - `;
                summary += `$${dup.newTransaction.amount?.toFixed(2)} `;
                summary += `(${dup.matchScore}% confianza)\n`;
            });

            if (duplicateDetection.potentialDuplicates.length > 3) {
                summary += `  ... y ${duplicateDetection.potentialDuplicates.length - 3} más\n`;
            }
        }

        return summary;
    }
}
