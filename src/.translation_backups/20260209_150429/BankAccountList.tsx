import React, { useState } from 'react';
import {
    BadgeDollarSign, Edit, Trash2, Search, Plus,
    Building2, CreditCard, Zap, Activity, ShieldCheck,
    ArrowUpRight, Wallet, Landmark
} from 'lucide-react';
import { BankAccount } from '../database/simple-db';

interface BankAccountListProps {
    accounts: BankAccount[];
    onAddAccount: () => void;
    onEditAccount: (account: BankAccount) => void;
    onDeleteAccount: (id: number) => void;
}

export const BankAccountList: React.FC<BankAccountListProps> = ({
    accounts,
    onAddAccount,
    onEditAccount,
    onDeleteAccount
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    const filteredAccounts = accounts.filter(account => {
        const matchesSearch =
            account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.account_number.includes(searchTerm);
        const matchesType = filterType === 'all' || account.account_type === filterType;
        return matchesSearch && matchesType;
    });

    const getAccountTypeConfig = (type: string) => {
        switch (type) {
            case 'checking': return { label: 'CORRIENTE', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
            case 'savings': return { label: 'AHORROS', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
            case 'credit': return { label: 'CRÉDITO', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
            default: return { label: 'GENERAL', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
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
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Matriz Bancaria</h1>
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> Asset Liquidity Controller v5.0
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-center">
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="BUSCAR CUENTA / ENTIDAD..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-blue-500 focus:outline-none w-72 font-black uppercase tracking-widest text-[10px] transition-all"
                        />
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-blue-500 focus:outline-none font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
                    >
                        <option value="all">TODOS LOS TIPOS</option>
                        <option value="checking">CORRIENTE</option>
                        <option value="savings">AHORROS</option>
                        <option value="credit">CRÉDITO</option>
                    </select>

                    <button
                        onClick={onAddAccount}
                        className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-900/40 hover:-translate-y-1"
                    >
                        <Plus className="w-4 h-4" />
                        Sincronizar Bóveda
                    </button>
                </div>
            </div>

            {/* Intelligence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <EliteMiniCard title="Cuentas Activas" value={accounts.filter(a => a.is_active).length.toString()} icon={ShieldCheck} color="blue" />
                <EliteMiniCard title="Liquidez Total" value={formatCurrency(accounts.reduce((sum, a) => sum + a.balance, 0), 'USD')} icon={BadgeDollarSign} color="emerald" />
                <EliteMiniCard title="Líneas de Crédito" value={accounts.filter(a => a.account_type === 'credit').length.toString()} icon={CreditCard} color="amber" />
                <EliteMiniCard title="Entidades" value={Array.from(new Set(accounts.map(a => a.bank_name))).length.toString()} icon={Landmark} color="rose" />
            </div>

            {filteredAccounts.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-24 text-center border-dashed group opacity-60">
                    <Landmark className="w-20 h-20 text-slate-800 mx-auto mb-8 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Bóveda no Detectada</h3>
                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">No se han mapeado cuentas bancarias bajo estos parámetros.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredAccounts.map((account) => {
                        const cfg = getAccountTypeConfig(account.account_type);
                        return (
                            <div
                                key={account.id}
                                className={`relative bg-slate-900 p-8 rounded-[3rem] border-2 transition-all duration-500 group overflow-hidden ${!account.is_active ? 'border-slate-800 grayscale opacity-60' : 'border-slate-800 hover:border-blue-500/40 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/20'}`}
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-700"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`p-4 rounded-2.2xl border shadow-lg ${cfg.bg} ${cfg.border} ${cfg.color} group-hover:scale-110 transition-transform`}>
                                            <CreditCard className="w-7 h-7" />
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => onEditAccount(account)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => onDeleteAccount(account.id)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-rose-500 hover:bg-rose-600 hover:text-white transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-2 truncate group-hover:text-blue-400 transition-colors">
                                            {account.account_name}
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                            {account.bank_name}
                                        </p>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-slate-800/50">
                                        <div>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Posición Líquida</p>
                                            <p className={`text-3xl font-black font-mono tracking-tighter ${account.balance >= 0 ? 'text-white' : 'text-rose-500'}`}>
                                                {formatCurrency(account.balance, account.currency)}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className={`px-3 py-1 rounded-[0.5rem] border text-[9px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                                {cfg.label}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-500 font-mono tracking-widest">
                                                •••• {account.account_number.slice(-4)}
                                            </div>
                                        </div>
                                    </div>
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
                <div className="text-2xl font-black text-white tracking-tighter leading-none mb-1 font-mono uppercase truncate max-w-[150px]">{value}</div>
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{title}</div>
            </div>
        </div>
    );
};
