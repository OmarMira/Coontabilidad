import React, { useState } from 'react';
import {
    Upload, FileText, Check, AlertCircle, Sparkles, ArrowRight, Table,
    Database, Zap, ShieldCheck, Activity, Cpu, Box, Search, Layers, Clock
} from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    confidence: number;
    mappedAccount: string;
}

export const BankStatementImporter: React.FC = () => {
    const { t } = useLocale();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<'upload' | 'analysis' | 'review'>('upload');
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file: File) => {
        setFile(file);
        setStep('analysis');

        // Simulating AI Analysis based on "Pilar 2 & 3" research
        setTimeout(() => {
            const mockData: BankTransaction[] = [
                { id: '1', date: '2026-01-10', description: 'SUNPASS PREPAID MIAMI', amount: -50.00, category: 'Travel', confidence: 0.98, mappedAccount: '5240 - Travel & Auto' },
                { id: '2', date: '2026-01-12', description: 'FL DEPT REVENUE SALES TAX', amount: -1250.40, category: 'Taxes', confidence: 0.99, mappedAccount: '2121 - Sales Tax Payable' },
                { id: '3', date: '2026-01-15', description: 'STRIPE TRANSFER Payout', amount: 4500.00, category: 'Income', confidence: 0.95, mappedAccount: '1112 - Bank Account' },
                { id: '4', date: '2026-01-18', description: 'OFFICE DEPOT #2431', amount: -85.20, category: 'Office', confidence: 0.88, mappedAccount: '5210 - Office Supplies' },
            ];
            setTransactions(mockData);
            setStep('review');
        }, 2500);
    };

    const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-emerald-600/10 rounded-2.5xl border border-emerald-500/20 shadow-emerald-900/10 shadow-lg group">
                        <Sparkles className="w-10 h-10 text-emerald-500 group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('bankStatementImport.title')}</h1>
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> {t('bankStatementImport.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-center">
                    <div className="px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 shadow-lg">
                        <Database className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan de Cuentas v2.8</span>
                    </div>
                    <div className="px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 shadow-lg">
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encryption: IronCore</span>
                    </div>
                </div>
            </div>

            {step === 'upload' && (
                <div
                    className={`h-[450px] bg-slate-900 border-2 rounded-[3.5rem] border-dashed flex flex-col items-center justify-center transition-all duration-500 group relative overflow-hidden ${isDragging ? 'border-emerald-500 bg-emerald-500/5 shadow-2xl shadow-emerald-900/20' : 'border-slate-800 hover:border-slate-700'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none group-hover:bg-emerald-500/10 transition-all"></div>

                    <div className="p-8 bg-emerald-600/10 rounded-full mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                        <Upload className="w-14 h-14 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{t('bankStatementImport.injectCSV')}</h3>
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mb-10">{t('bankStatementImport.compatibility')}</p>

                    <label className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all shadow-2xl shadow-emerald-900/40 cursor-pointer flex items-center gap-3 hover:-translate-y-1">
                        {t('bankStatementImport.selectProtocol')}
                        <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                    </label>
                </div>
            )}

            {step === 'analysis' && (
                <div className="h-[450px] bg-slate-900 border border-slate-800 rounded-[3.5rem] flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
                    <div className="relative mb-10">
                        <div className="w-32 h-32 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin"></div>
                        <Cpu className="w-10 h-10 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{t('bankStatementImport.executingHeuristics')}</h3>
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] max-w-sm mx-auto">{t('bankStatementImport.mappingDesc')}</p>

                    <div className="mt-12 w-80 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                        <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-[loading_2.5s_ease-in-out_infinite]"></div>
                    </div>
                </div>
            )}

            {step === 'review' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <StatusCard label={t('bankStatementImport.transactions')} value={`${transactions.length} ${t('bankStatementImport.items')}`} icon={Layers} color="blue" />
                        <StatusCard label={t('bankStatementImport.aiConfidence')} value={`${t('bankStatementImport.confidential')} (98.4%)`} icon={ShieldCheck} color="emerald" />
                        <StatusCard label={t('bankStatementImport.efficiency')} value={`+45 ${t('bankStatementImport.savedTime')}`} icon={Clock} color="amber" />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50">
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                    <th className="px-8 py-5">{t('bankStatementImport.forensicStatus')}</th>
                                    <th className="px-8 py-5">{t('bankStatementImport.temporalityDesc')}</th>
                                    <th className="px-8 py-5">{t('bankStatementImport.valuation')}</th>
                                    <th className="px-8 py-5">{t('bankStatementImport.aiCategory')}</th>
                                    <th className="px-8 py-5">{t('bankStatementImport.accountingLink')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group/row">
                                        <td className="px-8 py-6 text-center">
                                            {tx.confidence > 0.9 ? (
                                                <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/10 group-hover/row:scale-110 transition-transform">
                                                    <Check className="w-5 h-5 text-emerald-400" />
                                                </div>
                                            ) : (
                                                <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto shadow-lg shadow-amber-900/10">
                                                    <AlertCircle className="w-5 h-5 text-amber-400 font-bold" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 font-mono">{tx.date}</span>
                                            <span className="text-sm font-black text-white uppercase tracking-tighter group-hover/row:text-emerald-400 transition-colors">{tx.description}</span>
                                        </td>
                                        <td className={`px-8 py-6 font-mono font-black text-base tracking-tighter ${tx.amount < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {tx.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/5">
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="relative group/select">
                                                <select className="w-full bg-slate-950 text-white px-4 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 focus:outline-none font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer">
                                                    <option>{tx.mappedAccount.toUpperCase()}</option>
                                                    <option>6210 - RENT EXPENSE</option>
                                                    <option>2110 - ACCOUNTS PAYABLE</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 transition-colors group-focus-within/select:text-emerald-500">
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end gap-6 pt-10 border-t border-slate-800 flex-wrap">
                        <button onClick={() => setStep('upload')} className="px-10 py-5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2.5xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg">
                            {t('bankStatementImport.abortSync')}
                        </button>
                        <button className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-emerald-900/40 hover:-translate-y-1">
                            {t('bankStatementImport.consolidate')} {transactions.length} {t('bankStatementImport.transactions')}
                            <Zap className="w-5 h-5 text-emerald-200" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusCard = ({ label, value, icon: Icon, color }: any) => {
    const themes: any = {
        blue: 'text-blue-500 bg-blue-600/10 border-blue-500/20 shadow-blue-900/5',
        emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20 shadow-emerald-900/5',
        amber: 'text-amber-500 bg-amber-600/10 border-amber-500/20 shadow-amber-900/5',
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl hover:border-slate-700 transition-all flex items-center gap-6 group">
            <div className={`p-4 rounded-2.5xl border ${themes[color]} group-hover:scale-110 transition-all duration-500 shadow-xl`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
                <div className="text-2xl font-black text-white tracking-tighter leading-none mb-1 font-mono uppercase truncate">{value}</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
            </div>
        </div>
    );
};
