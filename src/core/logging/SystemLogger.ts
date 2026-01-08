// src/core/logging/SystemLogger.ts
import initSqlJs from 'sql.js';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface SystemLog {
  id: number;
  timestamp: string;
  level: LogLevel;
  module: string;
  action: string;
  message: string;
  user_id: number;
  ip_address?: string;
  user_agent?: string;
  data?: string;
  stack_trace?: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: number;
  session_id?: string;
}

export interface LogFilter {
  level?: LogLevel;
  module?: string;
  startDate?: Date;
  endDate?: Date;
  resolved?: boolean;
  limit?: number;
}

export interface ErrorStats {
  totalErrors: number;
  unresolved: number;
  byModule: Record<string, number>;
  byLevel: Record<string, number>;
  recentErrors: SystemLog[];
  last24Hours: number;
  criticalCount: number;
}

export class SystemLogger {
  private static instance: SystemLogger;
  private db: initSqlJs.Database | null = null;
  private sessionId: string;
  private fallbackLogs: any[] = [];

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorHandlers();
  }

  static getInstance(): SystemLogger {
    if (!SystemLogger.instance) {
      SystemLogger.instance = new SystemLogger();
    }
    return SystemLogger.instance;
  }

  initialize(database: initSqlJs.Database): void {
    this.db = database;
    this.log('INFO', 'SystemLogger', 'initialize', 'Sistema de logging inicializado correctamente');

    // Procesar logs fallback si existen
    this.processFallbackLogs();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Capturar errores no manejados
    window.addEventListener('error', (event) => {
      this.log('ERROR', 'GlobalErrorHandler', 'unhandled_error',
        `Error no manejado: ${event.message}`,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        event.error
      );
    });

    // Capturar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
      this.log('ERROR', 'GlobalErrorHandler', 'unhandled_rejection',
        `Promesa rechazada: ${event.reason}`,
        { reason: event.reason }
      );
    });
  }

  async log(
    level: LogLevel,
    module: string,
    action: string,
    message: string,
    data?: any,
    error?: Error
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      action,
      message,
      user_id: 1, // TODO: Implementar sistema de usuarios
      ip_address: this.getClientIP(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'NodeJS',
      data: data ? JSON.stringify(data, null, 2) : null,
      stack_trace: error?.stack || null,
      resolved: false,
      session_id: this.sessionId
    };

    try {
      if (this.db) {
        const stmt = this.db.prepare(`
          INSERT INTO system_logs (
            timestamp, level, module, action, message, user_id, 
            ip_address, user_agent, data, stack_trace, resolved, session_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
          logEntry.timestamp,
          logEntry.level,
          logEntry.module,
          logEntry.action,
          logEntry.message,
          logEntry.user_id,
          logEntry.ip_address,
          logEntry.user_agent,
          logEntry.data,
          logEntry.stack_trace,
          logEntry.resolved ? 1 : 0,
          logEntry.session_id
        ]);

        stmt.free();
      } else {
        // Base de datos no disponible, usar fallback
        this.fallbackLog(logEntry);
      }

      // Mostrar en consola en desarrollo
      this.consoleLog(level, module, action, message, data, error);

      // Emitir evento para UI si es error crítico
      if (level === 'ERROR' || level === 'CRITICAL') {
        this.emitErrorEvent(logEntry);
      }

    } catch (logError) {
      console.error('Failed to log to database:', logError);
      this.fallbackLog(logEntry);
    }
  }

  private getClientIP(): string {
    // En un entorno real, esto vendría del servidor
    return 'localhost';
  }

  private consoleLog(level: LogLevel, module: string, action: string, message: string, data?: any, error?: Error): void {
    const colors = {
      DEBUG: '#6B7280',
      INFO: '#3B82F6',
      WARN: '#F59E0B',
      ERROR: '#EF4444',
      CRITICAL: '#DC2626'
    };

    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] [${level}] ${module}.${action}: ${message}`;

    console.log(`%c${logMessage}`, `color: ${colors[level]}; font-weight: ${level === 'ERROR' || level === 'CRITICAL' ? 'bold' : 'normal'}`);

    if (data) {
      console.log('%cData:', 'color: #6B7280; font-style: italic', data);
    }

    if (error) {
      console.error('%cError:', 'color: #EF4444; font-weight: bold', error);
    }
  }

  private fallbackLog(logEntry: any): void {
    this.fallbackLogs.push(logEntry);

    // Mantener solo últimos 100 logs en memoria
    if (this.fallbackLogs.length > 100) {
      this.fallbackLogs.shift();
    }

    // Guardar en localStorage también
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('system_logs_fallback') || '[]');
        stored.push(logEntry);

        if (stored.length > 100) {
          stored.shift();
        }

        localStorage.setItem('system_logs_fallback', JSON.stringify(stored));
      } catch (error) {
        console.error('Failed to save fallback logs to localStorage:', error);
      }
    }
  }

  private processFallbackLogs(): void {
    if (this.fallbackLogs.length > 0 && this.db) {
      console.log(`Processing ${this.fallbackLogs.length} fallback logs...`);

      this.fallbackLogs.forEach(logEntry => {
        try {
          const stmt = this.db!.prepare(`
            INSERT INTO system_logs (
              timestamp, level, module, action, message, user_id, 
              ip_address, user_agent, data, stack_trace, resolved, session_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          stmt.run([
            logEntry.timestamp,
            logEntry.level,
            logEntry.module,
            logEntry.action,
            logEntry.message,
            logEntry.user_id,
            logEntry.ip_address,
            logEntry.user_agent,
            logEntry.data,
            logEntry.stack_trace,
            logEntry.resolved ? 1 : 0,
            logEntry.session_id
          ]);

          stmt.free();
        } catch (error) {
          console.error('Failed to process fallback log:', error);
        }
      });

      this.fallbackLogs = [];
      console.log('Fallback logs processed successfully');
    }
  }

  private emitErrorEvent(logEntry: any): void {
    window.dispatchEvent(new CustomEvent('system-error', {
      detail: logEntry
    }));
  }

  async getLogs(filter?: LogFilter): Promise<SystemLog[]> {
    if (!this.db) {
      console.warn('Database not available, returning fallback logs');
      return this.fallbackLogs.slice(-50); // Últimos 50 logs
    }

    try {
      let query = `SELECT * FROM system_logs WHERE 1=1`;
      const params: any[] = [];

      if (filter?.level) {
        query += ` AND level = ?`;
        params.push(filter.level);
      }

      if (filter?.module) {
        query += ` AND module = ?`;
        params.push(filter.module);
      }

      if (filter?.startDate) {
        query += ` AND timestamp >= ?`;
        params.push(filter.startDate.toISOString());
      }

      if (filter?.endDate) {
        query += ` AND timestamp <= ?`;
        params.push(filter.endDate.toISOString());
      }

      if (filter?.resolved !== undefined) {
        query += ` AND resolved = ?`;
        params.push(filter.resolved ? 1 : 0);
      }

      query += ` ORDER BY timestamp DESC`;

      if (filter?.limit) {
        query += ` LIMIT ?`;
        params.push(filter.limit);
      }

      const result = this.db.exec(query, params);

      if (!result[0]) return [];

      const logs: SystemLog[] = [];
      const columns = result[0].columns;

      result[0].values.forEach(row => {
        const log: any = {};
        columns.forEach((col, index) => {
          log[col] = row[index];
        });

        // Convertir valores booleanos
        log.resolved = Boolean(log.resolved);

        logs.push(log as SystemLog);
      });

      return logs;

    } catch (error) {
      console.error('Error getting logs:', error);
      this.log('ERROR', 'SystemLogger', 'get_logs_failed',
        'Error al obtener logs de la base de datos', { filter }, error as Error);
      return [];
    }
  }

  async markAsResolved(logId: number, resolvedBy: number = 1): Promise<boolean> {
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare(`
        UPDATE system_logs 
        SET resolved = 1, resolved_at = CURRENT_TIMESTAMP, resolved_by = ?
        WHERE id = ?
      `);

      stmt.run([resolvedBy, logId]);
      stmt.free();

      this.log('INFO', 'SystemLogger', 'mark_resolved',
        `Log ${logId} marcado como resuelto`, { logId, resolvedBy });

      return true;
    } catch (error) {
      console.error('Error marking log as resolved:', error);
      return false;
    }
  }

  async getErrorStats(): Promise<ErrorStats> {
    if (!this.db) {
      return {
        totalErrors: 0,
        unresolved: 0,
        byModule: {},
        byLevel: {},
        recentErrors: [],
        last24Hours: 0,
        criticalCount: 0
      };
    }

    try {
      // Total de errores
      const totalResult = this.db.exec(`
        SELECT COUNT(*) as count FROM system_logs 
        WHERE level IN ('ERROR', 'CRITICAL')
      `);
      const totalErrors = totalResult[0]?.values[0]?.[0] as number || 0;

      // Errores sin resolver
      const unresolvedResult = this.db.exec(`
        SELECT COUNT(*) as count FROM system_logs 
        WHERE level IN ('ERROR', 'CRITICAL') AND resolved = 0
      `);
      const unresolved = unresolvedResult[0]?.values[0]?.[0] as number || 0;

      // Errores por módulo
      const moduleResult = this.db.exec(`
        SELECT module, COUNT(*) as count 
        FROM system_logs 
        WHERE level IN ('ERROR', 'CRITICAL')
        GROUP BY module 
        ORDER BY count DESC
      `);

      const byModule: Record<string, number> = {};
      if (moduleResult[0]) {
        moduleResult[0].values.forEach(row => {
          byModule[row[0] as string] = row[1] as number;
        });
      }

      // Errores por nivel
      const levelResult = this.db.exec(`
        SELECT level, COUNT(*) as count 
        FROM system_logs 
        GROUP BY level 
        ORDER BY count DESC
      `);

      const byLevel: Record<string, number> = {};
      if (levelResult[0]) {
        levelResult[0].values.forEach(row => {
          byLevel[row[0] as string] = row[1] as number;
        });
      }

      // Errores de las últimas 24 horas
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const last24Result = this.db.exec(`
        SELECT COUNT(*) as count FROM system_logs 
        WHERE level IN ('ERROR', 'CRITICAL') AND timestamp >= ?
      `, [yesterday.toISOString()]);
      const last24Hours = last24Result[0]?.values[0]?.[0] as number || 0;

      // Errores críticos
      const criticalResult = this.db.exec(`
        SELECT COUNT(*) as count FROM system_logs 
        WHERE level = 'CRITICAL'
      `);
      const criticalCount = criticalResult[0]?.values[0]?.[0] as number || 0;

      // Errores recientes
      const recentErrors = await this.getLogs({
        level: 'ERROR',
        resolved: false,
        limit: 10
      });

      return {
        totalErrors,
        unresolved,
        byModule,
        byLevel,
        recentErrors,
        last24Hours,
        criticalCount
      };

    } catch (error) {
      console.error('Error getting error stats:', error);
      this.log('ERROR', 'SystemLogger', 'get_stats_failed',
        'Error al obtener estadísticas de errores', null, error as Error);

      return {
        totalErrors: 0,
        unresolved: 0,
        byModule: {},
        byLevel: {},
        recentErrors: [],
        last24Hours: 0,
        criticalCount: 0
      };
    }
  }

  async clearOldLogs(daysToKeep: number = 30): Promise<number> {
    if (!this.db) return 0;

    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const result = this.db.exec(`
        DELETE FROM system_logs 
        WHERE timestamp < ? AND resolved = 1
      `, [cutoffDate.toISOString()]);

      const deletedCount = this.db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;

      this.log('INFO', 'SystemLogger', 'cleanup',
        `Limpieza de logs completada: ${deletedCount} registros eliminados`,
        { daysToKeep, cutoffDate: cutoffDate.toISOString() });

      return deletedCount;
    } catch (error) {
      console.error('Error clearing old logs:', error);
      this.log('ERROR', 'SystemLogger', 'cleanup_failed',
        'Error al limpiar logs antiguos', { daysToKeep }, error as Error);
      return 0;
    }
  }

  // Métodos de conveniencia para logging rápido
  debug(module: string, action: string, message: string, data?: any): void {
    this.log('DEBUG', module, action, message, data);
  }

  info(module: string, action: string, message: string, data?: any): void {
    this.log('INFO', module, action, message, data);
  }

  warn(module: string, action: string, message: string, data?: any): void {
    this.log('WARN', module, action, message, data);
  }

  error(module: string, action: string, message: string, data?: any, error?: Error): void {
    this.log('ERROR', module, action, message, data, error);
  }

  critical(module: string, action: string, message: string, data?: any, error?: Error): void {
    this.log('CRITICAL', module, action, message, data, error);
  }

  emergency(module: string, action: string, message: string, data?: any, error?: Error): void {
    this.log('CRITICAL', module, action, `🚨 EMERGENCY: ${message}`, data, error);
  }

  success(module: string, action: string, message: string, data?: any): void {
    this.log('INFO', module, action, `✅ ${message}`, data);
  }
}

// Instancia global del logger
export const logger = SystemLogger.getInstance();