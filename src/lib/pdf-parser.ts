import { extractTextFromPDF } from './pdf-extractor';
import { normalizeTransaction, NormalizationResult } from '@/components/banking/importers/TransactionNormalizer';

export const parseBankPDF = async (file: File): Promise<NormalizationResult[]> => {

    // 1. Text Extraction
    const lines = await extractTextFromPDF(file);
    const results: NormalizationResult[] = [];

    // 2. Year Context Detection
    const fullText = lines.join('\n');
    const yearMatches = fullText.match(/\b20[2-3]\d\b/g);
    const detectedYears = yearMatches ? [...new Set(yearMatches)].sort().map(Number) : [new Date().getFullYear()];
    const primaryYear = detectedYears[detectedYears.length - 1];

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

        // A. DETECT SECTIONS (Context Switch)
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
        if (cleanLine.match(/^(Summary|Daily ledger balances|Account summary|Opening balance|Ending balance|Daily balance)/i)) {
            ignoreSection = true;
            return;
        }

        // B. FILTER NOISE & IGNORED SECTIONS
        if (ignoreSection) return;
        if (cleanLine.match(/Page \d|Balance|Saldo|Continued|Statement|Period|Beginning|Ending|Summary|Total/i)) return; // Line-level noise

        // C. PARSE TRANSACTION
        const dateMatch = cleanLine.match(dateRegex);
        const amounts = cleanLine.match(amountRegex);

        if (dateMatch && amounts) {
            let rawDate = dateMatch[0].trim();
            let rawAmount = amounts[0];
            let probableBalance: string | undefined = undefined;

            // Balance Extraction Heuristic
            // If we have > 1 number, and the last one is clearly separate...
            if (amounts.length > 1) {
                // Usually: Amount is first, Balance is last.
                // UNLESS distinct Debit/Credit columns exist.
                // Assuming standard single-column amount list or Amount+Balance.
                rawAmount = amounts[0];
                probableBalance = amounts[amounts.length - 1];
            }

            // D. SMART YEAR LOGIC
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
                .replace(probableBalance || '', '') // Remove balance from desc too
                .replace(/\s+/g, ' ')
                .trim();

            const result = normalizeTransaction(rawDate, rawDesc, rawAmount, undefined);

            if (result.success && result.data) {
                // E. APPLY SECTION SIGN
                if (currentSign !== 0) {
                    const absAmount = Math.abs(result.data.amount);
                    result.data.amount = absAmount * currentSign;
                }

                // F. SAVE BALANCE IN METADATA
                if (probableBalance) {
                    result.data.metadata = { ...result.data.metadata, extracted_balance: probableBalance };
                }

                results.push(result);
            }
        }
    });

    return results;
};
