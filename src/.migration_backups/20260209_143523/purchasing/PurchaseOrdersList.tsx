import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Plus, ShoppingCart, RefreshCw, Truck, FileText } from 'lucide-react';
import { PurchaseOrder, getPurchaseOrders, getSuppliers, getProducts } from '@/database/simple-db';
import { PurchaseOrderReceiving } from './PurchaseOrderReceiving';
import { toast } from 'react-hot-toast';

export const PurchaseOrdersList: React.FC<{ onCreateNew: () => void, onNavigateToKardex?: (refId: number) => void }> = ({ onCreateNew, onNavigateToKardex }) => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);

    const loadOrders = () => {
        try {
            const data = getPurchaseOrders();
            setOrders(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateNew = () => {
        const suppliers = getSuppliers();
        const products = getProducts();

        const hasSuppliers = suppliers.length > 0;
        const hasProducts = products.length > 0;

        if (!hasSuppliers && !hasProducts) {
            toast.error("Faltan Proveedores y Productos. Registre ambos antes de crear una orden.");
            return;
        }

        if (!hasSuppliers) {
            toast.error("Faltan Proveedores. Registre al menos un proveedor.");
            return;
        }

        if (!hasProducts) {
            toast.error("Faltan Productos. Registre al menos un producto.");
            return;
        }

        onCreateNew();
    };

    useEffect(() => {
        loadOrders();
    }, []);

    return (
        <>
            <Card className="bg-gray-900 border-gray-800 text-white w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-blue-400" />
                        Órdenes de Compra
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
                            Nueva Orden
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border border-gray-800 rounded overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-800 text-gray-400 text-left">
                                <tr>
                                    <th className="p-3"># Orden</th>
                                    <th className="p-3">Proveedor</th>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3 text-right">Total</th>
                                    <th className="p-3 text-center">Estado</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No hay órdenes de compra registradas.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map(o => (
                                        <tr key={o.id} className="hover:bg-gray-800/50">
                                            <td className="p-3 font-mono text-blue-300">{o.order_number}</td>
                                            <td className="p-3">{o.supplier_name || 'Desconocido'}</td>
                                            <td className="p-3 text-gray-400">{o.order_date}</td>
                                            <td className="p-3 text-right font-mono">${o.total_amount.toFixed(2)}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-xs uppercase border ${o.status === 'draft' ? 'bg-slate-700 text-slate-300 border-slate-600' :
                                                    o.status === 'approved' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                                                        o.status === 'received' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                                            'bg-red-900/30 text-red-400 border-red-800'
                                                    }`}>
                                                    {o.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right space-x-2">
                                                {o.status === 'draft' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                                        onClick={() => setReceivingOrder(o)}
                                                        title="Recibir Mercancía (Demo Shortcut)"
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
                                                        title="Recibir Mercancía"
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
                                                        title="Ver Movimientos"
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
