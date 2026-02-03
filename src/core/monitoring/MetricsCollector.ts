/**
 * MetricsCollector - NASA-Level System Monitoring
 * 
 * Recolecta y analiza métricas de operaciones críticas:
 * - Backups (éxito/fallo, duración, tamaño)
 * - Timestamps RFC 3161 (éxito/fallo, latencia)
 * - Exponential Backoff (reintentos, delays)
 * - Errores del sistema
 * 
 * Detecta anomalías y genera alertas automáticas.
 */

import { ProductionLogger } from '../logging/ProductionLogger';

export interface Metric {
    timestamp: Date;
    category: MetricCategory;
    operation: string;
    status: 'success' | 'failure' | 'warning';
    duration?: number; // milliseconds
    value?: number;
    metadata?: Record<string, any>;
}

export enum MetricCategory {
    BACKUP = 'backup',
    TIMESTAMP = 'timestamp',
    RETRY = 'retry',
    ERROR = 'error',
    PERFORMANCE = 'performance',
    SECURITY = 'security'
}

export interface MetricsSummary {
    category: MetricCategory;
    totalOperations: number;
    successCount: number;
    failureCount: number;
    warningCount: number;
    successRate: number;
    averageDuration?: number;
    lastOperation?: Date;
}

export interface Alert {
    id: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: MetricCategory;
    message: string;
    metrics: Metric[];
    acknowledged: boolean;
}

export interface AnomalyDetection {
    detected: boolean;
    type: 'high_failure_rate' | 'slow_performance' | 'excessive_retries' | 'security_breach';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    affectedMetrics: Metric[];
}

export class MetricsCollector {
    private metrics: Metric[] = [];
    private alerts: Alert[] = [];
    private readonly MAX_METRICS = 10000; // Keep last 10k metrics
    private readonly MAX_ALERTS = 1000;
    
    // Thresholds for anomaly detection
    private readonly FAILURE_RATE_THRESHOLD = 0.5; // 50%
    private readonly SLOW_OPERATION_THRESHOLD = 30000; // 30 seconds
    private readonly EXCESSIVE_RETRIES_THRESHOLD = 3;
    
    private static instance: MetricsCollector;

    private constructor() {
        // Singleton
    }

    static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    /**
     * Registrar métrica
     */
    recordMetric(metric: Omit<Metric, 'timestamp'>): void {
        const fullMetric: Metric = {
            ...metric,
            timestamp: new Date()
        };

        this.metrics.push(fullMetric);

        // Mantener solo las últimas MAX_METRICS
        if (this.metrics.length > this.MAX_METRICS) {
            this.metrics.shift();
        }

        // Log según status
        if (fullMetric.status === 'failure') {
            ProductionLogger.error(
                'MetricsCollector',
                `Operation failed: ${fullMetric.operation}`,
                undefined,
                fullMetric.metadata
            );
        } else if (fullMetric.status === 'warning') {
            ProductionLogger.warn(
                'MetricsCollector',
                `Operation warning: ${fullMetric.operation}`,
                fullMetric.metadata
            );
        } else {
            ProductionLogger.debug(
                'MetricsCollector',
                `Operation success: ${fullMetric.operation}`,
                fullMetric.metadata
            );
        }

        // Detectar anomalías
        this.detectAnomalies(fullMetric);
    }

    /**
     * Obtener resumen de métricas por categoría
     */
    getSummary(category?: MetricCategory, timeWindow?: number): MetricsSummary[] {
        const now = Date.now();
        const windowMs = timeWindow || 3600000; // Default: 1 hour

        // Filtrar métricas por ventana de tiempo
        const relevantMetrics = this.metrics.filter(m => {
            const age = now - m.timestamp.getTime();
            const matchesCategory = !category || m.category === category;
            return age <= windowMs && matchesCategory;
        });

        // Agrupar por categoría
        const grouped = new Map<MetricCategory, Metric[]>();
        for (const metric of relevantMetrics) {
            if (!grouped.has(metric.category)) {
                grouped.set(metric.category, []);
            }
            grouped.get(metric.category)!.push(metric);
        }

        // Calcular resúmenes
        const summaries: MetricsSummary[] = [];
        for (const [cat, metrics] of grouped.entries()) {
            const successCount = metrics.filter(m => m.status === 'success').length;
            const failureCount = metrics.filter(m => m.status === 'failure').length;
            const warningCount = metrics.filter(m => m.status === 'warning').length;
            const totalOperations = metrics.length;

            const durations = metrics.filter(m => m.duration !== undefined).map(m => m.duration!);
            const averageDuration = durations.length > 0
                ? durations.reduce((a, b) => a + b, 0) / durations.length
                : undefined;

            const lastOperation = metrics.length > 0
                ? metrics[metrics.length - 1].timestamp
                : undefined;

            summaries.push({
                category: cat,
                totalOperations,
                successCount,
                failureCount,
                warningCount,
                successRate: totalOperations > 0 ? successCount / totalOperations : 0,
                averageDuration,
                lastOperation
            });
        }

        return summaries;
    }

    /**
     * Detectar anomalías
     */
    private detectAnomalies(newMetric: Metric): void {
        const anomalies: AnomalyDetection[] = [];

        // 1. Detectar alta tasa de fallos
        const recentMetrics = this.getRecentMetrics(newMetric.category, 300000); // Last 5 minutes
        if (recentMetrics.length >= 10) {
            const failureRate = recentMetrics.filter(m => m.status === 'failure').length / recentMetrics.length;
            
            if (failureRate > this.FAILURE_RATE_THRESHOLD) {
                anomalies.push({
                    detected: true,
                    type: 'high_failure_rate',
                    severity: failureRate > 0.8 ? 'critical' : 'high',
                    message: `High failure rate detected: ${(failureRate * 100).toFixed(1)}% in ${newMetric.category}`,
                    affectedMetrics: recentMetrics.filter(m => m.status === 'failure')
                });
            }
        }

        // 2. Detectar operaciones lentas
        if (newMetric.duration && newMetric.duration > this.SLOW_OPERATION_THRESHOLD) {
            anomalies.push({
                detected: true,
                type: 'slow_performance',
                severity: newMetric.duration > 60000 ? 'high' : 'medium',
                message: `Slow operation detected: ${newMetric.operation} took ${(newMetric.duration / 1000).toFixed(1)}s`,
                affectedMetrics: [newMetric]
            });
        }

        // 3. Detectar reintentos excesivos
        if (newMetric.category === MetricCategory.RETRY && newMetric.value && newMetric.value > this.EXCESSIVE_RETRIES_THRESHOLD) {
            anomalies.push({
                detected: true,
                type: 'excessive_retries',
                severity: newMetric.value > 5 ? 'high' : 'medium',
                message: `Excessive retries detected: ${newMetric.value} attempts for ${newMetric.operation}`,
                affectedMetrics: [newMetric]
            });
        }

        // Crear alertas para anomalías detectadas
        for (const anomaly of anomalies) {
            this.createAlert(anomaly);
        }
    }

    /**
     * Obtener métricas recientes
     */
    private getRecentMetrics(category: MetricCategory, windowMs: number): Metric[] {
        const now = Date.now();
        return this.metrics.filter(m => {
            const age = now - m.timestamp.getTime();
            return m.category === category && age <= windowMs;
        });
    }

    /**
     * Crear alerta
     */
    private createAlert(anomaly: AnomalyDetection): void {
        const alert: Alert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
            severity: anomaly.severity,
            category: anomaly.affectedMetrics[0]?.category || MetricCategory.ERROR,
            message: anomaly.message,
            metrics: anomaly.affectedMetrics,
            acknowledged: false
        };

        this.alerts.push(alert);

        // Mantener solo las últimas MAX_ALERTS
        if (this.alerts.length > this.MAX_ALERTS) {
            this.alerts.shift();
        }

        // Log según severidad
        if (alert.severity === 'critical') {
            ProductionLogger.critical(
                'MetricsCollector',
                `CRITICAL ALERT: ${alert.message}`,
                undefined,
                { alertId: alert.id, category: alert.category }
            );
        } else if (alert.severity === 'high') {
            ProductionLogger.error(
                'MetricsCollector',
                `HIGH ALERT: ${alert.message}`,
                undefined,
                { alertId: alert.id, category: alert.category }
            );
        } else {
            ProductionLogger.warn(
                'MetricsCollector',
                `ALERT: ${alert.message}`,
                { alertId: alert.id, category: alert.category }
            );
        }
    }

    /**
     * Obtener alertas activas
     */
    getActiveAlerts(severity?: Alert['severity']): Alert[] {
        return this.alerts.filter(a => {
            const matchesSeverity = !severity || a.severity === severity;
            return !a.acknowledged && matchesSeverity;
        });
    }

    /**
     * Reconocer alerta
     */
    acknowledgeAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            ProductionLogger.info('MetricsCollector', `Alert acknowledged: ${alertId}`);
            return true;
        }
        return false;
    }

    /**
     * Obtener todas las métricas
     */
    getAllMetrics(category?: MetricCategory, limit?: number): Metric[] {
        let filtered = category
            ? this.metrics.filter(m => m.category === category)
            : this.metrics;

        if (limit) {
            filtered = filtered.slice(-limit);
        }

        return filtered;
    }

    /**
     * Limpiar métricas antiguas
     */
    clearOldMetrics(olderThanMs: number): number {
        const now = Date.now();
        const initialLength = this.metrics.length;
        
        this.metrics = this.metrics.filter(m => {
            const age = now - m.timestamp.getTime();
            return age <= olderThanMs;
        });

        const removed = initialLength - this.metrics.length;
        ProductionLogger.info('MetricsCollector', `Cleared ${removed} old metrics`);
        return removed;
    }

    /**
     * Exportar métricas para análisis
     */
    exportMetrics(format: 'json' | 'csv' = 'json'): string {
        if (format === 'json') {
            return JSON.stringify({
                exportDate: new Date().toISOString(),
                totalMetrics: this.metrics.length,
                metrics: this.metrics,
                summaries: this.getSummary(),
                activeAlerts: this.getActiveAlerts()
            }, null, 2);
        } else {
            // CSV format
            const headers = ['timestamp', 'category', 'operation', 'status', 'duration', 'value'];
            const rows = this.metrics.map(m => [
                m.timestamp.toISOString(),
                m.category,
                m.operation,
                m.status,
                m.duration || '',
                m.value || ''
            ]);

            return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        }
    }

    /**
     * Resetear todas las métricas (solo para testing)
     */
    reset(): void {
        this.metrics = [];
        this.alerts = [];
        ProductionLogger.warn('MetricsCollector', 'All metrics and alerts have been reset');
    }
}

/**
 * Singleton instance para uso global
 */
export const metricsCollector = MetricsCollector.getInstance();
