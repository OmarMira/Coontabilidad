import { logger } from '../../core/logging/SystemLogger';
import React, { useState } from 'react';
import { payrollReportGenerator } from '../../services/payroll/PayrollReportGenerator';
import { getCompanyData } from '@/database/modules/db-company';
import { useLocale } from '@/i18n/useLocale';
import { FileText, Download, Zap, Shield, CheckCircle2, AlertCircle, Activity, Loader2 } from 'lucide-react';

export function PayrollReportsPanel() {
    const { t } = useLocale();
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState({ percent: 0, message: '' });
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, name: '' });

    const handleGenerateForm941 = async () => {
        setIsGenerating(true);
        setProgress({ percent: 0, message: 'Inicializando...' });

        try {
            const companyData = getCompanyData();
            const currentYear = new Date().getFullYear();
            const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

            const pdfBlob = await payrollReportGenerator.generateForm941PDF(
                currentQuarter,
                currentYear,
                companyData,
                {
                    onProgress: (percent, message) => {
                        setProgress({ percent, message });
                    }
                }
            );

            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Form_941_Q${currentQuarter}_${currentYear}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error: any) {
            logger.error('PayrollReportsPanel', 'error', 'Error generating Form 941:', error);
        } finally {
            setIsGenerating(false);
            setProgress({ percent: 0, message: '' });
        }
    };

    const handleGenerateAllW2s = async () => {
        setIsGenerating(true);
        setBatchProgress({ current: 0, total: 0, name: '' });

        try {
            const companyData = getCompanyData();
            const currentYear = new Date().getFullYear() - 1;

            const pdfs = await payrollReportGenerator.generateAllW2PDFs(
                currentYear,
                companyData,
                (current, total, employeeName) => {
                    setBatchProgress({ current, total, name: employeeName });
                }
            );

            if (pdfs.length > 0) {
                const url = URL.createObjectURL(pdfs[0]);
                const link = document.createElement('a');
                link.href = url;
                link.download = `W2_Sample_${currentYear}.pdf`;
                link.click();
                URL.revokeObjectURL(url);
            }
        } catch (error: any) {
            logger.error('PayrollReportsPanel', 'error', 'Error generating W2s:', error);
        } finally {
            setIsGenerating(false);
            setBatchProgress({ current: 0, total: 0, name: '' });
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-600/10 rounded-2.5xl border border-blue-500/20 shadow-lg group">
                        <FileText className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('payroll.reportsPanel.title')}</h2>
                        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2 flex items-center gap-3">
                            <Shield className="w-3.5 h-3.5 text-blue-500" /> {t('payroll.reportsPanel.complianceMonitor')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative group p-10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none"></div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{t('payroll.reportsPanel.irsForms')}</h3>
                                <p className="text-slate-500 text-[11px] font-black uppercase tracking-tight">{t('payroll.reportsPanel.subtitle')}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={handleGenerateForm941}
                                    disabled={isGenerating}
                                    className="flex flex-col items-start p-8 bg-slate-950 border border-slate-800 rounded-[2rem] hover:border-emerald-500/50 transition-all group/btn relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/btn:opacity-10 transition-opacity">
                                        <FileText className="w-16 h-16 text-emerald-500" />
                                    </div>
                                    <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">{t('payroll.form941')}</h4>
                                    <p className="text-[10px] text-slate-500 font-black uppercase leading-tight mb-6 text-left">{t('payroll.reportsPanel.generateForm941')}</p>
                                    <div className="flex items-center gap-2 mt-auto text-emerald-400 font-black uppercase text-[10px] tracking-widest group-hover/btn:translate-x-1 transition-transform">
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                        {t('payroll.reportsPanel.execute')}
                                    </div>
                                </button>

                                <button
                                    onClick={handleGenerateAllW2s}
                                    disabled={isGenerating}
                                    className="flex flex-col items-start p-8 bg-slate-950 border border-slate-800 rounded-[2rem] hover:border-blue-500/50 transition-all group/btn relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/btn:opacity-10 transition-opacity">
                                        <Users className="w-16 h-16 text-blue-500" />
                                    </div>
                                    <h4 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-2">{t('payroll.formW2')}</h4>
                                    <p className="text-[10px] text-slate-500 font-black uppercase leading-tight mb-6 text-left">{t('payroll.reportsPanel.generateAllW2s')}</p>
                                    <div className="flex items-center gap-2 mt-auto text-blue-400 font-black uppercase text-[10px] tracking-widest group-hover/btn:translate-x-1 transition-transform">
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                        {t('payroll.reportsPanel.execute')}
                                    </div>
                                </button>
                            </div>

                            {/* Generation Progress Feed */}
                            {isGenerating && (
                                <div className="p-8 bg-slate-950 border border-slate-800 rounded-[2.5rem] space-y-6 animate-in slide-in-from-top-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {batchProgress.total > 0
                                                    ? `${t('payroll.reportsPanel.processingBatch')} ${batchProgress.current}/${batchProgress.total}`
                                                    : progress.message}
                                            </span>
                                        </div>
                                        <span className="text-xl font-black text-white tabular-nums">
                                            {batchProgress.total > 0
                                                ? Math.round((batchProgress.current / batchProgress.total) * 100)
                                                : progress.percent}%
                                        </span>
                                    </div>

                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                            style={{ width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : progress.percent}%` }}
                                        ></div>
                                    </div>

                                    {batchProgress.name && (
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">
                                            {t('payroll.reportsPanel.generatingW2For')}: <span className="text-white">{batchProgress.name}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Protocol Cards */}
                <div className="space-y-10">
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                            <Activity className="w-3 h-3 text-emerald-500" /> {t('payroll.reportsPanel.benefitsTitle')}
                        </h3>

                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((idx) => (
                                <div key={idx} className="flex gap-4 items-start group/item">
                                    <div className="mt-1">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover/item:scale-110 transition-transform" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tight group-hover/item:text-white transition-colors">
                                        {t(`payroll.reportsPanel.benefit${idx}`)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-emerald-600 border border-emerald-500 rounded-[3rem] p-8 shadow-2xl shadow-emerald-950/40 relative overflow-hidden group">
                        <Shield className="w-10 h-10 text-white mb-6 group-hover:scale-110 transition-transform duration-500" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{t('payroll.reportsPanel.secureTitle')}</h3>
                        <p className="text-emerald-100/70 text-[9px] font-black uppercase tracking-widest leading-relaxed">
                            {t('payroll.reportsPanel.secureDesc')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Support components (Icons)
const Users = ({ className }: any) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);
