/**
 * AsyncCSVService (Iron Clad Upgrade - Phase 2, Day 4)
 * 
 * Servicio para procesar archivos CSV usando Web Workers sin bloquear la UI.
 * Wrapper sobre el CSV Worker para uso fácil en la aplicación.
 */

import { WorkerOrchestrator } from '../../core/workers/WorkerOrchestrator';

export interface CSVProcessingOptions {
    delimiter?: string;
    header?: boolean;
    skipEmptyLines?: boolean;
    transformHeader?: (header: string) => string;
    validate?: (row: any) => boolean;
    requiredFields?: string[];
    fieldTypes?: Record<string, 'number' | 'string' | 'date' | 'email'>;
    fieldMappings?: Record<string, string>;
    transforms?: Record<string, (value: any, row: any) => any>;
    transform?: (row: any, index: number) => any;
    onProgress?: (percent: number, message: string) => void;
}

export interface CSVProcessingResult {
    success: boolean;
    data?: any[];
    errors?: string[];
    metadata?: {
        rowCount: number;
        columnCount: number;
        processingTime: number;
        validRows: number;
        invalidRows: number;
    };
}

/**
 * Async CSV Service
 */
export class AsyncCSVService {
    private orchestrator: WorkerOrchestrator;
    private activeWorker: Worker | null = null;

    constructor() {
        this.orchestrator = new WorkerOrchestrator();
    }

    /**
     * Parse CSV file
     */
    async parseCSV(file: File, options?: CSVProcessingOptions): Promise<CSVProcessingResult> {
        return this.processCSV('PARSE', file, options);
    }

    /**
     * Generate CSV from data
     */
    async generateCSV(data: any[], options?: CSVProcessingOptions): Promise<string> {
        const result = await this.processCSV('GENERATE', data, options);
        if (result.success && result.data) {
            return result.data as unknown as string;
        }
        throw new Error(result.errors?.[0] || 'CSV generation failed');
    }

    /**
     * Validate CSV file
     */
    async validateCSV(file: File, options?: CSVProcessingOptions): Promise<CSVProcessingResult> {
        return this.processCSV('VALIDATE', file, options);
    }

    /**
     * Transform CSV file
     */
    async transformCSV(file: File, options?: CSVProcessingOptions): Promise<CSVProcessingResult> {
        return this.processCSV('TRANSFORM', file, options);
    }

    /**
     * Process bank statement CSV
     */
    async processBankStatement(file: File, options?: CSVProcessingOptions): Promise<CSVProcessingResult> {
        return this.transformCSV(file, {
            ...options,
            header: true,
            fieldMappings: {
                'Date': 'date',
                'Description': 'description',
                'Amount': 'amount',
                'Balance': 'balance'
            },
            transforms: {
                date: (value: string) => new Date(value).toISOString(),
                amount: (value: string) => parseFloat(value.replace(/[^0-9.-]/g, '')),
                balance: (value: string) => parseFloat(value.replace(/[^0-9.-]/g, ''))
            },
            validate: (row: any) => {
                return row.date && row.amount !== undefined && !isNaN(row.amount);
            }
        });
    }

    /**
     * Process inventory CSV
     */
    async processInventory(file: File, options?: CSVProcessingOptions): Promise<CSVProcessingResult> {
        return this.validateCSV(file, {
            ...options,
            header: true,
            requiredFields: ['sku', 'name', 'quantity', 'price'],
            fieldTypes: {
                sku: 'string',
                name: 'string',
                quantity: 'number',
                price: 'number',
                category: 'string'
            },
            validate: (row: any) => {
                return row.quantity >= 0 && row.price >= 0;
            }
        });
    }

    /**
     * Process customers CSV
     */
    async processCustomers(file: File, options?: CSVProcessingOptions): Promise<CSVProcessingResult> {
        return this.validateCSV(file, {
            ...options,
            header: true,
            requiredFields: ['name', 'email'],
            fieldTypes: {
                name: 'string',
                email: 'email',
                phone: 'string',
                address: 'string'
            }
        });
    }

    /**
     * Export data to CSV file
     */
    async exportToCSV(data: any[], filename: string, options?: CSVProcessingOptions): Promise<void> {
        const csv = await this.generateCSV(data, options);

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    /**
     * Generic CSV processing method
     */
    private async processCSV(
        type: 'PARSE' | 'GENERATE' | 'VALIDATE' | 'TRANSFORM',
        data: any,
        options?: CSVProcessingOptions
    ): Promise<CSVProcessingResult> {
        return new Promise(async (resolve, reject) => {
            try {
                // Spawn CSV worker
                const workerId = await this.orchestrator.spawnWorker('CSV_PROCESSING');
                this.activeWorker = this.orchestrator.getWorker(workerId) || null;

                if (!this.activeWorker) {
                    throw new Error('Failed to retrieve CSV worker instance');
                }

                // Setup message handler
                this.activeWorker.onmessage = (e: MessageEvent) => {
                    const result = e.data;

                    // Handle progress updates
                    if (result.type === 'progress') {
                        if (options?.onProgress) {
                            options.onProgress(result.percent, result.message);
                        }
                        return;
                    }

                    // Handle completion
                    if (result.success) {
                        resolve(result);
                    } else {
                        reject(new Error(result.errors?.[0] || 'CSV processing failed'));
                    }

                    // Cleanup
                    this.cleanup();
                };

                // Setup error handler
                this.activeWorker.onerror = (error: ErrorEvent) => {
                    reject(new Error(`Worker error: ${error.message}`));
                    this.cleanup();
                };

                // Send task to worker
                this.activeWorker.postMessage({
                    type,
                    data,
                    options: {
                        delimiter: options?.delimiter,
                        header: options?.header,
                        skipEmptyLines: options?.skipEmptyLines,
                        transformHeader: options?.transformHeader?.toString(),
                        validate: options?.validate?.toString(),
                        requiredFields: options?.requiredFields,
                        fieldTypes: options?.fieldTypes,
                        fieldMappings: options?.fieldMappings,
                        transforms: options?.transforms ?
                            Object.fromEntries(
                                Object.entries(options.transforms).map(([k, v]) => [k, v.toString()])
                            ) : undefined,
                        transform: options?.transform?.toString()
                    }
                });

            } catch (error: any) {
                reject(new Error(`Failed to spawn CSV worker: ${error.message}`));
                this.cleanup();
            }
        });
    }

    /**
     * Cleanup worker
     */
    private cleanup(): void {
        if (this.activeWorker) {
            this.activeWorker.terminate();
            this.activeWorker = null;
        }
    }

    /**
     * Cancel ongoing CSV processing
     */
    cancel(): void {
        this.cleanup();
    }
}

/**
 * Singleton instance
 */
export const asyncCSVService = new AsyncCSVService();
