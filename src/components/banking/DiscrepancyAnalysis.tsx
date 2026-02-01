import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Search,
    Filter,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    BarChart3
} from 'lucide-react';
import {
    getBankAccounts,
    getReconciliationStatements,
    getUnreconciledTransactions,
    BankAccount,
    ReconciliationStatement,
    BankTransaction
} from '../../database/simple-db';
import { WorkerOrchestrator } from '../../core/workers/WorkerOrchestrator';
import { ReconciliationTask, ReconciliationResult, Discrepancy } from '../../workers/reconciliation.worker';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

export const DiscrepancyAnalysis: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
    const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
    const [unreconciledTransactions, setUnreconciledTransactions] = useState<BankTransaction[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResults, setAnalysisResults] = useState<ReconciliationResult | null>(null);

    const [workerOrchestrator] = useState(() => new WorkerOrchestrator());

    const loadData = () => {
        setAccounts(getBankAccounts());
        if (selectedAccount) {
            setUnreconciledTransactions(getUnreconciledTransactions(selectedAccount.id));
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedAccount]);

    const handleAnalyzeDiscrepancies = async () => {
        if (!selectedAccount || unreconciledTransactions.length === 0) return;

        setIsAnalyzing(true);
        try {
            const task: ReconciliationTask = {
                type: 'DISCREPANCY_DETECTION',
                statementId: 0, // No necesario para análisis de discrepancias
                transactions: unreconciledTransactions
            };

            const result = await workerOrchestrator.executeTask<ReconciliationResult>('RECONCILIATION', task);
            
            setAnalysisResults(result);
            setDiscrepancies(result.discrepancies || []);
        } catch (error) {
            console.error('Error analyzing discrepancies:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high': return <XCircle className="w-4 h-4" />;
            case 'medium': return <AlertTriangle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'amount_mismatch': return <TrendingUp className="w-4 h-4" />;
            case 'date_mismatch': return <Clock className="w-4 h-4" />;
            case 'duplicate_entry': return <AlertTriangle className="w-4 h-4" />;
            default: return <Search className="w-4 h-4" />;
        }
    };

    // Análisis estadístico de transacciones
    const getTransactionStats = () => {
        if (unreconciledTransactions.length === 0) return null;

        const amounts = unreconciledTransactions.map(t => Math.abs(t.amount));
        const total = amounts.reduce((sum, amt) => sum + amt, 0);
        const avg = total / amounts.length;
        const max = Math.max(...amounts);
        const min = Math.min(...amounts);

        // Agrupar por tipo (positivo/negativo)
        const credits = unreconciledTransactions.filter(t => t.amount > 0);
        const debits = unreconciledTransactions.filter(t => t.amount < 0);

        return {
            total: unreconciledTransactions.length,
            totalAmount: total,
            avgAmount: avg,
            maxAmount: max,
            minAmount: min,
            credits: credits.length,
            debits: debits.length,
            creditsAmount: credits.reduce((sum, t) => sum + t.amount, 0),
            debitsAmount: Math.abs(debits.reduce((sum, t) => sum + t.amount, 0))
        };
    };

    const stats = getTransactionStats();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                        <BarChart3 className="w-8 h-8 text-rose-500" />
                        Análisis de Discrepancias
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Detección Inteligente de Anomalías</p>
                </div>

                {selectedAccount && (
                    <Button
                        onClick={handleAnalyzeDiscrepancies}
                        disabled={isAnalyzing || unreconciledTransactions.length === 0}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                    >
                        <Search className="w-4 h-4 mr-2" />
                        {isAnalyzing ? 'Analizando...' : 'Analizar Discrepancias'}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Panel de Cuentas */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="border-b border-slate-800">
                        <CardTitle className="text-white text-lg font-bold">Cuentas Bancarias</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-1 p-4">
                            {accounts.map(account => (
                                <button
                                    key={account.id}
                                    onClick={() => setSelectedAccount(account)}
                                    className={`w-full text-left p-3 rounded-xl transition-all ${
                                        selectedAccount?.id === account.id
                                            ? 'bg-rose-600 text-white'
                                            : 'hover:bg-slate-800 text-slate-300'
                                    }`}
                                >
                                    <div className="font-bold">{account.account_name}</div>
                                    <div className="text-xs opacity-70">{account.account_number}</div>
                                    <div className="text-xs font-mono">${account.balance.toLocaleString()}</div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Panel Principal */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedAccount ? (
                        <>
                            {/* Estadísticas de Transacciones */}
                            {stats && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                                    <BarChart3 className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full border border-blue-400/20 uppercase">
                                                    Total
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Transacciones</p>
                                            <h3 className="text-2xl font-black text-white tabular-nums">{stats.total}</h3>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2 bg-emerald-500/10 rounded-xl">
                                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20 uppercase">
                                                    Créditos
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Ingresos</p>
                                            <h3 className="text-2xl font-black text-white tabular-nums">${stats.creditsAmount.toLocaleString()}</h3>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2 bg-rose-500/10 rounded-xl">
                                                    <TrendingDown className="w-5 h-5 text-rose-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full border border-rose-400/20 uppercase">
                                                    Débitos
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Egresos</p>
                                            <h3 className="text-2xl font-black text-white tabular-nums">${stats.debitsAmount.toLocaleString()}</h3>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-slate-900 border-slate-800">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-2 bg-amber-500/10 rounded-xl">
                                                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20 uppercase">
                                                    Promedio
                                                </span>
                                            </div>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Por Transacción</p>
                                            <h3 className="text-2xl font-black text-white tabular-nums">${stats.avgAmount.toLocaleString()}</h3>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Resultados del Análisis */}
                            {analysisResults && (
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardHeader className="border-b border-slate-800">
                                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            Resultados del Análisis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                            <div className="text-center p-4 bg-slate-950 rounded-xl">
                                                <div className="text-2xl font-black text-emerald-400">{analysisResults.summary.highConfidenceMatches}</div>
                                                <div className="text-xs text-slate-500 uppercase">Alta Confianza</div>
                                            </div>
                                            <div className="text-center p-4 bg-slate-950 rounded-xl">
                                                <div className="text-2xl font-black text-blue-400">{analysisResults.summary.mediumConfidenceMatches}</div>
                                                <div className="text-xs text-slate-500 uppercase">Media Confianza</div>
                                            </div>
                                            <div className="text-center p-4 bg-slate-950 rounded-xl">
                                                <div className="text-2xl font-black text-amber-400">{analysisResults.summary.needsReview}</div>
                                                <div className="text-xs text-slate-500 uppercase">Requiere Revisión</div>
                                            </div>
                                            <div className="text-center p-4 bg-slate-950 rounded-xl">
                                                <div className="text-2xl font-black text-rose-400">{discrepancies.length}</div>
                                                <div className="text-xs text-slate-500 uppercase">Discrepancias</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Análisis completado en {analysisResults.summary.processingTime.toFixed(2)}ms
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Lista de Discrepancias */}
                            {discrepancies.length > 0 && (
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between">
                                        <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                                            Discrepancias Detectadas ({discrepancies.length})
                                        </CardTitle>
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                                            <Download className="w-4 h-4 mr-2" /> Exportar
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-950 text-slate-500 font-black uppercase tracking-widest text-[10px]">
                                                <tr>
                                                    <th className="px-6 py-4">Tipo</th>
                                                    <th className="px-6 py-4">Severidad</th>
                                                    <th className="px-6 py-4">Descripción</th>
                                                    <th className="px-6 py-4">Acción Sugerida</th>
                                                    <th className="px-6 py-4 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {discrepancies.map((discrepancy, index) => (
                                                    <tr key={index} className="hover:bg-white/[0.02]">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                {getTypeIcon(discrepancy.type)}
                                                                <span className="font-semibold text-white capitalize">
                                                                    {discrepancy.type.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border flex items-center gap-1 w-fit ${getSeverityColor(discrepancy.severity)}`}>
                                                                {getSeverityIcon(discrepancy.severity)}
                                                                {discrepancy.severity}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-300">{discrepancy.description}</td>
                                                        <td className="px-6 py-4 text-slate-400 text-xs">{discrepancy.suggestedAction}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex gap-2 justify-center">
                                                                <button className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors" title="Ver Detalles">
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors" title="Resolver">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Transacciones No Conciliadas */}
                            {unreconciledTransactions.length > 0 && !analysisResults && (
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardHeader className="border-b border-slate-800">
                                        <CardTitle className="text-white text-lg font-bold">
                                            Transacciones Pendientes de Análisis ({unreconciledTransactions.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 text-center">
                                        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4 opacity-50" />
                                        <h3 className="text-white font-bold mb-2">Listo para Análisis</h3>
                                        <p className="text-slate-500 text-sm mb-4">
                                            Hay {unreconciledTransactions.length} transacciones no conciliadas esperando análisis de discrepancias.
                                        </p>
                                        <Button
                                            onClick={handleAnalyzeDiscrepancies}
                                            disabled={isAnalyzing}
                                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                                        >
                                            <Search className="w-4 h-4 mr-2" />
                                            {isAnalyzing ? 'Analizando...' : 'Iniciar Análisis'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card className="bg-slate-900/20 border-slate-800 border-dashed">
                            <CardContent className="p-20 text-center">
                                <BarChart3 className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-20" />
                                <h3 className="text-slate-500 font-bold uppercase tracking-widest mb-2">Selecciona una Cuenta</h3>
                                <p className="text-slate-600 text-sm">Elige una cuenta bancaria para analizar discrepancias</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};