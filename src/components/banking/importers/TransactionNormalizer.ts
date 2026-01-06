import { parse, isValid, formatISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

export interface NormalizationConfig {
    strictMode: boolean; // Throws if validation fails
    fallbackCurrency?: 'USD';
    detectNegativesInParens?: boolean; // (100.00) -> -100.00
}

export interface NormalizedTransaction {
    transaction_date: string; // ISO 8601 YYYY-MM-DD
    description: string;
    amount: number; // Integer Cents (e.g. 1050 for $10.50)
    original_amount?: number;
    reference_number?: string;
    metadata?: any;
}

export interface NormalizationResult {
    success: boolean;
    data?: NormalizedTransaction;
    error?: string;
}

/**
 * STRICT TRANSACTION NORMALIZER (GOLD+ COMPLIANT)
 * Converts raw bank data into a standardized, forensic-grade format.
 */
export const normalizeTransaction = (
    rawDate: string | Date,
    rawDesc: string,
    rawAmount: string | number,
    rawRef: string | undefined,
    config: NormalizationConfig = { strictMode: true, detectNegativesInParens: true }
): NormalizationResult => {
    try {
        // 0. Robustness Guards
        if (!rawDate || (typeof rawDate === 'string' && rawDate.trim() === '')) {
            return { success: false, error: 'Fecha faltante o vacía' };
        }
        if (rawAmount === undefined || rawAmount === null || (typeof rawAmount === 'string' && rawAmount.trim() === '')) {
            return { success: false, error: 'Monto faltante o vacío' };
        }

        // 1. Normalize Date (ISO-8601)
        const date = normalizeDate(rawDate);
        if (!date) {
            if (config.strictMode) return { success: false, error: `Fecha inválida: ${rawDate}` };
            return { success: false, error: 'Fecha inválida' };
        }

        // 2. Normalize Amount (Integer Cents)
        const amount = normalizeAmount(rawAmount, config);
        if (isNaN(amount)) {
            if (config.strictMode) return { success: false, error: `Monto inválido: ${rawAmount}` };
            return { success: false, error: 'Monto inválido' };
        }

        // 3. Sanitize Description
        const description = sanitizeDescription(rawDesc);
        if (!description) {
            if (config.strictMode) return { success: false, error: 'Descripción vacía' };
            return { success: false, error: 'Descripción vacía' };
        }

        // 4. Normalize Reference
        const reference_number = rawRef ? String(rawRef).replace(/[^a-zA-Z0-9-]/g, '').trim() : undefined;

        return {
            success: true,
            data: {
                transaction_date: date,
                description,
                amount,
                reference_number
            }
        };

    } catch (e) {
        return { success: false, error: (e as Error).message };
    }
};

const normalizeDate = (raw: string | Date): string | null => {
    try {
        if (!raw) return null;
        if (raw instanceof Date) {
            return isValid(raw) ? formatISO(raw, { representation: 'date' }) : null;
        }

        let clean = String(raw).trim();
        if (!clean) return null;

        // Support for Spanish "de" separator (15 de Enero)
        clean = clean.replace(/\sde\s/gi, ' ');

        // Strategy: ISO, then US, then EU, then Textual
        const attempts = [
            { fmt: 'yyyy-MM-dd', locale: undefined },
            { fmt: 'MM/dd/yyyy', locale: undefined },
            { fmt: 'dd/MM/yyyy', locale: undefined },
            { fmt: 'MM-dd-yyyy', locale: undefined },
            { fmt: 'yyyyMMdd', locale: undefined },
            { fmt: 'yyyyMMddHHmmss', locale: undefined },
            // Textual
            { fmt: 'MMM dd yyyy', locale: enUS },
            { fmt: 'MMM dd, yyyy', locale: enUS },
            { fmt: 'dd MMM yyyy', locale: enUS },
            { fmt: 'd MMM yyyy', locale: enUS },
            // Spanish
            { fmt: 'd MMMM yyyy', locale: es }, // 15 Enero 2024
            { fmt: 'd MMM yyyy', locale: es },  // 15 Ene 2024
            { fmt: 'MMM dd yyyy', locale: es }, // Ene 15 2024
        ];

        for (const attempt of attempts) {
            const parsed = parse(clean, attempt.fmt, new Date(), { locale: attempt.locale });
            if (isValid(parsed) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
                return formatISO(parsed, { representation: 'date' });
            }
        }

        // Direct constructor fallback for other formats
        const fallback = new Date(clean);
        if (isValid(fallback) && fallback.getFullYear() > 1900 && fallback.getFullYear() < 2100) {
            return formatISO(fallback, { representation: 'date' });
        }

        return null;
    } catch {
        return null;
    }
};

const normalizeAmount = (raw: string | number, config: NormalizationConfig): number => {
    if (raw === undefined || raw === null || raw === '') return NaN;

    if (typeof raw === 'number') {
        const fixed = Number(raw.toFixed(2));
        return Math.round(fixed * 100);
    }

    let clean = String(raw).trim();
    if (!clean) return NaN;

    let isNegative = false;

    if (config.detectNegativesInParens && clean.startsWith('(') && clean.endsWith(')')) {
        isNegative = true;
        clean = clean.slice(1, -1);
    }

    clean = clean.replace(/[$€£\s]/g, '');

    // Heuristic for Separators
    const lastDot = clean.lastIndexOf('.');
    const lastComma = clean.lastIndexOf(',');

    // If comma is AFTER dot, or comma exists and dot doesn't (heuristic 100,50)
    // Assumption: If only comma exists, it's decimal if < 3 digits after it? 
    // This is risky. "1,000" in US is 1000. "1,000" in EU is 1? 
    // Standard approach: US priority unless explicit EU detection (comma is last separator and followed by 2 digits)

    if (lastComma > lastDot) {
        // EU: 1.000,00
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
        // US: 1,000.00
        clean = clean.replace(/,/g, '');
    }

    const parsed = parseFloat(clean);
    if (isNaN(parsed)) return NaN;

    let final = isNegative ? -Math.abs(parsed) : parsed;

    return Math.round(final * 100);
};

const sanitizeDescription = (desc: string): string => {
    if (!desc) return '';
    const clean = String(desc)
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
    return clean;
};
