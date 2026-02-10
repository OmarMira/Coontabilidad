import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BankTransaction, MatchCandidate, findPotentialMatches, confirmMatch, unmatchTransaction } from '@/database/simple-db';
import { Check, X, AlertTriangle, ArrowRight, RefreshCw, Scale, Search } from 'lucide-react';

interface Props {
    transactions: BankTransaction[];
    onMatchComplete: () => void;
}

export const BankTransactionMatcher: React.FC<Props> = ({ transactions, onMatchComplete }) => {
    const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null);
    const [matches, setMatches] = useState<MatchCandidate[]>([]);
    const [loading, setLoading] = useState(false);

    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    const matchedTransactions = transactions.filter(t => t.status === 'matched');

    // Seleccionar automáticamente la primera transacción pendiente si no hay selección
    useEffect(() => {
        if (selectedTxnId === null && pendingTransactions.length > 0) {
            setSelectedTxnId(pendingTransactions[0].id);
        }
    }, [pendingTransactions, selectedTxnId]);

    // Buscar coincidencias cuando cambia la selección
    useEffect(() => {
        if (selectedTxnId) {
            const txn = transactions.find(t => t.id === selectedTxnId);
            if (txn && txn.status === 'pending') {
                setLoading(true);
                // Simular pequeño delay para UX
                setTimeout(() => {
                    const found = findPotentialMatches(txn);
                    setMatches(found);
                    setLoading(false);
                }, 300);
            } else {
                setMatches([]);
            }
        }
    }, [selectedTxnId, transactions]);

    const handleConfirmMatch = (entry: any) => { // entry is JournalEntry
        if (!selectedTxnId) return;
        const result = confirmMatch(selectedTxnId, entry.id);
        if (result.success) {
            onMatchComplete(); // Recargar datos
            // La selección pasará automáticamente a la siguiente gracias al useEffect
        } else {
            alert(result.message);
        }
    };

    const handleUnmatch = (txnId: number) => {
        if (confirm('¿Deshacer esta conciliación?')) {
            unmatchTransaction(txnId);
            onMatchComplete();
        }
    };

    const selectedTxn = transactions.find(t => t.id === selectedTxnId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">

            {/* Columna Izquierda: Lista de Transacciones */}
            <div className="lg:col-span-1 border-r border-slate-800 pr-4 flex flex-col h-full">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-blue-400" />
                    Por Conciliar ({pendingTransactions.length})
                </h3>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {pendingTransactions.length === 0 && (
                        <div className="text-center p-8 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                            <Check className="w-8 h-8 mx-auto mb-2 text-green-500/50" />
                            <p>¡Todo conciliado!</p>
                        </div>
                    )}

                    {pendingTransactions.map(txn => (
                        <div
                            key={txn.id}
                            onClick={() => setSelectedTxnId(txn.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTxnId === txn.id
                                    ? 'bg-blue-600/20 border-blue-500/50 shadow-md'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs text-slate-400">{txn.transaction_date}</span>
                                <span className="font-mono font-bold text-white">${txn.amount.toFixed(2)}</span>
                            </div>
                            <p className="text-sm text-slate-300 truncate" title={txn.description}>{txn.description}</p>
                        </div>
                    ))}

                    {matchedTransactions.length > 0 && (
                        <div className="mt-8 pt-4 border-t border-slate-800">
                            <h4 className="text-sm font-semibold text-slate-500 mb-2">Conciliadas ({matchedTransactions.length})</h4>
                            {matchedTransactions.slice(0, 5).map(txn => (
                                <div key={txn.id} className="p-2 text-xs text-slate-500 flex justify-between group">
                                    <span className="truncate max-w-[150px]">{txn.description}</span>
                                    <div className="flex items-center gap-2">
                                        <span>${txn.amount.toFixed(2)}</span>
                                        <button onClick={() => handleUnmatch(txn.id)} className="text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300">
                                            <RefreshCw className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Columna Derecha: Área de Matching */}
            <div className="lg:col-span-2 pl-4 flex flex-col h-full">
                {selectedTxn ? (
                    <>
                        {/* Detalle de Transacción Seleccionada */}
                        <Card className="bg-slate-900 border-slate-800 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-blue-400 font-bold uppercase tracking-wider mb-1">Transacción Bancaria</p>
                                        <h2 className="text-2xl font-bold text-white mb-2">{selectedTxn.description}</h2>
                                        <div className="flex gap-4 text-sm text-slate-400">
                                            <span className="flex items-center gap-1"><Search className="w-3 h-3" /> Ref: {selectedTxn.reference_number || 'N/A'}</span>
                                            <span>Fecha: {selectedTxn.transaction_date}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-mono font-bold text-white">${selectedTxn.amount.toFixed(2)}</div>
                                        <Badge variant="outline" className="border-blue-500/30 text-blue-400 mt-2">Pendiente</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sugerencias de Coincidencia */}
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-blue-400' : 'text-purple-400'}`} />
                                Sugerencias de Conciliación
                            </h3>

                            {matches.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-slate-400">
                                    <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                                    <p>No se encontraron coincidencias automáticas.</p>
                                    <Button variant="link" className="text-blue-400 mt-2">Buscar manualmente (Próximamente)</Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {matches.map((match, idx) => (
                                        <Card key={idx} className="bg-slate-900 border-slate-700 hover:border-purple-500/50 transition-all group">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className={`
                                            ${match.confidence >= 0.9 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                                match.confidence >= 0.7 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                                    'bg-slate-700 text-slate-300'}
                                        `}>
                                                            {(match.confidence * 100).toFixed(0)}% Confianza
                                                        </Badge>
                                                        <span className="text-xs text-slate-500 uppercase font-bold">{match.matchType.replace('_', ' ')}</span>
                                                    </div>
                                                    <p className="text-white font-medium">{match.entry.description || 'Sin descripción'}</p>
                                                    <div className="flex gap-4 text-xs text-slate-400 mt-1">
                                                        <span>Fecha: {match.entry.entry_date}</span>
                                                        <span>Asiento #{match.entry.id}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1 italic">{match.reason}</p>
                                                </div>

                                                <div className="text-right pl-4 border-l border-slate-800 ml-4 flex flex-col items-end gap-2">
                                                    <span className="font-mono font-bold text-white text-lg">${match.entry.total_debit.toFixed(2)}</span>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleConfirmMatch(match.entry)}
                                                        className="bg-green-600 hover:bg-green-500 text-white"
                                                    >
                                                        <Check className="w-4 h-4 mr-1" /> Conciliar
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Scale className="w-16 h-16 mb-4 opacity-20" />
                        <p>Selecciona una transacción para comenzar a conciliar</p>
                    </div>
                )}
            </div>
        </div>
    );
};
