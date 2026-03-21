import React, { useState } from 'react';
import { BalanceSheet } from '../BalanceSheet';
import { IncomeStatement } from './IncomeStatement';
import { Layout, PieChart, ChevronRight } from 'lucide-react';

import { useLocale } from '../../i18n/useLocale';

export const FinancialStatements: React.FC = () => {
    const { t } = useLocale();
    const [view, setView] = useState<'balance' | 'income'>('balance');

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Premium Tab Navigation */}
            <div className="flex gap-4 p-1.5 bg-slate-950 border border-slate-800 rounded-[2rem] w-fit shadow-2xl no-print mx-auto lg:mx-0">
                <button
                    onClick={() => setView('balance')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.6rem] font-bold text-xs transition-all duration-300 ${view === 'balance'
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 ring-1 ring-blue-500/50'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                        }`}
                >
                    <Layout className={`w-4 h-4 ${view === 'balance' ? 'animate-pulse' : ''}`} />
                    {t('navigation.balanceSheet')}
                </button>
                <button
                    onClick={() => setView('income')}
                    className={`flex items-center gap-3 px-8 py-4 rounded-[1.6rem] font-bold text-xs transition-all duration-300 ${view === 'income'
                        ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 ring-1 ring-emerald-500/50'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                        }`}
                >
                    <PieChart className={`w-4 h-4 ${view === 'income' ? 'animate-pulse' : ''}`} />
                    {t('navigation.incomeStatement')}
                </button>
            </div>

            {/* Dynamic View Panel with Breadcrumb-like indicator */}
            <div className="relative">
                <div className="absolute -top-6 left-8 flex items-center gap-2 no-print">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('navigation.accounting')}</span>
                    <ChevronRight className="w-2.5 h-2.5 text-slate-800" />
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{t('navigation.reportsDashboard')}</span>
                    <ChevronRight className="w-2.5 h-2.5 text-slate-800" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {view === 'balance' ? t('navigation.balanceSheet') : t('navigation.incomeStatement')}
                    </span>
                </div>

                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    {view === 'balance' && <BalanceSheet />}
                    {view === 'income' && <IncomeStatement />}
                </div>
            </div>
        </div>
    );
};
