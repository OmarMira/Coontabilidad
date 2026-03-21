import React, { useState, useEffect } from 'react';
import { PieChart, Search, Calendar, RefreshCw, AlertCircle, ArrowLeftRight, FileBarChart } from 'lucide-react';
import { getAccountLedger } from '@/database/modules/db-company';
import { getChartOfAccounts } from '@/database/modules/db-journal';
import { ReportExporter } from './ReportExporter';
import { logger } from '../../core/logging/SystemLogger';
import { useLocale } from '../../i18n/useLocale';

export const AccountLedger: React.FC = () => {
    const { t } = useLocale();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const list = getChartOfAccounts();
        setAccounts(list);
        if (list.length > 0) setSelectedAccount(list[0].account_code);
    }, []);

    const loadData = async () => {
        if (!selectedAccount) return;
        try {
            setLoading(true);
            setError(null);
            const result = getAccountLedger(selectedAccount, dateRange.from, dateRange.to);
            setData(result);
            logger.info('AccountLedger', 'load_success', `Auxiliar cargado: ${selectedAccount}`);
        } catch (e) {
            setError(t('reportsDashboard.accountLedger.loadError') || 'Error loading account ledger');
            logger.error('AccountLedger', 'load_failed', 'Fallo al cargar ledger', { accountCode: selectedAccount }, e as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedAccount, dateRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getExportData = () => {
        if (!data) return { headers: [], rows: [], fileName: '' };
        const rows = data.transactions.map((tx: any) => [
            tx.entry_date,
            tx.reference || '',
            tx.description,
            formatCurrency(tx.debit_amount),
            formatCurrency(tx.credit_amount),
            formatCurrency(tx.running_balance)
        ]);

        // Add Summary Row
        rows.push(['---', '---', t('reportsDashboard.accountLedger.periodTotals') || 'PERIOD TOTALS', formatCurrency(data.totalDebit), formatCurrency(data.totalCredit), '']);

        return {
            headers: [t('common.date'), t('accounting.reference') || 'Ref', t('common.description'), t('accounting.debit'), t('accounting.credit'), t('accounting.balance') || 'Balance'],
            rows,
            fileName: `Auxiliar_${selectedAccount}_${dateRange.from}_a_${dateRange.to}`
        };
    };

    return (
        <div className="space-y-8 animate-fade-in px-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <PieChart className="w-8 h-8 text-blue-400" />
                        </div>
                        {t('reportsDashboard.accountLedger.title')}
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">{t('reportsDashboard.accountLedger.subtitle')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
                        <Search className="w-4 h-4 text-slate-600" />
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="bg-transparent text-white text-xs font-black focus:outline-none cursor-pointer max-w-[200px]"
                        >
                            {accounts.map(acc => (
                                <option key={acc.account_code} value={acc.account_code} className="bg-slate-900 text-white">
                                    {acc.number ? `${acc.number} - ` : ''}{acc.account_code} - {acc.account_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="bg-transparent text-white text-xs font-black focus:outline-none underline decoration-blue-500/30"
                        />
                        <span className="text-slate-600 text-xs uppercase font-black">{t('reportsDashboard.accountLedger.dateFrom') || 'TO'}</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="bg-transparent text-white text-xs font-black focus:outline-none underline decoration-blue-500/30"
                        />
                    </div>

                    <button onClick={loadData} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors">
                        <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {data && data.account && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Info Cards */}
                    <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card-elite !p-6 flex flex-col justify-between border-l-4 border-l-blue-500">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('reportsDashboard.accountLedger.startingBalance')}</span>
                            <div className="text-2xl font-black text-white mt-1">{formatCurrency(data.startingBalance)}</div>
                        </div>
                        <div className="card-elite !p-6 flex flex-col justify-between border-l-4 border-l-emerald-500">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('reportsDashboard.accountLedger.netMovements')}</span>
                            <div className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(data.totalDebit - data.totalCredit)}</div>
                        </div>
                        <div className="card-elite !p-6 flex flex-col justify-between border-l-4 border-l-white">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('reportsDashboard.accountLedger.endingBalance')}</span>
                            <div className="text-2xl font-black text-white mt-1">{formatCurrency(data.endingBalance)}</div>
                        </div>
                    </div>

                    {/* Ledger Table */}
                    <div className="lg:col-span-8">
                        <div className="card-elite !p-0">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-table-header">{t('reportsDashboard.accountLedger.ledgerTitle')}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="badge-elite bg-blue-500/10 text-blue-400 border-blue-500/20">{data.account.number || data.account.account_code}</span>
                                    <span className="text-xs font-black text-white">{data.account.account_name}</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5">
                                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <th className="px-6 py-4">{t('common.date')}</th>
                                            <th className="px-6 py-4">{t('accounting.reference') || 'Referencia'}</th>
                                            <th className="px-6 py-4">{t('common.description')}</th>
                                            <th className="px-6 py-4 text-right">{t('accounting.debit')}</th>
                                            <th className="px-6 py-4 text-right">{t('accounting.credit')}</th>
                                            <th className="px-6 py-4 text-right">{t('accounting.balance') || 'Saldo'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {data.transactions.map((tx: any, i: number) => (
                                            <tr key={i} className="hover:bg-white/5 transition-all group">
                                                <td className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{tx.entry_date}</td>
                                                <td className="px-6 py-4 text-xs font-black text-blue-400 uppercase">{tx.reference || '---'}</td>
                                                <td className="px-6 py-4 text-xs text-white max-w-[250px] truncate" title={tx.description}>{tx.description}</td>
                                                <td className="px-6 py-4 text-right text-xs font-bold text-white">{tx.debit_amount > 0 ? formatCurrency(tx.debit_amount) : '---'}</td>
                                                <td className="px-6 py-4 text-right text-xs font-bold text-white">{tx.credit_amount > 0 ? formatCurrency(tx.credit_amount) : '---'}</td>
                                                <td className="px-6 py-4 text-right text-xs font-black text-emerald-400 tabular-nums">{formatCurrency(tx.running_balance)}</td>
                                            </tr>
                                        ))}

                                        {data.transactions.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center">
                                                    <FileBarChart className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                                                    <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">{t('reportsDashboard.accountLedger.noMovements') || 'No movements in this period'}</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot className="bg-white/5">
                                        <tr className="text-xs font-black text-white">
                                            <td colSpan={3} className="px-6 py-4 text-right uppercase tracking-widest text-slate-600">{t('reportsDashboard.accountLedger.periodTotals')}</td>
                                            <td className="px-6 py-4 text-right">{formatCurrency(data.totalDebit)}</td>
                                            <td className="px-6 py-4 text-right">{formatCurrency(data.totalCredit)}</td>
                                            <td className="px-6 py-4 text-right text-emerald-400">{formatCurrency(data.endingBalance)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Export & Actions Side */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="card-elite !p-6">
                            <h3 className="text-table-header mb-6">{t('common.tools')}</h3>
                            <ReportExporter
                                data={getExportData()}
                                header={{
                                    title: t('reportsDashboard.accountLedger.ledgerTitle'),
                                    subtitle: `${data.account.account_code} - ${data.account.account_name}`,
                                    dateRange: `${dateRange.from} ${t('reportsDashboard.accountLedger.dateFrom')} ${dateRange.to}`
                                }}
                            />
                        </div>

                        <div className="card-elite !p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">{t('reportsDashboard.accountLedger.nature')}</h3>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600">{t('reportsDashboard.accountLedger.normalBalance')}:</span>
                                <span className="badge-elite bg-blue-500/10 text-blue-400 uppercase">{data.account.normal_balance}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600">{t('accounting.accountType')}:</span>
                                <span className="badge-elite bg-white/5 text-white uppercase">{data.account.account_type}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4">
                    <AlertCircle className="w-8 h-8 text-rose-400" />
                    <div>
                        <span className="text-white font-bold block">{t('common.error')}</span>
                        <p className="text-sm text-slate-600">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
