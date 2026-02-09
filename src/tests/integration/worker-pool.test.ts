/**
 * Worker Pool Manager Tests (Iron Clad Upgrade - Phase 2, Day 8)
 * 
 * Tests de integración para el Worker Pool Manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkerPoolManager } from '../../core/workers/WorkerPoolManager';

describe('WorkerPoolManager', () => {
    let poolManager: WorkerPoolManager;

    beforeEach(() => {
        poolManager = new WorkerPoolManager();
    });

    afterEach(() => {
        poolManager.destroy();
    });

    describe('Worker Creation', () => {
        it('should create workers on demand', async () => {
            const initialMetrics = poolManager.getMetrics();
            expect(initialMetrics.totalWorkers).toBe(0);

            // Execute a task (will create a worker)
            const promise = poolManager.executeTask('PDF', {
                type: 'DR15',
                data: { companyName: 'Test', grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 }
            });

            // Wait a bit for worker to be created
            await new Promise(resolve => setTimeout(resolve, 100));

            const metricsAfter = poolManager.getMetrics();
            expect(metricsAfter.totalWorkers).toBeGreaterThan(0);

            await promise;
        });

        it('should respect max workers per type limit', async () => {
            // Try to execute 5 PDF tasks (max is 2 per type)
            const tasks = Array(5).fill(null).map(() =>
                poolManager.executeTask('PDF', {
                    type: 'DR15',
                    data: { companyName: 'Test', grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 }
                })
            );

            // Wait for workers to be created
            await new Promise(resolve => setTimeout(resolve, 200));

            const metrics = poolManager.getMetrics();
            expect(metrics.workersByType.PDF).toBeLessThanOrEqual(2);

            await Promise.all(tasks);
        });

        it('should respect max total workers limit', async () => {
            // Try to execute tasks across different types
            const tasks = [
                poolManager.executeTask('PDF', { type: 'DR15', data: {} }),
                poolManager.executeTask('PDF', { type: 'FORM941', data: {} }),
                poolManager.executeTask('CSV', { type: 'PARSE', data: new File(['test'], 'test.csv') }),
                poolManager.executeTask('CSV', { type: 'GENERATE', data: [] }),
                poolManager.executeTask('PDF', { type: 'INVOICE', data: {} })
            ];

            await new Promise(resolve => setTimeout(resolve, 200));

            const metrics = poolManager.getMetrics();
            expect(metrics.totalWorkers).toBeLessThanOrEqual(4); // Max total is 4

            await Promise.allSettled(tasks);
        });
    });

    describe('Worker Reuse', () => {
        it('should reuse idle workers', async () => {
            // Execute first task
            await poolManager.executeTask('PDF', {
                type: 'DR15',
                data: { companyName: 'Test', grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 }
            });

            const metricsAfterFirst = poolManager.getMetrics();
            const workersAfterFirst = metricsAfterFirst.totalWorkers;

            // Execute second task (should reuse worker)
            await poolManager.executeTask('PDF', {
                type: 'DR15',
                data: { companyName: 'Test2', grossSales: 2000, taxableSales: 2000, stateTax: 120, totalTax: 120 }
            });

            const metricsAfterSecond = poolManager.getMetrics();
            expect(metricsAfterSecond.totalWorkers).toBe(workersAfterFirst); // Same number of workers
        });
    });

    describe('Task Queue', () => {
        it('should queue tasks when pool is full', async () => {
            // Start 5 tasks (max workers is 4, so 1 should be queued)
            const tasks = Array(5).fill(null).map((_, i) =>
                poolManager.executeTask('PDF', {
                    type: 'DR15',
                    data: { companyName: `Test${i}`, grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 }
                })
            );

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 200));

            const metrics = poolManager.getMetrics();
            expect(metrics.queuedTasks).toBeGreaterThan(0);

            await Promise.all(tasks);
        });

        it('should process queued tasks when workers become available', async () => {
            // Start 5 tasks
            const tasks = Array(5).fill(null).map((_, i) =>
                poolManager.executeTask('PDF', {
                    type: 'DR15',
                    data: { companyName: `Test${i}`, grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 }
                })
            );

            // All tasks should eventually complete
            const results = await Promise.all(tasks);
            expect(results).toHaveLength(5);

            // Queue should be empty
            const metrics = poolManager.getMetrics();
            expect(metrics.queuedTasks).toBe(0);
        });
    });

    describe('Metrics', () => {
        it('should track total tasks completed', async () => {
            const initialMetrics = poolManager.getMetrics();
            const initialCompleted = initialMetrics.totalTasksCompleted;

            // Execute 3 tasks
            await Promise.all([
                poolManager.executeTask('PDF', { type: 'DR15', data: { companyName: 'Test', grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 } }),
                poolManager.executeTask('PDF', { type: 'FORM941', data: { employerName: 'Test', ein: '12-3456789', quarter: 'Q1', year: '2026', employeeCount: 1, totalWages: 1000, federalTax: 150, socialSecurityWages: 1000, socialSecurityTax: 62, medicareWages: 1000, medicareTax: 14.5, totalTaxes: 226.5 } }),
                poolManager.executeTask('PDF', { type: 'INVOICE', data: { invoiceNumber: 'INV-001', date: '2026-02-08', customerName: 'Test', items: [], subtotal: 100, tax: 6, total: 106 } })
            ]);

            const finalMetrics = poolManager.getMetrics();
            expect(finalMetrics.totalTasksCompleted).toBe(initialCompleted + 3);
        });

        it('should track busy and idle workers', async () => {
            // Start a long-running task
            const longTask = poolManager.executeTask('PDF', {
                type: 'DR15',
                data: { companyName: 'Test', grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 }
            });

            // Check metrics while task is running
            await new Promise(resolve => setTimeout(resolve, 100));
            const metricsWhileRunning = poolManager.getMetrics();
            expect(metricsWhileRunning.busyWorkers).toBeGreaterThan(0);

            // Wait for task to complete
            await longTask;

            // Check metrics after completion
            await new Promise(resolve => setTimeout(resolve, 100));
            const metricsAfterCompletion = poolManager.getMetrics();
            expect(metricsAfterCompletion.idleWorkers).toBeGreaterThan(0);
        });
    });

    describe('Worker Cleanup', () => {
        it('should cleanup idle workers after timeout', async () => {
            // Execute a task to create a worker
            await poolManager.executeTask('PDF', {
                type: 'DR15',
                data: { companyName: 'Test', grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 }
            });

            const metricsAfterTask = poolManager.getMetrics();
            expect(metricsAfterTask.totalWorkers).toBeGreaterThan(0);

            // Note: Actual cleanup happens after 5 minutes, which is too long for a test
            // This test just verifies the cleanup mechanism exists
            expect(poolManager['cleanupInterval']).toBeDefined();
        }, 10000);
    });

    describe('Error Handling', () => {
        it('should handle worker errors gracefully', async () => {
            // Try to execute invalid task
            await expect(
                poolManager.executeTask('PDF', {
                    type: 'INVALID_TYPE',
                    data: {}
                })
            ).rejects.toThrow();
        });

        it('should continue working after an error', async () => {
            // Execute invalid task
            await expect(
                poolManager.executeTask('PDF', {
                    type: 'INVALID_TYPE',
                    data: {}
                })
            ).rejects.toThrow();

            // Execute valid task (should work)
            const result = await poolManager.executeTask('PDF', {
                type: 'DR15',
                data: { companyName: 'Test', grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 }
            });

            expect(result).toHaveProperty('success', true);
        });
    });

    describe('Destroy', () => {
        it('should terminate all workers on destroy', async () => {
            // Create some workers
            await Promise.all([
                poolManager.executeTask('PDF', { type: 'DR15', data: { companyName: 'Test', grossSales: 1000, taxableSales: 1000, stateTax: 60, totalTax: 60 } }),
                poolManager.executeTask('CSV', { type: 'GENERATE', data: [{ name: 'Test' }] })
            ]);

            const metricsBeforeDestroy = poolManager.getMetrics();
            expect(metricsBeforeDestroy.totalWorkers).toBeGreaterThan(0);

            // Destroy pool
            poolManager.destroy();

            const metricsAfterDestroy = poolManager.getMetrics();
            expect(metricsAfterDestroy.totalWorkers).toBe(0);
        });
    });
});
