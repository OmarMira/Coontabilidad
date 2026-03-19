import { logger } from '../core/logging/SystemLogger';
import React, { useState } from 'react';
import {
    Upload, FileText, Check, AlertCircle, Sparkles, ArrowRight, Table,
    Database, Zap, ShieldCheck, Activity, Cpu, Box, Search, Layers, Clock, X, Building2
} from 'lucide-react';
import { parseBankPDF } from '../lib/pdf-parser';
import type { BankAccount } from '@/database/modules/db-types';
import { getBankAccounts, createBankAccount } from '@/database/modules/db-bank-accounts';
import { insertBankTransactions } from '@/database/modules/db-bank-transactions';
import { forceSaveDB } from '@/database/modules/db-persistence';
import { BankAccountForm } from './BankAccountForm';

interface BankTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    confidence: number;
    mappedAccount: string;
}

interface BankStatementImporterProps {
    onImportComplete?: (count: number) => void;
}

export const BankStatementImporter: React.FC<BankStatementImporterProps> = ({ onImportComplete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [step, setStep] = useState<'upload' | 'analysis' | 'review'>('upload');
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [openingBalance, setOpeningBalance] = useState<number | null>(null);
    const [openingDate, setOpeningDate] = useState<string | null>(null);
    const [endingBalance, setEndingBalance] = useState<number | null>(null);
    const [endingDate, setEndingDate] = useState<string | null>(null);
    const [accountNumber, setAccountNumber] = useState<string | null>(null);
    const [bankName, setBankName] = useState<string | null>(null);
    const [routingNumber, setRoutingNumber] = useState<string | null>(null);
    const [accountStatus, setAccountStatus] = useState<'valid' | 'missing' | 'inactive'>('valid');
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = async (selectedFiles: File[]) => {
        setFiles(selectedFiles);
        setStep('analysis');
        setProcessingProgress(0);

        try {
            const allTransactions: BankTransaction[] = [];
            let globalOpening: number | null = null;
            let globalEnding: number | null = null;
            let detectedAcc: string | null = null;
            let detectedBank: string | null = null;
            let detectedRouting: string | null = null;

            // Collect results with date context for sorting
            const resultsWithContext: any[] = [];

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const results = await parseBankPDF(file);

                const mappedTransactions = ((results as any).transactions || (results as any).data || [])
                    .filter((r: any) => r.success && r.data)
                    .map((r: any, txIdx: number) => ({
                        id: `${i}-${txIdx}`,
                        date: r.data!.transaction_date,
                        description: r.data!.description,
                        amount: r.data!.amount / 100,
                        category: 'Uncategorized',
                        confidence: r.data!.confidence ?? 0.95,
                        mappedAccount: '',
                    }));

                allTransactions.push(...mappedTransactions);

                resultsWithContext.push({
                    opening: results.openingBalance,
                    ending: results.endingBalance,
                    firstDate: mappedTransactions[0]?.date || '9999-12-31',
                    lastDate: mappedTransactions[mappedTransactions.length - 1]?.date || '0000-01-01'
                });

                if (results.accountNumber && !detectedAcc) {
                    detectedAcc = results.accountNumber;
                }
                if (results.bankName && !detectedBank) {
                    detectedBank = results.bankName;
                }
                if (results.routingNumber && !detectedRouting) {
                    detectedRouting = results.routingNumber;
                }

                setProcessingProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
            }

            // Sort results by date to find the true opening and ending balances
            resultsWithContext.sort((a, b) => a.firstDate.localeCompare(b.firstDate));
            if (resultsWithContext.length > 0) {
                const firstResult = resultsWithContext[0];
                const lastResult = resultsWithContext[resultsWithContext.length - 1];

                setOpeningBalance(firstResult.opening ? firstResult.opening / 100 : null);
                setOpeningDate(firstResult.firstDate);

                setEndingBalance(lastResult.ending ? lastResult.ending / 100 : null);
                setEndingDate(lastResult.lastDate);
            }

            setTransactions(allTransactions.sort((a, b) => b.date.localeCompare(a.date)));
            setAccountNumber(detectedAcc);
            setBankName(detectedBank);
            setRoutingNumber(detectedRouting);

            // Verify account status in database
            const activeAccounts = getBankAccounts();
            setBankAccounts(activeAccounts);

            if (detectedAcc) {
                const found = activeAccounts.find(a =>
                    a.account_number === detectedAcc ||
                    a.account_number.endsWith(detectedAcc) ||
                    detectedAcc.endsWith(a.account_number)
                );
                if (!found) {
                    setAccountStatus('missing');
                } else if (!found.is_active) {
                    setAccountStatus('inactive');
                } else {
                    setAccountStatus('valid');
                }
            }

            setStep('review');
        } catch (e) {
            logger.error('BankStatementImporter', 'error', 'Error parsing PDFs', e);
            setStep('upload');
        }
    };

    const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const handleConsolidate = async () => {
        if (accountStatus !== 'valid' || transactions.length === 0) return;
        setIsProcessing(true);
        setImportResult(null);
        try {
            // Resolve bank account ID from account number
            const matched = bankAccounts.find(a => a.account_number === accountNumber);
            if (!matched) {
                setImportResult({ success: false, message: 'Cuenta bancaria no encontrada. Complete la documentaciÃ³n primero.' });
                return;
            }
            // Map parsed transactions to DB format
            const toInsert = transactions.map(tx => ({
                bank_account_id: matched.id,
                transaction_date: tx.date,
                description: tx.description,
                amount: tx.amount, // Ya estÃ¡ en dÃ³lares desde el preview
                reference_number: tx.id,
            }));
            const result = insertBankTransactions(toInsert);
            if (result.success) {
                await forceSaveDB();
                setImportResult({ success: true, message: `âœ“ ${result.importedCount} transacciones consolidadas exitosamente.` });
                onImportComplete?.(result.importedCount);
            } else {
                setImportResult({ success: false, message: result.message });
            }
        } catch (e) {
            setImportResult({ success: false, message: `Error inesperado: ${e instanceof Error ? e.message : 'Unknown'}` });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Cpu className="w-8 h-8 text-emerald-500" />
                        Importador Neural
                    </h1>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> AI Bank Smart Bridge v6.2
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-center">
                    <div className={`px-6 py-4 bg-slate-950 border rounded-2xl flex items-center gap-6 shadow-xl transition-all duration-700 ${accountStatus === 'valid' ? 'border-emerald-500/40 bg-emerald-500/5 shadow-emerald-900/10' : 'border-rose-500/40 bg-rose-500/5 shadow-rose-900/10'}`}>
                        <div className={`p-3 rounded-xl ${accountStatus === 'valid' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                            <Box className="w-6 h-6 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Entidad Detectada</span>
                            <div className="flex items-baseline gap-3">
                                <span className={`text-lg font-bold tracking-tight transition-colors ${accountStatus === 'valid' ? 'text-white' : 'text-rose-500'}`}>
                                    {bankName || 'Buscando...'}
                                </span>
                                <span className={`text-sm font-mono font-medium tracking-tight ${accountStatus === 'valid' ? 'text-emerald-500/70' : 'text-rose-400/50 italic'}`}>
                                    #{accountNumber?.slice(-4) || '----'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
                            {accountStatus === 'valid' ? (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                                        <Check className="w-6 h-6" />
                                    </div>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-tight">Cuenta<br />Verificada</span>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowAccountForm(true)}
                                    className="flex items-center gap-3 px-6 py-3 bg-[#f43f5e] hover:bg-[#e11d48] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-rose-900/40 animate-pulse hover:animate-none"
                                >
                                    <Building2 className="w-4 h-4 shrink-0" />
                                    Completar<br />DocumentaciÃ³n
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {step === 'upload' && (
                <div
                    className={`h-[450px] bg-slate-900 border-2 rounded-[3.5rem] border-dashed flex flex-col items-center justify-center transition-all duration-500 group relative overflow-hidden ${isDragging ? 'border-emerald-500 bg-emerald-500/5 shadow-2xl shadow-emerald-900/20' : 'border-slate-800 hover:border-slate-700'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) processFiles(Array.from(e.dataTransfer.files)); }}
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] pointer-events-none group-hover:bg-emerald-500/10 transition-all"></div>

                    <div className="p-8 bg-emerald-600/10 rounded-full mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500 shadow-xl">
                        <Upload className="w-14 h-14 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight mb-2">Inyectar Resumen Bancario (PDF/CSV)</h3>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-10">Compatibilidad: Chase, BofA, Wells Fargo, Amex, Stripe</p>

                    <label className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-xl shadow-emerald-900/20 cursor-pointer flex items-center gap-3 hover:-translate-y-0.5">
                        Seleccionar Archivos
                        <input type="file" className="hidden" accept=".pdf,.csv" multiple onChange={handleFileUpload} />
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
                    <h3 className="text-xl font-bold text-white tracking-tight mb-4">Ejecutando HeurÃ­stica Neural...</h3>
                    <p className="text-slate-500 text-xs font-medium max-w-sm mx-auto">Mapeando descripciones a cÃ³digos contables US GAAP y detectando anomalÃ­as en tiempo real.</p>

                    <div className="mt-12 w-80 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner relative">
                        <div
                            className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300"
                            style={{ width: `${processingProgress}%` }}
                        ></div>
                    </div>
                    <div className="mt-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest">{processingProgress}% Completado</div>
                </div>
            )}

            {step === 'review' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatusCard label="Archivos Seleccionados" value={`${files.length} PDF/CSV`} icon={FileText} color="blue" />
                        <StatusCard label="Total Transacciones" value={`${transactions.length} ITEMS`} icon={Layers} color="blue" />
                        <StatusCard
                            label={`Saldo Inicial (${openingDate || '...'})`}
                            value={openingBalance !== null ? formatCurrency(openingBalance) : "NO DETECTADO"}
                            icon={ShieldCheck}
                            color="emerald"
                        />
                        <StatusCard
                            label={`Saldo Final (${endingDate || '...'})`}
                            value={endingBalance !== null ? formatCurrency(endingBalance) : "NO DETECTADO"}
                            icon={Activity}
                            color="amber"
                        />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50">
                                <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800">
                                    <th className="px-8 py-5">Forensic Status</th>
                                    <th className="px-8 py-5">Temporalidad / DescripciÃ³n</th>
                                    <th className="px-8 py-5">ValorizaciÃ³n</th>
                                    <th className="px-8 py-5">CategorÃ­a IA</th>
                                    <th className="px-8 py-5">VÃ­nculo Contable</th>
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
                                                    <option>{tx.mappedAccount.toUpperCase() || 'Elegir Cuenta'}</option>
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

                    <div className="flex flex-col gap-8 pt-10 border-t border-slate-800">
                        {accountStatus !== 'valid' && accountNumber && (
                            <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-4 mb-4 md:mb-0">
                                    <div className="p-3 bg-rose-500/20 rounded-xl">
                                        <AlertCircle className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-white uppercase tracking-widest">AtenciÃ³n: DocumentaciÃ³n Incompleta</p>
                                        <p className="text-[10px] font-black text-rose-400/70 uppercase tracking-[0.2em] mt-1">La documentaciÃ³n de esta cuenta no estÃ¡ cargada en el sistema.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAccountForm(true)}
                                    className="px-10 py-5 bg-[#f43f5e] hover:bg-[#e11d48] text-white rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center gap-3 shadow-2xl shadow-rose-900/40 hover:-translate-y-1 active:scale-95"
                                >
                                    <Building2 className="w-5 h-5" />
                                    COMPLETAR DOCUMENTACIÃ“N
                                </button>
                            </div>
                        )}

                        {importResult && (
                            <div className={`px-6 py-4 rounded-2xl text-sm font-bold ${importResult.success
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                                }`}>
                                {importResult.message}
                            </div>
                        )}
                        <div className="flex justify-end gap-6 flex-wrap">
                            <button onClick={() => setStep('upload')} className="px-10 py-5 bg-slate-900 border border-slate-800 text-slate-400 rounded-2.5xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg">
                                Abortar SincronizaciÃ³n
                            </button>
                            <button
                                onClick={handleConsolidate}
                                disabled={isProcessing || accountStatus !== 'valid' || transactions.length === 0}
                                className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-2.5xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-4 shadow-3xl shadow-emerald-900/40 hover:-translate-y-1 active:scale-95"
                            >
                                {isProcessing ? 'Procesando...' : `Consolidar ${transactions.length} Transacciones`}
                                <Zap className={`w-5 h-5 ${isProcessing ? 'animate-spin' : 'text-emerald-200'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showAccountForm && (
                <BankAccountForm
                    initialData={accountNumber ? {
                        id: 0,
                        account_name: `${bankName || 'BANCO'} CORRIENTE *${accountNumber.slice(-4)}`.toUpperCase(),
                        bank_name: bankName || 'BANCO POR DEFINIR',
                        account_number: accountNumber,
                        account_type: 'checking',
                        routing_number: routingNumber || '',
                        balance: openingBalance || 0,
                        currency: 'USD',
                        is_active: true,
                        created_at: ''
                    } : undefined}
                    onCancel={() => setShowAccountForm(false)}
                    onSubmit={async (data) => {
                        const res = await createBankAccount(data);
                        if (res.success) {
                            setAccountStatus('valid');
                            setShowAccountForm(false);
                            // Refresh accounts
                            setBankAccounts(getBankAccounts());
                        }
                    }}
                />
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
