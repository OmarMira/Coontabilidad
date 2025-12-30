import { z } from 'zod';
import { TransactionManager } from '../transactions/TransactionManager';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import Big from 'big.js';

// Zod Schemas
const InvoiceLineSchema = z.object({
    productId: z.number().int().positive(),
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    taxable: z.boolean(),
    cost: z.number().nonnegative().optional().default(0)
});

const CreateInvoiceSchema = z.object({
    customerId: z.number().int().positive(),
    county: z.string().min(1), // e.g., "Miami-Dade"
    userId: z.string().min(1),
    lines: z.array(InvoiceLineSchema).min(1)
});

export type CreateInvoiceDTO = z.infer<typeof CreateInvoiceSchema>;

export class InvoiceService {
    private transactionManager: TransactionManager;
    private engine: SQLiteEngine;

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
        this.transactionManager = new TransactionManager(engine);
    }

    async createInvoice(data: CreateInvoiceDTO): Promise<void> {
        // 1. Validate Input Structure
        const validatedData = CreateInvoiceSchema.parse(data);

        // 2. Business Validations (Integrity Checks)
        // Check Customer Exists
        const cust = await this.engine.select("SELECT id FROM customers WHERE id = ?", [validatedData.customerId]);
        if (cust.length === 0) throw new Error(`InvoiceService: Customer ID ${validatedData.customerId} not found.`);

        // Check Products Stock & Existence
        for (const line of validatedData.lines) {
            const prod = await this.engine.select("SELECT stock_quantity, name FROM products WHERE id = ?", [line.productId]);
            if (prod.length === 0) throw new Error(`InvoiceService: Product ID ${line.productId} not found.`);

            const currentStock = prod[0].stock_quantity;
            if (currentStock < line.quantity) {
                throw new Error(`InvoiceService: Insufficient stock for '${prod[0].name}'. Requested: ${line.quantity}, Available: ${currentStock}`);
            }
        }

        // 3. Prepare Data for Transaction Manager
        // Ensure strictly typed numbers for calculations if needed, but Manager handles Big.js conversion.
        // We pass the raw DTO which matches the interface mostly.

        console.log('[InvoiceService] Processing Validated Invoice...');

        try {
            await this.transactionManager.processSale({
                customerId: validatedData.customerId,
                county: validatedData.county,
                userId: validatedData.userId,
                lines: validatedData.lines.map(l => ({
                    ...l,
                    cost: l.cost || 0
                }))
            });
            console.log('[InvoiceService] Invoice created successfully.');
        } catch (error) {
            console.error('[InvoiceService] Transaction Failed:', error);
            throw error; // Re-throw for UI handling
        }
    }
}
