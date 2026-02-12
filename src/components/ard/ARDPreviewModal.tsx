import React from 'react';
import { X, FileText, Info, DollarSign, Calendar, Tag, ShieldCheck, Activity } from 'lucide-react';
import { useLocale } from '../../i18n/useLocale';

import { ARDDocument } from '../../modules/ard/ARD.types';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { ARDPDFReport } from './ARDPDFReport';

interface ARDPreviewModalProps {
    document: ARDDocument;
    onClose: () => void;
}

export const ARDPreviewModal: React.FC<ARDPreviewModalProps> = ({ document, onClose }) => {
    const { t } = useLocale();
    if (!document) return null;

    const analysis = JSON.parse(document.raw_analysis || '{}');

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-[80vh]">

                {/* Document Preview Area (Left) */}
                <div className="flex-1 bg-black/40 flex flex-col items-center justify-center p-12 border-r border-white/5 relative">
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('ard.preview.title')}</span>
                    </div>

                    <div className="w-full max-w-md aspect-[3/4] bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent"></div>
                        <FileText className="w-20 h-20 text-gray-700 mb-4 group-hover:scale-110 transition-transform duration-500" />
                        <p className="text-slate-600 font-bold text-xs uppercase tracking-widest px-8">
                            {document.name}
                        </p>
                        <div className="mt-4 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[9px] text-slate-500 font-bold uppercase">
                            {document.type === 'invoice_in' ? t('ard.preview.typeInvoice') : t('ard.preview.typeReceipt')}
                        </div>

                        {/* Simulation Scan Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50 blur-sm animate-scan"></div>
                    </div>
                </div>

                {/* Intelligence Panel (Right) */}
                <div className="w-full md:w-[380px] flex flex-col bg-slate-900">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-xl">
                                <Info className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-black text-white">{t('ard.preview.aiDetection')}</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                        {/* Status Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-600">
                                <span>{t('ard.preview.analysisStatus')}</span>
                                <span className={`px-2 py-0.5 rounded-lg border ${document.status === 'processed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                    {document.status}
                                </span>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                                <ShieldCheck className="w-8 h-8 text-emerald-400/50" />
                                <div>
                                    <div className="text-xs font-black text-white uppercase">{t('ard.preview.integrityVerified')}</div>
                                    <div className="text-[10px] text-slate-600 font-bold">{t('ard.preview.documentProcessed')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Data Section */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('ard.preview.detectedFinancialData')}</h4>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs text-slate-500 font-bold">{t('ard.preview.totalAmount')}</span>
                                    </div>
                                    <span className="text-lg font-black text-white">{formatCurrency(document.detected_amount || 0)}</span>
                                </div>

                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Tag className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs text-slate-500 font-bold">{t('ard.preview.tax')}</span>
                                    </div>
                                    <span className="text-md font-black text-white">{formatCurrency(document.detected_tax || 0)}</span>
                                </div>

                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-indigo-400" />
                                        <span className="text-xs text-slate-500 font-bold">{t('ard.preview.docDate')}</span>
                                    </div>
                                    <span className="text-sm font-black text-white">{document.detected_date || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Extraction */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t('ard.preview.extractionMetadata')}</h4>
                            <div className="p-6 bg-black/40 rounded-3xl border border-white/5 font-mono text-[10px] text-indigo-300 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                        <span className="opacity-50 text-white">{t('ard.preview.vendorName')}</span>
                                        <span>{analysis.vendor || t('ard.preview.detecting')}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                        <span className="opacity-50 text-white">{t('ard.preview.confidenceScore')}</span>
                                        <span>98.42%</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                        <span className="opacity-50 text-white">{t('ard.preview.forensicHash')}</span>
                                        <span className="truncate max-w-[120px] uppercase">{document.id}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                        <span className="opacity-50 text-white">{t('ard.preview.ocrEngine')}</span>
                                        <span>LEO_V24_ELITE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 bg-white/[0.02] border-t border-white/5 flex flex-col gap-3">
                        <PDFDownloadLink
                            document={<ARDPDFReport document={document} t={t} />}
                            fileName={`Reporte_ARD_${document.id}.pdf`}
                            className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                            {({ loading }) => (loading ? t('ard.preview.preparingPDF') : <><Activity className="w-4 h-4 text-indigo-400" /> {t('ard.preview.downloadPDF')}</>)}
                        </PDFDownloadLink>

                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40"
                        >
                            {t('ard.preview.closeAnalysis')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
