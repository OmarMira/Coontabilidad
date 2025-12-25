/**
 * SERVICIO DE IA NO INTRUSIVA - ORDEN N°1 IMPLEMENTACIÓN MATERIAL
 * 
 * Analista Financiero de Solo-Lectura que cumple con:
 * - Acceso EXCLUSIVO a vistas _summary
 * - Validación estricta de nombres de vista
 * - Registro de todas las acciones en system_logs
 * - Conexión real a base de datos SQLite
 */

import { logger } from '../core/logging/SystemLogger';

export class IAService {
  private allowedViews = [
    'financial_summary',
    'tax_summary_florida'
  ];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      logger.info('IAService', 'init_start', 'Inicializando servicio IA de solo-lectura');
      const { db } = await import('../database/simple-db');
      if (db) {
        logger.info('IAService', 'init_success', 'Servicio de IA conectado a base de datos - ACCESO SOLO-LECTURA');
      } else {
        logger.warn('IAService', 'init_warning', 'Base de datos no disponible durante inicialización IA');
      }
    } catch (error) {
      logger.error('IAService', 'init_failed', 'Error al conectar IA a base de datos', { error: error instanceof Error ? error.message : 'Unknown' }, error as Error);
    }
  }

  /**
   * Método querySummary - ACCESO RESTRINGIDO A VISTAS _summary ÚNICAMENTE
   * ORDEN N°1: Implementación material con validación estricta
   */
  public async querySummary(viewName: string): Promise<any[]> {
    // VALIDACIÓN ESTRICTA: Solo vistas que terminan en _summary Y están en lista permitida
    if (!viewName.endsWith('_summary') || !this.allowedViews.includes(viewName)) {
      logger.error('IAService', 'access_denied', 'IA intentó acceder a vista no permitida', { viewName, allowedViews: this.allowedViews });
      throw new Error(`Vista no permitida para IA: ${viewName}. Solo se permite acceso a vistas _summary autorizadas.`);
    }

    try {
      const { db } = await import('../database/simple-db');
      
      if (!db) {
        logger.error('IAService', 'db_not_available', 'Base de datos no inicializada para consulta IA');
        throw new Error('Base de datos no inicializada. Espere a que el sistema cargue completamente.');
      }

      logger.info('IAService', 'query_summary_start', 'IA ejecutando consulta autorizada a vista _summary', { viewName });
      
      // SOLO consultas SELECT a vistas _summary - ACCESO DE SOLO-LECTURA
      const result = db.exec(`SELECT * FROM ${viewName}`);
      
      if (!result || result.length === 0 || !result[0].values) {
        logger.info('IAService', 'query_empty_result', 'Consulta IA exitosa pero sin datos', { viewName });
        return [];
      }

      const columns = result[0].columns;
      const rows = result[0].values;
      
      const data = rows.map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col: string, index: number) => {
          obj[col] = row[index];
        });
        return obj;
      });

      logger.info('IAService', 'query_success', 'IA obtuvo datos exitosamente de vista autorizada', { 
        viewName, 
        recordsReturned: data.length,
        columns: columns.length
      });

      return data;

    } catch (error) {
      logger.error('IAService', 'query_failed', 'Error en consulta IA a vista _summary', { viewName }, error as Error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad del servicio
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const { db } = await import('../database/simple-db');
      return db !== null;
    } catch {
      return false;
    }
  }
}

// Instancia singleton
export const iaService = new IAService();

// Export por defecto
export default iaService;