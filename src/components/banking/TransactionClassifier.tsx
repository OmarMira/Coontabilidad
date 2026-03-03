import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, ListChecks, Activity } from 'lucide-react';
import { getDBEngine, getChartOfAccounts, ChartOfAccount } from '../../database/simple-db';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { TRANSACTION_STATES } from '../../constants/bankingStates';
import { ClassificationMemoryService, MemorySuggestion } from '../../services/banking/ClassificationMemoryService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ImportedTransaction {
    id: number;
    transaction_id: number;
    date: string;
    description: string;
    amount: number;
    state_id: number;
}

interface TransactionClassifierProps {
    accountId: number;
}

export const TransactionClassifier: React.FC<TransactionClassifierProps> = ({ accountId }) => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState<ImportedTransaction | null>(null);
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
    const [memorySuggestions, setMemorySuggestions] = useState<MemorySuggestion[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
    const [notes, setNotes] = useState('');
    const [selectedTxIds, setSelectedTxIds] = useState<Set<number>>(new Set());
    const [isAutoSuggested, setIsAutoSuggested] = useState(false);

    useEffect(() => {
        loadTransactions();
        setChartOfAccounts(getChartOfAccounts());
    }, [accountId]);

    useEffect(() => {
        if (selectedTx) {
            loadSuggestions(selectedTx.description);
            setSearchQuery('');
            setSelectedAccount(null);
            setNotes('');
            setIsAutoSuggested(false);
        }
    }, [selectedTx]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const engine = getDBEngine();
            const rows = await engine.select(`
                SELECT 
                    ts.id as state_id,
                    bt.id as transaction_id,
                    bt.transaction_date as date,
                    bt.description,
                    bt.amount
                FROM bank_transactions bt
                JOIN transaction_states ts ON ts.transaction_id = bt.id
                WHERE bt.bank_account_id = ?
                  AND ts.current_state = ?
                  AND ts.is_verified = 0
                ORDER BY bt.transaction_date DESC
            `, [accountId, TRANSACTION_STATES.IMPORTED]);
            setTransactions(rows as any);
        } catch (error) {
            console.error('Error loading transactions:', error);
            toast.error('Error al cargar transacciones');
        } finally {
            setLoading(false);
        }
    };

    const loadSuggestions = async (description: string) => {
        const memory = await ClassificationMemoryService.getSuggestions(description);
        setMemorySuggestions(memory);

        // Auto-select the first suggestion if available
        if (memory.length > 0 && !selectedAccount) {
            const bestSuggestion = memory[0];
            const account = chartOfAccounts.find(a => a.account_code === bestSuggestion.accountCode);
            if (account) {
                setSelectedAccount(account);
                setSearchQuery(account.account_name);
                setIsAutoSuggested(true);
            }
        }
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setIsAutoSuggested(false); // Manually typing clears auto-suggest flag
        if (query.length > 1) {
            const filtered = chartOfAccounts.filter(a =>
                a.account_name.toLowerCase().includes(query.toLowerCase()) ||
                a.account_code.includes(query)
            ).slice(0, 5);
            setFilteredAccounts(filtered);
        } else {
            setFilteredAccounts([]);
        }
    };

    const toggleTxSelection = (id: number) => {
        const next = new Set(selectedTxIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedTxIds(next);
    };

    const selectAllVisible = () => {
        if (selectedTxIds.size === transactions.length) {
            setSelectedTxIds(new Set());
        } else {
            setSelectedTxIds(new Set(transactions.map(t => t.state_id)));
        }
    };

    const handleClassify = async () => {
        const targetIds = selectedTxIds.size > 0
            ? Array.from(selectedTxIds)
            : (selectedTx ? [selectedTx.state_id] : []);

        if (targetIds.length === 0 || !selectedAccount || !user) return;

        const loadingToast = toast.loading(targetIds.length > 1
            ? `Clasificando ${targetIds.length} transacciones...`
            : 'Clasificando transacción...');

        try {
            const engine = getDBEngine();

            // If single selection, save to memory
            if (selectedTx && targetIds.length === 1) {
                await ClassificationMemoryService.saveConfirmation(
                    selectedTx.description,
                    selectedAccount.account_code,
                    selectedAccount.account_name,
                    user.id
                );
            }

            // Bulk update status
            const placeholders = targetIds.map(() => '?').join(',');
            await engine.run(`
                UPDATE transaction_states 
                SET current_state = ?, 
                    is_verified = 1,
                    verified_at = CURRENT_TIMESTAMP,
                    verified_by = ?
                WHERE id IN (${placeholders})
            `, [TRANSACTION_STATES.VERIFIED, user.id, ...targetIds]);

            toast.success(targetIds.length > 1
                ? `${targetIds.length} transacciones clasificadas correctamente`
                : 'Transacción clasificada correctamente', { id: loadingToast });

            setSelectedTx(null);
            setSelectedTxIds(new Set());
            setSelectedAccount(null);
            setSearchQuery('');
            setIsAutoSuggested(false);
            loadTransactions();
        } catch (error) {
            console.error('Error classifying:', error);
            toast.error('Error al clasificar', { id: loadingToast });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <ListChecks className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Clasificador de Transacciones</h1>
                    <p className="text-slate-400 text-sm">{transactions.length} transacciones pendientes de clasificar</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
            ) : transactions.length === 0 ? (
                <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">Todo clasificado</h3>
                    <p className="text-slate-500">No hay transacciones pendientes para esta cuenta.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-4">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <button
                                onClick={selectAllVisible}
                                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-emerald-500 transition-colors"
                            >
                                {selectedTxIds.size === transactions.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                            </button>
                        </div>
                        {transactions.map(tx => (
                            <div
                                key={tx.state_id}
                                className={`group bg-slate-900 rounded-2xl border transition-all duration-300 p-5 flex items-center gap-6
                                ${selectedTxIds.has(tx.state_id) ? 'bg-emerald-500/5 border-emerald-500/30' :
                                        selectedTx?.state_id === tx.state_id
                                            ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                                            : 'border-slate-800 hover:border-slate-700'}`}
                            >
                                <div className="flex items-center h-full">
                                    <input
                                        type="checkbox"
                                        checked={selectedTxIds.has(tx.state_id)}
                                        onChange={() => toggleTxSelection(tx.state_id)}
                                        className="w-5 h-5 rounded-lg border-2 border-slate-700 bg-slate-950 checked:bg-emerald-600 checked:border-emerald-500 focus:ring-0 transition-all cursor-pointer"
                                    />
                                </div>
                                <div
                                    onClick={() => setSelectedTx(tx)}
                                    className="flex-1 flex items-center gap-6 cursor-pointer"
                                >
                                    <div className="w-32 flex-shrink-0">
                                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{tx.date}</div>
                                        <div className={`text-xl font-black ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            ${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-white truncate uppercase group-hover:text-emerald-400 transition-colors">
                                            {tx.description}
                                        </div>
                                    </div>
                                    <button className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                    ${selectedTx?.state_id === tx.state_id
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'}`}>
                                        Clasificar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="xl:col-span-1">
                        <div className="sticky top-6 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                            {!selectedTx ? (
                                <div className="p-10 text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto border border-slate-700">
                                        <ListChecks className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                        Seleccioná una transacción
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in slide-in-from-right-4 duration-300">
                                    <div className="p-6 border-b border-slate-800">
                                        <h3 className="text-lg font-black text-white uppercase tracking-tighter">Asignar Cuenta Contable</h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                                {selectedTxIds.size > 1 ? `${selectedTxIds.size} Transacciones Seleccionadas` : 'Descripción'}
                                            </div>
                                            <div className="text-xs font-mono text-slate-300 break-words">
                                                {selectedTxIds.size > 1 ? (
                                                    <div className="space-y-1">
                                                        {transactions.filter(t => selectedTxIds.has(t.state_id)).slice(0, 3).map(t => (
                                                            <div key={t.state_id} className="truncate">• {t.description}</div>
                                                        ))}
                                                        {selectedTxIds.size > 3 && <div>... y {selectedTxIds.size - 3} más</div>}
                                                    </div>
                                                ) : (
                                                    selectedTx.description
                                                )}
                                            </div>
                                        </div>

                                        {memorySuggestions.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Usadas antes</div>
                                                {memorySuggestions.map((s, idx) => (
                                                    <button key={idx}
                                                        onClick={() => {
                                                            setSelectedAccount(chartOfAccounts.find(a => a.account_code === s.accountCode) || null);
                                                            setSearchQuery(s.accountName);
                                                        }}
                                                        className="w-full flex items-center justify-between p-3 bg-emerald-500/10 hover:bg-emerald-600/20 rounded-xl border border-emerald-500/20 text-emerald-400 transition-all text-xs">
                                                        <div className="text-left">
                                                            <div className="font-black">{s.accountName} ({s.accountCode})</div>
                                                            <div className="text-[8px] uppercase opacity-70">Usado {s.useCount} veces</div>
                                                        </div>
                                                        <CheckCircle2 size={14} />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Buscar cuenta</div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Search size={14} className="text-slate-500" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => handleSearchChange(e.target.value)}
                                                    placeholder="Nombre o código de cuenta..."
                                                    className="w-full bg-slate-950 text-white pl-10 pr-4 py-4 rounded-xl border border-slate-800 text-xs font-bold focus:outline-none focus:border-emerald-500 transition-all"
                                                />
                                                {filteredAccounts.length > 0 && (
                                                    <div className="absolute z-20 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
                                                        {filteredAccounts.map(account => (
                                                            <button key={account.id}
                                                                onClick={() => {
                                                                    setSelectedAccount(account);
                                                                    setSearchQuery(account.account_name);
                                                                    setFilteredAccounts([]);
                                                                }}
                                                                className="w-full text-left p-3 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border-b border-slate-800 last:border-0">
                                                                <span className="font-black">{account.account_code}</span> — {account.account_name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedAccount && (
                                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isAutoSuggested ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-600/20 border-emerald-500/30'}`}>
                                                    <CheckCircle2 size={12} className={isAutoSuggested ? 'text-amber-400' : 'text-emerald-400'} />
                                                    <span className={`text-[10px] font-black uppercase ${isAutoSuggested ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                        {isAutoSuggested ? `Sugerido: ${selectedAccount.account_code} - ${selectedAccount.account_name}` : `Seleccionado: ${selectedAccount.account_code}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={2}
                                            className="w-full bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-800 text-xs font-medium focus:outline-none focus:border-emerald-500 transition-all resize-none"
                                            placeholder="Nota opcional..."
                                        />

                                        <button
                                            disabled={!selectedAccount || (selectedTxIds.size === 0 && !selectedTx)}
                                            onClick={handleClassify}
                                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all
                                                ${selectedAccount && (selectedTxIds.size > 0 || selectedTx)
                                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl hover:-translate-y-1'
                                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
                                            {selectedTxIds.size > 1
                                                ? `Clasificar ${selectedTxIds.size} transacciones`
                                                : 'Confirmar Clasificación'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
