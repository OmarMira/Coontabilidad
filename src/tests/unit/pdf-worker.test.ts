/**
 * PDF Worker Tests (Iron Clad Upgrade - Phase 2, Day 8)
 * 
 * Tests unitarios para el PDF Worker
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('PDF Worker', () => {
    let worker: Worker;

    beforeEach(() => {
        // Create worker instance
        worker = new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), {
            type: 'module'
        });
    });

    afterEach(() => {
        // Cleanup
        worker.terminate();
    });

    describe('DR-15 Generation', () => {
        it('should generate DR-15 PDF successfully', async () => {
            const testData = {
                companyName: 'Test Company',
                fein: '12-3456789',
                period: 'Q1 2026',
                grossSales: 100000,
                exemptSales: 5000,
                taxableSales: 95000,
                stateTax: 5700,
                countyTax: 712.50,
                totalTax: 6412.50,
                counties: [
                    { name: 'Miami-Dade', rate: 0.75, taxableSales: 95000, tax: 712.50 }
                ]
            };

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'DR15',
                    data: testData,
                    options: { compress: true }
                });
            });

            expect((result as any)).toHaveProperty('success', true);
            expect((result as any)).toHaveProperty('pdf');
            expect(((result as any).pdf)).toBeInstanceOf(Blob);
            expect(((result as any).metadata)).toHaveProperty('pages');
            expect(((result as any).metadata)).toHaveProperty('size');
            expect(((result as any).metadata)).toHaveProperty('generationTime');
        });

        it('should report progress during generation', async () => {
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
                    type: 'DR15',
                    data: {
                        companyName: 'Test',
                        grossSales: 10000,
                        taxableSales: 10000,
                        stateTax: 600,
                        totalTax: 600
                    }
                });
            });

            expect(progressUpdates.length).toBeGreaterThan(0);
            expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
        });
    });

    describe('Form 941 Generation', () => {
        it('should generate Form 941 PDF successfully', async () => {
            const testData = {
                employerName: 'Test Employer',
                ein: '12-3456789',
                quarter: 'Q1',
                year: '2026',
                employeeCount: 10,
                totalWages: 150000,
                federalTax: 22500,
                socialSecurityWages: 150000,
                socialSecurityTax: 9300,
                medicareWages: 150000,
                medicareTax: 2175,
                totalTaxes: 33975
            };

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'FORM941',
                    data: testData
                });
            });

            expect((result as any)).toHaveProperty('success', true);
            expect(((result as any).pdf)).toBeInstanceOf(Blob);
        });
    });

    describe('Invoice Generation', () => {
        it('should generate invoice PDF successfully', async () => {
            const testData = {
                invoiceNumber: 'INV-001',
                date: '2026-02-08',
                dueDate: '2026-03-08',
                customerName: 'Test Customer',
                customerAddress: '123 Test St',
                items: [
                    { description: 'Service 1', quantity: 1, unitPrice: 100, total: 100 },
                    { description: 'Service 2', quantity: 2, unitPrice: 50, total: 100 }
                ],
                subtotal: 200,
                tax: 12,
                total: 212
            };

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'INVOICE',
                    data: testData
                });
            });

            expect((result as any)).toHaveProperty('success', true);
            expect(((result as any).pdf)).toBeInstanceOf(Blob);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid PDF type', async () => {
            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'INVALID_TYPE',
                    data: {}
                });
            });

            expect(result).toHaveProperty('success', false);
            expect(result).toHaveProperty('error');
        });

        it('should handle missing data', async () => {
            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'DR15',
                    data: null
                });
            });

            expect(result).toHaveProperty('success', false);
        });
    });

    describe('Performance', () => {
        it('should generate PDF in reasonable time', async () => {
            const startTime = Date.now();

            const result = await new Promise((resolve) => {
                worker.onmessage = (e) => {
                    if (e.data.type !== 'progress') {
                        resolve(e.data);
                    }
                };

                worker.postMessage({
                    type: 'DR15',
                    data: {
                        companyName: 'Test',
                        grossSales: 10000,
                        taxableSales: 10000,
                        stateTax: 600,
                        totalTax: 600
                    }
                });
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
            expect((((result as any).metadata)).generationTime).toBeLessThan(5000);
        });
    });
});
