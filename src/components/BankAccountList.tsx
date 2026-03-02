import React, { useState } from 'react';
import {
    BadgeDollarSign, Edit, Trash2, Search, Plus,
    CreditCard, ShieldCheck, Landmark, Archive,
    AlertTriangle, XCircle, BookOpen, CheckCircle2, X
} from 'lucide-react';
import { BankAccount, getBankAccountTransactionCount } from '../database/simple-db';
import { useLocale } from '../i18n/useLocale';

type CardPhase =
    | 'confirm-delete'        // Sin txns, saldo $0 → soft delete directo
    | 'blocked-transactions'  // Tiene txns → BLOQUEO, ofrecer archivar
    | 'confirm-archive'       // Tiene txns, saldo $0 → confirmar archivado
    | 'blocked-balance';      // Tiene txns, saldo ≠ $0 → requiere Journal Entry

interface ActiveCard {
    id: number;
    phase: CardPhase;
    txCount?: number;
}

interface BankAccountListProps {
    accounts: BankAccount[];
    onAddAccount: () => void;
    onEditAccount: (account: BankAccount) => void;
    onDeleteAccount: (id: number) => void;
    onNavigateToJournal?: () => void;
}

export const BankAccountList: React.FC<BankAccountListProps> = ({
    accounts,
    onAddAccount,
    onEditAccount,
    onDeleteAccount,
    onNavigateToJournal
}) => {
    const { t } = useLocale();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [activeCard, setActiveCard] = useState<ActiveCard | null>(null);

    const filteredAccounts = accounts.filter(account => {
        const isActive = !!account.is_active;
        const matchesSearch =
            account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.account_number.includes(searchTerm);
        const matchesType = filterType === 'all' || account.account_type === filterType;
        return isActive && matchesSearch && matchesType;
    });

    // ── Árbol de decisión al clic de 🗑️ ──────────────────────────────────
    const handleTrashClick = (account: BankAccount) => {
        const txCount = getBankAccountTransactionCount(account.id);
        const hasBalance = account.balance !== 0;

        if (txCount === 0 && !hasBalance) {
            // Sin historial, sin saldo → eliminar directo
            setActiveCard({ id: account.id, phase: 'confirm-delete', txCount: 0 });
        } else if (txCount === 0 && hasBalance) {
            // Sin historial pero tiene saldo → bloquear balance primero
            setActiveCard({ id: account.id, phase: 'blocked-balance', txCount: 0 });
        } else {
            // Tiene historial → BLOQUEO TOTAL, proponer archivado
            setActiveCard({ id: account.id, phase: 'blocked-transactions', txCount });
        }
    };

    // ── Al hacer clic en "Inactivar / Archivar" ───────────────────────────
    const handleArchiveClick = (account: BankAccount) => {
        const hasBalance = account.balance !== 0;
        if (hasBalance) {
            setActiveCard(prev => prev ? { ...prev, phase: 'blocked-balance' } : null);
        } else {
            setActiveCard(prev => prev ? { ...prev, phase: 'confirm-archive' } : null);
        }
    };

    const dismissCard = () => setActiveCard(null);

    const getAccountTypeConfig = (type: string) => {
        switch (type) {
            case 'checking': return { label: t('bankAccountList.type.checking'), color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
            case 'savings': return { label: t('bankAccountList.type.savings'), color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
            case 'credit': return { label: t('bankAccountList.type.credit'), color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
            default: return { label: t('bankAccountList.type.general'), color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
        }
    };

    const formatCurrency = (amount: number, currency: string) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

    // ── Panel de acción expandible (pie de cada card) ─────────────────────
    const renderActionPanel = (account: BankAccount) => {
        if (!activeCard || activeCard.id !== account.id) return null;

        const { phase, txCount = 0 } = activeCard;

        // 1️⃣ Sin historial, sin saldo → confirmación simple
        if (phase === 'confirm-delete') {
            return (
                <div className="mt-6 pt-5 border-t border-rose-500/20 animate-in fade-in duration-200">
                    <p className="text-xs font-bold text-rose-400 mb-3">¿Eliminar esta cuenta? (no tiene movimientos)</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { onDeleteAccount(account.id); dismissCard(); }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sí, eliminar
                        </button>
                        <button
                            onClick={dismissCard}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            );
        }

        // 2️⃣ Tiene transacciones → BLOQUEO TOTAL + opción de archivar
        if (phase === 'blocked-transactions') {
            return (
                <div className="mt-6 pt-5 border-t border-amber-500/30 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2 mb-3">
                        <XCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-black text-rose-400 leading-snug">
                                Acción denegada — Historial de Auditoría
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                Esta cuenta tiene <span className="text-amber-400 font-bold">{txCount} movimiento{txCount !== 1 ? 's' : ''}</span> importado{txCount !== 1 ? 's' : ''}. No puede eliminarse — quedarían registros huérfanos que romperían la cadena forense SHA-256 y la partida doble US GAAP.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => handleArchiveClick(account)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2 bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                        >
                            <Archive className="w-3.5 h-3.5" /> Inactivar / Archivar
                        </button>
                        <button
                            onClick={dismissCard}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            );
        }

        // 3️⃣ Tiene txns + saldo ≠ $0 → requiere Journal Entry primero
        if (phase === 'blocked-balance') {
            return (
                <div className="mt-6 pt-5 border-t border-amber-500/30 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-black text-amber-400 leading-snug">
                                Balance General requiere saldo $0.00
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                Esta cuenta tiene un saldo de <span className="text-white font-bold">{formatCurrency(account.balance, account.currency)}</span>. Transfiere estos fondos a otra cuenta activa mediante un Journal Entry antes de archivarla.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        {onNavigateToJournal && (
                            <button
                                onClick={() => { dismissCard(); onNavigateToJournal(); }}
                                className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                            >
                                <BookOpen className="w-3.5 h-3.5" /> Crear Journal Entry
                            </button>
                        )}
                        <button
                            onClick={dismissCard}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            );
        }

        // 4️⃣ Tiene txns, saldo $0 → confirmar archivado (soft delete)
        if (phase === 'confirm-archive') {
            return (
                <div className="mt-6 pt-5 border-t border-emerald-500/20 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2 mb-3">
                        <Archive className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-black text-emerald-400">¿Archivar esta cuenta?</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                                La cuenta quedará inactiva y oculta en los selectores. Sus {txCount} movimiento{txCount !== 1 ? 's' : ''} se conservan para auditoría — la cadena forense permanece intacta.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { onDeleteAccount(account.id); dismissCard(); }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sí, archivar
                        </button>
                        <button
                            onClick={dismissCard}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg group">
                        <Landmark className="w-10 h-10 text-blue-500 group-hover:-rotate-12 transition-transform duration-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">{t('bankAccountList.title')}</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">{t('bankAccountList.subtitle')}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-center">
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('bankAccountList.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-sm font-medium"
                        />
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-3 bg-slate-800/50 text-white rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium cursor-pointer"
                    >
                        <option value="all">{t('bankAccountList.filterAll')}</option>
                        <option value="checking">{t('bankAccountList.type.checking')}</option>
                        <option value="savings">{t('bankAccountList.type.savings')}</option>
                        <option value="credit">{t('bankAccountList.type.credit')}</option>
                    </select>

                    <button
                        onClick={onAddAccount}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        {t('bankAccountList.syncVault')}
                    </button>
                </div>
            </div>

            {/* Intelligence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <EliteMiniCard title={t('bankAccountList.stats.activeAccounts')} value={accounts.filter(a => a.is_active).length.toString()} icon={ShieldCheck} color="blue" />
                <EliteMiniCard title={t('bankAccountList.stats.totalLiquidity')} value={formatCurrency(accounts.filter(a => a.is_active).reduce((sum, a) => sum + a.balance, 0), 'USD')} icon={BadgeDollarSign} color="emerald" />
                <EliteMiniCard title={t('bankAccountList.stats.creditLines')} value={accounts.filter(a => a.is_active && a.account_type === 'credit').length.toString()} icon={CreditCard} color="amber" />
                <EliteMiniCard title={t('bankAccountList.stats.entities')} value={Array.from(new Set(accounts.filter(a => a.is_active).map(a => a.bank_name))).length.toString()} icon={Landmark} color="rose" />
            </div>

            {filteredAccounts.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-24 text-center border-dashed group opacity-60">
                    <Landmark className="w-20 h-20 text-slate-800 mx-auto mb-8 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-lg font-semibold text-slate-400">{t('bankAccountList.empty.title')}</h3>
                    <p className="text-slate-500 text-sm mt-2">{t('bankAccountList.empty.desc')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredAccounts.map((account) => {
                        const cfg = getAccountTypeConfig(account.account_type);
                        const isExpanded = activeCard?.id === account.id;
                        return (
                            <div
                                key={account.id}
                                className={`relative bg-slate-900 p-8 rounded-[3rem] border-2 transition-all duration-500 group overflow-hidden
                                    ${isExpanded
                                        ? 'border-amber-500/30 shadow-xl shadow-amber-900/10'
                                        : 'border-slate-800 hover:border-blue-500/40 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/20'
                                    }`}
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700" />

                                <div className="relative z-10">
                                    {/* Header: ícono + botones */}
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`p-4 rounded-2.2xl border shadow-lg ${cfg.bg} ${cfg.border} ${cfg.color} group-hover:scale-110 transition-transform`}>
                                            <CreditCard className="w-7 h-7" />
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <button
                                                onClick={() => onEditAccount(account)}
                                                className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all"
                                                title="Editar cuenta"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => isExpanded ? dismissCard() : handleTrashClick(account)}
                                                className={`p-3 border rounded-xl transition-all ${isExpanded
                                                    ? 'bg-slate-700 border-slate-600 text-slate-300'
                                                    : 'bg-slate-950 border-slate-800 text-rose-500 hover:bg-rose-600 hover:text-white'
                                                    }`}
                                                title={isExpanded ? 'Cancelar' : 'Eliminar / Archivar'}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info de la cuenta */}
                                    <div className="mb-8">
                                        <h3 className="text-xl font-black text-white tracking-tight leading-none mb-2 truncate group-hover:text-blue-400 transition-colors">
                                            {account.account_name}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-500">{account.bank_name}</p>
                                    </div>

                                    {/* Balance + tipo */}
                                    <div className="space-y-6 pt-6 border-t border-slate-800/50">
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 mb-2">{t('bankAccountList.card.liquidPosition')}</p>
                                            <p className={`text-2xl font-black font-mono tracking-tight ${account.balance >= 0 ? 'text-white' : 'text-rose-500'}`}>
                                                {formatCurrency(account.balance, account.currency)}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className={`px-4 py-1.5 rounded-lg border text-xs font-bold ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                                {cfg.label}
                                            </div>
                                            <div className="text-xs font-bold text-slate-500 font-mono tracking-wider">
                                                •••• {account.account_number.slice(-4)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Panel de decisión (se expande al clic en 🗑️) */}
                                    {renderActionPanel(account)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const EliteMiniCard = ({ title, value, icon: Icon, color }: any) => {
    const themes: any = {
        blue: 'text-blue-500 bg-blue-600/10 border-blue-500/20 shadow-blue-900/5',
        emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20 shadow-emerald-900/5',
        amber: 'text-amber-500 bg-amber-600/10 border-amber-500/20 shadow-amber-900/5',
        rose: 'text-rose-500 bg-rose-600/10 border-rose-500/20 shadow-rose-900/5',
    };
    return (
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-xl hover:border-slate-700 transition-all flex items-center gap-6 group">
            <div className={`p-4 rounded-2.5xl border ${themes[color]} group-hover:scale-110 transition-all duration-500`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <div className="text-xl font-black text-white tracking-tight leading-none mb-2 font-mono truncate max-w-[150px]">{value}</div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{title}</div>
            </div>
        </div>
    );
};
