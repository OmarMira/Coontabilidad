import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Database, Activity } from 'lucide-react';
import { diagnoseAccountingSystem } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';

export function AccountingDiagnosis() {
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
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnosis();
  }, []);

  return (
    <div className="space-y-6 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            Diagnóstico del Sistema
          </h1>
          <p className="text-slate-400 font-medium ml-11">Verificación de integridad y estado del motor contable</p>
        </div>
        <button
          onClick={runDiagnosis}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all font-bold shadow-lg shadow-blue-900/40"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Ejecutar Diagnóstico</span>
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-slate-900 rounded-2xl p-12 border border-slate-800 flex flex-col items-center justify-center animate-pulse">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">Escaneando base de datos...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex items-start gap-4">
          <div className="p-3 bg-rose-500/20 rounded-xl">
            <AlertCircle className="h-6 w-6 text-rose-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-rose-300">Error en Diagnóstico</h3>
            <p className="text-rose-200/70 font-medium leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {diagnosis && !loading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Status Overview */}
          <div className={`rounded-2xl p-8 border ${diagnosis.success ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl ${diagnosis.success ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                {diagnosis.success ? (
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-10 w-10 text-rose-400" />
                )}
              </div>
              <div>
                <h3 className={`text-xl font-black ${diagnosis.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {diagnosis.success ? 'Sistema Funcionando Correctamente' : 'Problemas de Integridad Detectados'}
                </h3>
                <p className={`mt-1 font-medium ${diagnosis.success ? 'text-emerald-300/70' : 'text-rose-300/70'}`}>
                  {diagnosis.message}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {diagnosis.details && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Tablas" value={`${diagnosis.details.existingTables?.length || 0}/3`} description={diagnosis.details.tablesExist ? 'Estructura válida' : 'Faltan tablas'} icon={Database} color="blue" />
              <StatCard title="Cuentas" value={diagnosis.details.accountsCount || 0} description="Cargadas en Plan" icon={Activity} color="emerald" />
              <StatCard title="Principales" value={`${diagnosis.details.mainAccounts || 0}/5`} description="Cuentas control" icon={CheckCircle} color="purple" />
              <StatCard title="Asientos" value={diagnosis.details.journalCount || 0} description="Historial contable" icon={Database} color="yellow" />
            </div>
          )}

          {/* Main Accounts Details */}
          {diagnosis.details?.mainAccountsData && diagnosis.details.mainAccountsData.length > 0 && (
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Cuentas Principales Detectadas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {diagnosis.details.mainAccountsData.map((account: any[], index: number) => (
                  <div key={index} className="flex items-center justify-between py-3 px-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:bg-slate-800/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs text-blue-400 font-bold bg-blue-900/20 px-2 py-0.5 rounded">{account[0]}</span>
                      <span className="text-slate-200 font-bold text-sm tracking-tight">{account[1]}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-900 rounded text-slate-500 border border-slate-700">
                      {account[2]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Details */}
          <details className="group bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
            <summary className="cursor-pointer px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-widest flex items-center justify-between hover:bg-slate-800/30 transition-colors group-open:bg-slate-800/50">
              Detalles Técnicos (Auditoría SQL)
              <div className="w-4 h-4 text-slate-600 transition-transform group-open:rotate-180">▼</div>
            </summary>
            <div className="p-6 bg-slate-950 font-mono text-xs text-slate-500 leading-relaxed max-h-60 overflow-auto">
              <pre>{JSON.stringify(diagnosis.details, null, 2)}</pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

const StatCard = ({ title, value, description, icon: Icon, color }: any) => {
  const colorMap: any = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest">{title}</h4>
      </div>
      <div className="text-3xl font-black text-white tracking-tight leading-none mb-1">{value}</div>
      <p className="text-slate-500 text-[10px] font-bold uppercase">{description}</p>
    </div>
  );
}