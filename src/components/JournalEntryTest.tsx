import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileText,
  Calculator,
  Zap,
  Play,
  History,
  Terminal as TerminalIcon,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Box,
  Beaker,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import {
  createJournalEntry,
  getJournalEntries,
  generateSalesJournalEntry,
  generatePurchaseJournalEntry,
  JournalEntry,
  getInvoiceById,
  getBillById
} from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';
import { useLocale } from '../i18n/useLocale';

export function JournalEntryTest() {
  const { t } = useLocale();
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const loadJournalEntries = async () => {
    try {
      setLoading(true);
      const entries = getJournalEntries(20);
      setJournalEntries(entries);
    } catch (error) {
      setError(t('journalEntryTest.errorLoadingEntries'));
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const testManualJournalEntry = async () => {
    try {
      const testEntry = {
        entry_date: new Date().toISOString().split('T')[0],
        reference_number: `TEST-${Date.now()}`,
        description: t('journalEntryTest.manualTestEntryDesc')
      };

      const testDetails = [
        { account_code: '1111', debit_amount: 1000, credit_amount: 0, description: t('journalEntryTest.cashEntryDesc') },
        { account_code: '4110', debit_amount: 0, credit_amount: 1000, description: t('journalEntryTest.serviceSaleDesc') }
      ];

      const result = await createJournalEntry(testEntry, testDetails);
      const testResult = {
        test: 'Manual Journey Protocol',
        success: result.success,
        message: result.message,
        entryId: result.entryId,
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [testResult, ...prev]);
      if (result.success) await loadJournalEntries();
    } catch (error) {
      setTestResults(prev => [{ test: 'Manual Journey Protocol', success: false, message: 'Exception', timestamp: new Date().toISOString() }, ...prev]);
    }
  };

  const testSalesJournalEntry = async () => {
    try {
      const invoice = getInvoiceById(1);
      if (!invoice) return;
      const result = await generateSalesJournalEntry(invoice);
      setTestResults(prev => [{
        test: 'Sales Auto-Ledger',
        success: result.success,
        message: result.message,
        entryId: result.entryId,
        timestamp: new Date().toISOString()
      }, ...prev]);
      if (result.success) await loadJournalEntries();
    } catch (error) { }
  };

  const testPurchaseJournalEntry = async () => {
    try {
      const bill = getBillById(1);
      if (!bill) return;
      const result = await generatePurchaseJournalEntry(bill);
      setTestResults(prev => [{
        test: 'Purchase Auto-Ledger',
        success: result.success,
        message: result.message,
        entryId: result.entryId,
        timestamp: new Date().toISOString()
      }, ...prev]);
      if (result.success) await loadJournalEntries();
    } catch (error) { }
  };

  const runAllTests = async () => {
    setTestResults([]);
    await testManualJournalEntry();
    await testSalesJournalEntry();
    await testPurchaseJournalEntry();
  };

  useEffect(() => {
    loadJournalEntries();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Test Control Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-amber-600/10 rounded-2.5xl border border-amber-500/20 shadow-amber-900/10 shadow-lg">
            <Beaker className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('journalEntryTest.title')}</h2>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> {t('journalEntryTest.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={loadJournalEntries} className="p-4 bg-slate-950 border border-slate-800 text-slate-500 hover:text-white rounded-2xl transition-all">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={runAllTests} className="flex items-center gap-3 px-10 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-amber-900/30 active:scale-95">
            <Play className="w-4 h-4 fill-current" /> {t('journalEntryTest.runTotalSuite')}
          </button>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TestTrigger
          title={t('journalEntryTest.manualEntry')}
          desc={t('journalEntryTest.generateTestEntry')}
          onClick={testManualJournalEntry}
          color="emerald"
          icon={TrendingUp}
        />
        <TestTrigger
          title={t('journalEntryTest.autoSales')}
          desc={t('journalEntryTest.invoiceToLedgerProtocol')}
          onClick={testSalesJournalEntry}
          color="blue"
          icon={Calculator}
        />
        <TestTrigger
          title={t('journalEntryTest.autoPurchases')}
          desc={t('journalEntryTest.billToLedgerProtocol')}
          onClick={testPurchaseJournalEntry}
          color="purple"
          icon={TrendingDown}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
        {/* Results Console */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[600px]">
          <header className="px-10 py-6 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-emerald-500" /> {t('journalEntryTest.testLogs')}
            </h4>
            <span className="text-[9px] font-black text-slate-600 bg-slate-900 px-2 py-1 rounded">REV 41.0</span>
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
            {testResults.length === 0 ? (
              <div className="py-20 text-center opacity-20 italic font-black text-slate-500 uppercase tracking-widest text-[10px]">{t('journalEntryTest.waitingForExecution')}</div>
            ) : (
              testResults.map((result, i) => (
                <div key={i} className={`p-5 rounded-2xl border transition-all animate-in slide-in-from-left-4 duration-300 ${result.success ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${result.success ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {result.test}
                    </span>
                    {result.success ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <ShieldAlert className="w-3 h-3 text-rose-500" />}
                  </div>
                  <p className="text-sm font-bold text-slate-300 leading-tight mb-3">{result.message}</p>
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-600">
                    <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                    {result.entryId && <span className="text-blue-500/60">E-ID: {result.entryId}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ledger Preview */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[600px]">
          <header className="px-10 py-6 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" /> {t('journalEntryTest.latestLabRecords')}
            </h4>
            {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
          </header>
          <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide">
            {journalEntries.map((entry) => (
              <div key={entry.id} className="p-8 bg-slate-950/40 border border-slate-800/60 rounded-[2.5rem] hover:border-blue-500/30 transition-all group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-5">
                    <div className={`w-3 h-3 rounded-full ${entry.is_balanced ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'}`} />
                    <div>
                      <p className="text-xl font-black text-white uppercase tracking-tighter">{entry.reference_number || `TEST-NODE-${entry.id}`}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{entry.entry_date} • {entry.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white font-mono tracking-tighter">${entry.total_debit.toLocaleString()}</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${entry.is_balanced ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {entry.is_balanced ? t('journalEntryTest.syncOk') : t('journalEntryTest.outOfPivot')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/50 pt-6">
                  {entry.details?.map((detail, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800/40">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[9px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded-lg border border-blue-500/10">{detail.account_code}</span>
                        <span className="text-xs font-bold text-slate-400 truncate max-w-[100px]">{detail.account?.account_name}</span>
                      </div>
                      <span className={`text-xs font-black font-mono ${detail.debit_amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${(detail.debit_amount || detail.credit_amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const TestTrigger = ({ title, desc, onClick, color, icon: Icon }: any) => {
  const colors: any = {
    emerald: 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white',
    blue: 'bg-blue-600/10 border-blue-500/20 text-blue-500 group-hover:bg-blue-600 group-hover:text-white',
    purple: 'bg-purple-600/10 border-purple-500/20 text-purple-500 group-hover:bg-purple-600 group-hover:text-white',
  };

  return (
    <button
      onClick={onClick}
      className="group p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] text-left transition-all hover:border-blue-500/30 hover:-translate-y-2 shadow-xl"
    >
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 transition-all duration-500 ${colors[color]}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{title}</h4>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{desc}</p>
    </button>
  );
};