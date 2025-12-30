import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Search, Plus } from 'lucide-react';

export const SuppliersList: React.FC = () => {
    const [suppliers] = useState([
        { id: 1, name: 'Tech Distro Inc', contact: 'John Doe', status: 'active', balance: 0 },
        { id: 2, name: 'Office Supplies Co', contact: 'Jane Smith', status: 'active', balance: 1500.00 },
    ]);

    return (
        <Card className="bg-gray-900 border-gray-800 text-white w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    Proveedores
                </CardTitle>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Proveedor
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border border-gray-800 rounded overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-800 text-gray-400 font-medium text-left">
                            <tr>
                                <th className="p-3">Nombre</th>
                                <th className="p-3">Contacto</th>
                                <th className="p-3">Estado</th>
                                <th className="p-3 text-right">Saldo Pendiente</th>
                                <th className="p-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {suppliers.map(s => (
                                <tr key={s.id} className="hover:bg-gray-800/50">
                                    <td className="p-3 font-medium">{s.name}</td>
                                    <td className="p-3 text-gray-400">{s.contact}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-900/30 text-green-400 border border-green-900">
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right font-mono">${s.balance.toFixed(2)}</td>
                                    <td className="p-3">
                                        <Button variant="ghost" size="sm">Ver</Button>
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
