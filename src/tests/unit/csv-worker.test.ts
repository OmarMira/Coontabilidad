/**
 * CSV Worker Tests (Iron Clad Upgrade - Phase 2, Day 8)
 * 
 * Tests unitarios para el CSV Worker
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('CSV Worker', () => {
    let worker: Worker;

    beforeEach(() => {
        worker = new Worker(new URL('../../workers/csv.worker.ts', import.meta.url), {
            type: 'module'
        });
    });

    afterEach(() => {
        worker.terminate();
    });

    describe('CSV Parsing', () => {
        it('should parse CSV with headers', async () => {
            const csvData = 'name,email,amount\nJohn,john@test.com,100\nJane,jane@test.com,200';
            const file = new File([csvData], 'test.csv', { type: 'text/csv' });

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'PARSE',
                    data: file,
                    options: { header: true }
                });
            });

            expect(result).toHaveProperty('success', true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0]).toHaveProperty('name', 'John');
            expect(result.data[0]).toHaveProperty('email', 'john@test.com');
            expect(result.data[0]).toHaveProperty('amount', 100);
        });

        it('should parse CSV without headers', async () => {
            const csvData = 'John,john@test.com,100\nJane,jane@test.com,200';
            const file = new File([csvData], 'test.csv', { type: 'text/csv' });

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'PARSE',
                    data: file,
                    options: { header: false }
                });
            });

            expect(result).toHaveProperty('success', true);
            expect(result.data).toHaveLength(2);
            expect(result.data[0]).toBeInstanceOf(Array);
        });

        it('should report progress during parsing', async () => {
            const csvData = Array(1000).fill('name,email,amount\nJohn,john@test.com,100').join('\n');
            const file = new File([csvData], 'large.csv', { type: 'text/csv' });

            const progressUpdates: number[] = [];

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type === 'progress') {
                        progressUpdates.push(e.data.percent);
                    } else {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'PARSE',
                    data: file,
                    options: { header: true }
                });
            });

            expect(progressUpdates.length).toBeGreaterThan(0);
        });
    });

    describe('CSV Generation', () => {
        it('should generate CSV from data', async () => {
            const data = [
                { name: 'John', email: 'john@test.com', amount: 100 },
                { name: 'Jane', email: 'jane@test.com', amount: 200 }
            ];

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'GENERATE',
                    data,
                    options: { header: true }
                });
            });

            expect(result).toHaveProperty('success', true);
            expect(result.data).toContain('name,email,amount');
            expect(result.data).toContain('John,john@test.com,100');
            expect(result.data).toContain('Jane,jane@test.com,200');
        });
    });

    describe('CSV Validation', () => {
        it('should validate CSV data', async () => {
            const csvData = 'name,email,amount\nJohn,john@test.com,100\nJane,invalid-email,200';
            const file = new File([csvData], 'test.csv', { type: 'text/csv' });

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'VALIDATE',
                    data: file,
                    options: {
                        header: true,
                        requiredFields: ['name', 'email', 'amount'],
                        fieldTypes: {
                            name: 'string',
                            email: 'email',
                            amount: 'number'
                        }
                    }
                });
            });

            expect(result).toHaveProperty('success', true);
            expect(result.metadata.validRows).toBe(1);
            expect(result.metadata.invalidRows).toBe(1);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should validate required fields', async () => {
            const csvData = 'name,email,amount\nJohn,john@test.com,100\n,jane@test.com,200';
            const file = new File([csvData], 'test.csv', { type: 'text/csv' });

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'VALIDATE',
                    data: file,
                    options: {
                        header: true,
                        requiredFields: ['name', 'email', 'amount']
                    }
                });
            });

            expect(result.metadata.invalidRows).toBe(1);
            expect(result.errors.some((e: string) => e.includes('Missing required field'))).toBe(true);
        });
    });

    describe('CSV Transformation', () => {
        it('should transform CSV data', async () => {
            const csvData = 'name,email,amount\nJohn,john@test.com,100\nJane,jane@test.com,200';
            const file = new File([csvData], 'test.csv', { type: 'text/csv' });

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'TRANSFORM',
                    data: file,
                    options: {
                        header: true,
                        fieldMappings: {
                            'name': 'fullName',
                            'email': 'emailAddress',
                            'amount': 'totalAmount'
                        }
                    }
                });
            });

            expect((result as any)).toHaveProperty('success', true);
            expect(((result as any).data)[0]).toHaveProperty('fullName');
            expect(((result as any).data)[0]).toHaveProperty('emailAddress');
            expect(((result as any).data)[0]).toHaveProperty('totalAmount');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid CSV type', async () => {
            const result: unknown = await new Promise((resolve) => {
                worker.onmessage = (e: any) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'INVALID_TYPE',
                    data: null
                });
            });

            expect(result).toHaveProperty('success', false);
            expect(result).toHaveProperty('errors');
        });

        it('should handle malformed CSV', async () => {
            const csvData = 'name,email,amount\nJohn,john@test.com\nJane,jane@test.com,200,extra';
            const file = new File([csvData], 'test.csv', { type: 'text/csv' });

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'PARSE',
                    data: file,
                    options: { header: true }
                });
            });

            // Should still succeed but may have errors
            expect((result as any)).toHaveProperty('success', true);
            expect(((result as any).errors).length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Performance', () => {
        it('should process large CSV in reasonable time', async () => {
            const rows = Array(1000).fill(null).map((_, i) =>
                `User${i},user${i}@test.com,${i * 100}`
            );
            const csvData = 'name,email,amount\n' + rows.join('\n');
            const file = new File([csvData], 'large.csv', { type: 'text/csv' });

            const startTime = Date.now();

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'PARSE',
                    data: file,
                    options: { header: true }
                });
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
            expect(((result as any).data)).toHaveLength(1000);
        });
    });
});
