import React, { useState, useEffect } from 'react';
import {
    Settings,
    Save,
    Plus,
    Trash2,
    DollarSign,
    Percent,
    Calculator,
    AlertCircle
} from 'lucide-react';
import {
    getPayrollSettings,
    updatePayrollSetting,
    getTaxBrackets,
    createTaxBracket,
    updateTaxBracket,
    deleteTaxBracket,
    PayrollSetting,
    TaxBracket
} from '../../database/simple-db';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { useLocale } from '@/i18n/useLocale';

export const PayrollSettings: React.FC = () => {
    const { t } = useLocale();
    const [settings, setSettings] = useState<PayrollSetting[]>([]);
    const [brackets, setBrackets] = useState<TaxBracket[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showBracketForm, setShowBracketForm] = useState(false);
    const [editingBracket, setEditingBracket] = useState<TaxBracket | null>(null);

    // Form state for tax bracket
    const [bracketForm, setBracketForm] = useState({
        min_income: 0,
        max_income: undefined as number | undefined,
        fixed_amount: 0,
        percentage: 0
    });

    const loadData = () => {
        setSettings(getPayrollSettings());
        setBrackets(getTaxBrackets());
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSettingUpdate = async (key: string, value: string) => {
        setIsLoading(true);
        try {
            const result = updatePayrollSetting(key, value);
            if (result.success) {
                toast.success(result.message);
                loadData();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error al actualizar configuración');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBracketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let result;
            if (editingBracket) {
                result = updateTaxBracket(editingBracket.id!, bracketForm);
            } else {
                result = createTaxBracket(bracketForm);
            }

            if (result.success) {
                toast.success(result.message);
                loadData();
                setShowBracketForm(false);
                setEditingBracket(null);
                resetBracketForm();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error al procesar rango de impuesto');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBracket = async (id: number) => {
        if (!confirm('¿Eliminar este rango de impuesto?')) return;

        try {
            const result = deleteTaxBracket(id);
            if (result.success) {
                toast.success(result.message);
                loadData();
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error('Error al eliminar rango');
        }
    };

    const resetBracketForm = () => {
        setBracketForm({
            min_income: 0,
            max_income: undefined,
            fixed_amount: 0,
            percentage: 0
        });
    };

    const startEditBracket = (bracket: TaxBracket) => {
        setEditingBracket(bracket);
        setBracketForm({
            min_income: bracket.min_income,
            max_income: bracket.max_income || undefined,
            fixed_amount: bracket.fixed_amount,
            percentage: bracket.percentage
        });
        setShowBracketForm(true);
    };

    return (
        <div className="space-y-6">
            {/* Header Hub */}
            <div className="mb-8 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
                        <Settings className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            Configuración de Nómina
                        </h2>
                        <p className="text-slate-500 text-[13px] flex items-center gap-2 mt-1">
                            <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Tasas, Impuestos y Parámetros
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuraciones Generales */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white text-lg font-black">{t('payroll.settings.generalSettings')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {settings.map(setting => (
                            <div key={setting.id} className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {setting.description || setting.setting_key}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        defaultValue={setting.setting_value}
                                        onBlur={(e) => {
                                            if (e.target.value !== setting.setting_value) {
                                                handleSettingUpdate(setting.setting_key, e.target.value);
                                            }
                                        }}
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                                    />
                                    <div className="p-2 bg-slate-800 rounded-xl">
                                        {setting.setting_key.includes('rate') ? (
                                            <Percent className="w-4 h-4 text-slate-500" />
                                        ) : (
                                            <DollarSign className="w-4 h-4 text-slate-500" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Rangos de Impuesto */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between">
                        <CardTitle className="text-white text-lg font-black">{t('payroll.settings.taxBrackets')}</CardTitle>
                        <Button
                            onClick={() => { setShowBracketForm(true); setEditingBracket(null); resetBracketForm(); }}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 font-black"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Nuevo Rango
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                <tr>
                                    <th className="px-4 py-3">Desde</th>
                                    <th className="px-4 py-3">Hasta</th>
                                    <th className="px-4 py-3">Cuota Fija</th>
                                    <th className="px-4 py-3">%</th>
                                    <th className="px-4 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {brackets.map(bracket => (
                                    <tr key={bracket.id} className="hover:bg-white/[0.02]">
                                        <td className="px-4 py-3 font-mono text-white">${bracket.min_income.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-slate-400">
                                            {bracket.max_income ? `$${bracket.max_income.toLocaleString()}` : 'En adelante'}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-slate-300">${bracket.fixed_amount.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-mono text-emerald-400">{(bracket.percentage * 100).toFixed(1)}%</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => startEditBracket(bracket)}
                                                    className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded-lg"
                                                >
                                                    <Calculator className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBracket(bracket.id!)}
                                                    className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {brackets.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-600 italic">No hay rangos configurados</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {/* Formulario de Rango de Impuesto */}
            {showBracketForm && (
                <Card className="bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white text-lg font-black">
                            {editingBracket ? 'Editar Rango de Impuesto' : 'Nuevo Rango de Impuesto'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleBracketSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingreso Mínimo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bracketForm.min_income}
                                        onChange={(e) => setBracketForm(prev => ({ ...prev, min_income: parseFloat(e.target.value) || 0 }))}
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingreso Máximo (opcional)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bracketForm.max_income || ''}
                                        onChange={(e) => setBracketForm(prev => ({ ...prev, max_income: e.target.value ? parseFloat(e.target.value) : undefined }))}
                                        placeholder="Dejar vacío para 'en adelante'"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cuota Fija</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={bracketForm.fixed_amount}
                                        onChange={(e) => setBracketForm(prev => ({ ...prev, fixed_amount: parseFloat(e.target.value) || 0 }))}
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Porcentaje (0.0 - 1.0)</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        max="1"
                                        value={bracketForm.percentage}
                                        onChange={(e) => setBracketForm(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                <div>
                                    <h4 className="text-xs font-black text-amber-500 uppercase mb-1">Nota sobre Rangos</h4>
                                    <p className="text-[10px] text-slate-500 leading-normal">
                                        Los rangos no deben solaparse. El porcentaje debe estar entre 0.0 y 1.0 (ej: 0.15 = 15%).
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => { setShowBracketForm(false); setEditingBracket(null); }}
                                    className="text-slate-400 hover:text-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8"
                                >
                                    {isLoading ? 'Procesando...' : editingBracket ? 'Actualizar Rango' : 'Crear Rango'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};