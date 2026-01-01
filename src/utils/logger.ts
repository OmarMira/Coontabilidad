import { logger as systemLogger, LogLevel } from '../core/logging/SystemLogger';

/**
 * Wrapper de logger para compatibilidad con el sistema y métodos adicionales
 */
export const logger = {
    debug: (message: string, data?: any, module: string = 'Utils', action: string = 'debug') =>
        systemLogger.debug(module, action, message, data),
    info: (message: string, data?: any, module: string = 'Utils', action: string = 'info') =>
        systemLogger.info(module, action, message, data),
    warn: (message: string, data?: any, module: string = 'Utils', action: string = 'warn') =>
        systemLogger.warn(module, action, message, data),
    error: (message: string, data?: any, error?: Error, module: string = 'Utils', action: string = 'error') =>
        systemLogger.error(module, action, message, data, error),
    critical: (message: string, data?: any, error?: Error, module: string = 'Utils', action: string = 'critical') =>
        systemLogger.critical(module, action, message, data, error),
    emergency: (message: string, data?: any, error?: Error, module: string = 'Utils', action: string = 'emergency') =>
        systemLogger.emergency(module, action, message, data, error),

    // Método success solicitado por la especificación
    success: (message: string, data?: any, module: string = 'Utils', action: string = 'success') =>
        systemLogger.success(module, action, message, data),

    // Log con nivel dinámico
    log: (level: LogLevel, module: string, action: string, message: string, data?: any) =>
        systemLogger.log(level, module, action, message, data)
};

export default logger;
