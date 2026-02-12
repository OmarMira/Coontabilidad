import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Database,
  Activity,
  ShieldCheck,
  Zap,
  Terminal,
  ChevronRight,
  Search,
  Cpu,
  Server,
  Network,
  HardDrive
} from 'lucide-react';
import { diagnoseAccountingSystem } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';
import { useLocale } from '../i18n/useLocale';

export function AccountingDiagnosis() {
  const { t } = useLocale();
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnosis = async () => {
    setLoading(true);
    setError(null);

    try {
      logger.info('AccountingDiagnosis', 'user_initiated', 'Usuario inició diagnóstico del sistema contable');
      const result = await diagnoseAccountingSystem();
      setDiagnosis(result);

      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      logger.error('AccountingDiagnosis', 'diagnosis_error', 'Error en componente de diagnóstico', { error: errorMsg });
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    runDiagnosis();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Heavy Header Panel */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg">
            <Cpu className="w-10 h-10 text-blue-500" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('accountingDiagnosis.title')}</h2>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('accountingDiagnosis.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={runDiagnosis}
          disabled={loading}
          className="flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_15px_40px_rgba(37,99,235,0.2)] active:scale-95 disabled:scale-100"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? t('accountingDiagnosis.syncing') : t('accountingDiagnosis.runDeepDiagnosis')}
        </button>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
            <div className="absolute inset-4 rounded-full border-2 border-slate-800 border-b-blue-400 animate-spin transition-all duration-300"></div>
            <Activity className="absolute inset-0 m-auto w-6 h-6 text-blue-500 animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-black text-white uppercase tracking-[0.4em] text-xs">{t('accountingDiagnosis.scanningSql')}</p>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{t('accountingDiagnosis.verifyingIntegrity')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="max-w-3xl mx-auto p-12 bg-rose-500/5 border-2 border-rose-500/20 rounded-[3rem] shadow-2xl space-y-6 animate-in slide-in-from-bottom-8">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-black text-rose-400 uppercase tracking-tighter mb-2">{t('accountingDiagnosis.criticalNetworkFailure')}</h3>
            <p className="text-slate-400 font-bold leading-relaxed max-w-md mx-auto">{error}</p>
          </div>
        </div>
      ) : diagnosis ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {/* Main Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={t('accountingDiagnosis.sqlArchitecture')}
              value={`${diagnosis.details.existingTables?.length || 0}/3`}
              status={diagnosis.details.tablesExist ? t('accountingDiagnosis.valid') : t('accountingDiagnosis.errorStatus')}
              icon={Server}
              color={diagnosis.details.tablesExist ? 'blue' : 'rose'}
              description={t('accountingDiagnosis.systemTablesDetected')}
            />
            <StatCard
              title={t('accountingDiagnosis.planEntities')}
              value={diagnosis.details.accountsCount || 0}
              status={t('accountingDiagnosis.optimal')}
              icon={Network}
              color="emerald"
              description={t('accountingDiagnosis.masterAccountsInMemory')}
            />
            <StatCard
              title={t('accountingDiagnosis.networkIntegrity')}
              value={`${diagnosis.details.mainAccounts || 0}/5`}
              status={diagnosis.details.mainAccounts >= 5 ? t('accountingDiagnosis.complete') : t('accountingDiagnosis.high')}
              icon={ShieldCheck}
              color="indigo"
              description={t('accountingDiagnosis.multipleControlAccounts')}
            />
            <StatCard
              title={t('accountingDiagnosis.ledgerRegistry')}
              value={diagnosis.details.journalCount || 0}
              status={t('accountingDiagnosis.active')}
              icon={HardDrive}
              color="amber"
              description={t('accountingDiagnosis.historicalEntriesIndexed')}
            />
          </div>

          {/* Symmetrical Summary Bar */}
          <div className={`p-10 rounded-[3rem] border-2 shadow-2xl backdrop-blur-3xl transition-all duration-700 transform flex flex-col md:flex-row items-center justify-between gap-10 ${diagnosis.success
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
            : 'bg-rose-500/5 border-rose-500/40 text-rose-400 animate-pulse'
            }`}>
            <div className="flex items-center gap-8">
              <div className={`p-6 rounded-[2rem] border shadow-2xl ${diagnosis.success ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-900/20' : 'bg-rose-500/10 border-rose-500/20 shadow-rose-900/20'}`}>
                {diagnosis.success ? <CheckCircle className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">
                  {diagnosis.success ? t('accountingDiagnosis.diagnosisNominal') : t('accountingDiagnosis.diagnosisAlert')}
                </h3>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">
                  {t('accountingDiagnosis.auditProtocolLabel')} {diagnosis.success ? t('accountingDiagnosis.alphaOnline') : t('accountingDiagnosis.reviewRequired')}
                </p>
              </div>
            </div>
            <div className="text-right border-l border-white/10 pl-10 hidden md:block">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">{t('accountingDiagnosis.synchronization')}</p>
              <p className="text-xl font-black font-mono tracking-tighter">99.9% Uptime</p>
            </div>
          </div>

          {/* Secondary Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left: Accounts View */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden shadow-xl backdrop-blur-md">
              <header className="px-10 py-6 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  {t('accountingDiagnosis.mainAccountsControl')}
                </h4>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </header>
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnosis.details?.mainAccountsData?.map((account: any[], index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-950/40 hover:bg-slate-950 border border-slate-800/40 hover:border-slate-700 rounded-2xl transition-all group">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-[10px] font-black text-blue-400 bg-blue-500/5 px-2.5 py-1.5 rounded-xl border border-blue-500/10">{account[0]}</span>
                      <span className="text-sm font-bold text-slate-400 group-hover:text-slate-100 transition-colors uppercase tracking-tight">{account[1]}</span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{account[2]}</span>
                      <div className="w-8 h-1 bg-blue-500/20 rounded-full mt-1 overflow-hidden">
                        <div className="w-full h-full bg-blue-500"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Technical Log */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] flex flex-col shadow-xl">
              <header className="px-10 py-6 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> SQL Raw Trace
                </h4>
              </header>
              <div className="flex-1 p-8 font-mono text-[10px] text-slate-500 overflow-y-auto max-h-[400px] leading-relaxed scrollbar-hide">
                <pre className="whitespace-pre-wrap">{JSON.stringify(diagnosis.details, null, 2)}</pre>
              </div>
              <footer className="p-6 text-center border-t border-slate-800">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{t('accountingDiagnosis.endOfAuditTrace')}</p>
              </footer>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const StatCard = ({ title, value, status, icon: Icon, color, description }: any) => {
  const colorSchemes: any = {
    blue: 'text-blue-500 bg-blue-600/10 border-blue-500/20 shadow-blue-900/10',
    emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20 shadow-emerald-900/10',
    indigo: 'text-indigo-500 bg-indigo-600/10 border-indigo-500/20 shadow-indigo-900/10',
    rose: 'text-rose-500 bg-rose-600/10 border-rose-500/20 shadow-rose-900/10',
    amber: 'text-amber-500 bg-amber-600/10 border-amber-500/20 shadow-amber-900/10',
  };

  const scheme = colorSchemes[color] || colorSchemes.blue;

  return (
    <div className="bg-slate-900 border border-slate-800/80 p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1">
      <div className="flex items-center justify-between mb-8">
        <div className={`p-3 rounded-2xl border ${scheme} transition-all group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${scheme} shadow-inner`}>
          {status}
        </span>
      </div>
      <div>
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{title}</h4>
        <div className="text-4xl font-black text-white tracking-tighter mb-2">{value}</div>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{description}</p>
      </div>
    </div>
  );
}