import { extractTextFromPDF } from './pdf-extractor';
import { normalizeTransaction, NormalizationResult } from '@/components/banking/importers/TransactionNormalizer';

export interface BankStatementResults {
    transactions?: NormalizationResult[];
    data?: NormalizationResult[];
    openingBalance?: number;
    endingBalance?: number;
    accountNumber?: string;
    bankName?: string;
    routingNumber?: string;
}

export const parseBankPDF = async (file: File): Promise<BankStatementResults> => {

    // 1. Text Extraction
    const lines = await extractTextFromPDF(file);
    const results: NormalizationResult[] = [];
    let openingBalance: number | undefined;
    let endingBalance: number | undefined;
    let accountNumber: string | undefined;
    let bankName: string | undefined;
    let routingNumber: string | undefined;

    // 2. Year Context Detection
    const fullText = lines.join('\n');
    const yearMatches = fullText.match(/\b20[2-3]\d\b/g);
    const detectedYears = yearMatches ? [...new Set(yearMatches)].sort().map(Number) : [new Date().getFullYear()];
    const primaryYear = detectedYears[detectedYears.length - 1];

    // 2.1 Bank Name Detection
    const knownBanks = [
        { name: 'CHASE', pattern: /CHASE|JPMORGAN/i },
        { name: 'BANK OF AMERICA', pattern: /BANK OF AMERICA|BOFA/i },
        { name: 'WELLS FARGO', pattern: /WELLS FARGO/i },
        { name: 'CITIBANK', pattern: /CITIBANK|CITI\s?BANK/i },
        { name: 'AMEX', pattern: /AMERICAN EXPRESS|AMEX/i },
        { name: 'TD BANK', pattern: /TD BANK/i },
        { name: 'SUNTRUST', pattern: /SUNTRUST/i },
        { name: 'TRUIST', pattern: /TRUIST/i },
        { name: 'REGIONS', pattern: /REGIONS BANK/i }
    ];

    for (const bank of knownBanks) {
        if (fullText.match(bank.pattern)) {
            bankName = bank.name;
            break;
        }
    }

    // 3. Regex Definitions
    const months = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Abr|Ago|Dic|Set";
    const dateRegex = new RegExp(
        `(\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})|` +
        `(\\d{4}[/-]\\d{1,2}[/-]\\d{1,2})|` +
        `((?:${months})[a-z]*\\.?\\s\\d{1,2},?\\s\\d{2,4})|` +
        `(\\d{1,2}\\s+(?:de\\s+)?(?:${months})[a-z]*\\.?,?\\s+\\d{2,4})|` +
        `^(\\d{1,2}[/-]\\d{1,2})\\s|\\s(\\d{1,2}[/-]\\d{1,2})\\s`,
        'i'
    );

    const amountRegex = /([(]?\-?\s?[$€£]?\s?[\d,.]+[.,]\d{2}[)]?)/g;

    // SECTION STATE FOR SIGN DETECTION
    let currentSign = 0; // 0 = Unknown (Auto), 1 = Deposits (Force Positive), -1 = Withdrawals (Force Negative)
    let ignoreSection = false; // Flag to skip non-transactional data blocks (e.g. Daily Balances)

    lines.forEach((line) => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

        // A. DETECT ACCOUNT NUMBER
        if (!accountNumber) {
            const accMatch = cleanLine.match(/(?:Account Number|Número de cuenta|Acc #|Account #)[:\s]+(\d+[\d\s-]*\d+)/i);
            if (accMatch) {
                accountNumber = accMatch[1].replace(/\s/g, '');
            }
        }

        if (!routingNumber) {
            const routeMatch = cleanLine.match(/(?:Routing|Ruta|RTN|ABA)[:\s]+(\d{9})/i);
            if (routeMatch) {
                routingNumber = routeMatch[1];
            }
        }

        // B. DETECT BALANCES (Summary detection)
        if (cleanLine.match(/(Opening balance|Beginning balance|Saldo inicial|Balance inicial)/i)) {
            const amounts = cleanLine.match(amountRegex);
            if (amounts) {
                const res = normalizeTransaction('2024-01-01', 'BALANCE', amounts[0], undefined);
                if (res.success && res.data) openingBalance = res.data.amount;
            }
        }
        if (cleanLine.match(/(Ending balance|Final balance|Saldo final|Balance final|Closing balance)/i)) {
            const amounts = cleanLine.match(amountRegex);
            if (amounts) {
                const res = normalizeTransaction('2024-01-01', 'BALANCE', amounts[0], undefined);
                if (res.success && res.data) endingBalance = res.data.amount;
            }
        }

        // B. DETECT SECTIONS (Context Switch)
        // Transitions that ENABLE parsing
        if (cleanLine.match(/^(Deposits|Credits|Additions|Depositos|Abonos)/i) && cleanLine.length < 50) {
            currentSign = 1;
            ignoreSection = false;
            return;
        }
        if (cleanLine.match(/^(Withdrawals|Debits|Checks|Payments|Retiros|Cargos|Cheques|Service fees|Service charges)/i) && cleanLine.length < 50) {
            currentSign = -1;
            ignoreSection = false;
            return;
        }

        // Transitions that DISABLE parsing (Summaries, Daily Balances)
        if (cleanLine.match(/^(Summary|Daily ledger balances|Account summary|Daily balance)/i)) {
            ignoreSection = true;
            return;
        }

        // C. FILTER NOISE & IGNORED SECTIONS
        if (ignoreSection) return;
        if (cleanLine.match(/Page \d|Balance|Saldo|Continued|Statement|Period|Beginning|Ending|Summary|Total/i)) return; // Line-level noise

        // D. PARSE TRANSACTION
        const dateMatch = cleanLine.match(dateRegex);
        const amounts = cleanLine.match(amountRegex);

        if (dateMatch && amounts) {
            let rawDate = dateMatch[0].trim();
            let rawAmount = amounts[0];
            let probableBalance: string | undefined = undefined;

            // Balance Extraction Heuristic
            if (amounts.length > 1) {
                rawAmount = amounts[0];
                probableBalance = amounts[amounts.length - 1];
            }

            // E. SMART YEAR LOGIC
            if (rawDate.match(/^\d{1,2}[/-]\d{1,2}$/)) {
                const parts = rawDate.split(/[/-]/);
                const month = parseInt(parts[0]);
                let assignedYear = primaryYear;
                if (detectedYears.length >= 2) {
                    const minYear = detectedYears[0];
                    const maxYear = detectedYears[detectedYears.length - 1];
                    if (month > 10) assignedYear = minYear;
                    else if (month < 3) assignedYear = maxYear;
                }
                rawDate = `${rawDate}/${assignedYear}`;
            }

            const rawDesc = cleanLine
                .replace(dateMatch[0], '')
                .replace(rawAmount, '')
                .replace(probableBalance || '', '')
                .replace(/\s+/g, ' ')
                .trim();

            const result = normalizeTransaction(rawDate, rawDesc, rawAmount, undefined);

            if (result.success && result.data) {
                // F. APPLY SECTION SIGN
                if (currentSign !== 0) {
                    const absAmount = Math.abs(result.data.amount);
                    result.data.amount = absAmount * currentSign;
                }

                // G. SAVE BALANCE IN METADATA
                if (probableBalance) {
                    result.data.metadata = { ...result.data.metadata, extracted_balance: probableBalance };
                }

                results.push(result);
            }
        }
    });

    return {
        data: results,
        openingBalance,
        endingBalance,
        accountNumber,
        bankName,
        routingNumber
    };
};
