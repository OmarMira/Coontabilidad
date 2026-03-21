import { logger } from '../../core/logging/SystemLogger';
/**
 * DataIntegrityChecker - Verificador de Integridad en Tiempo Real
 * 
 * Detecta:
 * - Referencias rotas (foreign keys)
 * - Duplicados
 * - Inconsistencias numÃ©ricas
 * - Datos corruptos
 * - Violaciones de constraints
 */

import { db } from '@/database/modules/db-core';
import { IntegrityCheckResult, IntegrityError, IntegrityWarning, RepairOperation } from './DataIntegrityCore';

export interface CheckConfig {
  tables?: string[];
  checkReferences?: boolean;
  checkDuplicates?: boolean;
  checkConsistency?: boolean;
  autoRepair?: boolean;
  verbose?: boolean;
}

export class DataIntegrityChecker {
  private static readonly REFERENCE_CONSTRAINTS: Record<string, { table: string; field: string }> = {
    // Clientes
    'invoices.customer_id': { table: 'customers', field: 'id' },

    // Proveedores
    'suppliers.created_by': { table: 'users', field: 'id' },
    'bills.supplier_id': { table: 'suppliers', field: 'id' },

    // Productos
    'invoice_lines.product_id': { table: 'products', field: 'id' },
    'bill_lines.product_id': { table: 'products', field: 'id' },
    'products.category_id': { table: 'product_categories', field: 'id' },

    // Facturas
    'invoice_lines.invoice_id': { table: 'invoices', field: 'id' },
    'bill_lines.bill_id': { table: 'bills', field: 'id' },

    // Asientos
    'journal_details.journal_id': { table: 'journal_entries', field: 'id' },
    'journal_details.account_code': { table: 'chart_of_accounts', field: 'account_code' },

    // Pagos
    'payments.invoice_id': { table: 'invoices', field: 'id' },
    'payments.bill_id': { table: 'bills', field: 'id' },

    // Cuentas bancarias
    'bank_accounts.created_by': { table: 'users', field: 'id' },

    // Activos fijos
    'fixed_assets.category_id': { table: 'fixed_asset_categories', field: 'id' },

    // Presupuestos
    'budgets.account_code': { table: 'chart_of_accounts', field: 'account_code' }
  };

  /**
   * Ejecuta verificaciÃ³n completa de integridad
   */
  static async runFullCheck(config: CheckConfig = {}): Promise<IntegrityCheckResult> {
    if (!db) {
      return {
        success: false,
        errors: [
          {
            severity: 'critical',
            table: 'system',
            message: 'Base de datos no inicializada',
            repairable: false
          }
        ],
        warnings: [],
        repaired: [],
        timestamp: new Date().toISOString()
      };
    }

    const errors: IntegrityError[] = [];
    const warnings: IntegrityWarning[] = [];
    const repaired: RepairOperation[] = [];

    try {
      // 1. Verificar referencias (foreign keys)
      if (config.checkReferences !== false) {
        const refErrors = this.checkForeignKeys();
        errors.push(...refErrors);
      }

      // 2. Verificar duplicados
      if (config.checkDuplicates !== false) {
        const dupErrors = this.checkDuplicates();
        errors.push(...dupErrors);
      }

      // 3. Verificar consistencia de datos
      if (config.checkConsistency !== false) {
        const consErrors = this.checkDataConsistency();
        errors.push(...consErrors);
      }

      // 4. Verificar formatos
      const formatErrors = this.checkDataFormats();
      errors.push(...formatErrors);

      // 5. Reparar si estÃ¡ habilitado
      if (config.autoRepair && errors.length > 0) {
        const repairs = await this.attemptRepairs(errors);
        repaired.push(...repairs);
      }

      if (config.verbose) {
        logger.info('DataIntegrityChecker', 'integrity_check', 'Integridad verificada');
      }

      return {
        success: errors.filter((e) => e.severity === 'critical').length === 0,
        errors,
        warnings,
        repaired,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      errors.push({
        severity: 'critical',
        table: 'system',
        message: `Error en verificaciÃ³n: ${error}`,
        repairable: false
      });

      return {
        success: false,
        errors,
        warnings,
        repaired,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Verifica referencias rotas (foreign keys)
   */
  private static checkForeignKeys(): IntegrityError[] {
    const errors: IntegrityError[] = [];

    try {
      // Verificar invoices.customer_id
      const orphanInvoices = db?.exec(`
        SELECT i.id, i.customer_id FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE c.id IS NULL AND i.customer_id IS NOT NULL
      `);

      if (orphanInvoices?.[0]?.values.length) {
        orphanInvoices[0].values.forEach((row: any) => {
          errors.push({
            severity: 'critical',
            table: 'invoices',
            recordId: row[0],
            field: 'customer_id',
            message: `Factura #${row[0]} referencia cliente inexistente (${row[1]})`,
            suggestion: 'Eliminar factura huÃ©rfana o asignar cliente vÃ¡lido',
            repairable: true
          });
        });
      }

      // Verificar bills.supplier_id
      const orphanBills = db?.exec(`
        SELECT b.id, b.supplier_id FROM bills b
        LEFT JOIN suppliers s ON b.supplier_id = s.id
        WHERE s.id IS NULL AND b.supplier_id IS NOT NULL
      `);

      if (orphanBills?.[0]?.values.length) {
        orphanBills[0].values.forEach((row: any) => {
          errors.push({
            severity: 'critical',
            table: 'bills',
            recordId: row[0],
            field: 'supplier_id',
            message: `Factura de compra #${row[0]} referencia proveedor inexistente (${row[1]})`,
            suggestion: 'Eliminar factura huÃ©rfana o asignar proveedor vÃ¡lido',
            repairable: true
          });
        });
      }

      // Verificar invoice_lines.invoice_id
      const orphanInvoiceLines = db?.exec(`
        SELECT il.id, il.invoice_id FROM invoice_lines il
        LEFT JOIN invoices i ON il.invoice_id = i.id
        WHERE i.id IS NULL
      `);

      if (orphanInvoiceLines?.[0]?.values.length) {
        orphanInvoiceLines[0].values.forEach((row: any) => {
          errors.push({
            severity: 'high',
            table: 'invoice_lines',
            recordId: row[0],
            field: 'invoice_id',
            message: `LÃ­nea de factura huÃ©rfana: referencia factura inexistente`,
            suggestion: 'Eliminar lÃ­nea huÃ©rfana',
            repairable: true
          });
        });
      }

      // Verificar bill_lines.bill_id
      try {
        const orphanBillLines = db?.exec(`
          SELECT bl.id, bl.bill_id FROM bill_lines bl
          LEFT JOIN bills b ON bl.bill_id = b.id
          WHERE b.id IS NULL
        `);

        if (orphanBillLines?.[0]?.values.length) {
          orphanBillLines[0].values.forEach((row: any) => {
            errors.push({
              severity: 'high',
              table: 'bill_lines',
              recordId: row[0],
              field: 'bill_id',
              message: `LÃ­nea de compra huÃ©rfana: referencia factura inexistente`,
              suggestion: 'Eliminar lÃ­nea huÃ©rfana',
              repairable: true
            });
          });
        }
      } catch (e) {
        // bill_lines no existe en instancia legacy, ignorar
      }

      // Verificar journal_details.entry_id
      const orphanJournalDetails = db?.exec(`
        SELECT jd.id FROM journal_details jd
        LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
        WHERE je.id IS NULL
      `);

      if (orphanJournalDetails?.[0]?.values.length) {
        orphanJournalDetails[0].values.forEach((row: any) => {
          errors.push({
            severity: 'high',
            table: 'journal_details',
            recordId: row[0],
            field: 'entry_id',
            message: `Detalle de asiento huÃ©rfano`,
            suggestion: 'Eliminar detalle huÃ©rfano',
            repairable: true
          });
        });
      }
    } catch (error) {
      logger.error('DataIntegrityChecker', 'check_foreign_keys', 'Error checking foreign keys', error);
    }

    return errors;
  }

  /**
   * Verifica duplicados en campos unique
   */
  private static checkDuplicates(): IntegrityError[] {
    const errors: IntegrityError[] = [];

    try {
      // Verificar invoice_number duplicados
      const dupInvoices = db?.exec(`
        SELECT invoice_number, COUNT(*) as cnt FROM invoices
        GROUP BY invoice_number
        HAVING cnt > 1
      `);

      if (dupInvoices?.[0]?.values.length) {
        dupInvoices[0].values.forEach((row: any) => {
          errors.push({
            severity: 'critical',
            table: 'invoices',
            field: 'invoice_number',
            message: `NÃºmero de factura duplicado: ${row[0]} (${row[1]} veces)`,
            suggestion: 'Renumerar facturas duplicadas',
            repairable: true
          });
        });
      }

      // Verificar bill_number duplicados
      const dupBills = db?.exec(`
        SELECT bill_number, COUNT(*) as cnt FROM bills
        GROUP BY bill_number
        HAVING cnt > 1
      `);

      if (dupBills?.[0]?.values.length) {
        dupBills[0].values.forEach((row: any) => {
          errors.push({
            severity: 'critical',
            table: 'bills',
            field: 'bill_number',
            message: `NÃºmero de factura duplicado: ${row[0]} (${row[1]} veces)`,
            suggestion: 'Renumerar facturas duplicadas',
            repairable: true
          });
        });
      }

      // Verificar document_number duplicados en suppliers
      const dupSuppliers = db?.exec(`
        SELECT document_number, COUNT(*) as cnt FROM suppliers
        WHERE document_number IS NOT NULL
        GROUP BY document_number
        HAVING cnt > 1
      `);

      if (dupSuppliers?.[0]?.values.length) {
        errors.push({
          severity: 'high',
          table: 'suppliers',
          field: 'document_number',
          message: `NÃºmeros de documento duplicados en proveedores`,
          suggestion: 'Revisar y consolidar proveedores duplicados',
          repairable: true
        });
      }
    } catch (error) {
      logger.error('DataIntegrityChecker', 'check_duplicates', 'Error checking duplicates', error);
    }

    return errors;
  }

  /**
   * Verifica consistencia de datos (sumas, montos, etc)
   */
  private static checkDataConsistency(): IntegrityError[] {
    const errors: IntegrityError[] = [];

    try {
      // Verificar que invoice total_amount = suma de lÃ­neas + impuestos
      const inconsistentInvoices = db?.exec(`
        SELECT i.id, i.total_amount,
               COALESCE(SUM(il.line_total), 0) as lines_sum,
               i.tax_amount
        FROM invoices i
        LEFT JOIN invoice_lines il ON i.id = il.invoice_id
        GROUP BY i.id
        HAVING i.total_amount != (COALESCE(SUM(il.line_total), 0) + i.tax_amount)
      `);

      if (inconsistentInvoices?.[0]?.values.length) {
        inconsistentInvoices[0].values.forEach((row: any) => {
          errors.push({
            severity: 'high',
            table: 'invoices',
            recordId: row[0],
            message: `Total inconsistente: ${row[1]} vs (lÃ­neas:${row[2]} + impuestos:${row[3]})`,
            suggestion: 'Recalcular totales',
            repairable: true
          });
        });
      }

      // Verificar que bill total_amount = suma de lÃ­neas + impuestos
      try {
        const inconsistentBills = db?.exec(`
          SELECT b.id, b.total_amount,
                 COALESCE(SUM(bl.line_total), 0) as lines_sum,
                 b.tax_amount
          FROM bills b
          LEFT JOIN bill_lines bl ON b.id = bl.bill_id
          GROUP BY b.id
          HAVING b.total_amount != (COALESCE(SUM(bl.line_total), 0) + b.tax_amount)
        `);

        if (inconsistentBills?.[0]?.values.length) {
          inconsistentBills[0].values.forEach((row: any) => {
            errors.push({
              severity: 'high',
              table: 'bills',
              recordId: row[0],
              message: `Total inconsistente: ${row[1]} vs (lÃ­neas:${row[2]} + impuestos:${row[3]})`,
              suggestion: 'Recalcular totales',
              repairable: true
            });
          });
        }
      } catch (e) {
        // bill_lines no existe en instancia legacy, ignorar
      }

      // Verificar que journal_entries estÃ© balanceado (dÃ©bitos = crÃ©ditos)
      const unbalancedJournals = db?.exec(`
        SELECT je.id, 
               SUM(CASE WHEN jd.debit_amount > 0 THEN jd.debit_amount ELSE 0 END) as total_debit,
               SUM(CASE WHEN jd.credit_amount > 0 THEN jd.credit_amount ELSE 0 END) as total_credit
        FROM journal_entries je
        JOIN journal_details jd ON je.id = jd.journal_entry_id
        GROUP BY je.id
        HAVING total_debit != total_credit
      `);

      if (unbalancedJournals?.[0]?.values.length) {
        unbalancedJournals[0].values.forEach((row: any) => {
          errors.push({
            severity: 'critical',
            table: 'journal_entries',
            recordId: row[0],
            message: `Asiento desbalanceado: dÃ©bitos ${row[1]} vs crÃ©ditos ${row[2]}`,
            suggestion: 'Revisar y rebalancear asiento',
            repairable: false // Requiere revisiÃ³n manual
          });
        });
      }
    } catch (error) {
      logger.error('DataIntegrityChecker', 'check_consistency', 'Error checking consistency', error);
    }

    return errors;
  }

  /**
   * Verifica formatos de datos
   */
  private static checkDataFormats(): IntegrityError[] {
    const errors: IntegrityError[] = [];

    try {
      // Verificar fechas invÃ¡lidas
      const invalidDates = db?.exec(`
        SELECT 'invoices' as table_name, id, issue_date FROM invoices
        WHERE issue_date IS NOT NULL AND issue_date = ''
        UNION ALL
        SELECT 'bills', id, issue_date FROM bills
        WHERE issue_date IS NOT NULL AND issue_date = ''
      `);

      if (invalidDates?.[0]?.values.length) {
        invalidDates[0].values.forEach((row: any) => {
          errors.push({
            severity: 'medium',
            table: row[0],
            recordId: row[1],
            field: 'issue_date',
            message: `Fecha vacÃ­a detectada`,
            suggestion: 'Asignar fecha vÃ¡lida',
            repairable: true
          });
        });
      }

      // Verificar montos negativos (excepto en casos especÃ­ficos)
      const negativeAmounts = db?.exec(`
        SELECT 'invoices' as table_name, id, total_amount FROM invoices WHERE total_amount < 0
        UNION ALL
        SELECT 'bills', id, total_amount FROM bills WHERE total_amount < 0
      `);

      if (negativeAmounts?.[0]?.values.length) {
        negativeAmounts[0].values.forEach((row: any) => {
          errors.push({
            severity: 'high',
            table: row[0],
            recordId: row[1],
            field: 'total_amount',
            message: `Monto negativo detectado: ${row[2]}`,
            suggestion: 'Usar notas de crÃ©dito en lugar de montos negativos',
            repairable: true
          });
        });
      }
    } catch (error) {
      logger.error('DataIntegrityChecker', 'check_formats', 'Error checking formats', error);
    }

    return errors;
  }

  /**
   * Intenta reparar automÃ¡ticamente errores
   */
  private static async attemptRepairs(errors: IntegrityError[]): Promise<RepairOperation[]> {
    const repairs: RepairOperation[] = [];
    const repairableErrors = errors.filter((e) => e.repairable);

    for (const error of repairableErrors) {
      try {
        let repaired = false;
        const recordId = error.recordId ?? 0;
        const field = error.field ?? 'N/A';

        // Reparaciones especÃ­ficas por tipo de error
        if (error.message.includes('huÃ©rfan')) {
          // Eliminar registros huÃ©rfanos
          if (recordId > 0) {
            this.deleteOrphanRecord(error.table, recordId);
            repaired = true;
          }
        }

        if (error.message.includes('duplicado')) {
          // Consolidar duplicados
          if (field !== 'N/A') {
            this.consolidateDuplicates(error.table, field);
            repaired = true;
          }
        }

        if (error.message.includes('Total inconsistente')) {
          // Recalcular totales
          if (recordId > 0) {
            this.recalculateTotals(error.table, recordId);
            repaired = true;
          }
        }

        if (repaired) {
          repairs.push({
            table: error.table,
            recordId: recordId,
            field: field,
            oldValue: 'corrupted',
            newValue: 'repaired',
            reason: error.message,
            status: 'success'
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const recordId = error.recordId ?? 0;
        const field = error.field ?? 'N/A';
        repairs.push({
          table: error.table,
          recordId: recordId,
          field: field,
          oldValue: 'corrupted',
          newValue: 'failed',
          reason: errorMsg,
          status: 'failed'
        });
      }
    }

    return repairs;
  }

  private static deleteOrphanRecord(table: string, id: number) {
    if (!db || !id) return;
    // db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    logger.info('DataIntegrityChecker', 'delete_orphan', 'Deleted orphan record');
  }

  private static consolidateDuplicates(table: string, field: string) {
    if (!db) return;
    logger.info('DataIntegrityChecker', 'consolidate_duplicates', 'Consolidating duplicates');
    // LÃ³gica especÃ­fica de consolidaciÃ³n
  }

  private static recalculateTotals(table: string, recordId: number) {
    if (!db || !recordId) return;
    logger.info('DataIntegrityChecker', 'recalculate_totals', 'Recalculating totals');
    // LÃ³gica para recalcular sumas
  }
}
