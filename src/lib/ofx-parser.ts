import { OFXStatement, OFXTransaction } from '@/types/ofx';

/**
 * Parses raw OFX/QBO content using a robust Regex-based approach (Zero-Dependencies).
 * This avoids 'xml2js' node-polyfill issues in the browser and handles mixed SGML/XML.
 */
export const parseOFX = async (content: string): Promise<OFXStatement> => {
    try {
        // 1. Basic Cleaning
        const cleanContent = content.replace(/\r/g, ''); // Normalize newlines

        // 2. Extract Transactions
        // Split by <STMTTRN> to isolate transaction blocks
        const transactions: OFXTransaction[] = [];
        const splitTrans = cleanContent.split(/<STMTTRN>/i); // Case insensitive split

        // Skip splitTrans[0] as it contains headers/account info before method
        for (let i = 1; i < splitTrans.length; i++) {
            const block = splitTrans[i];

            // To ensure we don't bleed into next sections if </STMTTRN> is missing (unlikely but possible in SGML),
            // strictly speaking SGML OFX implies newline or next tag ends it. 
            // Finding the next <STMTTRN> split handles the block end implicitly.
            // But we should stop at </STMTTRN> or </BANKTRANLIST> if present to be clean.
            let trnContent = block;
            const endTagIndex = block.search(/<\/STMTTRN>/i);
            if (endTagIndex !== -1) {
                trnContent = block.substring(0, endTagIndex);
            }

            const typeRaw = extractTag(trnContent, 'TRNTYPE');
            const amtRaw = extractTag(trnContent, 'TRNAMT');
            const dateRaw = extractTag(trnContent, 'DTPOSTED');
            const fitId = extractTag(trnContent, 'FITID');
            const name = extractTag(trnContent, 'NAME');
            const memo = extractTag(trnContent, 'MEMO');
            const checkNum = extractTag(trnContent, 'CHECKNUM');
            const refNum = extractTag(trnContent, 'REFNUM');

            if (!amtRaw || !dateRaw) continue; // Skip malformed blocks

            const amount = parseFloat(amtRaw);
            const type = mapOFXType(typeRaw, amount);

            transactions.push({
                type,
                datePosted: parseOFXDate(dateRaw), // Returns YYYY-MM-DD
                dateUser: undefined,
                amount,
                fitId: fitId || `${dateRaw}-${amount}-${i}`,
                name: (name || memo || 'Unknown').trim(),
                memo: (memo || '').trim(),
                checkNumber: checkNum || undefined,
                refNumber: refNum || undefined
            });
        }

        // 3. Extract Global Account/Header Info
        // We look at the WHOLE content or just the part before transactions.
        // Simple global regex is safe enough since these tags usually appear once in headers.
        const curDef = extractTag(cleanContent, 'CURDEF') || 'USD';
        const bankId = extractTag(cleanContent, 'BANKID') || 'Unknown';
        const acctId = extractTag(cleanContent, 'ACCTID') || 'Unknown';
        const acctType = extractTag(cleanContent, 'ACCTTYPE') || 'CHECKING';

        const ledgerBalAmt = extractTag(cleanContent, 'BALAMT');
        const ledgerBalDate = extractTag(cleanContent, 'DTASOF');

        const ledgerBalance = {
            amount: ledgerBalAmt ? parseFloat(ledgerBalAmt) : 0,
            date: parseOFXDate(ledgerBalDate || '')
        };

        const dtStart = extractTag(cleanContent, 'DTSTART');
        const dtEnd = extractTag(cleanContent, 'DTEND');

        return {
            currency: curDef,
            account: {
                bankId,
                accountId: acctId,
                accountType: acctType
            },
            startTime: parseOFXDate(dtStart || ''),
            endTime: parseOFXDate(dtEnd || ''),
            transactions,
            ledgerBalance
        };

    } catch (error) {
        console.error('OFX Parser Error:', error);
        throw new Error(`Failed to parse OFX/QBO file: ${(error as Error).message}`);
    }
};

/**
 * Extracts the value of a tag <TAG>VALUE
 * Handles SGML (no closing tag, ends at \n or <) and XML (closes with </TAG>)
 */
function extractTag(content: string, tagName: string): string | null {
    // Regex explanation:
    // <TAG>      : Start tag (case insensitive)
    // ([^<\n\r]+): Capture value until start of next tag (<) or newline
    // This works for SGML: <NAME>Payee Name\n
    // This works for XML:  <NAME>Payee Name</NAME> (stops at < of </NAME>)
    const regex = new RegExp(`<${tagName}>([^<\n\r]+)`, 'i');
    const match = content.match(regex);
    if (match) {
        return match[1].trim();
    }
    return null;
}

function parseOFXDate(dateString: string): string {
    if (!dateString) return new Date().toISOString().split('T')[0];
    try {
        // Expected: YYYYMMDDHHMMSS...
        const clean = dateString.trim().substring(0, 8); // YYYYMMDD
        if (clean.length < 8) return new Date().toISOString().split('T')[0];

        const y = clean.substring(0, 4);
        const m = clean.substring(4, 6);
        const d = clean.substring(6, 8);
        return `${y}-${m}-${d}`;
    } catch {
        return dateString;
    }
}

function mapOFXType(ofxType: string | null, amount: number): 'CREDIT' | 'DEBIT' | 'OTHER' {
    const t = (ofxType || '').toUpperCase();
    if (t === 'CREDIT' || t === 'DEP' || t === 'DIRECTDEP' || t === 'SRVCHG' || t === 'INT') {
        // SRVCHG is usually positive in Amount field but represents a fee? 
        // Actually map based on sign is safest fallback.
        // But 'CREDIT' explicit type means positive.
    }

    // Explicit overrides
    if (t === 'CREDIT' || t === 'DEP') return 'CREDIT';
    if (t === 'DEBIT' || t === 'PAYMENT' || t === 'CHECK' || t === 'POS') return 'DEBIT';

    // Fallback: Positive amount = Credit, Negative = Debit
    return amount >= 0 ? 'CREDIT' : 'DEBIT';
}
