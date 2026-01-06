export type BankFileFormat =
    | 'CSV_CHASE' | 'CSV_BOA' | 'CSV_WELLS_FARGO' | 'CSV_HISPANO' | 'CSV_GENERIC'
    | 'OFX_2_XML' | 'OFX_1_SGML' | 'QFX'
    | 'PDF_STATEMENT' | 'QBO_JSON'
    | 'UNKNOWN';

export interface DetectionResult {
    format: BankFileFormat;
    confidence: number; // 0-100%
    suggestedParser: string; // 'CSV' | 'OFX' | 'PDF'
    metadata: {
        bankName?: string;
        dateFormat?: string;
        encoding?: string;
        delimiter?: string;
    };
}

const COMMON_BROWSERS_HEADERS = [
    'User-Agent', 'Accept', 'Host', 'Connection'
];

// Helper: Magic Bytes / Content Signature
const SIGNATURES = {
    PDF: '%PDF',
    OFX_HEADER: 'OFXHEADER',
    OFX_XML_TAG: '<OFX>',
    OFX_SGML_TAG: '<OFX>'
};

/**
 * Detects the format of a bank transaction file using forensic analysis.
 * Uses magic bytes, extension matching, and content heuristics.
 */
export const detectBankFormat = async (file: File): Promise<DetectionResult> => {
    const textSample = await readFirstChars(file, 2048);
    const extension = file.name.split('.').pop()?.toLowerCase();

    // 1. Check Magic Bytes / Clear Signatures
    if (file.type === 'application/pdf' || textSample.startsWith(SIGNATURES.PDF)) {
        return {
            format: 'PDF_STATEMENT',
            confidence: 100,
            suggestedParser: 'PDF',
            metadata: {}
        };
    }

    if (textSample.includes(SIGNATURES.OFX_HEADER) || textSample.includes(SIGNATURES.OFX_XML_TAG)) {
        // Distinguish OFX Versions
        const isXML = textSample.includes('<?xml') || textSample.includes('OFXHEADER:200');
        return {
            format: isXML ? 'OFX_2_XML' : 'OFX_1_SGML',
            confidence: 95,
            suggestedParser: 'OFX',
            metadata: { encoding: 'US-ASCII' } // Default for old OFX
        };
    }

    // 2. CSV Analysis
    if (extension === 'csv' || textSample.includes(',') || textSample.includes(';')) {
        return analyzeCSVContent(textSample);
    }

    // 3. QFX (Quicken) - usually same as OFX but specific ext
    if (extension === 'qfx') {
        return {
            format: 'QFX',
            confidence: 90,
            suggestedParser: 'OFX',
            metadata: {}
        };
    }

    // 4. STMT (Generic Statement File)
    if (extension === 'stmt') {
        // Check for OFX signatures
        if (textSample.includes('<OFX>') || textSample.includes('OFXHEADER') || textSample.includes('<ofx>')) {
            return {
                format: 'OFX_1_SGML',
                confidence: 90,
                suggestedParser: 'OFX',
                metadata: {}
            };
        }
        // Fallback to CSV analysis
        if (textSample.includes(',') || textSample.includes(';')) {
            return analyzeCSVContent(textSample);
        }
    }

    return {
        format: 'UNKNOWN',
        confidence: 0,
        suggestedParser: 'UNKNOWN',
        metadata: {}
    };
};

function analyzeCSVContent(content: string): DetectionResult {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 1) return { format: 'UNKNOWN', confidence: 0, suggestedParser: 'CSV', metadata: {} };

    const firstLine = lines[0].toLowerCase();
    const secondLine = lines[1]?.toLowerCase();

    // Heuristics for Specific Banks
    // Chase: Date,Description,Amount
    if (firstLine.includes('date') && firstLine.includes('description') && firstLine.includes('amount')) {
        // Deep check for Chase specific columns
        if (firstLine.includes('posting date') || firstLine.includes('details')) {
            // Maybe Chase specifically
        }
        return {
            format: 'CSV_CHASE',
            confidence: 85,
            suggestedParser: 'CSV',
            metadata: { bankName: 'Chase', dateFormat: 'MM/dd/yyyy' }
        };
    }

    // BoA: Posted Date,Reference Number,Payee,Address,Amount
    if (firstLine.includes('posted date') && firstLine.includes('reference number') && firstLine.includes('payee')) {
        return {
            format: 'CSV_BOA',
            confidence: 90,
            suggestedParser: 'CSV',
            metadata: { bankName: 'Bank of America', dateFormat: 'MM/dd/yyyy' }
        };
    }

    // Wells Fargo: Date,Amount,*,Check Number,Reference,Description
    if (firstLine.includes('"date"') && firstLine.includes('"amount"') && firstLine.includes('"description"')) {
        // Often quotes in WF
        return {
            format: 'CSV_WELLS_FARGO',
            confidence: 80,
            suggestedParser: 'CSV',
            metadata: { bankName: 'Wells Fargo', dateFormat: 'MM/dd/yyyy' }
        };
    }

    // Generic Hispanic: Fecha, Concepto, Importe/Monto
    if (firstLine.includes('fecha') && (firstLine.includes('concepto') || firstLine.includes('descripción') || firstLine.includes('detalle'))) {
        return {
            format: 'CSV_HISPANO',
            confidence: 85,
            suggestedParser: 'CSV',
            metadata: { dateFormat: 'dd/MM/yyyy' }
        };
    }

    // Fallback Generic CSV
    if ((content.match(/,/g) || []).length > lines.length) { // More commas than lines implies columns
        return {
            format: 'CSV_GENERIC',
            confidence: 50,
            suggestedParser: 'CSV',
            metadata: { delimiter: ',' }
        };
    }

    return {
        format: 'UNKNOWN',
        confidence: 10,
        suggestedParser: 'CSV',
        metadata: {}
    };
}

async function readFirstChars(file: File, n: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            resolve(e.target?.result as string || '');
        };
        reader.onerror = (e) => reject(e);
        reader.readAsText(file.slice(0, n));
    });
}
