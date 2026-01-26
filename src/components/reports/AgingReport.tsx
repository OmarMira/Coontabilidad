import React, { useState, useEffect } from 'react';
import { Clock, Filter, AlertCircle, RefreshCw, ChevronRight, User, Calendar, CreditCard } from 'lucide-react';
import { getAgingReport } from '../../database/simple-db';
import { ReportExporter } from './ReportExporter';
import { logger } from '../../core/logging/SystemLogger';

export const AgingReport: React.FC = () => {
    const [reportType, setReportType] = useState<'receivable' | 'payable'>('receivable');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = getAgingReport(reportType);
            setData(result);
            logger.info('AgingReport', 'load_success', `Generado aging report: ${reportType}`);
        } catch (e) {
            setError('Error al generar el reporte de antigüedad');
            logger.error('AgingReport', 'load_failed', 'Fallo al generar aging report', null, e as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [reportType]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getExportData = () => {
        if (!data) return { headers: [], rows: [], fileName: '' };
        const rows = data.details.map((d: any) => [d.name, d.bucket, d.days, formatCurrency(d.amount)]);
        return {
            headers: ['Nombre', 'Rango', 'Días', 'Monto'],
            rows,
            fileName: `Aging_${reportType}_${new Date().toISOString().split('T')[0]}`
        };
    };

    const getBucketColor = (bucket: string) => {
        switch (bucket) {
            case 'current': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case '1-30': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case '31-60': return 'bg-sun-orange/10 text-sun-orange border-sun-orange/20';
            case '61-90': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case '90+': return 'bg-rose-600 text-white border-rose-600';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in px-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4">
                        <div className="p-3 bg-sun-orange/10 rounded-2xl border border-sun-orange/20">
                            <Clock className="w-8 h-8 text-sun-orange" />
                        </div>
                        Antigüedad de Cuentas (Aging)
                    </h2>
                    <p className="text-gray-400 mt-2 font-medium">Análisis de vencimientos para {reportType === 'receivable' ? 'Cuentas por Cobrar' : 'Cuentas por Pagar'}.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button
                            onClick={() => setReportType('receivable')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${reportType === 'receivable' ? 'bg-blue-500 text-white shadow-lg shadow-blue-900/40' : 'text-gray-500 hover:text-white'}`}
                        >
                            POR COBRAR
                        </button>
                        <button
                            onClick={() => setReportType('payable')}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${reportType === 'payable' ? 'bg-sun-orange text-white shadow-lg shadow-sun-orange/40' : 'text-gray-500 hover:text-white'}`}
                        >
                            POR PAGAR
                        </button>
                    </div>
                    <button onClick={loadData} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-colors">
                        <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {data && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Summary Section */}
                    <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.keys(data.buckets).map((key) => (
                            <div key={key} className="card-elite !p-6 flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{key === 'current' ? 'CORRIENTE' : `${key} DÍAS`}</span>
                                    <div className="text-2xl font-black text-white mt-1">{formatCurrency(data.buckets[key].amount)}</div>
                                </div>
                                <div className="mt-4 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getBucketColor(key).split(' ')[1].replace('text-', 'bg-')}`}
                                        style={{ width: `${data.buckets[key].percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Table Section */}
                    <div className="lg:col-span-8">
                        <div className="card-elite !p-0 overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-table-header">Detalle de {reportType === 'receivable' ? 'Clientes' : 'Proveedores'}</h3>
                                <span className="text-xs font-black text-white">Total: {formatCurrency(data.total)}</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5">
                                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <th className="px-8 py-5">Entidad</th>
                                            <th className="px-8 py-5">Antigüedad</th>
                                            <th className="px-8 py-5 text-right">Monto Pendiente</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {data.details.map((detail: any, i: number) => (
                                            <tr key={i} className="hover:bg-white/5 transition-all group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-gray-500" />
                                                        </div>
                                                        <span className="text-white font-bold">{detail.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${getBucketColor(detail.bucket)}`}>
                                                            {detail.bucket === 'current' ? 'Corriente' : `${detail.bucket} Días`}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-bold">{detail.days > 0 ? `${detail.days} días de retraso` : 'Al día'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="text-white font-black tabular-nums">{formatCurrency(detail.amount)}</span>
                                                </td>
                                            </tr>
                                        ))}

                                        {data.details.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-8 py-20 text-center">
                                                    <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
                                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No hay cuentas pendientes</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Export Side */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="card-elite !p-6">
                            <h3 className="text-table-header mb-6">Acciones de Reporte</h3>
                            <ReportExporter
                                data={getExportData()}
                                header={{
                                    title: `Aging ${reportType === 'receivable' ? 'Accounts Receivable' : 'Accounts Payable'}`,
                                    subtitle: 'Reporte de Antigüedad Consolidado',
                                    dateRange: `Al ${new Date().toLocaleDateString()}`
                                }}
                            />
                        </div>

                        <div className="card-elite !p-6 bg-blue-500/5 border-blue-500/10">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Alerta de Riesgo</h3>
                            </div>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                {data.buckets['90+'].amount > 0
                                    ? `Urgente: Tiene ${formatCurrency(data.buckets['90+'].amount)} en la categoría de 90+ días. Se recomienda gestión de cobro inmediata.`
                                    : 'Excelente: No hay cuentas con antigüedad superior a 90 días.'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
