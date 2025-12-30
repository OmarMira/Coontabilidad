import { z } from 'zod';

export const CompanyInfoSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Company Name is required"),
    tax_id: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
    logo_path: z.string().optional(),
    currency_code: z.string().default('USD')
}).strict();
export type CompanyInfo = z.infer<typeof CompanyInfoSchema>;

export const SystemConfigSchema = z.object({
    key: z.string(),
    value: z.string(),
    category: z.string().optional()
}).strict();
export type SystemConfig = z.infer<typeof SystemConfigSchema>;

export const UserRoleSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    permissions: z.array(z.string()).default([])
}).strict();
export type UserRole = z.infer<typeof UserRoleSchema>;

export const FiscalSettingsSchema = z.object({
    id: z.number().optional(),
    tax_year_start: z.string().optional(),
    tax_frequency: z.enum(['monthly', 'quarterly']).default('monthly'),
    sales_tax_method: z.enum(['accrual', 'cash']).default('accrual'),
    default_tax_rate: z.number().default(0.06),
    dr15_filing_day: z.number().default(20),
    active: z.boolean().default(true)
}).strict();
export type FiscalSettings = z.infer<typeof FiscalSettingsSchema>;
