import React, { useState, useEffect } from 'react';
import { X, Save, Building2, Calendar, DollarSign, Info } from 'lucide-react';
import { FixedAsset, AssetCategory } from '../../database/simple-db';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface AssetFormProps {
    asset: FixedAsset | null;
    categories: AssetCategory[];
    onSave: (asset: Partial<FixedAsset>) => void;
    onCancel: () => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({ asset, categories, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<FixedAsset>>({
        asset_code: '',
        name: '',
        description: '',
        category_id: 0,
        acquisition_date: new Date().toISOString().split('T')[0],
        acquisition_cost: 0,
        useful_life_years: 0,
        salvage_value: 0,
        depreciation_method: 'straight_line',
        status: 'active',
        location: '',
        serial_number: '',
        manufacturer: '',
        model: '',
        purchase_order: '',
        warranty_expiration: '',
        notes: ''
    });

    useEffect(() => {
        if (asset) {
            setFormData(asset);
        }
    }, [asset]);

    const handleChange = (field: keyof FixedAsset, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Calcular useful_life_months
        const updatedData = {
            ...formData,
            useful_life_months: (formData.useful_life_years || 0) * 12
        };

        onSave(updatedData);
    };

    const isEdit = !!asset?.id;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <Building2 className="w-8 h-8 text-indigo-500" />
                        {isEdit ? 'Editar Activo Fijo' : 'Nuevo Activo Fijo'}
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                        {isEdit ? `Código: ${asset.asset_code}` : 'Formulario de Adquisición'}
                    </p>
                </div>
                <button
                    onClick={onCancel}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-indigo-400" />
                            Información Básica
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Nombre del Activo <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                    placeholder="Ej: Computadora Dell Latitude 5520"
                                />
                            </div>

                            {/* Asset Code */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Código <span className="text-slate-600">(Auto si vacío)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.asset_code}
                                    onChange={(e) => handleChange('asset_code', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:border-indigo-500 outline-none"
                                    placeholder="EQU-00001"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Categoría <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.category_id || ''}
                                    onChange={(e) => handleChange('category_id', parseInt(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name} {cat.default_useful_life_years && `(${cat.default_useful_life_years} años)`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none"
                                    placeholder="Detalles adicionales del activo..."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Information */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                            Información Financiera
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Acquisition Date */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Fecha de Adquisición <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.acquisition_date}
                                    onChange={(e) => handleChange('acquisition_date', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                />
                            </div>

                            {/* Acquisition Cost */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Costo de Adquisición <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.acquisition_cost}
                                        onChange={(e) => handleChange('acquisition_cost', parseFloat(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white font-mono focus:border-indigo-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Useful Life Years */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Vida Útil (Años) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="50"
                                    value={formData.useful_life_years}
                                    onChange={(e) => handleChange('useful_life_years', parseInt(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:border-indigo-500 outline-none"
                                    placeholder="5"
                                />
                            </div>

                            {/* Salvage Value */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Valor de Salvamento
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.salvage_value}
                                        onChange={(e) => handleChange('salvage_value', parseFloat(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white font-mono focus:border-indigo-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Depreciation Method */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Método de Depreciación
                                </label>
                                <select
                                    value={formData.depreciation_method}
                                    onChange={(e) => handleChange('depreciation_method', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                >
                                    <option value="straight_line">Línea Recta (Recomendado)</option>
                                    <option value="declining_balance">Saldo Decreciente</option>
                                    <option value="units_of_production">Unidades de Producción</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Details */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6 space-y-4">
                        <h3 className="text-lg font-black text-white mb-4">Detalles Adicionales</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Location */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Ubicación
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                    placeholder="Ej: Oficina 201"
                                />
                            </div>

                            {/* Serial Number */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Número de Serie
                                </label>
                                <input
                                    type="text"
                                    value={formData.serial_number}
                                    onChange={(e) => handleChange('serial_number', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:border-indigo-500 outline-none"
                                    placeholder="S/N: ABC123XYZ"
                                />
                            </div>

                            {/* Manufacturer */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Fabricante
                                </label>
                                <input
                                    type="text"
                                    value={formData.manufacturer}
                                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                    placeholder="Ej: Dell"
                                />
                            </div>

                            {/* Model */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Modelo
                                </label>
                                <input
                                    type="text"
                                    value={formData.model}
                                    onChange={(e) => handleChange('model', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                    placeholder="Ej: Latitude 5520"
                                />
                            </div>

                            {/* Purchase Order */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Orden de Compra
                                </label>
                                <input
                                    type="text"
                                    value={formData.purchase_order}
                                    onChange={(e) => handleChange('purchase_order', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:border-indigo-500 outline-none"
                                    placeholder="PO-2026-001"
                                />
                            </div>

                            {/* Warranty Expiration */}
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Vencimiento de Garantía
                                </label>
                                <input
                                    type="date"
                                    value={formData.warranty_expiration}
                                    onChange={(e) => handleChange('warranty_expiration', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none"
                                />
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Notas
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none resize-none"
                                    placeholder="Información adicional, historial de mantenimiento, etc..."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="outline"
                        className="border-slate-800 text-slate-400 hover:text-white px-8 py-6 rounded-2xl font-bold"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-6 rounded-2xl font-black shadow-xl shadow-indigo-900/20"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isEdit ? 'Actualizar Activo' : 'Crear Activo'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
