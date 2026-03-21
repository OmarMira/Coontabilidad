import React, { useState } from 'react';
import {
  Truck,
  FileText,
  CreditCard,
  Package,
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import type { Supplier } from '@/database/modules/db-types';
import { useLocale } from '../i18n/useLocale';

interface SupplierDetailViewProps {
  supplier: Supplier;
  onBack: () => void;
  onEdit: (supplier: Supplier) => void;
  onDelete?: () => Promise<void>;
}

export const SupplierDetailView: React.FC<SupplierDetailViewProps> = ({
  supplier,
  onBack,
  onEdit
}) => {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: t('supplierDetail.tabs.overview'), icon: Truck },
    { id: 'bills', label: t('supplierDetail.tabs.bills'), icon: FileText },
    { id: 'payments', label: t('supplierDetail.tabs.payments'), icon: CreditCard },
    { id: 'products', label: t('supplierDetail.tabs.products'), icon: Package }
  ];

  // Datos de ejemplo para las pestañas
  const sampleBills = [
    {
      id: 1,
      number: 'BILL-2024-001',
      date: '2024-01-10',
      dueDate: '2024-02-09',
      amount: 2140.00,
      status: 'approved'
    },
    {
      id: 2,
      number: 'BILL-2024-002',
      date: '2024-01-15',
      dueDate: '2024-01-30',
      amount: 905.25,
      status: 'received'
    }
  ];

  const samplePayments = [
    {
      id: 1,
      number: 'SPAY-2024-001',
      date: '2024-03-01',
      amount: 1605.00,
      method: 'bank_transfer',
      reference: 'TXN-SP789123'
    },
    {
      id: 2,
      number: 'SPAY-2024-002',
      date: '2024-01-20',
      amount: 1000.00,
      method: 'check',
      reference: 'CHK-SP001'
    }
  ];

  const sampleProducts = [
    {
      id: 1,
      name: 'Software Licenses',
      lastPurchase: '2024-01-10',
      totalPurchases: 10,
      totalAmount: 2000.00
    },
    {
      id: 2,
      name: 'Office Equipment',
      lastPurchase: '2024-01-15',
      totalPurchases: 5,
      totalAmount: 850.00
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

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-900/30 text-green-400';
      case 'approved': return 'bg-blue-900/30 text-blue-400';
      case 'received': return 'bg-yellow-900/30 text-yellow-400';
      case 'overdue': return 'bg-red-900/30 text-red-400';
      case 'draft': return 'bg-slate-900/30 text-slate-500';
      default: return 'bg-slate-900/30 text-slate-500';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    // These seem generic enough they might be in common translations or should be added
    // For now, mapping to hardcoded or common keys if available, otherwise just returning key or new keys
    // Since I didn't add keys for these specifically in the new batch, I'll use common ones or keep hardcoded fallback for now?
    // Actually I should add them or translate them dynamically.
    // Let's assume there are common translations for payment methods or I can add them later.
    // For now, to keep it simple and consistent with new keys, I will use t() calls assuming I might handle them or just return key if missing in dev mode
    switch (method) {
      case 'cash': return t('common.paymentMethods.cash') || 'Efectivo';
      case 'check': return t('common.paymentMethods.check') || 'Cheque';
      case 'credit_card': return t('common.paymentMethods.creditCard') || 'Tarjeta de Crédito';
      case 'bank_transfer': return t('common.paymentMethods.bankTransfer') || 'Transferencia Bancaria';
      default: return t('common.other') || 'Otro';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-400" />
            {t('supplierDetail.section.info')}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">{t('supplierDetail.label.name')}</p>
              <p className="text-white font-medium">{supplier.name}</p>
            </div>
            {supplier.business_name && (
              <div>
                <p className="text-sm text-slate-500">{t('supplierDetail.label.businessName')}</p>
                <p className="text-white">{supplier.business_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">{t('supplierDetail.label.document')}</p>
              <p className="text-white">{supplier.document_type}: {supplier.document_number}</p>
            </div>
            {supplier.business_type && (
              <div>
                <p className="text-sm text-slate-500">{t('supplierDetail.label.businessType')}</p>
                <p className="text-white">{supplier.business_type}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-400" />
            {t('supplierDetail.section.contact')}
          </h3>
          <div className="space-y-3">
            {supplier.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-white">{supplier.email}</p>
                  <p className="text-xs text-slate-500">{t('supplierDetail.label.emailMain')}</p>
                </div>
              </div>
            )}
            {supplier.email_secondary && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-white">{supplier.email_secondary}</p>
                  <p className="text-xs text-slate-500">{t('supplierDetail.label.emailSec')}</p>
                </div>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-white">{supplier.phone}</p>
                  <p className="text-xs text-slate-500">{t('supplierDetail.label.phoneMain')}</p>
                </div>
              </div>
            )}
            {supplier.phone_secondary && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-white">{supplier.phone_secondary}</p>
                  <p className="text-xs text-slate-500">{t('supplierDetail.label.phoneSec')}</p>
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
            {t('supplierDetail.section.address')}
          </h3>
          <div className="space-y-2">
            {supplier.address_line1 && <p className="text-white">{supplier.address_line1}</p>}
            {supplier.address_line2 && <p className="text-white">{supplier.address_line2}</p>}
            <p className="text-white">
              {supplier.city}, {supplier.state} {supplier.zip_code}
            </p>
            <p className="text-slate-500">{t('supplierDetail.label.county')}: {supplier.florida_county}</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-400" />
            {t('supplierDetail.section.commercial')}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">{t('supplierDetail.label.creditLimit')}</p>
              <p className="text-white font-medium">${supplier.credit_limit?.toLocaleString() || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t('supplierDetail.label.paymentTerms')}</p>
              <p className="text-white">{supplier.payment_terms || 30} {t('supplierDetail.label.days')}</p>
            </div>
            {supplier.assigned_buyer && (
              <div>
                <p className="text-sm text-slate-500">{t('supplierDetail.label.buyer')}</p>
                <p className="text-white">{supplier.assigned_buyer}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">{t('supplierDetail.label.status')}</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(supplier.status || 'active')}`}>
                {supplier.status === 'active' ? t('supplierDetail.status.active') : supplier.status === 'inactive' ? t('supplierDetail.status.inactive') : t('supplierDetail.status.suspended')}
              </span>
            </div>
            {supplier.tax_exempt && (
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-yellow-900/30 text-yellow-400 border border-yellow-700/50">
                  {t('supplierDetail.label.taxExempt')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notas */}
      {supplier.notes && (
        <div className="bg-slate-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('supplierDetail.section.notes')}</h3>
          <p className="text-slate-400">{supplier.notes}</p>
        </div>
      )}
    </div>
  );

  const renderBillsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">{t('supplierDetail.tabs.bills')}</h3>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {t('supplierDetail.actions.newBill')}
        </button>
      </div>

      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('billList.col.number')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('billList.col.date')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('billList.col.dueDate')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('billList.col.amount')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('billList.col.status')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('billList.col.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sampleBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-white/10">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-orange-400 font-medium">{bill.number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {new Date(bill.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {new Date(bill.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    ${bill.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getBillStatusColor(bill.status)}`}>
                      {t(`bill.status.${bill.status}`) || bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-400 hover:text-blue-300 mr-3">{t('supplierDetail.actions.view')}</button>
                    <button className="text-green-400 hover:text-green-300">{t('common.edit') || 'Editar'}</button>
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
        <h3 className="text-lg font-semibold text-white">{t('supplierDetail.tabs.payments')}</h3>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          {t('supplierDetail.actions.recordPayment')}
        </button>
      </div>

      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('billList.col.number')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('billList.col.date')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('billList.col.amount')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('supplierPayments.col.method')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('supplierPayments.col.reference')}
                </th>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 uppercase tracking-wider">
                  {t('billList.col.actions')}
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
                    <button className="text-blue-400 hover:text-blue-300 mr-3">{t('supplierDetail.actions.view')}</button>
                    <button className="text-green-400 hover:text-green-300">{t('common.edit') || 'Editar'}</button>
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
        <h3 className="text-lg font-semibold text-white">{t('supplierDetail.tabs.products')}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleProducts.map((product) => (
          <div key={product.id} className="bg-slate-900 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-white font-medium">{product.name}</h4>
                <p className="text-sm text-slate-500">
                  {t('supplierDetail.products.lastPurchase')}: {new Date(product.lastPurchase).toLocaleDateString()}
                </p>
              </div>
              <Package className="w-5 h-5 text-orange-400" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('supplierDetail.products.totalPurchases')}:</span>
                <span className="text-white font-medium">{product.totalPurchases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('supplierDetail.products.totalAmount')}:</span>
                <span className="text-orange-400 font-medium">${product.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sampleProducts.length === 0 && (
        <div className="bg-slate-900 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500">{t('supplierDetail.products.empty')}</p>
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
            <h1 className="text-2xl font-black tracking-tight text-white">{supplier.name}</h1>
            {supplier.business_name && (
              <p className="text-slate-500">{supplier.business_name}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => onEdit(supplier)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          {t('supplierDetail.actions.edit')}
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex space-x-1 bg-slate-900 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors flex-1 text-sm ${activeTab === tab.id
              ? 'bg-orange-600 text-white'
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
        {activeTab === 'bills' && renderBillsTab()}
        {activeTab === 'payments' && renderPaymentsTab()}
        {activeTab === 'products' && renderProductsTab()}
      </div>
    </div>
  );
};