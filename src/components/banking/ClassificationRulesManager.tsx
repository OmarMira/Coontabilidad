import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Trash2, ToggleLeft, ToggleRight,
    Zap, Filter, MoreHorizontal, ShieldCheck, X
} from 'lucide-react';
import { getChartOfAccounts, ChartOfAccount } from '../../database/simple-db';
import { ClassificationRulesService, ClassificationRule } from '../../services/banking/ClassificationRulesService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const ClassificationRulesManager: React.FC = () => {
    const { user } = useAuth();
    const [rules, setRules] = useState<ClassificationRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [chartOfAccounts] = useState<ChartOfAccount[]>(getChartOfAccounts());

    // Form state
    const [newRule, setNewRule] = useState({
        pattern: '',
        match_type: 'CONTAINS' as 'CONTAINS' | 'STARTS_WITH' | 'EXACT',
        account_code: '',
        account_name: '',
        account_type: '',
        priority: 0
    });

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setLoading(true);
        const data = await ClassificationRulesService.getRules();
        setRules(data);
        setLoading(false);
    };

    const handleToggle = async (id: number, current: boolean) => {
        const success = await ClassificationRulesService.toggleRule(id, !current);
        if (success) {
            toast.success('Estado de regla actualizado');
            setRules(rules.map(r => r.id === id ? { ...r, is_active: !current } : r));
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta regla?')) return;
        const success = await ClassificationRulesService.deleteRule(id);
        if (success) {
            toast.success('Regla eliminada');
            setRules(rules.filter(r => r.id !== id));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!newRule.pattern || !newRule.account_code) {
            toast.error('Completa todos los campos obligatorios');
            return;
        }

        const success = await ClassificationRulesService.saveRule({
            ...newRule,
            is_active: true
        }, user.id);

        if (success) {
            toast.success('Regla de automatización creada');
            setShowAddForm(false);
            setNewRule({
                pattern: '',
                match_type: 'CONTAINS',
                account_code: '',
                account_name: '',
                account_type: '',
                priority: 0
            });
            loadRules();
        }
    };

    const selectAccount = (acc: ChartOfAccount) => {
        setNewRule({
            ...newRule,
            account_code: acc.account_code,
            account_name: acc.account_name,
            account_type: acc.account_type
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                        Motor de <span className="text-amber-500">Reglas</span>
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">Automatización de Clasificación Bancaria</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-500 transition-all shadow-xl shadow-white/5 active:scale-95"
                >
                    <Plus size={14} /> Nueva Regla
                </button>
            </header>

            {/* Stats/Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Zap className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <div className="text-xl font-black text-white">{rules.length}</div>
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Reglas Activas</div>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <div className="text-xl font-black text-white">Precisión 100%</div>
                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Criterio Determinístico</div>
                    </div>
                </div>
            </div>

            {/* Rules List */}
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800">
                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Patrón / Criterio</th>
                            <th className="px-8 py-5 text-left text-[9px] font-black text-slate-500 uppercase tracking-widest">Cuenta Contable</th>
                            <th className="px-8 py-5 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Prioridad</th>
                            <th className="px-8 py-5 text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
                            <th className="px-8 py-5 text-right text-[9px] font-black text-slate-500 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-slate-600 font-bold uppercase tracking-widest animate-pulse">Cargando reglas...</td>
                            </tr>
                        ) : rules.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-20 text-center">
                                    <div className="text-slate-700 font-black uppercase tracking-widest text-xs">No hay reglas configuradas</div>
                                    <button onClick={() => setShowAddForm(true)} className="text-amber-500 text-[10px] font-black uppercase mt-4 hover:underline">Crear la primera regla</button>
                                </td>
                            </tr>
                        ) : rules.map(rule => (
                            <tr key={rule.id} className="border-b border-slate-800/50 group hover:bg-slate-800/20 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <Filter size={14} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-white">{rule.pattern}</div>
                                            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                                Modo: <span className="text-blue-500">{rule.match_type}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-xs font-bold text-slate-300">
                                        <span className="font-black text-emerald-500 mr-2">{rule.account_code}</span>
                                        {rule.account_name}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-2 py-1 rounded-md">{rule.priority}</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <button onClick={() => handleToggle(rule.id, rule.is_active)}>
                                        {rule.is_active ?
                                            <ToggleRight className="text-emerald-500 w-8 h-8" /> :
                                            <ToggleLeft className="text-slate-700 w-8 h-8" />
                                        }
                                    </button>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        className="p-2 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Nueva Regla */}
            {showAddForm && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
                    <div className="bg-slate-900 border-2 border-slate-800 rounded-[3rem] shadow-4xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Crear <span className="text-amber-500">Regla</span> Inteligente</h3>
                            <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Patrón de Búsqueda (Descripción)</label>
                                    <input
                                        autoFocus
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white focus:border-amber-500 focus:outline-none transition-all"
                                        placeholder="Ej: STARBUCKS, UBER, MERCADO PAGO..."
                                        value={newRule.pattern}
                                        onChange={e => setNewRule({ ...newRule, pattern: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Match</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white focus:border-amber-500 focus:outline-none appearance-none transition-all"
                                            value={newRule.match_type}
                                            onChange={e => setNewRule({ ...newRule, match_type: e.target.value as any })}
                                        >
                                            <option value="CONTAINS">CONTIENE</option>
                                            <option value="STARTS_WITH">EMPIEZA CON</option>
                                            <option value="EXACT">IGUAL A</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prioridad (0-100)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-bold text-white focus:border-amber-500 focus:outline-none transition-all"
                                            value={newRule.priority}
                                            onChange={e => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asignar Cuenta Contable</label>
                                    <div className="max-h-48 overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl p-2 space-y-1 custom-scrollbar">
                                        {chartOfAccounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                type="button"
                                                onClick={() => selectAccount(acc)}
                                                className={`w-full text-left p-3 rounded-xl text-[10px] font-bold transition-all ${newRule.account_code === acc.account_code ? 'bg-amber-500 text-black' : 'hover:bg-slate-800 text-slate-400'}`}
                                            >
                                                <span className={`${newRule.account_code === acc.account_code ? 'text-black' : 'text-slate-500'} mr-2 font-black`}>{acc.account_code}</span>
                                                {acc.account_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-slate-800 text-slate-500 hover:bg-slate-800 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-500 transition-all shadow-xl shadow-white/5"
                                >
                                    Guardar Regla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
