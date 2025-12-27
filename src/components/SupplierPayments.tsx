import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, FileText, Search, Filter, Plus, Check, X, Building2 } from 'lucide-react';
import { Bill, Supplier, getPaymentMethods, PaymentMethod } from '../database/simple-db';

interface SupplierPayment {
  id: number;
  bill_id: number;
  supplier_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  notes?: string;
  created_at: string;
}

interface SupplierPaymentsProps {
  bills: Bill[];
  suppliers: Supplier[];
  onPaymentCreated: () => void;
}

export const SupplierPayments: React.FC<SupplierPaymentsProps> = ({
  bills,
  suppliers,
  onPaymentCreated
}) => {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [pendingBills, setPendingBills] = useState<Bill[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('pending');
  const [isLoading, setIsLoading] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: '',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    loadPendingBills();
    loadPayments();
    loadPaymentMethods();
  }, [bills]);

  const loadPaymentMethods = () => {
    try {
      const methods = getPaymentMethods();
      setPaymentMethods(methods);
      
      // Si hay métodos disponibles, seleccionar el primero por defecto
      if (methods.length > 0 && !paymentForm.payment_method) {
        setPaymentForm(prev => ({ ...prev, payment_method: methods[0].method_name }));
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const loadPendingBills = () => {
    // Filtrar facturas pendientes (asumiendo que las pagadas tienen status 'paid')
    const pending = bills.filter(bill => 
      bill.status !== 'paid'
    );
    setPendingBills(pending);
  };

  const loadPayments = () => {
    // En una implementación real, esto vendría de la base de datos
    // Por ahora simulamos algunos pagos
    const mockPayments: SupplierPayment[] = [];
    setPayments(mockPayments);
  };

  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Proveedor desconocido';
  };

  const filteredBills = pendingBills.filter(bill => {
    const supplierName = getSupplierName(bill.supplier_id).toLowerCase();
    const matchesSearch = supplierName.includes(searchTerm.toLowerCase()) ||
                         bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && bill.status !== 'paid';
    if (filterStatus === 'paid') return matchesSearch && bill.status === 'paid';
    
    return matchesSearch;
  });

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    setIsLoading(true);
    try {
      const payment: SupplierPayment = {
        id: Date.now(), // En producción sería generado por la DB
        bill_id: selectedBill.id,
        supplier_id: selectedBill.supplier_id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        created_at: new Date().toISOString()
      };

      // Aquí iría la lógica para guardar en la base de datos
      // await createSupplierPayment(payment);
      
      // Actualizar el estado de la factura
      // await updateBill(selectedBill.id, { payment_status: 'paid' });

      setPayments(prev => [...prev, payment]);
      setShowPaymentForm(false);
      setSelectedBill(null);
      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethods.length > 0 ? paymentMethods[0].method_name : '',
        reference: '',
        notes: ''
      });

      onPaymentCreated();
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayBill = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentForm(prev => ({
      ...prev,
      amount: bill.total_amount.toString(),
      payment_method: paymentMethods.length > 0 ? paymentMethods[0].method_name : ''
    }));
    setShowPaymentForm(true);
  };

  const calculateDaysUntilDue = (billDate: string) => {
    const dueDate = new Date(billDate);
    dueDate.setDate(dueDate.getDate() + 30); // Asumiendo 30 días de plazo
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Pagos a Proveedores</h2>
          <p className="text-gray-300">Gestiona los pagos realizados a proveedores</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por proveedor o número de factura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">Pendientes</option>
              <option value="paid">Pagadas</option>
              <option value="all">Todas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de facturas pendientes */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Facturas Pendientes de Pago</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Factura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredBills.map((bill) => {
                const daysUntilDue = calculateDaysUntilDue(bill.issue_date);
                
                return (
                  <tr key={bill.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-white">
                          {bill.bill_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-white">
                          {getSupplierName(bill.supplier_id)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(bill.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-white">
                        ${bill.total_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        daysUntilDue < 0 
                          ? 'bg-red-100 text-red-800'
                          : daysUntilDue <= 7
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {daysUntilDue < 0 
                          ? `Vencida ${Math.abs(daysUntilDue)} días`
                          : daysUntilDue === 0
                            ? 'Vence hoy'
                            : `${daysUntilDue} días`
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handlePayBill(bill)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Pagar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredBills.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No hay facturas</h3>
              <p className="mt-1 text-sm text-gray-300">
                {filterStatus === 'pending' 
                  ? 'No hay facturas pendientes de pago'
                  : 'No se encontraron facturas con los filtros aplicados'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de formulario de pago */}
      {showPaymentForm && selectedBill && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-gray-800 border-gray-700">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">
                  Registrar Pago a Proveedor
                </h3>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-700 rounded-md">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Factura:</strong> {selectedBill.bill_number}
                </p>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Proveedor:</strong> {getSupplierName(selectedBill.supplier_id)}
                </p>
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Monto Total:</strong> ${selectedBill.total_amount.toFixed(2)}
                </p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Monto del Pago
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Fecha de Pago
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar método...</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.method_name}>
                        {method.method_name}
                      </option>
                    ))}
                  </select>
                  {paymentMethods.length === 0 && (
                    <p className="mt-1 text-sm text-red-400">
                      No hay métodos de pago configurados. Ve a Archivo → Métodos de Pago para agregar algunos.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Referencia/Número
                  </label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Número de transferencia, cheque, etc."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Notas (Opcional)
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Notas adicionales sobre el pago..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Procesando...' : 'Registrar Pago'}
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