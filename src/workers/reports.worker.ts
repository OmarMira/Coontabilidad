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
async function generateDR15PDF(reportData: any, options: any = {}): Promise<ReportResult> {
  try {
    // Reportar progreso inicial
    self.postMessage({ success: true, progress: 10 });

    // Por ahora, simular generación de PDF
    // TODO: Implementar generación real de PDF cuando se resuelvan las dependencias
    const mockPdfData = new ArrayBuffer(1024); // Mock PDF data
    
    // Reportar progreso de renderizado
    self.postMessage({ success: true, progress: 50 });
    
    // Reportar progreso final
    self.postMessage({ success: true, progress: 90 });

    return {
      success: true,
      data: {
        pdf: mockPdfData,
        filename: options.filename || `DR15_${new Date().toISOString().split('T')[0]}.pdf`,
        size: mockPdfData.byteLength
      },
      progress: 100
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Error generando PDF DR-15: ${error.message}`
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