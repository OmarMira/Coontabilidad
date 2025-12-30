import { z } from 'zod';

export const CountyBreakdownSchema = z.object({
    county: z.string(),
    grossSales: z.number(),
    taxableSales: z.number(),
    taxCollected: z.number()
}).strict();

export const DR15ReportSchema = z.object({
    month: z.number().min(1).max(12),
    year: z.number().int().min(2000),
    generatedAt: z.date(),

    // Totals
    totalGrossSales: z.number(),
    totalTaxableSales: z.number(),
    totalTaxCollected: z.number(),

    // Breakdown
    countyBreakdown: z.array(CountyBreakdownSchema)
}).strict();

export type DR15Breakdown = z.infer<typeof CountyBreakdownSchema>;
export type DR15Report = z.infer<typeof DR15ReportSchema>;
