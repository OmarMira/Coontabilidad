import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { DR15Report } from '../../../services/TaxReportingService';
import { CurrencyUtils } from '../../../lib/currency';

// Estilos PDF estándar
const styles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 30 },
    header: { marginBottom: 20, borderBottom: '2px solid #000', paddingBottom: 10 },
    title: { fontSize: 18, textAlign: 'center', marginBottom: 5 },
    subtitle: { fontSize: 12, textAlign: 'center', color: '#444' },

    section: { marginVertical: 10, padding: 10, border: '1px solid #EEE', borderRadius: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    label: { fontSize: 10, color: '#555' },
    value: { fontSize: 10, fontFamily: 'Helvetica-Bold' },

    // Tabla
    table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#E5E7EB', marginTop: 20 },
    tableRow: { margin: 'auto', flexDirection: 'row', borderBottom: 1, borderColor: '#E5E7EB', minHeight: 25, alignItems: 'center' },
    tableCol: { width: '25%', borderRight: 1, borderColor: '#E5E7EB', padding: 5 },
    tableCell: { fontSize: 9, textAlign: 'right' },
    tableCellLeft: { fontSize: 9, textAlign: 'left' },

    headerBg: { backgroundColor: '#F3F4F6' },

    // Totales
    totalsBox: { marginTop: 20, padding: 15, backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    totalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
    totalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1F2937' },

    // Checksum
    checksumBox: { marginTop: 40, padding: 10, border: '1px dashed #9CA3AF', backgroundColor: '#F0FDFA' },
    checksumLabel: { fontSize: 8, color: '#0F766E', marginBottom: 2, fontFamily: 'Helvetica-Bold' },
    checksumText: { fontSize: 8, fontFamily: 'Courier', color: '#0F766E' },

    footer: { position: 'absolute', bottom: 30, left: 30, right: 30, fontSize: 8, textAlign: 'center', color: '#9CA3AF' }
});

interface DR15PDFProps {
    report: DR15Report;
}

export const DR15PDFDocument: React.FC<DR15PDFProps> = ({ report }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Cabecera Oficial */}
                <View style={styles.header}>
                    <Text style={styles.title}>FLORIDA DEPARTMENT OF REVENUE</Text>
                    <Text style={styles.subtitle}>DR-15 Sales and Use Tax Return</Text>
                </View>

                {/* Información del Contribuyente */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Taxpayer FEIN:</Text>
                        <Text style={styles.value}>{report.taxpayerInfo.fein}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Reporting Period:</Text>
                        <Text style={styles.value}>{report.taxpayerInfo.period}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Generation Date:</Text>
                        <Text style={styles.value}>{new Date(report.verification.generatedAt).toLocaleString()}</Text>
                    </View>
                </View>

                {/* Tabla de Desglose por Condado */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.headerBg]}>
                        <View style={styles.tableCol}><Text style={[styles.tableCellLeft, { fontWeight: 'bold' }]}>County</Text></View>
                        <View style={styles.tableCol}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Gross Sales</Text></View>
                        <View style={styles.tableCol}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Tax Collected</Text></View>
                        <View style={styles.tableCol}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Surtax *</Text></View>
                    </View>
                    {report.countySummary.map((c, i) => (
                        <View key={i} style={styles.tableRow}>
                            <View style={styles.tableCol}><Text style={styles.tableCellLeft}>{c.code}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{CurrencyUtils.format(c.sales)}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>{CurrencyUtils.format(c.tax)}</Text></View>
                            <View style={styles.tableCol}><Text style={styles.tableCell}>$0.00</Text></View>
                        </View>
                    ))}
                </View>
                <Text style={{ fontSize: 8, color: '#666', marginTop: 5, fontStyle: 'italic' }}>* Discretionary Sales Surtax calculated based on county rates.</Text>

                {/* Totales y Pago */}
                <View style={styles.totalsBox}>
                    <View style={styles.totalRow}>
                        <Text style={{ fontSize: 10 }}>Total Gross Sales:</Text>
                        <Text style={{ fontSize: 10 }}>{CurrencyUtils.format(report.totals.sales)}</Text>
                    </View>
                    <View style={[styles.totalRow, { marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 5 }]}>
                        <Text style={styles.totalLabel}>TOTAL TAX DUE:</Text>
                        <Text style={styles.totalValue}>{CurrencyUtils.format(report.totals.tax)}</Text>
                    </View>
                </View>

                {/* Sello Forense */}
                <View style={styles.checksumBox}>
                    <Text style={styles.checksumLabel}>IRON CORE FORENSIC SEAL:</Text>
                    <Text style={styles.checksumText}>{report.verification.checksum}</Text>
                </View>

                <Text style={styles.footer}>
                    Electronic Copy generated by AccountExpress Iron Core. Valid for e-filing.
                </Text>
            </Page>
        </Document>
    );
};
