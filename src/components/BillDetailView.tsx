import React from 'react';
import { ArrowLeft, Edit, FileText, Calendar, DollarSign, Truck, MapPin, Phone, Mail } from 'lucide-react';
import { Bill } from '../database/simple-db';

interface BillDetailViewProps {
  bill: Bill;
  onBack: () => void;
  onEdit: (bill: Bill) => void;
}

export const BillDetailView: React.FC<BillDetailViewProps> = ({
  bill,
  onBack,
  onEdit
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-600 text-gray-200';
      case 'received': return 'bg-yellow-600 text-yellow-200';
      case 'approved': return 'bg-blue-600 text-blue-200';
      case 'paid': return 'bg-green-600 text-green-200';
      case 'overdue': return 'bg-red-600 text-red-200';
      case 'cancelled': return 'bg-gray-600 text-gray-200';
      default: return 'bg-gray-600 text-gray-200';
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
              <FileText className="w-6 h-6 text-orange-400" />
              {bill.bill_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bill.status)}`}>
                {getStatusIcon(bill.status)} {bill.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(bill)}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Editar Factura
          </button>
        </div>
      </div>

      {/* Bill Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Information */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-400" />
            Información del Proveedor
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Nombre del Proveedor</p>
              <p className="text-white font-medium">
                {bill.supplier?.business_name || bill.supplier?.name || 'Proveedor Desconocido'}
              </p>
            </div>
            
            {bill.supplier?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">{bill.supplier.email}</p>
                </div>
              </div>
            )}
            
            {bill.supplier?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-400 text-sm">Teléfono</p>
                  <p className="text-white">{bill.supplier.phone}</p>
                </div>
              </div>
            )}
            
            {bill.supplier?.address_line1 && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-400 text-sm">Dirección</p>
                  <div className="text-white">
                    <p>{bill.supplier.address_line1}</p>
                    <p>{bill.supplier.city}, {bill.supplier.state} {bill.supplier.zip_code}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-400" />
            Detalles de la Factura
          </h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Número de Factura</p>
              <p className="text-white font-medium">{bill.bill_number}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Fecha de Emisión</p>
                <p className="text-white">{new Date(bill.issue_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Fecha de Vencimiento</p>
                <p className="text-white">{new Date(bill.due_date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 text-sm">Creada</p>
              <p className="text-white">{new Date(bill.created_at).toLocaleString()}</p>
            </div>
            
            {bill.notes && (
              <div>
                <p className="text-gray-400 text-sm">Notas</p>
                <p className="text-white">{bill.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill Items */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-400" />
            Líneas de Factura
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4 text-gray-300 font-medium">Descripción</th>
                <th className="text-right p-4 text-gray-300 font-medium">Cantidad</th>
                <th className="text-right p-4 text-gray-300 font-medium">Precio Unitario</th>
                <th className="text-center p-4 text-gray-300 font-medium">Gravable</th>
                <th className="text-right p-4 text-gray-300 font-medium">Total Línea</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {bill.items?.map((item, index) => (
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

      {/* Bill Summary */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-400" />
              Resumen de Factura
            </h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal:</span>
                <span>${bill.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-gray-300">
                <span>Impuestos (FL):</span>
                <span>${bill.tax_amount.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-gray-700 pt-2">
                <div className="flex justify-between text-white font-semibold text-xl">
                  <span>Total:</span>
                  <span>${bill.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status-specific information */}
      {bill.status === 'overdue' && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-xl">⚠️</span>
            <div>
              <h3 className="text-red-300 font-medium">Factura Vencida</h3>
              <p className="text-red-200 text-sm">
                Esta factura está vencida por {Math.ceil((Date.now() - new Date(bill.due_date).getTime()) / (1000 * 60 * 60 * 24))} días.
                Considera realizar el pago lo antes posible.
              </p>
            </div>
          </div>
        </div>
      )}

      {bill.status === 'paid' && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-xl">✅</span>
            <div>
              <h3 className="text-green-300 font-medium">Factura Pagada</h3>
              <p className="text-green-200 text-sm">
                Esta factura ha sido marcada como pagada. El pago ha sido procesado correctamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {bill.status === 'approved' && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 text-xl">✅</span>
            <div>
              <h3 className="text-blue-300 font-medium">Factura Aprobada</h3>
              <p className="text-blue-200 text-sm">
                Esta factura ha sido aprobada y está lista para el pago.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};