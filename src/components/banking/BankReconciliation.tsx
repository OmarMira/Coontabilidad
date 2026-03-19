import { logger } from '../../core/logging/SystemLogger';
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
import type { BankAccount, ReconciliationStatement, BankTransaction } from '@/database/modules/db-types';
import { getBankAccounts } from '@/database/modules/db-bank-accounts';
import { getReconciliationStatements, getUnreconciledTransactions, createReconciliationStatement, autoMatchTransactions } from '@/database/modules/db-reconciliation';
import { WorkerOrchestrator } from '../../core/workers/WorkerOrchestrator';
import { ReconciliationTask, ReconciliationResult } from '../../workers/reconciliation.worker';
import { toast } from 'react-hot-toast';
import { useLocale } from '@/i18n/useLocale';
import type { ChartOfAccount } from '@/database/modules/db-types';
import { db } from '@/database/modules/db-core';
import { getChartOfAccounts } from '@/database/modules/db-journal';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { ClassificationMemoryService, MemorySuggestion } from '../../services/banking/ClassificationMemoryService';
import { TRANSACTION_STATES } from '../../constants/bankingStates';
import { useAuth } from '../../contexts/AuthContext';
import { DatabaseService } from '../../database/DatabaseService';

interface BankReconciliationProps {
    onNavigate?: (section: string) => void;
}

export const BankReconciliation: React.FC<BankReconciliationProps> = ({ onNavigate }) => {
    const { t } = useLocale();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [statements, setStatements] = useState<ReconciliationStatement[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
    const [selectedStatementItem, setSelectedStatementItem] = useState<any>(null);
    const [matchingInProgress, setMatchingInProgress] = useState(false);
    const [unreconciledTransactions, setUnreconciledTransactions] = useState<BankTransaction[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showNewStatementForm, setShowNewStatementForm] = useState(false);
    const { user } = useAuth();

    // Modal state
    const [classifierModal, setClassifierModal] = useState<{
        show: boolean;
        transaction: BankTransaction | null;
        selectedAccount: ChartOfAccount | null;
        suggestions: MemorySuggestion[];
        searchQuery: string;
        filteredAccounts: ChartOfAccount[];
        isAutoSuggested: boolean;
    }>({
        show: false,
        transaction: null,
        selectedAccount: null,
        suggestions: [],
        searchQuery: '',
        filteredAccounts: [],
        isAutoSuggested: false
    });

    const extractReference = (description: string) => {
        const match = description.match(/CONF#\s*(\S+)/i);
        return match ? match[1] : 'â€”';
    };

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

    useEffect(() => {
        const handleRefresh = () => loadData();
        window.addEventListener('bank-import-complete', handleRefresh);
        return () => window.removeEventListener('bank-import-complete', handleRefresh);
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
                toast.success('Protocolo de conciliaciÃ³n iniciado correctamente');
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
            toast.error('Fallo en la creaciÃ³n del estado de conciliaciÃ³n');
        }
    };

    const handleAutoMatch = async (statementId: number) => {
        if (!selectedAccount) return;

        setIsProcessing(true);
        try {
            const task: ReconciliationTask = {
                type: 'AUTO_MATCH',
                statementId,
                transactions: unreconciledTransactions as any,
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
            toast.error('Error en el motor de conciliaciÃ³n');
        } finally {
            setIsProcessing(false);
        }
    };

    const openClassifierModal = async (tx: BankTransaction) => {
        const loadingToast = toast.loading('Analizando memoria de clasificaciÃ³n...');
        try {
            const suggestions = await ClassificationMemoryService.getSuggestions(tx.description);
            const allAccounts = getChartOfAccounts();
            let autoAccount: ChartOfAccount | null = null;
            let autoMode = false;

            if (suggestions.length > 0) {
                autoAccount = allAccounts.find(a => a.account_code === suggestions[0].accountCode) || null;
                autoMode = !!autoAccount;
            }

            setClassifierModal({
                show: true,
                transaction: tx,
                selectedAccount: autoAccount,
                suggestions: suggestions.slice(0, 3),
                searchQuery: autoAccount ? autoAccount.account_name : '',
                filteredAccounts: [],
                isAutoSuggested: autoMode
            });
            toast.dismiss(loadingToast);
        } catch (error) {
            toast.error('Error al cargar sugerencias', { id: loadingToast });
        }
    };

    const handleClassifyInline = async () => {
        const { transaction, selectedAccount: acc } = classifierModal;
        if (!transaction || !acc || !user) return;

        const loadingToast = toast.loading('Certificando clasificaciÃ³n y generando asiento...');
        try {
            const engine = new SQLiteEngine();
            engine.setDB(db);

            // 1. Encontrar el state_id para esta transacciÃ³n bank_transaction_id.
            const stateRes = await engine.select('SELECT id FROM transaction_states WHERE transaction_id = ?', [transaction.id]);
            const stateId = (stateRes as any[])[0]?.id;

            if (!stateId) throw new Error('Estado de transacciÃ³n no encontrado');

            // 2. Guardar en memoria
            await ClassificationMemoryService.saveConfirmation(
                transaction.description,
                acc.account_code,
                acc.account_name,
                user.id
            );

            // 3. Update state
            await engine.run(`
                UPDATE transaction_states 
                SET current_state = ?, 
                    is_verified = 1,
                    auto_classified = 0,
                    assigned_account_code = ?,
                    assigned_account_name = ?,
                    verified_at = CURRENT_TIMESTAMP,
                    verified_by = ?
                WHERE id = ?
            `, [TRANSACTION_STATES.VERIFIED, acc.account_code, acc.account_name, user.id, stateId]);

            // 4. GENERACIÃ“N DE ASIENTO
            const getGlCodeForBank = (bankId: number) => {
                const map: Record<number, string> = { 1: '1112', 2: '1113' };
                return map[bankId] || '1112';
            };

            const bankAccountCode = getGlCodeForBank(transaction.bank_account_id);
            const amountCents = Math.abs(transaction.amount);

            // Si monto < 0 (Egreso): DÃ©bito a la Cuenta Clasificada, CrÃ©dito a Banco
            // Si monto > 0 (Ingreso): DÃ©bito a Banco, CrÃ©dito a la Cuenta Clasificada
            const entryLines = transaction.amount < 0 ? [
                { account_code: acc.account_code, debit: amountCents, credit: 0, description: transaction.description },
                { account_code: bankAccountCode, debit: 0, credit: amountCents, description: transaction.description }
            ] : [
                { account_code: bankAccountCode, debit: amountCents, credit: 0, description: transaction.description },
                { account_code: acc.account_code, debit: 0, credit: amountCents, description: transaction.description }
            ];

            await DatabaseService.insertJournalEntry({
                description: `ClasificaciÃ³n Manual: ${transaction.description}`,
                date: transaction.transaction_date,
                userId: user.id || 1,
                items: entryLines
            });

            // 5. Marcar como 'matched' en bank_transactions y el estado visual
            await engine.run(`UPDATE bank_transactions SET status = 'matched' WHERE id = ?`, [transaction.id]);

            toast.success('ClasificaciÃ³n certificada y asiento generado correctamente', { id: loadingToast });
            setClassifierModal(prev => ({ ...prev, show: false }));
            loadData();
        } catch (error) {
            logger.error('BankReconciliation', 'error', 'Error classifying inline:', error);
            toast.error('Error en el proceso de certificaciÃ³n: ' + (error as Error).message, { id: loadingToast });
        }
    };

    const handleSearchAccounts = (query: string) => {
        const all = getChartOfAccounts();
        const filtered = query.length > 1
            ? all.filter(a => a.account_name.toLowerCase().includes(query.toLowerCase()) || a.account_code.includes(query)).slice(0, 5)
            : [];

        setClassifierModal(prev => ({
            ...prev,
            searchQuery: query,
            filteredAccounts: filtered,
            isAutoSuggested: false
        }));
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight leading-none uppercase">
                        <Calculator className="w-8 h-8 text-blue-500" />
                        {t('bankReconciliation.title')}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2 uppercase">
                        <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('bankReconciliation.subtitle')}
                    </p>
                </div>
                {selectedAccount && (
                    <button
                        onClick={() => setShowNewStatementForm(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-xl shadow-blue-900/20 hover:-translate-y-0.5"
                    >
                        <Calendar className="w-4 h-4" />
                        {t('bankReconciliation.newReconciliation')}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                {/* Panel de Cuentas - Vault Selection */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                            <Landmark className="w-4 h-4 text-blue-500" /> {t('bankReconciliation.activeVaults')}
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
                                <div className="relative z-10 flex flex-col gap-1">
                                    <div className="font-bold tracking-tight text-sm">{account.account_name}</div>
                                    <div className={`text-[10px] font-medium uppercase tracking-widest font-mono ${selectedAccount?.id === account.id ? 'text-blue-100' : 'text-slate-500'}`}>{account.account_number}</div>
                                    <div className="mt-1 text-base font-bold font-mono tracking-tight">
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
                                <p className="text-[10px] font-black uppercase tracking-widest">{t('bankReconciliation.noRecords')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Panel Principal - Execution Grid */}
                <div className="xl:col-span-3 space-y-10">
                    {selectedAccount ? (
                        <>
                            {/* Formulario Nueva ConciliaciÃ³n - Protocol Opening */}
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
                                                    <h3 className="text-xl font-bold text-white tracking-tight">{t('bankReconciliation.cycleParams')}</h3>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1 italic">{selectedAccount.account_name}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowNewStatementForm(false)} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all shadow-lg">
                                                <X className="w-6 h-6" />
                                            </button>
                                        </header>

                                        <div className="p-12 relative z-10">
                                            <form onSubmit={handleCreateStatement} className="space-y-12">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                    <PremiumInputMini label={t('bankReconciliation.cutoffDate')} icon={Calendar} value={newStatement.statement_date} onChange={(v: string) => setNewStatement(prev => ({ ...prev, statement_date: v }))} type="date" />
                                                    <PremiumInputMini label={t('bankReconciliation.dorFund')} icon={DollarSign} value={newStatement.statement_balance.toString()} onChange={(v: string) => setNewStatement(prev => ({ ...prev, statement_balance: parseFloat(v) || 0 }))} type="number" />
                                                    <PremiumInputMini label={t('bankReconciliation.kernelFund')} icon={Cpu} value={newStatement.system_balance.toString()} onChange={(v: string) => setNewStatement(prev => ({ ...prev, system_balance: parseFloat(v) || 0 }))} type="number" />
                                                </div>

                                                <footer className="flex justify-end gap-6 pt-10 border-t border-slate-800">
                                                    <button type="button" onClick={() => setShowNewStatementForm(false)} className="px-10 py-5 bg-slate-950 border border-slate-800 text-slate-500 rounded-2.5xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800">
                                                        {t('bankReconciliation.abort')}
                                                    </button>
                                                    <button type="submit" className="px-12 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2.5xl font-black uppercase tracking-widest text-[10px] transition-all shadow-3xl shadow-blue-900/40 hover:-translate-y-1">
                                                        {t('bankReconciliation.certifyOpening')}
                                                    </button>
                                                </footer>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Estados de ConciliaciÃ³n - Timeline */}
                            <div className="bg-slate-900 border-2 border-slate-800 rounded-[3.5rem] overflow-hidden shadow-3xl relative group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-blue-500/10"></div>

                                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white tracking-tight">{t('bankReconciliation.timelineTitle')}</h3>
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest font-mono">{t('bankReconciliation.statusHub')}</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                                            <tr>
                                                <th className="px-8 py-6">{t('bankReconciliation.cycleTimestamp')}</th>
                                                <th className="px-8 py-6 text-right">{t('bankReconciliation.bankBalance')}</th>
                                                <th className="px-8 py-6 text-right">{t('bankReconciliation.systemBalance')}</th>
                                                <th className="px-8 py-6 text-right">{t('bankReconciliation.differential')}</th>
                                                <th className="px-8 py-6 text-center">{t('bankReconciliation.protocol')}</th>
                                                <th className="px-8 py-6 text-right">{t('bankReconciliation.terminal')}</th>
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
                                                    <td className={`px-8 py-6 text-right font-mono font-black ${Math.abs(statement.difference ?? 0) < 0.01 ? 'text-emerald-500' : 'text-rose-500'
                                                        } text-base tracking-tighter`}>
                                                        ${(statement.difference ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                                                        <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest italic">{t('bankReconciliation.noCycleFiles')}</div>
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
                                    <div className="px-6 py-4 border-b border-rose-500/20 bg-rose-500/[0.02] flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-4">
                                            <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                                            {t('bankReconciliation.exceptionsMaster')} ({unreconciledTransactions.length})
                                        </h3>
                                        <span className="text-[10px] font-medium text-rose-500 uppercase tracking-widest font-mono">{t('bankReconciliation.criticalConsistency')}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                                                <tr>
                                                    <th className="px-8 py-6">{t('bankReconciliation.timestamp')}</th>
                                                    <th className="px-8 py-6">{t('bankReconciliation.descriptor')}</th>
                                                    <th className="px-8 py-6 text-right">{t('bankReconciliation.amount')}</th>
                                                    <th className="px-8 py-6">{t('bankReconciliation.reference')}</th>
                                                    <th className="px-8 py-6 text-center">{t('bankReconciliation.opStatus')}</th>
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
                                                        <td className="px-8 py-6 text-xs font-bold text-slate-400 font-mono italic">
                                                            {extractReference(transaction.description)}
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <button
                                                                onClick={() => openClassifierModal(transaction)}
                                                                className="px-4 py-2 rounded-xl border text-[8px] font-black uppercase tracking-[0.2em] bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black transition-all shadow-lg shadow-amber-950/20"
                                                            >
                                                                Clasificar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {unreconciledTransactions.length > 10 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-8 py-6 text-center text-[10px] font-black text-slate-700 uppercase tracking-widest bg-slate-950/20">
                                                            ... {t('bankReconciliation.extrapolating')} {unreconciledTransactions.length - 10} {t('bankReconciliation.additionalRecords')}
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
                        <div className="bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center group">
                            <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:border-blue-500/50 transition-all duration-700">
                                <Landmark className="w-8 h-8 text-slate-800 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-500 transition-colors group-hover:text-slate-400">{t('bankReconciliation.vaultSelectionRequired')}</h3>
                            <p className="text-xs font-medium text-slate-700 uppercase tracking-widest mt-2">{t('bankReconciliation.chooseEntity')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Clasificador Modal */}
            {classifierModal.show && classifierModal.transaction && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center z-[80] p-6">
                    <div className="bg-slate-900 border-2 border-slate-800 rounded-[3rem] shadow-4xl w-full max-w-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
                        <header className="p-8 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                    <Layers className="w-6 h-6 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Clasificar ExcepciÃ³n</h3>
                            </div>
                            <button onClick={() => setClassifierModal(prev => ({ ...prev, show: false }))} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-all">
                                <X size={20} />
                            </button>
                        </header>

                        <div className="p-8 space-y-6">
                            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">TransacciÃ³n</div>
                                <div className="text-sm font-bold text-white uppercase mb-1">{classifierModal.transaction.description}</div>
                                <div className={`text-xl font-black ${classifierModal.transaction.amount < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    ${Math.abs(classifierModal.transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                            </div>

                            {classifierModal.suggestions.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Cpu className="w-3 h-3" /> Sugerencia IA/Memoria
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {classifierModal.suggestions.map((s, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setClassifierModal(prev => ({
                                                    ...prev,
                                                    selectedAccount: getChartOfAccounts().find(a => a.account_code === s.accountCode) || null,
                                                    searchQuery: s.accountName,
                                                    isAutoSuggested: true
                                                }))}
                                                className="flex items-center justify-between p-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 rounded-xl transition-all"
                                            >
                                                <div className="text-left">
                                                    <div className="text-xs font-black text-amber-500">{s.accountName}</div>
                                                    <div className="text-[9px] font-bold text-slate-500">CTA: {s.accountCode}</div>
                                                </div>
                                                <div className="text-[9px] font-black text-amber-500/40 uppercase">Usar esta</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cuenta Contable Destino</div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={classifierModal.searchQuery}
                                        onChange={(e) => handleSearchAccounts(e.target.value)}
                                        placeholder="Buscar por nombre o cÃ³digo..."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-xs font-bold text-white focus:border-amber-500 focus:outline-none transition-all"
                                    />
                                    {classifierModal.filteredAccounts.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-20">
                                            {classifierModal.filteredAccounts.map(acc => (
                                                <button
                                                    key={acc.id}
                                                    onClick={() => setClassifierModal(prev => ({
                                                        ...prev,
                                                        selectedAccount: acc,
                                                        searchQuery: acc.account_name,
                                                        filteredAccounts: []
                                                    }))}
                                                    className="w-full text-left p-4 hover:bg-slate-800 border-b border-slate-800 last:border-0 text-xs text-slate-300"
                                                >
                                                    <span className="font-black text-white">{acc.account_code}</span> â€” {acc.account_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {classifierModal.selectedAccount && (
                                    <div className={`flex items-center gap-3 p-3 rounded-lg border ${classifierModal.isAutoSuggested ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                                        <ShieldCheck size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                            {classifierModal.isAutoSuggested ? 'Sugerencia Aplicada' : 'Cuenta Seleccionada'}: {classifierModal.selectedAccount.account_code}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={!classifierModal.selectedAccount}
                                onClick={handleClassifyInline}
                                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all
                                    ${classifierModal.selectedAccount
                                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-xl shadow-amber-500/20 hover:-translate-y-1'
                                        : 'bg-slate-800 text-slate-600'}`}
                            >
                                Certificar ClasificaciÃ³n
                            </button>

                            <button
                                onClick={() => {
                                    setClassifierModal(prev => ({ ...prev, show: false }));
                                    const navTarget = `transaction-classifier:${selectedAccount?.id ?? 0}`;
                                    if (onNavigate) onNavigate(navTarget);
                                    else window.dispatchEvent(new CustomEvent('navigate-to', { detail: navTarget }));
                                }}
                                className="w-full py-2 text-[8px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Abrir Clasificador Completo
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
    const { t } = useLocale();
    const config: any = {
        reconciled: { label: t('bankReconciliation.statusCertified'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle },
        in_progress: { label: t('bankReconciliation.statusSyncActive'), color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Activity },
        discrepancy: { label: t('bankReconciliation.statusDiscrepancy'), color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: AlertTriangle },
        pending: { label: t('bankReconciliation.statusPending'), color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock },
    };

    const { label, color, bg, border, icon: Icon } = config[status] || { label: status, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Target };

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-[0.2em] ${bg} ${color} ${border} shadow-lg mx-auto`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    );
};
