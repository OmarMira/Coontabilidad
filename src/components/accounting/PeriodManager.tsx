import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/i18n/useLocale';
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Wand2,
  CalendarDays,
  ShieldAlert,
  History,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { accountingPeriodService } from '@/services/accounting/AccountingPeriodService';
import type { AccountingPeriod } from '@/services/accounting/AccountingPeriodService';
import PeriodClosureWizard from './PeriodClosureWizard';

/**
 * PeriodManager
 * 
 * Componente para gestionar períodos contables:
 * - Lista de períodos con estado
 * - Creación de períodos mensuales
 * - Cierre de períodos
 * - Reapertura (solo admin)
 * - Bloqueo de períodos
 */
export const PeriodManager: React.FC = () => {
  const { t, language } = useLocale();
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [showWizard, setShowWizard] = useState(false);
  const [wizardPeriodId, setWizardPeriodId] = useState<number | null>(null);

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = () => {
    try {
      setLoading(true);
      setError(null);
      const allPeriods = accountingPeriodService.getPeriods();
      setPeriods(allPeriods);
    } catch (err) {
      console.error('Error loading periods:', err);
      setError(err instanceof Error ? err.message : t('accounting.periods.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMonthlyPeriods = () => {
    try {
      setLoading(true);
      setError(null);

      const result = accountingPeriodService.createMonthlyPeriods(fiscalYear, 1);

      if (result.success) {
        setSuccess(t('accounting.periods.creationSuccess', { count: result.count || 0, year: fiscalYear.toString() }));
        loadPeriods();
        setShowCreateForm(false);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error creating periods:', err);
      setError(err instanceof Error ? err.message : t('accounting.periods.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleClosePeriod = (period: AccountingPeriod) => {
    if (!confirm(t('accounting.periods.closureConfirm', { name: period.name }))) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const validation = accountingPeriodService.validatePeriodClosure(period.id);

      if (!validation.canClose) {
        const errorMessages = [
          ...validation.errors,
          ...validation.warnings.map(w => `⚠️ ${w}`)
        ];
        setError(`Imposible procesar cierre:\n${errorMessages.join('\n')}`);
        setLoading(false);
        return;
      }

      const result = accountingPeriodService.closePeriod(period.id, 1);

      if (result.success) {
        setSuccess(t('accounting.periods.closureSuccess', { name: period.name }));
        loadPeriods();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error closing period:', err);
      setError(err instanceof Error ? err.message : 'Fallo en motor de cierre');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenPeriod = (period: AccountingPeriod) => {
    const reason = prompt(t('accounting.periods.auditReason'));
    if (!reason) return;

    try {
      setLoading(true);
      setError(null);

      const result = accountingPeriodService.reopenPeriod(period.id, 1, reason);

      if (result.success) {
        setSuccess(t('accounting.periods.reopenSuccess', { name: period.name }));
        loadPeriods();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error reopening period:', err);
      setError(err instanceof Error ? err.message : 'Error en protocolo de reapertura');
    } finally {
      setLoading(false);
    }
  };

  const handleLockPeriod = (period: AccountingPeriod) => {
    if (!confirm(t('accounting.periods.lockConfirm', { name: period.name }))) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = accountingPeriodService.lockPeriod(period.id, 1);

      if (result.success) {
        setSuccess(t('accounting.periods.lockSuccess', { name: period.name }));
        loadPeriods();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error locking period:', err);
      setError(err instanceof Error ? err.message : 'Error en bloqueo de seguridad');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center gap-1.5 min-w-[90px]">
            <Unlock className="w-3 h-3" />
            {t('accounting.periods.statusOpen')}
          </span>
        );
      case 'closed':
        return (
          <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center gap-1.5 min-w-[90px]">
            <CheckCircle className="w-3 h-3" />
            {t('accounting.periods.statusClosed')}
          </span>
        );
      case 'locked':
        return (
          <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center gap-1.5 min-w-[90px]">
            <Lock className="w-3 h-3" />
            {t('accounting.periods.statusLocked')}
          </span>
        );
      default:
        return null;
    }
  };

  if (loading && periods.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 flex-col gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{t('accounting.periods.sync')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
              <CalendarDays className="w-10 h-10 text-blue-500" />
            </div>
            {t('accounting.periods.title')}
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2 flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
            {t('accounting.periods.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          {t('accounting.periods.initYear')}
        </button>
      </div>

      {/* Alerts */}
      {(error || success) && (
        <div className={`p-6 rounded-2xl border-2 animate-in slide-in-from-top-4 ${error ? 'bg-red-900/10 border-red-500/30' : 'bg-emerald-900/10 border-emerald-500/30'
          }`}>
          <div className="flex items-start gap-4">
            {error ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <CheckCircle className="w-6 h-6 text-emerald-500" />}
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${error ? 'text-red-500' : 'text-emerald-500'}`}>
                {error ? t('common.error') : t('common.success')}
              </p>
              <p className={`text-sm font-bold ${error ? 'text-red-200/80' : 'text-emerald-200/80'}`}>{error || success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl group hover:border-emerald-500/30 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('accounting.periods.openExecution')}</span>
            <Unlock className="w-5 h-5 text-emerald-500 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="text-4xl font-black text-white">{periods.filter(p => p.status === 'open').length}</div>
          <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-tight">{t('accounting.periods.openDesc')}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl group hover:border-orange-500/30 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('accounting.periods.closedRecords')}</span>
            <CheckCircle className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-4xl font-black text-white">{periods.filter(p => p.status === 'closed').length}</div>
          <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-tight">{t('accounting.periods.closedDesc')}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl group hover:border-red-500/30 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('accounting.periods.totalImmutability')}</span>
            <Lock className="w-5 h-5 text-red-500 group-hover:-rotate-12 transition-transform" />
          </div>
          <div className="text-4xl font-black text-white">{periods.filter(p => p.status === 'locked').length}</div>
          <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-tight">{t('accounting.periods.lockedDesc')}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="px-8 py-6 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-tighter">{t('accounting.periods.scheduleTitle')}</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('accounting.periods.year')}: {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {periods.length === 0 ? (
            <div className="text-center py-20 bg-grid-slate-950/20">
              <Calendar className="w-20 h-20 text-slate-800 mx-auto mb-6" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-6">{t('accounting.periods.initSubtitle')}</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-xl transition-all"
              >
                {t('accounting.periods.generatePeriods')}
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-950/20 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                  <th className="text-left py-5 px-8">{t('accounting.periods.periodName')}</th>
                  <th className="text-left py-5 px-8">{t('accounting.periods.frequency')}</th>
                  <th className="text-left py-5 px-8 font-serif italic lowercase tracking-normal text-sm">{t('accounting.periods.timeRange')}</th>
                  <th className="text-center py-5 px-8">{t('accounting.periods.legalStatus')}</th>
                  <th className="text-right py-5 px-8">{t('accounting.periods.operationalActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {periods.map((period) => (
                  <tr key={period.id} className="hover:bg-slate-800/30 transition-all group">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-6 rounded-full ${period.status === 'open' ? 'bg-emerald-500' : period.status === 'closed' ? 'bg-orange-500' : 'bg-red-500'
                          }`} />
                        <span className="text-sm font-black text-white uppercase tracking-tight">{period.name}</span>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">{period.period_type}</span>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <span>{new Date(period.start_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</span>
                        <ArrowRight className="w-3 h-3 text-slate-700" />
                        <span>{new Date(period.end_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</span>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex justify-center">
                        {getStatusBadge(period.status)}
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {period.status === 'open' && (
                          <>
                            <button
                              onClick={() => {
                                setWizardPeriodId(period.id);
                                setShowWizard(true);
                              }}
                              className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white font-black uppercase text-[9px] tracking-widest px-4 py-2 rounded-xl border border-blue-500/20 transition-all flex items-center gap-2 shadow-lg"
                              disabled={loading}
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              {t('accounting.periods.closeWizard')}
                            </button>
                            <button
                              onClick={() => handleClosePeriod(period)}
                              className="bg-orange-500/10 hover:bg-orange-600 text-orange-400 hover:text-white font-black uppercase text-[9px] tracking-widest px-4 py-2 rounded-xl border border-orange-500/20 transition-all flex items-center gap-2"
                              disabled={loading}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {t('accounting.periods.fastClose')}
                            </button>
                          </>
                        )}
                        {period.status === 'closed' && (
                          <>
                            <button
                              onClick={() => handleReopenPeriod(period)}
                              className="bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white font-black uppercase text-[9px] tracking-widest px-4 py-2 rounded-xl border border-emerald-500/20 transition-all flex items-center gap-2"
                              disabled={loading}
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              {t('accounting.periods.reopen')}
                            </button>
                            <button
                              onClick={() => handleLockPeriod(period)}
                              className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white font-black uppercase text-[9px] tracking-widest px-4 py-2 rounded-xl border border-red-500/30 transition-all flex items-center gap-2"
                              disabled={loading}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              {t('accounting.periods.fullLock')}
                            </button>
                          </>
                        )}
                        {period.status === 'locked' && (
                          <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            <History className="w-3 h-3" />
                            {t('accounting.periods.statusFinished')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Forms/Modals with Standard Aesthetic */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-1 w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-slate-950/50 p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{t('accounting.periods.initTitle')}</h3>
                <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em]">{t('accounting.periods.initSubtitle')}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">{t('accounting.periods.targetFiscalYear')}</label>
                  <input
                    type="number"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                    className="w-full mt-2 px-5 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white font-black text-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                    min="2020"
                    max="2035"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={handleCreateMonthlyPeriods}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/40 active:scale-95 flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {t('accounting.periods.generatePeriods')}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all"
                    disabled={loading}
                  >
                    {t('accounting.periods.abortOp')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWizard && wizardPeriodId && (
        <PeriodClosureWizard
          periodId={wizardPeriodId}
          isOpen={showWizard}
          onClose={() => {
            setShowWizard(false);
            setWizardPeriodId(null);
          }}
          onComplete={() => {
            setShowWizard(false);
            setWizardPeriodId(null);
            setSuccess('Período consolidado mediante asistente industrial.');
            loadPeriods();
            setTimeout(() => setSuccess(null), 5000);
          }}
        />
      )}
    </div>
  );
};
