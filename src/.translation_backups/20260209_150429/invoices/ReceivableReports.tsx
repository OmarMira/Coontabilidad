import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, DollarSign, Clock, Filter, Printer, Download } from 'lucide-react';
import { getInvoices, Invoice, getCustomers, Customer } from '@/database/simple-db';

export const ReceivableReports: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [receivables, setReceivables] = useState<any[]>([]);

    useEffect(() => {
        const invoices = getInvoices();
        const customers = getCustomers();

        // Calculate aging
        const now = new Date();
        const pending = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled');

        const reportData = customers.map(customer => {
            const customerInvoices = pending.filter(inv => inv.customer_id === customer.id);
            const totalDue = customerInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

            const aging = {
                current: 0,
                days30: 0,
                days60: 0,
                days90plus: 0
            };

            customerInvoices.forEach(inv => {
                const dueDate = new Date(inv.due_date || inv.issue_date);
                const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays <= 0) aging.current += inv.total_amount || 0;
                else if (diffDays <= 30) aging.days30 += inv.total_amount || 0;
                else if (diffDays <= 60) aging.days60 += inv.total_amount || 0;
                else aging.days90plus += inv.total_amount || 0;
            });

            return {
                ...customer,
                totalDue,
                aging
            };
        }).filter(c => c.totalDue > 0);

        setReceivables(reportData);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div>
                    <h2 className="text-section-title">Reportes de Cuentas por Cobrar</h2>
                    <p className="text-standard-body opacity-80">Antigüedad de saldos y análisis de cartera</p>
                </div>
                <div className="flex gap-3 no-print">
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white">
                        <Download className="w-4 h-4 mr-2" /> Exportar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total por Cobrar" value={formatCurrency(receivables.reduce((s, r) => s + r.totalDue, 0))} icon={DollarSign} color="blue" />
                <StatCard title="Clientes con Deuda" value={receivables.length.toString()} icon={Users} color="purple" />
                <StatCard title="Vencido > 90 días" value={formatCurrency(receivables.reduce((s, r) => s + r.aging.days90plus, 0))} icon={Clock} color="rose" />
                <StatCard title="Cobros Hoy" value={formatCurrency(receivables.reduce((s, r) => s + r.aging.current, 0))} icon={TrendingUp} color="emerald" />
            </div>

            <Card className="bg-slate-950 border-slate-800 shadow-2xl overflow-hidden rounded-2xl">
                <CardHeader className="bg-slate-900 border-b border-slate-800 flex flex-row items-center justify-between py-4">
                    <CardTitle className="text-item-title">Detalle de Cartera por Cliente</CardTitle>
                    <Button variant="ghost" size="sm" className="text-slate-400"><Filter className="w-4 h-4 mr-2" /> Filtrar</Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-slate-500 text-xs font-black uppercase tracking-widest border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4 text-right">Al Corriente</th>
                                    <th className="px-6 py-4 text-right">1-30 Días</th>
                                    <th className="px-6 py-4 text-right">31-60 Días</th>
                                    <th className="px-6 py-4 text-right">61+ Días</th>
                                    <th className="px-6 py-4 text-right">Total Deuda</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {receivables.map((data, idx) => (
                                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-standard-body font-bold text-white">{data.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{data.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">{formatCurrency(data.aging.current)}</td>
                                        <td className="px-6 py-4 text-right font-mono text-amber-400 font-bold">{formatCurrency(data.aging.days30)}</td>
                                        <td className="px-6 py-4 text-right font-mono text-orange-500 font-bold">{formatCurrency(data.aging.days60)}</td>
                                        <td className="px-6 py-4 text-right font-mono text-rose-500 font-bold">{formatCurrency(data.aging.days90plus)}</td>
                                        <td className="px-6 py-4 text-right font-mono text-white text-lg font-black">{formatCurrency(data.totalDue)}</td>
                                    </tr>
                                ))}
                                {receivables.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                                            No hay cuentas por cobrar pendientes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
    const colorMap: any = {
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    };

    return (
        <Card className="bg-slate-900 border-slate-800 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-xl border ${colorMap[color]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                <div>
                    <div className="text-2xl font-black text-white tracking-tight">{value}</div>
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{title}</div>
                </div>
            </CardContent>
        </Card>
    );
};
