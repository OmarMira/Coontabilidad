import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CreditCard, Check, X, AlertCircle } from 'lucide-react';
import { PaymentMethod, getAllPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, canDeletePaymentMethod } from '../database/simple-db';

interface PaymentMethodsProps {
  onPaymentMethodsChange?: () => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ onPaymentMethodsChange }) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    method_name: '',
    method_type: 'other' as 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other',
    is_active: true,
    requires_reference: false
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = () => {
    try {
      const methods = getAllPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      setError('Error al cargar los métodos de pago');
    }
  };

  const resetForm = () => {
    setFormData({
      method_name: '',
      method_type: 'other',
      is_active: true,
      requires_reference: false
    });
    setEditingMethod(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let result;

      if (editingMethod) {
        result = updatePaymentMethod(editingMethod.id, formData);
      } else {
        result = createPaymentMethod(formData);
      }

      if (result.success) {
        setSuccess(result.message);
        resetForm();
        loadPaymentMethods();
        onPaymentMethodsChange?.();

        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      setError('Error al guardar el método de pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      method_name: method.method_name,
      method_type: method.method_type,
      is_active: method.is_active,
      requires_reference: method.requires_reference
    });
    setShowForm(true);
  };

  const handleDelete = async (method: PaymentMethod) => {
    const deleteCheck = canDeletePaymentMethod(method.id);

    if (!deleteCheck.canDelete) {
      setError(deleteCheck.reason || 'No se puede eliminar el método de pago');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas eliminar el método de pago "${method.method_name}"?`)) {
      return;
    }

    try {
      const result = deletePaymentMethod(method.id);

      if (result.success) {
        setSuccess(result.message);
        loadPaymentMethods();
        onPaymentMethodsChange?.();

        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      setError('Error al eliminar el método de pago');
    }
  };

  const getMethodTypeLabel = (type: string) => {
    const labels = {
      cash: 'Efectivo',
      check: 'Cheque',
      credit_card: 'Tarjeta de Crédito',
      bank_transfer: 'Transferencia Bancaria',
      other: 'Otro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getMethodTypeColor = (type: string) => {
    const colors = {
      cash: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      check: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      credit_card: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      bank_transfer: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      other: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    };
    return colors[type as keyof typeof colors] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  };

  return (
    <div className="space-y-6 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-blue-500" />
            Métodos de Pago
          </h2>
          <p className="text-slate-400 font-medium ml-11">Gestiona las opciones de cobro y pago disponibles</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all font-bold shadow-lg shadow-blue-900/40"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Método
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <p className="text-sm text-rose-300 font-medium flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <Check className="h-5 w-5 text-emerald-400" />
            <p className="text-sm text-emerald-300 font-medium flex-1">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de métodos de pago */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            Configuraciones Activas
          </h3>
          <p className="text-slate-400 text-sm font-medium mt-1">
            {paymentMethods.length} métodos de pago registrados en el motor
          </p>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-20 bg-slate-950/50">
            <div className="bg-slate-800 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <CreditCard className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-black text-white">No hay registros</h3>
            <p className="mt-1 text-slate-400 font-medium">
              Comienza configurando tu primer método de cobro.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center px-6 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 transition-all font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Método
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800/50">
            {paymentMethods.map((method) => (
              <li key={method.id} className="px-6 py-5 hover:bg-slate-800/30 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 group-hover:border-slate-600 transition-all">
                      <CreditCard className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-black text-white tracking-tight">
                          {method.method_name}
                        </p>
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-lg border bg-slate-950/50 ${getMethodTypeColor(method.method_type)}`}>
                          {getMethodTypeLabel(method.method_type)}
                        </span>
                        {!method.is_active && (
                          <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs font-medium text-slate-500">
                        {method.requires_reference && (
                          <span className="flex items-center gap-1.5 text-blue-400/70 bg-blue-400/5 px-2 py-0.5 rounded-md border border-blue-400/10">
                            <AlertCircle className="w-3 h-3" />
                            Requiere Referencia
                          </span>
                        )}
                        <span className="opacity-60 text-[10px] uppercase font-bold tracking-widest">
                          ID: {method.id} • {new Date(method.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(method)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(method)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {editingMethod ? 'Actualizar Método' : 'Nuevo Método de Pago'}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm">Configura las reglas de validación para esta vía de pago</p>
                </div>
                <button
                  onClick={resetForm}
                  className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Nombre Descriptivo
                  </label>
                  <input
                    type="text"
                    value={formData.method_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, method_name: e.target.value }))}
                    placeholder="Ej: Transferencia Zelle, Efectivo USD..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Tipo de Transacción
                  </label>
                  <select
                    value={formData.method_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, method_type: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium appearance-none cursor-pointer"
                    required
                  >
                    <option value="cash">💵 Efectivo (Cash)</option>
                    <option value="check">✍️ Cheque (Check)</option>
                    <option value="credit_card">💳 Tarjeta (Card)</option>
                    <option value="bank_transfer">🏦 Transferencia (ACH/Zelle)</option>
                    <option value="other">⚙️ Otro (Other)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${formData.is_active ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-950 border-slate-800'}`}
                  >
                    <span className={`text-sm font-bold ${formData.is_active ? 'text-blue-400' : 'text-slate-500'}`}>Habilitado</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.is_active ? 'border-blue-400 bg-blue-400' : 'border-slate-700'}`}>
                      {formData.is_active && <Check className="w-3 h-3 text-slate-950 font-black" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData(prev => ({ ...prev, requires_reference: !prev.requires_reference }))}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${formData.requires_reference ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-950 border-slate-800'}`}
                  >
                    <span className={`text-sm font-bold ${formData.requires_reference ? 'text-blue-400' : 'text-slate-500'}`}>Referencia Oblig.</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.requires_reference ? 'border-blue-400 bg-blue-400' : 'border-slate-700'}`}>
                      {formData.requires_reference && <Check className="w-3 h-3 text-slate-950 font-black" />}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-colors"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50"
                  >
                    {isLoading ? 'Guardando...' : editingMethod ? 'Guardar Cambios' : 'Confirmar Registro'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};