/**
 * Módulo 25 — Inventory Movements y Locations
 * Extraído de simple-db.ts líneas 12739–13083
 */

import { db, rowToEntity } from './db-core';
import { logger } from '../../core/logging/SystemLogger';

// ==========================================
// INVENTORY MOVEMENTS
// ==========================================

export function createInventoryMovement(movementData: {
  product_id: number;
  quantity: number;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'initial';
  reference_id?: number;
  reference_type?: 'invoice' | 'purchase_order' | 'adjustment' | 'migration';
  notes?: string;
  created_by?: number;
}): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO stock_movements(
        product_id, quantity, movement_type, reference_id, reference_type, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      movementData.product_id,
      movementData.quantity,
      movementData.movement_type,
      movementData.reference_id || null,
      movementData.reference_type || null,
      movementData.notes || null,
      movementData.created_by || 1
    ]);

    const result = db.exec('SELECT last_insert_rowid() as id');
    const movementId = result[0]?.values[0]?.[0] as number;

    if (movementData.movement_type === 'purchase' || movementData.movement_type === 'return') {
      db.run('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [movementData.quantity, movementData.product_id]);
    } else if (movementData.movement_type === 'sale' || movementData.movement_type === 'adjustment') {
      db.run('UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [Math.abs(movementData.quantity), movementData.product_id]);
    }

    stmt.free();
    db.run('COMMIT');

    logger.info('Inventory', 'movement_created', `Movimiento de inventario creado: ${movementId}`, { movementData });
    return { success: true, message: 'Movimiento de inventario creado exitosamente', id: movementId };

  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Inventory', 'movement_create_failed', 'Error al crear movimiento de inventario', { error: error.message });
    return { success: false, message: error.message };
  }
}

export function getInventoryMovementsWithFilters(filters: {
  productId?: number;
  movementType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
} = {}): any[] {
  if (!db) return [];

  try {
    let query = `
      SELECT
        sm.*,
        p.name as product_name,
        p.sku as product_sku,
        u.display_name as created_by_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.productId) { query += ' AND sm.product_id = ?'; params.push(filters.productId); }
    if (filters.movementType) { query += ' AND sm.movement_type = ?'; params.push(filters.movementType); }
    if (filters.startDate) { query += ' AND date(sm.created_at) >= date(?)'; params.push(filters.startDate); }
    if (filters.endDate) { query += ' AND date(sm.created_at) <= date(?)'; params.push(filters.endDate); }

    query += ' ORDER BY sm.created_at DESC';

    if (filters.limit) { query += ' LIMIT ?'; params.push(filters.limit); }

    const res = db.exec(query, params);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<any>((res[0].columns || (res[0] as any).lc), row));
  } catch (error) {
    logger.error('Inventory', 'get_movements_failed', 'Error al obtener movimientos de inventario', { error });
    return [];
  }
}

// ==========================================
// LOCATIONS
// ==========================================

export function createLocation(locationData: {
  name: string;
  code: string;
  address?: string;
  description?: string;
  is_active?: boolean;
  created_by?: number;
}): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const existing = db.exec('SELECT id FROM locations WHERE code = ?', [locationData.code]);
    if (existing[0] && existing[0].values.length > 0) {
      return { success: false, message: `El código de ubicación ${locationData.code} ya existe` };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO locations(name, code, address, description, is_active, created_by, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      locationData.name, locationData.code,
      locationData.address || null, locationData.description || null,
      locationData.is_active !== false ? 1 : 0,
      locationData.created_by || 1, locationData.created_by || 1
    ]);

    const id = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] as number;
    stmt.free();
    db.run('COMMIT');

    logger.info('Inventory', 'location_created', `Ubicación creada: ${id}`, { locationData });
    return { success: true, message: 'Ubicación creada exitosamente', id };

  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Inventory', 'location_create_failed', 'Error al crear ubicación', { error: error.message });
    return { success: false, message: error.message };
  }
}

export function getLocations(activeOnly: boolean = true): any[] {
  if (!db) return [];
  try {
    let query = 'SELECT * FROM locations';
    if (activeOnly) query += ' WHERE is_active = 1';
    query += ' ORDER BY name ASC';
    const res = db.exec(query);
    if (res.length === 0) return [];
    return res[0].values.map((row: any) => rowToEntity<any>((res[0].columns || (res[0] as any).lc), row));
  } catch (error) {
    logger.error('Inventory', 'get_locations_failed', 'Error al obtener ubicaciones', { error });
    return [];
  }
}

export function updateLocation(id: number, locationData: {
  name?: string;
  code?: string;
  address?: string;
  description?: string;
  is_active?: boolean;
  updated_by?: number;
}): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const existing = db.exec('SELECT id FROM locations WHERE id = ?', [id]);
    if (!existing[0] || existing[0].values.length === 0) return { success: false, message: 'Ubicación no encontrada' };

    if (locationData.code) {
      const codeExists = db.exec('SELECT id FROM locations WHERE code = ? AND id != ?', [locationData.code, id]);
      if (codeExists[0] && codeExists[0].values.length > 0) return { success: false, message: `El código ${locationData.code} ya está en uso` };
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (locationData.name !== undefined) { updates.push('name = ?'); params.push(locationData.name); }
    if (locationData.code !== undefined) { updates.push('code = ?'); params.push(locationData.code); }
    if (locationData.address !== undefined) { updates.push('address = ?'); params.push(locationData.address); }
    if (locationData.description !== undefined) { updates.push('description = ?'); params.push(locationData.description); }
    if (locationData.is_active !== undefined) { updates.push('is_active = ?'); params.push(locationData.is_active ? 1 : 0); }

    updates.push('updated_by = ?', 'updated_at = CURRENT_TIMESTAMP');
    params.push(locationData.updated_by || 1);
    params.push(id);

    db.run(`UPDATE locations SET ${updates.join(', ')} WHERE id = ?`, params);

    logger.info('Inventory', 'location_updated', `Ubicación actualizada: ${id}`, { locationData });
    return { success: true, message: 'Ubicación actualizada exitosamente' };

  } catch (error: any) {
    logger.error('Inventory', 'location_update_failed', 'Error al actualizar ubicación', { error: error.message });
    return { success: false, message: error.message };
  }
}

export function deleteLocation(id: number, userId: number = 1): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const existing = db.exec('SELECT id, name FROM locations WHERE id = ?', [id]);
    if (!existing[0] || existing[0].values.length === 0) return { success: false, message: 'Ubicación no encontrada' };

    const locationName = existing[0].values[0][1] as string;
    db.run('UPDATE locations SET is_active = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [userId, id]);

    logger.info('Inventory', 'location_deleted', `Ubicación desactivada: ${id} - ${locationName}`, { userId });
    return { success: true, message: `Ubicación "${locationName}" desactivada exitosamente` };

  } catch (error: any) {
    logger.error('Inventory', 'location_delete_failed', 'Error al eliminar ubicación', { error: error.message });
    return { success: false, message: error.message };
  }
}

export function createInitialLocations(): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const count = db.exec('SELECT COUNT(*) as count FROM locations')[0]?.values[0]?.[0] as number || 0;
    if (count > 0) return { success: true, message: 'Las ubicaciones ya existen' };

    const initialLocations = [
      { name: 'Almacén Principal', code: 'ALM-001', address: 'Bodega Central', description: 'Almacén principal de la empresa' },
      { name: 'Tienda', code: 'TDA-001', address: 'Local comercial', description: 'Área de ventas al público' },
      { name: 'Oficina', code: 'OFC-001', address: 'Área administrativa', description: 'Suministros de oficina' }
    ];

    db.run('BEGIN TRANSACTION');
    const stmt = db.prepare("INSERT INTO locations(name, code, address, description, is_active, created_by, updated_by) VALUES (?, ?, ?, ?, 1, 1, 1)");
    initialLocations.forEach(loc => { stmt.run([loc.name, loc.code, loc.address, loc.description]); });
    stmt.free();
    db.run('COMMIT');

    logger.info('Inventory', 'initial_locations_created', `Ubicaciones iniciales creadas: ${initialLocations.length}`);
    return { success: true, message: `${initialLocations.length} ubicaciones iniciales creadas exitosamente` };

  } catch (error: any) {
    db?.run('ROLLBACK');
    logger.error('Inventory', 'initial_locations_failed', 'Error al crear ubicaciones iniciales', { error: error.message });
    return { success: false, message: error.message };
  }
}
