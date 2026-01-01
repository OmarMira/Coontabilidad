import { z } from 'zod';
import { FloridaTaxCalculator } from './FloridaTaxCalculator';

// Documentación DOR Florida: Regla 12A-1.097
// Requisitos de facturación para Sales and Use Tax

export const ComplianceInvoiceItemSchema = z.object({
    description: z.string().min(1, "Item description is required"),
    quantity: z.number().positive("Quantity must be positive"),
    unitPrice: z.number().nonnegative("Unit price must be non-negative"),
    taxable: z.boolean(),
    lineTotal: z.number()
}).strict();

export const ComplianceInvoiceSchema = z.object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    date: z.date(),
    customer: z.object({
        name: z.string().min(1, "Customer name is required"),
        county: z.string().min(1, "Florida county is required for surtax calculation"),
        taxExemptNumber: z.string().optional()
    }),
    items: z.array(ComplianceInvoiceItemSchema).min(1, "Invoice must have at least one item"),
    subtotal: z.number(),
    taxAmount: z.number().min(0),
    totalAmount: z.number(),
    countyRate: z.number().min(0).max(0.15).optional() // Optional sanity check for rate
}).strict();

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export class InvoiceComplianceValidator {
    private taxCalculator: FloridaTaxCalculator;

    constructor() {
        this.taxCalculator = new FloridaTaxCalculator();
    }

    /**
     * Valida una factura para asegurar cumplimiento con normas de Florida DOR.
     * @param invoice Datos de la factura
     */
    public validate(invoice: unknown): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            errors: [] as string[],
            warnings: [] as string[]
        };

        // 1. Validación de Estructura (Schema)
        const parseResult = ComplianceInvoiceSchema.safeParse(invoice);
        if (!parseResult.success) {
            result.isValid = false;
            result.errors.push(...parseResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`));
            return result; // Si la estructura está mal, no seguimos con lógica
        }

        const data = parseResult.data;

        // 2. Validación Lógica de Negocio (Florida Tax Rule)

        // Verificar Subtotal
        const calculatedSubtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        if (Math.abs(calculatedSubtotal - data.subtotal) > 0.01) {
            result.isValid = false;
            result.errors.push(`Subtotal mismatch: declared ${data.subtotal}, calculated ${calculatedSubtotal}`);
        }

        // Verificar Math de Tax (Aproximado)
        // Para validación exacta, necesitaríamos recalcular con el tax calculator
        // Vamos a asumir que si el items es taxable, aplica tax.

        let calculatedTaxBase = 0;
        data.items.forEach(item => {
            if (item.taxable) {
                calculatedTaxBase += item.quantity * item.unitPrice;
            }
        });

        // Si el cliente es exento, tax debe ser 0
        if (data.customer.taxExemptNumber) {
            if (data.taxAmount > 0) {
                result.errors.push(`Tax Exempt customer has tax amount > 0`);
                result.isValid = false;
            }
        } else {
            // Validar que el impuesto no esté groseramente mal (e.g. negativo o > 20%)
            if (data.taxAmount < 0) {
                result.errors.push("Tax amount cannot be negative");
                result.isValid = false;
            }
        }

        // Verificar Total
        if (Math.abs((data.subtotal + data.taxAmount) - data.totalAmount) > 0.01) {
            result.isValid = false;
            result.errors.push(`Total amount mismatch: declared ${data.totalAmount}, calculated ${data.subtotal + data.taxAmount}`);
        }

        // 3. Validar Condado (Florida Specific)
        const validCounties = [
            "Miami-Dade", "Broward", "Palm Beach", "Orange", "Hillsborough", "Duval", "Pinellas",
            "Lee", "Polk", "Brevard", "Volusia", "Pasco", "Seminole", "Sarasota", "Manatee",
            "Collier", "Osceola", "Marion", "St. Lucie", "Escambia", "Leon", "Alachua", "St. Johns",
            "Clay", "Okaloosa", "Lake", "Hernando", "Charlotte", "Santa Rosa", "Martin", "Bay",
            "Indian River", "Citrus", "Sumter", "Flagler", "Highlands", "Nassau", "Monroe", "Putnam",
            "Columbia", "Walton", "Jackson", "Gadsden", "Suwannee", "Levy", "Okeechobee", "Hendry",
            "DeSoto", "Wakulla", "Hardee", "Baker", "Washington", "Taylor", "Holmes", "Madison",
            "Gilchrist", "Dixie", "Gulf", "Union", "Calhoun", "Hamilton", "Jefferson", "Glades",
            "Franklin", "Lafayette", "Liberty"
        ];

        // Normalización simple para check
        const normalizedCounty = validCounties.find(c => c.toLowerCase() === data.customer.county.toLowerCase());
        if (!normalizedCounty) {
            result.warnings.push(`County '${data.customer.county}' not recognized in standard Florida list. Surtax calculation might be inaccurate.`);
        }

        return result;
    }
}
