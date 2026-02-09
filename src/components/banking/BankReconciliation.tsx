import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    AlertTriangle,
    Clock,
    Database,
    Search,
    Filter,
    Download,
    Play,
    Eye,
    ArrowRight,
    Calculator,
    TrendingUp,
    DollarSign,
    Calendar,
    Zap,
    Activity,
    Cpu,
    Target,
    Layers,
    ShieldCheck,
    RefreshCw,
    X,
    ChevronRight,
    Landmark
} from 'lucide-react';
import {
    getBankAccounts,
    getReconciliationStatements,
    getUnreconciledTransactions,
    createReconciliationStatement,
    autoMatchTransactions,
    BankAccount,
    ReconciliationStatement,
    BankTransaction
} from '../../database/simple-db';
import { WorkerOrchestrator } from '../../core/workers/WorkerOrchestrator';
import { ReconciliationTask, ReconciliationResult } from '../../workers/reconciliation.worker';
import { toast } from 'react-hot-toast';

export const BankReconciliation: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [statements, setStatements] = useState<ReconciliationStatement[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
    const [unreconciledTransactions, setUnreconciledTransactions] = useState<BankTransaction[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showNewStatementForm, setShowNewStatementForm] = useState(false);

    // Form state for new reconciliation
    const [newStatement, setNewStatement] = useState({
        statement_date: new Date().toISOString().split('T')[0],
        statement_balance: 0,
        system_balance: 0
    });

    const [workerOrchestrator] = useState(() => new WorkerOrchestrator());

    const loadData = () => {
        setAccounts(getBankAccounts());
        if (selectedAccount) {
            setStatements(getReconciliationStatements(selectedAccount.id));
            setUnreconciledTransactions(getUnreconciledTransactions(selectedAccount.id));
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedAccount]);

    const handleAccountSelect = (account: BankAccount) => {
        setSelectedAccount(account);
        setShowNewStatementForm(false);
    };

    const handleCreateStatement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccount) return;

        try {
            const result = createReconciliationStatement({
                bank_account_id: selectedAccount.id,
                statement_date: newStatement.statement_date,
                statement_balance: newStatement.statement_balance,
                system_balance: newStatement.system_balance,
                status: 'pending'
            });

            if (result.success) {
                toast.success('Protocolo de conciliación iniciado correctamente');
                setShowNewStatementForm(false);
                setNewStatement({
                    statement_date: new Date().toISOString().split('T')[0],
                    statement_balance: 0,
                    system_balance: 0
                });
                loadData();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Fallo en la creación del estado de conciliación');
        }
    };

    const handleAutoMatch = async (statementId: number) => {
        if (!selectedAccount) return;

        setIsProcessing(true);
        try {
            const task: ReconciliationTask = {
                type: 'AUTO_MATCH',
                statementId,
                transactions: unreconciledTransactions,
                matchingCriteria: {
                    amountTolerance: 0.01,
                    dateTolerance: 3,
                    minConfidence: 0.8,
                    enableFuzzyMatching: true
                }
            };

            const result = await workerOrchestrator.executeTask<ReconciliationResult>('RECONCILIATION', task);

            toast.success(`Proceso completado: ${result.summary.highConfidenceMatches} transacciones conciliadas`);
            loadData();
        } catch (error) {
            toast.error('Error en el motor de conciliación');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg group">
                        <Calculator className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Conciliación Bancaria</h1>
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-3">
                            <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> Sincronización Bancaria Automática
                        </p>
                    </div>
                </div>

                {selectedAccount && (
                    <button
                        onClick={() => setShowNewStatementForm(true)}
                        className="flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all shadow-3xl shadow-blue-900/40 hover:-translate-y-1"
                    >
                        <Calendar className="w-4 h-4" />
                        Nueva Conciliación
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                {/* Panel de Cuentas - Vault Selection */}
                <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] shadow-2xl overflow-hidden group">
                    <div className="px-10 py-8 border-b border-slate-800">
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                            <Landmark className="w-5 h-5 text-blue-500" /> Bóvedas Activas
                        </h3>
                    </div>
                    <div className="p-4 space-y-3">
                        {accounts.map(account => (
                            <button
                                key={account.id}
                                onClick={() => handleAccountSelect(account)}
                                className={`w-full text-left p-6 rounded-[2.2rem] transition-all duration-500 group/acc relative overflow-hidden ${selectedAccount?.id === account.id
                                    ? 'bg-blue-600 text-white shadow-2xl shadow-blue-950/40'
                                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:-translate-x-1'
                                    }`}
                            >
                                <div className="relative z-10 flex flex-col gap-2">
                                    <div className="font-black uppercase tracking-tighter text-sm">{account.account_name}</div>
                                    <div className={`text-[9px] font-black uppercase tracking-[0.2em] font-mono ${selectedAccount?.id === account.id ? 'text-blue-100' : 'text-slate-600'}`}>{account.account_number}</div>
                                    <div className="mt-2 text-lg font-black font-mono tracking-tighter">
                                        ${account.balance.toLocaleString()}
                                    </div>
                                </div>
                                {selectedAccount?.id === account.id && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] -mr-16 -mt-16"></div>
                                )}
                            </button>
                        ))}
                        {accounts.length === 0 && (
                            <div className="py-20 text-center opacity-20">
                                <Database className="w-12 h-12 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sin registros</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel Principal - Execution Grid */}
                <div className="xl:col-span-3 space-y-10">
                    {selectedAccount ? (
                        <>
                            {/* Formulario Nueva Conciliación - Protocol Opening */}
                            {showNewStatementForm && (
                                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[70] p-6">
                                    <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] shadow-4xl w-full max-w-4xl my-auto animate-in zoom-in-95 duration-500 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none"></div>

                                        <header className="flex items-center justify-between p-12 border-b border-slate-800 relative z-10 bg-slate-900/50">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 text-blue-500 shadow-xl">
                                                    <Target className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Parámetros de Ciclo</h3>
                                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2 italic">{selectedAccount.account_name}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowNewStatementForm(false)} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg">
                                                <X className="w-6 h-6" />
                                            </button>
                                        </header>

                                        <div className="p-12 relative z-10">
                                            <form onSubmit={handleCreateStatement} className="space-y-12">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    <PremiumInputMini label="Fecha Recorte" icon={Calendar} value={newStatement.statement_date} onChange={(v: string) => setNewStatement(prev => ({ ...prev, statement_date: v }))} type="date" />
                                                    <PremiumInputMini label="Fondo Bóveda (DOR)" icon={DollarSign} value={newStatement.statement_balance.toString()} onChange={(v: string) => setNewStatement(prev => ({ ...prev, statement_balance: parseFloat(v) || 0 }))} type="number" />
                                                    <PremiumInputMini label="Fondo Sistema" icon={Cpu} value={newStatement.system_balance.toString()} onChange={(v: string) => setNewStatement(prev => ({ ...prev, system_balance: parseFloat(v) || 0 }))} type="number" />
                                                </div>

                                                <footer className="flex justify-end gap-6 pt-10 border-t border-slate-800">
                                                    <button type="button" onClick={() => setShowNewStatementForm(false)} className="px-10 py-5 bg-slate-950 border border-slate-800 text-slate-500 rounded-2.5xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800">
                                                        Abortar
                                                    </button>
                                                    <button type="submit" className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all shadow-3xl shadow-blue-900/40 hover:-translate-y-1">
                                                        Certificar Apertura
                                                    </button>
                                                </footer>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Estados de Conciliación - Timeline */}
                            <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] overflow-hidden shadow-3xl relative group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-blue-500/10"></div>

                                <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Cronología de Conciliación</h3>
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Status Hub Ready</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                                            <tr>
                                                <th className="px-8 py-6">Timestamp Ciclo</th>
                                                <th className="px-8 py-6 text-right">Fondo Dorado</th>
                                                <th className="px-8 py-6 text-right">Fondo Kernel</th>
                                                <th className="px-8 py-6 text-right">Diferencial</th>
                                                <th className="px-8 py-6 text-center">Protocolo</th>
                                                <th className="px-8 py-6 text-right">Terminal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40">
                                            {statements.map(statement => (
                                                <tr key={statement.id} className="hover:bg-white/[0.02] transition-colors group/row">
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-white uppercase tracking-tighter group-hover/row:text-blue-400 transition-colors">{statement.statement_date}</span>
                                                            <span className="text-[9px] font-bold text-slate-600 font-mono mt-1">ID: #{statement.id.toString().slice(-4)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-mono font-black text-slate-300 text-sm">${statement.statement_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-8 py-6 text-right font-mono font-black text-slate-300 text-sm">${statement.system_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className={`px-8 py-6 text-right font-mono font-black ${Math.abs(statement.difference) < 0.01 ? 'text-emerald-500' : 'text-rose-500'
                                                        } text-base tracking-tighter`}>
                                                        ${statement.difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <StatusBadge status={statement.status} />
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex gap-2 justify-end">
                                                            {statement.status === 'pending' && (
                                                                <button
                                                                    onClick={() => handleAutoMatch(statement.id)}
                                                                    disabled={isProcessing}
                                                                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-lg disabled:opacity-30"
                                                                >
                                                                    <Zap className={`w-4 h-4 ${isProcessing ? 'animate-spin' : 'fill-current'}`} />
                                                                </button>
                                                            )}
                                                            <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:bg-slate-800 hover:text-white transition-all shadow-lg">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all shadow-lg">
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {statements.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-8 py-20 text-center">
                                                        <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">Archivos de ciclo no detectados encriptados.</div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Transacciones No Conciliadas - Exception List */}
                            {unreconciledTransactions.length > 0 && (
                                <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] overflow-hidden shadow-3xl animate-in slide-in-from-bottom-6 duration-700">
                                    <div className="px-10 py-8 border-b border-rose-500/20 bg-rose-500/[0.02] flex items-center justify-between">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                            <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />
                                            Excepciones Maestro ({unreconciledTransactions.length})
                                        </h3>
                                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] font-mono">Consistencia Crítica</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                                                <tr>
                                                    <th className="px-8 py-6">Timestamp</th>
                                                    <th className="px-8 py-6">Descriptor</th>
                                                    <th className="px-8 py-6 text-right">Monto</th>
                                                    <th className="px-8 py-6">Referencia</th>
                                                    <th className="px-8 py-6 text-center">Status Operativo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/40">
                                                {unreconciledTransactions.slice(0, 10).map(transaction => (
                                                    <tr key={transaction.id} className="hover:bg-rose-500/[0.01] transition-colors group/row">
                                                        <td className="px-8 py-6 text-[10px] font-black text-slate-500 font-mono tracking-tighter">{transaction.transaction_date}</td>
                                                        <td className="px-8 py-6 text-sm font-black text-white uppercase tracking-tighter group-hover/row:text-rose-400 transition-colors">{transaction.description}</td>
                                                        <td className={`px-8 py-6 text-right font-mono font-black text-sm tracking-tighter ${transaction.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                                            }`}>
                                                            ${Math.abs(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-8 py-6 text-xs font-bold text-slate-600 font-mono italic">{transaction.reference_number || 'NULL_PTR'}</td>
                                                        <td className="px-8 py-6 text-center">
                                                            <span className="px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-[0.2em] bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-lg">
                                                                SINCRO-PEND
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {unreconciledTransactions.length > 10 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-8 py-6 text-center text-[10px] font-black text-slate-700 uppercase tracking-widest bg-slate-950/20">
                                                            ... EXTRAPOLANDO {unreconciledTransactions.length - 10} REGISTROS ADICIONALES
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-slate-900/20 border-4 border-dashed border-slate-800 rounded-[4rem] p-32 text-center group">
                            <div className="w-24 h-24 bg-slate-950 rounded-[2.5rem] border border-slate-800 flex items-center justify-center mx-auto mb-10 shadow-2xl group-hover:scale-110 group-hover:border-blue-500/50 transition-all duration-700">
                                <Landmark className="w-10 h-10 text-slate-800 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-500 uppercase tracking-[0.2em]">Selección de Bóveda Requerida</h3>
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-4">ELIGE UNA ENTIDAD BANCARIA PARA DESPLEGAR EL PROTOCOLO DE CONCILIACIÓN</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PremiumInputMini = ({ label, icon: Icon, value, onChange, type = "text" }: any) => (
    <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
            <Icon className="w-3.5 h-3.5 text-blue-500" /> {label}
        </label>
        <div className="relative group/input">
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-950 text-white px-8 py-5 rounded-2.5xl border border-slate-800 transition-all font-black uppercase tracking-widest text-[10px] placeholder:text-slate-800 focus:outline-none focus:border-blue-500 focus:shadow-[0_0_25px_rgba(59,130,246,0.1)] group-hover/input:border-slate-700 shadow-inner"
            />
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    const config: any = {
        reconciled: { label: 'CERTIFICADO', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle },
        in_progress: { label: 'SYNC-ACTIVE', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Activity },
        discrepancy: { label: 'DISCREPANCIA', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertTriangle },
        pending: { label: 'SINCRO-PEND', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock },
    };

    const { label, color, bg, border, icon: Icon } = config[status] || { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Target };

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-[0.2em] ${bg} ${color} ${border} shadow-lg mx-auto`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    );
};