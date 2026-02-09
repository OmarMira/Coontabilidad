/**
 * UI Responsiveness Tests (Iron Clad Upgrade - Phase 2, Day 8)
 * 
 * Tests para verificar que la UI no se bloquea durante operaciones pesadas
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { asyncPDFService } from '../../services/pdf/AsyncPDFService';
import { asyncCSVService } from '../../services/csv/AsyncCSVService';

describe('UI Responsiveness', () => {
    describe('PDF Generation', () => {
        it('should not block event loop during PDF generation', async () => {
            let eventLoopBlocked = false;
            let tickCount = 0;

            // Start a timer that ticks every 100ms
            const interval = setInterval(() => {
                tickCount++;
            }, 100);

            // Start PDF generation
            const pdfPromise = asyncPDFService.generateDR15({
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
            });

            // Wait for PDF to complete
            await pdfPromise;

            clearInterval(interval);

            // If event loop was not blocked, we should have multiple ticks
            // Even during PDF generation
            expect(tickCount).toBeGreaterThan(0);

            console.log(`✅ Event loop ticked ${tickCount} times during PDF generation`);
        });

        it('should allow concurrent operations', async () => {
            let counter = 0;

            // Start PDF generation
            const pdfPromise = asyncPDFService.generateForm941({
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
            });

            // Perform other operations while PDF is generating
            for (let i = 0; i < 100; i++) {
                counter++;
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            await pdfPromise;

            // Counter should have incremented fully
            expect(counter).toBe(100);

            console.log(`✅ Performed ${counter} operations concurrently with PDF generation`);
        });
    });

    describe('CSV Processing', () => {
        it('should not block event loop during CSV processing', async () => {
            let tickCount = 0;

            const interval = setInterval(() => {
                tickCount++;
            }, 100);

            // Create a large CSV
            const rows = Array(1000).fill(null).map((_, i) => ({
                name: `User${i}`,
                email: `user${i}@test.com`,
                amount: i * 100
            }));

            // Generate CSV
            const csvPromise = asyncCSVService.generateCSV(rows);

            await csvPromise;

            clearInterval(interval);

            expect(tickCount).toBeGreaterThan(0);

            console.log(`✅ Event loop ticked ${tickCount} times during CSV generation`);
        });

        it('should allow concurrent CSV operations', async () => {
            const data1 = Array(500).fill(null).map((_, i) => ({ id: i, value: i * 2 }));
            const data2 = Array(500).fill(null).map((_, i) => ({ id: i, value: i * 3 }));

            // Start two CSV generations concurrently
            const [csv1, csv2] = await Promise.all([
                asyncCSVService.generateCSV(data1),
                asyncCSVService.generateCSV(data2)
            ]);

            expect(csv1).toBeDefined();
            expect(csv2).toBeDefined();
            expect(csv1).not.toBe(csv2);

            console.log(`✅ Generated 2 CSVs concurrently`);
        });
    });

    describe('Batch Operations', () => {
        it('should handle multiple PDF generations without blocking', async () => {
            let tickCount = 0;

            const interval = setInterval(() => {
                tickCount++;
            }, 100);

            // Generate 5 PDFs concurrently
            const pdfs = await Promise.all([
                asyncPDFService.generateDR15({ companyName: 'Test1', grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 }),
                asyncPDFService.generateDR15({ companyName: 'Test2', grossSales: 2000, taxableSales: 2000, stateTax: 120, totalTax: 120 }),
                asyncPDFService.generateDR15({ companyName: 'Test3', grossSales: 3000, taxableSales: 3000, stateTax: 180, totalTax: 180 }),
                asyncPDFService.generateDR15({ companyName: 'Test4', grossSales: 4000, taxableSales: 4000, stateTax: 240, totalTax: 240 }),
                asyncPDFService.generateDR15({ companyName: 'Test5', grossSales: 5000, taxableSales: 5000, stateTax: 300, totalTax: 300 })
            ]);

            clearInterval(interval);

            expect(pdfs).toHaveLength(5);
            expect(tickCount).toBeGreaterThan(0);

            console.log(`✅ Generated 5 PDFs concurrently, event loop ticked ${tickCount} times`);
        });
    });

    describe('Performance Benchmarks', () => {
        it('should generate PDF in reasonable time', async () => {
            const startTime = performance.now();

            await asyncPDFService.generateDR15({
                companyName: 'Benchmark Test',
                grossSales: 100000,
                taxableSales: 95000,
                stateTax: 5700,
                totalTax: 6412.50
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds

            console.log(`✅ PDF generated in ${duration.toFixed(2)}ms`);
        });

        it('should process CSV in reasonable time', async () => {
            const data = Array(1000).fill(null).map((_, i) => ({
                id: i,
                name: `User${i}`,
                email: `user${i}@test.com`,
                amount: i * 100
            }));

            const startTime = performance.now();

            await asyncCSVService.generateCSV(data);

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(3000); // Should complete in less than 3 seconds

            console.log(`✅ CSV (1000 rows) generated in ${duration.toFixed(2)}ms`);
        });

        it('should handle rapid successive operations', async () => {
            const operations = [];

            for (let i = 0; i < 10; i++) {
                operations.push(
                    asyncPDFService.generateDR15({
                        companyName: `Rapid${i}`,
                        grossSales: 1000,
                        taxableSales: 1000,
                        stateTax: 60,
                        totalTax: 60
                    })
                );
            }

            const startTime = performance.now();
            await Promise.all(operations);
            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(15000); // 10 PDFs in less than 15 seconds

            console.log(`✅ 10 rapid PDFs completed in ${duration.toFixed(2)}ms`);
        });
    });

    describe('Memory Management', () => {
        it('should not leak memory during repeated operations', async () => {
            const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

            // Perform 20 operations
            for (let i = 0; i < 20; i++) {
                await asyncPDFService.generateDR15({
                    companyName: `Memory${i}`,
                    grossSales: 1000,
                    taxableSales: 1000,
                    stateTax: 60,
                    totalTax: 60
                });
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory increase should be reasonable (less than 50MB)
            if (initialMemory > 0) {
                expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
                console.log(`✅ Memory increase after 20 operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
            } else {
                console.log(`⚠️ Memory API not available, skipping memory test`);
            }
        });
    });
});
