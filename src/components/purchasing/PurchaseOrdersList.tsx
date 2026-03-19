import { logger } from '../../core/logging/SystemLogger';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Plus, ShoppingCart, RefreshCw, Truck, FileText } from 'lucide-react';
import { PurchaseOrder, getPurchaseOrders } from '@/database/modules/db-purchase-orders';
import { getSuppliers } from '@/database/modules/db-suppliers';
import { getProducts } from '@/database/modules/db-products';
import { PurchaseOrderReceiving } from './PurchaseOrderReceiving';
import { toast } from 'react-hot-toast';
import { useLocale } from '../../i18n/useLocale';

export const PurchaseOrdersList: React.FC<{ onCreateNew: () => void, onNavigateToKardex?: (refId: number) => void }> = ({ onCreateNew, onNavigateToKardex }) => {
    const { t } = useLocale();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);

    const loadOrders = () => {
        try {
            const data = getPurchaseOrders();
            setOrders(data);
        } catch (error) {
            logger.error('PurchaseOrdersList', 'error', 'operation_failed', error);
        }
    };

    const handleCreateNew = () => {
        const suppliers = getSuppliers();
        const products = getProducts();

        const hasSuppliers = suppliers.length > 0;
        const hasProducts = products.length > 0;

        if (!hasSuppliers && !hasProducts) {
            toast.error(t('purchaseOrders.validation.missingResources'));
            return;
        }

        if (!hasSuppliers) {
            toast.error(t('purchaseOrders.validation.missingSuppliers'));
            return;
        }

        if (!hasProducts) {
            toast.error(t('purchaseOrders.validation.missingProducts'));
            return;
        }

        onCreateNew();
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return t('purchaseOrders.status.draft');
            case 'approved': return t('purchaseOrders.status.approved');
            case 'received': return t('purchaseOrders.status.received');
            case 'cancelled': return t('purchaseOrders.status.cancelled');
            default: return status;
        }
    };

    return (
        <>
            <Card className="bg-slate-900 border-white/5 text-white w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-blue-400" />
                        {t('purchaseOrders.title')}
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={loadOrders} className="border-slate-700 text-slate-400">
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={handleCreateNew}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('purchaseOrders.newOrder')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border border-white/5 rounded overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-white/10 text-slate-500 text-left">
                                <tr>
                                    <th className="p-3">{t('purchaseOrders.col.order')}</th>
                                    <th className="p-3">{t('purchaseOrders.col.supplier')}</th>
                                    <th className="p-3">{t('purchaseOrders.col.date')}</th>
                                    <th className="p-3 text-right">{t('purchaseOrders.col.total')}</th>
                                    <th className="p-3 text-center">{t('purchaseOrders.col.status')}</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-600">
                                            {t('purchaseOrders.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map(o => (
                                        <tr key={o.id} className="hover:bg-white/10/50">
                                            <td className="p-3 font-mono text-blue-300">{o.order_number}</td>
                                            <td className="p-3">{o.supplier_name || t('supplierPayments.unknownSupplier')}</td>
                                            <td className="p-3 text-slate-500">{o.order_date}</td>
                                            <td className="p-3 text-right font-mono">${o.total_amount.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs uppercase border ${o.status === 'draft' ? 'bg-slate-700 text-slate-300 border-slate-600' :
                                                    o.status === 'approved' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                                                        o.status === 'received' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                                            'bg-red-900/30 text-red-400 border-red-800'
                                                    }`}>
                                                    {getStatusLabel(o.status)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right space-x-2">
                                                {o.status === 'draft' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                                        onClick={() => setReceivingOrder(o)}
                                                        title={t('purchaseOrders.tooltip.receive')}
                                                    >
                                                        <Truck className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {o.status === 'approved' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                                        onClick={() => setReceivingOrder(o)}
                                                        title={t('purchaseOrders.tooltip.receive')}
                                                    >
                                                        <Truck className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {o.status === 'received' && onNavigateToKardex && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                                                        onClick={() => onNavigateToKardex(o.id)}
                                                        title={t('purchaseOrders.tooltip.viewMovements')}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {receivingOrder && (
                <PurchaseOrderReceiving
                    order={receivingOrder}
                    onClose={() => setReceivingOrder(null)}
                    onSuccess={() => {
                        setReceivingOrder(null);
                        loadOrders();
                    }}
                />
            )}
        </>
    );
};
