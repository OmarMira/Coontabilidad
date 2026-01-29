import React, { useState, useEffect } from 'react';
import {
    FileText,
    User,
    Calendar,
    Building2,
    Printer,
    Download,
    CheckCircle,
    Hash
} from 'lucide-react';
import { PayrollEntry, PayrollLineItem, Employee, PayrollPeriod } from '../../database/simple-db';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface PayrollSlipProps {
    entry: PayrollEntry;
    items: PayrollLineItem[];
    employee: Employee;
    period: PayrollPeriod;
    onClose: () => void;
}

export const PayrollSlip: React.FC<PayrollSlipProps> = ({ entry, items, employee, period, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl bg-white text-slate-900 border-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b-2 border-slate-100 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Account Express Demo Inc.</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nómina • Comprobante de Pago</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-bold text-xs flex items-center gap-2">
                            <Printer className="w-4 h-4" /> Imprimir
                        </button>
                        <button onClick={onClose} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-xs">
                            Cerrar
                        </button>
                    </div>
                </div>

                <CardContent className="p-10">
                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Información del Empleado</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500 font-bold">Nombre Completo:</span>
                                    <span className="text-sm font-black text-slate-900">{employee.first_name} {employee.last_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500 font-bold">Código Empleado:</span>
                                    <span className="text-sm font-black text-blue-600">{employee.employee_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500 font-bold">Cargo:</span>
                                    <span className="text-sm font-bold text-slate-700">{employee.position}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Detalles del Período</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500 font-bold">Período Fiscal:</span>
                                    <span className="text-sm font-black text-slate-900">{period.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500 font-bold">Fechas:</span>
                                    <span className="text-sm font-bold text-slate-700">{period.start_date} al {period.end_date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500 font-bold">Fecha de Pago:</span>
                                    <span className="text-sm font-black text-emerald-600">{period.pay_date}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-3xl overflow-hidden mb-8">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Concepto / Descripción</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Percepciones</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Deducciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-700">{item.description}</td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                                            {item.type === 'earning' ? `$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-rose-600">
                                            {item.type === 'deduction' ? `$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-900">
                                    <td className="px-6 py-6 text-sm font-black text-slate-400 uppercase tracking-tighter">Totales de Nómina</td>
                                    <td className="px-6 py-6 text-right text-lg font-black text-white">${entry.gross_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-6 text-right text-lg font-black text-rose-400">-${entry.deductions_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="flex justify-end pt-6">
                        <div className="bg-blue-600 p-8 rounded-3xl text-white min-w-[300px] shadow-xl shadow-blue-200">
                            <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Neto a Recibir</p>
                            <div className="flex items-end justify-between">
                                <h2 className="text-4xl font-black tracking-tighter">${entry.net_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-2">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Pagado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span>© 2026 Account Express Dev Engine</span>
                    <div className="flex items-center gap-2">
                        <Hash className="w-3 h-3 text-slate-300" />
                        <span>ID_SYS_PAYROLL_{entry.id}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};
