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
        try {
            const result = await this.orchestrator.executeTask<any>('REPORTS' as WorkerType, {
                type: 'dr15-pdf',
                data: {
                    period: data.period,
                    taxpayerInfo: {
                        fein: companyData.fein || 'N/A',
                        period: data.period,
                        name: companyData.name
                    },
                    countySummary: data.countyBreakdown || [],
                    totals: {
                        sales: data.grossSales,
                        tax: data.totalTaxDue
                    },
                    verification: {
                        generatedAt: new Date().toISOString(),
                        checksum: data.auditHash || 'N/A'
                    }
                },
                options: {
                    filename: `DR15_${data.period.replace('/', '-')}.pdf`
                }
            });

            if (!result.success) {
                throw new Error(result.error || 'Error generando PDF');
            }

            // Convertir ArrayBuffer de vuelta a Blob
            return new Blob([result.data.pdf], { type: 'application/pdf' });

        } catch (error: any) {
            console.error('Error en DR15PDFGenerator:', error);
            throw new Error(`Error generando PDF DR-15: ${error.message}`);
        }
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
