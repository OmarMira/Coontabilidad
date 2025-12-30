import { z } from 'zod';

// --- Chart of Accounts ---
export const AccountTypeSchema = z.enum([
    'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'
]);

export const AccountSchema = z.object({
    id: z.number().optional(),
    code: z.string().min(1),
    name: z.string().min(1),
    type: AccountTypeSchema,
    subtype: z.string().optional(),
    active: z.boolean().default(true)
}).strict();
export type Account = z.infer<typeof AccountSchema>;

// --- Journal Entries ---
export const JournalLineSchema = z.object({
    id: z.number().optional(),
    account_code: z.string().min(1),
    debit: z.number().min(0).default(0),
    credit: z.number().min(0).default(0),
    description: z.string().optional()
}).refine(data => data.debit > 0 || data.credit > 0, {
    message: "Line must have either debit or credit amount"
});
export type JournalLine = z.infer<typeof JournalLineSchema>;

export const JournalEntrySchema = z.object({
    id: z.number().optional(),
    entry_date: z.string(), // ISO Date
    description: z.string().min(1),
    reference: z.string().optional(),
    total: z.number().min(0).optional(), // Can be calculated
    status: z.enum(['draft', 'posted', 'void']).default('posted'),
    details: z.array(JournalLineSchema).min(2, "Entry must have at least 2 lines")
}).strict();
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

// --- Periods ---
export const AccountingPeriodSchema = z.object({
    id: z.number().optional(),
    name: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    status: z.enum(['open', 'closed', 'locked']).default('open')
}).strict();
export type AccountingPeriod = z.infer<typeof AccountingPeriodSchema>;

// --- Reports ---
export interface TrialBalanceRow {
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
    net: number;
}
