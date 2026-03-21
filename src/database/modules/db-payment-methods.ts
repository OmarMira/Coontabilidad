/**
 * Módulo 18 — DR15 Periods y Payment Methods
 * Extraído de simple-db.ts líneas 9941–10470
 */

import { db } from './db-core';
import { saveDatabase, forceSaveDB } from './db-persistence';
import { generateSimpleHash } from './db-audit';
import { logger } from '../../core/logging/SystemLogger';
import type { PaymentMethod } from './db-types';

// ==========================================
// DR-15 PERIODS (re-export desde db-florida-tax)
// ==========================================

export function getAvailableDR15Periods(): string[] {
  const periods: string[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  for (let year = currentYear - 1; year <= currentYear; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const period = `${year}-Q${quarter}`;
      const [y, q] = period.split('-');
      const yearNum = parseInt(y);
      const quarterNum = parseInt(q.substring(1));
      const endMonth = quarterNum * 3;
      const lastDay = new Date(yearNum, endMonth, 0).getDate();
      const endDate = `${yearNum}-${endMonth.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      if (new Date(endDate) < currentDate) {
        periods.push(period);
      }
    }
  }

  return periods.reverse();
}

// ==========================================
// PAYMENT METHODS
// ==========================================

export function getPaymentMethods(): PaymentMethod[] {
  if (!db) { logger.error('PaymentMethods', 'get_no_db', 'Base de datos no disponible'); return []; }
  try {
    const result = db.exec(`
      SELECT id, method_name, method_type, is_active, requires_reference, created_at
      FROM payment_methods WHERE is_active = 1 ORDER BY method_name ASC
    `);
    if (result.length === 0) return [];
    const columns = (result[0].columns || (result[0] as any).lc);
    return result[0].values.map((row: any) => {
      const pm: any = {};
      columns.forEach((col: any, i: any) => { pm[col] = row[i]; });
      return pm as PaymentMethod;
    });
  } catch (error) {
    logger.error('PaymentMethods', 'get_failed', 'Error al obtener métodos de pago', null, error as Error);
    return [];
  }
}

export function getAllPaymentMethods(): PaymentMethod[] {
  if (!db) { logger.error('PaymentMethods', 'get_all_no_db', 'Base de datos no disponible'); return []; }
  try {
    const result = db.exec(`
      SELECT id, method_name, method_type, is_active, requires_reference, created_at
      FROM payment_methods ORDER BY method_name ASC
    `);
    if (result.length === 0) return [];
    const columns = (result[0].columns || (result[0] as any).lc);
    return result[0].values.map((row: any) => {
      const pm: any = {};
      columns.forEach((col: any, i: any) => { pm[col] = row[i]; });
      return pm as PaymentMethod;
    });
  } catch (error) {
    logger.error('PaymentMethods', 'get_all_failed', 'Error al obtener todos los métodos de pago', null, error as Error);
    return [];
  }
}

export async function createPaymentMethod(methodData: Omit<PaymentMethod, 'id' | 'created_at'>): Promise<{ success: boolean; message: string; id?: number }> {
  if (!db) return { success: false, message: 'Base de datos no disponible' };
  try {
    const existing = db.exec("SELECT id FROM payment_methods WHERE method_name = ?", [methodData.method_name]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return { success: false, message: `Ya existe un método de pago con el nombre "${methodData.method_name}"` };
    }
    db.exec("INSERT INTO payment_methods(method_name, method_type, is_active, requires_reference) VALUES(?, ?, ?, ?)", [
      methodData.method_name, methodData.method_type,
      methodData.is_active ? 1 : 0, methodData.requires_reference ? 1 : 0
    ]);
    const newId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    const auditData = { method_name: methodData.method_name, method_type: methodData.method_type, is_active: methodData.is_active };
    db.exec("INSERT INTO audit_log(table_name, record_id, action, new_values, user_id, audit_hash) VALUES(?, ?, ?, ?, ?, ?)",
      ['payment_methods', newId, 'INSERT', JSON.stringify(auditData), 1, generateSimpleHash(auditData)]);
    logger.info('PaymentMethods', 'create_success', 'Método de pago creado', { id: newId, method_name: methodData.method_name });
    await forceSaveDB();
    return { success: true, message: `Método de pago "${methodData.method_name}" creado correctamente`, id: newId };
  } catch (error) {
    logger.error('PaymentMethods', 'create_failed', 'Error al crear método de pago', methodData, error as Error);
    return { success: false, message: `Error al crear método de pago: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

export function updatePaymentMethod(id: number, methodData: Partial<PaymentMethod>): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };
  try {
    const existingResult = db.exec("SELECT id, method_name FROM payment_methods WHERE id = ?", [id]);
    if (existingResult.length === 0 || existingResult[0].values.length === 0) {
      return { success: false, message: 'Método de pago no encontrado' };
    }
    const currentName = existingResult[0].values[0][1] as string;
    if (methodData.method_name && methodData.method_name !== currentName) {
      const dup = db.exec("SELECT id FROM payment_methods WHERE method_name = ? AND id != ?", [methodData.method_name, id]);
      if (dup.length > 0 && dup[0].values.length > 0) {
        return { success: false, message: `Ya existe un método de pago con el nombre "${methodData.method_name}"` };
      }
    }
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    if (methodData.method_name !== undefined) { updateFields.push('method_name = ?'); updateValues.push(methodData.method_name); }
    if (methodData.method_type !== undefined) { updateFields.push('method_type = ?'); updateValues.push(methodData.method_type); }
    if (methodData.is_active !== undefined) { updateFields.push('is_active = ?'); updateValues.push(methodData.is_active ? 1 : 0); }
    if (methodData.requires_reference !== undefined) { updateFields.push('requires_reference = ?'); updateValues.push(methodData.requires_reference ? 1 : 0); }
    if (updateFields.length === 0) return { success: false, message: 'No hay campos para actualizar' };
    updateValues.push(id);
    db.exec(`UPDATE payment_methods SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
    db.exec("INSERT INTO audit_log(table_name, record_id, action, new_values, user_id, audit_hash) VALUES(?, ?, ?, ?, ?, ?)",
      ['payment_methods', id, 'UPDATE', JSON.stringify(methodData), 1, generateSimpleHash(methodData)]);
    logger.info('PaymentMethods', 'update_success', 'Método de pago actualizado', { id });
    setTimeout(() => saveDatabase(), 1000);
    return { success: true, message: 'Método de pago actualizado correctamente' };
  } catch (error) {
    logger.error('PaymentMethods', 'update_failed', 'Error al actualizar método de pago', { id }, error as Error);
    return { success: false, message: `Error al actualizar método de pago: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

export function deletePaymentMethod(id: number): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };
  try {
    const existingResult = db.exec("SELECT id, method_name FROM payment_methods WHERE id = ?", [id]);
    if (existingResult.length === 0 || existingResult[0].values.length === 0) {
      return { success: false, message: 'Método de pago no encontrado' };
    }
    const methodName = existingResult[0].values[0][1] as string;
    const slug = methodName.toLowerCase().replace(' ', '_');
    const usageResult = db.exec(`
      SELECT COUNT(*) as count FROM(
        SELECT 1 FROM payments WHERE payment_method = ?
        UNION ALL
        SELECT 1 FROM supplier_payments WHERE payment_method = ?
      )
    `, [slug, slug]);
    const usageCount = usageResult[0].values[0][0] as number;
    if (usageCount > 0) {
      db.exec("UPDATE payment_methods SET is_active = 0 WHERE id = ?", [id]);
      logger.info('PaymentMethods', 'delete_soft', 'Método de pago desactivado (en uso)', { id, methodName });
      return { success: true, message: `Método de pago "${methodName}" desactivado (estaba en uso en ${usageCount} transacciones)` };
    } else {
      db.exec("DELETE FROM payment_methods WHERE id = ?", [id]);
      db.exec("INSERT INTO audit_log(table_name, record_id, action, old_values, user_id, audit_hash) VALUES(?, ?, ?, ?, ?, ?)",
        ['payment_methods', id, 'DELETE', JSON.stringify({ method_name: methodName }), 1, generateSimpleHash({ method_name: methodName })]);
      logger.info('PaymentMethods', 'delete_hard', 'Método de pago eliminado', { id, methodName });
      return { success: true, message: `Método de pago "${methodName}" eliminado correctamente` };
    }
  } catch (error) {
    logger.error('PaymentMethods', 'delete_failed', 'Error al eliminar método de pago', { id }, error as Error);
    return { success: false, message: `Error al eliminar método de pago: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

export function getPaymentMethodById(id: number): PaymentMethod | null {
  if (!db) { logger.error('PaymentMethods', 'get_by_id_no_db', 'Base de datos no disponible'); return null; }
  try {
    const result = db.exec(`
      SELECT id, method_name, method_type, is_active, requires_reference, created_at
      FROM payment_methods WHERE id = ?
    `, [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    const columns = (result[0].columns || (result[0] as any).lc);
    const pm: any = {};
    columns.forEach((col: any, i: any) => { pm[col] = result[0].values[0][i]; });
    return pm as PaymentMethod;
  } catch (error) {
    logger.error('PaymentMethods', 'get_by_id_failed', 'Error al obtener método de pago', { id }, error as Error);
    return null;
  }
}

export function canDeletePaymentMethod(id: number): { canDelete: boolean; reason?: string } {
  if (!db) return { canDelete: false, reason: 'Base de datos no disponible' };
  try {
    const existingResult = db.exec("SELECT method_name FROM payment_methods WHERE id = ?", [id]);
    if (existingResult.length === 0 || existingResult[0].values.length === 0) {
      return { canDelete: false, reason: 'Método de pago no encontrado' };
    }
    const methodName = existingResult[0].values[0][0] as string;
    const slug = methodName.toLowerCase().replace(' ', '_');
    const usageResult = db.exec(`
      SELECT COUNT(*) as count FROM(
        SELECT 1 FROM payments WHERE payment_method = ?
        UNION ALL
        SELECT 1 FROM supplier_payments WHERE payment_method = ?
      )
    `, [slug, slug]);
    const usageCount = usageResult[0].values[0][0] as number;
    if (usageCount > 0) {
      return { canDelete: false, reason: `El método de pago está siendo usado en ${usageCount} transacciones. Solo se puede desactivar.` };
    }
    return { canDelete: true };
  } catch (error) {
    logger.error('PaymentMethods', 'can_delete_failed', 'Error al verificar si se puede eliminar', { id }, error as Error);
    return { canDelete: false, reason: 'Error al verificar el método de pago' };
  }
}
