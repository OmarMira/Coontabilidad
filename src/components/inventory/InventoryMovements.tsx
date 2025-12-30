import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownLeft, ArrowUpRight, Search, Activity, Package, Trash2 } from 'lucide-react';
import { getInventoryMovements } from '../../database/simple-db';

export const InventoryMovements: React.FC = () => {
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setLoading(true);
        const data = getInventoryMovements();
        setMovements(data);
        setLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-6 no-print">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-500" />
                        Historial de Movimientos
                    </h2>
                    <p className="text-slate-400 font-medium ml-11">Auditoría completa de entradas y salidas</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white rounded-xl" onClick={loadData}>
                        <Search className="w-4 h-4 mr-2" /> Actualizar
                    </Button>
                </div>
            </div>

            <div className="rounded-3xl border border-slate-800 overflow-hidden bg-slate-900/40 shadow-2xl">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-950/50 text-slate-500 font-black uppercase tracking-widest text-[10px] border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-5">Fecha</th>
                            <th className="px-6 py-5">Tipo</th>
                            <th className="px-6 py-5">Producto</th>
                            <th className="px-6 py-5 text-right">Cantidad</th>
                            <th className="px-6 py-5 text-right">Balance</th>
                            <th className="px-6 py-5">Referencia</th>
                            <th className="px-6 py-5">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {movements.map((move) => (
                            <tr key={move.id} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="px-6 py-4 font-mono text-slate-400">
                                    {new Date(move.date).toLocaleDateString()}
                                    <div className="text-[9px] text-slate-600 font-mono">{new Date(move.date).toLocaleTimeString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border ${move.type === 'IN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            move.type === 'OUT' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                        {move.type === 'IN' && <ArrowDownLeft className="w-3 h-3" />}
                                        {move.type === 'OUT' && <ArrowUpRight className="w-3 h-3" />}
                                        {move.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1 px-2 font-mono text-[10px] bg-slate-800 rounded text-blue-400 font-black border border-slate-700">
                                            {move.product_sku}
                                        </div>
                                        <span className="text-white font-bold tracking-tight">{move.product_name}</span>
                                    </div>
                                </td>
                                <td className={`px-6 py-4 text-right font-mono text-lg font-black ${move.quantity > 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                    {move.quantity > 0 ? '+' : ''}{move.quantity?.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-slate-300 font-bold">
                                    {(move.balance_after || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-xs uppercase tracking-tighter">{move.reference_id || '---'}</span>
                                        <span className="text-slate-500 font-black uppercase text-[8px] tracking-widest">{move.reference_type}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-xs italic max-w-xs truncate">{move.notes}</td>
                            </tr>
                        ))}
                        {movements.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <Activity className="w-12 h-12 mb-4 opacity-10" />
                                        <p className="text-lg font-medium">No se han registrado movimientos de inventario</p>
                                        <p className="text-sm opacity-60">Las transacciones aparecerán aquí automáticamente</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
