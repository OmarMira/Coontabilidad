// WorkerPoolManager.ts
// Este archivo gestiona un grupo de trabajadores para tareas concurrentes.

export class WorkerPoolManager {
  private workers: Worker[] = [];
  private taskQueue: (() => Promise<void>)[] = [];
  private activeTasks = 0;
  private maxWorkers: number;

  constructor(maxWorkers: number) {
    this.maxWorkers = maxWorkers;
  }

  addTask(task: () => Promise<void>) {
    this.taskQueue.push(task);
    this.runNextTask();
  }

  private runNextTask() {
    while (this.activeTasks < this.maxWorkers && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        this.activeTasks++;
        task()
          .then(() => this.onTaskComplete())
          .catch(() => this.onTaskComplete());
      }
    }
  }

  private onTaskComplete() {
    this.activeTasks--;
    this.runNextTask(); // Procesar inmediatamente las siguientes tareas disponibles
  }

  getQueueLength(): number {
    return this.taskQueue.length;
  }

  getActiveTasks(): number {
    return this.activeTasks;
  }
}

// Ejemplo de uso:
// const pool = new WorkerPoolManager(4);
// pool.addTask(async () => {
//   // Tarea 1
// });
// pool.addTask(async () => {
//   // Tarea 2
// });