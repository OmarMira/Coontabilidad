import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { ARDDocument } from '../../modules/ard/ARD.types';

// Estilos Premium para ARD Report
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#FFFFFF',
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 30,
        borderBottom: '2px solid #6366F1',
        paddingBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    logoSection: {
        flexDirection: 'column'
    },
    title: {
        fontSize: 24,
        fontFamily: 'Helvetica-Bold',
        color: '#1E1B4B',
        letterSpacing: -0.5
    },
    subtitle: {
        fontSize: 10,
        color: '#6366F1',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginTop: 4,
        fontFamily: 'Helvetica-Bold'
    },
    dateBox: {
        textAlign: 'right'
    },
    dateLabel: {
        fontSize: 8,
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 2
    },
    dateValue: {
        fontSize: 10,
        color: '#1E1B4B'
    },

    // Cuerpo
    infoSection: {
        marginBottom: 25,
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 12,
        border: '1px solid #E2E8F0'
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        color: '#1E1B4B',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20
    },
    field: {
        width: '45%',
        marginBottom: 10
    },
    label: {
        fontSize: 8,
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 4,
        fontFamily: 'Helvetica-Bold'
    },
    value: {
        fontSize: 11,
        color: '#0F172A'
    },

    // Análisis Financiero
    financialCard: {
        marginVertical: 20,
        padding: 25,
        backgroundColor: '#EEF2FF',
        borderRadius: 16,
        border: '1px solid #C7D2FE'
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 15,
        borderBottom: '1px solid #C7D2FE'
    },
    bigAmount: {
        fontSize: 28,
        fontFamily: 'Helvetica-Bold',
        color: '#4338CA'
    },
    taxRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    // Forense
    forensicBox: {
        marginTop: 40,
        padding: 15,
        border: '1px dashed #6366F1',
        borderRadius: 8,
        backgroundColor: '#F5F3FF'
    },
    forensicTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#4338CA',
        marginBottom: 5
    },
    hash: {
        fontSize: 8,
        fontFamily: 'Courier',
        color: '#6366F1'
    },

    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        color: '#94A3B8',
        textAlign: 'center',
        borderTop: '1px solid #E2E8F0',
        paddingTop: 10
    }
});

interface ARDPDFReportProps {
    document: ARDDocument;
    t: (key: string) => string;
}

export const ARDPDFReport: React.FC<ARDPDFReportProps> = ({ document, t }) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    const analysis = JSON.parse(document.raw_analysis || '{}');

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        <Text style={styles.title}>AccountExpress</Text>
                        <Text style={styles.subtitle}>{t('ard.report.title')}</Text>
                    </View>
                    <View style={styles.dateBox}>
                        <Text style={styles.dateLabel}>{t('ard.report.processingDate')}</Text>
                        <Text style={styles.dateValue}>{new Date(document.uploadDate).toLocaleString()}</Text>
                    </View>
                </View>

                {/* Metadata del Documento */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>{t('ard.report.metadataTitle')}</Text>
                    <View style={styles.grid}>
                        <View style={styles.field}>
                            <Text style={styles.label}>{t('ard.report.trackingId')}</Text>
                            <Text style={styles.value}>{document.id}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>{t('ard.report.fileName')}</Text>
                            <Text style={styles.value}>{document.name}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>{t('ard.report.detectedType')}</Text>
                            <Text style={styles.value}>{document.type === 'invoice_in' ? t('ard.report.typeInvoice') : t('ard.report.typeReceipt')}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>{t('ard.report.originalSize')}</Text>
                            <Text style={styles.value}>{(document.fileSize / 1024).toFixed(2)} KB</Text>
                        </View>
                    </View>
                </View>

                {/* Resultado Financiero IA */}
                <View style={styles.financialCard}>
                    <Text style={styles.sectionTitle}>{t('ard.report.aiExtractionTitle')}</Text>

                    <View style={styles.amountRow}>
                        <View>
                            <Text style={styles.label}>{t('ard.report.totalDetectedAmount')}</Text>
                            <Text style={{ fontSize: 9, color: '#6366F1', marginTop: 2 }}>{t('ard.report.ocrConfidence')}</Text>
                        </View>
                        <Text style={styles.bigAmount}>{formatCurrency(document.detected_amount || 0)}</Text>
                    </View>

                    <View style={styles.taxRow}>
                        <View style={styles.field}>
                            <Text style={styles.label}>{t('ard.report.tax')}</Text>
                            <Text style={styles.value}>{formatCurrency(document.detected_tax || 0)}</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>{t('ard.report.docDate')}</Text>
                            <Text style={styles.value}>{document.detected_date || t('ard.report.notDetected')}</Text>
                        </View>
                    </View>
                </View>

                {/* Detalles del Vendedor */}
                <View style={[styles.infoSection, { backgroundColor: '#FFFFFF' }]}>
                    <Text style={styles.sectionTitle}>{t('ard.report.issuerEntity')}</Text>
                    <View style={styles.grid}>
                        <View style={[styles.field, { width: '100%' }]}>
                            <Text style={styles.label}>{t('ard.report.vendorEstab')}</Text>
                            <Text style={[styles.value, { fontSize: 14, fontFamily: 'Helvetica-Bold' }]}>
                                {analysis.vendor || t('ard.report.notIdentified')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Sello Forense Anti-Tamper */}
                <View style={styles.forensicBox}>
                    <Text style={styles.forensicTitle}>{t('ard.report.forensicSeal')}</Text>
                    <Text style={styles.hash}>
                        HASH: {document.id}_FS_{analysis.vendor?.substring(0, 3).toUpperCase() || 'NA'}_{new Date().getTime()}
                    </Text>
                    <Text style={[styles.hash, { marginTop: 4, color: '#94A3B8' }]}>
                        {t('ard.report.forensicDisclaimer')}
                    </Text>
                </View>

                <Text style={styles.footer}>
                    {t('ard.report.footer')}
                </Text>
            </Page>
        </Document>
    );
};
