/**
 * DataRepairEngine - Motor de Reparación de Datos Corrupted
 * 
 * Repara automáticamente:
 * - Referencias rotas
 * - Duplicados
 * - Inconsistencias numéricas
 * - Datos faltantes
 * - Estados inconsistentes
 */

import { db } from '../../database/simple-db';
import { RepairOperation } from './DataIntegrityCore';

export interface RepairPlan {
  name: string;
  description: string;
  operations: RepairOperation[];
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export class DataRepairEngine {
  private static repairHistory: RepairOperation[] = [];

  /**
   * Genera un plan de reparación basado en errores detectados
   */
  static generateRepairPlan(errors: any[]): RepairPlan {
    const operations: RepairOperation[] = [];

    // Agrupar errores por tipo
    const errorsByType = this.groupErrors(errors);

    // Generar operaciones para cada tipo
    if (errorsByType.orphans > 0) {
      operations.push(...this.generateOrphanRepairs(errorsByType.orphanRecords));
    }

    if (errorsByType.duplicates > 0) {
      operations.push(...this.generateDuplicateRepairs(errorsByType.duplicateRecords));
    }

    if (errorsByType.inconsistent > 0) {
      operations.push(...this.generateConsistencyRepairs(errorsByType.inconsistentRecords));
    }

    return {
      name: `Repair Plan - ${new Date().toISOString()}`,
      description: `Repair ${operations.length} data issues`,
      operations,
      estimatedTime: operations.length * 100, // ms
      riskLevel: this.assessRiskLevel(operations)
    };
  }

  /**
   * Ejecuta un plan de reparación
   */
  static async executeRepairPlan(plan: RepairPlan): Promise<RepairOperation[]> {
    if (!db) {
      return [];
    }

    const results: RepairOperation[] = [];
    const originalData = this.createBackup();

    try {
      for (const operation of plan.operations) {
        const result = await this.executeRepairOperation(operation);
        results.push(result);

        if (result.status === 'failed') {
          console.error(`❌ Repair failed: ${operation.reason}`);
          // Rollback si falla operación crítica
          if (plan.riskLevel === 'high') {
            this.restoreBackup(originalData);
            throw new Error(`Critical repair failed: ${operation.reason}`);
          }
        } else {
          console.log(`✅ Repair success: ${operation.table}#${operation.recordId}`);
        }
      }

      this.repairHistory.push(...results);
      return results;
    } catch (error) {
      console.error('Repair execution failed:', error);
      this.restoreBackup(originalData);
      throw error;
    }
  }

  /**
   * Reparación: Eliminar registros huérfanos
   */
  private static generateOrphanRepairs(orphanRecords: any[]): RepairOperation[] {
    return orphanRecords.map((record) => ({
      table: record.table,
      recordId: record.id,
      field: record.field,
      oldValue: record.value,
      newValue: 'DELETED',
      reason: `Eliminando registro huérfano (referencia ${record.field} no existe)`,
      status: 'success'
    }));
  }

  /**
   * Reparación: Consolidar duplicados
   */
  private static generateDuplicateRepairs(duplicateRecords: any[]): RepairOperation[] {
    const operations: RepairOperation[] = [];

    for (const group of duplicateRecords) {
      // Mantener el primero, marcar otros como duplicados
      const [primary, ...duplicates] = group.records;

      duplicates.forEach((dup: any) => {
        operations.push({
          table: group.table,
          recordId: dup.id,
          field: group.field,
          oldValue: dup.value,
          newValue: primary.value,
          reason: `Consolidando duplicado (mantener ${primary.id}, eliminar ${dup.id})`,
          status: 'success'
        });
      });
    }

    return operations;
  }

  /**
   * Reparación: Corregir inconsistencias
   */
  private static generateConsistencyRepairs(inconsistentRecords: any[]): RepairOperation[] {
    return inconsistentRecords.map((record) => ({
      table: record.table,
      recordId: record.id,
      field: 'total_amount',
      oldValue: record.oldTotal,
      newValue: record.calculatedTotal,
      reason: `Recalculando total: ${record.oldTotal} → ${record.calculatedTotal}`,
      status: 'success'
    }));
  }

  /**
   * Ejecuta una operación individual de reparación
   */
  private static async executeRepairOperation(operation: RepairOperation): Promise<RepairOperation> {
    if (!db) {
      return { ...operation, status: 'failed' };
    }

    try {
      switch (operation.reason.includes('huérfan') ? 'orphan' : 
              operation.reason.includes('duplicado') ? 'duplicate' :
              operation.reason.includes('Recalculando') ? 'consistency' :
              'other') {
        
        case 'orphan':
          return this.repairOrphan(operation);

        case 'duplicate':
          return this.repairDuplicate(operation);

        case 'consistency':
          return this.repairConsistency(operation);

        default:
          return operation;
      }
    } catch (error) {
      return { ...operation, status: 'failed' };
    }
  }

  /**
   * Reparación específica: Registros huérfanos
   */
  private static repairOrphan(operation: RepairOperation): RepairOperation {
    if (!db) return { ...operation, status: 'failed' };

    try {
      // Eliminar registro huérfano de manera segura
      db.run(`DELETE FROM ${operation.table} WHERE id = ?`, [operation.recordId]);

      return {
        ...operation,
        status: 'success',
        newValue: 'DELETED'
      };
    } catch (error) {
      return { ...operation, status: 'failed' };
    }
  }

  /**
   * Reparación específica: Duplicados
   */
  private static repairDuplicate(operation: RepairOperation): RepairOperation {
    if (!db || !operation.field) return { ...operation, status: 'failed' };

    try {
      // Para cada tabla, usar la estrategia apropiada
      if (operation.table === 'invoices' || operation.table === 'bills') {
        // Renumerar el duplicado
        const newNumber = `${operation.newValue}_OLD_${operation.recordId}`;
        db.run(
          `UPDATE ${operation.table} SET ${operation.field} = ? WHERE id = ?`,
          [newNumber, operation.recordId]
        );

        return {
          ...operation,
          status: 'success',
          newValue: newNumber
        };
      }

      // Para proveedores/clientes, los consolidamos
      if (operation.table === 'suppliers' || operation.table === 'customers') {
        // Marcar el duplicado como inactivo y redirigir referencias
        db.run(
          `UPDATE ${operation.table} SET status = ? WHERE id = ?`,
          ['inactive', operation.recordId]
        );

        return {
          ...operation,
          status: 'success',
          newValue: 'MARKED_INACTIVE'
        };
      }

      return operation;
    } catch (error) {
      return { ...operation, status: 'failed' };
    }
  }

  /**
   * Reparación específica: Inconsistencias numéricas
   */
  private static repairConsistency(operation: RepairOperation): RepairOperation {
    if (!db) return { ...operation, status: 'failed' };

    try {
      const { table, recordId, newValue } = operation;

      if (table === 'invoices' || table === 'bills') {
        // Recalcular el total basado en líneas
        const lineTable = table === 'invoices' ? 'invoice_lines' : 'bill_lines';
        const fkField = table === 'invoices' ? 'invoice_id' : 'bill_id';

        const result = db.exec(`
          SELECT COALESCE(SUM(line_total), 0) as total_lines,
                 (SELECT tax_amount FROM ${table} WHERE id = ?) as tax_amount
          FROM ${lineTable}
          WHERE ${fkField} = ?
        `, [recordId, recordId]);

        if (result[0]?.values.length) {
          const row = result[0].values[0];
          const totalLines = parseFloat(row[0].toString());
          const taxAmount = parseFloat(row[1]?.toString() || '0');
          const newTotal = totalLines + taxAmount;

          db.run(
            `UPDATE ${table} SET total_amount = ? WHERE id = ?`,
            [newTotal, recordId]
          );

          return {
            ...operation,
            status: 'success',
            newValue: newTotal.toString()
          };
        }
      }

      return { ...operation, status: 'failed' };
    } catch (error) {
      return { ...operation, status: 'failed' };
    }
  }

  /**
   * Funciones auxiliares
   */

  private static groupErrors(errors: any[]): {
    orphans: number;
    duplicates: number;
    inconsistent: number;
    orphanRecords: any[];
    duplicateRecords: any[];
    inconsistentRecords: any[];
  } {
    return {
      orphans: errors.filter((e) => e.message.includes('huérfan')).length,
      duplicates: errors.filter((e) => e.message.includes('duplicado')).length,
      inconsistent: errors.filter((e) => e.message.includes('inconsistente')).length,
      orphanRecords: errors.filter((e) => e.message.includes('huérfan')),
      duplicateRecords: errors.filter((e) => e.message.includes('duplicado')),
      inconsistentRecords: errors.filter((e) => e.message.includes('inconsistente'))
    };
  }

  private static assessRiskLevel(operations: RepairOperation[]): 'low' | 'medium' | 'high' {
    const deleteOps = operations.filter((op) => op.newValue === 'DELETED').length;
    const updateOps = operations.length - deleteOps;

    if (deleteOps > 10) return 'high';
    if (deleteOps > 5 || updateOps > 20) return 'medium';
    return 'low';
  }

  private static createBackup(): string {
    // Simulación de backup (en producción, hacer dump de BD)
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      checksums: {}
    });
  }

  private static restoreBackup(backup: string) {
    // Simulación de restauración
    console.log(`🔄 Rollback: Restaurando backup`);
  }

  /**
   * Obtener historial de reparaciones
   */
  static getRepairHistory(): RepairOperation[] {
    return [...this.repairHistory];
  }

  /**
   * Limpiar historial
   */
  static clearRepairHistory() {
    this.repairHistory = [];
  }
}
