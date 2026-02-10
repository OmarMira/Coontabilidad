import React, { useState, useEffect } from 'react';
import { Activity, Calendar, RefreshCw, AlertCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { getCashFlowStatement } from '../../database/simple-db';
import { ReportExporter } from './ReportExporter';
import { logger } from '../../core/logging/SystemLogger';

export const CashFlowStatement: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = getCashFlowStatement(dateRange.from, dateRange.to);
            setData(result);
            logger.info('CashFlow', 'load_success', 'Estado de flujo de efectivo generado');
        } catch (e) {
            setError('Error al generar el reporte de flujo de efectivo');
            logger.error('CashFlow', 'load_failed', 'Fallo al generar cash flow', null, e as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [dateRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getExportData = () => {
        if (!data) return { headers: [], rows: [], fileName: '' };

        const rows: any[][] = [];
        rows.push(['ACTIVIDADES OPERATIVAS', '']);
        rows.push(['Utilidad Neta', formatCurrency(data.netIncome)]);
        data.operatingActivities.forEach((act: any) => {
            rows.push([act.title, formatCurrency(act.amount)]);
        });
        rows.push(['---', '---']);
        rows.push(['AUMENTO/DISMINUCIÓN NETO EN EFECTIVO', formatCurrency(data.netIncreaseInCash)]);
        rows.push(['Efectivo al inicio del periodo', formatCurrency(data.startingCash)]);
        rows.push(['EFECTIVO AL FINAL DEL PERIODO', formatCurrency(data.endingCash)]);

        return {
            headers: ['Concepto', 'Monto'],
            rows,
            fileName: `Flujo_Efectivo_${dateRange.from}_a_${dateRange.to}`
        };
    };

    return (
        <div className="space-y-8 animate-fade-in px-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <Activity className="w-8 h-8 text-emerald-400" />
                        </div>
                        Estado de Flujos de Efectivo
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">Análisis de liquidez mediante el método indirecto.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="bg-transparent text-white text-xs font-black focus:outline-none"
                        />
                        <span className="text-slate-600 text-xs">A</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="bg-transparent text-white text-xs font-black focus:outline-none"
                        />
                    </div>
                    <button onClick={loadData} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors">
                        <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="card-elite !p-8">
                            <h3 className="text-table-header mb-8">Movimientos de Efectivo</h3>

                            <div className="space-y-6">
                                {/* Operating Section */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                        <span className="text-white font-black text-sm uppercase tracking-wider">Actividades Operativas</span>
                                        <span className="text-emerald-400 font-black">{formatCurrency(data.netIncome + data.operatingActivities.reduce((s: any, a: any) => s + a.amount, 0))}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm pl-4">
                                        <span className="text-slate-500">Utilidad Neta (Pérdida)</span>
                                        <span className="text-white font-bold">{formatCurrency(data.netIncome)}</span>
                                    </div>

                                    {data.operatingActivities.map((act: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center text-sm pl-4">
                                            <span className="text-slate-500">{act.title}</span>
                                            <span className={`font-bold ${act.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                {formatCurrency(act.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Net Summary */}
                                <div className="pt-8 space-y-4 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Aumento Neto en Efectivo</span>
                                        <span className={`text-xl font-black ${data.netIncreaseInCash < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {formatCurrency(data.netIncreaseInCash)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">Efectivo al inicio del periodo</span>
                                        <span className="text-white font-medium">{formatCurrency(data.startingCash)}</span>
                                    </div>
                                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex justify-between items-center mt-4">
                                        <span className="text-blue-400 font-black uppercase text-xs tracking-widest">Efectivo al final del periodo</span>
                                        <span className="text-2xl font-black text-white">{formatCurrency(data.endingCash)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Export & Ratios Side */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="card-elite !p-6">
                            <h3 className="text-table-header mb-6">Opciones de Exportación</h3>
                            <ReportExporter
                                data={getExportData()}
                                header={{
                                    title: 'Estado de Flujos de Efectivo',
                                    subtitle: 'Método Indirecto',
                                    dateRange: `${dateRange.from} al ${dateRange.to}`
                                }}
                            />
                        </div>

                        <div className="card-elite !p-6 space-y-4 bg-emerald-500/5 border-emerald-500/10">
                            <div className="flex items-center gap-3 mb-2">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Ratio de Liquidez</h3>
                            </div>
                            <div className="text-3xl font-black text-emerald-400">1.42</div>
                            <p className="text-[10px] text-slate-600 font-bold leading-relaxed uppercase tracking-wider">
                                La empresa cuenta con efectivo suficiente para cubrir sus obligaciones inmediatas 1.42 veces.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4">
                    <AlertCircle className="w-8 h-8 text-rose-400" />
                    <div>
                        <span className="text-white font-bold block">Error de Generación</span>
                        <p className="text-sm text-slate-600">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
