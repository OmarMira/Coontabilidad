import { logger } from '../../core/logging/SystemLogger';
export type WorkerType = 'ENCRYPTION' | 'DATABASE' | 'ACCOUNTING' | 'PDF_GENERATION' | 'CSV_PROCESSING' | 'REPORTS' | 'PAYROLL' | 'RECONCILIATION' | 'QUOTES_PROCESSING' | 'INVENTORY_ANALYSIS';

export interface WorkerConfig {
    name?: string;
    [key: string]: any;
}

export interface TaskPayload {
    [key: string]: any;
}

export interface TaskOptions {
    timeout?: number;
    metadata?: any;
}

interface Task {
    id: string;
    workerId: string;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timestamp: number;
    timeout: number;
}

// Sistema centralizado de gestiÃ³n de Web Workers
export class WorkerOrchestrator {
    private workerPools: Map<WorkerType, Worker[]> = new Map();
    private poolSize: number = 2; // MÃ¡ximo 2 workers por tipo de tarea
    private workers: Map<string, Worker> = new Map();
    private workerToType: Map<string, WorkerType> = new Map();
    private taskQueue: Map<string, Task> = new Map();
    private maxConcurrentWorkers: number = 8; // LÃ­mite global

    async spawnWorker(type: WorkerType, config?: WorkerConfig): Promise<string> {
        if (this.workers.size >= this.maxConcurrentWorkers) {
            await this.cleanupIdleWorkers();
            // Si aÃºn estamos llenos, forzar limpieza de los mÃ¡s antiguos sin tareas
            if (this.workers.size >= this.maxConcurrentWorkers) {
                this.forceTerminateOldestIdle();
            }
        }

        const workerId = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        let worker: Worker;

        // Vite worker import syntax
        switch (type) {
            case 'ENCRYPTION':
                worker = new Worker(new URL('../../workers/encryption.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}`
                });
                break;
            case 'DATABASE':
                worker = new Worker(new URL('../../workers/database.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}`
                });
                break;
            case 'ACCOUNTING':
                worker = new Worker(new URL('../../workers/accounting.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}`
                });
                break;
            case 'PDF_GENERATION':
                worker = new Worker(new URL('../../workers/pdf.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}`
                });
                break;
            case 'CSV_PROCESSING':
                worker = new Worker(new URL('../../workers/csv.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}`
                });
                break;
            case 'REPORTS':
                worker = new Worker(new URL('../../workers/reports.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}`
                });
                break;
            case 'PAYROLL':
                worker = new Worker(new URL('../../workers/payroll.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}`
                });
                break;
            case 'RECONCILIATION':
                worker = new Worker(new URL('../../workers/reconciliation.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}`
                });
                break;
            case 'QUOTES_PROCESSING':
                worker = new Worker(new URL('../../workers/quotes.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}`
                });
                break;
            case 'INVENTORY_ANALYSIS':
                worker = new Worker(new URL('../../workers/inventory-analysis.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}`
                });
                break;
            default:
                throw new Error(`Tipo de worker no soportado: ${type}`);
        }

        worker.onmessage = this.handleWorkerMessage.bind(this, workerId);
        worker.onerror = this.handleWorkerError.bind(this, workerId);

        this.workers.set(workerId, worker);
        this.workerToType.set(workerId, type);

        // Agregar al pool especÃ­fico
        if (!this.workerPools.has(type)) {
            this.workerPools.set(type, []);
        }
        this.workerPools.get(type)!.push(worker);

        return workerId;
    }

    getWorker(workerId: string): Worker | undefined {
        return this.workers.get(workerId);
    }

    async executeTask<T>(
        workerType: WorkerType,
        task: TaskPayload,
        options?: TaskOptions
    ): Promise<T> {
        const workerId = await this.getAvailableWorker(workerType);
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return new Promise((resolve, reject) => {
            this.taskQueue.set(taskId, {
                id: taskId,
                workerId,
                resolve,
                reject,
                timestamp: Date.now(),
                timeout: options?.timeout || 60000 // Aumentado para tareas pesadas
            });

            const worker = this.workers.get(workerId);
            if (!worker) {
                reject(new Error(`Worker ${workerId} no disponible`));
                return;
            }

            worker.postMessage({
                type: 'EXECUTE_TASK',
                taskId,
                payload: task,
                metadata: options?.metadata
            });

            setTimeout(() => {
                if (this.taskQueue.has(taskId)) {
                    this.taskQueue.delete(taskId);
                    reject(new Error(`Timeout en tarea ${taskId} (${workerType})`));
                    this.terminateWorker(workerId);
                }
            }, options?.timeout || 60000);
        });
    }

    private async getAvailableWorker(type: WorkerType): Promise<string> {
        if (!this.workerPools.has(type)) {
            this.workerPools.set(type, []);
        }

        const pool = this.workerPools.get(type)!;

        // 1. Buscar worker en el pool que no estÃ© procesando ninguna tarea
        for (const workerObj of pool) {
            // Encontrar el workerId asociado al objeto worker
            const workerId = Array.from(this.workers.entries())
                .find(([_, w]) => w === workerObj)?.[0];

            if (workerId) {
                const isBusy = Array.from(this.taskQueue.values())
                    .some(task => task.workerId === workerId);

                if (!isBusy) {
                    return workerId;
                }
            }
        }

        // 2. Si llegamos aquÃ­, todos estÃ¡n ocupados. Â¿Podemos crear otro en el pool?
        if (pool.length < this.poolSize) {
            return await this.spawnWorker(type);
        }

        // 3. Esperar un momento a que se libere uno (backoff simple)
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                for (const workerObj of pool) {
                    const workerId = Array.from(this.workers.entries())
                        .find(([_, w]) => w === workerObj)?.[0];

                    if (workerId) {
                        const isBusy = Array.from(this.taskQueue.values())
                            .some(task => task.workerId === workerId);

                        if (!isBusy) {
                            clearInterval(checkInterval);
                            resolve(workerId);
                            return;
                        }
                    }
                }
            }, 50);

            // Safety timeout para la espera del pool
            setTimeout(() => {
                clearInterval(checkInterval);
                // Si llegamos aquÃ­, forzar la creaciÃ³n de uno nuevo ignorando poolSize 
                // pero respetando maxConcurrentWorkers
                this.spawnWorker(type).then(resolve);
            }, 5000);
        });
    }

    private handleWorkerMessage(workerId: string, event: MessageEvent) {
        const { taskId, type, payload, error } = event.data;
        if (taskId && this.taskQueue.has(taskId)) {
            const task = this.taskQueue.get(taskId)!;
            if (error) {
                task.reject(new Error(error));
            } else {
                task.resolve(payload);
            }
            this.taskQueue.delete(taskId);
        }
    }

    private handleWorkerError(workerId: string, error: ErrorEvent) {
        logger.error('WorkerOrchestrator', 'error', `Worker ${workerId} error:`, error);
        this.terminateWorker(workerId);
    }

    private terminateWorker(workerId: string) {
        const worker = this.workers.get(workerId);
        if (worker) {
            worker.terminate();
            this.workers.delete(workerId);

            const type = this.workerToType.get(workerId);
            if (type && this.workerPools.has(type)) {
                const pool = this.workerPools.get(type)!;
                const index = pool.indexOf(worker);
                if (index > -1) pool.splice(index, 1);
            }
            this.workerToType.delete(workerId);
        }
    }

    private forceTerminateOldestIdle() {
        const busyWorkerIds = new Set(Array.from(this.taskQueue.values()).map(t => t.workerId));
        const idleWorkers = Array.from(this.workers.keys()).filter(id => !busyWorkerIds.has(id));

        if (idleWorkers.length > 0) {
            this.terminateWorker(idleWorkers[0]);
        }
    }

    private async cleanupIdleWorkers(): Promise<void> {
        const busyWorkerIds = new Set(Array.from(this.taskQueue.values()).map(t => t.workerId));

        for (const [workerId, worker] of this.workers) {
            if (!busyWorkerIds.has(workerId)) {
                this.terminateWorker(workerId);
                logger.info('WorkerOrchestrator', 'info', `ðŸ§¹ Worker ${workerId} limpiado por inactividad`);
            }
        }
    }
}
