import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Trash2, Save } from 'lucide-react';
import { type JournalEntry, type JournalLine } from '../../modules/accounting/Accounting.types';

export const JournalEntryForm: React.FC = () => {
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [lines, setLines] = useState<JournalLine[]>([
        { account_code: '', debit: 0, credit: 0, description: '' },
        { account_code: '', debit: 0, credit: 0, description: '' }
    ]);

    const addLine = () => setLines([...lines, { account_code: '', debit: 0, credit: 0, description: '' }]);

    const updateLine = (index: number, field: keyof JournalLine, value: any) => {
        const newLines = [...lines];
        (newLines[index] as any)[field] = value;
        setLines(newLines);
    };

    const removeLine = (index: number) => {
        if (lines.length > 2) {
            setLines(lines.filter((_, i) => i !== index));
        }
    };

    const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit), 0);
    const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit), 0);
    const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return (
        <Card className="bg-gray-900 border-gray-800 text-white w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Nuevo Asiento Contable
                </CardTitle>
                <div className="flex items-center gap-4">
                    <span className={`text-sm font-mono font-bold ${balanced ? 'text-green-500' : 'text-red-500'}`}>
                        {balanced ? 'BALANCEADO' : 'DESCUADRADO'}
                    </span>
                    <Button
                        disabled={!balanced || !description}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Save className="w-4 h-4 mr-2" /> Contabilizar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">Descripción General</label>
                        <input
                            className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">Fecha</label>
                        <input
                            type="date"
                            className="w-full bg-gray-800 border-gray-700 rounded p-2 text-white"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="border border-gray-800 rounded overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-800 text-gray-400 text-left">
                            <tr>
                                <th className="p-2 w-1/4">Cuenta</th>
                                <th className="p-2 w-1/4">Descripción Línea</th>
                                <th className="p-2 w-1/6 text-right">Débito</th>
                                <th className="p-2 w-1/6 text-right">Crédito</th>
                                <th className="p-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {lines.map((line, idx) => (
                                <tr key={idx}>
                                    <td className="p-2">
                                        <input
                                            placeholder="Código..."
                                            className="w-full bg-transparent border-b border-gray-700 focus:border-blue-500 outline-none p-1 text-white"
                                            value={line.account_code}
                                            onChange={e => updateLine(idx, 'account_code', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            placeholder="..."
                                            className="w-full bg-transparent border-b border-gray-700 focus:border-blue-500 outline-none p-1 text-gray-300"
                                            value={line.description}
                                            onChange={e => updateLine(idx, 'description', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            className="w-full bg-transparent border-b border-gray-700 focus:border-blue-500 outline-none p-1 text-right text-green-300 font-mono"
                                            value={line.debit}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => {
                                                updateLine(idx, 'debit', Number(e.target.value));
                                                if (Number(e.target.value) > 0) updateLine(idx, 'credit', 0);
                                            }}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            className="w-full bg-transparent border-b border-gray-700 focus:border-blue-500 outline-none p-1 text-right text-orange-300 font-mono"
                                            value={line.credit}
                                            onFocus={(e) => e.target.select()}
                                            onChange={e => {
                                                updateLine(idx, 'credit', Number(e.target.value));
                                                if (Number(e.target.value) > 0) updateLine(idx, 'debit', 0);
                                            }}
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <button onClick={() => removeLine(idx)} className="text-gray-500 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-800/50 font-medium">
                            <tr>
                                <td colSpan={2} className="p-2">
                                    <Button variant="ghost" size="sm" onClick={addLine} className="text-blue-400 hover:text-blue-300">
                                        <Plus className="w-3 h-3 mr-1" /> Agregar Línea
                                    </Button>
                                </td>
                                <td className="p-2 text-right font-mono text-green-400">{totalDebit.toFixed(2)}</td>
                                <td className="p-2 text-right font-mono text-orange-400">{totalCredit.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
