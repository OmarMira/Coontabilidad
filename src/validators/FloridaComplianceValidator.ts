import { z } from 'zod';
import { getFloridaTaxRate } from '../database/simple-db';

export const DR15ReturnSchema = z.object({
    period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM"), // YYYY-MM
    grossSales: z.number().min(0),
    exemptSales: z.number().min(0),
    taxableSales: z.number().min(0),
    taxCollected: z.number().min(0),
    surtaxCollected: z.number().min(0).optional(),
    totalTaxDue: z.number().min(0),
    certificateNumber: z.string().regex(/^\d{13,15}$/, "Florida Certificate Number is typically 13-15 digits").optional()
}).strict();

export class FloridaComplianceValidator {

    /**
     * Valida el formato del número de registro fiscal de Florida (Certificate of Registration).
     * @param number 
     */
    static validateRegistrationNumber(number: string): boolean {
        // DR-11 Certificate Number usually looks like "XX-xxxxxxxxx-xx-x"
        // Simplified regex: allow numeric, maybe dashes
        const clean = number.replace(/[^0-9]/g, '');
        return clean.length >= 11 && clean.length <= 15;
    }

    /**
     * Valida una declaración DR-15 preliminar antes de generación.
     * @param returnData 
     */
    static validateDR15Return(returnData: unknown) {
        return DR15ReturnSchema.safeParse(returnData);
    }

    /**
     * Verifica si la tasa cobrada es consistente con el condado (Warning level).
     * @param county 
     * @param rateApplied 
     */
    static checkCountyRateCompliance(county: string, rateApplied: number): { compliant: boolean; expected?: number; message?: string } {
        const expected = getFloridaTaxRate(county);

        // If the rate returned is the base 6%, we check if it's at least that
        if (expected <= 0.06) {
            if (rateApplied < 0.06) {
                return { compliant: false, message: "Rate below Florida State minimum (6%)" };
            }
            return { compliant: true, message: "County base rate or unknown county, minimum 6% met" };
        }

        // Allow small float diff or strict match? 
        // Allow rate to be higher (maybe manual override?) but warn if lower
        if (rateApplied < expected) {
            return { compliant: false, expected, message: `Rate ${rateApplied} is lower than expected ${expected} for ${county}` };
        }

        return { compliant: true };
    }
}
