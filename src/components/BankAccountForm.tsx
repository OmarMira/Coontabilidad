import React, { useState, useEffect } from 'react';
import { Save, X, Building2, AlertCircle } from 'lucide-react';
import { BankAccount } from '../database/simple-db';

interface BankAccountFormProps {
    initialData?: BankAccount;
    onSubmit: (data: Omit<BankAccount, 'id' | 'created_at'>) => Promise<void>;
    onCancel: () => void;
}

export const BankAccountForm: React.FC<BankAccountFormProps> = ({
    initialData,
    onSubmit,
    onCancel
}) => {
    const [formData, setFormData] = useState<Omit<BankAccount, 'id' | 'created_at'>>({
        account_name: '',
        bank_name: '',
        account_number: '',
        account_type: 'checking',
        routing_number: '',
        balance: 0,
        currency: 'USD',
        is_active: true,
        notes: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                account_name: initialData.account_name,
                bank_name: initialData.bank_name,
                account_number: initialData.account_number,
                account_type: initialData.account_type,
                routing_number: initialData.routing_number || '',
                balance: initialData.balance,
                currency: initialData.currency,
                is_active: initialData.is_active,
                notes: initialData.notes || ''
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : name === 'balance'
                    ? parseFloat(value) || 0
                    : value
        }));

        // Limpiar error al editar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.account_name.trim()) newErrors.account_name = 'El nombre de la cuenta es requerido';
        if (!formData.bank_name.trim()) newErrors.bank_name = 'El nombre del banco es requerido';
        if (!formData.account_number.trim()) newErrors.account_number = 'El número de cuenta es requerido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-gray-700 flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">
                    {initialData ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Nombre de la Cuenta *</label>
                        <input
                            type="text"
                            name="account_name"
                            value={formData.account_name}
                            onChange={handleChange}
                            placeholder="Ej. Cuenta Operativa"
                            className={`w-full px-4 py-2.5 bg-gray-900/50 rounded-lg border ${errors.account_name ? 'border-red-500' : 'border-gray-600'} text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                        />
                        {errors.account_name && <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.account_name}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Banco *</label>
                        <input
                            type="text"
                            name="bank_name"
                            value={formData.bank_name}
                            onChange={handleChange}
                            placeholder="Ej. Bank of America"
                            className={`w-full px-4 py-2.5 bg-gray-900/50 rounded-lg border ${errors.bank_name ? 'border-red-500' : 'border-gray-600'} text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                        />
                        {errors.bank_name && <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.bank_name}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Tipo de Cuenta</label>
                        <select
                            name="account_type"
                            value={formData.account_type}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-gray-900/50 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                        >
                            <option value="checking">Cuenta Corriente (Checking)</option>
                            <option value="savings">Cuenta de Ahorros (Savings)</option>
                            <option value="credit">Tarjeta de Crédito</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Moneda</label>
                        <select
                            name="currency"
                            value={formData.currency}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-gray-900/50 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="USD">USD - Dólar Estadounidense</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="MXN">MXN - Peso Mexicano</option>
                        </select>
                    </div>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Número de Cuenta *</label>
                        <input
                            type="text"
                            name="account_number"
                            value={formData.account_number}
                            onChange={handleChange}
                            placeholder="XXXX-XXXX-XXXX"
                            className={`w-full px-4 py-2.5 bg-gray-900/50 rounded-lg border ${errors.account_number ? 'border-red-500' : 'border-gray-600'} text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`}
                        />
                        {errors.account_number && <span className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.account_number}</span>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Número de Ruta (Routing)</label>
                        <input
                            type="text"
                            name="routing_number"
                            value={formData.routing_number}
                            onChange={handleChange}
                            placeholder="XXXXXXXXX"
                            className="w-full px-4 py-2.5 bg-gray-900/50 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Balance & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Saldo Inicial / Actual</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                            <input
                                type="number"
                                name="balance"
                                value={formData.balance}
                                onChange={handleChange}
                                step="0.01"
                                className="w-full pl-8 pr-4 py-2.5 bg-gray-900/50 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                            />
                        </div>
                        {initialData && <p className="text-xs text-yellow-500/80">Nota: Ajustar manualmente el saldo no generará un asiento contable. Use "Ajustes" para eso.</p>}
                    </div>

                    <div className="flex items-center space-x-3 pt-8">
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_active"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="absolute w-6 h-6 opacity-0 cursor-pointer z-10"
                            />
                            <div className={`block w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-300 cursor-pointer select-none">
                            Cuenta Activa
                        </label>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Notas Adicionales</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Información adicional sobre la cuenta..."
                        className="w-full px-4 py-2.5 bg-gray-900/50 rounded-lg border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 text-gray-300 font-medium hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        {initialData ? 'Guardar Cambios' : 'Crear Cuenta'}
                    </button>
                </div>

            </form>
        </div>
    );
};
