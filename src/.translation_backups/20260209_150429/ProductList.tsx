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
  Plus,
  Zap,
  Box,
  Server,
  Activity,
  Maximize2
} from 'lucide-react';
import { Product, ProductCategory } from '../database/simple-db';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onView: (product: Product) => void;
  onDelete: (id: number) => void;
  onAddProduct: () => void;
  onNavigateToKardex?: (productId: number) => void;
  categories?: ProductCategory[];
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
      return { label: 'AGOTADO', color: 'text-rose-500', bgColor: 'bg-rose-500/10', border: 'border-rose-500/20' };
    } else if (product.stock_quantity <= product.reorder_point) {
      return { label: 'STOCK BAJO', color: 'text-amber-500', bgColor: 'bg-amber-500/10', border: 'border-amber-500/20' };
    } else {
      return { label: 'OPTIMO', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el producto "${product.name}"?`)) {
      onDelete(product.id);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Hub */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-emerald-600/10 rounded-2.5xl border border-emerald-500/20 shadow-emerald-900/10 shadow-lg group">
            <Box className="w-10 h-10 text-emerald-500 group-hover:-rotate-12 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Matriz de Activos</h1>
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Neural Inventory Controller v4
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 justify-center">
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="BUSCAR SKU / NOMBRE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-emerald-500 focus:outline-none w-72 font-black uppercase tracking-widest text-[10px] transition-all"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-6 py-4 bg-slate-950 text-white rounded-2xl border border-slate-800 focus:border-emerald-500 focus:outline-none font-black uppercase tracking-widest text-[10px] appearance-none cursor-pointer"
          >
            <option value="all">TODOS LOS TIPOS</option>
            <option value="products">PRODUCTOS FÍSICOS</option>
            <option value="services">SERVICIOS</option>
          </select>

          <button
            onClick={onAddProduct}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-emerald-900/40 hover:-translate-y-1"
          >
            <Plus className="w-4 h-4" />
            Registrar Activo
          </button>
        </div>
      </div>

      {/* Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <EliteMiniCard title="Total SKU" value={products.length.toString()} icon={Box} color="blue" />
        <EliteMiniCard title="Valorización" value={formatPrice(products.reduce((acc, p) => acc + (p.price * p.stock_quantity), 0))} icon={DollarSign} color="emerald" />
        <EliteMiniCard title="Alertas Stock" value={products.filter(p => !p.is_service && p.stock_quantity <= p.reorder_point).length.toString()} icon={AlertTriangle} color="amber" label="Crítico / Bajo" />
        <EliteMiniCard title="Servicios Activos" value={products.filter(p => p.is_service).length.toString()} icon={Server} color="rose" />
      </div>

      {/* Main Assets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-700/5 blur-[100px] pointer-events-none"></div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50">
                {['Activo / Identificador', 'Tipo & Categoría', 'Venta (Unit)', 'Disponibilidad', 'Estado', 'Control'].map(h => (
                  <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                return (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group/row">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg transition-transform group-hover/row:scale-110 ${product.is_service ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                          {product.is_service ? <Server className="w-6 h-6" /> : <Box className="w-6 h-6" />}
                        </div>
                        <div>
                          <span className="block text-sm font-black text-white uppercase tracking-tighter">{product.name}</span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU: {product.sku}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest w-fit border ${product.is_service ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {product.is_service ? 'Digital Service' : 'Physical Asset'}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase italic">{product.category?.name || 'GENERIC'}</span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="text-base font-black text-white font-mono">{formatPrice(product.price)}</div>
                      <div className="text-[9px] font-black text-slate-600 uppercase">Cost: {formatPrice(product.cost || 0)}</div>
                    </td>

                    <td className="px-8 py-6">
                      {product.is_service ? (
                        <span className="text-[9px] font-black text-slate-700 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50 uppercase tracking-widest">Inmortal / Infinito</span>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white font-mono">{product.stock_quantity}</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase">{product.unit_of_measure}</span>
                          </div>
                          {stockStatus && (
                            <div className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest w-fit ${stockStatus.bgColor} ${stockStatus.color} ${stockStatus.border}`}>
                              {stockStatus.label}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-8 py-6">
                      <div className={`flex items-center gap-2 ${product.active ? 'text-emerald-400' : 'text-slate-600'}`}>
                        <div className={`w-2 h-2 rounded-full ${product.active ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{product.active ? 'Sincronizado' : 'Offline'}</span>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onView(product)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-blue-500 hover:bg-blue-500 hover:text-white transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => onEdit(product)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product)} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
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
    </div>
  );
};

const EliteMiniCard = ({ title, value, icon: Icon, color, label }: any) => {
  const themes: any = {
    blue: 'text-blue-500 bg-blue-600/10 border-blue-500/20',
    emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-600/10 border-amber-500/20',
    rose: 'text-rose-500 bg-rose-600/10 border-rose-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl hover:border-slate-700 transition-all flex items-center gap-5 group">
      <div className={`p-4 rounded-2xl border ${themes[color]} group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-black text-white tracking-tighter leading-none mb-1 font-mono">{value}</div>
        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{title}</div>
        {label && <div className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</div>}
      </div>
    </div>
  );
};