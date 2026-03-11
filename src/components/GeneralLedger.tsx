import React, { useState, useEffect } from 'react';
import { Search, Calendar, FileText, BarChart3, Download, ArrowRight, ArrowDownCircle, ChevronRight, TrendingUp, TrendingDown, History, ShieldCheck, Box, Loader2 } from 'lucide-react';
import { ChartOfAccount, getAccountLedger } from '@/database/simple-db';
import { useLocale } from '../i18n/useLocale';

interface LedgerEntry {
  id: number;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  source_type: 'invoice' | 'bill' | 'journal_entry' | 'payment';
  source_id: number;
}

interface AccountLedger {
  account: ChartOfAccount;
  opening_balance: number;
  entries: LedgerEntry[];
  closing_balance: number;
  total_debits: number;
  total_credits: number;
}

interface GeneralLedgerProps {
  chartOfAccounts: ChartOfAccount[];
}

export const GeneralLedger: React.FC<GeneralLedgerProps> = ({ chartOfAccounts }) => {
  const { t } = useLocale();
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const [accountLedger, setAccountLedger] = useState<AccountLedger | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedAccount) {
      loadAccountLedger();
    }
  }, [selectedAccount, dateFrom, dateTo]);

  const loadAccountLedger = async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    try {
      const result = getAccountLedger(selectedAccount.account_code, dateFrom, dateTo);

      if (!result || !result.account) {
        setAccountLedger(null);
        return;
      }

      setAccountLedger({
        account: selectedAccount,
        opening_balance: result.startingBalance,
        entries: result.transactions.map((tx: any, idx: number) => ({
          id: tx.journal_id || idx,
          date: tx.entry_date,
          reference: tx.reference,
          description: tx.description,
          debit: tx.debit_amount,
          credit: tx.credit_amount,
          balance: tx.running_balance,
          source_type: 'journal_entry',
          source_id: tx.journal_id
        })),
        closing_balance: result.endingBalance,
        total_debits: result.totalDebit,
        total_credits: result.totalCredit
      });
    } catch (error) {
      console.error('Core Ledger Load Error:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  };

  const filteredAccounts = chartOfAccounts.filter(account => {
    const matchesSearch = account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_code.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && account.account_type === filterType;
  });

  const getAccountTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      asset: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      liability: 'bg-red-500/10 text-red-500 border-red-500/20',
      equity: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      revenue: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      expense: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    };
    const labels: Record<string, string> = {
      asset: t('common.asset'),
      liability: t('common.liability'),
      equity: t('common.equity'),
      revenue: t('common.revenue'),
      expense: t('common.expense')
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${styles[type] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search and Filters Strip */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 ml-1">{t('ledger.searchAccount')}</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder={t('ledger.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 ml-1">{t('ledger.structure')}</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-bold text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              <option value="all">{t('ledger.all')}</option>
              <option value="asset">{t('common.asset')}</option>
              <option value="liability">{t('common.liability')}</option>
              <option value="equity">{t('common.equity')}</option>
              <option value="revenue">{t('common.revenue')}</option>
              <option value="expense">{t('common.expense')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 ml-1">{t('ledger.from')}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 ml-1">{t('ledger.to')}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white font-mono text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Registry (Sidebar of GL) */}
        <div className="lg:col-span-1 border border-slate-800 rounded-[2rem] bg-slate-950/30 overflow-hidden flex flex-col h-[700px]">
          <div className="px-6 py-5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">{t('ledger.masterPlan')}</span>
            <Box className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredAccounts.map((account) => (
              <button
                key={account.id}
                onClick={() => setSelectedAccount(account)}
                className={`w-full text-left px-6 py-5 border-b border-slate-800/50 hover:bg-slate-800/20 transition-all group flex items-start justify-between ${selectedAccount?.id === account.id ? 'bg-blue-600/10 border-l-4 border-l-blue-600' : ''
                  }`}
              >
                <div className="space-y-1">
                  <p className={`text-xs font-bold tracking-tight transition-colors ${selectedAccount?.id === account.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                    {account.number ? `${account.number} (${account.account_code})` : account.account_code}
                  </p>
                  <p className={`text-sm font-medium truncate max-w-[150px] ${selectedAccount?.id === account.id ? 'text-blue-400' : 'text-slate-500'}`}>
                    {account.account_name}
                  </p>
                  {getAccountTypeBadge(account.account_type)}
                </div>
                {selectedAccount?.id === account.id && <ChevronRight className="w-4 h-4 text-blue-500 mt-2" />}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Ledger Data View */}
        <div className="lg:col-span-3">
          {selectedAccount ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl h-full flex flex-col">
              <header className="px-10 py-8 bg-slate-950/40 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                  <div>
                    <div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        {selectedAccount.number ? `${selectedAccount.number} (${selectedAccount.account_code})` : selectedAccount.account_code} <span className="text-slate-500 mx-2">•</span> {selectedAccount.account_name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        {getAccountTypeBadge(selectedAccount.account_type)}
                        <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" /> {new Date(dateFrom).toLocaleDateString()} — {new Date(dateTo).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-xl shadow-emerald-900/10 flex items-center gap-2">
                  <Download className="w-4 h-4" /> {t('ledger.export')}
                </button>
              </header>

              <div className="flex-1 overflow-auto bg-grid-slate-900/10">
                {isLoading ? (
                  <div className="py-40 flex flex-col items-center gap-5">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-xs font-medium text-slate-500">{t('ledger.querying')}</p>
                  </div>
                ) : accountLedger ? (
                  <>
                    {/* High Impact KPIs Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-800 bg-slate-950/30">
                      <div className="p-8 border-r border-slate-800/50">
                        <span className="text-xs font-medium text-slate-500 block mb-2">{t('ledger.opening')}</span>
                        <p className="text-lg font-black text-white font-mono">${accountLedger.opening_balance.toFixed(2)}</p>
                      </div>
                      <div className="p-8 border-r border-slate-800/50 group hover:bg-emerald-500/5 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-emerald-500 block">{t('ledger.debits')}</span>
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                        </div>
                        <p className="text-lg font-black text-emerald-400 font-mono">${accountLedger.total_debits.toFixed(2)}</p>
                      </div>
                      <div className="p-8 border-r border-slate-800/50 group hover:bg-rose-500/5 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-rose-500 block">{t('ledger.credits')}</span>
                          <TrendingDown className="w-3 h-3 text-rose-500" />
                        </div>
                        <p className="text-lg font-black text-rose-400 font-mono">${accountLedger.total_credits.toFixed(2)}</p>
                      </div>
                      <div className="p-8">
                        <span className="text-xs font-black text-blue-500 block mb-2">{t('ledger.finalPointer')}</span>
                        <p className={`text-lg font-black font-mono ${accountLedger.closing_balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          ${accountLedger.closing_balance.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Transactions Table */}
                    <table className="w-full border-collapse">
                      <thead className="bg-slate-950/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="px-8 py-5">{t('ledger.date')}</th>
                          <th className="px-8 py-5">{t('ledger.accountingRef')}</th>
                          <th className="px-8 py-5">{t('ledger.movementDescription')}</th>
                          <th className="px-8 py-5 text-right">{t('common.debit')}</th>
                          <th className="px-10 py-5 text-right">{t('common.credit')}</th>
                          <th className="px-10 py-5 text-right bg-slate-950/80">{t('ledger.accumulatedBalance')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {accountLedger.entries.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-800/20 transition-all">
                            <td className="px-8 py-6 font-mono text-xs text-slate-500 font-bold">{new Date(entry.date).toLocaleDateString()}</td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg">
                                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <span className="text-[11px] font-bold text-white tracking-wide">{entry.reference}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-slate-400 font-bold text-xs italic">{entry.description}</td>
                            <td className="px-8 py-6 text-right font-mono font-black text-emerald-500/80 text-sm">
                              {entry.debit > 0 ? entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="px-10 py-6 text-right font-mono font-black text-rose-500/80 text-sm">
                              {entry.credit > 0 ? entry.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                            </td>
                            <td className="px-10 py-6 text-right font-mono font-black text-slate-100 bg-slate-900/40 text-sm">
                              ${entry.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center bg-slate-900/20">
              <div className="w-24 h-24 bg-slate-900 rounded-[2rem] border border-slate-800 flex items-center justify-center mb-6 opacity-30">
                <ArrowDownCircle className="w-12 h-12 text-slate-600 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-slate-500 tracking-tight">{t('ledger.selectNode')}</h3>
              <p className="text-xs font-medium text-slate-600 mt-3 max-w-xs leading-relaxed">{t('ledger.selectNodeHelp')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};