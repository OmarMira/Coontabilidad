import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { DR15Report } from '../../services/TaxReportingService';
import { DR15PDFDocument } from './pdf/DR15PDF';
import { XMLGeneratorService } from '../../services/XMLGeneratorService';
import { FileDown, FileCode } from 'lucide-react';

interface DR15TemplateProps {
    report: DR15Report;
}

export const DR15Template: React.FC<DR15TemplateProps> = ({ report }) => {
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
                    XML (E-File)
                </button>

                <PDFDownloadLink document={<DR15PDFDocument report={report} />} fileName={`DR15-${report.taxpayerInfo.period}.pdf`}>
                    {({ loading }) => (
                        <button className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow hover:bg-blue-700 transition-colors">
                            <FileDown size={14} />
                            {loading ? 'Generando...' : 'PDF Oficial'}
                        </button>
                    )}
                </PDFDownloadLink>
            </div>

            {/* Header */}
            <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-start mt-8">
                <div>
                    <img src="https://floridarevenue.com/PublishingImages/DOR_Logo_Color.png" alt="FL DOR" className="h-12 mb-2 opacity-80 grayscale" />
                    <h1 className="text-2xl font-black tracking-tight">FLORIDA DR-15</h1>
                    <h2 className="text-lg text-gray-600">Sales and Use Tax Return</h2>
                </div>
                <div className="text-right">
                    <div className="bg-gray-100 p-2 rounded border border-gray-300">
                        <p className="text-xs text-gray-500 uppercase">Collection Period</p>
                        <p className="font-bold text-lg">{report.taxpayerInfo.period}</p>
                    </div>
                </div>
            </div>

            {/* Taxpayer Info */}
            <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="border p-2">
                    <p className="text-xs text-gray-500">Certificate Number</p>
                    <p className="font-bold">{report.taxpayerInfo.fein}</p>
                </div>
                <div className="border p-2">
                    <p className="text-xs text-gray-500">Business Name</p>
                    <p className="font-bold">ACCOUNT EXPRESS DEMO INC.</p>
                </div>
            </div>

            {/* Main Data */}
            <div className="mb-6">
                <h3 className="font-bold bg-black text-white px-2 py-1 mb-2 uppercase">Summary of Tax Due</h3>

                <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-200">
                    <div className="col-span-8">1. Gross Sales</div>
                    <div className="col-span-4 text-right font-bold">{formatCurrency(report.totals.sales)}</div>
                </div>
                <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-200">
                    <div className="col-span-8">2. Exempt Sales</div>
                    <div className="col-span-4 text-right">0.00</div>
                </div>
                <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-200">
                    <div className="col-span-8">3. Taxable Sales</div>
                    <div className="col-span-4 text-right">{formatCurrency(report.totals.sales)}</div>
                </div>
                <div className="grid grid-cols-12 gap-2 items-center py-2 border-b border-gray-200 bg-gray-50">
                    <div className="col-span-8 font-bold">4. Total Tax Collected</div>
                    <div className="col-span-4 text-right font-bold">{formatCurrency(report.totals.tax)}</div>
                </div>
            </div>

            {/* County Details (Condensed) */}
            <div className="mb-6">
                <h3 className="font-bold bg-gray-200 px-2 py-1 mb-2 uppercase text-xs">Discretionary Sales Surtax Breakdown</h3>
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b-2 border-gray-400">
                            <th className="py-1">County</th>
                            <th className="py-1 text-right">Taxable Amount</th>
                            <th className="py-1 text-right">Surtax Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.countySummary.map(c => (
                            <tr key={c.code} className="border-b border-gray-100">
                                <td className="py-1">{c.code}</td>
                                <td className="py-1 text-right">{formatCurrency(c.sales)}</td>
                                <td className="py-1 text-right">{formatCurrency(c.tax)}</td>
                                {/* Note: c.tax is Total Tax. Surtax breakdown might require TaxService calculation separation. 
                                    For now showing Total Tax as per mockup structure. */ }
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Verification */}
            <div className="mt-auto pt-8 border-t-2 border-black text-xs text-gray-500">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="font-bold uppercase mb-1">Electronic Certification</p>
                        <p>I certify that this return has been examined by me and to the best of my knowledge and belief is a true, correct and complete return.</p>
                    </div>
                    <div className="text-right">
                        <div className="w-32 h-32 bg-white border border-gray-200 p-1 flex items-center justify-center">
                            {/* Placeholder for QR Code */}
                            <div className="w-full h-full bg-black"></div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 font-mono text-[10px] break-all bg-gray-50 p-2 border">
                    IRON-CORE-DIGITAL-SEAL: {report.verification.checksum}
                </div>
                <p className="mt-2 text-center font-bold text-gray-400">OFFICIAL USE ONLY - DO NOT MAIL</p>
            </div>
        </div>
    );
};
