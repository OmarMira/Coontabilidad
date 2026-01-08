import React, { useEffect, useState } from 'react';
import { TaxReportingService, DR15Report } from '../../services/TaxReportingService';
import { DR15Template } from './DR15Template';
import { CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface HistoryItem {
    month: number;
    year: number;
    label: string;
    status: 'filed' | 'no_activity' | 'error' | 'pending';
    amount?: number;
}

export const ComplianceHistory: React.FC = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<DR15Report | null>(null);
    const [configAlert, setConfigAlert] = useState<string | null>(null);

    const viewReport = async (item: HistoryItem) => {
        if (item.status !== 'filed') return;
        setLoading(true);
        const report = await TaxReportingService.generateDR15Report(item.month, item.year);
        setSelectedReport(report);
        setLoading(false);
    };

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const configStatus = await TaxReportingService.hasValidConfiguration();

                if (!configStatus.valid) {
                    const errors = [];
                    if (configStatus.missingCounties.length > 0) errors.push(...configStatus.missingCounties);
                    if (configStatus.outdatedRates) errors.push('Tasas de impuesto desactualizadas (Base != 6%)');
                    setConfigAlert(`AVISO CRÍTICO: Configuración Fiscal Incompleta. ${errors.join('. ')}`);
                }

                const months = [];
                const today = new Date();
                // Last 6 months (including current)
                for (let i = 0; i < 6; i++) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    months.push({
                        month: d.getMonth() + 1,
                        year: d.getFullYear(),
                        label: d.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
                    });
                }

                const data = await Promise.all(months.map(async (m) => {
                    try {
                        const report = await TaxReportingService.generateDR15Report(m.month, m.year);
                        const hasData = report.totals.sales > 0;

                        let status: HistoryItem['status'] = 'no_activity';
                        if (hasData) {
                            status = 'filed';
                        } else if (configStatus.valid) {
                            status = 'pending';
                        }

                        return {
                            ...m,
                            status,
                            amount: report.totals.tax
                        } as HistoryItem;
                    } catch (e) {
                        return { ...m, status: 'error' } as HistoryItem;
                    }
                }));
                setHistory(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, []);

    if (loading) return <div className="p-4 text-center text-gray-500 animate-pulse">Cargando historial forense...</div>;

    return (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold mb-4 font-mono uppercase text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-slate-500" />
                Historial de Cumplimiento
            </h2>
            {configAlert && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2 rounded mb-3 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle size={14} className="shrink-0" />
                    {configAlert}
                </div>
            )}
            <div className="space-y-1">
                {history.map((item, idx) => (
                    <div key={idx}
                        onClick={() => viewReport(item)}
                        className={`flex justify-between items-center p-3 border-b border-slate-100 rounded transition-colors ${item.status === 'filed' ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    >
                        <span className="capitalize text-slate-700 font-medium">{item.label}</span>
                        <div className="flex items-center gap-3">
                            {item.status === 'filed' ? (
                                <>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold tracking-wider flex items-center gap-1">
                                        <FileText size={10} />
                                        GENERADO
                                    </span>
                                    <span className="font-mono font-bold text-slate-900">${((item.amount || 0) / 100).toFixed(2)}</span>
                                </>
                            ) : item.status === 'pending' ? (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold tracking-wider flex items-center gap-1">
                                    <AlertCircle size={10} />
                                    PENDIENTE
                                </span>
                            ) : (
                                <span className="text-xs text-slate-400 italic">Sin actividad registrada</span>
                            )}
                        </div>
                    </div>
                ))}
                {history.length === 0 && <div className="text-center p-4 text-slate-400">No hay historial disponible</div>}
            </div>
            <div className="mt-4 text-xs text-slate-400 text-right">
                Verificado por Iron Core v3.0
            </div>

            {selectedReport && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl max-h-screen overflow-y-auto relative w-auto">
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedReport(null); }}
                            className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-2 z-50 hover:bg-red-700 font-bold text-xs"
                        >
                            CERRAR VISTA
                        </button>
                        <div onClick={(e) => e.stopPropagation()}>
                            <DR15Template report={selectedReport} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
