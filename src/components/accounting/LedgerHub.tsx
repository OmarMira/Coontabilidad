import React, { useState } from 'react';
import {
    Book,
    BookOpen,
    Layers,
    FileText,
    Search,
    Calendar,
    Download,
    Filter,
    ArrowRightLeft,
    PieChart
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ManualJournalEntries } from '../ManualJournalEntries';
import { GeneralLedger } from '../GeneralLedger';
import { TrialBalanceReport } from './TrialBalanceReport';
import { AccountLedger } from '../reports/AccountLedger';

type HubTab = 'summary' | 'journal' | 'ledger' | 'auxiliary';

interface LedgerHubProps {
    chartOfAccounts: any[];
    onNavigate?: (section: string) => void;
}

export const LedgerHub: React.FC<LedgerHubProps> = ({ chartOfAccounts, onNavigate }) => {
    const [activeTab, setActiveTab] = useState<HubTab>('summary');

    const tabs = [
        { id: 'summary', label: 'Resumen Diario', icon: PieChart },
        { id: 'journal', label: 'Libro Diario', icon: BookOpen },
        { id: 'ledger', label: 'Libro Mayor', icon: Book },
        { id: 'auxiliary', label: 'Auxiliares', icon: Layers },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Book className="w-8 h-8 text-blue-500" />
                        Centro de Libros y Auxiliares
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">
                        Gestión Centralizada de la Integridad Contable
                    </p>
                </div>

                <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as HubTab)}
                            className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}
              `}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'summary' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="bg-slate-900/50 border-slate-800 hover:border-blue-500/30 transition-all cursor-pointer group" onClick={() => setActiveTab('journal')}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <BookOpen className="w-6 h-6 text-blue-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Ver Diario</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">Libro Diario</h3>
                                <p className="text-slate-400 text-sm">Cronología completa de todos los asientos contables procesados.</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer group" onClick={() => setActiveTab('ledger')}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <Book className="w-6 h-6 text-emerald-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ver Mayor</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">Libro Mayor</h3>
                                <p className="text-slate-400 text-sm">Saldos consolidados por cuenta con detalle de movimientos.</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/30 transition-all cursor-pointer group" onClick={() => setActiveTab('auxiliary')}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        <Layers className="w-6 h-6 text-purple-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Auxiliares</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">Auxiliares</h3>
                                <p className="text-slate-400 text-sm">Control detallado de cuentas específicas y terceros.</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'journal' && (
                    <ManualJournalEntries
                        chartOfAccounts={chartOfAccounts}
                        onEntryCreated={() => { }}
                    />
                )}

                {activeTab === 'ledger' && (
                    <GeneralLedger chartOfAccounts={chartOfAccounts} />
                )}

                {activeTab === 'auxiliary' && (
                    <AccountLedger />
                )}
            </div>
        </div>
    );
};
