import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    AlertTriangle,
    Clock,
    Search,
    Filter,
    Download,
    Play,
    Eye,
    ArrowRight,
    Calculator,
    TrendingUp,
    DollarSign,
    Calendar
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
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

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
                toast.success(result.message);
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
            toast.error('Error al crear estado de conciliación');
        }
    };

    const handleAutoMatch = async (statementId: number) => {
        if (!selectedAccount) return;

        setIsProcessing(true);
        try {
            // Usar worker para matching inteligente
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
            
            toast.success(`Auto-matching completado: ${result.summary.highConfidenceMatches} matches de alta confianza encontrados`);
            loadData();
        } catch (error) {
            console.error('Error in auto-matching:', error);
            toast.error('Error en auto-matching');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'reconciled': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'in_progress': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'discrepancy': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            default: return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'reconciled': return <CheckCircle className="w-4 h-4" />;
            case 'discrepancy': return <AlertTriangle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Calculator className="w-8 h-8 text-blue-500" />
                        Conciliación Bancaria
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Matching Inteligente de Transacciones</p>
                </div>

                {selectedAccount && (
                    <Button
                        onClick={() => setShowNewStatementForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                        <Calendar className="w-4 h-4 mr-2" /> Nueva Conciliación
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Panel de Cuentas */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white text-lg font-bold">Cuentas Bancarias</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-1 p-4">
                            {accounts.map(account => (
                                <button
                                    key={account.id}
                                    onClick={() => handleAccountSelect(account)}
                                    className={`w-full text-left p-3 rounded-xl transition-all ${
                                        selectedAccount?.id === account.id
                                            ? 'bg-blue-600 text-white'
                                            : 'hover:bg-slate-800 text-slate-300'
                                    }`}
                                >
                                    <div className="font-bold">{account.account_name}</div>
                                    <div className="text-xs opacity-70">{account.account_number}</div>
                                    <div className="text-xs font-mono">${account.balance.toLocaleString()}</div>
                                </button>
                            ))}
                            {accounts.length === 0 && (
                                <p className="text-slate-500 text-center py-8 italic">No hay cuentas bancarias configuradas</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Panel Principal */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedAccount ? (
                        <>
                            {/* Formulario Nueva Conciliación */}
                            {showNewStatementForm && (
                                <Card className="bg-slate-900 border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <CardHeader className="border-b border-slate-800">
                                        <CardTitle className="text-white text-lg font-bold">Nueva Conciliación - {selectedAccount.account_name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <form onSubmit={handleCreateStatement} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha del Estado</label>
                                                    <input
                                                        type="date"
                                                        value={newStatement.statement_date}
                                                        onChange={(e) => setNewStatement(prev => ({ ...prev, statement_date: e.target.value }))}
                                                        required
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance del Estado</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={newStatement.statement_balance}
                                                        onChange={(e) => setNewStatement(prev => ({ ...prev, statement_balance: parseFloat(e.target.value) || 0 }))}
                                                        required
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance del Sistema</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={newStatement.system_balance}
                                                        onChange={(e) => setNewStatement(prev => ({ ...prev, system_balance: parseFloat(e.target.value) || 0 }))}
                                                        required
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => setShowNewStatementForm(false)}
                                                    className="text-slate-400 hover:text-white"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                                >
                                                    Crear Conciliación
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Estados de Conciliación */}
                            <Card className="bg-slate-900 border-slate-800">
                                <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between">
                                    <CardTitle className="text-white text-lg font-bold">Estados de Conciliación</CardTitle>
                                    <div className="flex gap-2">
                                        <span className="text-xs text-slate-500">{statements.length} estados</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                            <tr>
                                                <th className="px-6 py-4">Fecha</th>
                                                <th className="px-6 py-4 text-right">Balance Estado</th>
                                                <th className="px-6 py-4 text-right">Balance Sistema</th>
                                                <th className="px-6 py-4 text-right">Diferencia</th>
                                                <th className="px-6 py-4 text-center">Estado</th>
                                                <th className="px-6 py-4 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {statements.map(statement => (
                                                <tr key={statement.id} className="hover:bg-white/[0.02]">
                                                    <td className="px-6 py-4 font-semibold text-white">{statement.statement_date}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-slate-300">${statement.statement_balance.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-slate-300">${statement.system_balance.toLocaleString()}</td>
                                                    <td className={`px-6 py-4 text-right font-mono font-bold ${
                                                        Math.abs(statement.difference) < 0.01 ? 'text-emerald-400' : 'text-rose-400'
                                                    }`}>
                                                        ${statement.difference.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border flex items-center gap-1 justify-center ${getStatusColor(statement.status)}`}>
                                                            {getStatusIcon(statement.status)}
                                                            {statement.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex gap-2 justify-center">
                                                            {statement.status === 'pending' && (
                                                                <button
                                                                    onClick={() => handleAutoMatch(statement.id)}
                                                                    disabled={isProcessing}
                                                                    className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                                                                    title="Auto-Match"
                                                                >
                                                                    <Play className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button className="p-2 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors" title="Ver Detalles">
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors" title="Descargar">
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {statements.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-600 italic">
                                                        No hay estados de conciliación para esta cuenta
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>

                            {/* Transacciones No Conciliadas */}
                            {unreconciledTransactions.length > 0 && (
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardHeader className="border-b border-slate-800">
                                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            Transacciones No Conciliadas ({unreconciledTransactions.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                                <tr>
                                                    <th className="px-6 py-4">Fecha</th>
                                                    <th className="px-6 py-4">Descripción</th>
                                                    <th className="px-6 py-4 text-right">Monto</th>
                                                    <th className="px-6 py-4">Referencia</th>
                                                    <th className="px-6 py-4 text-center">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {unreconciledTransactions.slice(0, 10).map(transaction => (
                                                    <tr key={transaction.id} className="hover:bg-white/[0.02]">
                                                        <td className="px-6 py-4 font-semibold text-white">{transaction.transaction_date}</td>
                                                        <td className="px-6 py-4 text-slate-300">{transaction.description}</td>
                                                        <td className={`px-6 py-4 text-right font-mono font-bold ${
                                                            transaction.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                                        }`}>
                                                            ${Math.abs(transaction.amount).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{transaction.reference_number || 'N/A'}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase border bg-amber-500/10 border-amber-500/20 text-amber-400">
                                                                PENDIENTE
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {unreconciledTransactions.length > 10 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-4 text-center text-slate-500 italic">
                                                            ... y {unreconciledTransactions.length - 10} transacciones más
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="bg-slate-900/20 border-slate-800 border-dashed">
                            <CardContent className="p-20 text-center">
                                <Calculator className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-20" />
                                <h3 className="text-slate-500 font-bold uppercase tracking-widest mb-2">Selecciona una Cuenta</h3>
                                <p className="text-slate-600 text-sm">Elige una cuenta bancaria para comenzar la conciliación</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};