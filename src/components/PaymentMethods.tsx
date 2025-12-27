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
      cash: 'bg-green-100 text-green-800',
      check: 'bg-blue-100 text-blue-800',
      credit_card: 'bg-purple-100 text-purple-800',
      bank_transfer: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Métodos de Pago</h2>
          <p className="text-gray-300">Gestiona los métodos de pago disponibles en el sistema</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Método
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <Check className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lista de métodos de pago */}
      <div className="bg-gray-800 shadow overflow-hidden sm:rounded-md border border-gray-700">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-white">
            Métodos de Pago Configurados
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-300">
            {paymentMethods.length} métodos de pago configurados
          </p>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No hay métodos de pago</h3>
            <p className="mt-1 text-sm text-gray-300">
              Comienza agregando tu primer método de pago.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Método de Pago
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {paymentMethods.map((method) => (
              <li key={method.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-white">
                          {method.method_name}
                        </p>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodTypeColor(method.method_type)}`}>
                          {getMethodTypeLabel(method.method_type)}
                        </span>
                        {!method.is_active && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-300">
                        {method.requires_reference && (
                          <span className="inline-flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Requiere referencia
                          </span>
                        )}
                        <span className="ml-2">
                          Creado: {new Date(method.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(method)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar método"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(method)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar método"
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-gray-800 border-gray-700">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">
                  {editingMethod ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Nombre del Método
                  </label>
                  <input
                    type="text"
                    value={formData.method_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, method_name: e.target.value }))}
                    placeholder="Ej: Efectivo, Cheque, Tarjeta Visa..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Tipo de Método
                  </label>
                  <select
                    value={formData.method_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, method_type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="cash">Efectivo</option>
                    <option value="check">Cheque</option>
                    <option value="credit_card">Tarjeta de Crédito</option>
                    <option value="bank_transfer">Transferencia Bancaria</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-white">Activo</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requires_reference}
                      onChange={(e) => setFormData(prev => ({ ...prev, requires_reference: e.target.checked }))}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-white">Requiere referencia</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Guardando...' : editingMethod ? 'Actualizar' : 'Crear'}
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