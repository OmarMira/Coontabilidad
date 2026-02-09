/**
 * WorkerPoolManager (Iron Clad Upgrade - Phase 2, Day 7)
 * 
 * Gestiona un pool de Web Workers reutilizables para mejorar performance.
 * 
 * Características:
 * - Pool de workers por tipo (PDF, CSV, etc.)
 * - Límite de workers concurrentes
 * - Reutilización de workers idle
 * - Cleanup automático de workers inactivos
 * - Métricas de uso
 * - Cola de tareas cuando pool está lleno
 */

export type WorkerType = 'PDF' | 'CSV' | 'ENCRYPTION' | 'DATABASE';

interface WorkerInstance {
    id: string;
    type: WorkerType;
    worker: Worker;
    busy: boolean;
    lastUsed: number;
    tasksCompleted: number;
}

interface QueuedTask {
    type: WorkerType;
    data: any;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
    onProgress?: (percent: number, message: string) => void;
}

interface PoolMetrics {
    totalWorkers: number;
    busyWorkers: number;
    idleWorkers: number;
    queuedTasks: number;
    totalTasksCompleted: number;
    workersByType: Record<WorkerType, number>;
}

/**
 * Worker Pool Manager
 */
export class WorkerPoolManager {
    private pools: Map<WorkerType, WorkerInstance[]> = new Map();
    private taskQueue: QueuedTask[] = [];
    private maxWorkersPerType: number = 2; // Max 2 workers per type
    private maxTotalWorkers: number = 4; // Max 4 workers total
    private idleTimeout: number = 5 * 60 * 1000; // 5 minutes
    private cleanupInterval: NodeJS.Timeout | null = null;
    private totalTasksCompleted: number = 0;

    constructor() {
        // Initialize pools for each worker type
        this.pools.set('PDF', []);
        this.pools.set('CSV', []);
        this.pools.set('ENCRYPTION', []);
        this.pools.set('DATABASE', []);

        // Start cleanup interval
        this.startCleanupInterval();
    }

    /**
     * Execute a task using a worker from the pool
     */
    async executeTask<T>(
        type: WorkerType,
        data: any,
        onProgress?: (percent: number, message: string) => void
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            // Try to get an available worker
            const workerInstance = this.getAvailableWorker(type);

            if (workerInstance) {
                // Execute immediately
                this.executeOnWorker(workerInstance, data, onProgress)
                    .then(resolve)
                    .catch(reject);
            } else {
                // Queue the task
                this.taskQueue.push({
                    type,
                    data,
                    resolve,
                    reject,
                    onProgress
                });

                console.log(`📋 Task queued (${type}). Queue size: ${this.taskQueue.length}`);
            }
        });
    }

    /**
     * Get an available worker from the pool
     */
    private getAvailableWorker(type: WorkerType): WorkerInstance | null {
        const pool = this.pools.get(type);
        if (!pool) return null;

        // Find idle worker
        const idleWorker = pool.find(w => !w.busy);
        if (idleWorker) {
            return idleWorker;
        }

        // Try to create new worker if under limits
        if (this.canCreateWorker(type)) {
            return this.createWorker(type);
        }

        return null;
    }

    /**
     * Check if we can create a new worker
     */
    private canCreateWorker(type: WorkerType): boolean {
        const pool = this.pools.get(type);
        if (!pool) return false;

        const totalWorkers = this.getTotalWorkerCount();
        const typeWorkers = pool.length;

        return (
            typeWorkers < this.maxWorkersPerType &&
            totalWorkers < this.maxTotalWorkers
        );
    }

    /**
     * Create a new worker
     */
    private createWorker(type: WorkerType): WorkerInstance {
        const workerId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        let worker: Worker;

        // Create worker based on type
        switch (type) {
            case 'PDF':
                worker = new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), {
                    type: 'module',
                    name: workerId
                });
                break;
            case 'CSV':
                worker = new Worker(new URL('../../workers/csv.worker.ts', import.meta.url), {
                    type: 'module',
                    name: workerId
                });
                break;
            case 'ENCRYPTION':
                worker = new Worker(new URL('../../workers/encryption.worker.ts', import.meta.url), {
                    type: 'module',
                    name: workerId
                });
                break;
            case 'DATABASE':
                worker = new Worker(new URL('../../workers/database.worker.ts', import.meta.url), {
                    type: 'module',
                    name: workerId
                });
                break;
            default:
                throw new Error(`Unknown worker type: ${type}`);
        }

        const workerInstance: WorkerInstance = {
            id: workerId,
            type,
            worker,
            busy: false,
            lastUsed: Date.now(),
            tasksCompleted: 0
        };

        const pool = this.pools.get(type)!;
        pool.push(workerInstance);

        console.log(`✅ Created ${type} worker: ${workerId}. Pool size: ${pool.length}`);

        return workerInstance;
    }

    /**
     * Execute task on a specific worker
     */
    private async executeOnWorker(
        workerInstance: WorkerInstance,
        data: any,
        onProgress?: (percent: number, message: string) => void
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            workerInstance.busy = true;
            workerInstance.lastUsed = Date.now();

            // Setup message handler
            const messageHandler = (e: MessageEvent) => {
                const result = e.data;

                // Handle progress updates
                if (result.type === 'progress') {
                    if (onProgress) {
                        onProgress(result.percent, result.message);
                    }
                    return;
                }

                // Handle completion
                cleanup();

                if (result.success !== false) {
                    workerInstance.tasksCompleted++;
                    this.totalTasksCompleted++;
                    resolve(result);
                } else {
                    reject(new Error(result.error || 'Worker task failed'));
                }

                // Mark worker as idle and process queue
                workerInstance.busy = false;
                this.processQueue();
            };

            // Setup error handler
            const errorHandler = (error: ErrorEvent) => {
                cleanup();
                reject(new Error(`Worker error: ${error.message}`));
                workerInstance.busy = false;
                this.processQueue();
            };

            // Cleanup function
            const cleanup = () => {
                workerInstance.worker.removeEventListener('message', messageHandler);
                workerInstance.worker.removeEventListener('error', errorHandler);
            };

            // Attach handlers
            workerInstance.worker.addEventListener('message', messageHandler);
            workerInstance.worker.addEventListener('error', errorHandler);

            // Send task to worker
            workerInstance.worker.postMessage(data);
        });
    }

    /**
     * Process queued tasks
     */
    private processQueue(): void {
        if (this.taskQueue.length === 0) return;

        // Try to process tasks in queue
        const tasksToProcess: QueuedTask[] = [];

        for (const task of this.taskQueue) {
            const workerInstance = this.getAvailableWorker(task.type);
            if (workerInstance) {
                tasksToProcess.push(task);
            }
        }

        // Execute tasks
        for (const task of tasksToProcess) {
            // Remove from queue
            const index = this.taskQueue.indexOf(task);
            if (index > -1) {
                this.taskQueue.splice(index, 1);
            }

            // Execute
            const workerInstance = this.getAvailableWorker(task.type)!;
            this.executeOnWorker(workerInstance, task.data, task.onProgress)
                .then(task.resolve)
                .catch(task.reject);
        }

        if (tasksToProcess.length > 0) {
            console.log(`✅ Processed ${tasksToProcess.length} queued tasks. Remaining: ${this.taskQueue.length}`);
        }
    }

    /**
     * Start cleanup interval
     */
    private startCleanupInterval(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanupIdleWorkers();
        }, 60 * 1000); // Every minute
    }

    /**
     * Cleanup idle workers
     */
    private cleanupIdleWorkers(): void {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [type, pool] of this.pools) {
            const workersToRemove: WorkerInstance[] = [];

            for (const workerInstance of pool) {
                // Don't cleanup busy workers
                if (workerInstance.busy) continue;

                // Check if idle for too long
                const idleTime = now - workerInstance.lastUsed;
                if (idleTime > this.idleTimeout) {
                    workersToRemove.push(workerInstance);
                }
            }

            // Remove idle workers
            for (const workerInstance of workersToRemove) {
                const index = pool.indexOf(workerInstance);
                if (index > -1) {
                    pool.splice(index, 1);
                    workerInstance.worker.terminate();
                    cleanedCount++;
                    console.log(`🧹 Cleaned up idle ${type} worker: ${workerInstance.id}`);
                }
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Total workers cleaned: ${cleanedCount}`);
        }
    }

    /**
     * Get total worker count across all pools
     */
    private getTotalWorkerCount(): number {
        let total = 0;
        for (const pool of this.pools.values()) {
            total += pool.length;
        }
        return total;
    }

    /**
     * Get pool metrics
     */
    getMetrics(): PoolMetrics {
        let busyWorkers = 0;
        let idleWorkers = 0;
        const workersByType: Record<WorkerType, number> = {
            PDF: 0,
            CSV: 0,
            ENCRYPTION: 0,
            DATABASE: 0
        };

        for (const [type, pool] of this.pools) {
            workersByType[type] = pool.length;
            for (const worker of pool) {
                if (worker.busy) {
                    busyWorkers++;
                } else {
                    idleWorkers++;
                }
            }
        }

        return {
            totalWorkers: this.getTotalWorkerCount(),
            busyWorkers,
            idleWorkers,
            queuedTasks: this.taskQueue.length,
            totalTasksCompleted: this.totalTasksCompleted,
            workersByType
        };
    }

    /**
     * Terminate all workers and cleanup
     */
    destroy(): void {
        // Stop cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }

        // Terminate all workers
        for (const pool of this.pools.values()) {
            for (const workerInstance of pool) {
                workerInstance.worker.terminate();
            }
            pool.length = 0;
        }

        // Clear queue
        this.taskQueue.length = 0;

        console.log('🛑 WorkerPoolManager destroyed');
    }
}

/**
 * Singleton instance
 */
export const workerPoolManager = new WorkerPoolManager();
