import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    User,
    DollarSign,
    Download,
    Eye,
    Calculator,
    FileText
} from 'lucide-react';
import {
    getPayrollEntries,
    getPayrollLineItems,
    PayrollEntry,
    PayrollLineItem
} from '../../database/simple-db';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface PayrollEntryListProps {
    periodId: number;
    onBack: () => void;
}

export const PayrollEntryList: React.FC<PayrollEntryListProps> = ({ periodId, onBack }) => {
    const [entries, setEntries] = useState<(PayrollEntry & { employee_name: string })[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
    const [lineItems, setLineItems] = useState<PayrollLineItem[]>([]);

    useEffect(() => {
        const data = getPayrollEntries(periodId);
        setEntries(data);
    }, [periodId]);

    const handleViewDetails = (entryId: number) => {
        const items = getPayrollLineItems(entryId);
        setLineItems(items);
        setSelectedEntry(entryId);
    };

    const totalGross = entries.reduce((sum, entry) => sum + entry.gross_amount, 0);
    const totalDeductions = entries.reduce((sum, entry) => sum + entry.deductions_amount, 0);
    const totalNet = entries.reduce((sum, entry) => sum + entry.net_amount, 0);

    if (selectedEntry) {
        const entry = entries.find(e => e.id === selectedEntry);
        if (!entry) return null;

        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setSelectedEntry(null)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Lista
                    </Button>
                    <div>
                        <h3 className="text-xl font-black text-white">Detalle de Nómina</h3>
                        <p className="text-slate-500 text-sm">{entry.employee_name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-emerald-500/10 rounded-xl">
                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20 uppercase">
                                    Bruto
                                </span>
                            </div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Devengado</p>
                            <h3 className="text-2xl font-black text-white tabular-nums">${entry.gross_amount.toLocaleString()}</h3>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-rose-500/10 rounded-xl">
                                    <Calculator className="w-5 h-5 text-rose-400" />
                                </div>
                                <span className="text-[10px] font-black text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full border border-rose-400/20 uppercase">
                                    Deducciones
                                </span>
                            </div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Impuestos y Retenciones</p>
                            <h3 className="text-2xl font-black text-white tabular-nums">${entry.deductions_amount.toLocaleString()}</h3>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <User className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20 uppercase">
                                    Neto
                                </span>
                            </div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">A Pagar</p>
                            <h3 className="text-2xl font-black text-white tabular-nums">${entry.net_amount.toLocaleString()}</h3>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white text-lg font-bold">Desglose de Conceptos</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                <tr>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Categoría</th>
                                    <th className="px-6 py-4">Descripción</th>
                                    <th className="px-6 py-4 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {lineItems.map(item => (
                                    <tr key={item.id} className="hover:bg-white/[0.02]">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${item.type === 'earning' 
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                            }`}>
                                                {item.type === 'earning' ? 'Ingreso' : 'Deducción'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-400 capitalize">{item.category}</td>
                                        <td className="px-6 py-4 text-white">{item.description}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-white">
                                            {item.type === 'earning' ? '+' : '-'}${item.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {lineItems.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-600 italic">No hay conceptos registrados</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    onClick={onBack}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Periodos
                </Button>
                <div>
                    <h3 className="text-xl font-black text-white">Entradas de Nómina</h3>
                    <p className="text-slate-500 text-sm">{entries.length} empleados procesados</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                <DollarSign className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20 uppercase">
                                Total Bruto
                            </span>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Suma de Devengos</p>
                        <h3 className="text-2xl font-black text-white tabular-nums">${totalGross.toLocaleString()}</h3>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-rose-500/10 rounded-xl">
                                <Calculator className="w-5 h-5 text-rose-400" />
                            </div>
                            <span className="text-[10px] font-black text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full border border-rose-400/20 uppercase">
                                Deducciones
                            </span>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Retenciones</p>
                        <h3 className="text-2xl font-black text-white tabular-nums">${totalDeductions.toLocaleString()}</h3>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <User className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20 uppercase">
                                Total Neto
                            </span>
                        </div>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">A Liquidar</p>
                        <h3 className="text-2xl font-black text-white tabular-nums">${totalNet.toLocaleString()}</h3>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800">
                    <CardTitle className="text-white text-lg font-bold">Lista de Empleados Procesados</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Empleado</th>
                                <th className="px-6 py-4 text-right">Bruto</th>
                                <th className="px-6 py-4 text-right">Deducciones</th>
                                <th className="px-6 py-4 text-right">Neto</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {entries.map(entry => (
                                <tr key={entry.id} className="hover:bg-white/[0.02]">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{entry.employee_name}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">ID: {entry.employee_id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">${entry.gross_amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono text-rose-400">-${entry.deductions_amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-emerald-400">${entry.net_amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${entry.status === 'paid' 
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                            : entry.status === 'verified'
                                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                        }`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => handleViewDetails(entry.id)}
                                                className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                                title="Ver Detalles"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors" title="Descargar Comprobante">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {entries.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-600 italic">No hay entradas de nómina para este período</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};