import { z } from 'zod';

// --- Suppliers ---
export const SupplierSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Name is required"),
    business_name: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    tax_id: z.string().optional(),
    payment_terms: z.number().default(30),
    active: z.boolean().default(true) // Assumed from status='active' in DB
}).strict();
export type Supplier = z.infer<typeof SupplierSchema>;

// --- Purchase Orders ---
export const PurchaseOrderLineSchema = z.object({
    id: z.number().optional(),
    product_id: z.number(),
    description: z.string().optional(),
    quantity_ordered: z.number().positive(),
    quantity_received: z.number().default(0),
    unit_cost: z.number().min(0),
    line_total: z.number()
}).strict();
export type PurchaseOrderLine = z.infer<typeof PurchaseOrderLineSchema>;

export const PurchaseOrderSchema = z.object({
    id: z.number().optional(),
    order_number: z.string().min(1),
    supplier_id: z.number(),
    date: z.string(), // ISO Date
    expected_date: z.string().optional(),
    status: z.enum(['draft', 'sent', 'approved', 'partial', 'closed', 'cancelled']).default('draft'),
    subtotal: z.number().default(0),
    tax_amount: z.number().default(0),
    total_amount: z.number().default(0),
    notes: z.string().optional(),
    lines: z.array(PurchaseOrderLineSchema).optional() // For API/Logic convenience
}).strict();
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

// --- Goods Receipts ---
export const GoodsReceiptLineSchema = z.object({
    id: z.number().optional(),
    product_id: z.number(),
    quantity_received: z.number().positive(),
    batch_number: z.string().optional(),
    expiry_date: z.string().optional(),
    location_id: z.number().optional()
}).strict();

export const GoodsReceiptSchema = z.object({
    id: z.number().optional(),
    receipt_number: z.string(),
    purchase_order_id: z.number().optional(),
    supplier_id: z.number(),
    received_date: z.string(),
    status: z.enum(['received', 'verified']).default('received'),
    lines: z.array(GoodsReceiptLineSchema)
}).strict();
export type GoodsReceipt = z.infer<typeof GoodsReceiptSchema>;
