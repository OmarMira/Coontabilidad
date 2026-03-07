import React, { useState, useEffect } from 'react';
import {
    ShieldAlert, Clock, ArrowRight, CheckCircle2, AlertCircle,
    Search, Filter, ChevronRight, Calculator, MoreHorizontal, Activity
} from 'lucide-react';
import { db, getChartOfAccounts, ChartOfAccount } from '@/database/simple-db';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import toast from 'react-hot-toast';
import { useLocale } from '../../i18n/useLocale';
import { useAuth } from '../../contexts/AuthContext';
import { ClassificationMemoryService, MemorySuggestion } from '../../services/banking/ClassificationMemoryService';
import { TRANSACTION_STATES } from '../../constants/bankingStates';

interface QuarantinedTransaction {
    id: number;
    transaction_id: number;
    date: string;
    description: string;
    amount: number;
    current_state: string;
    risk_score: number;
    suggested_category: string;
    quarantine_started_at: string;
    sla_deadline: string;
    merchant_pattern?: string;
}

export const QuarantinePanel: React.FC = () => {
    const { t } = useLocale();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<QuarantinedTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState<QuarantinedTransaction | null>(null);
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);

    // Modal states
    const [memorySuggestions, setMemorySuggestions] = useState<MemorySuggestion[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadQuarantineData();
        setChartOfAccounts(getChartOfAccounts());
    }, []);

    useEffect(() => {
        if (selectedTx) {
            loadSuggestions(selectedTx.description);
            setSearchQuery('');
            setSelectedAccount(null);
            setNotes('');
        }
    }, [selectedTx]);

    const loadSuggestions = async (description: string) => {
        const memory = await ClassificationMemoryService.getSuggestions(description);
        setMemorySuggestions(memory);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
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

    const loadQuarantineData = async () => {
        setLoading(true);
        try {
            const engine = new SQLiteEngine();
            engine.setDB(db);

            const rows = await engine.select(`
        SELECT 
          ts.id,
          ts.transaction_id,
          bt.transaction_date as date,
          bt.description,
          bt.amount,
          ts.current_state,
          ts.risk_score,
          rk.suggested_category,
          rk.merchant_name as merchant_pattern,
          ts.quarantine_started_at,
          ts.sla_deadline
        FROM transaction_states ts
        JOIN bank_transactions bt ON ts.transaction_id = bt.id
        LEFT JOIN risk_keywords rk ON ts.risk_keyword_id = rk.id
        WHERE ts.current_state IN ('${TRANSACTION_STATES.HIGH_RISK_PERSONAL}', '${TRANSACTION_STATES.PENDING_SUPERVISOR}')
          AND ts.is_verified = 0
        ORDER BY ts.sla_deadline ASC
      `);

            setTransactions(rows as any);
        } catch (error) {
            console.error('Error loading quarantine data:', error);
            toast.error('Error al cargar zona de cuarentena');
        } finally {
            setLoading(false);
        }
    };

    const calculateSLAPercentage = (start: string, deadline: string) => {
        const startTime = new Date(start).getTime();
        const endTime = new Date(deadline).getTime();
        const now = new Date().getTime();

        if (!start || !deadline) return 0;

        const total = endTime - startTime;
        const elapsed = now - startTime;

        const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
        return percentage;
    };

    const getSLABarColor = (percentage: number) => {
        if (percentage < 50) return 'bg-emerald-500';
        if (percentage < 80) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const extractReference = (description: string) => {
        const match = description.match(/CONF#\s*(\S+)/i);
        return match ? match[1] : '—';
    };

    const handleReclassify = async () => {
        if (!selectedTx || !selectedAccount || !user) return;

        const loadingToast = toast.loading('Procesando reclasificación...');
        try {
            const engine = new SQLiteEngine();
            engine.setDB(db);

            // 1. Guardar en memoria de aprendizaje
            await ClassificationMemoryService.saveConfirmation(
                selectedTx.description,
                selectedAccount.account_code,
                selectedAccount.account_name,
                user.id
            );

            // 2. Marcar como verificado y cambiar estado
            await engine.run(`
                UPDATE transaction_states 
                SET current_state = ?, 
                    is_verified = 1,
                    verified_at = CURRENT_TIMESTAMP,
                    verified_by = ?
                WHERE id = ?
            `, [TRANSACTION_STATES.VERIFIED, user.id, selectedTx.id]);

            // 3. Registrar en log de auditoría
            await engine.run(`
                INSERT INTO quarantine_audit_log (
                    transaction_id, state_id, action_type, performed_by, 
                    previous_state, new_state, new_category, justification
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                selectedTx.transaction_id,
                selectedTx.id,
                TRANSACTION_STATES.RECLASSIFIED,
                user.id,
                selectedTx.current_state,
                TRANSACTION_STATES.VERIFIED,
                selectedAccount.account_code,
                notes || 'Manual reclassification'
            ]);

            toast.success('Transacción reclasificada con éxito', { id: loadingToast });
            setSelectedTx(null);
            loadQuarantineData();

            // Actualizar badge del sidebar
            window.dispatchEvent(new CustomEvent('quarantine-updated'));

        } catch (error) {
            console.error('Error in reclassification:', error);
            toast.error('Error al reclasificar', { id: loadingToast });
        }
    };

    const getSuggestedAccounts = (category: string) => {
        if (category === 'PERSONAL_EXPENSE' || category === 'OWNERS_DRAW') {
            return chartOfAccounts.filter(a => a.account_code.startsWith('3') || a.account_name.toLowerCase().includes('draw') || a.account_name.toLowerCase().includes('personal'));
        }
        if (category === 'TRANSPORT_INCOME') {
            return chartOfAccounts.filter(a => a.account_code.startsWith('4') && (a.account_name.toLowerCase().includes('uber') || a.account_name.toLowerCase().includes('servicios')));
        }
        return chartOfAccounts.slice(0, 5);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Zona de Cuarentena</h1>
                        <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" />
                            Auditoría Forense: {transactions.length} transacciones bajo revisión de 72h SLA
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Motor v2.0 Activo</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : transactions.length === 0 ? (
                <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-20 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">Todo en orden</h3>
                    <p className="text-slate-500">No hay transacciones interceptadas en las últimas 72 horas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-4">
                        {transactions.map(tx => {
                            const slaPercent = calculateSLAPercentage(tx.quarantine_started_at, tx.sla_deadline);
                            const isSelected = selectedTx?.id === tx.id;

                            return (
                                <div
                                    key={tx.id}
                                    onClick={() => setSelectedTx(tx)}
                                    className={`
                    group relative overflow-hidden bg-slate-900 rounded-2xl border transition-all duration-300 cursor-pointer
                    ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'}
                  `}
                                >
                                    <div className="p-5 flex flex-col md:flex-row gap-6 items-center">
                                        <div className="flex-shrink-0 text-center md:text-left md:w-32">
                                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{tx.date}</div>
                                            <div className={`text-xl font-black ${tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                ${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors uppercase">
                                                {tx.description}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-black uppercase tracking-tighter flex items-center gap-1">
                                                    <Search className="w-2.5 h-2.5" />
                                                    Pattern: {tx.merchant_pattern || 'No Match'}
                                                </span>
                                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 italic">
                                                    Ref: {extractReference(tx.description)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-48 space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                <span>SLA Time</span>
                                                <span>{slaPercent.toFixed(0)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${getSLABarColor(slaPercent)}`}
                                                    style={{ width: `${slaPercent}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedTx(tx);
                                                }}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg
                                                    ${isSelected ? 'bg-blue-600 text-white' : 'bg-amber-500/10 border border-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-black'}
                                                `}
                                            >
                                                Clasificar
                                            </button>
                                            <ChevronRight className={`w-4 h-4 transition-all ${isSelected ? 'text-blue-500 translate-x-1' : 'text-slate-700'}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="xl:col-span-1">
                        <div className="sticky top-6 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                            {!selectedTx ? (
                                <div className="p-10 text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto border border-slate-700">
                                        <AlertCircle className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                        Selecciona una transacción para auditar
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-in slide-in-from-right-4 duration-300">
                                    <div className="p-6 border-b border-slate-800 bg-gradient-to-br from-blue-600/5 to-transparent">
                                        <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                                            <Calculator className="w-5 h-5 text-blue-500" />
                                            Resolución de Auditoría
                                        </h3>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Sección 1 — Descriptor bancario */}
                                        <div className="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Descriptor Original</div>
                                            <div className="text-xs font-mono text-slate-300 break-words leading-relaxed">
                                                {selectedTx.description}
                                            </div>
                                        </div>

                                        {/* Sección 2 — Sugerencias */}
                                        <div className="space-y-3">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Sugerencias Disponibles</div>
                                            <div className="space-y-2">
                                                {/* Coincidencias de Memoria */}
                                                {memorySuggestions.map((s, idx) => (
                                                    <button
                                                        key={`mem-${idx}`}
                                                        onClick={() => {
                                                            setSelectedAccount(chartOfAccounts.find(a => a.account_code === s.accountCode) || null);
                                                            setSearchQuery(s.accountName);
                                                        }}
                                                        className="w-full flex items-center justify-between p-3 bg-emerald-500/10 hover:bg-emerald-600/20 rounded-xl border border-emerald-500/20 text-emerald-400 transition-all text-xs"
                                                    >
                                                        <div className="text-left">
                                                            <div className="font-black">{s.accountName} ({s.accountCode})</div>
                                                            <div className="text-[8px] uppercase opacity-70">Usado antes ({s.useCount} veces)</div>
                                                        </div>
                                                        <CheckCircle2 size={14} />
                                                    </button>
                                                ))}

                                                {/* Sugerencias de Motor IA */}
                                                {getSuggestedAccounts(selectedTx.suggested_category).map((a, idx) => (
                                                    <button
                                                        key={`ia-${idx}`}
                                                        onClick={() => {
                                                            setSelectedAccount(a);
                                                            setSearchQuery(a.account_name);
                                                        }}
                                                        className="w-full flex items-center justify-between p-3 bg-blue-500/10 hover:bg-blue-600/20 rounded-xl border border-blue-500/20 text-blue-400 transition-all text-xs"
                                                    >
                                                        <div className="text-left">
                                                            <div className="font-black">{a.account_name} ({a.account_code})</div>
                                                            <div className="text-[8px] uppercase opacity-70">Sugerido por IA</div>
                                                        </div>
                                                        <Activity size={12} className="animate-pulse" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sección 3 — Buscador Libre */}
                                        <div className="space-y-3">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Codificación Contable</div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Search size={14} className="text-slate-500" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => handleSearchChange(e.target.value)}
                                                    placeholder="Buscar cuenta o código..."
                                                    className="w-full bg-slate-950 text-white pl-10 pr-4 py-4 rounded-xl border border-slate-800 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                                                />
                                                {filteredAccounts.length > 0 && (
                                                    <div className="absolute z-20 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
                                                        {filteredAccounts.map(account => (
                                                            <button
                                                                key={account.id}
                                                                onClick={() => {
                                                                    setSelectedAccount(account);
                                                                    setSearchQuery(account.account_name);
                                                                    setFilteredAccounts([]);
                                                                }}
                                                                className="w-full text-left p-3 hover:bg-slate-800 text-xs text-slate-300 hover:text-white border-b border-slate-800 last:border-0"
                                                            >
                                                                <span className="font-black">{account.account_code}</span> — {account.account_name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {selectedAccount && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
                                                    <CheckCircle2 size={12} className="text-blue-400" />
                                                    <span className="text-[10px] font-black text-blue-400 uppercase">Seleccionado: {selectedAccount.account_code}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sección 4 — Nota */}
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Justificación (Opcional)</div>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                rows={2}
                                                className="w-full bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-800 text-xs font-medium focus:outline-none focus:border-blue-500 transition-all resize-none"
                                                placeholder="Agregar nota sobre esta reclasificación..."
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                disabled={!selectedAccount}
                                                onClick={handleReclassify}
                                                className={`
                                                    w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all
                                                    ${selectedAccount
                                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40 hover:-translate-y-1'
                                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                                                `}
                                            >
                                                Certificar y Clasificar
                                            </button>
                                        </div>
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
