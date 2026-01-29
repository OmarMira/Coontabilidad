import React, { useState, useEffect } from 'react';
import {
    Settings,
    Save,
    Plus,
    Trash2,
    Percent,
    DollarSign,
    Info,
    ShieldCheck,
    X,
    AlertCircle
} from 'lucide-react';
import {
    getPayrollSettings,
    updatePayrollSetting,
    getTaxBrackets,
    createTaxBracket,
    deleteTaxBracket,
    PayrollSetting,
    TaxBracket
} from '../../database/simple-db';
import { toast } from 'react-hot-toast';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const PayrollSettings: React.FC = () => {
    const [settings, setSettings] = useState<PayrollSetting[]>([]);
    const [brackets, setBrackets] = useState<TaxBracket[]>([]);
    const [activeTab, setActiveTab] = useState<'rates' | 'brackets'>('rates');

    // Modal state
    const [showBracketModal, setShowBracketModal] = useState(false);
    const [bracketForm, setBracketForm] = useState({
        min_income: '',
        max_income: '',
        fixed_amount: '',
        percentage: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setSettings(getPayrollSettings());
        setBrackets(getTaxBrackets());
    };

    const handleUpdateSetting = (key: string, value: string) => {
        const res = updatePayrollSetting(key, value);
        if (res.success) {
            toast.success('Parámetro actualizado');
            loadData();
        } else {
            toast.error(res.message);
        }
    };

    const handleOpenBracketModal = () => {
        setBracketForm({
            min_income: '',
            max_income: '',
            fixed_amount: '',
            percentage: ''
        });
        setShowBracketModal(true);
    };

    const handleSaveBracket = async () => {
        // Validaciones
        if (!bracketForm.min_income || !bracketForm.fixed_amount || !bracketForm.percentage) {
            toast.error('Complete todos los campos obligatorios');
            return;
        }

        const minIncome = parseFloat(bracketForm.min_income);
        const maxIncome = bracketForm.max_income ? parseFloat(bracketForm.max_income) : null;
        const fixedAmount = parseFloat(bracketForm.fixed_amount);
        const percentage = parseFloat(bracketForm.percentage) / 100; // Convertir de % a decimal

        if (isNaN(minIncome) || isNaN(fixedAmount) || isNaN(percentage)) {
            toast.error('Los valores deben ser numéricos');
            return;
        }

        if (minIncome < 0 || fixedAmount < 0 || percentage < 0 || percentage > 1) {
            toast.error('Los valores deben ser positivos y el porcentaje menor a 100');
            return;
        }

        if (maxIncome !== null && maxIncome <= minIncome) {
            toast.error('El ingreso máximo debe ser mayor al mínimo');
            return;
        }

        setIsSaving(true);
        const res = createTaxBracket({
            min_income: minIncome,
            max_income: maxIncome ?? undefined,
            fixed_amount: fixedAmount,
            percentage: percentage
        });
        setIsSaving(false);

        if (res.success) {
            toast.success('Rango de ISR creado exitosamente');
            setShowBracketModal(false);
            loadData();
        } else {
            toast.error(res.message);
        }
    };

    const handleDeleteBracket = (id: number) => {
        if (!confirm('¿Está seguro de eliminar este rango de ISR? Esta acción no se puede deshacer.')) {
            return;
        }

        const res = deleteTaxBracket(id);
        if (res.success) {
            toast.success('Rango eliminado');
            loadData();
        } else {
            toast.error(res.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Settings className="w-8 h-8 text-indigo-500" />
                        Configuración de Nómina
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Parámetros, Tasas e Impuestos</p>
                </div>

                <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('rates')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'rates' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        Tasas de Ley
                    </button>
                    <button
                        onClick={() => setActiveTab('brackets')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'brackets' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        Tablas ISR
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'rates' ? (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="border-b border-slate-800">
                                <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                                    <Percent className="w-5 h-5 text-indigo-400" />
                                    Deducciones y Retenciones Fijas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-800">
                                    {settings.map(s => (
                                        <div key={s.id} className="p-6 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                                            <div className="space-y-1">
                                                <p className="font-bold text-white text-sm">{s.description}</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-black">{s.setting_key}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="text"
                                                    defaultValue={s.setting_value}
                                                    onBlur={(e) => handleUpdateSetting(s.setting_key, e.target.value)}
                                                    className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-right text-indigo-400 font-mono font-bold focus:border-indigo-500 outline-none"
                                                />
                                                <span className="text-slate-500 text-xs font-bold">%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-slate-900 border-slate-800">
                            <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between">
                                <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                    Tabla Progresiva de ISR (Mensual)
                                </CardTitle>
                                <Button
                                    size="sm"
                                    onClick={handleOpenBracketModal}
                                    className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Nuevo Rango
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[9px]">
                                        <tr>
                                            <th className="px-6 py-4">Desde (Min)</th>
                                            <th className="px-6 py-4">Hasta (Max)</th>
                                            <th className="px-6 py-4 text-right">Cuota Fija</th>
                                            <th className="px-6 py-4 text-right">% Exc.</th>
                                            <th className="px-6 py-4 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {brackets.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic">No hay rangos configurados. Haga clic en "+ Nuevo Rango" para agregar.</td>
                                            </tr>
                                        ) : (
                                            brackets.map(b => (
                                                <tr key={b.id} className="hover:bg-white/[0.01]">
                                                    <td className="px-6 py-4 font-mono text-white">${b.min_income.toLocaleString()}</td>
                                                    <td className="px-6 py-4 font-mono text-slate-400">{b.max_income ? `$${b.max_income.toLocaleString()}` : 'En adelante'}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-emerald-400">${b.fixed_amount.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right font-mono text-indigo-400">{(b.percentage * 100).toFixed(2)}%</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleDeleteBracket(b.id!)}
                                                            className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 border-slate-800 border-t-4 border-indigo-500">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-indigo-400 mb-2">
                                <ShieldCheck className="w-5 h-5" />
                                <h4 className="font-black text-xs uppercase tracking-widest">Gobernanza Contable</h4>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Cualquier cambio en estas tasas afectará **automáticamente** los cálculos de los períodos de nómina que aún estén en estado 'Abierto'.
                            </p>
                            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Info className="w-4 h-4 text-indigo-400 mt-0.5" />
                                    <p className="text-[10px] text-indigo-300 font-bold uppercase leading-normal">
                                        Los periodos ya cerrados mantienen los cálculos históricos originales para trazabilidad de auditoría.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal para Nuevo Rango */}
            {showBracketModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <DollarSign className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Nuevo Rango ISR</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tabla Progresiva Mensual</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowBracketModal(false)}
                                className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {/* Advertencia informativa */}
                            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
                                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                                <p className="text-[10px] text-amber-400 font-bold uppercase leading-normal">
                                    El sistema validará que no existan rangos solapados.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Desde (Mínimo) */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Desde (Mínimo) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bracketForm.min_income}
                                            onChange={(e) => setBracketForm({ ...bracketForm, min_income: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 pl-7 text-white font-mono focus:border-indigo-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Hasta (Máximo) */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Hasta (Máximo) <span className="text-slate-600">(Dejar vacío = "En adelante")</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bracketForm.max_income}
                                            onChange={(e) => setBracketForm({ ...bracketForm, max_income: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 pl-7 text-white font-mono focus:border-indigo-500 outline-none"
                                            placeholder="(Opcional)"
                                        />
                                    </div>
                                </div>

                                {/* Cuota Fija */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        Cuota Fija <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bracketForm.fixed_amount}
                                            onChange={(e) => setBracketForm({ ...bracketForm, fixed_amount: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 pl-7 text-emerald-400 font-mono focus:border-indigo-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Porcentaje */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                        % Excedente <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bracketForm.percentage}
                                            onChange={(e) => setBracketForm({ ...bracketForm, percentage: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 pr-7 text-indigo-400 font-mono focus:border-indigo-500 outline-none"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-2 flex gap-3">
                            <Button
                                onClick={() => setShowBracketModal(false)}
                                variant="outline"
                                className="flex-1 border-slate-800 text-slate-400 hover:text-white py-6 rounded-xl font-bold"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveBracket}
                                disabled={isSaving}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-xl font-black shadow-xl shadow-indigo-900/20"
                            >
                                {isSaving ? 'Guardando...' : 'Crear Rango'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
