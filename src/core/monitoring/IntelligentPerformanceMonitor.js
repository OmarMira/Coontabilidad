/**
 * MONITOR DE PERFORMANCE INTELIGENTE
 * 
 * Monitoreo en tiempo real con alertas automáticas
 */

export class IntelligentPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      queryTime: 1000, // 1 segundo
      memoryUsage: 100 * 1024 * 1024, // 100MB
      errorRate: 0.05 // 5%
    };
    this.startMonitoring();
  }
  
  // Iniciar monitoreo
  startMonitoring() {
    // Monitorear performance de consultas
    this.monitorQueries();
    
    // Monitorear uso de memoria
    this.monitorMemory();
    
    // Monitorear errores
    this.monitorErrors();
    
    // Reporte periódico
    setInterval(() => {
      this.generateReport();
    }, 60000); // Cada minuto
  }
  
  // Monitorear consultas SQL
  monitorQueries() {
    const originalExec = window.db?.exec;
    if (!originalExec) return;
    
    window.db.exec = (...args) => {
      const startTime = performance.now();
      
      try {
        const result = originalExec.apply(window.db, args);
        const duration = performance.now() - startTime;
        
        this.recordMetric('query_time', duration);
        
        if (duration > this.thresholds.queryTime) {
          console.warn(`⚠️  Slow query detected: ${duration.toFixed(2)}ms`, args[0]);
        }
        
        return result;
      } catch (error) {
        this.recordMetric('query_error', 1);
        throw error;
      }
    };
  }
  
  // Monitorear uso de memoria
  monitorMemory() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize);
        this.recordMetric('memory_total', memory.totalJSHeapSize);
        
        if (memory.usedJSHeapSize > this.thresholds.memoryUsage) {
          console.warn(`⚠️  High memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        }
      }, 10000); // Cada 10 segundos
    }
  }
  
  // Monitorear errores
  monitorErrors() {
    window.addEventListener('error', (event) => {
      this.recordMetric('js_error', 1);
      console.error('🚨 JavaScript Error:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.recordMetric('promise_rejection', 1);
      console.error('🚨 Unhandled Promise Rejection:', event.reason);
    });
  }
  
  // Registrar métrica
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metric = this.metrics.get(name);
    metric.push({
      value,
      timestamp: Date.now()
    });
    
    // Mantener solo últimos 1000 registros
    if (metric.length > 1000) {
      metric.shift();
    }
  }
  
  // Obtener estadísticas de métrica
  getMetricStats(name) {
    const metric = this.metrics.get(name);
    if (!metric || metric.length === 0) return null;
    
    const values = metric.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, min, max, count: values.length };
  }
  
  // Generar reporte de performance
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };
    
    for (const [name] of this.metrics) {
      report.metrics[name] = this.getMetricStats(name);
    }
    
    // Detectar anomalías
    const anomalies = this.detectAnomalies();
    if (anomalies.length > 0) {
      report.anomalies = anomalies;
      console.warn('🚨 Performance anomalies detected:', anomalies);
    }
    
    // Guardar reporte
    this.saveReport(report);
  }
  
  // Detectar anomalías
  detectAnomalies() {
    const anomalies = [];
    
    // Verificar tiempo de consultas
    const queryStats = this.getMetricStats('query_time');
    if (queryStats && queryStats.avg > this.thresholds.queryTime) {
      anomalies.push({
        type: 'slow_queries',
        value: queryStats.avg,
        threshold: this.thresholds.queryTime
      });
    }
    
    // Verificar uso de memoria
    const memoryStats = this.getMetricStats('memory_used');
    if (memoryStats && memoryStats.max > this.thresholds.memoryUsage) {
      anomalies.push({
        type: 'high_memory',
        value: memoryStats.max,
        threshold: this.thresholds.memoryUsage
      });
    }
    
    return anomalies;
  }
  
  // Guardar reporte
  async saveReport(report) {
    try {
      const reports = JSON.parse(localStorage.getItem('performance_reports') || '[]');
      reports.push(report);
      
      // Mantener solo últimos 100 reportes
      if (reports.length > 100) {
        reports.shift();
      }
      
      localStorage.setItem('performance_reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Failed to save performance report:', error);
    }
  }
}

export const performanceMonitor = new IntelligentPerformanceMonitor();
