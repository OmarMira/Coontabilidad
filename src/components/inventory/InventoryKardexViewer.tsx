import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    FileText, RefreshCw, ArrowDownLeft, ArrowUpRight, AlertTriangle,
    Search, Filter, Package, Zap
} from 'lucide-react';
import type { KardexEntry, Product } from '@/database/modules/db-types';
import { getProducts } from '@/database/modules/db-products';
import { getKardexMovements } from '@/database/modules/db-purchase-orders';
import { useLocale } from '@/i18n/useLocale';

interface KardexViewerProps {
    initialFilters?: { productId?: string; type?: string; referenceId?: string };
}

export const InventoryKardexViewer: React.FC<KardexViewerProps> = ({ initialFilters }) => {
    const { t } = useLocale();
    const [movements, setMovements] = useState<KardexEntry[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>(initialFilters?.productId || '');
    const [selectedType, setSelectedType] = useState<string>(initialFilters?.type || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProducts();
        loadMovements();
    }, []);

    const loadProducts = () => {
        try {
            const prods = getProducts();
            setProducts(prods);
        } catch (err) {
            logger.error('InventoryKardexViewer', 'error', err);
        }
    };

    const loadMovements = () => {
        setLoading(true);
        try {
            const data = getKardexMovements({});
            setMovements(data);
        } catch (err) {
            logger.error('InventoryKardexViewer', 'error', t('inv.kardex.errorLoading'), err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return movements.filter(m => {
            if (selectedProduct && m.product_id?.toString() !== selectedProduct) return false;
            if (selectedType) {
                const type = (m.reference_type || '').toLowerCase();
                if (selectedType === 'purchase' && !type.includes('purchase') && !type.includes('compra')) return false;
                if (selectedType === 'sale' && !type.includes('sale') && !type.includes('venta')) return false;
                if (selectedType === 'adjustment' && !type.includes('adjust') && !type.includes('ajuste')) return false;
                if (selectedType === 'return' && !type.includes('return') && !type.includes('devol')) return false;
            }
            return true;
        });
    }, [movements, selectedProduct, selectedType]);

    const getTypeDisplay = (refType: string, quantity: number) => {
        const type = (refType || '').toLowerCase();
        if (type.includes('purchase') || type.includes('compra')) return { label: t('inv.kardex.purchase'), color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
        if (type.includes('sale') || type.includes('venta')) return { label: t('inv.kardex.sale'), color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
        if (quantity > 0) return { label: t('inv.kardex.entry'), color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
        return { label: t('inv.kardex.exit'), color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
    };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Header Hub */}
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-3.5 bg-slate-900/50 rounded-xl border border-white/5 shadow-2xl backdrop-blur-xl group">
                        <FileText className="w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {t('inv.kardex.title')}
                        </h2>
                        <p className="text-slate-500 text-[13px] flex items-center gap-2 mt-1">
                            <Zap className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t('inventoryDashboard.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 justify-center">
                    {/* Filters Inline */}
                    <div className="flex items-center gap-4 bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800 shadow-xl">
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t('inv.kardex.productFilter')}</label>
                            <select
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                                value={selectedProduct}
                                onChange={e => setSelectedProduct(e.target.value)}
                            >
                                <option value="">{t('inv.kardex.allProducts')}</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id?.toString()}>{p.sku} â€” {p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-px h-6 bg-slate-800 hidden md:block" />
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t('inv.kardex.type')}</label>
                            <select
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                                value={selectedType}
                                onChange={e => setSelectedType(e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="purchase">{t('inv.kardex.purchases')}</option>
                                <option value="sale">{t('inv.kardex.sales')}</option>
                                <option value="adjustment">{t('inv.kardex.adjustmentsFilter')}</option>
                                <option value="return">{t('inv.kardex.returns')}</option>
                            </select>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={loadMovements}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {t('inv.kardex.refresh')}
                    </Button>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-slate-950/50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-5">{t('inv.kardex.date')}</th>
                                    <th className="px-6 py-5">{t('inv.kardex.product')}</th>
                                    <th className="px-6 py-5">{t('inv.kardex.ref')}</th>
                                    <th className="px-6 py-5">{t('inv.kardex.type')}</th>
                                    <th className="px-6 py-5 text-right">{t('inv.kardex.entry')}</th>
                                    <th className="px-6 py-5 text-right">{t('inv.kardex.exit')}</th>
                                    <th className="px-6 py-5 text-right">{t('inv.kardex.balanceCol')}</th>
                                    <th className="px-6 py-5">{t('inv.kardex.user')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filtered.map((m) => {
                                    const typeInfo = getTypeDisplay(m.reference_type ?? '', m.quantity);
                                    return (
                                        <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                                                {m.formatted_date || new Date(m.created_at ?? Date.now()).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-mono font-black text-slate-600 uppercase">{m.product_sku}</span>
                                                    <span className="text-white font-bold text-xs">{m.product_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-slate-500 text-[10px]">{m.reference_id || 'â€”'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${typeInfo.color}`}>
                                                    {m.quantity > 0 ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                    {typeInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">
                                                {m.quantity > 0 ? `+${m.quantity}` : ''}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-rose-400 font-bold">
                                                {m.quantity < 0 ? m.quantity : ''}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-white font-black">
                                                â€”
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">{m.user_name || 'â€”'}</td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center">
                                            <Package className="w-10 h-10 text-slate-800 mx-auto mb-3" />
                                            <p className="text-slate-500 font-bold">{t('inv.kardex.noMovementsFound')}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
