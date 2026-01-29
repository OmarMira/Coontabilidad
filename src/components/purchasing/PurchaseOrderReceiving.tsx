import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, CheckCircle, Package } from 'lucide-react';
import { PurchaseOrder, receivePurchaseOrder } from '@/database/simple-db';
import { toast } from 'react-hot-toast';

interface Props {
    order: PurchaseOrder;
    onClose: () => void;
    onSuccess: () => void;
}

export const PurchaseOrderReceiving: React.FC<Props> = ({ order, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReceive = async () => {
        if (!confirm(`¿Confirmar recepción de mercancía para Orden #${order.order_number}? Esto aumentará el stock de los productos.`)) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Asumimos userId 1 por ahora, en un sistema real vendría del AuthContext
            const result = receivePurchaseOrder(order.id, 1);

            if (result.success) {
                toast.success('Mercancía recibida e inventario actualizado');
                onSuccess();
            } else {
                toast.error('Error al recibir: ' + result.message);
            }
        } catch (error) {
            toast.error('Error inesperado');
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
                        Recepción de Mercancía
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Orden de Compra:</span>
                            <span className="font-mono text-blue-300 font-bold">{order.order_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Proveedor:</span>
                            <span>{order.supplier_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Total Orden:</span>
                            <span className="font-mono">${order.total_amount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-amber-900/10 border border-amber-900/30 rounded-lg text-amber-200 text-sm">
                            <Package className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>
                                Al confirmar, el sistema registrará la entrada de inventario automáticamente en el Kardex y actualizará las existencias disponibles de todos los productos en la orden.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 p-6">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleReceive}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Procesando...</span>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Confirmar Recepción
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
