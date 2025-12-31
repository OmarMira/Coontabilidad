import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { AuditChainService } from '../../core/audit/AuditChainService';
import { FloridaTaxEngine, FloridaTaxRate } from '../accounting/FloridaTaxEngine';
import { JournalManager } from '../accounting/JournalManager';
import { InventoryManager } from '../../modules/inventory/InventoryManager'; // Fixed Path
import Big from 'big.js';

interface SaleTransaction {
    customerId: number;
    lines: {
        productId: number;
        description: string;
        quantity: number;
        unitPrice: number;
        taxable: boolean;
        cost: number;
    }[];
    county: string;
    userId: string;
}

export class TransactionManager {
    private engine: SQLiteEngine;
    private auditService: AuditChainService;
    private taxEngine: FloridaTaxEngine;
    private journalManager: JournalManager;
    private inventoryManager: InventoryManager; // New

    constructor(engine: SQLiteEngine) {
        this.engine = engine;
        this.auditService = new AuditChainService(engine);
        this.inventoryManager = new InventoryManager(engine);
        this.taxEngine = new FloridaTaxEngine([]); // Initialize empty, load on demand
        this.journalManager = new JournalManager(engine);
    }

    private async ensureTaxRatesLoaded(): Promise<void> {
        const rates = await this.engine.select("SELECT county_name as county, state_rate as stateRate, county_rate as discretionaryRate FROM florida_tax_rates");
        if (rates && rates.length > 0) {
            this.taxEngine = new FloridaTaxEngine(rates as FloridaTaxRate[]);
        }
    }

    async processSale(sale: SaleTransaction): Promise<void> {
        // Ensure tax rates are current from DB
        await this.ensureTaxRatesLoaded();

        // 0. Pre-Calculation (Big.js Precision)
        let subtotal = Big(0);
        let taxableSubtotal = Big(0);
        let totalCost = Big(0);

        for (const line of sale.lines) {
            const qty = Big(line.quantity);
            const price = Big(line.unitPrice);
            const lineTotal = qty.times(price);
            subtotal = subtotal.plus(lineTotal);
            if (line.taxable) {
                taxableSubtotal = taxableSubtotal.plus(lineTotal);
            }
            totalCost = totalCost.plus(qty.times(Big(line.cost || 0)));
        }

        const taxResult = this.taxEngine.calculateTax(
            Number(subtotal.toFixed(2)),
            Number(taxableSubtotal.toFixed(2)),
            sale.county
        );

        if (!this.taxEngine.validateCompliance(taxResult.taxableAmount, taxResult.totalTax, sale.county)) {
            throw new Error('Tax Compliance Check Failed: Math mismatch in DR-15 validation');
        }

        // 2. ATOMIC TRANSACTION SCENARIO
        await this.engine.executeTransaction(async () => {
            const now = new Date().toISOString().split('T')[0];

            // A. Generate Invoice Number 
            const invResult = await this.engine.select("SELECT COUNT(*) as c FROM invoices");
            const nextNum = (invResult[0]?.c || 0) + 1;
            const invNumber = `INV-${new Date().getFullYear()}-${nextNum.toString().padStart(5, '0')}`;

            // B. INSERT INVOICE
            await this.engine.run(`
                INSERT INTO invoices (invoice_number, customer_id, issue_date, subtotal, tax_amount, total_amount, status)
                VALUES (?, ?, DATE('now'), ?, ?, ?, 'paid')
             `, [invNumber, sale.customerId, taxResult.subtotal, taxResult.totalTax, taxResult.totalAmount]);

            const invIdResult = await this.engine.select("SELECT last_insert_rowid() as id");
            const invoiceId = invIdResult[0].id;

            // C. PROCESS LINES & INVENTORY
            for (const line of sale.lines) {
                const lineTotal = Big(line.quantity).times(line.unitPrice).toFixed(2);
                // Insert Line
                await this.engine.run(`
                    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, line_total, taxable)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                 `, [invoiceId, line.productId, line.description, line.quantity, line.unitPrice, lineTotal, line.taxable ? 1 : 0]);

                // Record STOCK OUT via InventoryManager (Handles batches/LIFO/FIFO)
                await this.inventoryManager.shipStock(line.productId, line.quantity, invNumber);
            }

            // Get the specific rates used for this county from DB for audit/history
            const rateRecord = await this.engine.select(
                "SELECT state_rate, county_rate FROM florida_tax_rates WHERE county_name = ? ORDER BY effective_date DESC LIMIT 1",
                [sale.county]
            );
            const stateRate = rateRecord[0]?.state_rate || 0.06;

            // C2. Insert Tax Transaction (Florida State)
            await this.engine.run(`
                INSERT INTO tax_transactions (invoice_id, transaction_date, county_name, gross_amount, exempt_amount, taxable_amount, tax_collected, tax_rate_applied)
                VALUES (?, DATE('now'), 'Florida State', ?, ?, ?, ?, ?)
             `, [invoiceId, taxResult.subtotal, taxResult.exemptAmount, taxResult.taxableAmount, taxResult.stateTax, stateRate]);

            if (taxResult.countyTax > 0) {
                const countyRate = rateRecord[0]?.county_rate || parseFloat((taxResult.countyTax / taxResult.taxableAmount).toFixed(4));
                await this.engine.run(`
                    INSERT INTO tax_transactions (invoice_id, transaction_date, county_name, gross_amount, exempt_amount, taxable_amount, tax_collected, tax_rate_applied)
                    VALUES (?, DATE('now'), ?, ?, ?, ?, ?, ?)
                 `, [invoiceId, sale.county, taxResult.subtotal, taxResult.exemptAmount, taxResult.taxableAmount, taxResult.countyTax, countyRate]);
            }

            // D. CREATE JOURNAL ENTRY
            await this.journalManager.createJournalEntry({
                date: now,
                description: `Sale Invoice ${invNumber}`,
                reference: invNumber,
                details: [
                    {
                        accountCode: '11000', // Accounts Receivable
                        debit: Big(taxResult.totalAmount),
                        credit: Big(0)
                    },
                    {
                        accountCode: '40000', // Sales Revenue
                        debit: Big(0),
                        credit: Big(taxResult.subtotal)
                    },
                    {
                        accountCode: '22000', // Sales Tax Payable
                        debit: Big(0),
                        credit: Big(taxResult.totalTax)
                    },
                    // COGS Integration
                    {
                        accountCode: '50000', // Cost of Goods Sold
                        debit: totalCost,
                        credit: Big(0)
                    },
                    {
                        accountCode: '12000', // Inventory
                        debit: Big(0),
                        credit: totalCost
                    }
                ]
            });

            // E. AUDIT LOG
            await this.auditService.logEvent({
                eventType: 'SALE_PROCESSED',
                entityTable: 'invoices',
                entityId: invoiceId.toString(),
                userId: sale.userId,
                content: {
                    invoiceNumber: invNumber,
                    amount: taxResult.totalAmount,
                    itemsCount: sale.lines.length
                }
            });
        });

        console.log(`Transaction Completed Successfully.`);
    }
}
