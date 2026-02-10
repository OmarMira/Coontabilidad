import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle, Info, AlertTriangle, Bug, 
  Filter, RefreshCw, Eye, EyeOff, Download, Trash2,
  Clock, User, Database, Shield, Activity
} from 'lucide-react';
import { logger, SystemLog, LogLevel, ErrorStats } from '../core/logging/SystemLogger';

export function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [filter, setFilter] = useState({
    level: 'ALL' as LogLevel | 'ALL',
    module: 'ALL',
    resolved: 'ALL',
    limit: 50
  });
  const [loading, setLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filterParams: any = {};
      if (filter.level !== 'ALL') filterParams.level = filter.level;
      if (filter.module !== 'ALL') filterParams.module = filter.module;
      if (filter.resolved !== 'ALL') filterParams.resolved = filter.resolved === 'RESOLVED';
      filterParams.limit = filter.limit;

      const [logsData, statsData] = await Promise.all([
        logger.getLogs(filterParams),
        logger.getErrorStats()
      ]);

      setLogs(logsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load logs:', error);
      logger.error('SystemLogs', 'load_failed', 'Error al cargar logs del sistema', null, error as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 30000); // Actualizar cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [filter, autoRefresh]);

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'CRITICAL': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'ERROR': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'WARN': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'INFO': return <Info className="h-4 w-4 text-blue-500" />;
      case 'DEBUG': return <Bug className="h-4 w-4 text-gray-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'ERROR': return 'bg-red-500 text-white';
      case 'WARN': return 'bg-yellow-500 text-white';
      case 'INFO': return 'bg-blue-500 text-white';
      case 'DEBUG': return 'bg-gray-500 text-white';
      default: return 'bg-gray-200';
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'Database': return <Database className="h-4 w-4" />;
      case 'CustomerModule': 
      case 'InvoiceModule': 
      case 'BillModule': 
      case 'SupplierModule': return <Activity className="h-4 w-4" />;
      case 'SystemLogger': return <Shield className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const markAsResolved = async (logId: number) => {
    try {
      const success = await logger.markAsResolved(logId, 1);
      if (success) {
        loadLogs();
        logger.info('SystemLogs', 'mark_resolved', `Log ${logId} marcado como resuelto por usuario`);
      }
    } catch (error) {
      console.error('Failed to mark log as resolved:', error);
      logger.error('SystemLogs', 'mark_resolved_failed', 'Error al marcar log como resuelto', { logId }, error as Error);
    }
  };

  const exportLogs = () => {
    try {
      const csv = [
        ['ID', 'Timestamp', 'Level', 'Module', 'Action', 'Message', 'Resolved'],
        ...logs.map(log => [
          log.id,
          log.timestamp,
          log.level,
          log.module,
          log.action,
          log.message.replace(/,/g, ';'), // Escapar comas
          log.resolved ? 'Yes' : 'No'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      logger.info('SystemLogs', 'export_success', `Logs exportados: ${logs.length} registros`);
    } catch (error) {
      console.error('Failed to export logs:', error);
      logger.error('SystemLogs', 'export_failed', 'Error al exportar logs', null, error as Error);
    }
  };

  const clearOldLogs = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar los logs resueltos de más de 30 días?')) {
      return;
    }

    try {
      const deletedCount = await logger.clearOldLogs(30);
      loadLogs();
      logger.info('SystemLogs', 'cleanup_success', `Limpieza completada: ${deletedCount} logs eliminados`);
    } catch (error) {
      console.error('Failed to clear old logs:', error);
      logger.error('SystemLogs', 'cleanup_failed', 'Error al limpiar logs antiguos', null, error as Error);
    }
  };

  const getUniqueModules = () => {
    const modules = new Set(logs.map(log => log.module));
    return Array.from(modules).sort();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sistema de Logs</h1>
          <p className="text-gray-400">Monitoreo y diagnóstico del sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span>Auto-actualizar</span>
          </label>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Estadísticas del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div>
                  <div className="text-2xl font-bold text-red-400">{stats.totalErrors}</div>
                  <div className="text-sm text-red-300">Errores Totales</div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div>
                  <div className="text-2xl font-bold text-yellow-400">{stats.unresolved}</div>
                  <div className="text-sm text-yellow-300">Sin Resolver</div>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-900/20 border border-orange-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-400" />
                <div>
                  <div className="text-2xl font-bold text-orange-400">{stats.last24Hours}</div>
                  <div className="text-sm text-orange-300">Últimas 24h</div>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-900/20 border border-purple-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-purple-400">{stats.criticalCount}</div>
                  <div className="text-sm text-purple-300">Críticos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Errores por módulo */}
          {Object.keys(stats.byModule).length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-white mb-3">Errores por Módulo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(stats.byModule).map(([module, count]) => (
                  <div key={module} className="bg-gray-700 p-2 rounded text-center">
                    <div className="text-lg font-bold text-white">{count}</div>
                    <div className="text-xs text-gray-300">{module}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nivel</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
              value={filter.level}
              onChange={(e) => setFilter({...filter, level: e.target.value as LogLevel | 'ALL'})}
            >
              <option value="ALL">Todos</option>
              <option value="CRITICAL">Crítico</option>
              <option value="ERROR">Error</option>
              <option value="WARN">Advertencia</option>
              <option value="INFO">Info</option>
              <option value="DEBUG">Debug</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Módulo</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
              value={filter.module}
              onChange={(e) => setFilter({...filter, module: e.target.value})}
            >
              <option value="ALL">Todos</option>
              {getUniqueModules().map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
              value={filter.resolved}
              onChange={(e) => setFilter({...filter, resolved: e.target.value})}
            >
              <option value="ALL">Todos</option>
              <option value="UNRESOLVED">Sin Resolver</option>
              <option value="RESOLVED">Resueltos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Límite</label>
            <select
              className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-2 text-sm"
              value={filter.limit}
              onChange={(e) => setFilter({...filter, limit: parseInt(e.target.value)})}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          <div className="flex space-x-2 mt-6">
            <button
              onClick={loadLogs}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            <button
              onClick={exportLogs}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>

            <button
              onClick={clearOldLogs}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="bg-gray-800 rounded-lg">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            Registros del Sistema ({logs.length})
          </h2>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              Cargando registros...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay registros que coincidan con los filtros
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    log.level === 'CRITICAL' ? 'border-red-500 bg-red-900/10' :
                    log.level === 'ERROR' ? 'border-red-400 bg-red-900/5' :
                    log.level === 'WARN' ? 'border-yellow-400 bg-yellow-900/5' :
                    'border-gray-600 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getLevelIcon(log.level)}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        {getModuleIcon(log.module)}
                        <span>{log.module}</span>
                        <span>•</span>
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                      {log.resolved && (
                        <span className="px-2 py-1 bg-green-900/20 border border-green-700 text-green-300 rounded text-xs flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Resuelto</span>
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {!log.resolved && (log.level === 'ERROR' || log.level === 'CRITICAL') && (
                        <button
                          onClick={() => markAsResolved(log.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Resolver
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        {expandedLog === log.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="font-medium text-white">
                      {log.action}
                    </div>
                    <div className="text-gray-300 mt-1">{log.message}</div>
                  </div>

                  {expandedLog === log.id && (
                    <div className="mt-4 space-y-3 border-t border-gray-600 pt-3">
                      {log.data && (
                        <div>
                          <div className="text-sm font-medium text-gray-300 mb-1">Datos:</div>
                          <pre className="text-xs bg-gray-900 p-3 rounded overflow-x-auto text-gray-300 border border-gray-600">
                            {log.data}
                          </pre>
                        </div>
                      )}

                      {log.stack_trace && (
                        <div>
                          <div className="text-sm font-medium text-gray-300 mb-1">Stack Trace:</div>
                          <pre className="text-xs bg-red-900/20 border border-red-700 p-3 rounded overflow-x-auto text-red-200">
                            {log.stack_trace}
                          </pre>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 flex items-center space-x-4">
                        <span>ID: {log.id}</span>
                        <span>Usuario: {log.user_id}</span>
                        {log.session_id && <span>Sesión: {log.session_id.slice(-8)}</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}