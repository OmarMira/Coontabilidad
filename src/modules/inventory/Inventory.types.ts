import { z } from 'zod';

// --- Locations ---
export const LocationSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Name is required"),
    type: z.enum(['warehouse', 'store', 'shelf', 'transit']).default('warehouse'),
    address: z.string().optional(),
    active: z.boolean().default(true)
}).strict();

export type Location = z.infer<typeof LocationSchema>;

// --- Batches ---
export const ProductBatchSchema = z.object({
    id: z.number().optional(),
    product_id: z.number(),
    batch_number: z.string().min(1, "Batch Number is required"),
    expiry_date: z.string().optional(), // ISO Date
    quantity: z.number().default(0),
    cost: z.number().min(0).default(0),
    received_date: z.string().default(() => new Date().toISOString().split('T')[0]),
    location_id: z.number().optional()
}).strict();

export type ProductBatch = z.infer<typeof ProductBatchSchema>;

// --- Movements ---
export const InventoryMovementSchema = z.object({
    id: z.number().optional(),
    type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']),
    product_id: z.number(),
    batch_id: z.number().optional(),
    location_from_id: z.number().optional(),
    location_to_id: z.number().optional(),
    quantity: z.number(), // Input is typically positive magnitude, handled logic maps to signed
    date: z.string().optional(),
    user_id: z.number().optional(),
    reference_type: z.enum(['invoice', 'bill', 'adjustment', 'transfer', 'audit', 'initial']).optional(),
    reference_id: z.string().optional(),
    notes: z.string().optional(),
    adjustment_id: z.number().optional()
}).strict();

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;

// --- Adjustments ---
export const InventoryAdjustmentSchema = z.object({
    id: z.number().optional(),
    date: z.string(),
    user_id: z.number().optional(),
    reason: z.string().min(1, "Reason is required"),
    reference: z.string().optional(),
    status: z.enum(['pending', 'approved', 'completed']).default('completed'),
    total_value_change: z.number().default(0)
}).strict();

export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;

// --- DTOs ---
export interface StockCheckResult {
    available: number;
    sufficient: boolean;
    batches?: ProductBatch[];
}
