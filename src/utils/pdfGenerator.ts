/**
 * PDF Generator for Closure Reports
 * 
 * Genera reportes de cierre contable en formato PDF usando jsPDF
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ClosureReportData } from '../components/accounting/ClosureReport';

export function generateClosureReportPDF(data: ClosureReportData): void {
  const doc = new jsPDF();
  const { period, validationResults, summary, closedBy, closedAt } = data;

  // Configuración
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Helper para formatear moneda
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Helper para formatear fecha
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper para obtener nombre de paso
  const getStepName = (stepId: number): string => {
    const names: Record<number, string> = {
      1: 'Validación de Transacciones',
      2: 'Conciliación Bancaria',
      3: 'Ajustes Contables',
      4: 'Balance de Comprobación',
      5: 'Confirmación'
    };
    return names[stepId] || `Paso ${stepId}`;
  };

  // ============================================================================
  // HEADER
  // ============================================================================
  
  // Logo/Título
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE CIERRE CONTABLE', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(period.name, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;
  doc.setDrawColor(59, 130, 246); // Azul
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 10;

  // ============================================================================
  // INFORMACIÓN GENERAL
  // ============================================================================
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información General', margin, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const infoData = [
    ['Período:', period.name],
    ['Tipo:', period.period_type.charAt(0).toUpperCase() + period.period_type.slice(1)],
    ['Fecha Inicio:', formatDate(period.start_date)],
    ['Fecha Fin:', formatDate(period.end_date)],
    ['Año Fiscal:', period.fiscal_year.toString()],
    ['Cerrado Por:', closedBy],
    ['Fecha de Cierre:', formatDate(closedAt)]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: infoData,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ============================================================================
  // RESUMEN FINANCIERO
  // ============================================================================
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen Financiero', margin, yPos);
  yPos += 7;

  const financialData = [
    ['Ingresos Totales', formatCurrency(summary.totalRevenue)],
    ['Gastos Totales', formatCurrency(summary.totalExpenses)],
    ['Utilidad Neta', formatCurrency(summary.netIncome)],
    ['Total Transacciones', summary.totalTransactions.toString()]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Monto']],
    body: financialData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ============================================================================
  // BALANCE DE COMPROBACIÓN
  // ============================================================================
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Balance de Comprobación', margin, yPos);
  yPos += 7;

  const difference = Math.abs(summary.totalDebit - summary.totalCredit);
  const isBalanced = difference < 0.01;

  const balanceData = [
    ['Total Débitos', formatCurrency(summary.totalDebit)],
    ['Total Créditos', formatCurrency(summary.totalCredit)],
    ['Diferencia', formatCurrency(difference)],
    ['Estado', isBalanced ? '✓ BALANCEADO' : '✗ DESBALANCEADO']
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Concepto', 'Monto']],
    body: balanceData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Verificar si necesitamos nueva página
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // ============================================================================
  // RESUMEN DE VALIDACIONES
  // ============================================================================
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Validaciones', margin, yPos);
  yPos += 7;

  // Calcular totales
  const totalChecks = validationResults.reduce((sum, r) => sum + r.checks.length, 0);
  const passedChecks = validationResults.reduce(
    (sum, r) => sum + r.checks.filter(c => c.status === 'passed').length,
    0
  );
  const warningChecks = validationResults.reduce(
    (sum, r) => sum + r.checks.filter(c => c.status === 'warning').length,
    0
  );
  const errorChecks = validationResults.reduce(
    (sum, r) => sum + r.checks.filter(c => c.status === 'error').length,
    0
  );

  const validationSummary = [
    ['Total Validaciones', totalChecks.toString()],
    ['Pasadas', passedChecks.toString()],
    ['Advertencias', warningChecks.toString()],
    ['Errores', errorChecks.toString()]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Tipo', 'Cantidad']],
    body: validationSummary,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 'auto', halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ============================================================================
  // DETALLE DE VALIDACIONES POR PASO
  // ============================================================================
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Validaciones', margin, yPos);
  yPos += 7;

  validationResults.forEach((result, index) => {
    // Verificar si necesitamos nueva página
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // Nombre del paso
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${getStepName(result.stepId)}`, margin, yPos);
    yPos += 5;

    // Estado del paso
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const statusText = result.status === 'passed' ? 'Aprobado' :
                      result.status === 'warning' ? 'Con Advertencias' :
                      result.status === 'error' ? 'Con Errores' : 'Pendiente';
    doc.text(`Estado: ${statusText}`, margin, yPos);
    yPos += 5;

    // Checks del paso
    const checksData = result.checks.map(check => {
      const statusIcon = check.status === 'passed' ? '✓' :
                        check.status === 'warning' ? '⚠' :
                        check.status === 'error' ? '✗' : '○';
      return [statusIcon, check.label, check.message || ''];
    });

    autoTable(doc, {
      startY: yPos,
      head: [],
      body: checksData,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 'auto', textColor: [107, 114, 128] }
      },
      margin: { left: margin + 5, right: margin }
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  });

  // ============================================================================
  // NOTAS
  // ============================================================================
  
  if (period.notes) {
    // Verificar si necesitamos nueva página
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(period.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPos);
    yPos += splitNotes.length * 5 + 10;
  }

  // ============================================================================
  // FOOTER
  // ============================================================================
  
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 280, pageWidth - margin, 280);
    
    // Texto del footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    
    const footerText = 'Generado por AccountExpress - ' + formatDate(new Date().toISOString());
    doc.text(footerText, pageWidth / 2, 285, { align: 'center' });
    
    // Número de página
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, 285, { align: 'right' });
  }

  // ============================================================================
  // GUARDAR PDF
  // ============================================================================
  
  const fileName = `Cierre_${period.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
