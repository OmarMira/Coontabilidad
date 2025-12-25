/**
 * SERVICIO DE IA NO INTRUSIVA - ORDEN N°2 CORREGIDA
 * 
 * Implementación material del principio "IA No Intrusiva"
 * - Solo acceso de LECTURA a vistas _summary
 * - Conexión REAL a la base de datos SQLite
 * - Registro de todas las acciones en system_logs
 */

import { logger } from '../core/logging/SystemLogger';

export class IAService {
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Verificar que la base de datos esté disponible
      const { db } = await import('../database/simple-db');
      if (db) {
        this.isInitialized = true;
        logger.info('IAService', 'init_success', 'Servicio de IA conectado a base de datos real');
      } else {
        logger.warn('IAService', 'init_waiting', 'Base de datos aún no inicializada');
      }
    } catch (error) {
      logger.error('IAService', 'init_failed', 'Error al conectar con base de datos', { error: error instanceof Error ? error.message : 'Unknown' }, error as Error);
      this.isInitialized = false;
    }
  }

  /**
   * Método público querySummary - CONEXIÓN REAL A BD
   * Acepta únicamente nombres de vistas que terminen en '_summary'
   */
  public async querySummary(viewName: string): Promise<any[]> {
    // Validación de seguridad: solo vistas _summary
    if (!viewName.endsWith('_summary')) {
      logger.error('IAService', 'query_rejected', 'Intento de acceso a vista no autorizada', { viewName });
      throw new Error('Acceso denegado: Solo se permiten vistas _summary');
    }

    try {
      // Importar la instancia REAL de la base de datos
      const { db } = await import('../database/simple-db');
      
      if (!db) {
        logger.error('IAService', 'query_no_db', 'Base de datos no disponible para consulta IA');
        throw new Error('Base de datos no inicializada');
      }

      logger.info('IAService', 'query_start', 'Iniciando consulta REAL de solo-lectura a vista _summary', { viewName });
      
      // Ejecutar consulta SELECT * FROM [vista] en la BD REAL
      const result = db.exec(`SELECT * FROM ${viewName}`);
      
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

      // Registrar acción exitosa en system_logs
      logger.info('IAService', 'query_success', 'Consulta REAL de solo-lectura completada exitosamente', { 
        viewName, 
        recordsReturned: data.length,
        sampleData: data.length > 0 ? data[0] : null
      });

      return data;

    } catch (error) {
      logger.error('IAService', 'query_failed', 'Error en consulta REAL de solo-lectura', { viewName }, error as Error);
      throw new Error(`Error al consultar vista: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Verificar si el servicio está disponible
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