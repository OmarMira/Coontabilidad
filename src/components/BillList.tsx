import React, { useState } from 'react';
import { Eye, Edit, Trash2, FileText, Calendar, DollarSign, Truck, Filter, Plus } from 'lucide-react';
import { Bill } from '../database/simple-db';

interface BillListProps {
  bills: Bill[];
  onView: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (id: number) => void;
  onAddBill: () => void;
}

export const BillList: React.FC<BillListProps> = ({
  bills,
  onView,
  onEdit,
  onDelete,
  onAddBill
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-700 text-slate-100 border border-slate-500';
      case 'received': return 'bg-amber-600 text-white border border-amber-400';
      case 'approved': return 'bg-blue-600 text-white border border-blue-400';
      case 'paid': return 'bg-emerald-600 text-white border border-emerald-400';
      case 'overdue': return 'bg-rose-600 text-white border border-rose-400';
      case 'cancelled': return 'bg-gray-700 text-gray-300 border border-gray-600';
      default: return 'bg-slate-600 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '📝';
      case 'received': return '📥';
      case 'approved': return '✅';
      case 'paid': return '💰';
      case 'overdue': return '⚠️';
      case 'cancelled': return '❌';
      default: return '📄';
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesSearch =
      bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.supplier?.business_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleDelete = (bill: Bill) => {
    if (bill.status === 'paid') {
      alert('No se pueden eliminar facturas pagadas');
      return;
    }

    if (window.confirm(`¿Estás seguro de que quieres eliminar la factura ${bill.bill_number}?`)) {
      onDelete(bill.id);
    }
  };

  if (bills.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No hay Facturas de Compra</h3>
        <p className="text-gray-400 mb-4">Crea tu primera factura de compra para comenzar.</p>
        <button
          onClick={onAddBill}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Factura
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
            <FileText className="w-5 h-5 text-orange-400" />
            Facturas de Compra ({filteredBills.length})
          </h2>
          <button
            onClick={onAddBill}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva Factura
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por número de factura o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:border-orange-500 focus:outline-none"
            >
              <option value="all">Todos los Estados</option>
              <option value="draft">Borrador</option>
              <option value="received">Recibida</option>
              <option value="approved">Aprobada</option>
              <option value="paid">Pagada</option>
              <option value="overdue">Vencida</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bill List */}
      <div className="divide-y divide-gray-700">
        {filteredBills.map((bill) => (
          <div key={bill.id} className="p-6 hover:bg-gray-750 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-white">
                    {bill.bill_number}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                    {getStatusIcon(bill.status)} {bill.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">
                        {bill.supplier?.business_name || bill.supplier?.name || 'Proveedor Desconocido'}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {bill.supplier?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white">Emisión: {new Date(bill.issue_date).toLocaleDateString()}</p>
                      <p className="text-gray-400 text-xs">Vence: {new Date(bill.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">${bill.total_amount.toFixed(2)}</p>
                      <p className="text-gray-400 text-xs">
                        Impuestos: ${bill.tax_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <div>
                      <p className="text-white text-xs">
                        Creada: {new Date(bill.created_at).toLocaleDateString()}
                      </p>
                      {bill.notes && (
                        <p className="text-gray-400 text-xs truncate max-w-32" title={bill.notes}>
                          Nota: {bill.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onView(bill)}
                  className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Ver Factura"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onEdit(bill)}
                  className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Editar Factura"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(bill)}
                  className={`p-2 rounded-lg transition-colors ${bill.status === 'paid'
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                    }`}
                  title={bill.status === 'paid' ? 'No se pueden eliminar facturas pagadas' : 'Eliminar Factura'}
                  disabled={bill.status === 'paid'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Overdue warning */}
            {bill.status === 'overdue' && (
              <div className="mt-3 p-2 bg-red-900/20 border border-red-700 rounded-md">
                <p className="text-red-300 text-sm">
                  ⚠️ Esta factura está vencida por {Math.ceil((Date.now() - new Date(bill.due_date).getTime()) / (1000 * 60 * 60 * 24))} días
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
            <p className="text-gray-400">Total Facturas</p>
            <p className="text-white font-semibold">{filteredBills.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400">Monto Total</p>
            <p className="text-white font-semibold">
              ${filteredBills.reduce((sum, bill) => sum + bill.total_amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400">Pagadas</p>
            <p className="text-green-400 font-semibold">
              {filteredBills.filter(bill => bill.status === 'paid').length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400">Pendientes</p>
            <p className="text-orange-400 font-semibold">
              ${filteredBills
                .filter(bill => bill.status !== 'paid' && bill.status !== 'cancelled')
                .reduce((sum, bill) => sum + bill.total_amount, 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};