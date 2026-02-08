import React from 'react';
import { Download, CheckCircle, AlertTriangle, AlertCircle, FileText, ChevronRight, User, Calendar, DollarSign, TrendingUp, Activity, X } from 'lucide-react';
import { AccountingPeriod } from '../../services/accounting/AccountingPeriodService';
import { ValidationResult } from './ClosureChecklist';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ClosureReportData {
  period: AccountingPeriod;
  validationResults: ValidationResult[];
  summary: {
    totalTransactions: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    totalDebit: number;
    totalCredit: number;
  };
  closedBy: string;
  closedAt: string;
}

interface ClosureReportProps {
  data: ClosureReportData;
  onDownloadPDF: () => void;
  onClose: () => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ClosureReport({
  data,
  onDownloadPDF,
  onClose
}: ClosureReportProps) {
  const { period, validationResults, summary, closedBy, closedAt } = data;

  // Calcular totales de validaciones
  const totalChecks = validationResults.reduce((sum, result) => sum + result.checks.length, 0);
  const passedChecks = validationResults.reduce(
    (sum, result) => sum + result.checks.filter(c => c.status === 'passed').length,
    0
  );
  const warningChecks = validationResults.reduce(
    (sum, result) => sum + result.checks.filter(c => c.status === 'warning').length,
    0
  );
  const errorChecks = validationResults.reduce(
    (sum, result) => sum + result.checks.filter(c => c.status === 'error').length,
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStepName = (stepId: number): string => {
    const names: Record<number, string> = {
      1: 'Validación de Transacciones',
      2: 'Conciliación Bancaria',
      3: 'Ajustes Contables',
      4: 'Balance de Comprobación',
      5: 'Confirmación'
    };
    return names[stepId] || `Paso ${stepId}`;
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-5xl mx-auto border border-slate-800 overflow-hidden animate-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="bg-slate-950/80 p-8 border-b border-slate-800 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Reporte de Cierre</h2>
          </div>
          <p className="text-slate-500 font-bold ml-11 uppercase tracking-widest text-xs italic">{period.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onDownloadPDF}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 group"
          >
            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            Reporte PDF
          </button>
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
        {/* Información General Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-950/30 rounded-2xl p-6 border border-slate-800/50 space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Detalles del Período
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Estado</p>
                <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle className="w-3 h-3" />
                  CERRADO Y BLOQUEADO
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Tipo</p>
                <p className="text-sm font-black text-white capitalize">{period.period_type === 'monthly' ? 'Mensual' : period.period_type}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Rango de Fechas</p>
                <p className="text-sm font-black text-white">{formatDate(period.start_date)} - {formatDate(period.end_date)}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/30 rounded-2xl p-6 border border-slate-800/50 space-y-4">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4 text-purple-500" />
              Auditoría de Cierre
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Ejecutado por</p>
                <p className="text-sm font-black text-white">{closedBy || 'Administrador Técnico'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sello de Tiempo</p>
                <p className="text-sm font-black text-slate-400 italic">{closedAt ? formatDate(closedAt) : formatDate(new Date().toISOString())}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Resumen Financiero High Impact */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">INDICADORES FINANCIEROS CLAVE (KPIs)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl group hover:border-blue-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Ingresos Totales</p>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-white tabular-nums">
                {formatCurrency(summary.totalRevenue)}
              </p>
              <div className="mt-3 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-full" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl group hover:border-red-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Gastos Totales</p>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-black text-white tabular-nums">
                {formatCurrency(summary.totalExpenses)}
              </p>
              <div className="mt-3 w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: `${(summary.totalExpenses / summary.totalRevenue) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-emerald-500/20 p-6 rounded-2xl shadow-xl group hover:bg-emerald-500/5 transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Utilidad Neta</p>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-black text-emerald-400 tabular-nums">
                {formatCurrency(summary.netIncome)}
              </p>
              <p className="text-[9px] font-black text-emerald-500/50 mt-2 uppercase">Margen: {((summary.netIncome / summary.totalRevenue) * 100).toFixed(1)}%</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Volumen Trans.</p>
                <Activity className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-2xl font-black text-white tabular-nums">
                {summary.totalTransactions}
              </p>
              <p className="text-[9px] font-black text-slate-600 mt-2 uppercase">Asientos Contables</p>
            </div>
          </div>
        </section>

        {/* Balance de Comprobación Summary */}
        <section className="bg-slate-950/50 rounded-2xl border border-slate-800 p-8 shadow-inner">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 text-center">VERIFICACIÓN PARTIDA DOBLE</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-center space-y-1">
              <p className="text-[9px] font-black text-slate-600 uppercase">Total Débitos</p>
              <p className="text-2xl font-black text-white font-mono">
                {formatCurrency(summary.totalDebit)}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${Math.abs(summary.totalDebit - summary.totalCredit) < 0.01
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-900/20'
                  : 'bg-red-500/10 border-red-500 text-red-500'
                }`}>
                {Math.abs(summary.totalDebit - summary.totalCredit) < 0.01 ? <CheckCircle className="w-6 h-6" /> : <X className="w-6 h-6" />}
              </div>
              <div className="h-0.5 w-16 bg-slate-800 mt-2" />
              <p className={`text-[9px] font-black mt-2 uppercase tracking-tighter ${Math.abs(summary.totalDebit - summary.totalCredit) < 0.01 ? 'text-emerald-500' : 'text-red-500'
                }`}>
                Diferencia: {formatCurrency(Math.abs(summary.totalDebit - summary.totalCredit))}
              </p>
            </div>

            <div className="text-center space-y-1">
              <p className="text-[9px] font-black text-slate-600 uppercase">Total Créditos</p>
              <p className="text-2xl font-black text-white font-mono">
                {formatCurrency(summary.totalCredit)}
              </p>
            </div>
          </div>
        </section>

        {/* Resumen de Validaciones Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AUDIT TRAIL DE CIERRE ({totalChecks} CONTROLES)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase">{passedChecks} OK</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase">{warningChecks} WRN</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {validationResults.map((result) => (
              <div key={result.stepId} className="bg-slate-900/40 rounded-xl border border-slate-800/80 overflow-hidden group hover:border-slate-700 transition-all">
                <div className="px-4 py-3 bg-slate-950/60 flex items-center justify-between border-b border-slate-800/50">
                  <h4 className="text-xs font-black text-white flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${result.status === 'passed' ? 'bg-emerald-500' :
                        result.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                      }`} />
                    {getStepName(result.stepId)}
                  </h4>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${result.status === 'passed' ? 'text-emerald-500 bg-emerald-500/10' :
                      result.status === 'warning' ? 'text-orange-500 bg-orange-500/10' : 'text-red-500 bg-red-500/10'
                    }`}>
                    {result.status === 'passed' ? 'Passed' : result.status}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {result.checks.map((check) => (
                    <div key={check.id} className="flex items-center justify-between gap-3 group/item">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {check.status === 'passed' ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500/50 group-hover/item:text-emerald-500 transition-colors" />
                        ) : check.status === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="text-xs font-bold text-slate-400 group-hover/item:text-slate-200 transition-colors truncate">{check.label}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-800 group-hover/item:text-slate-600" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Notas Section */}
        {period.notes && (
          <section className="bg-slate-950/20 rounded-xl p-6 border border-slate-800/30 italic">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Observaciones Adicionales</h3>
            <p className="text-sm font-bold text-slate-400 leading-relaxed">"{period.notes}"</p>
          </section>
        )}
      </div>

      {/* Action Footer */}
      <div className="bg-slate-950/80 px-8 py-6 flex items-center justify-between border-t border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
          <Activity className="w-3 h-3" />
          Reporte ID: CLR-{period.id}-{new Date().getTime().toString().slice(-6)}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest transition-colors"
          >
            Cerrar Dashboard
          </button>
          <button
            onClick={onDownloadPDF}
            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            DESCARGAR PDF
          </button>
        </div>
      </div>
    </div>
  );
}
