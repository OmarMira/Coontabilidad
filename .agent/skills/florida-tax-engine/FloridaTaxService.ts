import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define types for tax calculation
export interface TaxResult {
    state_tax_cents: number;
    surtax_cents: number;
    total_tax_cents: number;
    total_amount_cents: number;
    details: {
        taxable_amount_state: number;
        taxable_amount_surtax: number;
        state_rate_bps: number;
        surtax_rate_bps: number;
        county: string;
    };
}

interface CountyRate {
    surtax_rate_bps: number;
    name: string;
}

// Derive __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const STATE_TAX_RATE_BPS = 600; // 6.00%
const SURTAX_CAP_CENTS = 500000; // $5,000.00
const RATES_FILE_PATH = path.join(__dirname, 'resources', 'rates.json');

/**
 * Loads tax rates from the JSON resource file.
 */
function loadRates(): Record<string, CountyRate> {
    try {
        if (fs.existsSync(RATES_FILE_PATH)) {
            const data = fs.readFileSync(RATES_FILE_PATH, 'utf-8');
            return JSON.parse(data);
        }
        return {
            "MIAMI-DADE": { "surtax_rate_bps": 100, "name": "Miami-Dade" }
        };
    } catch (error) {
        console.error("Error loading tax rates:", error);
        return {};
    }
}

const TAX_RATES = loadRates();

/**
 * Florida Tax Engine Core Logic
 */
export function calculateFloridaTax(amountCents: number, county: string): TaxResult {
    if (!Number.isInteger(amountCents)) {
        throw new Error(`Security Violation: Amount must be an integer. Received: ${amountCents}`);
    }

    if (amountCents < 0) {
        throw new Error(`Security Violation: Amount must be non-negative. Received: ${amountCents}`);
    }

    const normalizedCounty = county.toUpperCase().trim();
    const countyData = TAX_RATES[normalizedCounty];

    const surtaxRateBps = countyData ? countyData.surtax_rate_bps : 0;

    const stateTaxCents = Math.round((amountCents * STATE_TAX_RATE_BPS) / 10000);

    const taxableSurtaxAmount = Math.min(amountCents, SURTAX_CAP_CENTS);
    const surtaxCents = Math.round((taxableSurtaxAmount * surtaxRateBps) / 10000);

    const totalTaxCents = stateTaxCents + surtaxCents;

    return {
        state_tax_cents: stateTaxCents,
        surtax_cents: surtaxCents,
        total_tax_cents: totalTaxCents,
        total_amount_cents: amountCents + totalTaxCents,
        details: {
            taxable_amount_state: amountCents,
            taxable_amount_surtax: taxableSurtaxAmount,
            state_rate_bps: STATE_TAX_RATE_BPS,
            surtax_rate_bps: surtaxRateBps,
            county: normalizedCounty
        }
    };
}

// --- SELF-TEST / UNIT TEST ---
function runInternalTest() {
    console.log("---------------------------------------------------");
    console.log("🛠️ RUNNING INTERNAL UNIT TEST: Florida Tax Engine");
    console.log("---------------------------------------------------");

    const testCase = {
        amount: 600000, // $6,000.00
        county: "MIAMI-DADE",
        expectedTotalTax: 41000 // $410.00
    };

    try {
        const result = calculateFloridaTax(testCase.amount, testCase.county);

        console.log(`Input Amount: $${(testCase.amount / 100).toFixed(2)}`);
        console.log(`County: ${testCase.county}`);
        console.log(`State Tax (6%): $${(result.state_tax_cents / 100).toFixed(2)} [Expected around $360.00]`);
        console.log(`Surtax (${(result.details.surtax_rate_bps / 100)}% on first $5k): $${(result.surtax_cents / 100).toFixed(2)} [Expected $50.00]`);
        console.log(`Total Tax: $${(result.total_tax_cents / 100).toFixed(2)}`);

        if (result.total_tax_cents === testCase.expectedTotalTax) {
            console.log("✅ TEST PASSED: Calculations match expected Output.");
        } else {
            console.error(`❌ TEST FAILED: Expected ${testCase.expectedTotalTax}, got ${result.total_tax_cents}`);
        }

    } catch (e: any) {
        console.error("❌ TEST FAILED WITH ERROR:", e.message);
    }
    console.log("---------------------------------------------------");
}

// Execute test if run directly (ESM compatible check)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runInternalTest();
}
