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
  onNavigateToKardex?: (productId: number) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  onView,
  onDelete,
  onAddProduct,
  onNavigateToKardex
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
      return { status: 'out', label: 'AGOTADO', color: 'text-rose-400', bgColor: 'bg-rose-500/10', border: 'border-rose-500/20' };
    } else if (product.stock_quantity <= product.reorder_point) {
      return { status: 'low', label: 'STOCK BAJO', color: 'text-sun-orange', bgColor: 'bg-sun-orange/10', border: 'border-sun-orange/20' };
    } else {
      return { status: 'ok', label: 'OPTIMO', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
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
    <div className="space-y-10 animate-fade-in px-4">
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <Package className="w-8 h-8 text-emerald-400" />
            </div>
            Gestión de Inventario Elite
          </h2>
          <p className="text-gray-400 mt-2 font-medium">Control unificado de stock, servicios y cumplimiento de Florida.</p>
        </div>
        <button
          onClick={onAddProduct}
          className="btn-elite-primary flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          REGISTRAR PRODUCTO
        </button>
      </div>

      {/* SEARCH AND FILTERS ELITE */}
      <div className="card-elite !p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por SKU, nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
            />
          </div>

          <div className="lg:col-span-3">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
              >
                <option value="all">TODOS LOS TIPOS</option>
                <option value="products">PRODUCTOS FÍSICOS</option>
                <option value="services">SERVICIOS</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-3">
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value as any)}
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
            >
              <option value="all">CUALQUIER ESTADO DE STOCK</option>
              <option value="low">ALERTA DE STOCK BAJO</option>
              <option value="out">PRODUCTOS AGOTADOS</option>
            </select>
          </div>
        </div>

        {/* QUICK INTELLIGENCE STATS */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total SKU</span>
            <span className="text-xl font-black text-white">{products.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Valor Inventario</span>
            <span className="text-xl font-black text-emerald-400">
              {formatPrice(products.reduce((acc, p) => acc + (p.price * p.stock_quantity), 0))}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Alertas Activas</span>
            <span className={`text-xl font-black ${products.some(p => !p.is_service && p.stock_quantity <= p.reorder_point) ? 'text-sun-orange' : 'text-gray-400'}`}>
              {products.filter(p => !p.is_service && p.stock_quantity <= p.reorder_point).length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Margen Promedio</span>
            <span className="text-xl font-black text-blue-400">32.4%</span>
          </div>
        </div>
      </div>

      {/* PRODUCT LIST TABLE ELITE */}
      <div className="card-elite !p-0 overflow-hidden border-white/5">
        {filteredProducts.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-400">No se encontraron activos</h3>
            <p className="text-gray-500 mt-2">Intenta ajustar los criterios de búsqueda o filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-white/10">
                  <th className="px-8 py-5">Activo / Identificador</th>
                  <th className="px-8 py-5">Tipo & Categoría</th>
                  <th className="px-8 py-5">Finanzas (Unidad)</th>
                  <th className="px-8 py-5">Disponibilidad</th>
                  <th className="px-8 py-5">Estado</th>
                  <th className="px-8 py-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);

                  return (
                    <tr key={product.id} className="hover:bg-white/5 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${product.is_service ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {product.is_service ? <Tag className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                          </div>
                          <div>
                            <span className="block text-white font-bold text-base">{product.name}</span>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{product.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mb-2 ${product.is_service
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                          {product.is_service ? 'Servicio' : 'Producto'}
                        </span>
                        <div className="text-xs font-bold text-gray-400">
                          {product.category?.name || 'General'}
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="text-white font-black text-base tabular-nums">
                          {formatPrice(product.price)}
                        </div>
                        {product.cost && product.cost > 0 && (
                          <div className="text-[10px] font-black text-gray-500 uppercase">
                            COST: {formatPrice(product.cost)}
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-6">
                        {product.is_service ? (
                          <span className="text-[10px] font-black text-gray-600 uppercase">Ilimitado</span>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="text-white font-bold text-sm">
                                {product.stock_quantity} <span className="text-gray-500 font-medium text-xs">{product.unit_of_measure}</span>
                              </div>
                              {onNavigateToKardex && (
                                <button
                                  onClick={() => onNavigateToKardex(product.id)}
                                  className="p-1 hover:bg-white/10 rounded transition-colors text-blue-400 group/link"
                                  title="Ver Historial (Kardex)"
                                >
                                  <BarChart3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            {stockStatus && (
                              <span className={`badge-elite ${stockStatus.bgColor} ${stockStatus.color} border ${stockStatus.border} text-[9px]`}>
                                {stockStatus.label}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-8 py-6">
                        <div className={`flex items-center gap-2 ${product.active ? 'text-emerald-400' : 'text-gray-500'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${product.active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-500'}`}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{product.active ? 'Activo' : 'Pausado'}</span>
                        </div>
                      </td>

                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onView(product)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-blue-400">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button onClick={() => onEdit(product)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sun-orange">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(product)} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors text-rose-400">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER ELITE */}
      <div className="flex justify-center pt-10">
        <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
          Total de activos en sistema: {filteredProducts.length}
        </div>
      </div>
    </div>
  );
};