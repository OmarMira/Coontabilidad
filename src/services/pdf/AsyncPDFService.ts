/**
 * AsyncPDFService (Iron Clad Upgrade - Phase 2, Day 7 - Updated)
 * 
 * Servicio para generar PDFs usando Web Workers sin bloquear la UI.
 * UPDATED: Ahora usa WorkerPoolManager para reutilizar workers eficientemente.
 */

import { workerPoolManager } from '../../core/workers/WorkerPoolManager';

export interface PDFGenerationOptions {
    orientation?: 'portrait' | 'landscape';
    format?: 'letter' | 'a4';
    compress?: boolean;
    onProgress?: (percent: number, message: string) => void;
}

export interface PDFGenerationResult {
    success: boolean;
    pdf?: Blob;
    error?: string;
    metadata?: {
        pages: number;
        size: number;
        generationTime: number;
    };
}

/**
 * Async PDF Service (Updated to use Worker Pool)
 */
export class AsyncPDFService {
    // No longer needs orchestrator or activeWorker as WorkerPoolManager handles lifecycle
    private activeWorkerInstance: Worker | null = null; // To keep track of the worker for cancellation

    constructor() {
        // WorkerPoolManager is a singleton, no need to instantiate here
    }

    /**
     * Generate DR-15 Report PDF
     */
    async generateDR15(data: any, options?: PDFGenerationOptions): Promise<Blob> {
        return this.generatePDF('DR15', data, options);
    }

    /**
     * Generate Form 941 PDF
     */
    async generateForm941(data: any, options?: PDFGenerationOptions): Promise<Blob> {
        return this.generatePDF('FORM941', data, options);
    }

    /**
     * Generate Invoice PDF
     */
    async generateInvoice(data: any, options?: PDFGenerationOptions): Promise<Blob> {
        return this.generatePDF('INVOICE', data, options);
    }

    /**
     * Generate Balance Sheet PDF
     */
    async generateBalanceSheet(data: any, options?: PDFGenerationOptions): Promise<Blob> {
        return this.generatePDF('BALANCE_SHEET', data, options);
    }

    /**
     * Generate Income Statement PDF
     */
    async generateIncomeStatement(data: any, options?: PDFGenerationOptions): Promise<Blob> {
        return this.generatePDF('INCOME_STATEMENT', data, options);
    }

    /**
     * Generate Custom Report PDF
     */
    async generateCustomReport(data: any, options?: PDFGenerationOptions): Promise<Blob> {
        return this.generatePDF('CUSTOM', data, options);
    }

    /**
     * Generic PDF generation method (Updated to use Worker Pool)
     */
    private async generatePDF(
        type: string,
        data: any,
        options?: PDFGenerationOptions
    ): Promise<Blob> {
        try {
            // Use Worker Pool Manager to execute task
            const result = await workerPoolManager.executeTask<PDFGenerationResult>(
                'PDF',
                {
                    type,
                    data,
                    options: {
                        orientation: options?.orientation,
                        format: options?.format,
                        compress: options?.compress
                    }
                },
                options?.onProgress
            );

            if (result.success && result.pdf) {
                return result.pdf;
            } else {
                throw new Error(result.error || 'PDF generation failed');
            }
        } catch (error: any) {
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }
    }

    /**
     * Cancel ongoing PDF generation
     * Note: With Worker Pool, cancellation is not directly supported
     * as workers are reused. Consider implementing task cancellation
     * in WorkerPoolManager if needed.
     */
    cancel(): void {
        console.warn('Cancel not implemented with Worker Pool. Task will complete in background.');
    }
}

/**
 * Singleton instance
 */
export const asyncPDFService = new AsyncPDFService();
