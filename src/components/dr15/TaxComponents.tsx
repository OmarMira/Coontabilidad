import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle, Bell, Filter, Printer } from 'lucide-react';

export const TaxCalendar: React.FC = () => {
    const deadlines = [
        { date: '2025-01-20', label: 'Presentación DR-15 Diciembre 2024', status: 'pending', priority: 'high' },
        { date: '2025-01-15', label: 'Depósitos RT-6', status: 'completed', priority: 'medium' },
        { date: '2025-02-20', label: 'Presentación DR-15 Enero 2025', status: 'upcoming', priority: 'high' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Calendario Fiscal Florida</h2>
                    <p className="text-slate-400 font-medium">Alertas y vencimientos del Florida Department of Revenue</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-blue-900/40">
                    <Bell className="w-4 h-4 mr-2" /> Configurar Alertas
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {deadlines.map((deadline, idx) => (
                    <Card key={idx} className="bg-slate-900 border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-blue-500/30 transition-all">
                        <CardHeader className="pb-2 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex justify-between items-start">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${deadline.priority === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    }`}>
                                    Prioridad {deadline.priority}
                                </span>
                                <span className="text-slate-500 text-xs font-mono">{deadline.date}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`p-3 rounded-xl ${deadline.status === 'completed' ? 'bg-emerald-500/10' : 'bg-slate-800'
                                    }`}>
                                    {deadline.status === 'completed' ? (
                                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                                    ) : (
                                        <Clock className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-bold mb-1 leading-tight">{deadline.label}</h4>
                                    <p className="text-slate-500 text-xs lowercase">Florida Department of Revenue</p>
                                </div>
                            </div>
                            <Button variant="outline" className={`w-full font-bold border-slate-700 ${deadline.status === 'completed' ? 'text-emerald-400 border-emerald-500/20' : 'text-slate-300'
                                }`}>
                                {deadline.status === 'completed' ? 'Completado' : 'Ver Detalles'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export const TaxReports: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Escrutinio e Informes Fiscales</h2>
                    <p className="text-slate-400 font-medium">Histórico de presentaciones DR-15 y auditoría IVU</p>
                </div>
                <div className="flex gap-3 no-print">
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Imprimir Histórico
                    </Button>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white">
                        <Filter className="w-4 h-4 mr-2" /> Filtrar Período
                    </Button>
                </div>
            </div>

            <Card className="bg-slate-950 border-slate-800 shadow-2xl overflow-hidden rounded-2xl">
                <CardHeader className="bg-slate-900 border-b border-slate-800 p-4">
                    <CardTitle className="text-white text-lg font-bold">Presentaciones DR-15 Recientes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Período Fiscal</th>
                                    <th className="px-6 py-4">Fecha de Envío</th>
                                    <th className="px-6 py-4 text-right">Ventas Sujetas</th>
                                    <th className="px-6 py-4 text-right">Impuesto Total</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                <tr className="hover:bg-slate-900/40 transition-colors">
                                    <td className="px-6 py-4 text-white font-bold">Noviembre 2024</td>
                                    <td className="px-6 py-4 text-slate-400">2024-12-18</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">$142,500.00</td>
                                    <td className="px-6 py-4 text-right font-mono text-white font-black">$9,262.50</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded tracking-tighter uppercase">Enviado</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">Descargar PDF</Button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-900/40 transition-colors">
                                    <td className="px-6 py-4 text-white font-bold">Octubre 2024</td>
                                    <td className="px-6 py-4 text-slate-400">2024-11-19</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">$128,400.00</td>
                                    <td className="px-6 py-4 text-right font-mono text-white font-black">$8,346.00</td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded tracking-tighter uppercase">Enviado</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">Descargar PDF</Button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
