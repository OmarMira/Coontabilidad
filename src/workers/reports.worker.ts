/**
 * Reports Worker - Procesamiento de reportes pesados sin bloquear UI
 * Maneja generación de PDFs DR-15 y exportación de datos masivos
 */

import * as XLSX from 'xlsx';

interface ReportTask {
  type: 'dr15-pdf' | 'excel-export' | 'ledger-export';
  data: any;
  options?: any;
}

interface ReportResult {
  success: boolean;
  data?: any;
  error?: string;
  progress?: number;
}

// Manejar mensajes del hilo principal
self.onmessage = async (event: MessageEvent<ReportTask>) => {
  const { type, data, options } = event.data;

  try {
    let result: ReportResult;

    switch (type) {
      case 'dr15-pdf':
        result = await generateDR15PDF(data, options);
        break;

      case 'excel-export':
        result = await generateExcelExport(data, options);
        break;

      case 'ledger-export':
        result = await generateLedgerExport(data, options);
        break;

      default:
        result = {
          success: false,
          error: `Tipo de reporte no soportado: ${type}`
        };
    }

    // Enviar resultado de vuelta al hilo principal
    self.postMessage(result);

  } catch (error: any) {
    self.postMessage({
      success: false,
      error: error.message || 'Error desconocido en worker de reportes'
    });
  }
};

/**
 * Generar PDF DR-15 en worker
 */

/**
 * Generar PDF DR-15 en worker con jsPDF (Real Implementation)
 */
async function generateDR15PDF(reportData: any, options: any = {}): Promise<ReportResult> {
  try {
    // Importar dinámicamente jsPDF y autotable si es necesario (en worker environment)
    // Nota: En Vite workers, los imports estáticos suelen funcionar mejor si están configurados
    // Pero para garantizar funcionalidad, usaremos importScripts si 'jspdf' no está disponible globalmente,
    // o asumiremos que el bundle procesa los imports.

    // Al ser un modulo ES generado por Vite, podemos usar imports arriba.
    // Sin embargo, para este worker especifico, vamos a usar la libreria importada.
    const { jsPDF } = await import('jspdf');

    self.postMessage({ success: true, progress: 10 });

    const doc = new jsPDF();
    const data = reportData; // Alias

    // Header logic
    doc.setFontSize(18);
    doc.text('Florida Department of Revenue', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('DR-15 Sales and Use Tax Return', 105, 30, { align: 'center' });

    self.postMessage({ success: true, progress: 30 });

    // Taxpayer Info
    doc.setFontSize(10);
    doc.rect(14, 35, 180, 25);
    doc.text(`Taxpayer: ${data.taxpayerInfo.name || 'N/A'}`, 20, 45);
    doc.text(`FEIN: ${data.taxpayerInfo.fein || 'N/A'}`, 20, 50);
    doc.text(`Period: ${data.period || 'N/A'}`, 120, 45);

    // Financials
    doc.setFontSize(11);
    doc.text('Summary of Tax Due', 14, 70);

    let y = 80;
    const drawLine = (label: string, value: number, isCurrency = true) => {
      doc.text(label, 20, y);
      doc.text(isCurrency ? `$${value.toFixed(2)}` : value.toString(), 150, y);
      y += 8;
    };

    drawLine('Gross Sales:', data.totals.sales);
    drawLine('Exempt Sales:', data.totals.exempt || 0); // Assuming mapped
    drawLine('Taxable Sales:', data.totals.taxable || (data.totals.sales - (data.totals.exempt || 0)));
    drawLine('Total Tax Due:', data.totals.tax);

    self.postMessage({ success: true, progress: 60 });

    // County Breakdown Table simulation
    if (data.countySummary && Array.isArray(data.countySummary)) {
      y += 10;
      doc.text('County Breakdown', 14, y);
      y += 10;
      doc.setFontSize(9);
      data.countySummary.slice(0, 10).forEach((c: any) => { // Limit to 10 for space in this basic template
        doc.text(`${c.county}`, 20, y);
        doc.text(`$${c.taxCollected.toFixed(2)}`, 150, y);
        y += 6;
      });
    }

    // Verification Footer
    const footerY = 270;
    doc.setFontSize(8);
    doc.text('--- SYSTEM GENERATED VERIFICATION ---', 105, footerY, { align: 'center' });
    doc.text(`Generated At: ${data.verification.generatedAt}`, 20, footerY + 5);
    doc.text(`Audit Hash: ${data.verification.checksum}`, 20, footerY + 10);
    doc.text('AccountExpress Next-Gen | Iron Core v1.2', 170, footerY + 10, { align: 'right' });

    self.postMessage({ success: true, progress: 90 });

    const pdfArrayBuffer = doc.output('arraybuffer');

    return {
      success: true,
      data: {
        pdf: pdfArrayBuffer,
        filename: options.filename || `DR15_${new Date().toISOString().split('T')[0]}.pdf`,
        size: pdfArrayBuffer.byteLength
      },
      progress: 100
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Error generando PDF DR-15 (Worker): ${error.message}`
    };
  }
}

/**
 * Generar exportación Excel masiva
 */
async function generateExcelExport(data: any, options: any = {}): Promise<ReportResult> {
  try {
    self.postMessage({ success: true, progress: 10 });

    const workbook = XLSX.utils.book_new();

    // Procesar cada hoja de datos
    if (Array.isArray(data.sheets)) {
      for (let i = 0; i < data.sheets.length; i++) {
        const sheet = data.sheets[i];

        // Reportar progreso por hoja
        const progress = 10 + (i / data.sheets.length) * 70;
        self.postMessage({ success: true, progress });

        // Crear worksheet
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);

        // Agregar al workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name || `Hoja${i + 1}`);
      }
    } else {
      // Datos simples en una sola hoja
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Datos');
    }

    self.postMessage({ success: true, progress: 85 });

    // Generar buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      compression: true
    });

    return {
      success: true,
      data: {
        excel: excelBuffer,
        filename: options.filename || `Reporte_${new Date().toISOString().split('T')[0]}.xlsx`,
        size: excelBuffer.byteLength
      },
      progress: 100
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Error generando Excel: ${error.message}`
    };
  }
}

/**
 * Generar exportación de Libro Mayor masivo
 */
async function generateLedgerExport(data: any, options: any = {}): Promise<ReportResult> {
  try {
    self.postMessage({ success: true, progress: 10 });

    const { entries, accounts, period } = data;

    // Procesar entradas del libro mayor
    const processedEntries: any[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Reportar progreso
      if (i % 100 === 0) {
        const progress = 10 + (i / entries.length) * 60;
        self.postMessage({ success: true, progress });
      }

      // Procesar cada detalle del asiento
      if (entry.details) {
        entry.details.forEach((detail: any) => {
          processedEntries.push({
            fecha: entry.entry_date,
            referencia: entry.reference_number,
            descripcion: entry.description,
            cuenta_codigo: detail.account_code,
            cuenta_nombre: detail.account_name || 'N/A',
            debe: detail.debit_amount || 0,
            haber: detail.credit_amount || 0,
            balance: detail.debit_amount - detail.credit_amount
          });
        });
      }
    }

    self.postMessage({ success: true, progress: 80 });

    // Crear workbook con múltiples hojas
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Libro Mayor Detallado
    const ledgerSheet = XLSX.utils.json_to_sheet(processedEntries);
    XLSX.utils.book_append_sheet(workbook, ledgerSheet, 'Libro Mayor');

    // Hoja 2: Resumen por Cuenta
    const accountSummary = accounts.map((account: any) => ({
      codigo: account.account_code,
      nombre: account.account_name,
      tipo: account.account_type,
      saldo: account.balance || 0
    }));

    const summarySheet = XLSX.utils.json_to_sheet(accountSummary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen Cuentas');

    self.postMessage({ success: true, progress: 95 });

    // Generar buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      compression: true
    });

    return {
      success: true,
      data: {
        excel: excelBuffer,
        filename: options.filename || `LibroMayor_${period || 'Completo'}.xlsx`,
        size: excelBuffer.byteLength
      },
      progress: 100
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Error generando Libro Mayor: ${error.message}`
    };
  }
}

// Exportar tipos para TypeScript
export type { ReportTask, ReportResult };