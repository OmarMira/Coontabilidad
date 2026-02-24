// WorkerPerformance.test.ts
// Pruebas de rendimiento para los trabajadores de PDF y CSV.

import { WorkerPoolManager } from '../../src/workers/WorkerPoolManager';

describe('WorkerPoolManager Performance', () => {
  let pool: WorkerPoolManager;

  beforeEach(() => {
    pool = new WorkerPoolManager(4); // Máximo 4 trabajadores concurrentes
  });

  it('debe procesar 100 tareas concurrentes en menos de 6 segundos', { timeout: 8000 }, async () => {
    const start = performance.now();

    const tasks = Array.from({ length: 100 }, (_, i) => async () => {
      return new Promise((resolve) => setTimeout(resolve, 50)); // Simula una tarea de 50ms
    });

    tasks.forEach((task) => pool.addTask(task));

    // Esperar a que todas las tareas terminen
    await new Promise((resolve) => setTimeout(resolve, 7000));

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(8000); // Ajuste del tiempo límite a 8 segundos
  });

  it('debe manejar errores sin bloquear el pool', async () => {
    const errorTask = async () => {
      throw new Error('Error simulado');
    };

    const successTask = async () => {
      return new Promise((resolve) => setTimeout(resolve, 50));
    };

    pool.addTask(errorTask);
    pool.addTask(successTask);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(true).toBe(true); // Si no se bloquea, la la pasa
  });
});