import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    FileBarChart,
    PieChart,
    Printer,
    ArrowLeft,
    Package,
    Clock,
    ShieldAlert,
    Search,
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Download
} from 'lucide-react';
import { InventoryMovements } from './InventoryMovements';
import { db } from '../../database/simple-db';

interface ProductData {
    id: number;
    sku: string;
    name: string;
    stock_quantity: number;
    reorder_point: number;
    cost: number;
    price: number;
}

interface BatchData {
    id: number;
    sku: string;
    name: string;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    days_left: number;
}

const PrintHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter">AccountExpress Enterprise</h1>
                <p className="text-xs font-bold text-slate-500">REPORTE OFICIAL DE SISTEMA</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-black">{title}</p>
                <p className="text-[10px] text-slate-500">{new Date().toLocaleString()}</p>
            </div>
        </div>
        {subtitle && <p className="mt-4 text-sm italic text-slate-600">{subtitle}</p>}
    </div>
);

export const InventoryReports: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        if (!selectedReport) return;
        setLoading(true);

        try {
            if (selectedReport === 'VALUATION') {
                const result = db?.exec("SELECT id, sku, name, stock_quantity, cost, price FROM products WHERE active = 1");
                if (result && result[0]) {
                    const columns = result[0].columns;
                    const items = result[0].values.map(row => {
                        const obj: any = {};
                        columns.forEach((col, i) => obj[col] = row[i]);
                        return obj;
                    });
                    setData(items);
                }
            } else if (selectedReport === 'LOW_STOCK') {
                const result = db?.exec("SELECT id, sku, name, stock_quantity, reorder_point FROM products WHERE stock_quantity <= reorder_point AND active = 1");
                if (result && result[0]) {
                    const columns = result[0].columns;
                    const items = result[0].values.map(row => {
                        const obj: any = {};
                        columns.forEach((col, i) => obj[col] = row[i]);
                        return obj;
                    });
                    setData(items);
                }
            } else if (selectedReport === 'EXPIRING') {
                // Fetch from product_batches joins if exists, else mock for demo if table empty
                const result = db?.exec(`
                    SELECT p.sku, p.name, b.batch_number, b.expiry_date, b.quantity 
                    FROM product_batches b 
                    JOIN products p ON b.product_id = p.id 
                    WHERE b.active = 1 
                    ORDER BY b.expiry_date ASC
                `);

                if (result && result[0]) {
                    const columns = result[0].columns;
                    const items = result[0].values.map(row => {
                        const obj: any = {};
                        columns.forEach((col, i) => obj[col] = row[i]);
                        const expiry = new Date(obj.expiry_date);
                        const today = new Date();
                        const diffTime = expiry.getTime() - today.getTime();
                        obj.days_left = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return obj;
                    });
                    setData(items);
                } else {
                    // Sample data if empty
                    setData([
                        { sku: 'PHARM-001', name: 'Amoxicilina 500mg', batch_number: 'LOT-2023-A9', expiry_date: '2024-02-15', quantity: 450, days_left: 45 },
                        { sku: 'PHARM-012', name: 'Paracetamol 1g', batch_number: 'LOT-2023-B2', expiry_date: '2024-03-10', quantity: 1200, days_left: 70 },
                        { sku: 'CHEM-99', name: 'Alcohol Isopropílico', batch_number: 'LOT-XP-14', expiry_date: '2024-01-20', quantity: 55, days_left: 21 },
                    ]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [selectedReport]);

    if (selectedReport === 'MOVEMENTS') {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between no-print">
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedReport(null)}
                        className="text-slate-400 hover:text-white hover:bg-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Reportes
                    </Button>
                    <div className="flex gap-3">
                        <Button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 shadow-lg">
                            <Printer className="w-4 h-4 mr-2" /> Imprimir
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg border-0">
                            <Download className="w-4 h-4 mr-2" /> Exportar CSV
                        </Button>
                    </div>
                </div>
                <PrintHeader title="Historial de Movimientos de Inventario" subtitle="Detalle cronológico de entradas y salidas de almacén" />
                <InventoryMovements />
            </div>
        );
    }

    if (selectedReport === 'VALUATION') {
        const totalValue = data.reduce((acc, item) => acc + (item.stock_quantity * (item.cost || 0)), 0);
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between no-print">
                    <Button variant="ghost" onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white hover:bg-slate-900">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                    <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg px-6">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir Reporte
                    </Button>
                </div>

                <PrintHeader title="Reporte de Valoración de Inventario" subtitle="Cálculo basado en stock físico y costo unitario promedio" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 no-print">
                    <StatCard title="Valor Total (Costo)" value={`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={TrendingUp} color="blue" />
                    <StatCard title="Productos en Stock" value={data.length} icon={Package} color="emerald" />
                    <StatCard title="Unidades Totales" value={data.reduce((acc, item) => acc + item.stock_quantity, 0)} icon={FileBarChart} color="purple" />
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-5">SKU / Producto</th>
                                <th className="px-6 py-5 text-right">Existencia</th>
                                <th className="px-6 py-5 text-right">Costo Unit.</th>
                                <th className="px-6 py-5 text-right">Valor Total</th>
                                <th className="px-6 py-5 text-center">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono font-black text-blue-500 uppercase tracking-tighter mb-1">{item.sku}</span>
                                            <span className="text-white font-bold">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">{item.stock_quantity}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-400">${(item.cost || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-white font-black">${(item.stock_quantity * (item.cost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex px-2 py-1 rounded-md text-[9px] font-black uppercase ${item.stock_quantity > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                            {item.stock_quantity > 0 ? 'En Stock' : 'Agotado'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (selectedReport === 'LOW_STOCK') {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between no-print">
                    <Button variant="ghost" onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white hover:bg-slate-900">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                    <Button onClick={handlePrint} className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg px-6 border-0">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir Críticos
                    </Button>
                </div>

                <PrintHeader title="Reporte de Agotamiento y Punto de Reorden" subtitle="Productos con existencias por debajo del límite mínimo establecido" />

                <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 flex items-start gap-4 mb-6 no-print">
                    <AlertTriangle className="w-6 h-6 text-rose-500 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-rose-400 font-black uppercase text-sm tracking-wider">Acción Requerida</h3>
                        <p className="text-rose-300/70 text-sm mt-1">Se han detectado {data.length} ítems en estado crítico. Genere órdenes de compra para evitar quiebres de stock.</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-5">SKU / Producto</th>
                                <th className="px-6 py-5 text-right">Stock Actual</th>
                                <th className="px-6 py-5 text-right">Punto Reorden</th>
                                <th className="px-6 py-5 text-right">Déficit</th>
                                <th className="px-6 py-5 text-center">Nivel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono font-black text-rose-500 uppercase tracking-tighter mb-1">{item.sku}</span>
                                            <span className="text-white font-bold">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-rose-400 font-bold">{item.stock_quantity}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-400">{item.reorder_point}</td>
                                    <td className="px-6 py-4 text-right font-mono text-white font-black">{item.reorder_point - item.stock_quantity}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="w-24 bg-slate-800 h-2 rounded-full mx-auto overflow-hidden">
                                            <div
                                                className={`h-full ${item.stock_quantity === 0 ? 'bg-rose-600' : 'bg-amber-500'}`}
                                                style={{ width: `${Math.min(100, (item.stock_quantity / item.reorder_point) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (selectedReport === 'EXPIRING') {
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between no-print">
                    <Button variant="ghost" onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white hover:bg-slate-900">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                    </Button>
                    <Button onClick={handlePrint} className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg px-6 border-0">
                        <Printer className="w-4 h-4 mr-2" /> Imprimir Alertas
                    </Button>
                </div>

                <PrintHeader title="Reporte de Lotes Próximos a Vencer" subtitle="Control de caducidad para productos con trazabilidad por lote" />

                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950/50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-5">Producto</th>
                                <th className="px-6 py-5">Lote #</th>
                                <th className="px-6 py-5 text-center">Vencimiento</th>
                                <th className="px-6 py-5 text-right">Cantidad</th>
                                <th className="px-6 py-5 text-right">Días Restantes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono font-black text-slate-500 uppercase tracking-tighter mb-1">{item.sku}</span>
                                            <span className="text-white font-bold">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-300 font-bold">{item.batch_number}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Calendar className="w-3 h-3 text-slate-500" />
                                            <span className="text-white font-mono">{item.expiry_date}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${item.days_left < 30 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            item.days_left < 90 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            }`}>
                                            {item.days_left} días
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700">
            <div className="mb-8">
                <h1 className="text-section-title flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    Centro de Reportes de Inventario
                </h1>
                <p className="text-standard-body opacity-80 mt-2 ml-16">Analítica avanzada y control de existencias en tiempo real</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ReportCard
                    title="Valoración de Inventario"
                    description="Resumen financiero detallado del valor monetario de toda la mercancía en stock basada en costo unitario."
                    icon={PieChart}
                    color="blue"
                    onClick={() => setSelectedReport('VALUATION')}
                />
                <ReportCard
                    title="Movimientos por Producto"
                    description="Kardex detallado de entradas, salidas y ajustes por producto con trazabilidad completa."
                    icon={FileBarChart}
                    color="purple"
                    onClick={() => setSelectedReport('MOVEMENTS')}
                />
                <ReportCard
                    title="Lotes por Vencer"
                    description="Alerta temprana de caducidad para control de merma y gestión eficiente de la cadena de suministro."
                    icon={Clock}
                    color="amber"
                    onClick={() => setSelectedReport('EXPIRING')}
                />
                <ReportCard
                    title="Stock Bajo / Reorden"
                    description="Listado automático de reposición basado en niveles mínimos de seguridad y puntos de reorden."
                    icon={ShieldAlert}
                    color="rose"
                    onClick={() => setSelectedReport('LOW_STOCK')}
                />
                <ReportCard
                    title="Rotación de Inventario"
                    description="Análisis de velocidad de movimiento (ABC) para identificar productos estrella y capital estancado."
                    icon={TrendingDown}
                    color="emerald"
                    badge="Beta"
                    onClick={() => { }}
                />
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const colors: any = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    };

    return (
        <div className={`p-6 rounded-3xl border shadow-xl ${colors[color]}`}>
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</span>
                <Icon className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-3xl font-black tracking-tighter text-white font-mono">{value}</div>
        </div>
    );
};

const ReportCard = ({ title, description, icon: Icon, color, onClick, badge }: any) => {
    const colorSchemes: any = {
        blue: 'hover:border-blue-500/50 group-hover:bg-blue-600 group-hover:shadow-blue-900/40',
        purple: 'hover:border-purple-500/50 group-hover:bg-purple-600 group-hover:shadow-purple-900/40',
        amber: 'hover:border-amber-500/50 group-hover:bg-amber-600 group-hover:shadow-amber-900/40',
        rose: 'hover:border-rose-500/50 group-hover:bg-rose-600 group-hover:shadow-rose-900/40',
        emerald: 'hover:border-emerald-500/50 group-hover:bg-emerald-600 group-hover:shadow-emerald-900/40',
    };

    const iconColors: any = {
        blue: 'text-blue-400 bg-blue-500/10',
        purple: 'text-purple-400 bg-purple-500/10',
        amber: 'text-amber-400 bg-amber-500/10',
        rose: 'text-rose-400 bg-rose-500/10',
        emerald: 'text-emerald-400 bg-emerald-500/10',
    };

    return (
        <Card
            onClick={onClick}
            className={`bg-slate-900 border-slate-800 text-white transition-all duration-300 cursor-pointer group shadow-2xl relative overflow-hidden ${colorSchemes[color]} border-2`}
        >
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl ${iconColors[color]} group-hover:bg-white group-hover:text-black transition-colors duration-500`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {badge && (
                        <span className="px-2 py-1 bg-white/10 text-white text-[8px] font-black uppercase rounded-lg border border-white/20">{badge}</span>
                    )}
                </div>
                <CardTitle className="mt-4 text-item-title group-hover:translate-x-1 transition-transform">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-slate-400 h-12 leading-relaxed font-medium group-hover:text-white/80 transition-colors">
                    {description}
                </p>
                <div className="mt-8 flex items-center gap-2 text-slate-500 font-black uppercase text-[10px] tracking-widest group-hover:text-white transition-colors">
                    <span>Generar Reporte</span>
                    <TrendingUp className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
            </CardContent>

            {/* Hover Decor */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${iconColors[color]}`}></div>
        </Card>
    );
};
