import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Save } from 'lucide-react';

export const PurchaseOrderForm: React.FC = () => {
    // Basic Layout for Form
    return (
        <Card className="bg-gray-900 border-gray-800 text-white w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-400" />
                    Nueva Orden de Compra
                </CardTitle>
                <div className="flex gap-2">
                    <Button variant="outline" className="text-gray-400 border-gray-700">Guardar Borrador</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        Emitir Orden
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Proveedor</label>
                        <select className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white">
                            <option>Seleccionar...</option>
                            <option>Tech Distro Inc</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Fecha Emisión</label>
                        <input type="date" className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500">Fecha Esperada</label>
                        <input type="date" className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white" />
                    </div>
                </div>

                <div className="border border-gray-800 rounded p-4 min-h-[200px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                        <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Agregar Productos</p>
                    </div>
                </div>

                <div className="flex justify-end gap-8 pt-4 border-t border-gray-800">
                    <div className="text-right">
                        <span className="text-xs text-gray-500 block">Subtotal</span>
                        <span className="text-lg font-mono text-gray-300">$0.00</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-500 block">Impuestos</span>
                        <span className="text-lg font-mono text-gray-300">$0.00</span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-blue-400 font-bold block">Total</span>
                        <span className="text-2xl font-mono text-white">$0.00</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
