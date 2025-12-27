/**
 * SERVICIO DE BACKUP CIFRADO .aex
 * 
 * Cumple con Master Prompt Sección 9: "Backup Cifrado"
 * - Exportación completa de la base de datos
 * - Cifrado AES-256-GCM con contraseña del usuario
 * - Formato .aex (AccountExpress eXport)
 * - Verificación de integridad con checksums
 * - Restauración completa con validación
 */

import { BasicEncryption } from '../core/security/BasicEncryption';
import { logger } from '../core/logging/SystemLogger';

export interface BackupMetadata {
  version: string;
  created_at: string;
  database_version: string;
  total_tables: number;
  total_records: number;
  checksum: string;
  encryption_method: string;
  app_version: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  tables: { [tableName: string]: any[] };
  schema: { [tableName: string]: string };
}

export interface BackupResult {
  success: boolean;
  message: string;
  filename?: string;
  size?: number;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  restored_tables?: number;
  restored_records?: number;
  error?: string;
}

class BackupService {
  private db: any = null;

  constructor() {
    // No inicializar en el constructor, hacerlo bajo demanda
  }

  private async ensureDatabase() {
    if (this.db) return this.db;
    
    try {
      // Importar la base de datos de forma dinámica
      const dbModule = await import('../database/simple-db');
      // Acceder a la instancia de db exportada
      this.db = (dbModule as any).db;
      
      if (!this.db) {
        throw new Error('Database instance not available');
      }
      
      logger.info('BackupService', 'db_connected', 'Conexión a base de datos establecida');
      return this.db;
    } catch (error) {
      logger.error('BackupService', 'db_connection_failed', 'Error al conectar con la base de datos', null, error as Error);
      throw error;
    }
  }

  /**
   * Exporta toda la base de datos a un archivo .aex cifrado
   */
  public async exportToAex(password: string, includeSystemLogs: boolean = false): Promise<BackupResult> {
    try {
      // Asegurar que la base de datos esté disponible
      await this.ensureDatabase();
    } catch (error) {
      return { success: false, message: 'Base de datos no disponible', error: 'DB_NOT_AVAILABLE' };
    }

    if (!password || password.length < 8) {
      return { success: false, message: 'La contraseña debe tener al menos 8 caracteres', error: 'WEAK_PASSWORD' };
    }

    try {
      logger.info('BackupService', 'export_start', 'Iniciando exportación de backup cifrado');

      // 1. Obtener lista de todas las tablas
      const tablesResult = this.db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);

      if (tablesResult.length === 0 || tablesResult[0].values.length === 0) {
        return { success: false, message: 'No se encontraron tablas para exportar', error: 'NO_TABLES' };
      }

      const tableNames = tablesResult[0].values.map((row: any) => row[0] as string);
      
      // Filtrar system_logs si no se incluyen
      const tablesToExport = includeSystemLogs ? 
        tableNames : 
        tableNames.filter((name: string) => name !== 'system_logs');

      logger.info('BackupService', 'tables_found', 'Tablas encontradas para exportar', { 
        total: tableNames.length, 
        toExport: tablesToExport.length 
      });

      // 2. Exportar esquema de cada tabla
      const schema: { [tableName: string]: string } = {};
      for (const tableName of tablesToExport) {
        const schemaResult = this.db.exec(`
          SELECT sql FROM sqlite_master 
          WHERE type='table' AND name=?
        `, [tableName]);

        if (schemaResult.length > 0 && schemaResult[0].values.length > 0) {
          schema[tableName] = schemaResult[0].values[0][0] as string;
        }
      }

      // 3. Exportar datos de cada tabla
      const tables: { [tableName: string]: any[] } = {};
      let totalRecords = 0;

      for (const tableName of tablesToExport) {
        try {
          const dataResult = this.db.exec(`SELECT * FROM ${tableName}`);
          
          if (dataResult.length > 0 && dataResult[0].values.length > 0) {
            const columns = dataResult[0].columns;
            const rows = dataResult[0].values.map((row: any) => {
              const record: any = {};
              columns.forEach((col: string, index: number) => {
                record[col] = row[index];
              });
              return record;
            });
            
            tables[tableName] = rows;
            totalRecords += rows.length;
            
            logger.info('BackupService', 'table_exported', `Tabla ${tableName} exportada`, { 
              records: rows.length 
            });
          } else {
            tables[tableName] = [];
            logger.info('BackupService', 'table_empty', `Tabla ${tableName} está vacía`);
          }
        } catch (error) {
          logger.error('BackupService', 'table_export_error', `Error exportando tabla ${tableName}`, null, error as Error);
          tables[tableName] = [];
        }
      }

      // 4. Crear metadata del backup
      const metadata: BackupMetadata = {
        version: '1.0',
        created_at: new Date().toISOString(),
        database_version: 'SQLite 3.x',
        total_tables: tablesToExport.length,
        total_records: totalRecords,
        checksum: '', // Se calculará después
        encryption_method: 'AES-256-GCM',
        app_version: '0.8.0'
      };

      // 5. Crear objeto de backup completo
      const backupData: BackupData = {
        metadata,
        tables,
        schema
      };

      // 6. Calcular checksum de los datos
      const dataString = JSON.stringify({ tables, schema });
      const checksum = await this.calculateChecksum(dataString);
      backupData.metadata.checksum = checksum;

      // 7. Convertir a JSON y cifrar
      const jsonData = JSON.stringify(backupData, null, 2);
      const jsonBytes = new TextEncoder().encode(jsonData);

      logger.info('BackupService', 'encrypting_data', 'Cifrando datos del backup', { 
        size: jsonBytes.length,
        tables: tablesToExport.length,
        records: totalRecords
      });

      // 8. Cifrar con AES-256-GCM
      const encryptedResult = await BasicEncryption.encrypt(jsonBytes, password);
      
      // Crear el array final para el blob
      const finalData = new Uint8Array(
        encryptedResult.salt.length + 
        encryptedResult.iv.length + 
        encryptedResult.encrypted.length + 
        8 // 4 bytes para salt length + 4 bytes para iv length
      );
      
      let offset = 0;
      
      // Escribir longitud del salt (4 bytes)
      const saltLengthView = new DataView(finalData.buffer, offset, 4);
      saltLengthView.setUint32(0, encryptedResult.salt.length, true);
      offset += 4;
      
      // Escribir longitud del IV (4 bytes)
      const ivLengthView = new DataView(finalData.buffer, offset, 4);
      ivLengthView.setUint32(0, encryptedResult.iv.length, true);
      offset += 4;
      
      // Escribir salt
      finalData.set(encryptedResult.salt, offset);
      offset += encryptedResult.salt.length;
      
      // Escribir IV
      finalData.set(encryptedResult.iv, offset);
      offset += encryptedResult.iv.length;
      
      // Escribir datos cifrados
      finalData.set(encryptedResult.encrypted, offset);

      // 9. Crear nombre de archivo
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `coontabilidad-backup-${timestamp}.aex`;

      // 10. Crear blob y descargar
      const blob = new Blob([finalData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info('BackupService', 'export_success', 'Backup exportado exitosamente', {
        filename,
        size: finalData.length,
        tables: tablesToExport.length,
        records: totalRecords
      });

      return {
        success: true,
        message: `Backup creado exitosamente: ${filename}`,
        filename,
        size: finalData.length
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('BackupService', 'export_failed', 'Error al crear backup', null, error as Error);
      
      return {
        success: false,
        message: `Error al crear backup: ${errorMsg}`,
        error: errorMsg
      };
    }
  }

  /**
   * Restaura la base de datos desde un archivo .aex cifrado
   */
  public async restoreFromAex(file: File, password: string): Promise<RestoreResult> {
    try {
      // Asegurar que la base de datos esté disponible
      await this.ensureDatabase();
    } catch (error) {
      return { success: false, message: 'Base de datos no disponible', error: 'DB_NOT_AVAILABLE' };
    }

    if (!password) {
      return { success: false, message: 'Se requiere contraseña para descifrar', error: 'NO_PASSWORD' };
    }

    try {
      logger.info('BackupService', 'restore_start', 'Iniciando restauración desde backup', { 
        filename: file.name,
        size: file.size
      });

      // 1. Leer archivo
      const arrayBuffer = await file.arrayBuffer();
      const encryptedData = new Uint8Array(arrayBuffer);

      // 2. Descifrar datos
      logger.info('BackupService', 'decrypting_data', 'Descifrando backup');
      
      let decryptedData: Uint8Array;
      try {
        // Parsear el formato del archivo
        const dataView = new DataView(arrayBuffer);
        let offset = 0;
        
        // Leer longitud del salt
        const saltLength = dataView.getUint32(offset, true);
        offset += 4;
        
        // Leer longitud del IV
        const ivLength = dataView.getUint32(offset, true);
        offset += 4;
        
        // Extraer salt
        const salt = new Uint8Array(arrayBuffer, offset, saltLength);
        offset += saltLength;
        
        // Extraer IV
        const iv = new Uint8Array(arrayBuffer, offset, ivLength);
        offset += ivLength;
        
        // Extraer datos cifrados
        const encrypted = new Uint8Array(arrayBuffer, offset);
        
        decryptedData = await BasicEncryption.decrypt(encrypted, salt, iv, password);
      } catch (error) {
        logger.error('BackupService', 'decrypt_failed', 'Error al descifrar backup', null, error as Error);
        return { 
          success: false, 
          message: 'Contraseña incorrecta o archivo corrupto', 
          error: 'DECRYPT_FAILED' 
        };
      }

      // 3. Convertir a JSON
      const jsonString = new TextDecoder().decode(decryptedData);
      let backupData: BackupData;
      
      try {
        backupData = JSON.parse(jsonString);
      } catch (error) {
        logger.error('BackupService', 'parse_failed', 'Error al parsear JSON del backup', null, error as Error);
        return { 
          success: false, 
          message: 'Formato de backup inválido', 
          error: 'INVALID_FORMAT' 
        };
      }

      // 4. Validar estructura del backup
      if (!backupData.metadata || !backupData.tables || !backupData.schema) {
        return { 
          success: false, 
          message: 'Estructura de backup inválida', 
          error: 'INVALID_STRUCTURE' 
        };
      }

      // 5. Verificar checksum
      const dataString = JSON.stringify({ 
        tables: backupData.tables, 
        schema: backupData.schema 
      });
      const calculatedChecksum = await this.calculateChecksum(dataString);
      
      if (calculatedChecksum !== backupData.metadata.checksum) {
        logger.error('BackupService', 'checksum_mismatch', 'Checksum no coincide', {
          expected: backupData.metadata.checksum,
          calculated: calculatedChecksum
        });
        return { 
          success: false, 
          message: 'Integridad del backup comprometida (checksum inválido)', 
          error: 'CHECKSUM_MISMATCH' 
        };
      }

      logger.info('BackupService', 'backup_validated', 'Backup validado correctamente', {
        version: backupData.metadata.version,
        tables: backupData.metadata.total_tables,
        records: backupData.metadata.total_records,
        created: backupData.metadata.created_at
      });

      // 6. Confirmar restauración (esto borrará todos los datos actuales)
      const confirmRestore = window.confirm(
        `¿Está seguro de que desea restaurar este backup?\n\n` +
        `Fecha: ${new Date(backupData.metadata.created_at).toLocaleString()}\n` +
        `Tablas: ${backupData.metadata.total_tables}\n` +
        `Registros: ${backupData.metadata.total_records}\n\n` +
        `ADVERTENCIA: Esto eliminará todos los datos actuales.`
      );

      if (!confirmRestore) {
        return { 
          success: false, 
          message: 'Restauración cancelada por el usuario', 
          error: 'USER_CANCELLED' 
        };
      }

      // 7. Comenzar restauración
      let restoredTables = 0;
      let restoredRecords = 0;

      // Deshabilitar foreign keys temporalmente
      this.db.exec('PRAGMA foreign_keys=OFF');

      try {
        // 8. Recrear esquema de tablas
        for (const [tableName, createSQL] of Object.entries(backupData.schema)) {
          try {
            // Eliminar tabla si existe
            this.db.exec(`DROP TABLE IF EXISTS ${tableName}`);
            
            // Recrear tabla
            this.db.exec(createSQL);
            
            logger.info('BackupService', 'table_recreated', `Tabla ${tableName} recreada`);
          } catch (error) {
            logger.error('BackupService', 'table_recreate_error', `Error recreando tabla ${tableName}`, null, error as Error);
            throw new Error(`Error recreando tabla ${tableName}: ${error}`);
          }
        }

        // 9. Restaurar datos
        for (const [tableName, records] of Object.entries(backupData.tables)) {
          if (records.length === 0) continue;

          try {
            // Obtener columnas de la primera fila
            const columns = Object.keys(records[0]);
            const placeholders = columns.map(() => '?').join(', ');
            const columnNames = columns.join(', ');

            const insertSQL = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;

            // Insertar cada registro
            for (const record of records) {
              const values = columns.map(col => record[col]);
              this.db.exec(insertSQL, values);
            }

            restoredTables++;
            restoredRecords += records.length;

            logger.info('BackupService', 'table_restored', `Tabla ${tableName} restaurada`, { 
              records: records.length 
            });

          } catch (error) {
            logger.error('BackupService', 'table_restore_error', `Error restaurando datos de ${tableName}`, null, error as Error);
            throw new Error(`Error restaurando datos de ${tableName}: ${error}`);
          }
        }

        // Reactivar foreign keys
        this.db.exec('PRAGMA foreign_keys=ON');

        logger.info('BackupService', 'restore_success', 'Restauración completada exitosamente', {
          tables: restoredTables,
          records: restoredRecords
        });

        return {
          success: true,
          message: `Backup restaurado exitosamente: ${restoredTables} tablas, ${restoredRecords} registros`,
          restored_tables: restoredTables,
          restored_records: restoredRecords
        };

      } catch (error) {
        // Reactivar foreign keys en caso de error
        this.db.exec('PRAGMA foreign_keys=ON');
        throw error;
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      logger.error('BackupService', 'restore_failed', 'Error al restaurar backup', null, error as Error);
      
      return {
        success: false,
        message: `Error al restaurar backup: ${errorMsg}`,
        error: errorMsg
      };
    }
  }

  /**
   * Calcula checksum SHA-256 de los datos
   */
  private async calculateChecksum(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      logger.error('BackupService', 'checksum_error', 'Error calculando checksum', null, error as Error);
      // Fallback simple
      return data.length.toString(16);
    }
  }

  /**
   * Verifica si el servicio está disponible
   */
  public async isAvailable(): Promise<boolean> {
    try {
      await this.ensureDatabase();
      return this.db !== null && BasicEncryption.isSupported();
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene información del servicio
   */
  public async getServiceInfo() {
    let databaseConnected = false;
    try {
      await this.ensureDatabase();
      databaseConnected = this.db !== null;
    } catch (error) {
      databaseConnected = false;
    }

    return {
      available: databaseConnected && BasicEncryption.isSupported(),
      encryption_supported: BasicEncryption.isSupported(),
      database_connected: databaseConnected,
      supported_formats: ['.aex'],
      encryption_method: 'AES-256-GCM',
      version: '1.0'
    };
  }
}

// Singleton instance
export const backupService = new BackupService();

// Export default
export default backupService;