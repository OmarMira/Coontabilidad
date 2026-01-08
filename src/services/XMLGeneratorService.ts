import { DR15Report } from './TaxReportingService';

export class XMLGeneratorService {
    /**
     * Generates a compliant XML string for Florida DR-15 e-filing.
     * Includes the Iron Core Forensic Checksum for integrity verification.
     */
    static generateDR15XML(report: DR15Report): string {
        // XML Header with schema reference
        const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';

        // Constructing the XML body
        return `${xmlHeader}
<FDOR_DR15_Return xmlns="http://www.floridarevenue.com/schemas/dr15/v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <TransmissionHeader>
        <TransmissionId>${globalThis.crypto?.randomUUID() || 'UUID-MOCK'}</TransmissionId>
        <Timestamp>${report.verification.generatedAt}</Timestamp>
        <SoftwareProvider>AccountExpress Iron Core v1.0</SoftwareProvider>
        <ForensicChecksum>${report.verification.checksum}</ForensicChecksum>
    </TransmissionHeader>
    <TaxpayerData>
        <FEIN>${report.taxpayerInfo.fein}</FEIN>
        <ReportingPeriod>${report.taxpayerInfo.period}</ReportingPeriod>
    </TaxpayerData>
    <FinancialData>
        <TotalGrossSales>${report.totals.sales}</TotalGrossSales>
        <TotalTaxDue>${report.totals.tax}</TotalTaxDue>
        <CountyBreakdown>
            ${report.countySummary.map(c => `
            <CountyRecord>
                <CountyCode>${c.code}</CountyCode>
                <GrossSales>${c.sales}</GrossSales>
                <TaxCollected>${c.tax}</TaxCollected>
                <SurtaxDue>0</SurtaxDue>
            </CountyRecord>`).join('')}
        </CountyBreakdown>
    </FinancialData>
</FDOR_DR15_Return>`;
    }
}
