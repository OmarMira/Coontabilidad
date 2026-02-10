import React, { useState } from 'react';
import { Eye, Edit, Trash2, FileText, Calendar, DollarSign, User, Filter, Plus } from 'lucide-react';
import { Invoice } from '../database/simple-db';

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
      alert('No se pueden eliminar facturas pagadas');
      return;
    }

    if (window.confirm(`¿Está seguro de que desea eliminar la factura ${invoice.invoice_number}?`)) {
      onDelete(invoice.id);
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="bg-white/10 rounded-lg p-8 text-center border border-white/10">
        <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-lg font-black tracking-tight text-white mb-2">Aún no hay facturas</h3>
        <p className="text-slate-500 mb-4">Cree su primera factura para comenzar.</p>
        <button
          onClick={onAddInvoice}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Factura
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/10 rounded-lg border border-white/10">
      {/* Header with filters */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Facturas ({filteredInvoices.length})
          </h2>
          <button
            onClick={onAddInvoice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Venta
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por número de factura o cliente..."
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
              <option value="all">Todos los Estados</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviada</option>
              <option value="paid">Pagada</option>
              <option value="overdue">Vencida</option>
              <option value="cancelled">Cancelada</option>
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
                  <h3 className="text-lg font-black tracking-tight text-white">
                    {invoice.invoice_number}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)} {invoice.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-white font-medium">
                        {invoice.customer?.business_name || invoice.customer?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {invoice.customer?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-white">Emisión: {new Date(invoice.issue_date).toLocaleDateString()}</p>
                      <p className="text-slate-500 text-xs">Vencim.: {new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-white font-medium">${invoice.total_amount.toFixed(2)}</p>
                      <p className="text-slate-500 text-xs">
                        Impuesto: ${invoice.tax_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <div>
                      <p className="text-white text-xs">
                        Creado: {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                      {invoice.notes && (
                        <p className="text-slate-500 text-xs truncate max-w-32" title={invoice.notes}>
                          Nota: {invoice.notes}
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
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-white/5 rounded-lg transition-colors"
                  title="Ver Factura"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {onNavigateToKardex && (
                  <button
                    onClick={() => onNavigateToKardex(invoice.id)}
                    className="p-2 text-purple-400 hover:text-purple-300 hover:bg-white/5 rounded-lg transition-colors border border-purple-500/30"
                    title="Ver Salidas de Inventario"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => onEdit(invoice)}
                  className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-white/5 rounded-lg transition-colors"
                  title="Editar Factura"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(invoice)}
                  className={`p-2 rounded-lg transition-colors ${invoice.status === 'paid'
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-red-400 hover:text-red-300 hover:bg-white/5'
                    }`}
                  title={invoice.status === 'paid' ? 'No se pueden eliminar facturas pagadas' : 'Eliminar Factura'}
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
                  ⚠️ Esta factura está vencida por {Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))} días
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
            <p className="text-slate-500">Total Facturas</p>
            <p className="text-white font-semibold">{filteredInvoices.length}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500">Monto Total</p>
            <p className="text-white font-semibold">
              ${filteredInvoices.reduce((sum, inv) => sum + inv.total_amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500">Pagadas</p>
            <p className="text-green-400 font-semibold">
              {filteredInvoices.filter(inv => inv.status === 'paid').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500">Pendiente</p>
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