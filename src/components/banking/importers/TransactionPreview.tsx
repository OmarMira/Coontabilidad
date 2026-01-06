import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, ArrowRight, X } from 'lucide-react';
import { NormalizedTransaction } from './TransactionNormalizer';

interface TransactionPreviewProps {
    transactions: NormalizedTransaction[];
    onConfirm: (selectedIds: number[]) => void;
    onCancel: () => void;
    loading?: boolean;
}

export const TransactionPreview: React.FC<TransactionPreviewProps> = ({ transactions, onConfirm, onCancel, loading }) => {
    // Selection state (default all selected)
    // We'll use index as temporary ID since normalized transactions might not have unique IDs yet
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set(transactions.map((_, i) => i)));

    const summary = useMemo(() => {
        let totalAmount = 0;
        let validCount = 0;
        let errorCount = 0;

        transactions.forEach((t, i) => {
            if (selectedIndices.has(i)) {
                totalAmount += t.amount; // Cents
                validCount++;
            }
        });

        return { totalAmount, validCount, errorCount };
    }, [transactions, selectedIndices]);

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedIndices(newSet);
    };

    const toggleAll = () => {
        if (selectedIndices.size === transactions.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(transactions.map((_, i) => i)));
        }
    };

    if (transactions.length === 0) {
        return (
            <div className="text-center p-8 text-slate-400">
                No hay transacciones para previsualizar.
                <Button variant="ghost" onClick={onCancel} className="mt-4">Volver</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
            {/* Header / Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            📋 Vista Previa de Importación
                        </h3>
                        <p className="text-sm text-slate-400">
                            Revisa y confirma las transacciones antes de guardarlas.
                        </p>
                    </div>

                    <div className="flex gap-6 text-sm">
                        <div>
                            <span className="text-slate-500 block text-xs uppercase font-bold">Transacciones</span>
                            <span className="text-white font-mono text-xl">{summary.validCount} <span className="text-slate-500 text-sm">/ {transactions.length}</span></span>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs uppercase font-bold">Total (USD)</span>
                            <span className={`font-mono text-xl ${summary.totalAmount >= 0 ? 'text-green-400' : 'text-slate-300'}`}>
                                ${(summary.totalAmount / 100).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <Card className="bg-slate-900 border-slate-800 overflow-hidden flex flex-col md:max-h-[600px] h-[500px]">
                <div className="bg-slate-950 border-b border-slate-800 p-3 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={selectedIndices.size === transactions.length && transactions.length > 0}
                            onChange={toggleAll}
                            className="rounded border-slate-700 bg-slate-900"
                        />
                        <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Seleccionar Todo</span>
                    </div>
                    <span className="text-xs text-slate-500">
                        {selectedIndices.size} seleccionados
                    </span>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-sm text-left text-slate-400">
                        <thead className="text-xs uppercase bg-slate-950 text-slate-300 sticky top-0 z-0">
                            <tr>
                                <th className="w-10 px-4 py-3 text-center"></th>
                                <th className="px-4 py-3">Fecha</th>
                                <th className="px-4 py-3">Descripción</th>
                                <th className="px-4 py-3 text-right">Monto</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {transactions.map((t, i) => {
                                const isSelected = selectedIndices.has(i);
                                return (
                                    <tr
                                        key={i}
                                        className={`hover:bg-slate-800/50 transition-colors ${!isSelected ? 'opacity-50' : ''}`}
                                        onClick={() => toggleSelection(i)}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => { }} // handled by row click
                                                className="rounded border-slate-700 bg-slate-900 pointer-events-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-white">
                                            {t.transaction_date}
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">
                                            {t.description}
                                            {t.reference_number && <span className="ml-2 text-xs text-slate-500 bg-slate-800 px-1 rounded">{t.reference_number}</span>}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-mono font-medium ${t.amount < 0 ? 'text-slate-300' : 'text-green-400'}`}>
                                            {(t.amount / 100).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                <CheckCircle className="w-3 h-3" /> Válido
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                <Button variant="outline" onClick={onCancel} disabled={loading} className="border-slate-700 hover:bg-slate-800 text-slate-300">
                    <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <Button
                    onClick={() => onConfirm(Array.from(selectedIndices))}
                    disabled={loading || selectedIndices.size === 0}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 shadow-lg shadow-blue-900/20"
                >
                    {loading ? <span className="animate-spin mr-2">⏳</span> : <ArrowRight className="w-4 h-4 mr-2" />}
                    Confirmar Importación ({summary.validCount})
                </Button>
            </div>
        </div>
    );
};
