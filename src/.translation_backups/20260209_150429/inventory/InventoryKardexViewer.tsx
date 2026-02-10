import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, FileText } from 'lucide-react';
import { getKardexMovements, getProducts, KardexEntry, Product } from '@/database/simple-db';
import { toast } from 'react-hot-toast';

interface InventoryKardexViewerProps {
    initialFilters?: { productId?: string; type?: string; referenceId?: number; alert?: string };
}

export const InventoryKardexViewer: React.FC<InventoryKardexViewerProps> = ({ initialFilters }) => {
    const [movements, setMovements] = useState<KardexEntry[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [filters, setFilters] = useState({
        productId: initialFilters?.productId || 'all',
        type: initialFilters?.type || 'all',
        referenceId: initialFilters?.referenceId || undefined,
        alert: initialFilters?.alert || undefined
    });
    const [loading, setLoading] = useState(false);

    // Load initial data (Products)
    useEffect(() => {
        const prods = getProducts();
        setProducts(prods);
        // Force update filters if props change (useful when navigating from one view to another without unmounting)
        if (initialFilters) {
            setFilters(prev => ({
                ...prev,
                productId: initialFilters.productId || 'all',
                type: initialFilters.type || 'all',
                referenceId: initialFilters.referenceId,
                alert: initialFilters.alert
            }));
        } else {
            loadMovements();
        }
    }, [initialFilters]);

    const loadMovements = () => {
        setLoading(true);
        try {
            const dbFilters: any = {};
            if (filters.productId !== 'all') dbFilters.productId = parseInt(filters.productId);
            if (filters.type !== 'all') dbFilters.type = filters.type;
            if (filters.referenceId) dbFilters.referenceId = filters.referenceId;

            let data = getKardexMovements(dbFilters);

            // Client side filter for specific alerts if needed
            if (filters.alert === 'low_stock') {
                const lowStockIds = products
                    .filter(p => !p.is_service && p.stock_quantity <= p.reorder_point)
                    .map(p => p.id);
                data = data.filter(m => lowStockIds.includes(m.product_id));
            }

            setMovements(data);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar movimientos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMovements();
    }, [filters, products]);

    const movementsWithBalance = React.useMemo(() => {
        // If filtering by reference or alert, balance calculation might be misleading as it's partial history.
        // We only show balance if filtering by PRODUCT and NOT by reference/alert.
        if (filters.productId === 'all' || filters.referenceId || filters.alert) return movements;
        let balance = 0;
        return movements.map(m => {
            balance += m.quantity;
            return { ...m, calculated_balance: balance };
        });
    }, [movements, filters.productId, filters.referenceId, filters.alert]);

    const clearReferenceFilter = () => {
        setFilters(prev => ({ ...prev, referenceId: undefined, alert: undefined, type: 'all' }));
    };

    return (
        <Card className="w-full bg-slate-900 border-slate-800 text-white shadow-xl">
            <CardHeader className="border-b border-slate-800 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="w-6 h-6 text-blue-400" />
                        Kardex de Inventario
                    </CardTitle>
                    <div className="flex gap-2">
                        {filters.alert === 'low_stock' && (
                            <div className="bg-amber-900/30 text-amber-300 px-3 py-1 rounded text-sm flex items-center border border-amber-800">
                                ALERTA: Stock Bajo
                                <button onClick={clearReferenceFilter} className="ml-2 hover:text-white">×</button>
                            </div>
                        )}
                        {filters.referenceId && (
                            <div className="bg-purple-900/30 text-purple-300 px-3 py-1 rounded text-sm flex items-center border border-purple-800">
                                Ref ID: {filters.referenceId}
                                <button onClick={clearReferenceFilter} className="ml-2 hover:text-white">×</button>
                            </div>
                        )}
                        <Button variant="ghost" size="sm" onClick={loadMovements} className="border border-slate-700 text-slate-400 hover:text-white">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 mt-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs text-slate-400 mb-1 block">Producto</label>
                        <select
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500"
                            value={filters.productId}
                            onChange={(e) => setFilters(prev => ({ ...prev, productId: e.target.value }))}
                        >
                            <option value="all">Todos los productos</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id.toString()}>
                                    {p.sku} - {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-[200px]">
                        <label className="text-xs text-slate-400 mb-1 block">Tipo Movimiento</label>
                        <select
                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md p-2 text-sm focus:outline-none focus:border-blue-500"
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <option value="all">Todos</option>
                            <option value="purchase">Compras</option>
                            <option value="sale">Ventas</option>
                            <option value="adjustment">Ajustes</option>
                            <option value="return">Devoluciones</option>
                        </select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-800/80 text-slate-400 font-medium">
                            <tr className="border-b border-slate-700">
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Producto</th>
                                <th className="px-4 py-3">Ref.</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3 text-right">Entrada</th>
                                <th className="px-4 py-3 text-right">Salida</th>
                                {filters.productId !== 'all' && (
                                    <th className="px-4 py-3 text-right">Saldo</th>
                                )}
                                <th className="px-4 py-3">Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movementsWithBalance.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-slate-500">
                                        No se encontraron movimientos registrados
                                    </td >
                                </tr>
                            ) : (
                                movementsWithBalance.map((m) => {
                                    const isPositive = m.quantity > 0;
                                    const absQty = Math.abs(m.quantity);

                                    return (
                                        <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                                            <td className="px-4 py-3 text-slate-300 font-mono text-xs">{m.formatted_date}</td>
                                            <td className="px-4 py-3 text-slate-200">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm text-blue-300">{m.product_sku}</span>
                                                    <span className="text-xs text-slate-400">{m.product_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                                                {m.reference_type === 'purchase_order' && `OC #${m.reference_id}`}
                                                {m.reference_type === 'invoice' && `FAC #${m.reference_id}`}
                                                {m.reference_type === 'adjustment' && `AJT #${m.reference_id}`}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${m.movement_type === 'purchase' ? 'bg-green-900/20 text-green-400 border-green-800' :
                                                    m.movement_type === 'sale' ? 'bg-red-900/20 text-red-400 border-red-800' :
                                                        'bg-blue-900/20 text-blue-400 border-blue-800'
                                                    }`}>
                                                    {m.movement_type === 'purchase' ? 'Compra' :
                                                        m.movement_type === 'sale' ? 'Venta' :
                                                            m.movement_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-green-400">
                                                {isPositive ? `+${absQty}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-red-400">
                                                {!isPositive ? `-${absQty}` : '-'}
                                            </td>
                                            {filters.productId !== 'all' && (
                                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-200">
                                                    {(m as any).calculated_balance}
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-slate-400 text-xs">{m.user_name || 'System'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
