import React from 'react';
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, User, MapPin, Phone, Mail } from 'lucide-react';
import { Invoice } from '@/database/simple-db';
import { useLocale } from '../i18n/useLocale';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  onBack: () => void;
  onEdit: (invoice: Invoice) => void;
  onDelete?: () => Promise<void>;
  onDownload?: (inv: any) => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  onBack,
  onEdit
}) => {
  const { t } = useLocale();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-600 text-gray-200';
      case 'sent': return 'bg-blue-600 text-blue-200';
      case 'paid': return 'bg-green-600 text-green-200';
      case 'overdue': return 'bg-red-600 text-red-200';
      case 'cancelled': return 'bg-yellow-600 text-yellow-200';
      default: return 'bg-gray-600 text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '📝';
      case 'sent': return '📤';
      case 'paid': return '✅';
      case 'overdue': return '⚠️';
      case 'cancelled': return '❌';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-400" />
              {invoice.invoice_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                {getStatusIcon(invoice.status)} {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(invoice)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Edit className="w-4 h-4" />
            {t('invoiceList.editInvoice')}
          </button>
        </div>
      </div>

      {/* Invoice Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            {t('invoiceForm.customerInfo')}
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-slate-500 text-sm">{t('customerDetail.name')}</p>
              <p className="text-white font-medium">
                {invoice.customer?.business_name || invoice.customer?.name || t('invoiceList.unknownCustomer')}
              </p>
            </div>

            {invoice.customer?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-slate-500 text-sm">{t('customerDetail.primaryEmail')}</p>
                  <p className="text-white">{invoice.customer.email}</p>
                </div>
              </div>
            )}

            {invoice.customer?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <div>
                  <p className="text-slate-500 text-sm">{t('customerDetail.primaryPhone')}</p>
                  <p className="text-white">{invoice.customer.phone}</p>
                </div>
              </div>
            )}

            {invoice.customer?.address_line1 && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 mt-1" />
                <div>
                  <p className="text-slate-500 text-sm">{t('customerDetail.address')}</p>
                  <div className="text-white">
                    <p>{invoice.customer.address_line1}</p>
                    <p>{invoice.customer.city}, {invoice.customer.state} {invoice.customer.zip_code}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white/10 rounded-lg p-6 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            {t('invoiceList.title')}
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-slate-500 text-sm">{t('customerDetail.invoiceNumber')}</p>
              <p className="text-white font-medium">{invoice.invoice_number}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-sm">{t('invoiceList.issueDate')}</p>
                <p className="text-white">{new Date(invoice.issue_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm">{t('invoiceList.dueDate')}</p>
                <p className="text-white">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-slate-500 text-sm">{t('invoiceList.created')}</p>
              <p className="text-white">{new Date(invoice.created_at).toLocaleString()}</p>
            </div>

            {invoice.notes && (
              <div>
                <p className="text-slate-500 text-sm">{t('invoiceList.note')}</p>
                <p className="text-white">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Invoice Items */}
      <div className="bg-white/10 rounded-lg border border-white/10">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            {t('invoiceForm.items')}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr>
                <th className="text-left p-4 text-slate-400 font-medium">{t('invoiceForm.description')}</th>
                <th className="text-right p-4 text-slate-400 font-medium">{t('invoiceForm.quantity')}</th>
                <th className="text-right p-4 text-slate-400 font-medium">{t('invoiceForm.unitPrice')}</th>
                <th className="text-center p-4 text-slate-400 font-medium">{t('invoiceForm.taxable')}</th>
                <th className="text-right p-4 text-slate-400 font-medium">{t('invoiceForm.lineTotal')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {invoice.items?.map((item, index) => (
                <tr key={index} className="hover:bg-gray-750">
                  <td className="p-4">
                    <div>
                      <p className="text-white font-medium">{item.description}</p>
                      {item.product?.sku && (
                        <p className="text-slate-500 text-sm">SKU: {item.product.sku}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right text-white">
                    {item.quantity}
                  </td>
                  <td className="p-4 text-right text-white">
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    {item.taxable ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right text-white font-medium">
                    ${item.line_total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/10">
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              {t('invoiceForm.summary')}
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>{t('invoiceForm.subtotal')}:</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>{t('invoiceList.tax')} (FL):</span>
                <span>${invoice.tax_amount.toFixed(2)}</span>
              </div>

              <div className="border-t border-white/10 pt-2">
                <div className="flex justify-between text-white font-semibold text-xl">
                  <span>{t('invoiceList.totalAmount')}:</span>
                  <span>${invoice.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status-specific information */}
      {invoice.status === 'overdue' && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-xl">⚠️</span>
            <div>
              <h3 className="text-red-300 font-medium">{t('invoiceDetail.overdueAlertTitle')}</h3>
              <p className="text-red-200 text-sm">
                {t('invoiceDetail.overdueAlertMessage', {
                  days: Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {invoice.status === 'paid' && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">✅</span>
            <div>
              <h3 className="text-green-300 font-medium">{t('invoiceDetail.paidAlertTitle')}</h3>
              <p className="text-green-200 text-sm">
                {t('invoiceDetail.paidAlertMessage')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};