import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Calculator,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  History,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  ArrowDownCircle,
  Hash,
  Search,
  Loader2
} from 'lucide-react';
import { ChartOfAccount, createJournalEntry, getJournalEntries, JournalEntry, JournalDetail } from '../database/simple-db';
import { toast } from 'react-hot-toast';
import { useLocale } from '../i18n/useLocale';

interface JournalEntryLine {
  id: string;
  account_id: number;
  account_code: string;
  account_name: string;
  description: string;
  debit: number;
  credit: number;
}

interface ManualJournalEntry {
  id?: number;
  date: string;
  reference: string;
  description: string;
  lines: JournalEntryLine[];
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
  created_at?: string;
}

interface ManualJournalEntriesProps {
  chartOfAccounts: ChartOfAccount[];
  onEntryCreated: () => void;
}

export const ManualJournalEntries: React.FC<ManualJournalEntriesProps> = ({
  chartOfAccounts,
  onEntryCreated
}) => {
  const { t } = useLocale();
  const [entries, setEntries] = useState<ManualJournalEntry[]>([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<ManualJournalEntry>({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [],
    total_debits: 0,
    total_credits: 0,
    is_balanced: false
  });

  useEffect(() => {
    loadJournalEntries();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [currentEntry.lines]);

  const loadJournalEntries = () => {
    try {
      const dbEntries = getJournalEntries(200);
      const mappedEntries: ManualJournalEntry[] = dbEntries.map(entry => ({
        id: entry.id,
        date: entry.entry_date,
        reference: entry.reference || entry.reference_number || '',
        description: entry.description,
        total_debits: entry.total_debit,
        total_credits: entry.total_credit,
        is_balanced: entry.is_balanced,
        lines: []
      }));
      setEntries(mappedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error(t('journal.syncError'));
    }
  };

  const calculateTotals = () => {
    const totalDebits = currentEntry.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredits = currentEntry.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    setCurrentEntry(prev => ({
      ...prev,
      total_debits: totalDebits,
      total_credits: totalCredits,
      is_balanced: isBalanced
    }));
  };

  const addNewLine = () => {
    const newLine: JournalEntryLine = {
      id: Date.now().toString(),
      account_id: 0,
      account_code: '',
      account_name: '',
      description: '',
      debit: 0,
      credit: 0
    };
    setCurrentEntry(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
  };

  const updateLine = (lineId: string, field: keyof JournalEntryLine, value: any) => {
    setCurrentEntry(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.id === lineId) {
          const updatedLine = { ...line, [field]: value };
          if (field === 'account_id') {
            const account = chartOfAccounts.find(acc => acc.id === parseInt(value));
            if (account) {
              updatedLine.account_code = account.account_code;
              updatedLine.account_name = account.account_name;
            }
          }
          if (field === 'debit' && parseFloat(value) > 0) updatedLine.credit = 0;
          else if (field === 'credit' && parseFloat(value) > 0) updatedLine.debit = 0;
          return updatedLine;
        }
        return line;
      })
    }));
  };

  const removeLine = (lineId: string) => {
    setCurrentEntry(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.id !== lineId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEntry.is_balanced) {
      toast.error(t('journal.doubleEntryError'));
      return;
    }

    setIsLoading(true);
    try {
      const details: Partial<JournalDetail>[] = currentEntry.lines.map(line => ({
        account_code: line.account_code,
        debit_amount: line.debit,
        credit_amount: line.credit,
        description: line.description
      }));

      const entryData: Partial<JournalEntry> = {
        entry_date: currentEntry.date,
        reference: currentEntry.reference,
        description: currentEntry.description,
        total_debit: currentEntry.total_debits,
        total_credit: currentEntry.total_credits,
        is_balanced: true
      };

      const result = await createJournalEntry(entryData, details);
      if (result.success) {
        toast.success(t('journal.registeredSuccess'));
        loadJournalEntries();
        setShowEntryForm(false);
        resetForm();
        onEntryCreated();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(t('journal.persistenceError') + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentEntry({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [],
      total_debits: 0,
      total_credits: 0,
      is_balanced: false
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-1 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-md">
        <div className="flex items-center gap-5 p-4">
          <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
            <History className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{t('journal.title')}</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">{t('journal.subtitle')}</p>
          </div>
        </div>
        <div className="p-4 w-full md:w-auto">
          <button
            onClick={() => setShowEntryForm(true)}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5" />
            {t('journal.newEntry')}
          </button>
        </div>
      </div>

      {/* Registry Database Visual */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="px-10 py-6 bg-slate-950/50 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            {t('journal.verifiedEntries')}
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-xl border border-slate-800">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-medium text-slate-500">{t('journal.filterHistory')}</span>
            </div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-24 opacity-30">
            <FileText className="mx-auto h-20 w-20 text-slate-700 mb-6" />
            <p className="font-black text-slate-500 uppercase tracking-widest text-xs">{t('journal.noEntries')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-10 py-5 text-left">{t('journal.fiscalDate')}</th>
                  <th className="px-10 py-5 text-left">{t('journal.auditRef')}</th>
                  <th className="px-10 py-5 text-left">{t('journal.description')}</th>
                  <th className="px-10 py-5 text-right w-32">{t('journal.totalDR')}</th>
                  <th className="px-10 py-5 text-right w-32">{t('journal.totalCR')}</th>
                  <th className="px-10 py-5 text-center w-24">{t('journal.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/30 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <span className="font-mono text-xs text-slate-400 font-bold">{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="font-bold text-xs text-blue-500 tracking-tight bg-blue-500/5 px-3 py-1.5 rounded-xl border border-blue-500/10 shadow-sm">{entry.reference}</span>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{entry.description}</p>
                    </td>
                    <td className="px-10 py-6 text-right font-mono font-black text-emerald-400/90 text-[13px]">
                      ${entry.total_debits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-10 py-6 text-right font-mono font-black text-rose-400/90 text-[13px]">
                      ${entry.total_credits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Industrial Grade Entry Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto h-full w-full z-50 p-4 md:p-8 animate-in fade-in duration-300">
          <div className="relative mx-auto bg-slate-900 border border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden max-w-6xl animate-in slide-in-from-bottom-8 duration-500">
            <header className="bg-slate-950/50 px-10 py-8 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                  <Calculator className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{t('journal.folioInitiator')}</h3>
                  <p className="text-xs font-medium text-slate-600 mt-1">{t('journal.standardUSGAAP')}</p>
                </div>
              </div>
              <button onClick={() => setShowEntryForm(false)} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-all active:scale-90 shadow-lg">
                <X className="w-6 h-6" />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-10 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-medium text-slate-500 ml-2 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> {t('journal.fiscalDate')}
                  </label>
                  <input
                    type="date"
                    value={currentEntry.date}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-medium text-slate-500 ml-2 flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" /> {t('journal.internalRef')}
                  </label>
                  <input
                    type="text"
                    value={currentEntry.reference}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, reference: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder={t('journal.internalRefPlaceholder')}
                    required
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-xs font-medium text-slate-500 ml-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> {t('journal.generalGloss')}
                  </label>
                  <input
                    type="text"
                    value={currentEntry.description}
                    onChange={(e) => setCurrentEntry(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder={t('journal.generalGlossPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-inner p-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950/80 text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-8 py-5">{t('journal.account')}</th>
                      <th className="px-8 py-5">{t('journal.lineDetail')}</th>
                      <th className="px-8 py-5 text-right w-40">{t('journal.debit')}</th>
                      <th className="px-8 py-5 text-right w-40">{t('journal.credit')}</th>
                      <th className="py-5 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {currentEntry.lines.map((line) => (
                      <tr key={line.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="px-6 py-4">
                          <select
                            value={line.account_id}
                            onChange={(e) => updateLine(line.id, 'account_id', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-blue-500 outline-none transition-all"
                            required
                          >
                            <option value="">{t('journal.selectNode')}</option>
                            {chartOfAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.account_code} • {account.account_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                            className="w-full bg-transparent border-b border-slate-800 focus:border-blue-500 text-xs font-bold text-slate-400 p-2 outline-none transition-all"
                            placeholder={t('journal.lineDetailPlaceholder')}
                            required
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.01"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-right font-mono font-black text-emerald-400 text-sm focus:border-emerald-500 outline-none transition-all"
                            disabled={line.credit > 0}
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            step="0.01"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-right font-mono font-black text-rose-400 text-sm focus:border-rose-500 outline-none transition-all"
                            disabled={line.debit > 0}
                            onFocus={(e) => e.target.select()}
                          />
                        </td>
                        <td className="pr-6">
                          <button onClick={() => removeLine(line.id)} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950/60 font-black">
                    <tr>
                      <td colSpan={2} className="px-8 py-8">
                        <button
                          type="button"
                          onClick={addNewLine}
                          className="flex items-center gap-2 text-blue-500 hover:text-white bg-blue-500/5 hover:bg-blue-600 px-6 py-3 border border-blue-500/20 rounded-2xl font-bold text-xs transition-all shadow-lg"
                        >
                          <Plus className="w-4 h-4" /> {t('journal.expandEntry')}
                        </button>
                      </td>
                      <td className="px-8 py-8 text-right bg-slate-900/40">
                        <span className="text-xs font-medium text-slate-600 block mb-1">Total DR</span>
                        <span className="font-mono text-xl text-emerald-400">${currentEntry.total_debits.toFixed(2)}</span>
                      </td>
                      <td className="px-8 py-8 text-right bg-slate-900/40">
                        <span className="text-xs font-medium text-slate-600 block mb-1">Total CR</span>
                        <span className="font-mono text-xl text-rose-400">${currentEntry.total_credits.toFixed(2)}</span>
                      </td>
                      <td className="bg-slate-900/40"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-800">
                <div className={`flex items-center gap-4 px-8 py-4 rounded-3xl border-2 transition-all ${currentEntry.is_balanced
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                  }`}>
                  {currentEntry.is_balanced ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{currentEntry.is_balanced ? t('journal.validatedProtocol') : t('journal.outOfBalance')}</p>
                    {!currentEntry.is_balanced && (
                      <p className="text-xs font-bold font-mono tracking-tighter">{t('journal.imbalance')} ${Math.abs(currentEntry.total_debits - currentEntry.total_credits).toFixed(2)}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowEntryForm(false)}
                    className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold text-sm px-10 py-5 rounded-2xl transition-all"
                  >
                    {t('journal.discard')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !currentEntry.is_balanced || currentEntry.lines.length < 2}
                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-12 py-5 rounded-2xl transition-all shadow-2xl shadow-blue-900/60 disabled:opacity-20 flex items-center justify-center gap-3"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {t('journal.syncLedger')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};