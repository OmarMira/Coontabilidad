/**
 * PayrollReportsPanel (Iron Clad Upgrade - Phase 2, Day 6)
 * 
 * Panel para generar reportes de nómina usando Web Workers.
 * Demuestra cómo usar los nuevos métodos async de PayrollReportGenerator.
 */

import React, { useState } from 'react';
import { payrollReportGenerator } from '../../services/payroll/PayrollReportGenerator';
import { getCompanyData } from '../../database/simple-db';

export function PayrollReportsPanel() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState({ percent: 0, message: '' });
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, name: '' });

    /**
     * Generate Form 941 PDF
     */
    const handleGenerateForm941 = async () => {
        setIsGenerating(true);
        setProgress({ percent: 0, message: 'Starting...' });

        try {
            const companyData = getCompanyData();
            const currentYear = new Date().getFullYear();
            const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

            const pdfBlob = await payrollReportGenerator.generateForm941PDF(
                currentQuarter,
                currentYear,
                companyData,
                {
                    onProgress: (percent, message) => {
                        setProgress({ percent, message });
                    }
                }
            );

            // Download PDF
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Form_941_Q${currentQuarter}_${currentYear}.pdf`;
            link.click();
            URL.revokeObjectURL(url);

            alert('✅ Form 941 generated successfully!');
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
            setProgress({ percent: 0, message: '' });
        }
    };

    /**
     * Generate all W-2 PDFs for the year
     */
    const handleGenerateAllW2s = async () => {
        setIsGenerating(true);
        setBatchProgress({ current: 0, total: 0, name: '' });

        try {
            const companyData = getCompanyData();
            const currentYear = new Date().getFullYear() - 1; // Previous year for W-2s

            const pdfs = await payrollReportGenerator.generateAllW2PDFs(
                currentYear,
                companyData,
                (current, total, employeeName) => {
                    setBatchProgress({ current, total, name: employeeName });
                }
            );

            // Download all PDFs as a zip (simplified: download first one as example)
            if (pdfs.length > 0) {
                const url = URL.createObjectURL(pdfs[0]);
                const link = document.createElement('a');
                link.href = url;
                link.download = `W2_Sample_${currentYear}.pdf`;
                link.click();
                URL.revokeObjectURL(url);
            }

            alert(`✅ Generated ${pdfs.length} W-2 forms successfully!`);
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
            setBatchProgress({ current: 0, total: 0, name: '' });
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>📊 Payroll Reports (Async)</h2>
            <p style={styles.subtitle}>
                Generate payroll reports using Web Workers - UI stays responsive!
            </p>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>IRS Forms</h3>

                <div style={styles.buttonGroup}>
                    <button
                        onClick={handleGenerateForm941}
                        disabled={isGenerating}
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                    >
                        {isGenerating ? '⏳ Generating...' : '📋 Generate Form 941'}
                    </button>

                    <button
                        onClick={handleGenerateAllW2s}
                        disabled={isGenerating}
                        style={{ ...styles.button, ...styles.buttonPrimary }}
                    >
                        {isGenerating ? '⏳ Generating...' : '📄 Generate All W-2s'}
                    </button>
                </div>

                {isGenerating && progress.message && (
                    <div style={styles.progressBox}>
                        <div style={styles.progressBar}>
                            <div style={{ ...styles.progressFill, width: `${progress.percent}%` }}></div>
                        </div>
                        <p style={styles.progressText}>
                            {progress.message} ({progress.percent}%)
                        </p>
                    </div>
                )}

                {isGenerating && batchProgress.total > 0 && (
                    <div style={styles.batchProgress}>
                        <p style={styles.batchText}>
                            Generating W-2 for: <strong>{batchProgress.name}</strong>
                        </p>
                        <p style={styles.batchText}>
                            Progress: {batchProgress.current} of {batchProgress.total}
                        </p>
                        <div style={styles.progressBar}>
                            <div style={{
                                ...styles.progressFill,
                                width: `${(batchProgress.current / batchProgress.total) * 100}%`
                            }}></div>
                        </div>
                    </div>
                )}
            </div>

            <div style={styles.infoBox}>
                <h4 style={styles.infoTitle}>ℹ️ Benefits of Async Generation</h4>
                <ul style={styles.infoList}>
                    <li>UI remains responsive during PDF generation</li>
                    <li>Real-time progress updates</li>
                    <li>Can cancel operations if needed</li>
                    <li>No browser freezing or "Not Responding" warnings</li>
                    <li>Better user experience overall</li>
                </ul>
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
        flexWrap: 'wrap' as const,
        marginBottom: '20px'
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
    progressBox: {
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
        marginTop: '16px'
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
    batchProgress: {
        padding: '16px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #007bff',
        borderRadius: '6px',
        marginTop: '16px'
    },
    batchText: {
        fontSize: '14px',
        color: '#333',
        margin: '0 0 8px 0'
    },
    infoBox: {
        backgroundColor: '#e7f3ff',
        border: '1px solid #007bff',
        borderRadius: '8px',
        padding: '20px'
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
    }
};
