import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Clock, Loader, Activity, ChevronRight } from 'lucide-react';
import { useLocale } from '../../i18n/useLocale';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'passed' | 'warning' | 'error';
  message?: string;
  details?: any;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ValidationResult {
  stepId: number;
  status: 'pending' | 'passed' | 'warning' | 'error';
  checks: ChecklistItem[];
  timestamp: string;
}

interface ClosureChecklistProps {
  periodId: number;
  stepId: number;
  checks: ChecklistItem[];
  autoRun?: boolean;
  onValidationStart?: () => void;
  onValidationComplete?: (result: ValidationResult) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ClosureChecklist({
  periodId,
  stepId,
  checks: initialChecks,
  autoRun = false,
  onValidationStart,
  onValidationComplete
}: ClosureChecklistProps) {
  const { t } = useLocale();
  const [checks, setChecks] = useState<ChecklistItem[]>(initialChecks);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  // Actualizar checks cuando cambian desde el padre
  useEffect(() => {
    setChecks(initialChecks);

    // Si todos los checks tienen estado diferente a pending, marcar como ejecutado
    const allChecked = initialChecks.every(c => c.status !== 'pending');
    if (allChecked) {
      setHasRun(true);
    }
  }, [initialChecks]);

  // Auto-ejecutar validaciones si autoRun está habilitado
  useEffect(() => {
    if (autoRun && !hasRun) {
      handleRunValidations();
    }
  }, [autoRun, hasRun]);

  // ============================================================================
  // FUNCIONES DE VALIDACIÓN
  // ============================================================================

  const handleRunValidations = async () => {
    setIsRunning(true);
    setHasRun(true);

    if (onValidationStart) {
      onValidationStart();
    }

    // Las validaciones reales se ejecutan en los componentes de paso
    const result: ValidationResult = {
      stepId,
      status: determineOverallStatus(checks),
      checks: checks,
      timestamp: new Date().toISOString()
    };

    setIsRunning(false);

    if (onValidationComplete) {
      onValidationComplete(result);
    }
  };

  const determineOverallStatus = (checkList: ChecklistItem[]): 'pending' | 'passed' | 'warning' | 'error' => {
    const hasErrors = checkList.some(c => c.status === 'error');
    const hasWarnings = checkList.some(c => c.status === 'warning');
    const allPassed = checkList.every(c => c.status === 'passed');

    return hasErrors ? 'error' : hasWarnings ? 'warning' : allPassed ? 'passed' : 'pending';
  };

  // ============================================================================
  // FUNCIONES DE UI
  // ============================================================================

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusColor = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'passed':
        return 'bg-emerald-900/10 border-emerald-500/20';
      case 'warning':
        return 'bg-orange-900/10 border-orange-500/20';
      case 'error':
        return 'bg-red-900/10 border-red-500/20';
      case 'pending':
      default:
        return 'bg-slate-900/30 border-slate-800/50';
    }
  };

  const getStatusTextColor = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'passed':
        return 'text-emerald-400';
      case 'warning':
        return 'text-orange-400';
      case 'error':
        return 'text-red-400';
      case 'pending':
      default:
        return 'text-slate-400';
    }
  };

  // Calcular resumen
  const summary = {
    total: checks.length,
    passed: checks.filter(c => c.status === 'passed').length,
    warning: checks.filter(c => c.status === 'warning').length,
    error: checks.filter(c => c.status === 'error').length,
    pending: checks.filter(c => c.status === 'pending').length
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header con resumen */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-3">
          <h4 className="text-xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <Activity className="w-5 h-5 text-blue-500" />
            {t('closure.checklist.title')}
          </h4>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">({summary.passed} {t('closure.checklist.passed')})</span>
            </div>
            {summary.warning > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-bold text-orange-400">{summary.warning} {t('closure.checklist.warnings')}</span>
              </div>
            )}
            {summary.error > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-bold text-red-400">{summary.error} {t('closure.checklist.errors')}</span>
              </div>
            )}
            {summary.pending > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-500">{summary.pending} {t('closure.checklist.pending')}</span>
              </div>
            )}
          </div>
        </div>

        {!autoRun && (
          <button
            onClick={handleRunValidations}
            disabled={isRunning}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 disabled:bg-slate-800 disabled:text-slate-600 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 group"
          >
            {isRunning ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {t('closure.checklist.validating')}
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {t('closure.checklist.runValidations')}
              </>
            )}
          </button>
        )}
      </div>

      {/* Lista de checks */}
      <div className="grid grid-cols-1 gap-3">
        {checks.map((check, index) => (
          <div
            key={check.id}
            className={`p-5 rounded-xl border-2 transition-all duration-300 group hover:translate-x-1 ${getStatusColor(check.status)}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {isRunning && check.status === 'pending' ? (
                  <Loader className="w-6 h-6 text-blue-500 animate-spin" />
                ) : (
                  getStatusIcon(check.status)
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <p className={`text-base font-black tracking-tighter uppercase ${getStatusTextColor(check.status)}`}>
                      {check.label}
                    </p>
                    {check.message && (
                      <p className="text-sm font-medium text-slate-500 italic">
                        {check.message}
                      </p>
                    )}
                  </div>

                  {check.action && check.status !== 'passed' && (
                    <button
                      onClick={check.action.onClick}
                      className="px-4 py-2 bg-slate-950/50 hover:bg-slate-950 text-xs font-bold text-blue-400 border border-blue-500/30 rounded-lg transition-all flex items-center gap-2"
                    >
                      {check.action.label}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {check.details && (
                  <details className="mt-4 group/details">
                    <summary className="text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-400 transition-colors list-none flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-open/details:bg-blue-500" />
                      {t('closure.checklist.technicalAudit')}
                    </summary>
                    <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-slate-800/50 overflow-x-auto">
                      <pre className="text-xs font-mono text-blue-400 font-medium leading-relaxed">
                        {JSON.stringify(check.details, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen final vertical bar */}
      {hasRun && !isRunning && (
        <div className={`mt-6 p-6 rounded-2xl border-l-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 bg-slate-900/80 ${summary.error > 0 ? 'border-red-600' : summary.warning > 0 ? 'border-orange-600' : 'border-emerald-600'
          }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('closure.checklist.stepStatus')}</p>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase">
                {summary.passed} {t('common.of')} {summary.total} {t('closure.checklist.completedValidations')}
              </h3>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              {summary.error > 0 ? (
                <div className="flex items-center gap-3 px-6 py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/20">
                  <AlertCircle className="w-6 h-6" />
                  {t('closure.checklist.errorActionRequired')}
                </div>
              ) : summary.warning > 0 ? (
                <div className="flex items-center gap-3 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-lg shadow-orange-900/20">
                  <AlertTriangle className="w-6 h-6" />
                  {t('closure.checklist.warningsDetected')}
                </div>
              ) : (
                <div className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/20">
                  <CheckCircle className="w-6 h-6" />
                  {t('closure.checklist.readyToContinue')}
                </div>
              )}
              <p className="text-xs font-medium text-slate-500">{t('closure.checklist.auditRecorded')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
