import React, { useState, useEffect } from 'react';
import {
    BarChart3,
    Download,
    Search,
    Calendar,
    TrendingUp,
    TrendingDown,
    Users,
    Briefcase,
    FileText
} from 'lucide-react';
import { getPayrollPeriods, PayrollPeriod } from '../../database/simple-db';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const PayrollReports: React.FC = () => {
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setPeriods(getPayrollPeriods());
    }, []);

    const totalAnnualLaborCost = periods.reduce((acc, p) => acc + p.total_gross, 0);
    const totalAnnualNet = periods.reduce((acc, p) => acc + p.total_net, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <BarChart3 className="w-8 h-8 text-blue-500" />
                        Informes de Nómina
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Análisis de Costos Laborales y Retenciones</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Briefcase className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20 uppercase">
                                Gasto Bruto
                            </span>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Costo Laboral Acumulado</p>
                        <h3 className="text-2xl font-black text-white tabular-nums">${totalAnnualLaborCost.toLocaleString()}</h3>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                <Users className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-full border border-indigo-400/20 uppercase">
                                Liquidado
                            </span>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Neto Pagado</p>
                        <h3 className="text-2xl font-black text-white tabular-nums">${totalAnnualNet.toLocaleString()}</h3>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-rose-500/10 rounded-xl">
                                <TrendingDown className="w-5 h-5 text-rose-400" />
                            </div>
                            <span className="text-[10px] font-black text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full border border-rose-400/20 uppercase">
                                Retenciones
                            </span>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Impuestos y Ley</p>
                        <h3 className="text-2xl font-black text-white tabular-nums">${(totalAnnualLaborCost - totalAnnualNet).toLocaleString()}</h3>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between">
                    <CardTitle className="text-white text-lg font-bold">Resumen de Pagos por Período</CardTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar período..."
                            className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none w-48"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Período</th>
                                <th className="px-6 py-4">Fecha Pago</th>
                                <th className="px-6 py-4 text-right">Total Bruto</th>
                                <th className="px-6 py-4 text-right">Retenciones</th>
                                <th className="px-6 py-4 text-right">Total Neto</th>
                                <th className="px-6 py-4 text-center">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {periods.map(period => (
                                <tr key={period.id} className="hover:bg-white/[0.01]">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{period.name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{period.start_date} - {period.end_date}</div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-400">{period.pay_date}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">${period.total_gross.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono text-rose-500">-${(period.total_gross - period.total_net).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-emerald-400">${period.total_net.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="p-2 hover:bg-white/10 text-slate-400 rounded-lg group">
                                            <FileText className="w-4 h-4 group-hover:text-blue-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {periods.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-600 italic">No hay datos de períodos procesados aún.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};
