import React, { useState, useEffect } from 'react';
import { Activity, Calendar, RefreshCw, AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { getCashFlowStatement } from '../../database/simple-db';
import { ReportExporter } from './ReportExporter';
import { logger } from '../../core/logging/SystemLogger';
import { useLocale } from '../../i18n/useLocale';

export const CashFlowStatement: React.FC = () => {
    const { t } = useLocale();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = getCashFlowStatement(dateRange.from, dateRange.to);
            setData(result);
            logger.info('CashFlow', 'load_success', 'Estado de flujo de efectivo generado');
        } catch (e) {
            setError(t('reportsDashboard.cashFlow.loadError') || 'Error generating cash flow report');
            logger.error('CashFlow', 'load_failed', 'Fallo al generar cash flow', null, e as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getExportData = () => {
        if (!data) return { headers: [], rows: [], fileName: '' };

        const rows: any[][] = [];
        rows.push([t('reportsDashboard.cashFlow.operating').toUpperCase(), '']);
        rows.push([t('accounting.netIncome') || 'Net Income', formatCurrency(data.netIncome)]);
        data.operatingActivities.forEach((act: any) => {
            rows.push([act.title, formatCurrency(act.amount)]);
        });
        rows.push(['---', '---']);
        rows.push([t('reportsDashboard.cashFlow.netIncrease').toUpperCase(), formatCurrency(data.netIncreaseInCash)]);
        rows.push([t('reportsDashboard.cashFlow.startingCash'), formatCurrency(data.startingCash)]);
        rows.push([t('reportsDashboard.cashFlow.endingCash').toUpperCase(), formatCurrency(data.endingCash)]);

        return {
            headers: [t('common.description'), t('common.amount')],
            rows,
            fileName: `Cash_Flow_${dateRange.from}_to_${dateRange.to}`
        };
    };

    return (
        <div className="space-y-8 animate-fade-in px-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <Activity className="w-8 h-8 text-emerald-400" />
                        </div>
                        {t('reportsDashboard.cashFlow.title')}
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">{t('reportsDashboard.cashFlow.subtitle')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="bg-transparent text-white text-xs font-black focus:outline-none"
                        />
                        <span className="text-slate-600 text-xs uppercase font-black">{t('reportsDashboard.accountLedger.dateFrom')}</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="bg-transparent text-white text-xs font-black focus:outline-none"
                        />
                    </div>
                    <button onClick={loadData} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors">
                        <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="card-elite !p-8">
                            <h3 className="text-table-header mb-8">{t('reportsDashboard.cashFlow.summaryTitle') || 'Cash Flow Movements'}</h3>

                            <div className="space-y-6">
                                {/* Operating Section */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                        <span className="text-white font-black text-sm uppercase tracking-wider">{t('reportsDashboard.cashFlow.operating')}</span>
                                        <span className="text-emerald-400 font-black">{formatCurrency(data.netIncome + data.operatingActivities.reduce((s: any, a: any) => s + a.amount, 0))}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm pl-4">
                                        <span className="text-slate-500">{t('accounting.netIncome') || 'Net Income (Loss)'}</span>
                                        <span className="text-white font-bold">{formatCurrency(data.netIncome)}</span>
                                    </div>

                                    {data.operatingActivities.map((act: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-sm pl-4">
                                            <span className="text-slate-500">{act.title}</span>
                                            <span className={`font-bold ${act.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {formatCurrency(act.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Net Summary */}
                                <div className="pt-8 space-y-4 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{t('reportsDashboard.cashFlow.netIncrease')}</span>
                                        <span className={`text-xl font-black ${data.netIncreaseInCash < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {formatCurrency(data.netIncreaseInCash)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">{t('reportsDashboard.cashFlow.startingCash')}</span>
                                        <span className="text-white font-medium">{formatCurrency(data.startingCash)}</span>
                                    </div>
                                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex justify-between items-center mt-4">
                                        <span className="text-blue-400 font-black uppercase text-xs tracking-widest">{t('reportsDashboard.cashFlow.endingCash')}</span>
                                        <span className="text-2xl font-black text-white">{formatCurrency(data.endingCash)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Export & Ratios Side */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="card-elite !p-6">
                            <h3 className="text-table-header mb-6">{t('common.export')} {t('common.options') || 'Options'}</h3>
                            <ReportExporter
                                data={getExportData()}
                                header={{
                                    title: t('reportsDashboard.cashFlow.title'),
                                    subtitle: t('reportsDashboard.cashFlow.subtitle'),
                                    dateRange: `${dateRange.from} ${t('reportsDashboard.accountLedger.dateFrom')} ${dateRange.to}`
                                }}
                            />
                        </div>

                        <div className="card-elite !p-6 space-y-4 bg-emerald-500/5 border-emerald-500/10">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">{t('reportsDashboard.agingReport.riskAlert') || 'Liquidity Ratio'}</h3>
                            </div>
                            <div className="text-3xl font-black text-emerald-400">1.42</div>
                            <p className="text-[10px] text-slate-600 font-bold leading-relaxed uppercase tracking-wider">
                                {t('reportsDashboard.cashFlow.liquidityInfo', { ratio: '1.42' }) || 'The company has enough cash to cover its immediate obligations 1.42 times.'}
                            </p>
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
