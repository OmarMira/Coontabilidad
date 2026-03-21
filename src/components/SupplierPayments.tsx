import { logger } from '../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, FileText, Search, Filter, Plus, Check, X, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Bill, Supplier, PaymentMethod } from '@/database/modules/db-types';
import { getPaymentMethods } from '@/database/modules/db-payment-methods';
import { addPayment } from '@/database/modules/db-payments';
import { useLocale } from '../i18n/useLocale';

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
  const { t } = useLocale();
  const { user } = useAuth();
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

      // Si hay mÃ©todos disponibles, seleccionar el primero por defecto
      if (methods.length > 0 && !paymentForm.payment_method) {
        setPaymentForm(prev => ({ ...prev, payment_method: methods[0].method_name }));
      }
    } catch (error) {
      logger.error('SupplierPayments', 'error', 'Error loading payment methods:', error);
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
    // En una implementaciÃ³n real, esto vendrÃ­a de la base de datos
    // Por ahora simulamos algunos pagos
    const mockPayments: SupplierPayment[] = [];
    setPayments(mockPayments);
  };

  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : t('supplierPayments.unknownSupplier');
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
      // Map form data to database SupplierPayment interface
      const paymentData: Partial<any> = {
        supplier_id: selectedBill.supplier_id,
        bill_id: selectedBill.id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method as any,
        reference_number: paymentForm.reference,
        notes: paymentForm.notes
      };

      const result = await addPayment(paymentData, user?.id || 1);

      if (!result.success) {
        throw new Error(result.message);
      }

      // Update local state with the created payment
      const payment: SupplierPayment = {
        id: result.paymentId || Date.now(),
        bill_id: selectedBill.id,
        supplier_id: selectedBill.supplier_id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        created_at: new Date().toISOString()
      };

      // Actualizar el estado de la factura
      const { updateBill } = await import('../database/modules/db-bills');
      const { forceSaveDB } = await import('../database/modules/db-persistence');
      await updateBill(selectedBill.id, { status: 'paid' } as any);
      await forceSaveDB();

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
      logger.error('SupplierPayments', 'error', 'Error creating payment:', error);
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
    dueDate.setDate(dueDate.getDate() + 30); // Asumiendo 30 dÃ­as de plazo
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
          <h2 className="text-2xl font-black tracking-tight text-white">{t('supplierPayments.title')}</h2>
          <p className="text-slate-400">{t('supplierPayments.subtitle')}</p>
        </div>
      </div>

      {/* Filtros y bÃºsqueda */}
      <div className="bg-white/10 p-4 rounded-lg shadow-sm border border-white/10">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder={t('supplierPayments.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending" style={{ color: 'black' }}>{t('supplierPayments.filter.pending')}</option>
              <option value="paid" style={{ color: 'black' }}>{t('supplierPayments.filter.paid')}</option>
              <option value="all" style={{ color: 'black' }}>{t('supplierPayments.filter.all')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de facturas pendientes */}
      <div className="bg-white/10 rounded-lg shadow-sm border border-white/10">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-black tracking-tight text-white">{t('supplierPayments.listTitle')}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('supplierPayments.col.bill')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('supplierPayments.col.supplier')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('supplierPayments.col.date')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('supplierPayments.col.amount')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('supplierPayments.col.dueDate')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('supplierPayments.col.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/10 divide-y divide-gray-700">
              {filteredBills.map((bill) => {
                const daysUntilDue = calculateDaysUntilDue(bill.issue_date);

                return (
                  <tr key={bill.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-slate-500 mr-2" />
                        <span className="text-sm font-medium text-white">
                          {bill.bill_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-slate-500 mr-2" />
                        <span className="text-sm text-white">
                          {getSupplierName(bill.supplier_id)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(bill.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-white">
                        ${bill.total_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${daysUntilDue < 0
                        ? 'bg-red-100 text-red-800'
                        : daysUntilDue <= 7
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                        }`}>
                        {daysUntilDue < 0
                          ? t('supplierPayments.status.overdue', { days: Math.abs(daysUntilDue) })
                          : daysUntilDue === 0
                            ? t('supplierPayments.status.dueToday')
                            : t('supplierPayments.status.daysLeft', { days: daysUntilDue })
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handlePayBill(bill)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        {t('supplierPayments.action.pay')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredBills.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-slate-500" />
              <h3 className="mt-2 text-sm font-medium text-white">{t('supplierPayments.empty.title')}</h3>
              <p className="mt-1 text-sm text-slate-400">
                {filterStatus === 'pending'
                  ? t('supplierPayments.empty.pending')
                  : t('supplierPayments.empty.filtered')
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de formulario de pago */}
      {showPaymentForm && selectedBill && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white/10 border-white/10">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black tracking-tight text-white">
                  {t('paymentModal.title')}
                </h3>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="text-slate-500 hover:text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-white/5 rounded-md">
                <p className="text-sm text-slate-400">
                  <strong className="text-white">{t('paymentModal.bill')}</strong> {selectedBill.bill_number}
                </p>
                <p className="text-sm text-slate-400">
                  <strong className="text-white">{t('paymentModal.supplier')}</strong> {getSupplierName(selectedBill.supplier_id)}
                </p>
                <p className="text-sm text-slate-400">
                  <strong className="text-white">{t('paymentModal.totalAmount')}</strong> ${selectedBill.total_amount.toFixed(2)}
                </p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    {t('paymentModal.paymentAmount')}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    {t('paymentModal.paymentDate')}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_date: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    {t('paymentModal.paymentMethod')}
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="" style={{ color: 'black' }}>{t('paymentModal.selectMethod')}</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.method_name} style={{ color: 'black' }}>
                        {method.method_name}
                      </option>
                    ))}
                  </select>
                  {paymentMethods.length === 0 && (
                    <p className="mt-1 text-sm text-red-400">
                      {t('paymentModal.noMethods')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    {t('paymentModal.reference')}
                  </label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder={t('paymentModal.referencePlaceholder')}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    {t('paymentModal.notes')}
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('paymentModal.notesPlaceholder')}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-4 py-2 border border-white/10 rounded-md text-sm font-medium text-slate-400 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {t('paymentModal.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isLoading ? t('paymentModal.processing') : t('paymentModal.submit')}
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

