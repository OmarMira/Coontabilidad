import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { DR15Report } from '../../services/TaxReportingService';
import { DR15PDFDocument } from './pdf/DR15PDF';
import { XMLGeneratorService } from '../../services/XMLGeneratorService';
import { FileDown, FileCode } from 'lucide-react';
import { useLocale } from '../../i18n/useLocale';

interface DR15TemplateProps {
    report: DR15Report;
}

export const DR15Template: React.FC<DR15TemplateProps> = ({ report }) => {
    const { t } = useLocale();
    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
    };

    return (
        <div className="relative p-8 bg-white text-black font-mono text-sm max-w-[210mm] mx-auto border border-gray-300 shadow-lg min-h-[297mm]">

            {/* Download Buttons (Visible in UI, Hidden in Print) */}
            <div className="absolute top-0 right-0 p-4 print:hidden flex gap-2">
                <button
                    onClick={() => {
                        const xml = XMLGeneratorService.generateDR15XML(report);
                        const blob = new Blob([xml], { type: 'application/xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `DR15-${report.taxpayerInfo.period}.xml`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold shadow hover:bg-slate-700 transition-colors"
                >
                    <FileCode size={14} />
                    {t('reportsDashboard.dr15.xmlButton')}
                </button>

                <PDFDownloadLink document={<DR15PDFDocument report={report} />} fileName={`DR15-${report.taxpayerInfo.period}.pdf`}>
                    {({ loading }) => (
                        <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow hover:bg-blue-700 transition-colors">
                            <FileDown size={14} />
                            {loading ? t('reportsDashboard.dr15.generating') : t('reportsDashboard.dr15.pdfButton')}
                        </button>
                    )}
                </PDFDownloadLink>
            </div>

            {/* Header */}
            <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-start mt-8">
                <div>
                    <img src="https://floridarevenue.com/PublishingImages/DOR_Logo_Color.png" alt="FL DOR" className="h-12 mb-2 opacity-80 grayscale" />
                    <h1 className="text-2xl font-black tracking-tight">{t('reportsDashboard.dr15.title')}</h1>
                    <h2 className="text-lg text-slate-700">{t('reportsDashboard.dr15.subtitle')}</h2>
                </div>
                <div className="text-right">
                    <div className="bg-gray-100 p-2 rounded border border-gray-300">
                        <p className="text-xs text-slate-600 uppercase">{t('reportsDashboard.dr15.collectionPeriod')}</p>
                        <p className="font-bold text-lg">{report.taxpayerInfo.period}</p>
                    </div>
                </div>
            </div>

            {/* Taxpayer Info */}
            <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="border p-2">
                    <p className="text-xs text-slate-600">{t('reportsDashboard.dr15.certificateNumber')}</p>
                    <p className="font-bold">{report.taxpayerInfo.fein}</p>
                </div>
                <div className="border p-2">
                    <p className="text-xs text-slate-600">{t('reportsDashboard.dr15.businessName')}</p>
                    <p className="font-bold">ACCOUNT EXPRESS DEMO INC.</p>
                </div>
            </div>

            {/* Main Data */}
            <div className="mb-6">
                <h3 className="font-bold bg-black text-white px-2 py-1 mb-2 uppercase">{t('reportsDashboard.dr15.summaryTitle')}</h3>

                <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-200">
                    <div className="col-span-8">{t('reportsDashboard.dr15.grossSales')}</div>
                    <div className="col-span-4 text-right font-bold">{formatCurrency(report.totals.sales)}</div>
                </div>
                <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-200">
                    <div className="col-span-8">{t('reportsDashboard.dr15.exemptSales')}</div>
                    <div className="col-span-4 text-right">0.00</div>
                </div>
                <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-200">
                    <div className="col-span-8">{t('reportsDashboard.dr15.taxableSales')}</div>
                    <div className="col-span-4 text-right">{formatCurrency(report.totals.sales)}</div>
                </div>
                <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-200 bg-gray-50">
                    <div className="col-span-8 font-bold">{t('reportsDashboard.dr15.totalTaxCollected')}</div>
                    <div className="col-span-4 text-right font-bold">{formatCurrency(report.totals.tax)}</div>
                </div>
            </div>

            {/* County Details (Condensed) */}
            <div className="mb-6">
                <h3 className="font-bold bg-gray-200 px-2 py-1 mb-2 uppercase text-xs">{t('reportsDashboard.dr15.surchargeBreakdown')}</h3>
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b-2 border-gray-400">
                            <th className="py-1">{t('reportsDashboard.dr15.county')}</th>
                            <th className="py-1 text-right">{t('reportsDashboard.dr15.taxableAmount')}</th>
                            <th className="py-1 text-right">{t('reportsDashboard.dr15.surchargeDue')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.countySummary.map(c => (
                            <tr key={c.code} className="border-b border-gray-100">
                                <td className="py-1">{c.code}</td>
                                <td className="py-1 text-right">{formatCurrency(c.sales)}</td>
                                <td className="py-1 text-right">{formatCurrency(c.tax)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Verification */}
            <div className="mt-auto pt-8 border-t-2 border-black text-xs text-slate-600">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="font-bold uppercase mb-1">{t('reportsDashboard.dr15.certificationTitle')}</p>
                        <p>{t('reportsDashboard.dr15.certificationText')}</p>
                    </div>
                    <div className="text-right">
                        <div className="w-32 h-32 bg-white border border-gray-200 p-1 flex items-center justify-center">
                            {/* Placeholder for QR Code */}
                            <div className="w-full h-full bg-black"></div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 font-mono text-[10px] break-all bg-gray-50 p-2 border">
                    {t('reportsDashboard.dr15.digitalSeal')}: {report.verification.checksum}
                </div>
                <p className="mt-2 text-center font-bold text-slate-500">{t('reportsDashboard.dr15.officialUseOnly')}</p>
            </div>
        </div>
    );
};
