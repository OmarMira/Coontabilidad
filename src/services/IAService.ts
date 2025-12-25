/**
 * SERVICIO DE IA NO INTRUSIVA - ORDEN N°1
 * 
 * Implementación material del principio "IA No Intrusiva"
 * - Solo acceso de LECTURA a vistas _summary
 * - Registro de todas las acciones en system_logs
 * - Sin modificación de datos
 */

import { logger } from '../core/logging/SystemLogger';

export class IAService {
  private db: any = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Importar la base de datos de forma dinámica
      const { db: database } = await import('../database/simple-db');
      this.db = database;
      this.isInitialized = true;
      logger.info('IAService', 'init_success', 'Servicio de IA inicializado correctamente');
    } catch (error) {
      logger.error('IAService', 'init_failed', 'Error al inicializar servicio de IA', { error: error instanceof Error ? error.message : 'Unknown' }, error as Error);
      this.isInitialized = false;
    }
  }

  /**
   * Método público querySummary - SOLO LECTURA
   * Acepta únicamente nombres de vistas que terminen en '_summary'
   */
  public querySummary(viewName: string): any[] {
    // Validación de seguridad: solo vistas _summary
    if (!viewName.endsWith('_summary')) {
      logger.error('IAService', 'query_rejected', 'Intento de acceso a vista no autorizada', { viewName });
      throw new Error('Acceso denegado: Solo se permiten vistas _summary');
    }

    if (!this.isInitialized || !this.db) {
      logger.error('IAService', 'query_no_db', 'Base de datos no disponible para consulta IA');
      throw new Error('Servicio de IA no disponible');
    }

    try {
      logger.info('IAService', 'query_start', 'Iniciando consulta de solo-lectura a vista _summary', { viewName });
      
      // Ejecutar consulta SELECT * FROM [vista] - SOLO LECTURA
      const result = this.db.exec(`SELECT * FROM ${viewName}`);
      
      if (!result || result.length === 0 || !result[0].values) {
        logger.info('IAService', 'query_empty', 'Vista _summary sin datos', { viewName });
        return [];
      }

      // Convertir resultado a array de objetos
      const columns = result[0].columns;
      const rows = result[0].values;
      
      const data = rows.map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col: string, index: number) => {
          obj[col] = row[index];
        });
        return obj;
      });

      // Registrar acción en system_logs
      logger.info('IAService', 'query_success', 'Consulta de solo-lectura completada exitosamente', { 
        viewName, 
        recordsReturned: data.length 
      });

      return data;

    } catch (error) {
      logger.error('IAService', 'query_failed', 'Error en consulta de solo-lectura', { viewName }, error as Error);
      throw new Error(`Error al consultar vista: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Verificar si el servicio está disponible
   */
  public isAvailable(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

// Instancia singleton
export const iaService = new IAService();

// Export por defecto
export default iaService;