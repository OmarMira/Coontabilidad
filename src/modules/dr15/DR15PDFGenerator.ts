/**
 * GENERADOR PDF DR-15 BÁSICO
 * 
 * Genera un PDF simple con los datos esenciales del reporte DR-15
 * para cumplimiento mínimo de Florida DOR.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface DR15Data {
    period: string;
    year: number;
    month: number;
    grossSales: number;
    exemptSales: number;
    taxableSales: number;
    taxCollected: number;
    surtaxCollected: number;
    totalTaxDue: number;
    countyBreakdown?: Array<{
        county: string;
        grossSales: number;
        taxableSales: number;
        taxCollected: number;
    }>;
    auditHash?: string;
}

export interface CompanyData {
    name: string;
    fein?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
}

export class DR15PDFGenerator {
    /**
     * Genera un PDF básico del reporte DR-15
     */
    generatePDF(data: DR15Data, companyData: CompanyData): Blob {
        const doc = new jsPDF();

        let yPosition = 20;

        // ================================================================
        // ENCABEZADO
        // ================================================================

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('FLORIDA DEPARTMENT OF REVENUE', 105, yPosition, { align: 'center' });

        yPosition += 8;
        doc.setFontSize(14);
        doc.text('Sales and Use Tax Return (DR-15)', 105, yPosition, { align: 'center' });

        yPosition += 15;

        // ================================================================
        // INFORMACIÓN DE LA EMPRESA
        // ================================================================

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        doc.text(`Business Name: ${companyData.name}`, 20, yPosition);
        yPosition += 6;

        if (companyData.fein) {
            doc.text(`FEIN: ${companyData.fein}`, 20, yPosition);
            yPosition += 6;
        }

        if (companyData.address) {
            doc.text(`Address: ${companyData.address}`, 20, yPosition);
            yPosition += 6;
        }

        if (companyData.city && companyData.state && companyData.zipCode) {
            doc.text(`${companyData.city}, ${companyData.state} ${companyData.zipCode}`, 20, yPosition);
            yPosition += 6;
        }

        yPosition += 5;

        // ================================================================
        // PERÍODO DEL REPORTE
        // ================================================================

        doc.setFont('helvetica', 'bold');
        doc.text(`Reporting Period: ${data.period}`, 20, yPosition);
        doc.setFont('helvetica', 'normal');

        yPosition += 10;

        // ================================================================
        // RESUMEN DE TOTALES
        // ================================================================

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Summary of Collections', 20, yPosition);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        yPosition += 8;

        const summaryData = [
            ['Gross Sales', `$${data.grossSales.toFixed(2)}`],
            ['Exempt Sales', `$${data.exemptSales.toFixed(2)}`],
            ['Taxable Sales', `$${data.taxableSales.toFixed(2)}`],
            ['Tax Collected', `$${data.taxCollected.toFixed(2)}`],
            ['Surtax Collected', `$${data.surtaxCollected.toFixed(2)}`],
            ['Total Tax Due', `$${data.totalTaxDue.toFixed(2)}`]
        ];

        autoTable(doc, {
            startY: yPosition,
            head: [['Description', 'Amount']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10 },
            columnStyles: {
                0: { cellWidth: 100 },
                1: { cellWidth: 60, halign: 'right' }
            }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;

        // ================================================================
        // DESGLOSE POR CONDADO
        // ================================================================

        if (data.countyBreakdown && data.countyBreakdown.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('County Breakdown', 20, yPosition);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            yPosition += 8;

            const countyData = data.countyBreakdown.map(c => [
                c.county,
                `$${c.grossSales.toFixed(2)}`,
                `$${c.taxableSales.toFixed(2)}`,
                `$${c.taxCollected.toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: yPosition,
                head: [['County', 'Gross Sales', 'Taxable Sales', 'Tax Collected']],
                body: countyData,
                theme: 'striped',
                headStyles: { fillColor: [52, 73, 94], textColor: 255 },
                styles: { fontSize: 9 },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 40, halign: 'right' },
                    2: { cellWidth: 40, halign: 'right' },
                    3: { cellWidth: 40, halign: 'right' }
                }
            });

            yPosition = (doc as any).lastAutoTable.finalY + 15;
        }

        // ================================================================
        // HASH DE AUDITORÍA
        // ================================================================

        if (data.auditHash) {
            // Verificar si necesitamos nueva página
            if (yPosition > 250) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text('Audit Hash (SHA-256):', 20, yPosition);
            yPosition += 4;
            doc.setFont('courier', 'normal');
            doc.text(data.auditHash.substring(0, 64), 20, yPosition);
            if (data.auditHash.length > 64) {
                yPosition += 4;
                doc.text(data.auditHash.substring(64), 20, yPosition);
            }
        }

        // ================================================================
        // PIE DE PÁGINA
        // ================================================================

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Generated by AccountExpress Next-Gen - Page ${i} of ${pageCount}`,
                105,
                285,
                { align: 'center' }
            );
            doc.text(
                `Generated: ${new Date().toLocaleString()}`,
                105,
                290,
                { align: 'center' }
            );
        }

        // ================================================================
        // GENERAR BLOB
        // ================================================================

        return doc.output('blob');
    }

    /**
     * Descarga el PDF directamente
     */
    downloadPDF(data: DR15Data, companyData: CompanyData, filename?: string): void {
        const blob = this.generatePDF(data, companyData);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `DR15_${data.period.replace('/', '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Exportar instancia singleton
export const dr15PDFGenerator = new DR15PDFGenerator();
