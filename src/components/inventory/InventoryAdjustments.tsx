import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming existence or standard HTML
import { Label } from '@/components/ui/label'; // Assuming existence or standard HTML
import { ClipboardEdit, Save, X } from 'lucide-react';

export const InventoryAdjustments: React.FC = () => {
    const [reason, setReason] = useState('');
    const [sku, setSku] = useState('');
    const [diff, setDiff] = useState(0);

    return (
        <Card className="bg-gray-900 border-gray-800 text-white max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardEdit className="w-5 h-5 text-orange-400" />
                    Nuevo Ajuste de Inventario
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <Label className="text-gray-400">Motivo del Ajuste</Label>
                    <select
                        className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    >
                        <option value="">Seleccione...</option>
                        <option value="damage">Mercancía Dañada</option>
                        <option value="theft">Robo / Pérdida</option>
                        <option value="count">Conteo Cíclico / Diferencia Física</option>
                        <option value="expired">Producto Vencido</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label className="text-gray-400">SKU / Producto</Label>
                        <input
                            placeholder="Buscar producto..."
                            className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white"
                            value={sku}
                            onChange={e => setSku(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-gray-400">Diferencia (+/-)</Label>
                        <input
                            type="number"
                            className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white font-mono"
                            value={diff}
                            onChange={e => setDiff(Number(e.target.value))}
                        />
                        <p className="text-xs text-gray-500">
                            Use negativo para reducir stock (pérdida), positivo para añadir (hallazgo).
                        </p>
                    </div>
                </div>

                <div className="bg-orange-900/20 p-3 rounded border border-orange-800/50">
                    <p className="text-xs text-orange-300">
                        Este ajuste afectará inmediatamente el stock disponible y el valor del inventario. La acción quedará registrada en la auditoría.
                    </p>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Ajuste
                    </Button>
                    <Button variant="ghost" className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


