import React, { useState } from 'react';
import { Eye, Edit, Trash2, FileText, Calendar, DollarSign, User, Filter, Plus } from 'lucide-react';
import { Invoice } from '../database/simple-db';

interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: number) => void;
  onAddInvoice: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onView,
  onEdit,
  onDelete,
  onAddInvoice
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-700 text-slate-100 border border-slate-500';
      case 'sent': return 'bg-blue-600 text-white border border-blue-400';
      case 'paid': return 'bg-emerald-600 text-white border border-emerald-400';
      case 'overdue': return 'bg-rose-600 text-white border border-rose-400';
      case 'cancelled': return 'bg-amber-600 text-white border border-amber-400';
      default: return 'bg-slate-600 text-white';
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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer?.business_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleDelete = (invoice: Invoice) => {
    if (invoice.status === 'paid') {
      alert('Cannot delete paid invoices');
      return;
    }

    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
      onDelete(invoice.id);
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Invoices Yet</h3>
        <p className="text-gray-400 mb-4">Create your first invoice to get started.</p>
        <button
          onClick={onAddInvoice}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header with filters */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Invoices ({filteredInvoices.length})
          </h2>
          <button
            onClick={onAddInvoice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Sale
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      {/* Invoice List */}
      <div className="divide-y divide-gray-700">
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id} className="p-6 hover:bg-gray-750 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-white">
                    {invoice.invoice_number}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)} {invoice.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">
                        {invoice.customer?.business_name || invoice.customer?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {invoice.customer?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white">Issue: {new Date(invoice.issue_date).toLocaleDateString()}</p>
                      <p className="text-gray-400 text-xs">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">${invoice.total_amount.toFixed(2)}</p>
                      <p className="text-gray-400 text-xs">
                        Tax: ${invoice.tax_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <div>
                      <p className="text-white text-xs">
                        Created: {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                      {invoice.notes && (
                        <p className="text-gray-400 text-xs truncate max-w-32" title={invoice.notes}>
                          Note: {invoice.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onView(invoice)}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors"
                  title="View Invoice"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onEdit(invoice)}
                  className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Edit Invoice"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(invoice)}
                  className={`p-2 rounded-lg transition-colors ${invoice.status === 'paid'
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                    }`}
                  title={invoice.status === 'paid' ? 'Cannot delete paid invoices' : 'Delete Invoice'}
                  disabled={invoice.status === 'paid'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Overdue warning */}
            {invoice.status === 'overdue' && (
              <div className="mt-3 p-2 bg-red-900/20 border border-red-700 rounded-md">
                <p className="text-red-300 text-sm">
                  ⚠️ This invoice is overdue by {Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="p-6 border-t border-gray-700 bg-gray-900">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-400">Total Invoices</p>
            <p className="text-white font-semibold">{filteredInvoices.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400">Total Amount</p>
            <p className="text-white font-semibold">
              ${filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400">Paid</p>
            <p className="text-green-400 font-semibold">
              {filteredInvoices.filter(inv => inv.status === 'paid').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400">Outstanding</p>
            <p className="text-yellow-400 font-semibold">
              ${filteredInvoices
                .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
                .reduce((sum, inv) => sum + inv.total_amount, 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};