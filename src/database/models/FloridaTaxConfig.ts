/**
 * CONFIGURACIÓN DE IMPUESTOS DE FLORIDA
 * 
 * Tasas por condado con DR-15 automático
 */

export interface FloridaTaxConfig {
  id: number;
  county: string;
  base_rate: number;
  surtax_rate: number;
  total_rate: number;
  effective_date: string;
  dr15_required: boolean;
}

export class FloridaTaxConfigModel {
  static readonly FLORIDA_COUNTIES: FloridaTaxConfig[] = [
    // TASAS ACTUALIZADAS 2026
    { id: 1, county: 'Miami-Dade', base_rate: 0.06, surtax_rate: 0.005, total_rate: 0.065, effective_date: '2026-01-01', dr15_required: true },
    { id: 2, county: 'Broward', base_rate: 0.06, surtax_rate: 0.00, total_rate: 0.06, effective_date: '2026-01-01', dr15_required: true },
    { id: 3, county: 'Orange', base_rate: 0.06, surtax_rate: 0.005, total_rate: 0.065, effective_date: '2026-01-01', dr15_required: true },
    { id: 4, county: 'Hillsborough', base_rate: 0.06, surtax_rate: 0.005, total_rate: 0.065, effective_date: '2026-01-01', dr15_required: true },
    { id: 5, county: 'Palm Beach', base_rate: 0.06, surtax_rate: 0.00, total_rate: 0.06, effective_date: '2026-01-01', dr15_required: true },
    { id: 6, county: 'Pinellas', base_rate: 0.06, surtax_rate: 0.01, total_rate: 0.07, effective_date: '2026-01-01', dr15_required: true },
    { id: 7, county: 'Duval', base_rate: 0.06, surtax_rate: 0.0075, total_rate: 0.0675, effective_date: '2026-01-01', dr15_required: true },
    { id: 8, county: 'Lee', base_rate: 0.06, surtax_rate: 0.01, total_rate: 0.07, effective_date: '2026-01-01', dr15_required: true },
    { id: 9, county: 'Polk', base_rate: 0.06, surtax_rate: 0.01, total_rate: 0.07, effective_date: '2026-01-01', dr15_required: true },
    { id: 10, county: 'Brevard', base_rate: 0.06, surtax_rate: 0.01, total_rate: 0.07, effective_date: '2026-01-01', dr15_required: true }
  ];

  static getTaxByCounty(county: string): FloridaTaxConfig | null {
    return this.FLORIDA_COUNTIES.find(config =>
      config.county.toLowerCase() === county.toLowerCase()
    ) || null;
  }

  static calculateTax(amount: number, county: string): TaxCalculation {
    const config = this.getTaxByCounty(county);

    if (!config) {
      throw new Error(`Condado no soportado: ${county}`);
    }

    const taxAmount = amount * config.total_rate;
    const baseTax = amount * config.base_rate;
    const surtax = amount * config.surtax_rate;

    return {
      county: config.county,
      amount,
      base_rate: config.base_rate,
      surtax_rate: config.surtax_rate,
      total_rate: config.total_rate,
      base_tax: baseTax,
      surtax,
      total_tax: taxAmount,
      dr15_required: config.dr15_required && taxAmount > 1000
    };
  }

  static generateDR15Report(transactions: Transaction[], period: string): DR15Report {
    const reportData = new Map<string, {
      taxable_sales: number;
      exempt_sales: number;
      tax_collected: number;
    }>();

    // Agrupar por condado
    for (const transaction of transactions) {
      const county = transaction.customer_county || 'Unknown';

      if (!reportData.has(county)) {
        reportData.set(county, {
          taxable_sales: 0,
          exempt_sales: 0,
          tax_collected: 0
        });
      }

      const data = reportData.get(county)!;

      if (transaction.tax_exempt) {
        data.exempt_sales += transaction.amount;
      } else {
        data.taxable_sales += transaction.amount;
        data.tax_collected += transaction.tax_amount || 0;
      }
    }

    return {
      period,
      generated_at: new Date().toISOString(),
      counties: Array.from(reportData.entries()).map(([county, data]) => ({
        county,
        ...data
      })),
      totals: {
        taxable_sales: Array.from(reportData.values()).reduce((sum, data) => sum + data.taxable_sales, 0),
        exempt_sales: Array.from(reportData.values()).reduce((sum, data) => sum + data.exempt_sales, 0),
        tax_collected: Array.from(reportData.values()).reduce((sum, data) => sum + data.tax_collected, 0)
      }
    };
  }
}

export interface TaxCalculation {
  county: string;
  amount: number;
  base_rate: number;
  surtax_rate: number;
  total_rate: number;
  base_tax: number;
  surtax: number;
  total_tax: number;
  dr15_required: boolean;
}

export interface Transaction {
  id: number;
  amount: number;
  customer_county: string;
  tax_amount?: number;
  tax_exempt: boolean;
  date: string;
}

export interface DR15Report {
  period: string;
  generated_at: string;
  counties: Array<{
    county: string;
    taxable_sales: number;
    exempt_sales: number;
    tax_collected: number;
  }>;
  totals: {
    taxable_sales: number;
    exempt_sales: number;
    tax_collected: number;
  };
}
