/**
 * PDF Worker (Iron Clad Upgrade - Phase 2, Day 1)
 * 
 * Genera PDFs en background sin bloquear la UI.
 * Soporta:
 * - DR-15 Reports
 * - Form 941 (Payroll)
 * - Invoices
 * - Balance Sheets
 * - Income Statements
 * - Custom reports
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

interface PDFGenerationTask {
    type: 'DR15' | 'FORM941' | 'INVOICE' | 'BALANCE_SHEET' | 'INCOME_STATEMENT' | 'CUSTOM';
    data: any;
    options?: {
        orientation?: 'portrait' | 'landscape';
        format?: 'letter' | 'a4';
        compress?: boolean;
    };
}

interface PDFGenerationResult {
    success: boolean;
    pdf?: Blob;
    error?: string;
    metadata?: {
        pages: number;
        size: number;
        generationTime: number;
    };
}

/**
 * Main message handler
 */
self.onmessage = async (e: MessageEvent) => {
    const startTime = Date.now();
    const task: PDFGenerationTask = e.data;

    try {
        // Report progress
        postProgress(0, 'Initializing PDF generator...');

        let pdf: jsPDF;

        switch (task.type) {
            case 'DR15':
                pdf = await generateDR15(task.data, task.options);
                break;
            case 'FORM941':
                pdf = await generateForm941(task.data, task.options);
                break;
            case 'INVOICE':
                pdf = await generateInvoice(task.data, task.options);
                break;
            case 'BALANCE_SHEET':
                pdf = await generateBalanceSheet(task.data, task.options);
                break;
            case 'INCOME_STATEMENT':
                pdf = await generateIncomeStatement(task.data, task.options);
                break;
            case 'CUSTOM':
                pdf = await generateCustomReport(task.data, task.options);
                break;
            default:
                throw new Error(`Unknown PDF type: ${task.type}`);
        }

        postProgress(90, 'Converting to blob...');

        // Convert to blob
        const pdfBlob = pdf.output('blob');
        const generationTime = Date.now() - startTime;

        postProgress(100, 'PDF generation complete!');

        // Send result
        const result: PDFGenerationResult = {
            success: true,
            pdf: pdfBlob,
            metadata: {
                pages: pdf.getNumberOfPages(),
                size: pdfBlob.size,
                generationTime
            }
        };

        self.postMessage(result);

    } catch (error: any) {
        const result: PDFGenerationResult = {
            success: false,
            error: error.message
        };
        self.postMessage(result);
    }
};

/**
 * Generate DR-15 Report
 */
async function generateDR15(data: any, options?: any): Promise<jsPDF> {
    postProgress(10, 'Generating DR-15 report...');

    const doc = new jsPDF({
        orientation: options?.orientation || 'portrait',
        format: options?.format || 'letter',
        compress: options?.compress !== false
    });

    // Header
    doc.setFontSize(18);
    doc.text('Florida Department of Revenue', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('DR-15 - Sales and Use Tax Return', 105, 30, { align: 'center' });

    postProgress(20, 'Adding company information...');

    // Company Info
    doc.setFontSize(10);
    doc.text(`Business Name: ${data.companyName || 'N/A'}`, 20, 45);
    doc.text(`FEIN: ${data.fein || 'N/A'}`, 20, 52);
    doc.text(`Period: ${data.period || 'N/A'}`, 20, 59);

    postProgress(40, 'Adding tax calculations...');

    // Tax Table
    const tableData = [
        ['Line', 'Description', 'Amount'],
        ['1', 'Gross Sales', formatCurrency(data.grossSales || 0)],
        ['2', 'Exempt Sales', formatCurrency(data.exemptSales || 0)],
        ['3', 'Taxable Sales (Line 1 - Line 2)', formatCurrency(data.taxableSales || 0)],
        ['4', 'State Tax (6%)', formatCurrency(data.stateTax || 0)],
        ['5', 'County Surtax', formatCurrency(data.countyTax || 0)],
        ['6', 'Total Tax Due (Line 4 + Line 5)', formatCurrency(data.totalTax || 0)]
    ];

    doc.autoTable({
        startY: 70,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 9 }
    });

    postProgress(60, 'Adding county breakdown...');

    // County Breakdown
    if (data.counties && data.counties.length > 0) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.text('County Breakdown:', 20, finalY);

        const countyData = data.counties.map((c: any) => [
            c.name,
            `${c.rate}%`,
            formatCurrency(c.taxableSales),
            formatCurrency(c.tax)
        ]);

        doc.autoTable({
            startY: finalY + 5,
            head: [['County', 'Rate', 'Taxable Sales', 'Tax']],
            body: countyData,
            theme: 'striped',
            headStyles: { fillColor: [52, 152, 219] },
            styles: { fontSize: 8 }
        });
    }

    postProgress(80, 'Adding footer...');

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
            `Generated: ${new Date().toLocaleString()}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
    }

    return doc;
}

/**
 * Generate Form 941 (Payroll)
 */
async function generateForm941(data: any, options?: any): Promise<jsPDF> {
    postProgress(10, 'Generating Form 941...');

    const doc = new jsPDF({
        orientation: options?.orientation || 'portrait',
        format: options?.format || 'letter',
        compress: options?.compress !== false
    });

    // Header
    doc.setFontSize(16);
    doc.text('Form 941', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text("Employer's Quarterly Federal Tax Return", 105, 28, { align: 'center' });

    postProgress(30, 'Adding employer information...');

    // Employer Info
    doc.setFontSize(10);
    doc.text(`Employer Name: ${data.employerName || 'N/A'}`, 20, 45);
    doc.text(`EIN: ${data.ein || 'N/A'}`, 20, 52);
    doc.text(`Quarter: ${data.quarter || 'N/A'}`, 20, 59);
    doc.text(`Year: ${data.year || 'N/A'}`, 20, 66);

    postProgress(50, 'Adding wage calculations...');

    // Wage Data
    const wageData = [
        ['Line', 'Description', 'Amount'],
        ['1', 'Number of Employees', data.employeeCount || 0],
        ['2', 'Total Wages', formatCurrency(data.totalWages || 0)],
        ['3', 'Federal Income Tax Withheld', formatCurrency(data.federalTax || 0)],
        ['5a', 'Taxable Social Security Wages', formatCurrency(data.socialSecurityWages || 0)],
        ['5b', 'Social Security Tax', formatCurrency(data.socialSecurityTax || 0)],
        ['5c', 'Taxable Medicare Wages', formatCurrency(data.medicareWages || 0)],
        ['5d', 'Medicare Tax', formatCurrency(data.medicareTax || 0)],
        ['6', 'Total Taxes', formatCurrency(data.totalTaxes || 0)]
    ];

    doc.autoTable({
        startY: 75,
        head: [wageData[0]],
        body: wageData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [46, 125, 50] },
        styles: { fontSize: 9 }
    });

    postProgress(80, 'Finalizing Form 941...');

    // Footer
    addFooter(doc);

    return doc;
}

/**
 * Generate Invoice
 */
async function generateInvoice(data: any, options?: any): Promise<jsPDF> {
    postProgress(10, 'Generating invoice...');

    const doc = new jsPDF({
        orientation: options?.orientation || 'portrait',
        format: options?.format || 'letter',
        compress: options?.compress !== false
    });

    // Header
    doc.setFontSize(20);
    doc.text('INVOICE', 20, 20);

    postProgress(30, 'Adding invoice details...');

    // Invoice Info
    doc.setFontSize(10);
    doc.text(`Invoice #: ${data.invoiceNumber || 'N/A'}`, 20, 35);
    doc.text(`Date: ${data.date || 'N/A'}`, 20, 42);
    doc.text(`Due Date: ${data.dueDate || 'N/A'}`, 20, 49);

    // Customer Info
    doc.text('Bill To:', 20, 65);
    doc.text(data.customerName || 'N/A', 20, 72);
    doc.text(data.customerAddress || '', 20, 79);

    postProgress(50, 'Adding line items...');

    // Line Items
    const items = (data.items || []).map((item: any) => [
        item.description,
        item.quantity,
        formatCurrency(item.unitPrice),
        formatCurrency(item.total)
    ]);

    doc.autoTable({
        startY: 90,
        head: [['Description', 'Qty', 'Unit Price', 'Total']],
        body: items,
        theme: 'striped',
        headStyles: { fillColor: [33, 150, 243] }
    });

    postProgress(70, 'Adding totals...');

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${formatCurrency(data.subtotal || 0)}`, 150, finalY);
    doc.text(`Tax: ${formatCurrency(data.tax || 0)}`, 150, finalY + 7);
    doc.setFontSize(12);
    doc.text(`Total: ${formatCurrency(data.total || 0)}`, 150, finalY + 14);

    postProgress(90, 'Finalizing invoice...');

    addFooter(doc);

    return doc;
}

/**
 * Generate Balance Sheet
 */
async function generateBalanceSheet(data: any, options?: any): Promise<jsPDF> {
    postProgress(10, 'Generating balance sheet...');

    const doc = new jsPDF({
        orientation: options?.orientation || 'portrait',
        format: options?.format || 'letter',
        compress: options?.compress !== false
    });

    doc.setFontSize(16);
    doc.text('Balance Sheet', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`As of ${data.date || 'N/A'}`, 105, 28, { align: 'center' });

    postProgress(40, 'Adding assets...');

    // Assets
    const assets = [
        ['Assets', ''],
        ['Current Assets', ''],
        ['  Cash', formatCurrency(data.cash || 0)],
        ['  Accounts Receivable', formatCurrency(data.accountsReceivable || 0)],
        ['  Inventory', formatCurrency(data.inventory || 0)],
        ['Total Current Assets', formatCurrency(data.totalCurrentAssets || 0)],
        ['Fixed Assets', formatCurrency(data.fixedAssets || 0)],
        ['Total Assets', formatCurrency(data.totalAssets || 0)]
    ];

    doc.autoTable({
        startY: 40,
        body: assets,
        theme: 'plain',
        styles: { fontSize: 9 }
    });

    postProgress(70, 'Adding liabilities and equity...');

    // Liabilities & Equity
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const liabilities = [
        ['Liabilities & Equity', ''],
        ['Current Liabilities', ''],
        ['  Accounts Payable', formatCurrency(data.accountsPayable || 0)],
        ['Total Liabilities', formatCurrency(data.totalLiabilities || 0)],
        ['Equity', formatCurrency(data.equity || 0)],
        ['Total Liabilities & Equity', formatCurrency(data.totalLiabilitiesEquity || 0)]
    ];

    doc.autoTable({
        startY: finalY,
        body: liabilities,
        theme: 'plain',
        styles: { fontSize: 9 }
    });

    addFooter(doc);

    return doc;
}

/**
 * Generate Income Statement
 */
async function generateIncomeStatement(data: any, options?: any): Promise<jsPDF> {
    postProgress(10, 'Generating income statement...');

    const doc = new jsPDF({
        orientation: options?.orientation || 'portrait',
        format: options?.format || 'letter',
        compress: options?.compress !== false
    });

    doc.setFontSize(16);
    doc.text('Income Statement', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Period: ${data.period || 'N/A'}`, 105, 28, { align: 'center' });

    postProgress(50, 'Adding revenue and expenses...');

    const statementData = [
        ['Revenue', ''],
        ['  Sales', formatCurrency(data.sales || 0)],
        ['Total Revenue', formatCurrency(data.totalRevenue || 0)],
        ['', ''],
        ['Expenses', ''],
        ['  Cost of Goods Sold', formatCurrency(data.cogs || 0)],
        ['  Operating Expenses', formatCurrency(data.operatingExpenses || 0)],
        ['Total Expenses', formatCurrency(data.totalExpenses || 0)],
        ['', ''],
        ['Net Income', formatCurrency(data.netIncome || 0)]
    ];

    doc.autoTable({
        startY: 40,
        body: statementData,
        theme: 'plain',
        styles: { fontSize: 9 }
    });

    addFooter(doc);

    return doc;
}

/**
 * Generate Custom Report
 */
async function generateCustomReport(data: any, options?: any): Promise<jsPDF> {
    postProgress(10, 'Generating custom report...');

    const doc = new jsPDF({
        orientation: options?.orientation || 'portrait',
        format: options?.format || 'letter',
        compress: options?.compress !== false
    });

    // Title
    doc.setFontSize(16);
    doc.text(data.title || 'Custom Report', 105, 20, { align: 'center' });

    postProgress(50, 'Adding custom content...');

    // Custom content
    if (data.tables) {
        let startY = 40;
        for (const table of data.tables) {
            doc.autoTable({
                startY,
                head: table.headers ? [table.headers] : undefined,
                body: table.rows,
                theme: 'striped'
            });
            startY = (doc as any).lastAutoTable.finalY + 10;
        }
    }

    addFooter(doc);

    return doc;
}

/**
 * Helper: Add footer to all pages
 */
function addFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
            `Generated: ${new Date().toLocaleString()}`,
            105,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width - 20,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
        );
    }
}

/**
 * Helper: Format currency
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Helper: Post progress update
 */
function postProgress(percent: number, message: string): void {
    self.postMessage({
        type: 'progress',
        percent,
        message
    });
}
