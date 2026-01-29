import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    FileText,
    Download,
    User,
    Hash,
    Eye
} from 'lucide-react';
import { getPayrollEntries, getPayrollLineItems, getEmployees, getPayrollPeriods, Employee, PayrollPeriod, PayrollEntry, PayrollLineItem } from '../../database/simple-db';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PayrollSlip } from './PayrollSlip';

interface PayrollEntryListProps {
    periodId: number;
    onBack: () => void;
}

export const PayrollEntryList: React.FC<PayrollEntryListProps> = ({ periodId, onBack }) => {
    const [entries, setEntries] = useState<(PayrollEntry & { employee_name: string })[]>([]);
    const [period, setPeriod] = useState<PayrollPeriod | null>(null);
    const [selectedEntry, setSelectedEntry] = useState<{ entry: PayrollEntry, items: PayrollLineItem[], employee: Employee } | null>(null);

    useEffect(() => {
        const allPeriods = getPayrollPeriods();
        const p = allPeriods.find(x => x.id === periodId);
        if (p) setPeriod(p);
        setEntries(getPayrollEntries(periodId));
    }, [periodId]);

    const handleViewSlip = (entry: PayrollEntry) => {
        const items = getPayrollLineItems(entry.id);
        const employees = getEmployees();
        const employee = employees.find(e => e.id === entry.employee_id);
        if (employee && period) {
            setSelectedEntry({ entry, items, employee });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button onClick={onBack} variant="outline" size="sm" className="border-slate-800 text-slate-400 hover:text-white">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
                <div>
                    <h2 className="text-xl font-black text-white px-2">Detalles: {period?.name}</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-2">{period?.start_date} - {period?.end_date}</p>
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Empleado</th>
                                <th className="px-6 py-4 text-right">Bruto</th>
                                <th className="px-6 py-4 text-right">Deducciones</th>
                                <th className="px-6 py-4 text-right">Neto</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {entries.map(entry => (
                                <tr key={entry.id} className="hover:bg-white/[0.01]">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{entry.employee_name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">ID_{entry.employee_id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-300">${entry.gross_amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono text-rose-500">-${entry.deductions_amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right font-mono font-black text-emerald-400">${entry.net_amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleViewSlip(entry)}
                                                className="p-2 hover:bg-indigo-500/10 text-indigo-400 rounded-lg transition-colors" title="Ver Recibo"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-white/10 text-slate-400 rounded-lg transition-colors">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            {selectedEntry && (
                <PayrollSlip
                    entry={selectedEntry.entry}
                    items={selectedEntry.items}
                    employee={selectedEntry.employee}
                    period={period!}
                    onClose={() => setSelectedEntry(null)}
                />
            )}
        </div>
    );
};
