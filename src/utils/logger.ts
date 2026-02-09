import { logger as systemLogger, LogLevel } from '../core/logging/SystemLogger';

/**
 * Wrapper de logger para compatibilidad con el sistema y métodos adicionales
 */
type MaybeError = Error | undefined;

function normalizeArgs(args: IArguments | any[]): { module: string; action: string; message: string; data?: any; error?: MaybeError } {
    // Support two calling styles:
    // 1) module, action, message, data?, error?
    // 2) message, data?, module?, action?
    const a = Array.from(args as any[]);

    if (typeof a[0] === 'string' && typeof a[1] === 'string' && typeof a[2] === 'string') {
        // module, action, message, data?, error?
        return { module: a[0], action: a[1], message: a[2], data: a[3], error: a[4] };
    }

    // fallback: message, data?, module?, action?
    const message = a[0] as string;
    const data = a[1];
    const module = typeof a[2] === 'string' ? a[2] : 'Utils';
    const action = typeof a[3] === 'string' ? a[3] : 'log';
    return { module, action, message, data };
}

function wrapLevel(levelMethod: keyof typeof systemLogger, expectsError: boolean = false) {
    return function (...args: any[]) {
        const { module, action, message, data, error } = normalizeArgs(args as any[]);
        if (expectsError) {
            // @ts-ignore - forward to systemLogger method which accepts optional error
            (systemLogger as any)[levelMethod](module, action, message, data, error);
        } else {
            // @ts-ignore
            (systemLogger as any)[levelMethod](module, action, message, data);
        }
    };
}

export const logger = {
    debug: wrapLevel('debug'),
    info: wrapLevel('info'),
    warn: wrapLevel('warn'),
    error: wrapLevel('error', true),
    critical: wrapLevel('critical', true),
    emergency: wrapLevel('emergency', true),

    // Método success solicitado por la especificación
    success: function (...args: any[]) {
        const { module, action, message, data } = normalizeArgs(args as any[]);
        // @ts-ignore
        systemLogger.success(module, action, message, data);
    },

    // Log con nivel dinámico
    log: function (level: LogLevel, module: string, action: string, message: string, data?: any) {
        systemLogger.log(level, module, action, message, data);
    }
};

export default logger;
