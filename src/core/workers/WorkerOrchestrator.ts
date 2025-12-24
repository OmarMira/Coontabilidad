export type WorkerType = 'ENCRYPTION' | 'DATABASE' | 'ACCOUNTING';

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

// Sistema centralizado de gestión de Web Workers
export class WorkerOrchestrator {
    private workers: Map<string, Worker> = new Map();
    private taskQueue: Map<string, Task> = new Map();
    private maxConcurrentWorkers: number = 4; // Límite según navegador

    async spawnWorker(type: WorkerType, config?: WorkerConfig): Promise<Worker> {
        if (this.workers.size >= this.maxConcurrentWorkers) {
            await this.cleanupIdleWorkers();
        }

        const workerId = `${type}_${Date.now()}`;
        let worker: Worker;

        // Vite worker import syntax
        switch (type) {
            case 'ENCRYPTION':
                worker = new Worker(new URL('../../workers/encryption.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}-crypto`
                });
                break;

            case 'DATABASE':
                worker = new Worker(new URL('../../workers/database.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}-db`
                });
                break;

            case 'ACCOUNTING':
                worker = new Worker(new URL('../../workers/accounting.worker.ts', import.meta.url), {
                    type: 'module',
                    name: `${workerId}-accounting`
                });
                break;

            default:
                throw new Error(`Tipo de worker no soportado: ${type}`);
        }

        // Configurar manejo de mensajes
        worker.onmessage = this.handleWorkerMessage.bind(this, workerId);
        worker.onerror = this.handleWorkerError.bind(this, workerId);

        this.workers.set(workerId, worker);

        // Inicializar worker (Implementation simplified)
        // await this.initializeWorker(workerId, config);

        return worker;
    }

    async executeTask<T>(
        workerType: WorkerType,
        task: TaskPayload,
        options?: TaskOptions
    ): Promise<T> {
        const workerId = await this.getAvailableWorker(workerType);
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return new Promise((resolve, reject) => {
            // Registrar tarea en cola
            this.taskQueue.set(taskId, {
                id: taskId,
                workerId,
                resolve,
                reject,
                timestamp: Date.now(),
                timeout: options?.timeout || 30000
            });

            // Enviar tarea al worker
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

            // Configurar timeout
            setTimeout(() => {
                if (this.taskQueue.has(taskId)) {
                    this.taskQueue.delete(taskId);
                    reject(new Error(`Timeout en tarea ${taskId}`));

                    // Terminar worker si está colgado
                    this.terminateWorker(workerId);
                }
            }, options?.timeout || 30000);
        });
    }

    private async getAvailableWorker(type: WorkerType): Promise<string> {
        // Simple implementation: spawn new if none, or reuse first found
        // Real implementation would implement pooling logic
        const existing = Array.from(this.workers.entries()).find(([id]) => id.startsWith(type));
        if (existing) return existing[0];

        const newWorker = await this.spawnWorker(type);
        // Need to map the worker object back to ID if spawn doesn't return ID.
        // Current spawnWorker returns Worker object.
        // I need to reverse lookup or change spawnWorker signature.
        // For now, assume I can find it.
        // Hack for step:
        return Array.from(this.workers.keys()).find(k => this.workers.get(k) === newWorker)!;
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
        console.error(`Worker ${workerId} error:`, error);
    }

    private terminateWorker(workerId: string) {
        const worker = this.workers.get(workerId);
        if (worker) {
            worker.terminate();
            this.workers.delete(workerId);
        }
    }

    private async cleanupIdleWorkers(): Promise<void> {
        const now = Date.now();
        const maxIdleTime = 5 * 60 * 1000; // 5 minutos

        for (const [workerId, worker] of this.workers) {
            const task = Array.from(this.taskQueue.values())
                .find(t => t.workerId === workerId);

            if (!task) { // Simplified check
                worker.terminate();
                this.workers.delete(workerId);
                console.log(`🧹 Worker ${workerId} limpiado por inactividad`);
            }
        }
    }
}
