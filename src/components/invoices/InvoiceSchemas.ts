import { z } from 'zod';

export const InvoiceLineSchema = z.object({
    id: z.string(),
    description: z.string().min(1, 'La descripción es obligatoria').max(200),
    quantity: z.number().positive('La cantidad debe ser positiva'),
    unitPrice: z.number().nonnegative('El precio debe ser mayor o igual a 0'),
    taxExempt: z.boolean().default(false),
    productId: z.union([z.string(), z.number()]).optional(),
    cost: z.number().optional()
}).strict();

export const CustomerSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'El nombre es obligatorio'),
    county: z.string().min(1, 'El condado es obligatorio'),
    taxId: z.string().optional()
}).strict();

export const InvoiceFormSchema = z.object({
    customerId: z.string().min(1, 'Se requiere un cliente'),
    customerName: z.string().min(1, 'Nombre del cliente requerido'),
    county: z.string().min(1, 'Condado requerido'),
    lines: z.array(InvoiceLineSchema).min(1, 'Debe haber al menos una línea'),
    subtotal: z.number().positive('El subtotal debe ser positivo'),
    taxAmount: z.number().min(0, 'El impuesto no puede ser negativo'),
    total: z.number().positive('El total debe ser positivo'),
    date: z.date().default(() => new Date())
}).strict();

export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type InvoiceFormData = z.infer<typeof InvoiceFormSchema>;
