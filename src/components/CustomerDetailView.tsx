import React, { useState } from 'react';
import {
  User,
  FileText,
  CreditCard,
  Package,
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Building
} from 'lucide-react';
import { Customer } from '@/database/simple-db';
import { useLocale } from '../i18n/useLocale';

interface CustomerDetailViewProps {
  customer: Customer;
  onBack: () => void;
  onEdit: (customer: Customer) => void;
  onDelete?: (id: number) => void;
  onNavigateToKardex?: (filters: { productId?: string; type?: string; referenceId?: number }) => void;
  onNavigateToInvoice?: (invoiceId: number) => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customer,
  onBack,
  onEdit,
  onDelete,
  onNavigateToKardex,
  onNavigateToInvoice
}) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('common.overview'), icon: User },
    { id: 'invoices', label: t('common.invoices'), icon: FileText },
    { id: 'payments', label: t('common.payments'), icon: CreditCard },
    { id: 'products', label: t('common.productsServices'), icon: Package }
  ];

  // Datos de ejemplo para las pestañas
  const sampleInvoices = [
    {
      id: 1,
      number: 'INV-2024-001',
      date: '2024-01-15',
      dueDate: '2024-02-14',
      amount: 1605.00,
      status: 'paid'
    },
    {
      id: 2,
      number: 'INV-2024-002',
      date: '2024-01-20',
      dueDate: '2024-02-04',
      amount: 319.49,
      status: 'sent'
    }
  ];

  const samplePayments = [
    {
      id: 1,
      number: 'PAY-2024-001',
      date: '2024-02-10',
      amount: 1605.00,
      method: 'bank_transfer',
      reference: 'TXN-789456123'
    },
    {
      id: 2,
      number: 'PAY-2024-002',
      date: '2024-01-25',
      amount: 500.00,
      method: 'check',
      reference: 'CHK-001234'
    }
  ];

  const sampleProducts = [
    {
      id: 1,
      name: 'Consultoría Contable',
      lastPurchase: '2024-01-15',
      totalPurchases: 10,
      totalAmount: 1500.00
    },
    {
      id: 2,
      name: 'Software License',
      lastPurchase: '2024-01-20',
      totalPurchases: 1,
      totalAmount: 299.99
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900/30 text-green-400 border-green-700/50';
      case 'inactive': return 'bg-slate-900/30 text-slate-500 border-white/10/50';
      case 'suspended': return 'bg-red-900/30 text-red-400 border-red-700/50';
      default: return 'bg-slate-900/30 text-slate-500 border-white/10/50';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-900/30 text-green-400';
      case 'sent': return 'bg-blue-900/30 text-blue-400';
      case 'overdue': return 'bg-red-900/30 text-red-400';
      case 'draft': return 'bg-slate-900/30 text-slate-500';
      default: return 'bg-slate-900/30 text-slate-500';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    // Basic mapping, assuming keys might exist or fall back to capitalized string
    switch (method) {
      case 'cash': return t('ard.payment.methods.cash') || 'Cash';
      case 'check': return t('ard.payment.methods.check') || 'Check';
      case 'credit_card': return t('ard.payment.methods.card') || 'Credit Card';
      case 'bank_transfer': return t('ard.payment.methods.transfer') || 'Bank Transfer';
      default: return method;
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            {t('customerDetail.personalInfo')}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">{t('customerDetail.name')}</p>
              <p className="text-white font-medium">{customer.name}</p>
            </div>
            {customer.business_name && (
              <div>
                <p className="text-sm text-slate-500">{t('customerDetail.businessName')}</p>
                <p className="text-white">{customer.business_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">{t('customerDetail.document')}</p>
              <p className="text-white">{customer.document_type}: {customer.document_number}</p>
            </div>
            {customer.business_type && (
              <div>
                <p className="text-sm text-slate-500">{t('customerDetail.businessType')}</p>
                <p className="text-white">{customer.business_type}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-400" />
            {t('customerDetail.contact')}
          </h3>
          <div className="space-y-3">
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-white">{customer.email}</p>
                  <p className="text-xs text-slate-500">{t('customerDetail.primaryEmail')}</p>
                </div>
              </div>
            )}
            {customer.email_secondary && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-white">{customer.email_secondary}</p>
                  <p className="text-xs text-slate-500">{t('customerDetail.secondaryEmail')}</p>
                </div>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-white">{customer.phone}</p>
                  <p className="text-xs text-slate-500">{t('customerDetail.primaryPhone')}</p>
                </div>
              </div>
            )}
            {customer.phone_secondary && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-white">{customer.phone_secondary}</p>
                  <p className="text-xs text-slate-500">{t('customerDetail.secondaryPhone')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dirección y datos comerciales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-400" />
            {t('customerDetail.address')}
          </h3>
          <div className="space-y-2">
            {customer.address_line1 && <p className="text-white">{customer.address_line1}</p>}
            {customer.address_line2 && <p className="text-white">{customer.address_line2}</p>}
            <p className="text-white">
              {customer.city}, {customer.state} {customer.zip_code}
            </p>
            <p className="text-slate-500">{t('customerDetail.county')}: {customer.florida_county}</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-400" />
            {t('customerDetail.commercialData')}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">{t('customerDetail.creditLimit')}</p>
              <p className="text-white font-medium">${customer.credit_limit?.toLocaleString() || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('customerDetail.paymentTerms')}</p>
              <p className="text-white">{t('common.days', { n: customer.payment_terms || 30 })}</p>
            </div>
            {customer.assigned_salesperson && (
              <div>
                <p className="text-sm text-slate-500">{t('customerDetail.salesperson')}</p>
                <p className="text-white">{customer.assigned_salesperson}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">{t('common.status')}</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(customer.status || 'active')}`}>
                {customer.status === 'active' ? t('common.active') : customer.status === 'inactive' ? t('common.inactive') : t('common.suspended')}
              </span>
            </div>
            {customer.tax_exempt && (
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-yellow-900/30 text-yellow-400 border border-yellow-700/50">
                  {t('customerDetail.taxExempt')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notas */}
      {customer.notes && (
        <div className="bg-slate-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('common.notes')}</h3>
          <p className="text-slate-400">{customer.notes}</p>
        </div>
      )}
    </div>
  );

  const renderInvoicesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{t('customerDetail.customerInvoices')}</h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {t('customerDetail.newInvoice')}
        </button>
      </div>

      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('customerDetail.invoiceNumber')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('common.date')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('customerDetail.dueDate')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('common.amount')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('common.status')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sampleInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/10">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-blue-400 font-medium">{invoice.number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    ${invoice.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                      {invoice.status === 'paid' ? t('invoiceList.paid') : invoice.status === 'sent' ? t('invoiceList.sent') : t('invoiceList.draft')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => onNavigateToInvoice && onNavigateToInvoice(invoice.id)}
                      className="text-blue-400 hover:text-blue-300 mr-3"
                    >
                      {t('common.view')}
                    </button>
                    <button className="text-green-400 hover:text-green-300">{t('common.edit')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{t('customerDetail.paymentHistory')}</h3>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          {t('customerDetail.registerPayment')}
        </button>
      </div>

      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('customerDetail.invoiceNumber')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('common.date')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('common.amount')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('customerDetail.paymentMethod')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('customerDetail.reference')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {samplePayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/10">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-400 font-medium">{payment.number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    ${payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {getPaymentMethodLabel(payment.method)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {payment.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-400 hover:text-blue-300 mr-3">{t('common.view')}</button>
                    <button className="text-green-400 hover:text-green-300">{t('common.edit')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProductsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{t('customerDetail.purchasedProducts')}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleProducts.map((product) => (
          <div key={product.id} className="bg-slate-900 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-white font-medium">{product.name}</h4>
                <p className="text-sm text-slate-500">
                  {t('customerDetail.lastPurchase')}: {new Date(product.lastPurchase).toLocaleDateString()}
                </p>
              </div>
              <Package className="w-5 h-5 text-blue-400" />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('customerDetail.totalPurchases')}:</span>
                <span className="text-white font-medium">{product.totalPurchases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('customerDetail.totalAmount')}:</span>
                <span className="text-green-400 font-medium">${product.totalAmount.toLocaleString()}</span>
              </div>
              {onNavigateToKardex && (
                <button
                  onClick={() => onNavigateToKardex({ productId: product.id.toString() })}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-xs font-bold"
                >
                  <Package className="w-3.5 h-3.5" />
                  {t('customerDetail.viewMovements')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {sampleProducts.length === 0 && (
        <div className="bg-slate-900 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500">{t('customerDetail.noProducts')}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-white/10 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">{customer.name}</h1>
            {customer.business_name && (
              <p className="text-slate-500">{customer.business_name}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => onEdit(customer)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          {t('customerDetail.editCustomer')}
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex space-x-1 bg-slate-900 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors flex-1 text-sm ${activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de las pestañas */}
      <div>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'invoices' && renderInvoicesTab()}
        {activeTab === 'payments' && renderPaymentsTab()}
        {activeTab === 'products' && renderProductsTab()}
      </div>
    </div>
  );
};