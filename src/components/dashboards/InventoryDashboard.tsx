import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Archive,
  Zap,
  Activity,
  Boxes,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { getProducts, getInvoices } from '../../database/simple-db';
import { useLocale } from '../../i18n/useLocale';

interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  averageValue: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  min_stock: number;
  price: number;
  category: string;
}

interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export const InventoryDashboard: React.FC = () => {
  const { t } = useLocale();
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    averageValue: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = () => {
    try {
      setLoading(true);
      const products = getProducts();
      const invoices = getInvoices();

      const totalValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0);
      const lowStock = products.filter(p => p.stock_quantity <= (p.min_stock_level || 10));
      const outOfStock = products.filter(p => p.stock_quantity === 0);

      setStats({
        totalProducts: products.length,
        totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        averageValue: products.length > 0 ? totalValue / products.length : 0
      });

      setLowStockProducts(lowStock.slice(0, 10).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock_quantity,
        min_stock: p.min_stock_level || 10,
        price: p.price,
        category: p.category?.name || t('inventoryDashboard.uncategorized')
      })));

      const productSales: Record<number, { name: string; quantity: number; revenue: number }> = {};
      invoices.forEach(invoice => {
        if (invoice.items && Array.isArray(invoice.items)) {
          invoice.items.forEach((item: any) => {
            if (!productSales[item.product_id]) {
              productSales[item.product_id] = { name: item.product_name || t('inventoryDashboard.product'), quantity: 0, revenue: 0 };
            }
            productSales[item.product_id].quantity += item.quantity;
            productSales[item.product_id].revenue += item.quantity * item.unit_price;
          });
        }
      });

      setTopProducts(Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 10));

      const categoryMap: Record<string, { value: number; count: number }> = {};
      products.forEach(p => {
        const catName = p.category?.name || t('inventoryDashboard.uncategorized') || 'Uncategorized';
        if (!categoryMap[catName]) categoryMap[catName] = { value: 0, count: 0 };
        categoryMap[catName].value += p.stock_quantity * p.price;
        categoryMap[catName].count++;
      });

      setCategoryDistribution(Object.entries(categoryMap)
        .map(([name, data]) => ({ name, value: data.value, count: data.count }))
        .sort((a, b) => b.value - a.value).slice(0, 8));
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950">
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-amber-500 rounded-full animate-spin mb-6"></div>
      <span className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">{t('inventoryDashboard.scanning')}</span>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Hub */}
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
            <Boxes className="w-7 h-7 text-amber-500 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">
              {t('inventoryDashboard.title')}
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-2 flex items-center gap-2 uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> {t('inventoryDashboard.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <EliteStatCard title={t('inventoryDashboard.totalProducts')} value={stats.totalProducts.toString()} label={t('inventoryDashboard.skusInWarehouse')} icon={Package} color="blue" />
        <EliteStatCard title={t('inventoryDashboard.accumulatedValue')} value={formatCurrency(stats.totalValue)} label={`${t('inventoryDashboard.avg')}: ${formatCurrency(stats.averageValue)}`} icon={DollarSign} color="emerald" />
        <EliteStatCard title={t('inventoryDashboard.criticalStock')} value={stats.lowStockCount.toString()} label={t('inventoryDashboard.requireReorder')} icon={AlertTriangle} color="amber" />
        <EliteStatCard title={t('inventoryDashboard.stockOut')} value={stats.outOfStockCount.toString()} label={t('inventoryDashboard.outOfStockProducts')} icon={Archive} color="rose" />
      </div>

      {/* Critical Stock Alert - Protocol Red */}
      {lowStockProducts.length > 0 && (
        <div className="bg-slate-900 border-2 border-amber-500/30 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl shadow-amber-900/10 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] pointer-events-none"></div>
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{t('inventoryDashboard.replenishmentProtocol')}</h3>
                <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-1.5 opacity-80">
                  {t('inventoryDashboard.imminentOutageAlert', { count: lowStockProducts.length })}
                </p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-amber-950/40 active:scale-95">
              {t('inventoryDashboard.generatePurchaseOrders')} <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left">
              <thead className="bg-slate-950/50">
                <tr>
                  {[t('inventoryDashboard.skuCode'), t('inventoryDashboard.productName'), t('inventoryDashboard.category'), t('inventoryDashboard.current'), t('inventoryDashboard.minimum'), t('inventoryDashboard.deficit')].map(h => (
                    <th key={h} className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {lowStockProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-500/[0.03] transition-colors group/row">
                    <td className="px-6 py-4 text-xs font-mono font-black text-amber-500 group-hover/row:scale-105 transition-transform origin-left">{p.sku}</td>
                    <td className="px-6 py-4 text-sm font-black text-white">{p.name}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">{p.category}</td>
                    <td className="px-6 py-4 text-sm font-black text-amber-400 font-mono italic">{p.stock}</td>
                    <td className="px-6 py-4 text-sm font-black text-slate-600 font-mono">{p.min_stock}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black rounded-lg shadow-sm">
                        -{Math.max(p.min_stock * 2 - p.stock, 0)} UNID
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analysis Matrix */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <AnalysisBox title={t('inventoryDashboard.movementVelocity')} subtitle={t('inventoryDashboard.top10Rotation')}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topProducts} layout="vertical" margin={{ right: 40, left: 20 }}>
              <defs>
                <linearGradient id="barRotation" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} fontWeight="900" width={140} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(59,130,246,0.03)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1.2rem' }}
                itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: '900' }}
              />
              <Bar dataKey="quantity" fill="url(#barRotation)" radius={[0, 8, 8, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </AnalysisBox>

        <AnalysisBox title={t('inventoryDashboard.capitalByCategory')} subtitle={t('inventoryDashboard.monetaryValueDistribution')}>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-10 h-full w-full px-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem' }}
                  itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: '900' }}
                  formatter={(v: any) => formatCurrency(v)}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3 min-w-[200px] w-full lg:w-auto">
              {categoryDistribution.map((cat, idx) => (
                <div key={idx} className="flex flex-col group/cat cursor-default">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: COLORS[idx % COLORS.length], color: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover/cat:text-white transition-colors">{cat.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-white font-mono opacity-80">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full opacity-60" style={{ width: `${(cat.value / stats.totalValue * 100) || 0}%`, backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnalysisBox>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
        <header className="flex items-center justify-between mb-12 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tighter uppercase leading-none">{t('inventoryDashboard.valuationCertification')}</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">{t('inventoryDashboard.abcInventory')}</p>
            </div>
          </div>
          <button className="p-3 bg-slate-950 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-all text-slate-600 hover:text-white">
            <Maximize2 className="w-4 h-4" />
          </button>
        </header>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left">
            <thead className="bg-slate-950/50">
              <tr>
                {['#', t('inventoryDashboard.productId'), t('inventoryDashboard.totalRevenue'), t('inventoryDashboard.qtySold'), t('inventoryDashboard.avgTicket')].map(h => (
                  <th key={h} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {topProducts.map((p, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors group/row">
                  <td className="px-8 py-5">
                    <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/row:text-emerald-400 group-hover/row:border-emerald-500/30 transition-all">{idx + 1}</span>
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-white group-hover/row:translate-x-1 transition-transform">{p.name}</td>
                  <td className="px-8 py-5 text-sm font-mono font-black text-emerald-400">{formatCurrency(p.revenue)}</td>
                  <td className="px-8 py-5 text-sm font-black text-slate-300 font-mono italic">{p.quantity.toLocaleString()}</td>
                  <td className="px-8 py-5 text-sm font-mono text-slate-500">{formatCurrency(p.revenue / p.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const EliteStatCard = ({ title, value, icon: Icon, color, label }: any) => {
  const themes: any = {
    blue: 'text-blue-500 bg-blue-600/10 border-blue-500/20 shadow-blue-900/10',
    emerald: 'text-emerald-500 bg-emerald-600/10 border-emerald-500/20 shadow-emerald-900/10',
    rose: 'text-rose-500 bg-rose-600/10 border-rose-500/20 shadow-rose-900/10',
    amber: 'text-amber-500 bg-amber-600/10 border-amber-500/20 shadow-amber-900/10',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl group hover:-translate-y-1 transition-all relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className={`p-3 rounded-2xl border ${themes[color]} group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
        </div>
        <div className="text-4xl font-black text-white tracking-tighter mb-2 font-mono tabular-nums leading-none">{value}</div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{label}</p>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-10 transition-all ${themes[color]}`}></div>
    </div>
  );
};

const AnalysisBox = ({ title, subtitle, children }: any) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl relative group overflow-hidden">
    <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 blur-[100px] pointer-events-none"></div>
    <header className="mb-10 relative z-10">
      <h3 className="text-xl font-black text-white tracking-tighter uppercase">{title}</h3>
      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2">{subtitle}</p>
    </header>
    <div className="relative z-10 min-h-[300px] flex items-center justify-center">
      {children}
    </div>
  </div>
);
