import { getFloridaTaxRate } from '../../database/simple-db';

export interface TaxExplanationContext {
    subtotal: number;
    county: string;
    isTaxable: boolean;
    customerTaxId?: string;
}

export class ExplanationEngine {
    private currencyFormatter: Intl.NumberFormat;
    private percentFormatter: Intl.NumberFormat;

    constructor(locale: string = 'en-US') {
        this.currencyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' });
        this.percentFormatter = new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 });
    }

    /**
     * Explains the tax calculation for a specific transaction context.
     */
    public explainTaxCalculation(context: TaxExplanationContext): string {
        if (!context.isTaxable) {
            return `No tax is applied because the item or transaction is marked as non-taxable.`;
        }

        if (context.customerTaxId) {
            return `No tax is applied because the customer provided a Tax Exempt Certificate (${context.customerTaxId}).`;
        }

        const stateRate = 0.06;
        const totalRate = getFloridaTaxRate(context.county);
        const surtaxRate = totalRate - stateRate;
        const taxAmount = context.subtotal * totalRate;

        let explanation = `Sales tax is calculated at a total rate of ${this.percentFormatter.format(totalRate)} based on the delivery location in ${context.county}. `;
        explanation += `This consists of the specific Florida State Base Rate (${this.percentFormatter.format(stateRate)})`;

        if (surtaxRate > 0.001) {
            explanation += ` plus a Discretionary Sales Surtax of ${this.percentFormatter.format(surtaxRate)} for ${context.county}.`;
        } else {
            explanation += `. No discretionary surtax applies or is known for this county.`;
        }

        explanation += ` Applied to the subtotal of ${this.currencyFormatter.format(context.subtotal)}, the tax amount is ${this.currencyFormatter.format(taxAmount)}.`;

        return explanation;
    }

    /**
     * Explains a DR-15 Return summary.
     */
    public explainDR15Summary(dr15: { grossSales: number, exemptSales: number, taxCollected: number }): string {
        const taxable = dr15.grossSales - dr15.exemptSales;
        return `For this period, Gross Sales were ${this.currencyFormatter.format(dr15.grossSales)}. ` +
            `After deducting Exempt Sales of ${this.currencyFormatter.format(dr15.exemptSales)}, ` +
            `the Taxable Amount is ${this.currencyFormatter.format(taxable)}. ` +
            `Total Tax Collected to be remitted to the DOR is ${this.currencyFormatter.format(dr15.taxCollected)}.`;
    }
}
