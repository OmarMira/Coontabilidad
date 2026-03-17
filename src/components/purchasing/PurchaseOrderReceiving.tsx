import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, CheckCircle, Package } from 'lucide-react';
import type { PurchaseOrder } from '@/database/modules/db-types';
import { receivePurchaseOrder } from '@/database/modules/db-purchase-orders';
import { toast } from 'react-hot-toast';
import { useLocale } from '../../i18n/useLocale';

interface Props {
    order: PurchaseOrder;
    onClose: () => void;
    onSuccess: () => void;
}

export const PurchaseOrderReceiving: React.FC<Props> = ({ order, onClose, onSuccess }) => {
    const { t } = useLocale();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReceive = async () => {
        if (!confirm(t('poReceiving.confirmDialog').replace('{number}', order.order_number ?? order.po_number ?? ''))) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Asumimos userId 1 por ahora, en un sistema real vendría del AuthContext
            const result = receivePurchaseOrder(order.id, 1);

            if (result.success) {
                toast.success(t('poReceiving.success'));
                onSuccess();
            } else {
                toast.error(t('poReceiving.error') + result.message);
            }
        } catch (error) {
            toast.error(t('poReceiving.error unexpected'));
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg bg-slate-900 border-slate-800 text-white shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="border-b border-slate-800">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Truck className="w-6 h-6 text-blue-400" />
                        {t('poReceiving.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-400">{t('poReceiving.order')}</span>
                            <span className="font-mono text-blue-300 font-bold">{order.order_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">{t('poReceiving.supplier')}</span>
                            <span>{order.supplier_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">{t('poReceiving.total')}</span>
                            <span className="font-mono">${order.total_amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-amber-900/10 border border-amber-900/30 rounded-lg text-amber-200 text-sm">
                            <Package className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>
                                {t('poReceiving.info')}
                            </p>
                        </div>
                    </div>
                </CardContent>
                <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 p-6">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        {t('poReceiving.cancel')}
                    </Button>
                    <Button
                        onClick={handleReceive}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">{t('poReceiving.processing')}</span>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {t('poReceiving.confirm')}
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
