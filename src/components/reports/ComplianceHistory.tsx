import { logger } from '../../core/logging/SystemLogger';
import React, { useEffect, useState } from 'react';
// MÃ³dulo DR15 eliminado en Sprint 4
// import { TaxReportingService, DR15Report } from '../../services/TaxReportingService';
// import { DR15Template } from './DR15Template';
const TaxReportingService: any = (window as any).TaxReportingService; // Fallback para evitar errores inmediatos si se requiere dinÃ¡micamente
import { CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { useLocale } from '../../i18n/useLocale';

interface HistoryItem {
    month: number;
    year: number;
    label: string;
    status: 'filed' | 'no_activity' | 'error' | 'pending' | 'loading';
    amount?: number;
}

export const ComplianceHistory: React.FC = () => {
    const { t, language } = useLocale();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [configAlert, setConfigAlert] = useState<string | null>(null);

    const viewReport = async (item: HistoryItem) => {
        if (item.status !== 'filed') return;
        const report = await TaxReportingService.generateDR15Report(item.month, item.year);
        setSelectedReport(report);
    };

    useEffect(() => {
        let isMounted = true;

        const loadHistory = async () => {
            if (!TaxReportingService) {
                setInitialLoading(false);
                return;
            }
            try {
                const configStatus = await TaxReportingService.hasValidConfiguration();

                if (!configStatus.valid && isMounted) {
                    const errors: string[] = [];
                    if (configStatus.missingCounties.length > 0) errors.push(...configStatus.missingCounties);
                    if (configStatus.outdatedRates) errors.push(t('reportsdashboard.compliance.outdatedrates'));
                    setConfigAlert(`${t('reportsdashboard.compliance.criticalnotice')} ${errors.join('. ')}`);
                }

                // Initial labels setup
                const months: HistoryItem[] = [];
                const today = new Date();
                for (let i = 0; i < 6; i++) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    months.push({
                        month: d.getMonth() + 1,
                        year: d.getFullYear(),
                        label: d.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' }),
                        status: 'loading'
                    });
                }

                if (isMounted) {
                    setHistory(months);
                }

                // Sequential Loading to prevent UI Lock
                for (let i = 0; i < months.length; i++) {
                    if (!isMounted) break;

                    const m = months[i];
                    try {
                        // Small yield to UI thread
                        await new Promise(resolve => setTimeout(resolve, 30));

                        const report = await TaxReportingService.generateDR15Report(m.month, m.year);
                        const hasData = report.totals.sales > 0;

                        let status: HistoryItem['status'] = 'no_activity';
                        if (hasData) {
                            status = 'filed';
                        } else if (configStatus.valid) {
                            status = 'pending';
                        }

                        if (isMounted) {
                            setHistory(prev => {
                                const newHistory = [...prev];
                                newHistory[i] = { ...m, status, amount: report.totals.tax };
                                return newHistory;
                            });
                        }
                    } catch (e) {
                        logger.error('ComplianceHistory', 'error', `Error loading month ${m.month}/${m.year}:`, e);
                        if (isMounted) {
                            setHistory(prev => {
                                const newHistory = [...prev];
                                newHistory[i] = { ...m, status: 'error' };
                                return newHistory;
                            });
                        }
                    }
                }
            } catch (e) {
                logger.error('ComplianceHistory', 'error', 'operation_failed', "Compliance History Critical Load Error:", e);
                if (isMounted) {
                    setConfigAlert(`${t('reportsdashboard.compliance.error')}: ${e instanceof Error ? e.message : 'Unknown error'}`);
                }
            } finally {
                if (isMounted) {
                    setInitialLoading(false);
                }
            }
        };

        loadHistory();
        return () => { isMounted = false; };
    }, [t, language]);

    if (initialLoading) return (
        <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-8 h-full flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t('reportsdashboard.compliance.loading')}
            </div>
        </div>
    );

    return (
        <div className="bg-slate-900/40 rounded-3xl border border-white/5 p-8 h-full flex flex-col">
            <h2 className="text-[10px] font-black mb-8 uppercase tracking-[0.3em] text-emerald-500/80 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4" />
                {t('reportsdashboard.compliance.title')}
            </h2>
            {configAlert && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl mb-6 text-[10px] flex items-center gap-3 font-bold uppercase tracking-wider">
                    <AlertCircle size={16} className="shrink-0" />
                    {configAlert}
                </div>
            )}
            <div className="space-y-2 flex-grow overflow-y-auto pr-2 scrollbar-hide">
                {history.map((item, idx) => (
                    <div key={idx}
                        onClick={() => viewReport(item)}
                        className={`flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl transition-all duration-300 ${item.status === 'filed' ? 'cursor-pointer hover:bg-white/10 hover:translate-x-1 hover:border-emerald-500/30 shadow-lg' : item.status === 'loading' ? 'opacity-40' : 'opacity-60'}`}
                    >
                        <span className="capitalize text-gray-300 text-sm font-bold">{item.label}</span>
                        <div className="flex items-center gap-4">
                            {item.status === 'loading' ? (
                                <Loader2 className="w-4 h-4 text-emerald-500/50 animate-spin" />
                            ) : item.status === 'filed' ? (
                                <>
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20">
                                        <FileText size={10} />
                                        {t('reportsdashboard.compliance.statusgenerated')}
                                    </span>
                                    <span className="font-mono font-black text-white text-base tracking-tighter">${((item.amount || 0) / 100).toFixed(2)}</span>
                                </>
                            ) : item.status === 'pending' ? (
                                <span className="text-[9px] bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-2 border border-amber-500/20">
                                    <AlertCircle size={10} />
                                    {t('reportsdashboard.compliance.statuspending')}
                                </span>
                            ) : (
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('reportsdashboard.compliance.noactivity')}</span>
                            )}
                        </div>
                    </div>
                ))}
                {history.length === 0 && <div className="text-center p-12 text-slate-600 font-black uppercase text-[10px] tracking-[0.2em]">{t('reportsdashboard.compliance.nohistory')}</div>}
            </div>
            <div className="mt-8 text-[9px] text-slate-700 font-black uppercase tracking-[0.4em] text-right flex items-center justify-end gap-2">
                <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                {t('reportsdashboard.compliance.verifiedby')} Iron Core v3.0
            </div>

            {selectedReport && (
                <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-8 backdrop-blur-md">
                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-4xl max-h-[90vh] overflow-y-auto relative w-full max-w-4xl scrollbar-hide">
                        <div className="sticky top-0 right-0 p-6 flex justify-end z-50 bg-slate-900/80 backdrop-blur-sm rounded-t-[3rem]">
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedReport(null); }}
                                className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-6 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-rose-500/30"
                            >
                                {t('reportsdashboard.compliance.closeview')}
                            </button>
                        </div>
                        <div className="p-10 pt-0" onClick={(e) => e.stopPropagation()}>
                            {/* DR15Template eliminado */}
                            <div className="text-white p-4">Reporte no disponible (MÃ³dulo DR-15 eliminado)</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
