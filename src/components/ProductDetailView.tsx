import React from 'react';
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  DollarSign, 
  Tag, 
  Truck, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle,
  Hash,
  Calendar,
  FileText,
  Shield,
  Clock
} from 'lucide-react';
import { Product } from '../database/simple-db';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
  onEdit: (product: Product) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onBack,
  onEdit
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = () => {
    if (product.is_service) return null;
    
    if (product.stock_quantity === 0) {
      return { status: 'out', label: 'Sin Stock', color: 'text-red-400', bgColor: 'bg-red-900/20', icon: AlertTriangle };
    } else if (product.stock_quantity <= product.reorder_point) {
      return { status: 'low', label: 'Stock Bajo', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20', icon: AlertTriangle };
    } else {
      return { status: 'ok', label: 'Stock OK', color: 'text-green-400', bgColor: 'bg-green-900/20', icon: CheckCircle };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{product.name}</h1>
            <p className="text-gray-400">SKU: {product.sku}</p>
          </div>
        </div>
        <button
          onClick={() => onEdit(product)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Editar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Básica */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Información Básica
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tipo</label>
                <div className="flex items-center">
                  {product.is_service ? (
                    <>
                      <Tag className="w-4 h-4 text-purple-400 mr-2" />
                      <span className="text-white">Servicio</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4 text-blue-400 mr-2" />
                      <span className="text-white">Producto Físico</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Categoría</label>
                <p className="text-white">{product.category?.name || 'Sin categoría'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Unidad de Medida</label>
                <p className="text-white capitalize">{product.unit_of_measure}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Estado</label>
                <div className="flex items-center">
                  {product.active ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      <span className="text-green-400">Activo</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-400">Inactivo</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {product.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Descripción</label>
                <p className="text-white bg-gray-700 rounded-lg p-3">{product.description}</p>
              </div>
            )}
          </div>

          {/* Precios */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Precios
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Precio de Venta</label>
                <p className="text-2xl font-bold text-green-400">{formatPrice(product.price)}</p>
              </div>

              {product.cost && product.cost > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Costo</label>
                  <p className="text-xl font-semibold text-white">{formatPrice(product.cost)}</p>
                  <p className="text-sm text-gray-400">
                    Margen: {((product.price - product.cost) / product.price * 100).toFixed(1)}%
                  </p>
                </div>
              )}
            </div>

            {/* Información de impuestos */}
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">
                    {product.taxable ? 'Producto Gravable' : 'Producto Exento de Impuestos'}
                  </p>
                  {product.taxable && product.tax_rate && (
                    <p className="text-sm text-gray-400">
                      Tasa específica: {product.tax_rate}%
                    </p>
                  )}
                  {product.taxable && !product.tax_rate && (
                    <p className="text-sm text-gray-400">
                      Usa tasa por defecto según condado del cliente
                    </p>
                  )}
                </div>
                <div className={`w-3 h-3 rounded-full ${product.taxable ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              </div>
            </div>
          </div>

          {/* Inventario (solo para productos físicos) */}
          {!product.is_service && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Inventario
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Stock Actual</p>
                  <p className="text-2xl font-bold text-white">{product.stock_quantity}</p>
                  <p className="text-xs text-gray-400">{product.unit_of_measure}</p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Stock Mínimo</p>
                  <p className="text-xl font-semibold text-white">{product.min_stock_level}</p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Stock Máximo</p>
                  <p className="text-xl font-semibold text-white">{product.max_stock_level}</p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Punto Reorden</p>
                  <p className="text-xl font-semibold text-white">{product.reorder_point}</p>
                </div>
              </div>

              {stockStatus && (
                <div className={`p-4 rounded-lg ${stockStatus.bgColor} border border-opacity-20`}>
                  <div className="flex items-center">
                    <stockStatus.icon className={`w-5 h-5 ${stockStatus.color} mr-2`} />
                    <span className={`font-medium ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>
                  </div>
                  {stockStatus.status === 'low' && (
                    <p className="text-sm text-gray-300 mt-1">
                      Se recomienda reabastecer el inventario
                    </p>
                  )}
                  {stockStatus.status === 'out' && (
                    <p className="text-sm text-gray-300 mt-1">
                      Producto sin stock disponible
                    </p>
                  )}
                </div>
              )}

              {/* Información física */}
              {(product.weight || product.dimensions || product.barcode) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {product.weight && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Peso</label>
                      <p className="text-white">{product.weight} kg</p>
                    </div>
                  )}

                  {product.dimensions && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Dimensiones</label>
                      <p className="text-white">{product.dimensions}</p>
                    </div>
                  )}

                  {product.barcode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Código de Barras</label>
                      <p className="text-white font-mono">{product.barcode}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Información de servicio */}
          {product.is_service && product.service_duration && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Información del Servicio
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Duración</label>
                <p className="text-white">
                  {product.service_duration} minutos 
                  {product.service_duration >= 60 && (
                    <span className="text-gray-400 ml-2">
                      ({Math.floor(product.service_duration / 60)}h {product.service_duration % 60}m)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Panel Lateral */}
        <div className="space-y-6">
          {/* Información del Proveedor */}
          {product.supplier && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Proveedor
              </h3>
              <p className="text-white">{product.supplier.name}</p>
            </div>
          )}

          {/* Garantía */}
          {product.warranty_period && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Garantía
              </h3>
              <p className="text-white">
                {product.warranty_period} días
                {product.warranty_period >= 365 && (
                  <span className="text-gray-400 ml-2">
                    ({Math.floor(product.warranty_period / 365)} año{Math.floor(product.warranty_period / 365) > 1 ? 's' : ''})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Metadatos */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Información del Sistema
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Creado</label>
                <p className="text-white text-sm">{formatDate(product.created_at)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Última Actualización</label>
                <p className="text-white text-sm">{formatDate(product.updated_at)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">ID del Producto</label>
                <p className="text-white font-mono text-sm">#{product.id}</p>
              </div>
            </div>
          </div>

          {/* Notas */}
          {product.notes && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Notas
              </h3>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{product.notes}</p>
            </div>
          )}

          {/* Imagen del producto */}
          {product.image_path && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Imagen</h3>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <p className="text-gray-400 text-sm">Ruta de imagen:</p>
                <p className="text-white text-sm font-mono break-all">{product.image_path}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};