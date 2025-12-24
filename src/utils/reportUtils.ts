import { getCompanyData } from '../database/simple-db';
import { getCompanyLogoUrl, getLogoHtml } from './logoUtils';
import { logger } from '../core/logging/SystemLogger';

/**
 * Genera el encabezado HTML para reportes con logo y datos de empresa
 */
export function generateReportHeader(reportTitle: string, includeDate: boolean = true): string {
  try {
    const companyData = getCompanyData();
    const logoHtml = getLogoHtml(150, 75);
    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!companyData) {
      logger.warn('ReportUtils', 'no_company_data', 'No se encontraron datos de empresa para el reporte');
      return `<h1>${reportTitle}</h1>`;
    }

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 20px;">
          ${logoHtml ? `<div>${logoHtml}</div>` : ''}
          <div>
            <h1 style="margin: 0; color: #1f2937; font-size: 24px; font-weight: bold;">${companyData.company_name}</h1>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${companyData.legal_name}</p>
            <p style="margin: 2px 0 0 0; color: #6b7280; font-size: 12px;">Tax ID: ${companyData.tax_id}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">${reportTitle}</h2>
          ${includeDate ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">Generado el ${currentDate}</p>` : ''}
        </div>
      </div>
    `;
  } catch (error) {
    logger.error('ReportUtils', 'header_generation_failed', 'Error al generar encabezado de reporte', null, error as Error);
    return `<h1>${reportTitle}</h1>`;
  }
}

/**
 * Genera el pie de página para reportes
 */
export function generateReportFooter(): string {
  try {
    const companyData = getCompanyData();
    
    if (!companyData) {
      return '';
    }

    return `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px;">
        <p style="margin: 0;">
          ${companyData.company_name} • ${companyData.address}, ${companyData.city}, ${companyData.state} ${companyData.zip_code}
        </p>
        <p style="margin: 5px 0 0 0;">
          Tel: ${companyData.phone} • Email: ${companyData.email}
          ${companyData.website ? ` • Web: ${companyData.website}` : ''}
        </p>
        <p style="margin: 10px 0 0 0; font-style: italic;">
          Generado por AccountExpress Next-Gen • Sistema ERP Contable
        </p>
      </div>
    `;
  } catch (error) {
    logger.error('ReportUtils', 'footer_generation_failed', 'Error al generar pie de reporte', null, error as Error);
    return '';
  }
}

/**
 * Genera un reporte HTML completo con encabezado y pie de página
 */
export function generateCompleteReport(
  title: string, 
  content: string, 
  includeDate: boolean = true
): string {
  const header = generateReportHeader(title, includeDate);
  const footer = generateReportFooter();

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .font-bold {
          font-weight: bold;
        }
        .text-green {
          color: #059669;
        }
        .text-red {
          color: #dc2626;
        }
        .text-blue {
          color: #2563eb;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      ${header}
      ${content}
      ${footer}
    </body>
    </html>
  `;
}

/**
 * Abre un reporte en una nueva ventana para impresión
 */
export function printReport(title: string, content: string, includeDate: boolean = true): void {
  try {
    const reportHtml = generateCompleteReport(title, content, includeDate);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      
      // Esperar a que se cargue el contenido antes de imprimir
      printWindow.onload = () => {
        printWindow.print();
      };
      
      logger.info('ReportUtils', 'print_report', 'Reporte abierto para impresión', { title });
    } else {
      throw new Error('No se pudo abrir la ventana de impresión');
    }
  } catch (error) {
    logger.error('ReportUtils', 'print_failed', 'Error al imprimir reporte', { title }, error as Error);
    alert('Error al abrir el reporte para impresión. Verifique que las ventanas emergentes estén habilitadas.');
  }
}

/**
 * Descarga un reporte como archivo HTML
 */
export function downloadReport(title: string, content: string, includeDate: boolean = true): void {
  try {
    const reportHtml = generateCompleteReport(title, content, includeDate);
    
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    logger.info('ReportUtils', 'download_report', 'Reporte descargado', { title, filename: link.download });
  } catch (error) {
    logger.error('ReportUtils', 'download_failed', 'Error al descargar reporte', { title }, error as Error);
    alert('Error al descargar el reporte.');
  }
}