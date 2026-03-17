import React, { useState } from 'react';
import { FileDown, FileText, Table as TableIcon, Share2, Printer, CheckCircle, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getCompanyData } from '@/database/modules/db-company';
import { getCompanyLogoUrl } from '../../utils/logoUtils';
import { logger } from '../../core/logging/SystemLogger';
import { useLocale } from '../../i18n/useLocale';

// Extend jsPDF with autotable types
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

interface ExportHeader {
    title: string;
    subtitle?: string;
    dateRange?: string;
    entityName?: string;
}

interface ExportData {
    headers: string[];
    rows: any[][];
    fileName: string;
    footer?: string[];
}

interface ReportExporterProps {
    data: ExportData;
    header: ExportHeader;
    variant?: 'minimal' | 'full';
}

export const ReportExporter: React.FC<ReportExporterProps> = ({ data, header, variant = 'full' }) => {
    const { t } = useLocale();
    const [exporting, setExporting] = useState<string | null>(null);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const showStatus = (type: 'success' | 'error', msg: string) => {
        setStatus({ type, msg });
        setTimeout(() => setStatus(null), 3000);
    };

    const exportToPDF = async () => {
        try {
            setExporting('pdf');
            const doc = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const company = getCompanyData();
            const logoUrl = getCompanyLogoUrl();

            // Header background
            doc.setFillColor(3, 7, 18); // deep-bg
            doc.rect(0, 0, 210, 40, 'F');

            // Logo or Name
            if (logoUrl) {
                try {
                    doc.addImage(logoUrl, 'PNG', 15, 10, 30, 20);
                } catch (e) {
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(18);
                    doc.text(company?.company_name || 'AccountExpress', 15, 22);
                }
            } else {
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(18);
                doc.text(company?.company_name || 'AccountExpress', 15, 22);
            }

            // Title and Subtitle
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.text(header.title, 195, 20, { align: 'right' });

            doc.setFontSize(10);
            doc.setTextColor(156, 163, 175); // text-muted
            doc.text(header.subtitle || company?.legal_name || '', 195, 26, { align: 'right' });
            doc.text(header.dateRange || `${t('common.date')}: ${new Date().toLocaleDateString()}`, 195, 32, { align: 'right' });

            // Body Table
            doc.autoTable({
                startY: 45,
                head: [data.headers],
                body: data.rows,
                theme: 'striped',
                headStyles: {
                    fillColor: [16, 185, 129], // emerald-primary
                    textColor: [255, 255, 255],
                    fontSize: 10,
                    fontStyle: 'bold',
                    halign: 'left'
                },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                styles: { fontSize: 9, cellPadding: 3 },
                margin: { left: 15, right: 15 },
                didDrawPage: (dataArg: any) => {
                    // Footer on each page
                    doc.setFontSize(8);
                    doc.setTextColor(156, 163, 175);
                    doc.text(
                        `${t('common.page') || 'Page'} ${dataArg.pageNumber} - AccountExpress Florida Compliance`,
                        105,
                        290,
                        { align: 'center' }
                    );
                }
            });

            doc.save(`${data.fileName}.pdf`);
            showStatus('success', t('reportsDashboard.common.pdfSuccess') || 'PDF generated successfully');
            logger.info('ReportExporter', 'pdf_success', `Exportado PDF: ${data.fileName}`);
        } catch (error) {
            console.error(error);
            showStatus('error', t('reportsDashboard.common.pdfError') || 'Error generating PDF');
            logger.error('ReportExporter', 'pdf_error', 'Fallo exportación PDF', null, error as Error);
        } finally {
            setExporting(null);
        }
    };

    const exportToExcel = () => {
        try {
            setExporting('excel');
            const ws = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
            XLSX.writeFile(wb, `${data.fileName}.xlsx`);
            showStatus('success', t('reportsDashboard.common.excelSuccess') || 'Excel generated successfully');
            logger.info('ReportExporter', 'excel_success', `Exportado Excel: ${data.fileName}`);
        } catch (error) {
            showStatus('error', t('reportsDashboard.common.excelError') || 'Error generating Excel');
            logger.error('ReportExporter', 'excel_error', 'Fallo exportación Excel', null, error as Error);
        } finally {
            setExporting(null);
        }
    };

    if (variant === 'minimal') {
        return (
            <div className="flex gap-2">
                <button onClick={exportToPDF} title="PDF" className="p-2 hover:bg-white/10 rounded-lg text-rose-400">
                    <FileText className={`w-5 h-5 ${exporting === 'pdf' ? 'animate-pulse' : ''}`} />
                </button>
                <button onClick={exportToExcel} title="Excel" className="p-2 hover:bg-white/10 rounded-lg text-emerald-400">
                    <TableIcon className={`w-5 h-5 ${exporting === 'excel' ? 'animate-pulse' : ''}`} />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={exportToPDF}
                    disabled={!!exporting}
                    className="btn-elite-secondary !py-2 !px-4 flex items-center gap-2 text-sm"
                >
                    <FileText className={`w-4 h-4 text-rose-400 ${exporting === 'pdf' ? 'animate-spin' : ''}`} />
                    {t('common.export')} PDF
                </button>

                <button
                    onClick={exportToExcel}
                    disabled={!!exporting}
                    className="btn-elite-secondary !py-2 !px-4 flex items-center gap-2 text-sm"
                >
                    <TableIcon className={`w-4 h-4 text-emerald-400 ${exporting === 'excel' ? 'animate-spin' : ''}`} />
                    {t('common.export')} Excel
                </button>

                <button
                    onClick={() => window.print()}
                    className="btn-elite-secondary !py-2 !px-4 flex items-center gap-2 text-sm"
                >
                    <Printer className="w-4 h-4 text-blue-400" />
                    {t('common.print') || 'Print'}
                </button>
            </div>

            {status && (
                <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest animate-fade-in ${status.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {status.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {status.msg}
                </div>
            )}
        </div>
    );
};
