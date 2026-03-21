import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import type { KardexEntry, Product } from '@/database/modules/db-types';
import { getProducts } from '@/database/modules/db-products';
import { getKardexMovements } from '@/database/modules/db-purchase-orders';
import { useLocale } from '@/i18n/useLocale';

interface Props {
    productId: number;
    onClose: () => void;
}

export const ProductKardexReport: React.FC<Props> = ({ productId, onClose }) => {
    const { t } = useLocale();
    const [product, setProduct] = useState<Product | null>(null);
    const [movements, setMovements] = useState<KardexEntry[]>([]);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const products = getProducts();
        const p = products.find(prod => prod.id === productId);
        setProduct(p || null);

        if (p) {
            const movs = getKardexMovements({ productId: productId });
            setMovements(movs);
        }
    }, [productId]);

    const handlePrint = () => {
        window.print();
    };

    const getMovementType = (refType: string, qty: number): string => {
        const type = (refType || '').toLowerCase();
        if (type.includes('purchase') || type.includes('compra')) return t('inv.productKardex.purchase');
        if (type.includes('sale') || type.includes('venta')) return t('inv.productKardex.sale');
        if (type.includes('adjust') || type.includes('ajuste')) return t('inv.productKardex.adjustment');
        return qty > 0 ? t('inv.productKardex.entry') : t('inv.productKardex.exit');
    };

    if (!product) {
        return <div className="text-white text-center py-12">{t('inv.productKardex.loadingProduct')}</div>;
    }

    return (
        <div className="bg-white text-black p-8 rounded-2xl shadow-2xl max-w-4xl mx-auto" ref={reportRef}>
            {/* Print Controls */}
            <div className="flex items-center justify-between mb-6 no-print">
                <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl">
                    <Printer className="w-4 h-4 mr-2" /> {t('inv.productKardex.print')}
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl">
                    <X className="w-4 h-4 mr-2" /> {t('inv.productKardex.close')}
                </Button>
            </div>

            {/* Header */}
            <div className="border-b-2 border-black pb-4 mb-6 text-center">
                <h1 className="text-2xl font-black tracking-tight uppercase tracking-wider">{t('inv.productKardex.title')}</h1>
                <p className="text-xs text-slate-500">{t('inv.productKardex.subtitle')}</p>
            </div>

            {/* Product Info */}
            <div className="grid grid-cols-3 gap-4 mb-6 text-sm border-b border-slate-300 pb-4">
                <div>
                    <span className="font-bold text-slate-500 text-[10px] uppercase">{t('inv.productKardex.dateLabel')}</span>
                    <p className="font-mono">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                    <span className="font-bold text-slate-500 text-[10px] uppercase">{t('inv.productKardex.productLabel')}</span>
                    <p className="font-bold">{product.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{product.sku}</p>
                </div>
                <div>
                    <span className="font-bold text-slate-500 text-[10px] uppercase">{t('inv.productKardex.currentStock')}</span>
                    <p className="text-2xl font-black">{product.stock_quantity}</p>
                </div>
            </div>

            <p className="text-[10px] text-slate-400 mb-4 font-black uppercase tracking-widest">{t('inv.productKardex.valuationMethod')}</p>

            {/* Table */}
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="border-b-2 border-black font-black uppercase text-[9px] tracking-widest">
                        <th className="py-2 text-left">{t('inv.productKardex.dateLabel')}</th>
                        <th className="py-2 text-left">{t('inv.productKardex.conceptRef')}</th>
                        <th className="py-2 text-center">{t('inv.productKardex.type')}</th>
                        <th className="py-2 text-right">{t('inv.productKardex.entry')}</th>
                        <th className="py-2 text-right">{t('inv.productKardex.exit')}</th>
                        <th className="py-2 text-right">{t('inv.productKardex.balance')}</th>
                    </tr>
                </thead>
                <tbody>
                    {movements.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">{t('inv.productKardex.noMovements')}</td>
                        </tr>
                    ) : (
                        movements.map((m) => {
                            const moveType = getMovementType(m.reference_type ?? '', m.quantity);
                            return (
                                <tr key={m.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="py-2 font-mono text-slate-600">
                                        {m.formatted_date || new Date(m.created_at ?? Date.now()).toLocaleDateString()}
                                    </td>
                                    <td className="py-2">
                                        <span className="font-bold">{m.reference_id || '—'}</span>
                                        {m.notes && <span className="text-slate-400 ml-2">({m.notes})</span>}
                                    </td>
                                    <td className="py-2 text-center font-bold text-slate-700">{moveType}</td>
                                    <td className="py-2 text-right font-mono font-bold text-emerald-700">
                                        {m.quantity > 0 ? m.quantity : ''}
                                    </td>
                                    <td className="py-2 text-right font-mono font-bold text-rose-700">
                                        {m.quantity < 0 ? Math.abs(m.quantity) : ''}
                                    </td>
                                    <td className="py-2 text-right font-mono font-black">—</td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-black text-center text-[9px] text-slate-400 font-black uppercase tracking-widest">
                {t('inv.productKardex.footer')}
            </div>
        </div>
    );
};
