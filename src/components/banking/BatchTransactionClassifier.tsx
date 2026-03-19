import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import {
    X,
    CheckCircle2,
    Search,
    Save,
    Zap,
    ShieldCheck,
    Target,
    ArrowRight,
    Plus
} from 'lucide-react';
import { BankImportService } from '../../services/banking/BankImportService';
import { ClassificationRulesService } from '../../services/banking/ClassificationRulesService';
import type { ChartOfAccount } from '@/database/modules/db-types';
import { getChartOfAccounts } from '@/database/modules/db-journal';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface BatchTransactionClassifierProps {
    batchId: number;
    onClose: () => void;
}

interface ClassifiedTransaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    accountCode: string;
    accountName: string;
    createRule: boolean;
    isAutoMatched: boolean;
}

export const BatchTransactionClassifier: React.FC<BatchTransactionClassifierProps> = ({ batchId, onClose }) => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<ClassifiedTransaction[]>([]);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const importService = new BankImportService();

    useEffect(() => {
        loadData();
    }, [batchId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const allAccounts = getChartOfAccounts();
            setAccounts(allAccounts);

            logger.info('BatchTransactionClassifier', 'info', 'BatchTransactionClassifier: loading batchId:', batchId);
            const batchTxns = await importService.getBatchTransactions(batchId);
            logger.info('BatchTransactionClassifier', 'info', 'BatchTransactionClassifier: transactions from service:', batchTxns);

            const processed: ClassifiedTransaction[] = [];
            for (const tx of batchTxns) {
                // Try rule matching
                const ruleMatch = await ClassificationRulesService.evaluateTransaction(tx.description);

                processed.push({
                    id: tx.id,
                    date: tx.transaction_date,
                    description: tx.description,
                    amount: tx.amount,
                    accountCode: ruleMatch?.account_code || tx.assigned_account_code || '',
                    accountName: ruleMatch?.account_name || tx.assigned_account_name || '',
                    createRule: false,
                    isAutoMatched: !!ruleMatch
                });
            }
            logger.info('BatchTransactionClassifier', 'info', 'BatchTransactionClassifier: processed transactions:', processed);
            setTransactions(processed);
        } catch (error) {
            toast.error('Error al cargar transacciones del batch');
        } finally {
            setLoading(false);
        }
    };

    const updateTransaction = (id: number, updates: Partial<ClassifiedTransaction>) => {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleConfirm = async () => {
        const unclassified = transactions.filter(t => !t.accountCode);
        if (unclassified.length > 0) {
            toast.error(`AÃºn faltan ${unclassified.length} transacciones por clasificar`);
            return;
        }

        setSaving(true);
        try {
            await importService.classifyAndFinalizeBatch(batchId, user?.id || 1, transactions);
            toast.success('Batch certificado e inyectado en el Libro Mayor');
            onClose();
        } catch (error) {
            toast.error('Fallo en la inyecciÃ³n contable: ' + (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[80]">
                <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center z-[80] p-6 lg:p-12">
            <div className="bg-slate-900 border-2 border-slate-800 rounded-[4rem] shadow-4xl w-full max-w-7xl h-full flex flex-col relative animate-in zoom-in-95 duration-700 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

                <header className="flex items-center justify-between p-10 border-b border-slate-800 bg-slate-900/50 relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="p-5 bg-indigo-600/10 rounded-2.5xl border border-indigo-500/20 text-indigo-500 shadow-xl">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">ClasificaciÃ³n Certificada</h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                                <Target className="w-3.5 h-3.5 text-indigo-500" /> Batch Processing :: ID #{batchId}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg">
                        <X className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
                    <div className="bg-slate-950 border-2 border-slate-800 rounded-[3rem] overflow-hidden shadow-3xl">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/80 sticky top-0 z-20">
                                <tr className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                    <th className="px-8 py-6">Fecha</th>
                                    <th className="px-8 py-6">DescripciÃ³n</th>
                                    <th className="px-8 py-6 text-right">Monto</th>
                                    <th className="px-8 py-6">Cuenta Contable</th>
                                    <th className="px-8 py-6 text-center">Protocolo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className={`hover:bg-white/[0.02] transition-all group ${tx.accountCode ? '' : 'bg-amber-500/[0.02]'}`}>
                                        <td className="px-8 py-6 text-[10px] font-black text-slate-400 font-mono">{tx.date}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-white uppercase tracking-tighter truncate max-w-[300px]">{tx.description}</span>
                                                {tx.isAutoMatched && (
                                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">Rule Applied</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`px-8 py-6 text-right font-mono font-black text-sm tracking-tighter ${tx.amount < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            ${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-[10px] font-black text-white uppercase tracking-widest focus:border-indigo-500/50 outline-none transition-all"
                                                    value={tx.accountCode}
                                                    onChange={(e) => {
                                                        const acc = accounts.find(a => a.account_code === e.target.value);
                                                        updateTransaction(tx.id, {
                                                            accountCode: e.target.value,
                                                            accountName: acc?.account_name || '',
                                                            isAutoMatched: false
                                                        });
                                                    }}
                                                >
                                                    <option value="">-- SELECCIONAR CUENTA --</option>
                                                    {accounts.map(acc => (
                                                        <option key={acc.account_code} value={acc.account_code}>
                                                            {acc.account_code} - {acc.account_name.toUpperCase()}
                                                        </option>
                                                    ))}
                                                </select>
                                                {tx.accountCode && !tx.isAutoMatched && (
                                                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={tx.createRule}
                                                            onChange={(e) => updateTransaction(tx.id, { createRule: e.target.checked })}
                                                            className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                                                        />
                                                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Recordar para futuras transacciones</span>
                                                    </label>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {tx.accountCode ? (
                                                <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mx-auto text-emerald-500 shadow-lg shadow-emerald-950/20 transition-all scale-110">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center mx-auto text-amber-500 animate-pulse">
                                                    <Zap className="w-4 h-4 fill-current" />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>

                <footer className="p-10 border-t border-slate-800 bg-slate-950/50 relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Progreso de ClasificaciÃ³n</span>
                            <span className="text-xl font-black text-white font-mono tracking-tighter">
                                {transactions.filter(t => t.accountCode).length} / {transactions.length}
                            </span>
                        </div>
                        <div className="w-48 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div
                                className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-700"
                                style={{ width: `${(transactions.filter(t => t.accountCode).length / transactions.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <button onClick={onClose} className="px-10 py-5 bg-slate-950 border border-slate-800 text-slate-500 rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-slate-800">
                            ABORTAR
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={saving || transactions.filter(t => t.accountCode).length === 0}
                            className="px-14 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all shadow-3xl shadow-indigo-900/50 hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center gap-4"
                        >
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Zap className="w-4 h-4 fill-current" />}
                            {saving ? 'INYECTANDO...' : 'CONFIRMAR E INYECTAR'}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
