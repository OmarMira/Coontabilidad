import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Plus, ShoppingCart } from 'lucide-react';

export const PurchaseOrdersList: React.FC<{ onCreateNew: () => void }> = ({ onCreateNew }) => {
    const [orders] = useState([
        { id: 'PO-001', supplier: 'Tech Distro Inc', date: '2023-12-01', total: 1500.00, status: 'closed' },
        { id: 'PO-002', supplier: 'Office Supplies Co', date: '2023-12-28', total: 320.50, status: 'open' },
    ]);

    return (
        <Card className="bg-gray-900 border-gray-800 text-white w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-400" />
                    Órdenes de Compra
                </CardTitle>
                <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Orden
                </Button>
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
                            {orders.map(o => (
                                <tr key={o.id} className="hover:bg-gray-800/50">
                                    <td className="p-3 font-mono text-blue-300">{o.id}</td>
                                    <td className="p-3">{o.supplier}</td>
                                    <td className="p-3 text-gray-400">{o.date}</td>
                                    <td className="p-3 text-right font-mono">${o.total.toFixed(2)}</td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs uppercase border ${o.status === 'open' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                                                'bg-green-900/30 text-green-400 border-green-800'
                                            }`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
