import React, { useState } from 'react';
import { runSystemAudit, generateAuditReportHTML, SystemAuditReport, AuditResult } from '../../utils/systemAudit';
import { AlertCircle, CheckCircle, AlertTriangle, Download, Play, Search, Activity, ShieldCheck, Database, FileText, ChevronRight, Loader2, Gauge } from 'lucide-react';

export const SystemAudit: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<SystemAuditReport | null>(null);

  const handleRunAudit = async () => {
    setIsRunning(true);
    try {
      const auditReport = await runSystemAudit();
      setReport(auditReport);
    } catch (error) {
      console.error('Error running audit:', error);
      alert('Error ejecutando auditoría. Ver consola para detalles.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;

    const html = generateAuditReportHTML(report);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-audit-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'fail':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'bg-emerald-900/10 border-emerald-500/20';
      case 'warning':
        return 'bg-orange-900/10 border-orange-500/20';
      case 'fail':
        return 'bg-red-900/10 border-red-500/20';
    }
  };

  const getSeverityBadge = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    const colors = {
      critical: 'bg-red-500 text-white font-black',
      high: 'bg-orange-600 text-white font-black',
      medium: 'bg-yellow-500 text-black font-black',
      low: 'bg-slate-800 text-slate-400 font-black'
    };

    return (
      <span className={`px-2 py-0.5 text-[9px] uppercase tracking-widest rounded ${colors[severity]}`}>
        {severity}
      </span>
    );
  };

  const groupResultsByCategory = (results: AuditResult[]) => {
    const grouped: Record<string, AuditResult[]> = {};
    results.forEach(result => {
      if (!grouped[result.category]) {
        grouped[result.category] = [];
      }
      grouped[result.category].push(result);
    });
    return grouped;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <ShieldCheck className="w-10 h-10 text-blue-500" />
            </div>
            Auditoría de Integridad
          </h1>
          <p className="text-slate-400 font-bold ml-1 text-sm max-w-2xl leading-relaxed">
            Diagnóstico exhaustivo de la base de datos, integridad de foreign keys, balances contables y seguridad criptográfica.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleRunAudit}
            disabled={isRunning}
            className="group flex items-center justify-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-xl shadow-xl shadow-blue-900/20 transition-all active:scale-95"
          >
            {isRunning ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            {isRunning ? 'ESCANEANDO SISTEMA...' : 'EJECUTAR AUDITORÍA'}
          </button>

          {report && (
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl border border-slate-700 transition-all active:scale-95 group"
            >
              <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
              REPORTE HTML
            </button>
          )}
        </div>
      </div>

      {isRunning && (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800/50 p-12 flex flex-col items-center justify-center text-center animate-pulse">
          <div className="relative">
            <Search className="w-20 h-20 text-blue-500/20 mb-6" />
            <Activity className="w-10 h-10 text-blue-500 absolute top-5 left-5" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Escaneando Infraestructura</h3>
          <p className="text-slate-500 font-bold max-w-xs uppercase text-[10px] tracking-widest">
            Analizando tablas, transacciones, activos y cadenas de auditoría inmutables...
          </p>
        </div>
      )}

      {/* Audit Report Results */}
      {report && !isRunning && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
          {/* Executive Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:bg-slate-900 transition-colors">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total de Pruebas</div>
              <div className="text-4xl font-black text-white tabular-nums">{report.totalChecks}</div>
              <div className="mt-4 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-full" />
              </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:bg-slate-900 transition-colors">
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Integridad OK</div>
              <div className="text-4xl font-black text-emerald-400 tabular-nums">{report.passed}</div>
              <div className="mt-4 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${(report.passed / report.totalChecks) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:bg-slate-900 transition-colors">
              <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4">Advertencias</div>
              <div className="text-4xl font-black text-orange-400 tabular-nums">{report.warnings}</div>
              <div className="mt-4 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full" style={{ width: `${(report.warnings / report.totalChecks) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:bg-slate-900 transition-colors">
              <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Fallos Críticos</div>
              <div className="text-4xl font-black text-red-400 tabular-nums">{report.failed}</div>
              <div className="mt-4 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: `${(report.failed / report.totalChecks) * 100}%` }} />
              </div>
            </div>
          </div>

          {/* Overall Health Status Bar */}
          <div className={`p-6 rounded-2xl border-l-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all bg-slate-900/80 ${report.overallStatus === 'pass' ? 'border-emerald-500' : report.overallStatus === 'warning' ? 'border-orange-500' : 'border-red-500'
            }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${report.overallStatus === 'pass' ? 'bg-emerald-500/10' : report.overallStatus === 'warning' ? 'bg-orange-500/10' : 'bg-red-500/10'
                }`}>
                <Gauge className={`w-8 h-8 ${report.overallStatus === 'pass' ? 'text-emerald-500' : report.overallStatus === 'warning' ? 'text-orange-500' : 'text-red-500'
                  }`} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Sanitario Global</p>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                  SISTEMA {report.overallStatus === 'pass' ? 'ÍNTEGRO' : report.overallStatus === 'warning' ? 'CON OBSERVACIONES' : ' COMPROMETIDO'}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Reporte ID: AUD-{new Date().getTime().toString().slice(-6)}</p>
              <p className="text-xs font-bold text-slate-600 mt-1">Sello de Auditoría: {new Date(report.timestamp).toLocaleString()}</p>
            </div>
          </div>

          {/* Critical Issues Highlight */}
          {report.results.filter(r => r.severity === 'critical' && r.status === 'fail').length > 0 && (
            <div className="space-y-4">
              <h2 className="text-[10px] font-black text-red-500 uppercase tracking-widest px-2">PROBLEMAS QUE REQUIEREN ACCIÓN INMEDIATA</h2>
              <div className="grid grid-cols-1 gap-4">
                {report.results
                  .filter(r => r.severity === 'critical' && r.status === 'fail')
                  .map((result, index) => (
                    <div key={index} className={`border-2 rounded-2xl p-6 transition-all hover:bg-red-900/5 ${getStatusColor(result.status)} shadow-lg shadow-red-950/20`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-red-500/20 rounded-lg shrink-0">{getStatusIcon(result.status)}</div>
                          <div className="flex-1 space-y-2">
                            <div className="text-lg font-black text-white tracking-tight leading-none">{result.category}</div>
                            <div className="text-sm font-bold text-red-200/70">{result.message}</div>
                            {result.details && (
                              <details className="mt-4 group/details">
                                <summary className="text-[9px] font-black text-red-500/50 uppercase tracking-widest cursor-pointer hover:text-red-400 transition-colors list-none flex items-center gap-2">
                                  CONSOLA TÉCNICA (BREAKDOWN)
                                  <ChevronRight className="w-3 h-3 group-open/details:rotate-90 transition-transform" />
                                </summary>
                                <div className="mt-3 p-4 bg-slate-950/80 rounded-xl border border-red-500/20">
                                  <pre className="text-xs font-mono text-red-400 font-bold overflow-x-auto">
                                    {JSON.stringify(result.details, null, 2)}
                                  </pre>
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                        {getSeverityBadge(result.severity)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Results by Category - Modern Accordion */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">INFORME DETALLADO POR SUBSISTEMA</h2>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(groupResultsByCategory(report.results)).map(([category, results]) => (
                <details key={category} className="group/category bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all">
                  <summary className="p-5 cursor-pointer flex items-center justify-between list-none">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        {category.includes('Database') ? <Database className="w-5 h-5 text-blue-500" /> : <FileText className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white tracking-tight">{category}</h3>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{results.length} Verificaciones ejecutadas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs font-black text-white">{results.filter(r => r.status === 'pass').length} / {results.length}</span>
                        <div className="w-24 bg-slate-950 h-1 rounded-full mt-1 overflow-hidden">
                          <div className="bg-blue-600 h-full" style={{ width: `${(results.filter(r => r.status === 'pass').length / results.length) * 100}%` }} />
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-700 group-open/category:rotate-90 transition-transform" />
                    </div>
                  </summary>
                  <div className="px-5 pb-5 pt-2 grid grid-cols-1 gap-2.5 bg-slate-950/20">
                    {results.map((result, index) => (
                      <div key={index} className={`border p-4 rounded-xl transition-all hover:bg-slate-900/50 ${getStatusColor(result.status)}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-4 flex-1">
                            {getStatusIcon(result.status)}
                            <div className="flex-1">
                              <div className="text-sm font-bold text-slate-200">{result.message}</div>
                              {result.details && (
                                <details className="mt-3 group/item">
                                  <summary className="text-[9px] font-black text-slate-600 uppercase tracking-widest cursor-pointer hover:text-white transition-colors list-none flex items-center gap-2">
                                    Detalles Data
                                    <ChevronRight className="w-3 h-3 group-open/item:rotate-90 transition-transform" />
                                  </summary>
                                  <pre className="mt-2 p-3 bg-slate-950 rounded-xl text-[10px] font-mono text-slate-400 overflow-x-auto border border-slate-800/50">
                                    {JSON.stringify(result.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                          {getSeverityBadge(result.severity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero Initial State */}
      {!report && !isRunning && (
        <div className="bg-slate-900/40 rounded-3xl border border-slate-800/50 p-16 text-center border-dashed relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid-slate-800/[0.05] -z-10" />
          <div className="relative z-10">
            <div className="w-24 h-24 bg-blue-600/10 rounded-3xl border border-blue-500/20 flex items-center justify-center mx-auto mb-8 animate-bounce transition-transform group-hover:scale-110">
              <ShieldCheck className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">Verificación de Integridad Industrial</h3>
            <p className="text-slate-500 font-bold mb-10 max-w-xl mx-auto uppercase text-xs tracking-[0.2em] leading-relaxed">
              Inicia el motor de auditoría para validar la salud estructural, contable y fiscal de AccountExpress Next-Gen.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left max-w-4xl mx-auto">
              {[
                { label: 'Blockchain Auditing', icon: <Database className="w-4 h-4" /> },
                { label: 'Double Entry Integrity', icon: <Gauge className="w-4 h-4" /> },
                { label: 'Fixed Assets Lifecycle', icon: <Activity className="w-4 h-4" /> },
                { label: 'Fiscal Compliance', icon: <ShieldCheck className="w-4 h-4" /> }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-slate-950/40 rounded-xl border border-slate-800/50">
                  <div className="text-blue-500 shrink-0">{item.icon}</div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
