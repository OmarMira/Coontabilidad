import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Package, ArrowRight } from 'lucide-react';
import { getProducts, getKardexMovements, Product, KardexEntry } from '@/database/simple-db';

export const InventoryDashboard: React.FC<{
    OnNavigateToKardex: (filters?: { alert?: string }) => void
}> = ({ OnNavigateToKardex }) => {
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [recentMovements, setRecentMovements] = useState<KardexEntry[]>([]);
    const [stats, setStats] = useState({
        totalValue: 0,
        totalItems: 0,
        lowStockCount: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        try {
            const products = getProducts();
            const movements = getKardexMovements({}); // Get all/recent

            // Calculate stats
            let totalVal = 0;
            let totalQty = 0;
            const lowStock: Product[] = [];

            products.forEach(p => {
                const cost = p.cost ?? 0;
                const qty = p.stock_quantity ?? 0;
                const min = p.min_stock_level ?? 0;

                totalVal += (qty * cost);
                totalQty += qty;
                if (qty <= min) {
                    lowStock.push(p);
                }
            });

            setStats({
                totalValue: totalVal,
                totalItems: totalQty,
                lowStockCount: lowStock.length
            });

            setLowStockProducts(lowStock);
            setRecentMovements(movements.slice(0, 5)); // Top 5 recent

        } catch (error) {
            console.error("Error loading inventory dashboard", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900 border-slate-800 text-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Valor Total Inventario</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight text-blue-400 font-mono">
                            ${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Costo ponderado actual</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 text-white cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => OnNavigateToKardex()}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Total Items en Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight text-slate-200">
                            {stats.totalItems.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            Auditar Inventario <ArrowRight className="w-2 h-2" />
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className={`bg-slate-900 border-slate-800 text-white transition-colors ${stats.lowStockCount > 0 ? 'cursor-pointer hover:border-amber-500/50' : ''}`}
                    onClick={() => stats.lowStockCount > 0 && OnNavigateToKardex({ alert: 'low_stock' })}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-400">Alertas Stock Bajo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-black tracking-tight ${stats.lowStockCount > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                            {stats.lowStockCount}
                        </div>
                        <p className={`text-xs mt-1 ${stats.lowStockCount > 0 ? 'text-amber-500 font-bold' : 'text-slate-500'}`}>
                            {stats.lowStockCount > 0 ? 'Ver Stock Crítico' : 'Productos bajo mínimo'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="bg-slate-900 border-slate-800 text-white h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="w-5 h-5 text-blue-400" />
                            Movimientos Recientes
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => OnNavigateToKardex()} className="text-xs text-blue-400 hover:text-blue-300">
                            Ver todo <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentMovements.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-4">No hay movimientos recientes.</p>
                            ) : (
                                recentMovements.map(m => (
                                    <div key={m.id} className="flex items-center justify-between border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 w-2 h-2 rounded-full ${m.quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">{m.product_name}</p>
                                                <p className="text-xs text-slate-500">{m.formatted_date} • Ref: {m.reference_type}</p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-mono font-bold ${m.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {m.quantity > 0 ? '+' : ''}{m.quantity}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alerts */}
                <Card className="bg-slate-900 border-slate-800 text-white h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-amber-400">
                            <AlertTriangle className="w-5 h-5" />
                            Atención Requerida
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {lowStockProducts.length === 0 ? (
                                <div className="text-center py-6">
                                    <Package className="w-12 h-12 text-green-900/40 mx-auto mb-2" />
                                    <p className="text-green-500 text-sm">Todo el inventario está saludable.</p>
                                </div>
                            ) : (
                                lowStockProducts.map(p => (
                                    <Alert key={p.id} className="bg-amber-950/20 border-amber-900/50 text-amber-200">
                                        <AlertTitle className="text-sm font-bold flex justify-between">
                                            {p.name}
                                            <span className="text-xs bg-amber-900/50 px-2 py-0.5 rounded text-amber-100">
                                                Stock: {p.stock_quantity}
                                            </span>
                                        </AlertTitle>
                                        <AlertDescription className="text-xs text-amber-400/70 mt-1">
                                            Nivel mínimo: {p.min_stock_level} • SKU: {p.sku}
                                        </AlertDescription>
                                    </Alert>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
