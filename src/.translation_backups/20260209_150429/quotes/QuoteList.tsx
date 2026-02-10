import React, { useState } from 'react';
import { Quote } from '@/database/simple-db';
import { FileText, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

interface QuoteListProps {
  quotes: Quote[];
  onView: (quote: Quote) => void;
  onEdit: (quote: Quote) => void;
  onDelete: (id: number) => void;
  onConvert: (id: number) => void;
}

export const QuoteList: React.FC<QuoteListProps> = ({
  quotes,
  onView,
  onEdit,
  onDelete,
  onConvert
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredQuotes = quotes.filter(quote => {
    if (filterStatus === 'all') return true;
    return quote.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Borrador', color: 'bg-slate-600', icon: FileText },
      sent: { label: 'Enviada', color: 'bg-blue-600', icon: Clock },
      accepted: { label: 'Aceptada', color: 'bg-green-600', icon: CheckCircle },
      rejected: { label: 'Rechazada', color: 'bg-red-600', icon: XCircle },
      expired: { label: 'Expirada', color: 'bg-orange-600', icon: Clock },
      converted: { label: 'Convertida', color: 'bg-purple-600', icon: ArrowRight }
    };

    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  const handleConvert = (quote: Quote) => {
    if (quote.status !== 'accepted') {
      alert('Solo se pueden convertir cotizaciones aceptadas');
      return;
    }

    if (confirm(`¿Convertir la cotización ${quote.quote_number} en factura?`)) {
      onConvert(quote.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-slate-300">Filtrar por estado:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas</option>
            <option value="draft">Borrador</option>
            <option value="sent">Enviadas</option>
            <option value="accepted">Aceptadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="expired">Expiradas</option>
            <option value="converted">Convertidas</option>
          </select>
          <span className="text-sm text-slate-400">
            {filteredQuotes.length} cotización(es)
          </span>
        </div>
      </div>

      {/* Lista de Cotizaciones */}
      {filteredQuotes.length === 0 ? (
        <div className="bg-slate-800 p-12 rounded-lg border border-slate-700 text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No hay cotizaciones para mostrar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredQuotes.map(quote => (
            <div
              key={quote.id}
              className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-blue-500 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-xl font-black tracking-tight text-white">
                      {quote.quote_number}
                    </h3>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Cliente:</span>
                      <p className="text-white font-medium">{(quote as any).customer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Fecha Emisión:</span>
                      <p className="text-white font-medium">
                        {new Date(quote.issue_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Fecha Expiración:</span>
                      <p className="text-white font-medium">
                        {new Date(quote.expiration_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Total:</span>
                      <p className="text-white font-bold text-lg">
                        ${quote.total_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {quote.notes && (
                    <div className="mt-3 text-sm text-slate-400">
                      <span className="font-medium">Notas:</span> {quote.notes}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onView(quote)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    title="Ver detalles"
                  >
                    <Eye className="w-5 h-5" />
                  </button>

                  {quote.status !== 'converted' && (
                    <>
                      <button
                        onClick={() => onEdit(quote)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>

                      {quote.status === 'accepted' && (
                        <button
                          onClick={() => handleConvert(quote)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          title="Convertir a factura"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar esta cotización?')) {
                            onDelete(quote.id);
                          }
                        }}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
