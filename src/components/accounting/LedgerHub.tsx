import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import {
    Book,
    BookOpen,
    Layers,
    FileText,
    PieChart as PieChartIcon,
    ArrowRight,
    History,
    Search,
    Download,
    Filter,
    ArrowRightLeft,
    ShieldCheck
} from 'lucide-react';
import { GeneralLedger } from '../GeneralLedger';
import { ManualJournalEntries } from '../ManualJournalEntries';
import { AccountLedger } from '../reports/AccountLedger';
import { useLocale } from '../../i18n/useLocale';

type HubTab = 'summary' | 'journal' | 'ledger' | 'auxiliary';

interface LedgerHubProps {
    chartOfAccounts: any[];
    onNavigate?: (section: string) => void;
}

export const LedgerHub: React.FC<LedgerHubProps> = ({ chartOfAccounts = [], onNavigate }) => {
    const { t } = useLocale();
    const [activeTab, setActiveTab] = useState<HubTab>('summary');
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        logger.info('LedgerHub', 'info', 'LedgerHub Protocol Initialized', { activeTab, session: new Date().toISOString() });
    }, [activeTab]);

    if (hasError) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-red-900/10 border-2 border-red-500/30 rounded-3xl text-center space-y-6 animate-in zoom-in duration-300">
                <div className="p-4 bg-red-600/20 rounded-2xl border border-red-500/40">
                    <ShieldCheck className="w-12 h-12 text-red-500" />
                </div>
                <div className="space-y-2">
                    <h3 className="font-bold text-2xl text-white tracking-tight">{t('accounting.ledgerHub.errorTitle')}</h3>
                    <p className="text-red-200/60 font-medium max-w-md mx-auto italic">{t('accounting.ledgerHub.errorDesc')}</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm px-8 py-3 rounded-xl transition-all shadow-xl shadow-red-900/30"
                >
                    {t('accounting.ledgerHub.restartProtocols')}
                </button>
            </div>
        );
    }

    const tabs = [
        { id: 'summary', label: t('accounting.ledgerHub.controlCenter'), icon: PieChartIcon },
        { id: 'journal', label: t('accounting.ledgerHub.journalEntries'), icon: BookOpen },
        { id: 'ledger', label: t('accounting.ledgerHub.ledgerValidation'), icon: Book },
        { id: 'auxiliary', label: t('accounting.ledgerHub.auxiliaries'), icon: Layers },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500 pb-12">
            {/* Main Navigation Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Book className="w-8 h-8 text-blue-500" />
                        {t('accounting.ledgerHub.title')}
                    </h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                        {t('accounting.ledgerHub.subtitle')}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-inner">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as HubTab)}
                            className={`
                                flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-bold transition-all duration-300
                                ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/40 translate-y-[-2px]'
                                    : 'text-slate-500 hover:text-white hover:bg-slate-900'}
                            `}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-600 transition-colors group-hover:text-white'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content with Dynamic Layouts */}
            <div className="animate-in slide-in-from-bottom-6 duration-700">
                {activeTab === 'summary' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Interactive Entry Cards */}
                        <div
                            className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 hover:border-blue-500/40 transition-all cursor-pointer group relative overflow-hidden shadow-xl"
                            onClick={() => setActiveTab('journal')}
                        >
                            <div className="absolute top-0 right-0 p-3 bg-blue-600/20 rounded-bl-3xl border-l border-b border-blue-500/20 group-hover:bg-blue-600 transition-colors">
                                <ArrowRight className="w-5 h-5 text-blue-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
                            </div>
                            <div className="space-y-6">
                                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 w-fit group-hover:scale-110 transition-transform shadow-lg">
                                    <BookOpen className="w-8 h-8 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight mb-2">{t('accounting.ledgerHub.dailyBook')}</h3>
                                    <p className="text-slate-400 font-medium text-sm leading-relaxed">{t('accounting.ledgerHub.dailyBookDesc')}</p>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-medium text-slate-500">{t('accounting.ledgerHub.realTimeSync')}</span>
                                </div>
                            </div>
                        </div>

                        <div
                            className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 hover:border-emerald-500/40 transition-all cursor-pointer group relative overflow-hidden shadow-xl"
                            onClick={() => setActiveTab('ledger')}
                        >
                            <div className="absolute top-0 right-0 p-3 bg-emerald-600/20 rounded-bl-3xl border-l border-b border-emerald-500/20 group-hover:bg-emerald-600 transition-colors">
                                <ArrowRight className="w-5 h-5 text-emerald-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
                            </div>
                            <div className="space-y-6">
                                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 w-fit group-hover:scale-110 transition-transform shadow-lg">
                                    <Book className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight mb-2">{t('accounting.ledgerHub.generalLedger')}</h3>
                                    <p className="text-slate-400 font-medium text-sm leading-relaxed">{t('accounting.ledgerHub.generalLedgerDesc')}</p>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
                                    <History className="w-3.5 h-3.5 text-slate-600" />
                                    <span className="text-xs font-medium text-slate-500">{t('accounting.ledgerHub.lastClosure', { date: 'Dic 2024' })}</span>
                                </div>
                            </div>
                        </div>

                        <div
                            className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 hover:border-purple-500/40 transition-all cursor-pointer group relative overflow-hidden shadow-xl"
                            onClick={() => setActiveTab('auxiliary')}
                        >
                            <div className="absolute top-0 right-0 p-3 bg-purple-600/20 rounded-bl-3xl border-l border-b border-purple-500/20 group-hover:bg-purple-600 transition-colors">
                                <ArrowRight className="w-5 h-5 text-purple-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
                            </div>
                            <div className="space-y-6">
                                <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 w-fit group-hover:scale-110 transition-transform shadow-lg">
                                    <Layers className="w-8 h-8 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight mb-2">{t('accounting.ledgerHub.auxiliariesTitle')}</h3>
                                    <p className="text-slate-400 font-medium text-sm leading-relaxed">{t('accounting.ledgerHub.auxiliariesDesc')}</p>
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                                    <span className="text-xs font-medium text-slate-500">{t('accounting.ledgerHub.validatedUsGaap')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-slate-950/30 rounded-3xl p-1 border border-slate-800 shadow-2xl backdrop-blur-md min-h-[600px]">
                    {activeTab === 'journal' && (
                        <ManualJournalEntries
                            chartOfAccounts={chartOfAccounts || []}
                            onEntryCreated={() => { }}
                        />
                    )}

                    {activeTab === 'ledger' && (
                        <GeneralLedger chartOfAccounts={chartOfAccounts || []} />
                    )}

                    {activeTab === 'auxiliary' && (
                        <AccountLedger />
                    )}
                </div>
            </div>
        </div>
    );
};
