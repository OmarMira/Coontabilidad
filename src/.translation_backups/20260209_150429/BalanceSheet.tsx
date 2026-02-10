import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Printer,
  FileText,
  ShieldCheck,
  History,
  Box,
  Layout,
  ChevronRight,
  ArrowRight,
  Download,
  Loader2
} from 'lucide-react';
import { generateBalanceSheet, ChartOfAccount } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';

interface BalanceSheetData {
  assets: ChartOfAccount[];
  liabilities: ChartOfAccount[];
  equity: ChartOfAccount[];
  totalAssets: number;
  totalLiabilitiesEquity: number;
  isBalanced: boolean;
}

export function BalanceSheet() {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const loadBalanceSheet = async (date?: string) => {
    try {
      setLoading(true);
      setError(null);
      const dateToUse = date || asOfDate;
      const result = generateBalanceSheet(dateToUse);
      setBalanceSheet(result);
    } catch (error) {
      console.error('Balance Sheet Load Error:', error);
      setError('Fallo crítico en generación de balance general');
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  const handleDateChange = (newDate: string) => {
    setAsOfDate(newDate);
    loadBalanceSheet(newDate);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderAccountList = (accounts: ChartOfAccount[]) => (
    <div className="space-y-3">
      {accounts.map((account) => (
        <div key={account.account_code} className="flex items-center justify-between p-4 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/50 hover:border-slate-700/80 rounded-2xl transition-all group">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] font-black text-blue-400 bg-blue-500/5 px-2.5 py-1.5 rounded-xl border border-blue-500/10 shadow-sm">
              {account.account_code}
            </span>
            <span className="text-sm font-bold text-slate-400 group-hover:text-slate-100 transition-colors">
              {account.account_name}
            </span>
          </div>
          <span className="font-mono text-white font-black text-sm tracking-tight group-hover:scale-105 transition-transform">
            {formatCurrency(account.balance || 0)}
          </span>
        </div>
      ))}
      {accounts.length === 0 && (
        <div className="py-12 text-center opacity-20 italic font-black text-slate-500 uppercase tracking-widest text-[10px]">Sin registros en este nodo</div>
      )}
    </div>
  );

  useEffect(() => {
    loadBalanceSheet();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Premium Header Control Panel */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-600/10 rounded-2.5xl border border-indigo-500/20 shadow-indigo-900/10 shadow-lg">
            <Layout className="w-10 h-10 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Balance General</h2>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
              <History className="w-3.5 h-3.5" /> Financial Health Matrix • Audited Snapshots
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-2 rounded-2xl shadow-inner group">
            <div className="bg-slate-900 p-2 rounded-xl group-hover:bg-blue-600/10 transition-colors">
              <Calendar className="w-4 h-4 text-slate-500 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="flex flex-col pr-4">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Corte al Día</span>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-white border-0 p-0 text-xs font-black outline-none focus:ring-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button onClick={() => loadBalanceSheet()} disabled={loading} className="p-3 hover:bg-slate-900 text-slate-500 hover:text-white rounded-xl transition-all">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all no-print">
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-indigo-900/40 active:scale-95 no-print">
              <Download className="w-4 h-4" /> Descargar PDF
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-40 flex flex-col items-center gap-6">
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
          <p className="font-black text-slate-500 uppercase tracking-[0.2em] text-[10px]">Estructurando Matrices Financieras...</p>
        </div>
      ) : error ? (
        <div className="max-w-xl mx-auto p-10 bg-rose-500/10 border border-rose-500/30 rounded-[2.5rem] text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <p className="font-black text-rose-500 uppercase tracking-widest text-sm">{error}</p>
        </div>
      ) : balanceSheet ? (
        <>
          {/* Symmetrical Integrity Indicator */}
          <div className={`max-w-5xl mx-auto mb-16 p-8 rounded-[2.5rem] border-2 shadow-2xl backdrop-blur-3xl transition-all duration-700 transform flex flex-col md:flex-row items-center justify-between gap-8 ${balanceSheet.isBalanced
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
              : 'bg-rose-500/5 border-rose-500/40 text-rose-400 animate-pulse'
            }`}>
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-2xl border ${balanceSheet.isBalanced ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-900/20' : 'bg-rose-500/10 border-rose-500/20 shadow-rose-900/20'}`}>
                {balanceSheet.isBalanced ? <CheckCircle className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{balanceSheet.isBalanced ? 'ESTRUCTURA BALANCEADA' : 'INCONSISTENCIA EN RED'}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Activos = Pasivos + Capital • Protocolo de Auditoría</p>
              </div>
            </div>
            {!balanceSheet.isBalanced && (
              <div className="text-right">
                <p className="text-[9px] font-black text-rose-500/50 uppercase tracking-widest mb-1">Diferencia Crítica</p>
                <p className="text-2xl font-black font-mono tracking-tighter">${Math.abs(balanceSheet.totalAssets - balanceSheet.totalLiabilitiesEquity).toLocaleString()}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-[1400px] mx-auto">
            {/* Activos Column */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-xl group hover:border-emerald-500/20 transition-all duration-500">
              <header className="px-10 py-8 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Activos / Resources</h3>
                </div>
                <span className="text-[9px] font-black text-emerald-500/40 bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10">NODE 1000</span>
              </header>
              <div className="p-10">
                {renderAccountList(balanceSheet.assets)}
              </div>
              <footer className="p-10 bg-emerald-500/5 border-t border-emerald-500/10 flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Activos Brutos</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Snapshot Integrado</p>
                </div>
                <p className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">{formatCurrency(balanceSheet.totalAssets)}</p>
              </footer>
            </div>

            {/* Pasivos & Equity Column */}
            <div className="space-y-12">
              {/* Pasivos */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-xl hover:border-rose-500/20 transition-all duration-500">
                <header className="px-10 py-8 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                      <TrendingDown className="w-6 h-6 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Pasivos / Debt</h3>
                  </div>
                  <span className="text-[9px] font-black text-rose-500/40 bg-rose-500/5 px-3 py-1 rounded-full border border-rose-500/10">NODE 2000</span>
                </header>
                <div className="p-10">
                  {renderAccountList(balanceSheet.liabilities)}
                </div>
                <footer className="p-8 bg-rose-500/5 border-t border-rose-500/10 flex justify-between items-center">
                  <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest">Suma de Obligaciones</p>
                  <p className="text-xl font-black text-rose-400 font-mono tracking-tighter">
                    {formatCurrency(balanceSheet.liabilities.reduce((sum, acc) => sum + (acc.balance || 0), 0))}
                  </p>
                </footer>
              </div>

              {/* Equity */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-xl hover:border-blue-500/20 transition-all duration-500">
                <header className="px-10 py-8 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                      <History className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Capital / Equity</h3>
                  </div>
                  <span className="text-[9px] font-black text-blue-500/40 bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10">NODE 3000</span>
                </header>
                <div className="p-10">
                  {renderAccountList(balanceSheet.equity)}
                </div>
                <footer className="p-8 bg-blue-500/5 border-t border-blue-500/10 flex justify-between items-center">
                  <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-widest">Capital Residual</p>
                  <p className="text-xl font-black text-blue-400 font-mono tracking-tighter">
                    {formatCurrency(balanceSheet.equity.reduce((sum, acc) => sum + (acc.balance || 0), 0))}
                  </p>
                </footer>
              </div>

              {/* Matrix Summary Bar */}
              <div className="relative mt-8 group cursor-pointer">
                <div className="absolute inset-0 blur-2xl bg-indigo-600 opacity-10 group-hover:opacity-20 transition-all" />
                <div className="relative p-10 rounded-[3rem] border-2 border-indigo-500/30 bg-slate-950/20 backdrop-blur-3xl shadow-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Ecuación Contable Final</h4>
                    <p className="text-xl font-black text-white uppercase tracking-tighter">Pasivos + Patrimonio</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-black text-indigo-400 font-mono tracking-tighter">
                      {formatCurrency(balanceSheet.totalLiabilitiesEquity)}
                    </p>
                    <p className="text-[9px] font-black font-mono text-slate-600 uppercase tracking-widest mt-1">Snapshot Audit Ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}