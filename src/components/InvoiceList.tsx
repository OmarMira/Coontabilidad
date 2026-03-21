import React, { useState } from 'react';
import { Eye, Edit, Trash2, FileText, Calendar, DollarSign, User, Filter, Plus, Zap } from 'lucide-react';
import type { Invoice } from '@/database/modules/db-types';
import { useLocale } from '../i18n/useLocale';

interface InvoiceListProps {
  invoices: Invoice[];
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: number) => void;
  onAddInvoice: () => void;
  onNavigateToKardex?: (referenceId: number) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onView,
  onEdit,
  onDelete,
  onAddInvoice,
  onNavigateToKardex
}) => {
  const { t } = useLocale();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to translate status dynamically
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'draft': t('invoiceList.draft'),
      'sent': t('invoiceList.sent'),
      'paid': t('invoiceList.paid'),
      'overdue': t('invoiceList.overdue'),
      'cancelled': t('invoiceList.cancelled')
    };
    return statusMap[status] || status.toUpperCase();
  };

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
      alert(t('invoiceList.cannotDeletePaidAlert'));
      return;
    }

    if (window.confirm(t('invoiceList.confirmDelete', { number: invoice.invoice_number }))) {
      onDelete(invoice.id);
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="elite-page-container">
        {/* Header Hub for empty state to maintain layout */}
        <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10 mb-10">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg group">
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('invoiceList.title')}</h1>
              <p className="text-slate-500 font-medium text-sm mt-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('invoiceList.subtitle') || 'Gestión centralizada de facturación'}
              </p>
            </div>
          </div>
        </div>

        <div className="card-elite-flat py-24 text-center">
          <div className="w-24 h-24 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <FileText className="w-12 h-12 text-slate-700" />
          </div>
          <h3 className="text-3xl font-black tracking-tight text-white mb-4">{t('invoiceList.noInvoices')}</h3>
          <p className="text-slate-500 max-w-lg mx-auto text-lg">{t('invoiceList.noInvoicesMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="elite-page-container">
      {/* Header Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-blue-900/10 shadow-lg group">
            <FileText className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">{t('invoiceList.title')}</h1>
            <p className="text-slate-500 font-medium text-sm mt-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('invoiceList.subtitle') || 'Gestión centralizada de facturación'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onAddInvoice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-3 transition-all font-bold shadow-lg shadow-blue-900/40 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('invoiceList.createInvoice')}
          </button>
        </div>
      </div>

      <div className="card-elite-flat overflow-hidden p-0">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('invoiceList.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 text-white px-4 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 text-white px-3 py-2 rounded-md border border-white/10 focus:border-blue-500 focus:outline-none"
              >
                <option value="all" className="text-black">{t('invoiceList.allStatuses')}</option>
                <option value="draft" className="text-black">{t('invoiceList.draft')}</option>
                <option value="sent" className="text-black">{t('invoiceList.sent')}</option>
                <option value="paid" className="text-black">{t('invoiceList.paid')}</option>
                <option value="overdue" className="text-black">{t('invoiceList.overdue')}</option>
                <option value="cancelled" className="text-black">{t('invoiceList.cancelled')}</option>
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
                    <h3 className="text-base font-black tracking-tight text-white">
                      {invoice.invoice_number}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)} {getStatusLabel(invoice.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-white font-medium">
                          {invoice.customer?.business_name || invoice.customer?.name || t('invoiceList.unknownCustomer')}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {invoice.customer?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-white">{t('invoiceList.issueDate')}: {new Date(invoice.issue_date).toLocaleDateString()}</p>
                        <p className="text-slate-500 text-xs">{t('invoiceList.dueDate')}: {new Date(invoice.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-white font-medium">${invoice.total_amount.toFixed(2)}</p>
                        <p className="text-slate-500 text-xs">
                          {t('invoiceList.tax')}: ${invoice.tax_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <div>
                        <p className="text-white text-xs">
                          {t('invoiceList.created')}: {new Date(invoice.created_at ?? Date.now()).toLocaleDateString()}
                        </p>
                        {invoice.notes && (
                          <p className="text-slate-500 text-xs truncate max-w-32" title={invoice.notes}>
                            {t('invoiceList.note')}: {invoice.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {/* View/Print with Language Selection */}
                  <div className="flex bg-slate-950 border border-white/10 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => onView(invoice)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-white/5 border-r border-white/10 transition-colors"
                      title={t('invoiceList.viewInvoice')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <div className="flex items-center px-1 gap-1">
                      <button
                        onClick={() => {
                          // Forzar idioma ES para el PDF
                          const event = new CustomEvent('generatePdf', { detail: { invoice, lang: 'es' } });
                          window.dispatchEvent(event);
                        }}
                        className="text-[9px] font-black w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        title={`${t('invoiceList.generateIn')} ES`}
                      >
                        ES
                      </button>
                      <div className="w-[1px] h-3 bg-white/5"></div>
                      <button
                        onClick={() => {
                          // Forzar idioma EN para el PDF
                          const event = new CustomEvent('generatePdf', { detail: { invoice, lang: 'en' } });
                          window.dispatchEvent(event);
                        }}
                        className="text-[9px] font-black w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-emerald-400 transition-all"
                        title={`${t('invoiceList.generateIn')} EN`}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  {onNavigateToKardex && (
                    <button
                      onClick={() => onNavigateToKardex(invoice.id)}
                      className="p-2 text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded-lg transition-colors border border-purple-500/30"
                      title={t('invoiceList.viewInventoryOutputs')}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onEdit(invoice)}
                    className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-white/5 rounded-lg transition-colors"
                    title={t('invoiceList.editInvoice')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(invoice)}
                    className={`p-2 rounded-lg transition-colors ${invoice.status === 'paid'
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-red-400 hover:text-red-300 hover:bg-white/5'
                      }`}
                    title={invoice.status === 'paid' ? t('invoiceList.cannotDeletePaid') : t('invoiceList.deleteInvoice')}
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
                    {t('invoiceList.overdueWarning', {
                      days: Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
                    })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="p-6 border-t border-white/10 bg-slate-900">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="text-slate-500">{t('invoiceList.totalInvoices')}</p>
              <p className="text-white font-semibold">{filteredInvoices.length}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500">{t('invoiceList.totalAmount')}</p>
              <p className="text-white font-semibold">
                ${filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-500">{t('invoiceList.paidCount')}</p>
              <p className="text-green-400 font-semibold">
                {filteredInvoices.filter(inv => inv.status === 'paid').length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-500">{t('invoiceList.pendingAmount')}</p>
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
    </div>
  );
};