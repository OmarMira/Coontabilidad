import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { getKardexMovements, getProducts, KardexEntry, Product } from '@/database/simple-db';

interface ProductKardexReportProps {
    productId: number;
    onClose: () => void;
}

export const ProductKardexReport: React.FC<ProductKardexReportProps> = ({ productId, onClose }) => {
    const [movements, setMovements] = useState<any[]>([]);
    const [product, setProduct] = useState<Product | null>(null);

    useEffect(() => {
        // Load Product Info
        const allProducts = getProducts();
        const p = allProducts.find(x => x.id === productId);
        setProduct(p || null);

        // Load Movements (Assumption: getKardexMovements returns ASC for single product)
        const rawMovements = getKardexMovements({ productId });

        // Calculate Running Balance
        let balance = 0;
        const processed = rawMovements.map(m => {
            balance += m.quantity;
            return { ...m, match_balance: balance };
        });

        setMovements(processed);
    }, [productId]);

    if (!product) return <div>Cargando datos del producto...</div>;

    return (
        <div className="bg-white text-black p-8 max-w-4xl mx-auto shadow-2xl rounded-lg my-8">
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase tracking-wider">Kardex Físico Valorado</h1>
                    <p className="text-sm text-slate-600">Reporte de Movimientos de Inventario</p>
                </div>
                <div className="text-right">
                    <Button onClick={() => window.print()} variant="outline" className="print:hidden mb-2">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button onClick={onClose} variant="ghost" className="print:hidden block text-xs">
                        Cerrar
                    </Button>
                    <p className="font-mono text-sm ml-auto">Fecha: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-4 rounded border border-gray-200">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Producto</label>
                    <div className="text-lg font-bold">{product.name}</div>
                    <div className="text-sm font-mono text-slate-700">SKU: {product.sku}</div>
                </div>
                <div className="text-right">
                    <label className="text-xs font-bold text-slate-500 uppercase">Existencia Actual</label>
                    <div className="text-2xl font-black tracking-tight text-blue-600">{product.stock_quantity}</div>
                    <div className="text-xs text-slate-600">Método de Valuación: PROMEDIO</div>
                </div>
            </div>

            <table className="w-full text-sm border-collapse mb-8">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left py-2">Fecha</th>
                        <th className="text-left py-2">Concepto / Referencia</th>
                        <th className="text-center py-2">Tipo</th>
                        <th className="text-right py-2">Entrada</th>
                        <th className="text-right py-2">Salida</th>
                        <th className="text-right py-2 bg-gray-100">Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    {movements.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-500">Sin movimientos</td></tr>
                    ) : (
                        movements.map((m, idx) => (
                            <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-2">{new Date(m.created_at).toLocaleDateString()} {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="py-2">
                                    <span className="font-medium">{m.movement_type === 'purchase' ? 'Compra' : m.movement_type === 'sale' ? 'Venta' : 'Ajuste'}</span>
                                    <br />
                                    <span className="text-xs text-slate-600 font-mono">{m.reference_type} #{m.reference_id}</span>
                                </td>
                                <td className="text-center py-2">
                                    <span className="text-xs px-2 py-1 rounded bg-gray-200">{m.movement_type}</span>
                                </td>
                                <td className="text-right py-2 font-mono text-green-700">
                                    {m.quantity > 0 ? m.quantity : '-'}
                                </td>
                                <td className="text-right py-2 font-mono text-red-700">
                                    {m.quantity < 0 ? Math.abs(m.quantity) : '-'}
                                </td>
                                <td className="text-right py-2 font-mono font-bold bg-gray-50">
                                    {m.match_balance}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <div className="text-center text-xs text-slate-500 mt-12 pt-4 border-t border-gray-100">
                Account Express System • Reporte Generado Automáticamente • {new Date().getFullYear()}
            </div>
        </div>
    );
};
