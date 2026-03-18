/**
 * Módulo 17 — Florida Tax / DR-15
 * Extraído de simple-db.ts líneas 9577–9940 + auxiliares 9942–10039
 */

import { db, rowToEntity } from './db-core';
import { saveDatabase } from './db-persistence';
import { generateSimpleHash } from './db-audit';
import { logger } from '../../core/logging/SystemLogger';
import type { FloridaDR15Report } from './db-types';

// ==========================================
// FUNCIONES AUXILIARES (privadas)
// ==========================================

function getLastDayOfMonth(year: number, month: number): string {
  return new Date(year, month, 0).getDate().toString().padStart(2, '0');
}

function parsePeriod(period: string): { startDate: string; endDate: string } {
  const [year, quarter] = period.split('-');
  const yearNum = parseInt(year);

  if (quarter.startsWith('Q')) {
    const quarterNum = parseInt(quarter.substring(1));
    const startMonth = (quarterNum - 1) * 3 + 1;
    const endMonth = quarterNum * 3;
    return {
      startDate: `${yearNum}-${startMonth.toString().padStart(2, '0')}-01`,
      endDate: `${yearNum}-${endMonth.toString().padStart(2, '0')}-${getLastDayOfMonth(yearNum, endMonth)}`
    };
  } else {
    const month = parseInt(quarter);
    return {
      startDate: `${yearNum}-${month.toString().padStart(2, '0')}-01`,
      endDate: `${yearNum}-${month.toString().padStart(2, '0')}-${getLastDayOfMonth(yearNum, month)}`
    };
  }
}

function calculateDueDate(period: string): Date {
  const { endDate } = parsePeriod(period);
  const dueDate = new Date(endDate);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(20);
  return dueDate;
}

function createEmptyDR15Report(period: string): FloridaDR15Report {
  return {
    period,
    totalTaxableSales: 0,
    totalTaxCollected: 0,
    countyBreakdown: [],
    exemptSales: 0,
    adjustments: [],
    netTaxDue: 0,
    dueDate: calculateDueDate(period),
    status: 'pending'
  };
}

function getFloridaTaxRate(county: string): number {
  if (!db) return 0.07;
  try {
    const result = db.exec(
      `SELECT total_rate FROM florida_tax_rates WHERE county_name = ? LIMIT 1`,
      [county]
    );
    if (result[0]?.values[0]?.[0]) return Number(result[0].values[0][0]);
    return 0.07;
  } catch {
    return 0.07;
  }
}

// ==========================================
// FUNCIONES EXPORTADAS
// ==========================================

export function calculateFloridaDR15Report(period: string): FloridaDR15Report | null {
  if (!db) {
    logger.error('DR15', 'calculate_no_db', 'Base de datos no disponible');
    return null;
  }

  try {
    logger.info('DR15', 'calculate_start', 'Calculando reporte DR-15', { period });

    const { startDate, endDate } = parsePeriod(period);

    const invoicesResult = db.exec(`
      SELECT
        i.id,
        i.subtotal,
        i.tax_amount,
        i.total_amount,
        c.florida_county,
        c.tax_exempt
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.issue_date >= ? AND i.issue_date <= ?
        AND i.status IN ('sent', 'paid')
    `, [startDate, endDate]);

    if (invoicesResult.length === 0 || invoicesResult[0].values.length === 0) {
      logger.warn('DR15', 'calculate_no_data', 'No hay facturas para el período', { period });
      return createEmptyDR15Report(period);
    }

    let totalTaxableSales = 0;
    let totalTaxCollected = 0;
    let exemptSales = 0;
    const countyBreakdown: { [county: string]: { rate: number; taxableAmount: number; taxAmount: number } } = {};

    invoicesResult[0].values.forEach((row: any) => {
      const subtotal = Number(row[1]) || 0;
      const taxAmount = Number(row[2]) || 0;
      const county = (row[4] as string) || 'Miami-Dade';
      const isExempt = Boolean(row[5]);

      if (isExempt) {
        exemptSales += subtotal;
      } else {
        totalTaxableSales += subtotal;
        totalTaxCollected += taxAmount;

        if (!countyBreakdown[county]) {
          countyBreakdown[county] = {
            rate: getFloridaTaxRate(county),
            taxableAmount: 0,
            taxAmount: 0
          };
        }
        countyBreakdown[county].taxableAmount += subtotal;
        countyBreakdown[county].taxAmount += taxAmount;
      }
    });

    const report: FloridaDR15Report = {
      period,
      totalTaxableSales,
      totalTaxCollected,
      countyBreakdown: Object.entries(countyBreakdown).map(([county, data]) => ({
        county,
        rate: data.rate,
        taxableAmount: data.taxableAmount,
        taxAmount: data.taxAmount
      })),
      exemptSales,
      adjustments: [],
      netTaxDue: totalTaxCollected,
      dueDate: calculateDueDate(period),
      status: 'pending'
    };

    logger.info('DR15', 'calculate_success', 'Reporte DR-15 calculado', {
      period,
      totalTaxableSales,
      totalTaxCollected,
      counties: Object.keys(countyBreakdown).length
    });

    return report;

  } catch (error) {
    logger.error('DR15', 'calculate_failed', 'Error al calcular reporte DR-15', { period }, error as Error);
    return null;
  }
}

export function saveDR15Report(report: FloridaDR15Report): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    logger.info('DR15', 'save_start', 'Guardando reporte DR-15', { period: report.period });

    const existingResult = db.exec(
      `SELECT id FROM florida_tax_reports WHERE period = ?`,
      [report.period]
    );

    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
      return { success: false, message: `Ya existe un reporte para el período ${report.period}` };
    }

    db.exec(`
      INSERT INTO florida_tax_reports(
        period, total_taxable_sales, total_tax_collected, exempt_sales,
        net_tax_due, due_date, status
      ) VALUES(?, ?, ?, ?, ?, ?, ?)
    `, [
      report.period,
      report.totalTaxableSales,
      report.totalTaxCollected,
      report.exemptSales,
      report.netTaxDue,
      report.dueDate.toISOString().split('T')[0],
      report.status
    ]);

    const reportId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;

    report.countyBreakdown.forEach(county => {
      db!.exec(`
        INSERT INTO florida_tax_report_counties(
          report_id, county_name, tax_rate, taxable_amount, tax_amount
        ) VALUES(?, ?, ?, ?, ?)
      `, [reportId, county.county, county.rate, county.taxableAmount, county.taxAmount]);
    });

    report.adjustments.forEach(adjustment => {
      db!.exec(`
        INSERT INTO florida_tax_report_adjustments(
          report_id, description, amount, type
        ) VALUES(?, ?, ?, ?)
      `, [reportId, adjustment.description, adjustment.amount, adjustment.type]);
    });

    const auditData = {
      period: report.period,
      total_tax: report.totalTaxCollected,
      counties: report.countyBreakdown.length
    };

    db.exec(`
      INSERT INTO audit_log(table_name, record_id, action, new_values, user_id, audit_hash)
      VALUES(?, ?, ?, ?, ?, ?)
    `, [
      'florida_tax_reports',
      reportId,
      'INSERT',
      JSON.stringify(auditData),
      1,
      generateSimpleHash(auditData)
    ]);

    logger.info('DR15', 'save_success', 'Reporte DR-15 guardado correctamente', { period: report.period, reportId });

    setTimeout(() => saveDatabase(), 1000);

    return {
      success: true,
      message: `Reporte DR-15 para ${report.period} guardado correctamente`,
      id: reportId
    };

  } catch (error) {
    logger.error('DR15', 'save_failed', 'Error al guardar reporte DR-15', { period: report.period }, error as Error);
    return {
      success: false,
      message: `Error al guardar reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

export function getDR15Reports(): FloridaDR15Report[] {
  if (!db) {
    logger.error('DR15', 'get_reports_no_db', 'Base de datos no disponible');
    return [];
  }

  try {
    logger.info('DR15', 'get_reports_start', 'Obteniendo reportes DR-15');

    const reportsResult = db.exec(`
      SELECT id, period, total_taxable_sales, total_tax_collected, exempt_sales,
             net_tax_due, due_date, filed_by, filed_at, status
      FROM florida_tax_reports
      ORDER BY period DESC
    `);

    if (reportsResult.length === 0 || reportsResult[0].values.length === 0) {
      logger.info('DR15', 'get_reports_empty', 'No hay reportes DR-15 guardados');
      return [];
    }

    const reports: FloridaDR15Report[] = [];

    for (const row of reportsResult[0].values) {
      const reportId = row[0] as number;
      const period = row[1] as string;

      const countiesResult = db.exec(`
        SELECT county_name, tax_rate, taxable_amount, tax_amount
        FROM florida_tax_report_counties
        WHERE report_id = ?
      `, [reportId]);

      const countyBreakdown = countiesResult.length > 0
        ? countiesResult[0].values.map((r: any) => ({
            county: r[0] as string,
            rate: Number(r[1]),
            taxableAmount: Number(r[2]),
            taxAmount: Number(r[3])
          }))
        : [];

      const adjustmentsResult = db.exec(`
        SELECT description, amount, type
        FROM florida_tax_report_adjustments
        WHERE report_id = ?
      `, [reportId]);

      const adjustments = adjustmentsResult.length > 0
        ? adjustmentsResult[0].values.map((r: any) => ({
            description: r[0] as string,
            amount: Number(r[1]),
            type: r[2] as 'credit' | 'debit'
          }))
        : [];

      reports.push({
        period,
        totalTaxableSales: Number(row[2]) || 0,
        totalTaxCollected: Number(row[3]) || 0,
        countyBreakdown,
        exemptSales: Number(row[4]) || 0,
        adjustments,
        netTaxDue: Number(row[5]) || 0,
        dueDate: new Date(row[6] as string),
        filedBy: row[7] as number || undefined,
        filedAt: row[8] ? new Date(row[8] as string) : undefined,
        status: row[9] as 'pending' | 'filed' | 'paid' | 'late'
      });
    }

    logger.info('DR15', 'get_reports_success', 'Reportes DR-15 obtenidos', { count: reports.length });
    return reports;

  } catch (error) {
    logger.error('DR15', 'get_reports_failed', 'Error al obtener reportes DR-15', null, error as Error);
    return [];
  }
}

export function getAllFloridaTaxRates(): { id: number; county: string; stateRate: number; discretionaryRate: number; totalRate: number }[] {
  if (!db) return [];
  try {
    const result = db.exec(
      `SELECT id, county_name as county, state_rate as stateRate, county_rate as discretionaryRate, total_rate as totalRate FROM florida_tax_rates`
    );
    if (result.length === 0 || result[0].values.length === 0) return [];
    const columns = (result[0].columns || (result[0] as any).lc);
    return result[0].values.map((row: any) => rowToEntity<any>(columns, row));
  } catch (error) {
    console.error('Error getting all tax rates:', error);
    return [];
  }
}

export function updateFloridaTaxRate(id: number, discretionaryRate: number): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };
  try {
    const totalRate = 0.06 + discretionaryRate;
    db.run(`UPDATE florida_tax_rates SET county_rate = ?, total_rate = ? WHERE id = ?`, [discretionaryRate, totalRate, id]);
    setTimeout(() => saveDatabase(), 500);
    return { success: true, message: 'Tasa actualizada correctamente' };
  } catch (error) {
    console.error('Error updating tax rate:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export function markDR15ReportAsFiled(period: string, filedBy: number = 1): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    logger.info('DR15', 'mark_filed_start', 'Marcando reporte como presentado', { period, filedBy });

    db.exec(`
      UPDATE florida_tax_reports
      SET status = 'filed', filed_by = ?, filed_at = CURRENT_TIMESTAMP
      WHERE period = ?
    `, [filedBy, period]);

    logger.info('DR15', 'mark_filed_success', 'Reporte marcado como presentado', { period });

    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: `Reporte DR-15 para ${period} marcado como presentado` };

  } catch (error) {
    logger.error('DR15', 'mark_filed_failed', 'Error al marcar reporte como presentado', { period }, error as Error);
    return {
      success: false,
      message: `Error al actualizar reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

export function getAvailableDR15Periods(): string[] {
  const periods: string[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  for (let year = currentYear - 1; year <= currentYear; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      periods.push(`${year}-Q${quarter}`);
    }
  }

  return periods;
}
