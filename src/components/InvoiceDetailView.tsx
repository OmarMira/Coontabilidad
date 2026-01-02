import React from 'react';
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, User, MapPin, Phone, Mail } from 'lucide-react';
import { Invoice } from '../database/simple-db';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  onBack: () => void;
  onEdit: (invoice: Invoice) => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  onBack,
  onEdit
}) => {
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
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
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
            Edit Invoice
          </button>
        </div>
      </div>

      {/* Invoice Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Customer Information
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Customer Name</p>
              <p className="text-white font-medium">
                {invoice.customer?.business_name || invoice.customer?.name || 'Unknown Customer'}
              </p>
            </div>

            {invoice.customer?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">{invoice.customer.email}</p>
                </div>
              </div>
            )}

            {invoice.customer?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p className="text-white">{invoice.customer.phone}</p>
                </div>
              </div>
            )}

            {invoice.customer?.address_line1 && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-400 text-sm">Address</p>
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
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Invoice Details
          </h2>

          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Invoice Number</p>
              <p className="text-white font-medium">{invoice.invoice_number}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Issue Date</p>
                <p className="text-white">{new Date(invoice.issue_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Due Date</p>
                <p className="text-white">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Created</p>
              <p className="text-white">{new Date(invoice.created_at).toLocaleString()}</p>
            </div>

            {invoice.notes && (
              <div>
                <p className="text-gray-400 text-sm">Notes</p>
                <p className="text-white">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Invoice Items */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Invoice Items
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 text-gray-300 font-medium">Description</th>
                <th className="text-right p-4 text-gray-300 font-medium">Quantity</th>
                <th className="text-right p-4 text-gray-300 font-medium">Unit Price</th>
                <th className="text-center p-4 text-gray-300 font-medium">Taxable</th>
                <th className="text-right p-4 text-gray-300 font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {invoice.items?.map((item, index) => (
                <tr key={index} className="hover:bg-gray-750">
                  <td className="p-4">
                    <div>
                      <p className="text-white font-medium">{item.description}</p>
                      {item.product?.sku && (
                        <p className="text-gray-400 text-sm">SKU: {item.product.sku}</p>
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
                      <span className="text-gray-400">-</span>
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
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              Invoice Summary
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal:</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-300">
                <span>Tax (FL):</span>
                <span>${invoice.tax_amount.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-700 pt-2">
                <div className="flex justify-between text-white font-semibold text-xl">
                  <span>Total:</span>
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
              <h3 className="text-red-300 font-medium">Invoice Overdue</h3>
              <p className="text-red-200 text-sm">
                This invoice is overdue by {Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))} days.
                Please follow up with the customer for payment.
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
              <h3 className="text-green-300 font-medium">Invoice Paid</h3>
              <p className="text-green-200 text-sm">
                This invoice has been marked as paid. Thank you for your business!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};