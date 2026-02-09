/**
 * CSV Worker (Iron Clad Upgrade - Phase 2, Day 2)
 * 
 * Procesa archivos CSV grandes en background sin bloquear la UI.
 * Soporta:
 * - Parsing de CSV con streaming
 * - Validación de datos
 * - Transformación de datos
 * - Generación de CSV
 * - Import de transacciones bancarias
 * - Import de inventario
 */

import Papa from 'papaparse';

interface CSVProcessingTask {
    type: 'PARSE' | 'GENERATE' | 'VALIDATE' | 'TRANSFORM';
    data: any;
    options?: {
        delimiter?: string;
        header?: boolean;
        skipEmptyLines?: boolean;
        transformHeader?: (header: string) => string;
        validate?: (row: any) => boolean;
    };
}

interface CSVProcessingResult {
    success: boolean;
    data?: any;
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
 * Main message handler
 */
self.onmessage = async (e: MessageEvent) => {
    const startTime = Date.now();
    const task: CSVProcessingTask = e.data;

    try {
        postProgress(0, 'Initializing CSV processor...');

        let result: any;

        switch (task.type) {
            case 'PARSE':
                result = await parseCSV(task.data, task.options);
                break;
            case 'GENERATE':
                result = await generateCSV(task.data, task.options);
                break;
            case 'VALIDATE':
                result = await validateCSV(task.data, task.options);
                break;
            case 'TRANSFORM':
                result = await transformCSV(task.data, task.options);
                break;
            default:
                throw new Error(`Unknown CSV operation: ${task.type}`);
        }

        const processingTime = Date.now() - startTime;

        postProgress(100, 'CSV processing complete!');

        const response: CSVProcessingResult = {
            success: true,
            data: result.data,
            errors: result.errors,
            metadata: {
                ...result.metadata,
                processingTime
            }
        };

        self.postMessage(response);

    } catch (error: any) {
        const response: CSVProcessingResult = {
            success: false,
            errors: [error.message]
        };
        self.postMessage(response);
    }
};

/**
 * Parse CSV file
 */
async function parseCSV(file: File | string, options?: any): Promise<any> {
    postProgress(10, 'Starting CSV parsing...');

    return new Promise((resolve, reject) => {
        const config: Papa.ParseConfig = {
            header: options?.header !== false,
            delimiter: options?.delimiter || ',',
            skipEmptyLines: options?.skipEmptyLines !== false,
            transformHeader: options?.transformHeader,
            dynamicTyping: true,
            complete: (results: Papa.ParseResult<any>) => {
                postProgress(80, 'Parsing complete, processing results...');

                const errors: string[] = [];
                const validRows: any[] = [];
                const invalidRows: any[] = [];

                // Validate rows if validator provided
                if (options?.validate) {
                    results.data.forEach((row: any, index: number) => {
                        try {
                            if (options.validate(row)) {
                                validRows.push(row);
                            } else {
                                invalidRows.push({ row, index, reason: 'Validation failed' });
                            }
                        } catch (error: any) {
                            invalidRows.push({ row, index, reason: error.message });
                        }
                    });
                } else {
                    validRows.push(...results.data);
                }

                // Collect parsing errors
                if (results.errors && results.errors.length > 0) {
                    results.errors.forEach((error: any) => {
                        errors.push(`Row ${error.row}: ${error.message}`);
                    });
                }

                resolve({
                    data: validRows,
                    errors: errors.concat(invalidRows.map(r => `Row ${r.index}: ${r.reason}`)),
                    metadata: {
                        rowCount: results.data.length,
                        columnCount: results.meta.fields?.length || 0,
                        validRows: validRows.length,
                        invalidRows: invalidRows.length
                    }
                });
            },
            // @ts-ignore Papa.parse accepts error callback even if types don't show it
            error: (error: Error) => {
                reject(error);
            },
            step: (row: Papa.ParseStepResult<any>) => {
                // Report progress during streaming
                const progress = Math.min(70, (row.meta.cursor / (file as File).size) * 70);
                postProgress(10 + progress, `Parsing row ${row.meta.cursor}...`);
            }
        };

        // @ts-ignore Papa.parse can accept File or string
        Papa.parse(file, config);
    });
}

/**
 * Generate CSV from data
 */
async function generateCSV(data: any[], options?: any): Promise<any> {
    postProgress(10, 'Generating CSV...');

    try {
        const csv = Papa.unparse(data, {
            delimiter: options?.delimiter || ',',
            header: options?.header !== false,
            skipEmptyLines: options?.skipEmptyLines !== false
        });

        postProgress(80, 'CSV generation complete!');

        return {
            data: csv,
            errors: [],
            metadata: {
                rowCount: data.length,
                columnCount: Object.keys(data[0] || {}).length,
                validRows: data.length,
                invalidRows: 0
            }
        };
    } catch (error: any) {
        throw new Error(`CSV generation failed: ${error.message}`);
    }
}

/**
 * Validate CSV data
 */
async function validateCSV(data: any, options?: any): Promise<any> {
    postProgress(10, 'Validating CSV data...');

    // First parse the CSV
    const parseResult = await parseCSV(data, options);

    postProgress(50, 'Running validation rules...');

    const validationErrors: string[] = [];
    const validRows: any[] = [];
    const invalidRows: any[] = [];

    parseResult.data.forEach((row: any, index: number) => {
        const rowErrors: string[] = [];

        // Check for required fields
        if (options?.requiredFields) {
            options.requiredFields.forEach((field: string) => {
                if (!row[field] || row[field] === '') {
                    rowErrors.push(`Missing required field: ${field}`);
                }
            });
        }

        // Check data types
        if (options?.fieldTypes) {
            Object.entries(options.fieldTypes).forEach(([field, type]) => {
                if (row[field] !== undefined && row[field] !== null) {
                    const value = row[field];
                    let isValid = true;

                    switch (type) {
                        case 'number':
                            isValid = typeof value === 'number' && !isNaN(value);
                            break;
                        case 'string':
                            isValid = typeof value === 'string';
                            break;
                        case 'date':
                            isValid = !isNaN(Date.parse(value));
                            break;
                        case 'email':
                            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                            break;
                    }

                    if (!isValid) {
                        rowErrors.push(`Invalid ${type} in field: ${field}`);
                    }
                }
            });
        }

        // Custom validation
        if (options?.validate) {
            try {
                if (!options.validate(row)) {
                    rowErrors.push('Custom validation failed');
                }
            } catch (error: any) {
                rowErrors.push(`Validation error: ${error.message}`);
            }
        }

        if (rowErrors.length > 0) {
            invalidRows.push({ row, index, errors: rowErrors });
            validationErrors.push(`Row ${index + 1}: ${rowErrors.join(', ')}`);
        } else {
            validRows.push(row);
        }

        // Report progress
        const progress = 50 + ((index / parseResult.data.length) * 40);
        postProgress(progress, `Validated ${index + 1} of ${parseResult.data.length} rows...`);
    });

    postProgress(90, 'Validation complete!');

    return {
        data: validRows,
        errors: validationErrors,
        metadata: {
            rowCount: parseResult.data.length,
            columnCount: parseResult.metadata.columnCount,
            validRows: validRows.length,
            invalidRows: invalidRows.length
        }
    };
}

/**
 * Transform CSV data
 */
async function transformCSV(data: any, options?: any): Promise<any> {
    postProgress(10, 'Transforming CSV data...');

    // First parse the CSV
    const parseResult = await parseCSV(data, {
        ...options,
        validate: undefined // Don't validate during parsing
    });

    postProgress(40, 'Applying transformations...');

    const transformedRows: any[] = [];
    const errors: string[] = [];

    parseResult.data.forEach((row: any, index: number) => {
        try {
            let transformedRow = { ...row };

            // Apply field mappings
            if (options?.fieldMappings) {
                const mappedRow: any = {};
                Object.entries(options.fieldMappings).forEach(([oldField, newField]) => {
                    mappedRow[newField as string] = transformedRow[oldField];
                });
                transformedRow = mappedRow;
            }

            // Apply transformations
            if (options?.transforms) {
                Object.entries(options.transforms).forEach(([field, transform]) => {
                    if (transformedRow[field] !== undefined) {
                        try {
                            transformedRow[field] = (transform as Function)(transformedRow[field], transformedRow);
                        } catch (error: any) {
                            errors.push(`Row ${index + 1}, field ${field}: ${error.message}`);
                        }
                    }
                });
            }

            // Apply custom transform function
            if (options?.transform) {
                transformedRow = options.transform(transformedRow, index);
            }

            transformedRows.push(transformedRow);

            // Report progress
            const progress = 40 + ((index / parseResult.data.length) * 50);
            postProgress(progress, `Transformed ${index + 1} of ${parseResult.data.length} rows...`);

        } catch (error: any) {
            errors.push(`Row ${index + 1}: ${error.message}`);
        }
    });

    postProgress(90, 'Transformation complete!');

    return {
        data: transformedRows,
        errors,
        metadata: {
            rowCount: transformedRows.length,
            columnCount: Object.keys(transformedRows[0] || {}).length,
            validRows: transformedRows.length,
            invalidRows: errors.length
        }
    };
}

/**
 * Helper: Post progress update
 */
function postProgress(percent: number, message: string): void {
    self.postMessage({
        type: 'progress',
        percent,
        message
    });
}

/**
 * Specialized CSV Processors
 */

/**
 * Process bank statement CSV
 */
export async function processBankStatement(file: File): Promise<any> {
    return transformCSV(file, {
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
export async function processInventory(file: File): Promise<any> {
    return validateCSV(file, {
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
 * Process customer CSV
 */
export async function processCustomers(file: File): Promise<any> {
    return validateCSV(file, {
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
