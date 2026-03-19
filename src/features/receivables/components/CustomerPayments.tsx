import { logger } from '../../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, FileText, Search, Plus, Check, X, Zap } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { Invoice, Customer, PaymentMethod, Payment } from '@/database/modules/db-types';
import { getPaymentMethods } from '@/database/modules/db-payment-methods';
import { createPayment } from '@/database/modules/db-payments';
import { useLocale } from '../../../i18n/useLocale';

interface CustomerPayment {
  id: number;
  invoice_id: number;
  customer_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  notes?: string;
  created_at: string;
}

interface CustomerPaymentsProps {
  invoices: Invoice[];
  customers: Customer[];
  onPaymentCreated: () => void;
}

export const CustomerPayments: React.FC<CustomerPaymentsProps> = ({
  invoices,
  customers,
  onPaymentCreated
}) => {
  const { t } = useLocale();
  const { user } = useAuth();
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
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
    loadPendingInvoices();
    loadPayments();
    loadPaymentMethods();
  }, [invoices]);

  const loadPaymentMethods = () => {
    try {
      const methods = getPaymentMethods();
      setPaymentMethods(methods);

      // Si hay mÃ©todos disponibles, seleccionar el primero por defecto
      if (methods.length > 0 && !paymentForm.payment_method) {
        setPaymentForm(prev => ({ ...prev, payment_method: methods[0].method_name }));
      }
    } catch (error) {
      logger.error('CustomerPayments', 'error', 'Error loading payment methods:', error);
    }
  };

  const loadPendingInvoices = () => {
    // Filtrar facturas pendientes (asumiendo que las pagadas tienen status 'paid')
    const pending = invoices.filter(invoice =>
      invoice.status !== 'paid'
    );
    setPendingInvoices(pending);
  };

  const loadPayments = () => {
    // En una implementaciÃ³n real, esto vendrÃ­a de la base de datos
    // Por ahora simulamos algunos pagos
    const mockPayments: CustomerPayment[] = [];
    setPayments(mockPayments);
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : t('invoiceList.unknownCustomer');
  };

  const filteredInvoices = pendingInvoices.filter(invoice => {
    const customerName = getCustomerName(invoice.customer_id).toLowerCase();
    const matchesSearch = customerName.includes(searchTerm.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && invoice.status !== 'paid';
    if (filterStatus === 'paid') return matchesSearch && invoice.status === 'paid';

    return matchesSearch;
  });

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsLoading(true);
    try {
      // Map form data to database Payment interface
      const paymentData: Partial<Payment> = {
        customer_id: selectedInvoice.customer_id,
        invoice_id: selectedInvoice.id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method as any, // Cast string to union type
        reference_number: paymentForm.reference,
        notes: paymentForm.notes
      };

      const result = createPayment(paymentData, user?.id || 1); // TODO: Get real userId from context

      if (!result.success) {
        throw new Error(result.message);
      }

      // Update local state with the created payment structure
      const payment: CustomerPayment = {
        id: result.paymentId || Date.now(),
        invoice_id: selectedInvoice.id,
        customer_id: selectedInvoice.customer_id,
        amount: parseFloat(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_method: paymentForm.payment_method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        created_at: new Date().toISOString()
      };

      setPayments(prev => [...prev, payment]);
      setShowPaymentForm(false);
      setSelectedInvoice(null);
      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethods.length > 0 ? paymentMethods[0].method_name : '',
        reference: '',
        notes: ''
      });

      onPaymentCreated();
    } catch (error) {
      logger.error('CustomerPayments', 'error', 'Error creating payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm(prev => ({
      ...prev,
      amount: invoice.total_amount.toString(),
      payment_method: paymentMethods.length > 0 ? paymentMethods[0].method_name : ''
    }));
    setShowPaymentForm(true);
  };

  return (
    <div className="elite-page-container">
      {/* Header Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-emerald-600/10 rounded-2.5xl border border-emerald-500/20 shadow-emerald-900/10 shadow-lg group">
            <CreditCard className="w-10 h-10 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('customerPayments.title')}</h1>
            <p className="text-slate-500 font-medium text-sm mt-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> {t('customerPayments.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card-elite-flat">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder={t('customerPayments.searchPlaceholder')}
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
              <option value="pending" className="text-black">{t('customerPayments.pendingInvoices')}</option>
              <option value="paid" className="text-black">{t('invoiceList.paid')}</option>
              <option value="all" className="text-black">{t('invoiceList.allStatuses')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pending Invoices List */}
      <div className="card-elite-flat overflow-hidden p-0">
        <div className="px-8 py-5 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-xl font-bold text-white tracking-tight">{t('customerPayments.pendingInvoices')}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t('customerPayments.invoice')}
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t('invoiceForm.customer')}
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t('common.date')}
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t('common.amount')}
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t('customerPayments.daysOverdue')}
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/10 divide-y divide-gray-700">
              {filteredInvoices.map((invoice) => {
                const daysOverdue = Math.floor(
                  (new Date().getTime() - new Date(invoice.issue_date).getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <tr key={invoice.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-slate-500 mr-2" />
                        <span className="text-sm font-medium text-white">
                          {invoice.invoice_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-white">
                        {getCustomerName(invoice.customer_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {new Date(invoice.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-white">
                        ${invoice.total_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${daysOverdue > 30
                        ? 'bg-red-100 text-red-800'
                        : daysOverdue > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                        }`}>
                        {daysOverdue > 0 ? t('common.days', { n: daysOverdue }) : t('customerPayments.upToDate')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handlePayInvoice(invoice)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        {t('customerPayments.registerPayment')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-slate-500" />
              <h3 className="mt-2 text-sm font-medium text-white">{t('customerPayments.noInvoices')}</h3>
              <p className="mt-1 text-sm text-slate-400">
                {filterStatus === 'pending'
                  ? t('customerPayments.noPendingInvoices')
                  : t('customerPayments.noFilteredInvoices')
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de formulario de pago */}
      {showPaymentForm && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white/10 border-white/10">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white tracking-tight">
                  {t('customerPayments.modalTitle')}
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
                  <strong className="text-white">{t('customerPayments.invoice')}:</strong> {selectedInvoice.invoice_number}
                </p>
                <p className="text-sm text-slate-400">
                  <strong className="text-white">{t('invoiceForm.customer')}:</strong> {getCustomerName(selectedInvoice.customer_id)}
                </p>
                <p className="text-sm text-slate-400">
                  <strong className="text-white">{t('invoiceList.totalAmount')}:</strong> ${selectedInvoice.total_amount.toFixed(2)}
                </p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    {t('customerPayments.amountToPay')}
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
                    {t('customerPayments.paymentDate')}
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
                    {t('customerPayments.paymentMethod')}
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="" className="text-black">{t('customerPayments.selectMethod')}</option>
                    {paymentMethods.map((method) => (
                      <option key={method.id} value={method.method_name} className="text-black">
                        {method.method_name}
                      </option>
                    ))}
                  </select>
                  {paymentMethods.length === 0 && (
                    <p className="mt-1 text-sm text-red-600">
                      {t('customerPayments.noMethods')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    {t('customerPayments.referenceNumber')}
                  </label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder={t('customerPayments.referencePlaceholder')}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    {t('customerPayments.notes')}
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('customerPayments.notesPlaceholder')}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="px-4 py-2 border border-white/10 rounded-md text-sm font-medium text-slate-400 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {t('customerForm.close')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? t('customerPayments.processing') : t('customerPayments.registerPayment')}
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
