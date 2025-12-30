import { z } from 'zod';

/**
 * Tasa de impuesto base para Florida
 */
export const FloridaTaxRateSchema = z.object({
    county: z.string(),
    rate: z.number().min(0).max(0.15), // Basic sanity check
    effective_from: z.date(),
    effective_until: z.date().optional()
}).strict();

export type FloridaTaxRate = z.infer<typeof FloridaTaxRateSchema>;

/**
 * Esquema para resultados de cálculo de impuestos
 */
export const TaxCalculationResultSchema = z.object({
    subtotal: z.number(),
    county: z.string(),
    appliedRate: z.number(),
    taxAmount: z.number(),
    total: z.number(),
    calculatedAt: z.date(), // Using date object internally
    isDr15Required: z.boolean()
}).strict();

export type TaxCalculationResult = z.infer<typeof TaxCalculationResultSchema>;

/**
 * Esquema de transacción de impuestos para auditoría
 */
export const TaxTransactionSchema = z.object({
    invoice_id: z.string().optional(), // Optional initially before save
    county: z.string(),
    subtotal: z.number(),
    tax_rate: z.number(),
    tax_amount: z.number(),
    calculated_at: z.date()
}).strict();

export type TaxTransaction = z.infer<typeof TaxTransactionSchema>;
