import { Quote } from '@/database/simple-db';
import { X, FileText, Calendar, User, DollarSign, ArrowRight, Download } from 'lucide-react';

interface QuoteDetailViewProps {
  quote: Quote;
  onClose: () => void;
  onConvert?: (id: number) => void;
}

export const QuoteDetailView: React.FC<QuoteDetailViewProps> = ({
  quote,
  onClose,
  onConvert
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-slate-600',
      sent: 'bg-blue-600',
      accepted: 'bg-green-600',
      rejected: 'bg-red-600',
      expired: 'bg-orange-600',
      converted: 'bg-purple-600'
    };
    return colors[status as keyof typeof colors] || 'bg-slate-600';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'Borrador',
      sent: 'Enviada',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      expired: 'Expirada',
      converted: 'Convertida'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between print:hidden">
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
            <FileText className="w-7 h-7" />
            Detalle de Cotización
          </h2>
          <div className="flex items-center gap-2">
            {quote.status === 'accepted' && onConvert && (
              <button
                onClick={() => onConvert(quote.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
                Convertir a Factura
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Información Principal */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  {quote.quote_number}
                </h3>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold text-white ${getStatusColor(quote.status)}`}>
                  {getStatusLabel(quote.status)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-4xl font-bold text-white">
                  ${quote.total_amount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-400 mt-1" />
                <div>
                  <p className="text-slate-400 text-sm">Cliente</p>
                  <p className="text-white font-semibold">
                    {(quote as any).customer_name || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-400 mt-1" />
                <div>
                  <p className="text-slate-400 text-sm">Fecha de Emisión</p>
                  <p className="text-white font-semibold">
                    {new Date(quote.issue_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-orange-400 mt-1" />
                <div>
                  <p className="text-slate-400 text-sm">Fecha de Expiración</p>
                  <p className="text-white font-semibold">
                    {new Date(quote.expiration_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mb-6">
            <h4 className="text-lg font-semibold text-white mb-4">Items de la Cotización</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Descripción</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Cantidad</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Precio Unit.</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Descuento</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items?.map((item, index) => {
                    const discount = (item.discount_percentage || 0) / 100;
                    const lineTotal = item.quantity * item.unit_price * (1 - discount);
                    return (
                      <tr key={index} className="border-b border-slate-700/50">
                        <td className="py-3 px-4 text-white">{item.description}</td>
                        <td className="py-3 px-4 text-white text-right">{item.quantity}</td>
                        <td className="py-3 px-4 text-white text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-white text-right">
                          {item.discount_percentage ? `${item.discount_percentage}%` : '-'}
                        </td>
                        <td className="py-3 px-4 text-white text-right font-semibold">
                          ${lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="mt-6 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${quote.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Impuestos:</span>
                  <span className="font-semibold">${quote.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white text-2xl font-black tracking-tight border-t border-slate-700 pt-2">
                  <span>Total:</span>
                  <span>${quote.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notas y Términos */}
          {(quote.notes || quote.terms) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quote.notes && (
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <h4 className="text-lg font-semibold text-white mb-3">Notas</h4>
                  <p className="text-slate-300 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}

              {quote.terms && (
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                  <h4 className="text-lg font-semibold text-white mb-3">Términos y Condiciones</h4>
                  <p className="text-slate-300 whitespace-pre-wrap">{quote.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* Información de Conversión */}
          {quote.status === 'converted' && quote.converted_to_invoice_id && (
            <div className="mt-6 bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg">
              <p className="text-purple-300 flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Esta cotización fue convertida a la factura #{quote.converted_to_invoice_id}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
