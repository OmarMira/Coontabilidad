/**
 * DataHealthPanel - Panel de Monitoreo de Integridad de Datos
 * 
 * Muestra:
 * - Estado de salud de la BD
 * - Últimas reparaciones
 * - Historial de checks
 * - Opciones de reparación manual
 */

import React, { useState, useEffect } from 'react';
import { useLocale } from '../../i18n/useLocale';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Zap,
  Database,
  History,
  Activity,
  Settings
} from 'lucide-react';
import { DataHealthCheckService, HealthCheckReport } from '../../core/data-integrity/DataHealthCheckService';
import { runManualIntegrityCheck } from '../../core/data-integrity';

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'not_checked';

export const DataHealthPanel: React.FC = () => {
  const { t } = useLocale();
  const [status, setStatus] = useState<HealthStatus>('not_checked');
  const [report, setReport] = useState<HealthCheckReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [history, setHistory] = useState<HealthCheckReport[]>([]);

  useEffect(() => {
    loadHealthStatus();
    const interval = setInterval(loadHealthStatus, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadHealthStatus = () => {
    const current = DataHealthCheckService.getCurrentStatus();
    setStatus(current.status);

    const latest = DataHealthCheckService.getLatestReport();
    setReport(latest);

    const hist = DataHealthCheckService.getReportHistory(5);
    setHistory(hist);
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const newReport = await runManualIntegrityCheck();
      setReport(newReport);
      setStatus(newReport.status);
      loadHealthStatus();
    } catch (error) {
      console.error('Error executing health check:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (stat: HealthStatus) => {
    switch (stat) {
      case 'healthy':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-500', label: t('dataHealth.healthy') };
      case 'warning':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-500', label: t('dataHealth.warning') };
      case 'critical':
        return { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-500', label: t('dataHealth.critical') };
      default:
        return { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-500', label: t('dataHealth.notChecked') };
    }
  };

  const statusColor = getStatusColor(status);
  const statusIcon = status === 'healthy' ? <CheckCircle /> : status === 'warning' ? <AlertTriangle /> : status === 'critical' ? <AlertCircle /> : <Database />;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl border ${statusColor.bg} ${statusColor.border}`}>
            <Database className={`w-8 h-8 ${statusColor.text}`} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">{t('dataHealth.title')}</h1>
            <p className="text-slate-500 text-sm mt-1">{t('dataHealth.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={handleManualCheck}
          disabled={isChecking}
          className={`px-6 py-3 rounded-xl font-black flex items-center gap-2 transition ${isChecking
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? t('dataHealth.checking') : t('dataHealth.checkNow')}
        </button>
      </div>

      {/* Estado Card */}
      <div className={`p-8 rounded-3xl border ${statusColor.bg} ${statusColor.border} backdrop-blur`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${statusColor.bg} ${statusColor.border}`}>
              {statusIcon}
            </div>
            <div>
              <p className={`text-2xl font-black ${statusColor.text} uppercase`}>{statusColor.label}</p>
              <p className="text-slate-500 text-sm mt-1">
                {report
                  ? `${t('dataHealth.lastCheck')}: ${new Date(report.timestamp).toLocaleString()}`
                  : t('dataHealth.neverChecked')}
              </p>
            </div>
          </div>

          {report && (
            <div className="text-right">
              <p className="text-3xl font-black text-white">{report.errorCount}</p>
              <p className="text-slate-500 text-xs uppercase font-black">{t('dataHealth.totalErrors')}</p>
            </div>
          )}
        </div>

        {report && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
              <p className="text-2xl font-black text-orange-500">{report.errorCount}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">{t('dataHealth.errors')}</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
              <p className="text-2xl font-black text-amber-500">{report.warningCount}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">{t('dataHealth.warnings')}</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
              <p className="text-2xl font-black text-emerald-500">{report.repairsApplied}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">{t('dataHealth.repairs')}</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
              <p className="text-2xl font-black text-blue-500">{report.averageRepairTime.toFixed(0)}ms</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">{t('dataHealth.avgTime')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-black text-white">{t('dataHealth.recommendations')}</h2>
          </div>
          <ul className="space-y-2">
            {report.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="text-yellow-500 font-black">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error Detalles */}
      {report && report.errorCount > 0 && (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full hover:opacity-75 transition"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-rose-500" />
              <h2 className="text-xl font-black text-white">{t('dataHealth.errorDetails')}</h2>
            </div>
            <span className="text-slate-500">{showDetails ? '▼' : '▶'}</span>
          </button>

          {showDetails && (
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {report.details.errors.map((error, idx) => (
                <div key={idx} className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-black px-2 py-1 rounded ${error.severity === 'critical' ? 'bg-rose-600 text-white' :
                      error.severity === 'high' ? 'bg-orange-600 text-white' :
                        'bg-amber-600 text-white'
                      }`}>
                      {error.severity.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-slate-500">{error.table}</span>
                  </div>
                  <p className="text-sm text-white font-medium">{error.message}</p>
                  {error.suggestion && (
                    <p className="text-xs text-slate-400 mt-2">💡 {error.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Repair History */}
      {history.length > 0 && (
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-black text-white">{t('dataHealth.checkHistory')}</h2>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-64">
            {history.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3">
                  <Activity className={`w-4 h-4 ${h.status === 'healthy' ? 'text-emerald-500' :
                    h.status === 'warning' ? 'text-amber-500' :
                      'text-rose-500'
                    }`} />
                  <div>
                    <p className="text-xs font-black text-white">{new Date(h.timestamp).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">{h.errorCount} {t('dataHealth.errors')}, {h.repairsApplied} {t('dataHealth.repairs')}</p>
                  </div>
                </div>
                <span className={`text-xs font-black px-2 py-1 rounded ${h.status === 'healthy' ? 'bg-emerald-600' :
                  h.status === 'warning' ? 'bg-amber-600' :
                    'bg-rose-600'
                  }`}>
                  {h.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Actions */}
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-black text-white">{t('dataHealth.manualActions')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-sm transition">
            🔧 {t('dataHealth.repairReferences')}
          </button>
          <button className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-sm transition">
            🔗 {t('dataHealth.consolidateDuplicates')}
          </button>
          <button className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-sm transition">
            🧮 {t('dataHealth.recalculateTotals')}
          </button>
          <button className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-black text-sm transition">
            📋 {t('dataHealth.fullReport')}
          </button>
        </div>
      </div>
    </div>
  );
};
