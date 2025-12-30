import React, { useState } from 'react';
import {
  Edit,
  Eye,
  Trash2,
  Package,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Tag,
  Truck,
  BarChart3,
  Plus
} from 'lucide-react';
import { Product } from '../database/simple-db';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onView: (product: Product) => void;
  onDelete: (id: number) => void;
  onAddProduct: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onView,
  onDelete,
  onAddProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'products' | 'services'>('all');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType =
      filterType === 'all' ||
      (filterType === 'products' && !product.is_service) ||
      (filterType === 'services' && product.is_service);

    const matchesStock =
      filterStock === 'all' ||
      (filterStock === 'low' && !product.is_service && product.stock_quantity <= product.reorder_point) ||
      (filterStock === 'out' && !product.is_service && product.stock_quantity === 0);

    return matchesSearch && matchesType && matchesStock;
  });

  const getStockStatus = (product: Product) => {
    if (product.is_service) return null;

    if (product.stock_quantity === 0) {
      return { status: 'out', label: 'Sin Stock', color: 'text-red-400', bgColor: 'bg-red-900/20' };
    } else if (product.stock_quantity <= product.reorder_point) {
      return { status: 'low', label: 'Stock Bajo', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' };
    } else {
      return { status: 'ok', label: 'Stock OK', color: 'text-green-400', bgColor: 'bg-green-900/20' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${product.name}"?`)) {
      onDelete(product.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          Catálogo de Productos y Servicios
        </h2>
        <button
          onClick={onAddProduct}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="products">Productos</option>
                <option value="services">Servicios</option>
              </select>
            </div>

            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value as any)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todo Stock</option>
              <option value="low">Stock Bajo</option>
              <option value="out">Sin Stock</option>
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-lg font-semibold text-white">{products.length}</p>
              </div>
              <Package className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Productos</p>
                <p className="text-lg font-semibold text-white">
                  {products.filter(p => !p.is_service).length}
                </p>
              </div>
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Servicios</p>
                <p className="text-lg font-semibold text-white">
                  {products.filter(p => p.is_service).length}
                </p>
              </div>
              <Tag className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Stock Bajo</p>
                <p className="text-lg font-semibold text-yellow-400">
                  {products.filter(p => !p.is_service && p.stock_quantity <= p.reorder_point).length}
                </p>
              </div>
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      {filteredProducts.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">
            {searchTerm || filterType !== 'all' || filterStock !== 'all'
              ? 'No se encontraron productos'
              : 'No hay productos registrados'
            }
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterType !== 'all' || filterStock !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primer producto al catálogo'
            }
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);

                  return (
                    <tr key={product.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                            {product.is_service ? (
                              <Tag className="w-5 h-5 text-purple-400" />
                            ) : (
                              <Package className="w-5 h-5 text-blue-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-400">
                              SKU: {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.is_service
                          ? 'bg-purple-900/20 text-purple-300'
                          : 'bg-blue-900/20 text-blue-300'
                          }`}>
                          {product.is_service ? 'Servicio' : 'Producto'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-white font-medium">
                          {formatPrice(product.price)}
                        </div>
                        {product.cost && product.cost > 0 && (
                          <div className="text-xs text-gray-400">
                            Costo: {formatPrice(product.cost)}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {product.is_service ? (
                          <span className="text-sm text-gray-400">N/A</span>
                        ) : (
                          <div>
                            <div className="text-sm text-white">
                              {product.stock_quantity} {product.unit_of_measure}
                            </div>
                            {stockStatus && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                                {stockStatus.label}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          {product.category?.name || 'Sin categoría'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.active ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
                              <span className="text-sm text-green-400">Activo</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-400">Inactivo</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onView(product)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(product)}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumen de resultados */}
      {filteredProducts.length > 0 && (
        <div className="text-sm text-gray-400 text-center">
          Mostrando {filteredProducts.length} de {products.length} productos
        </div>
      )}
    </div>
  );
};