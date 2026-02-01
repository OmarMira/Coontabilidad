/**
 * GENERADOR PDF DR-15 BÁSICO
 * 
 * Genera un PDF simple con los datos esenciales del reporte DR-15
 * para cumplimiento mínimo de Florida DOR.
 */

import { WorkerOrchestrator, WorkerType } from '../../core/workers/WorkerOrchestrator';

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
    private orchestrator: WorkerOrchestrator;

    constructor() {
        this.orchestrator = new WorkerOrchestrator();
    }

    /**
     * Genera un PDF del reporte DR-15 utilizando Web Workers para evitar congelamiento de UI
     */
    async generatePDFAsync(data: DR15Data, companyData: CompanyData): Promise<Blob> {
        return this.orchestrator.executeTask<Blob>('PDF_GENERATION' as WorkerType, { data, companyData });
    }

    /**
     * @deprecated Use generatePDFAsync instead
     */
    generatePDF(data: DR15Data, companyData: CompanyData): Blob {
        // Fallback sync implementation or throw error
        throw new Error("Use generatePDFAsync for non-blocking PDF generation");
    }

    /**
     * Descarga el PDF directamente
     */
    async downloadPDF(data: DR15Data, companyData: CompanyData, filename?: string): Promise<void> {
        const blob = await this.generatePDFAsync(data, companyData);
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
