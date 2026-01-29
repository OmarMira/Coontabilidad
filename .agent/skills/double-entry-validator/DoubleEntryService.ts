import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- TYPES ---

export interface JournalEntryLine {
    account_code: number; // Integer code e.g. 1010
    debit: number;        // Cents, non-negative
    credit: number;       // Cents, non-negative
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    details?: {
        total_debit: number;
        total_credit: number;
        imbalance: number;
    };
}

interface CooRange {
    min: number;
    max: number;
    category: string;
}

interface CoaDefinition {
    ranges: CooRange[];
}

// --- SETUP ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COA_PATH = path.join(__dirname, 'resources', 'coa_base.json');

// --- LOGIC ---

/**
 * Loads the Chart of Accounts definitions.
 */
function loadCoaBase(): CoaDefinition {
    try {
        if (fs.existsSync(COA_PATH)) {
            const raw = fs.readFileSync(COA_PATH, 'utf-8');
            return JSON.parse(raw);
        }
        // Fail safe fallback? Or strict failure?
        // STRICT FAILURE for accounting logic.
        throw new Error(`Critical: COA Base Definitions not found at ${COA_PATH}`);
    } catch (error: any) {
        console.error("COA Load Error:", error);
        return { ranges: [] };
    }
}

const COA_BASE = loadCoaBase();

/**
 * Validates a Journal Entry (stateless).
 * Checks:
 * 1. Sum(Debits) == Sum(Credits).
 * 2. Account Codes exist within defined ranges.
 * 3. Individual line integrity (non-negative amounts).
 */
export function validateJournalEntry(lines: JournalEntryLine[]): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        details: { total_debit: 0, total_credit: 0, imbalance: 0 }
    };

    if (!lines || lines.length < 2) {
        result.errors.push("Invalid Entry: Must have at least 2 lines.");
        result.isValid = false;
        return result;
    }

    let totalDebit = 0;
    let totalCredit = 0;

    // 1. Line Validation
    for (const [index, line] of lines.entries()) {
        // A. Basic Integrity
        if (!Number.isInteger(line.debit) || !Number.isInteger(line.credit) || !Number.isInteger(line.account_code)) {
            result.errors.push(`Line ${index + 1}: Amounts and Codes must be Integers.`);
            continue; // Critical fail logic handled at end
        }

        if (line.debit < 0 || line.credit < 0) {
            result.errors.push(`Line ${index + 1}: Negative amounts strictly forbidden.`);
        }

        if (line.debit > 0 && line.credit > 0) {
            result.errors.push(`Line ${index + 1}: Line cannot have both Debit and Credit amounts.`);
        }

        // B. COA Range Validation
        const validRange = COA_BASE.ranges.find(r => line.account_code >= r.min && line.account_code <= r.max);
        if (!validRange) {
            result.errors.push(`Line ${index + 1}: Account Code ${line.account_code} is invalid (Outside US GAAP ranges).`);
        }

        totalDebit += line.debit;
        totalCredit += line.credit;
    }

    // 2. Equation Validation
    const imbalance = totalDebit - totalCredit;

    result.details = {
        total_debit: totalDebit,
        total_credit: totalCredit,
        imbalance: Math.abs(imbalance)
    };

    if (imbalance !== 0) {
        result.errors.push(`Accounting Equation Violation: Debits (${totalDebit}) != Credits (${totalCredit}). Imbalance: ${imbalance}`);
    }

    // Final Status
    if (result.errors.length > 0) {
        result.isValid = false;
    }

    return result;
}

// --- INTERNAL UNIT TEST ---

function runInternalTest() {
    console.log("---------------------------------------------------------");
    console.log("⚖️  RUNNING INTERNAL UNIT TEST: Double-Entry Validator");
    console.log("---------------------------------------------------------");

    const testEntry: JournalEntryLine[] = [
        { account_code: 1010, debit: 10700, credit: 0 },    // Cash (Asset)
        { account_code: 4010, debit: 0, credit: 10000 },    // Sales (Revenue)
        { account_code: 2020, debit: 0, credit: 700 }       // Tax Payable (Liability)
    ];

    console.log("Input Entry:", JSON.stringify(testEntry, null, 2));

    try {
        const result = validateJournalEntry(testEntry);

        console.log("\nValidation Result:");
        console.log(`IsValid: ${result.isValid}`);
        console.log(`Totals: D=${result.details?.total_debit}, C=${result.details?.total_credit}`);

        if (result.isValid && result.details?.imbalance === 0) {
            console.log("✅ TEST PASSED: Entry is balanced and accounts are valid.");
        } else {
            console.error("❌ TEST FAILED:", result.errors);
        }

    } catch (e: any) {
        console.error("❌ CRITICAL ERROR:", e.message);
    }
    console.log("---------------------------------------------------------");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runInternalTest();
}
