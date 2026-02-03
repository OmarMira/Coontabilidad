/**
 * ExponentialBackoff - NASA-Level Retry Strategy
 * 
 * Implementa exponential backoff con jitter para operaciones de red:
 * - Delays exponenciales: 1s, 2s, 4s, 8s, 16s
 * - Jitter aleatorio para evitar thundering herd
 * - Métricas de reintentos para monitoreo
 * - Audit trail de intentos fallidos
 * 
 * Cumple con requisitos P0 del audit report.
 */

import { ProductionLogger } from '../logging/ProductionLogger';
import { metricsCollector, MetricCategory } from '../monitoring/MetricsCollector';

export interface BackoffConfig {
    maxRetries: number;
    baseDelay: number; // milliseconds
    maxDelay: number; // milliseconds
    jitterFactor: number; // 0-1, amount of randomness
    onRetry?: (attempt: number, delay: number, error: Error) => void;
    shouldRetry?: (error: Error) => boolean;
}

export interface BackoffMetrics {
    totalAttempts: number;
    successfulRetries: number;
    failedRetries: number;
    totalDelay: number;
    lastError?: Error;
}

export class ExponentialBackoff {
    private static readonly DEFAULT_CONFIG: BackoffConfig = {
        maxRetries: 5,
        baseDelay: 1000, // 1 second
        maxDelay: 16000, // 16 seconds
        jitterFactor: 0.3, // 30% jitter
        shouldRetry: (error: Error) => {
            // Retry on network errors, timeouts, 5xx errors
            const retryableErrors = [
                'ECONNREFUSED',
                'ETIMEDOUT',
                'ENOTFOUND',
                'ENETUNREACH',
                'NetworkError',
                'TimeoutError'
            ];
            
            return retryableErrors.some(msg => 
                error.message.includes(msg) || 
                error.name.includes(msg)
            );
        }
    };

    private config: BackoffConfig;
    private metrics: BackoffMetrics;

    constructor(config?: Partial<BackoffConfig>) {
        this.config = { ...ExponentialBackoff.DEFAULT_CONFIG, ...config };
        this.metrics = {
            totalAttempts: 0,
            successfulRetries: 0,
            failedRetries: 0,
            totalDelay: 0
        };
    }

    /**
     * Ejecuta una operación con exponential backoff
     */
    async execute<T>(
        operation: () => Promise<T>,
        context: string = 'unknown'
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            this.metrics.totalAttempts++;

            try {
                // Intentar la operación
                const result = await operation();

                // Éxito
                if (attempt > 0) {
                    this.metrics.successfulRetries++;
                    ProductionLogger.info(
                        'ExponentialBackoff',
                        `Operation succeeded after ${attempt} retries`,
                        { context, attempt, totalDelay: this.metrics.totalDelay }
                    );

                    // Record retry success metric
                    metricsCollector.recordMetric({
                        category: MetricCategory.RETRY,
                        operation: context,
                        status: 'success',
                        value: attempt,
                        metadata: {
                            totalDelay: this.metrics.totalDelay
                        }
                    });
                }

                return result;

            } catch (error) {
                lastError = error as Error;
                this.metrics.lastError = lastError;

                // Verificar si debemos reintentar
                const shouldRetry = this.config.shouldRetry?.(lastError) ?? true;
                const isLastAttempt = attempt === this.config.maxRetries;

                if (!shouldRetry || isLastAttempt) {
                    this.metrics.failedRetries++;
                    
                    ProductionLogger.error(
                        'ExponentialBackoff',
                        `Operation failed after ${attempt + 1} attempts`,
                        lastError,
                        { 
                            context, 
                            totalAttempts: attempt + 1,
                            totalDelay: this.metrics.totalDelay,
                            shouldRetry,
                            isLastAttempt
                        }
                    );

                    // Record retry failure metric
                    metricsCollector.recordMetric({
                        category: MetricCategory.RETRY,
                        operation: context,
                        status: 'failure',
                        value: attempt + 1,
                        metadata: {
                            totalDelay: this.metrics.totalDelay,
                            error: lastError.message
                        }
                    });

                    throw lastError;
                }

                // Calcular delay con exponential backoff y jitter
                const delay = this.calculateDelay(attempt);
                this.metrics.totalDelay += delay;

                // Callback de retry
                this.config.onRetry?.(attempt + 1, delay, lastError);

                ProductionLogger.warn(
                    'ExponentialBackoff',
                    `Retrying operation after ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`,
                    { 
                        context, 
                        attempt: attempt + 1,
                        delay,
                        error: lastError.message
                    }
                );

                // Esperar antes de reintentar
                await this.sleep(delay);
            }
        }

        // No debería llegar aquí, pero por si acaso
        throw lastError || new Error('Operation failed with unknown error');
    }

    /**
     * Calcula el delay con exponential backoff y jitter
     */
    private calculateDelay(attempt: number): number {
        // Exponential: baseDelay * 2^attempt
        const exponentialDelay = this.config.baseDelay * Math.pow(2, attempt);
        
        // Cap al máximo
        const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);
        
        // Agregar jitter aleatorio
        const jitter = cappedDelay * this.config.jitterFactor * (Math.random() - 0.5) * 2;
        const finalDelay = Math.max(0, cappedDelay + jitter);
        
        return Math.round(finalDelay);
    }

    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtener métricas
     */
    getMetrics(): Readonly<BackoffMetrics> {
        return { ...this.metrics };
    }

    /**
     * Resetear métricas
     */
    resetMetrics(): void {
        this.metrics = {
            totalAttempts: 0,
            successfulRetries: 0,
            failedRetries: 0,
            totalDelay: 0
        };
    }

    /**
     * Helper estático para uso rápido
     */
    static async retry<T>(
        operation: () => Promise<T>,
        config?: Partial<BackoffConfig>
    ): Promise<T> {
        const backoff = new ExponentialBackoff(config);
        return backoff.execute(operation);
    }
}

/**
 * Decorador para agregar exponential backoff a métodos
 */
export function withBackoff(config?: Partial<BackoffConfig>) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const backoff = new ExponentialBackoff(config);
            return backoff.execute(
                () => originalMethod.apply(this, args),
                `${target.constructor.name}.${propertyKey}`
            );
        };

        return descriptor;
    };
}

/**
 * Wrapper funcional para agregar backoff a funciones
 */
export function withBackoffWrapper<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config?: Partial<BackoffConfig>
): T {
    return (async (...args: any[]) => {
        const backoff = new ExponentialBackoff(config);
        return backoff.execute(
            () => fn(...args),
            fn.name || 'anonymous'
        );
    }) as T;
}
