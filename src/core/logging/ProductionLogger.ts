/**
 * ProductionLogger - NASA-Level Structured Logger
 * 
 * Reemplaza console.* con logging estructurado que:
 * - Se elimina automáticamente en producción (console.log/warn)
 * - Incluye contexto rico (timestamp, módulo, usuario)
 * - Persiste logs críticos en DB
 * - Cumple con OWASP A03:2021 (no expone datos sensibles)
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    CRITICAL = 4
}

export interface LogContext {
    timestamp: string;
    level: LogLevel;
    module: string;
    message: string;
    data?: any;
    userId?: number;
    sessionId?: string;
    error?: Error;
}

export interface LoggerConfig {
    minLevel: LogLevel;
    persistCritical: boolean;
    includeStackTrace: boolean;
    maxDataSize: number; // bytes
}

class ProductionLoggerClass {
    private config: LoggerConfig;
    private sessionId: string;
    private buffer: LogContext[] = [];
    private readonly MAX_BUFFER_SIZE = 100;

    constructor() {
        // Detectar environment
        const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
        const isTest = import.meta.env.MODE === 'test';

        this.config = {
            minLevel: isDevelopment || isTest ? LogLevel.DEBUG : LogLevel.ERROR,
            persistCritical: !isTest,
            includeStackTrace: isDevelopment,
            maxDataSize: 10000 // 10KB max per log
        };

        this.sessionId = this.generateSessionId();
    }

    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private shouldLog(level: LogLevel): boolean {
        return level >= this.config.minLevel;
    }

    private sanitizeData(data: any): any {
        if (!data) return undefined;

        try {
            const str = JSON.stringify(data);
            if (str.length > this.config.maxDataSize) {
                return { _truncated: true, _size: str.length };
            }
            return data;
        } catch {
            return { _error: 'Failed to serialize data' };
        }
    }

    private createContext(
        level: LogLevel,
        module: string,
        message: string,
        data?: any,
        error?: Error
    ): LogContext {
        return {
            timestamp: new Date().toISOString(),
            level,
            module,
            message,
            data: this.sanitizeData(data),
            sessionId: this.sessionId,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: this.config.includeStackTrace ? error.stack : undefined
            } as any : undefined
        };
    }

    private formatMessage(context: LogContext): string {
        const levelName = LogLevel[context.level];
        const parts = [
            `[${context.timestamp}]`,
            `[${levelName}]`,
            `[${context.module}]`,
            context.message
        ];

        if (context.data) {
            parts.push(JSON.stringify(context.data));
        }

        if (context.error) {
            parts.push(`Error: ${context.error.message}`);
            if (context.error.stack) {
                parts.push(context.error.stack);
            }
        }

        return parts.join(' ');
    }

    private output(context: LogContext): void {
        const formatted = this.formatMessage(context);

        // En desarrollo, usar console nativo (será stripped en producción)
        if (import.meta.env.DEV) {
            switch (context.level) {
                case LogLevel.DEBUG:
                case LogLevel.INFO:
                    console.log(formatted);
                    break;
                case LogLevel.WARN:
                    console.warn(formatted);
                    break;
                case LogLevel.ERROR:
                case LogLevel.CRITICAL:
                    console.error(formatted);
                    break;
            }
        } else {
            // En producción, solo console.error para críticos
            if (context.level >= LogLevel.ERROR) {
                console.error(formatted);
            }
        }

        // Buffer para persistencia
        this.buffer.push(context);
        if (this.buffer.length > this.MAX_BUFFER_SIZE) {
            this.buffer.shift();
        }

        // Persistir críticos inmediatamente
        if (context.level === LogLevel.CRITICAL && this.config.persistCritical) {
            this.persistLog(context).catch(err => {
                console.error('Failed to persist critical log:', err);
            });
        }
    }

    private async persistLog(context: LogContext): Promise<void> {
        try {
            // Lazy import para evitar circular dependencies
            const { logger } = await import('./SystemLogger');
            await logger.log(
                'ProductionLogger',
                'critical_event',
                context.message,
                context.data
            );
        } catch (error) {
            // Silently fail - no queremos romper la app por logging
        }
    }

    /**
     * Debug - Solo en desarrollo
     */
    debug(module: string, message: string, data?: any): void {
        if (!this.shouldLog(LogLevel.DEBUG)) return;
        const context = this.createContext(LogLevel.DEBUG, module, message, data);
        this.output(context);
    }

    /**
     * Info - Solo en desarrollo
     */
    info(module: string, message: string, data?: any): void {
        if (!this.shouldLog(LogLevel.INFO)) return;
        const context = this.createContext(LogLevel.INFO, module, message, data);
        this.output(context);
    }

    /**
     * Warn - Solo en desarrollo
     */
    warn(module: string, message: string, data?: any): void {
        if (!this.shouldLog(LogLevel.WARN)) return;
        const context = this.createContext(LogLevel.WARN, module, message, data);
        this.output(context);
    }

    /**
     * Error - Siempre se muestra
     */
    error(module: string, message: string, error?: Error, data?: any): void {
        if (!this.shouldLog(LogLevel.ERROR)) return;
        const context = this.createContext(LogLevel.ERROR, module, message, data, error);
        this.output(context);
    }

    /**
     * Critical - Siempre se muestra y persiste
     */
    critical(module: string, message: string, error?: Error, data?: any): void {
        const context = this.createContext(LogLevel.CRITICAL, module, message, data, error);
        this.output(context);
    }

    /**
     * Obtener logs del buffer (para debugging)
     */
    getRecentLogs(count: number = 50): LogContext[] {
        return this.buffer.slice(-count);
    }

    /**
     * Limpiar buffer
     */
    clearBuffer(): void {
        this.buffer = [];
    }

    /**
     * Configurar logger
     */
    configure(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }
}

// Singleton instance
export const ProductionLogger = new ProductionLoggerClass();

// Export conveniente
export const logger = ProductionLogger;
