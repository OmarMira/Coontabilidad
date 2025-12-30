import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, ShieldAlert, Printer } from 'lucide-react';

export const TrialBalanceReport: React.FC = () => {
    // Mock Data
    const [data] = useState([
        { code: '1000', name: 'Cash', debit: 5000, credit: 0 },
        { code: '1100', name: 'Accounts Receivable', debit: 2500, credit: 0 },
        { code: '2000', name: 'Accounts Payable', debit: 0, credit: 1500 },
        { code: '3000', name: 'Owner Equity', debit: 0, credit: 5000 },
        { code: '4000', name: 'Sales Revenue', debit: 0, credit: 2000 },
        { code: '5000', name: 'COGS', debit: 1000, credit: 0 }
    ]);

    const totalDebit = data.reduce((s, r) => s + r.debit, 0);
    const totalCredit = data.reduce((s, r) => s + r.credit, 0);

    return (
        <div className="space-y-6 bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6">
                <div>
                    <h2 className="text-section-title">Balance de Comprobación</h2>
                    <p className="text-standard-body opacity-80">Verificación de saldos débitos y créditos</p>
                </div>
                <div className="flex gap-3 no-print">
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white rounded-xl" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white rounded-xl">
                        <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6 shadow-lg shadow-blue-900/40">
                        <Download className="w-4 h-4 mr-2" /> Exportar PDF
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/40">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-4">Código</th>
                            <th className="px-6 py-4">Cuenta</th>
                            <th className="px-6 py-4 text-right">Débito</th>
                            <th className="px-6 py-4 text-right">Crédito</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs text-blue-400 font-black bg-blue-900/20 px-2 py-1 rounded">
                                        {row.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-200 group-hover:text-white transition-colors">{row.name}</td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                                    {row.debit > 0 ? row.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-rose-400">
                                    {row.credit > 0 ? row.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-900 font-black border-t border-slate-700">
                        <tr>
                            <td colSpan={2} className="px-6 py-6 text-right uppercase text-xs tracking-widest text-slate-500">Totales Generales</td>
                            <td className="px-6 py-6 text-right font-mono text-xl text-emerald-400 underline decoration-emerald-500/30 decoration-4 underline-offset-8">
                                {totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-6 text-right font-mono text-xl text-rose-400 underline decoration-rose-500/30 decoration-4 underline-offset-8">
                                {totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {totalDebit !== totalCredit && (
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-400">
                    <ShieldAlert className="w-5 h-5" />
                    <p className="font-bold">Error: El balance no está cuadrado. Existe una diferencia de {(totalDebit - totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
            )}
        </div>
    );
};
