/**
 * AsyncOperationsDemo (Iron Clad Upgrade - Phase 2, Day 5)
 * 
 * Componente de demostración que muestra cómo usar AsyncPDFService y AsyncCSVService
 * con progress bars y sin bloquear la UI.
 */

import React, { useState } from 'react';
import { asyncPDFService } from '../../services/pdf/AsyncPDFService';
import { asyncCSVService } from '../../services/csv/AsyncCSVService';

export function AsyncOperationsDemo() {
    const [pdfProgress, setPdfProgress] = useState({ percent: 0, message: '' });
    const [csvProgress, setCsvProgress] = useState({ percent: 0, message: '' });
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isProcessingCSV, setIsProcessingCSV] = useState(false);

    /**
     * Generate DR-15 PDF without blocking UI
     */
    const handleGenerateDR15 = async () => {
        setIsGeneratingPDF(true);
        setPdfProgress({ percent: 0, message: 'Starting...' });

        try {
            const pdfBlob = await asyncPDFService.generateDR15(
                {
                    companyName: 'AccountExpress Demo',
                    fein: '12-3456789',
                    period: 'Q1 2026',
                    grossSales: 100000,
                    exemptSales: 5000,
                    taxableSales: 95000,
                    stateTax: 5700,
                    countyTax: 712.50,
                    totalTax: 6412.50,
                    counties: [
                        { name: 'Miami-Dade', rate: 0.75, taxableSales: 95000, tax: 712.50 }
                    ]
                },
                {
                    onProgress: (percent, message) => {
                        setPdfProgress({ percent, message });
                    }
                }
            );

            // Download PDF
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'DR-15_Q1_2026.pdf';
            link.click();
            URL.revokeObjectURL(url);

            alert('✅ PDF generated successfully!');
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setIsGeneratingPDF(false);
            setPdfProgress({ percent: 0, message: '' });
        }
    };

    /**
     * Generate Form 941 PDF without blocking UI
     */
    const handleGenerateForm941 = async () => {
        setIsGeneratingPDF(true);
        setPdfProgress({ percent: 0, message: 'Starting...' });

        try {
            const pdfBlob = await asyncPDFService.generateForm941(
                {
                    employerName: 'AccountExpress Demo',
                    ein: '12-3456789',
                    quarter: 'Q1',
                    year: '2026',
                    employeeCount: 10,
                    totalWages: 150000,
                    federalTax: 22500,
                    socialSecurityWages: 150000,
                    socialSecurityTax: 9300,
                    medicareWages: 150000,
                    medicareTax: 2175,
                    totalTaxes: 33975
                },
                {
                    onProgress: (percent, message) => {
                        setPdfProgress({ percent, message });
                    }
                }
            );

            // Download PDF
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'Form_941_Q1_2026.pdf';
            link.click();
            URL.revokeObjectURL(url);

            alert('✅ Form 941 generated successfully!');
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setIsGeneratingPDF(false);
            setPdfProgress({ percent: 0, message: '' });
        }
    };

    /**
     * Process CSV file without blocking UI
     */
    const handleProcessCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessingCSV(true);
        setCsvProgress({ percent: 0, message: 'Starting...' });

        try {
            const result = await asyncCSVService.parseCSV(file, {
                header: true,
                onProgress: (percent, message) => {
                    setCsvProgress({ percent, message });
                }
            });

            if (result.success) {
                alert(
                    `✅ CSV processed successfully!\n\n` +
                    `Rows: ${result.metadata?.rowCount}\n` +
                    `Columns: ${result.metadata?.columnCount}\n` +
                    `Valid: ${result.metadata?.validRows}\n` +
                    `Invalid: ${result.metadata?.invalidRows}\n` +
                    `Time: ${result.metadata?.processingTime}ms`
                );
                console.log('CSV Data:', result.data);
            } else {
                alert(`❌ Errors:\n${result.errors?.join('\n')}`);
            }
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setIsProcessingCSV(false);
            setCsvProgress({ percent: 0, message: '' });
            event.target.value = ''; // Reset file input
        }
    };

    /**
     * Export data to CSV without blocking UI
     */
    const handleExportCSV = async () => {
        setIsProcessingCSV(true);
        setCsvProgress({ percent: 0, message: 'Starting...' });

        try {
            const sampleData = [
                { name: 'John Doe', email: 'john@example.com', amount: 1000 },
                { name: 'Jane Smith', email: 'jane@example.com', amount: 1500 },
                { name: 'Bob Johnson', email: 'bob@example.com', amount: 2000 }
            ];

            await asyncCSVService.exportToCSV(sampleData, 'export_demo.csv', {
                header: true,
                onProgress: (percent, message) => {
                    setCsvProgress({ percent, message });
                }
            });

            alert('✅ CSV exported successfully!');
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setIsProcessingCSV(false);
            setCsvProgress({ percent: 0, message: '' });
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>🚀 Async Operations Demo</h2>
            <p style={styles.subtitle}>
                Generate PDFs and process CSV files without blocking the UI
            </p>

            {/* PDF Generation Section */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>📄 PDF Generation (Web Worker)</h3>

                <div style={styles.buttonGroup}>
                    <button
                        onClick={handleGenerateDR15}
                        disabled={isGeneratingPDF}
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                    >
                        {isGeneratingPDF ? '⏳ Generating...' : '📊 Generate DR-15'}
                    </button>

                    <button
                        onClick={handleGenerateForm941}
                        disabled={isGeneratingPDF}
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                    >
                        {isGeneratingPDF ? '⏳ Generating...' : '📋 Generate Form 941'}
                    </button>
                </div>

                {isGeneratingPDF && (
                    <div style={styles.progressBox}>
                        <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${pdfProgress.percent}%` }}></div>
                        </div>
                        <p style={styles.progressText}>
                            {pdfProgress.message} ({pdfProgress.percent}%)
                        </p>
                    </div>
                )}
            </div>

            {/* CSV Processing Section */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>📊 CSV Processing (Web Worker)</h3>

                <div style={styles.buttonGroup}>
                    <label style={styles.fileInputLabel}>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleProcessCSV}
                            disabled={isProcessingCSV}
                            style={styles.fileInput}
                        />
                        <span style={{ ...styles.button, ...styles.buttonSecondary }}>
                            {isProcessingCSV ? '⏳ Processing...' : '📁 Process CSV File'}
                        </span>
                    </label>

                    <button
                        onClick={handleExportCSV}
                        disabled={isProcessingCSV}
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                    >
                        {isProcessingCSV ? '⏳ Exporting...' : '💾 Export Sample CSV'}
                    </button>
                </div>

                {isProcessingCSV && (
                    <div style={styles.progressBox}>
                        <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${csvProgress.percent}%` }}></div>
                        </div>
                        <p style={styles.progressText}>
                            {csvProgress.message} ({csvProgress.percent}%)
                        </p>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div style={styles.infoBox}>
                <h4 style={styles.infoTitle}>ℹ️ How it works</h4>
                <ul style={styles.infoList}>
                    <li>PDF generation runs in a Web Worker (background thread)</li>
                    <li>CSV processing runs in a separate Web Worker</li>
                    <li>UI remains responsive during heavy operations</li>
                    <li>Progress is reported in real-time</li>
                    <li>Workers are automatically cleaned up after completion</li>
                </ul>
            </div>

            {/* Performance Test */}
            <div style={styles.testBox}>
                <h4 style={styles.testTitle}>🧪 UI Responsiveness Test</h4>
                <p style={styles.testText}>
                    Try clicking this button while generating a PDF or processing CSV:
                </p>
                <button
                    onClick={() => alert('✅ UI is responsive!')}
                    style={{ ...styles.button, ...styles.buttonTest }}
                >
                    Click Me!
                </button>
                <p style={styles.testHint}>
                    If the UI was blocked, this button wouldn't respond immediately.
                </p>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    title: {
        fontSize: '28px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '8px'
    },
    subtitle: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '30px'
    },
    section: {
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '20px'
    },
    sectionTitle: {
        fontSize: '20px',
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: '16px'
    },
    buttonGroup: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap' as const
    },
    button: {
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: '500',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    buttonPrimary: {
        backgroundColor: '#007bff',
        color: '#fff'
    },
    buttonSecondary: {
        backgroundColor: '#6c757d',
        color: '#fff'
    },
    buttonTest: {
        backgroundColor: '#28a745',
        color: '#fff'
    },
    fileInputLabel: {
        display: 'inline-block',
        cursor: 'pointer'
    },
    fileInput: {
        display: 'none'
    },
    progressBox: {
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px'
    },
    progressBar: {
        width: '100%',
        height: '24px',
        backgroundColor: '#e0e0e0',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '8px'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007bff',
        transition: 'width 0.3s ease'
    },
    progressText: {
        fontSize: '14px',
        color: '#666',
        margin: '0',
        textAlign: 'center' as const
    },
    infoBox: {
        backgroundColor: '#e7f3ff',
        border: '1px solid #007bff',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
    },
    infoTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#007bff',
        marginBottom: '12px'
    },
    infoList: {
        margin: '0',
        paddingLeft: '20px',
        fontSize: '14px',
        color: '#333',
        lineHeight: '1.6'
    },
    testBox: {
        backgroundColor: '#f0f8ff',
        border: '2px dashed #28a745',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center' as const
    },
    testTitle: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#28a745',
        marginBottom: '12px'
    },
    testText: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '16px'
    },
    testHint: {
        fontSize: '12px',
        color: '#999',
        marginTop: '12px',
        fontStyle: 'italic' as const
    }
};
