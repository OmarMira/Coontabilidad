
import { db } from '../../database/simple-db';
import { FloridaTaxCalculator } from '../../modules/tax/FloridaTaxCalculator';

export class ContextManager {
    // SELECCIONAR DATOS RELEVANTES BASADO EN PREGUNTA
    static async getRelevantContext(question: string): Promise<any> {
        const questionType = this.analyzeQuestionType(question);

        switch (questionType) {
            case 'CLIENT_QUERY':
                return this.getClientContext(question);
            case 'INVOICE_QUERY':
                return this.getInvoiceContext(question);
            case 'TAX_QUERY':
                return this.getTaxContext(question);
            case 'INVENTORY_QUERY':
                return this.getInventoryContext(question);
            default:
                return this.getGeneralContext();
        }
    }

    private static analyzeQuestionType(question: string): string {
        const lower = question.toLowerCase();
        if (lower.includes('impuesto') || lower.includes('tax') || lower.includes('florida') || lower.includes('dr15') || lower.includes('dr-15')) return 'TAX_QUERY';
        if (lower.includes('cliente') || lower.includes('quien')) return 'CLIENT_QUERY';
        if (lower.includes('factura') || lower.includes('ventas') || lower.includes('ingreso')) return 'INVOICE_QUERY';
        if (lower.includes('inventario') || lower.includes('stock') || lower.includes('producto')) return 'INVENTORY_QUERY';
        return 'GENERAL_QUERY';
    }

    // OBTENER CONTEXTO ESPECÍFICO PARA IMPUESTOS FLORIDA
    private static async getTaxContext(question: string): Promise<any> {
        if (!db) return {};

        // Obtener tasas vigentes
        const rates = db.exec(`SELECT * FROM florida_tax_rates`);

        // Obtener el resumen de la vista optimizada
        const summary = db.exec(`SELECT * FROM tax_summary_florida`);

        // Calcular conformidad básica (simulada aquí con datos reales)
        const compliance = FloridaTaxCalculator.validateCompliance(100, 7, 'Miami-Dade');

        return {
            taxRates: rates[0]?.values,
            taxTransactions: summary[0]?.values,
            complianceStatus: compliance ? 'OK' : 'CHECK_NEEDED',
            explanation: 'Tasas vigentes extraídas de florida_tax_rates y resumen de tax_summary_florida'
        };
    }

    private static async getClientContext(question: string): Promise<any> {
        if (!db) return {};
        const clients = db.exec(`SELECT * FROM v_clientes_reales`);
        const suppliers = db.exec(`SELECT * FROM v_proveedores_reales`);
        return {
            clientSummary: clients[0]?.values,
            supplierSummary: suppliers[0]?.values
        };
    }

    private static async getInvoiceContext(question: string): Promise<any> {
        if (!db) return {};
        const invoices = db.exec(`SELECT * FROM v_facturas_reales`);
        return { invoiceSummary: invoices[0]?.values };
    }

    private static async getInventoryContext(question: string): Promise<any> {
        if (!db) return {};
        const inventory = db.exec(`SELECT * FROM inventory_summary`);
        return { inventorySummary: inventory[0]?.values };
    }

    private static async getGeneralContext(): Promise<any> {
        if (!db) return {};
        const financial = db.exec(`SELECT * FROM financial_summary`);
        return { financialSnapshot: financial[0]?.values };
    }
}
