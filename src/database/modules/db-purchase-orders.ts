/**
 * Módulo 24 — Purchase Orders e Inventory (Kardex)
 * Extraído de simple-db.ts líneas 12404–12731
 */

import { db } from './db-core';
import { logAuditEvent } from './db-audit';
import { logger } from '../../core/logging/SystemLogger';
import type { PurchaseOrder, PurchaseOrderItem } from './db-types';

export interface StockMovement {
  id: number;
  product_id: number;
  quantity: number;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'initial';
  reference_id: number;
  reference_type: 'invoice' | 'purchase_order' | 'adjustment' | 'migration';
  notes?: string;
  created_at: string;
  created_by: number;
}

export interface KardexFilters {
  productId?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  referenceId?: number;
}

export interface KardexEntry extends StockMovement {
  product_name: string;
  product_sku: string;
  user_name?: string;
  formatted_date?: string;
}

// ==========================================
// PURCHASE ORDERS
// ==========================================

export const getPurchaseOrders = (filters: { status?: string; supplier_id?: number } = {}): PurchaseOrder[] => {
  if (!db) return [];
  try {
    let query = `
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE 1 = 1
    `;
    const params: any[] = [];
    if (filters.status) { query += ' AND po.status = ?'; params.push(filters.status); }
    if (filters.supplier_id) { query += ' AND po.supplier_id = ?'; params.push(filters.supplier_id); }
    query += ' ORDER BY po.created_at DESC';

    const res = db.exec(query, params);
    if (res.length > 0 && res[0].values.length > 0) {
      const cols = (res[0].columns || (res[0] as any).lc);
      return res[0].values.map((row: any) => {
        const po: any = {};
        cols.forEach((col: any, i: any) => { po[col] = row[i]; });
        return po as PurchaseOrder;
      });
    }
    return [];
  } catch (e) {
    logger.error('PurchaseOrders', 'get', 'Error fetching POs', e);
    return [];
  }
};

export const createPurchaseOrder = (order: Omit<PurchaseOrder, 'id'>): { success: boolean; id?: number; message?: string } => {
  if (!db) return { success: false, message: 'DB not initialized' };
  try {
    db.run('BEGIN TRANSACTION');
    db.run(`
      INSERT INTO purchase_orders(supplier_id, order_number, order_date, expected_date, status, total_amount, notes, created_by)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      order.supplier_id, order.order_number, order.order_date,
      order.expected_date || null, order.status || 'draft',
      order.total_amount, order.notes || null, order.created_by || 1
    ]);
    const poId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;

    if (order.items && order.items.length > 0) {
      const stmt = db.prepare("INSERT INTO purchase_order_lines(purchase_order_id, product_id, quantity, unit_price) VALUES(?, ?, ?, ?)");
      for (const item of order.items) {
        stmt.run([poId, item.product_id, item.quantity, item.unit_price]);
      }
      stmt.free();
    }

    logAuditEvent('purchase_orders', poId, 'create', null, { order_number: order.order_number }, order.created_by || 1);
    db.run('COMMIT');
    return { success: true, id: poId };
  } catch (e) {
    db.run('ROLLBACK');
    logger.error('PurchaseOrders', 'create', 'Failed to create PO', e);
    return { success: false, message: (e as Error).message };
  }
};

export const receivePurchaseOrder = (poId: number, userId: number = 1): { success: boolean; message?: string } => {
  if (!db) return { success: false, message: 'DB not initialized' };
  try {
    const res = db.exec("SELECT * FROM purchase_order_lines WHERE purchase_order_id = ?", [poId]);
    if (res.length === 0 || res[0].values.length === 0) return { success: false, message: 'Order has no items' };

    const cols = (res[0].columns || (res[0] as any).lc);
    const items = res[0].values.map((row: any) => {
      const item: any = {};
      cols.forEach((col: any, i: any) => { item[col] = row[i]; });
      return item as PurchaseOrderItem;
    });

    db.run('BEGIN TRANSACTION');
    db.run("UPDATE purchase_orders SET status = 'received', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [poId]);

    for (const item of items) {
      db.run("UPDATE purchase_order_lines SET received_quantity = ? WHERE id = ?", [item.quantity, item.id as number]);
      db.run("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?", [item.quantity, item.product_id]);
      db.run(`
        INSERT INTO stock_movements(product_id, quantity, movement_type, reference_id, reference_type, created_by)
        VALUES(?, ?, 'purchase', ?, 'purchase_order', ?)
      `, [item.product_id, item.quantity, poId, userId]);
    }

    logAuditEvent('purchase_orders', poId, 'receive', null, { status: 'received' }, userId);
    db.run('COMMIT');
    return { success: true };
  } catch (e) {
    db.run('ROLLBACK');
    logger.error('PurchaseOrders', 'receive', 'Failed to receive PO', e);
    return { success: false, message: (e as Error).message };
  }
};

export const getStockMovements = (productId?: number): StockMovement[] => {
  if (!db) return [];
  try {
    let query = "SELECT * FROM stock_movements";
    const params: any[] = [];
    if (productId) { query += " WHERE product_id = ?"; params.push(productId); }
    query += " ORDER BY created_at DESC LIMIT 100";

    const res = db.exec(query, params);
    if (res.length > 0 && res[0].values.length > 0) {
      const cols = (res[0].columns || (res[0] as any).lc);
      return res[0].values.map((row: any) => {
        const sm: any = {};
        cols.forEach((col: any, i: any) => { sm[col] = row[i]; });
        return sm as StockMovement;
      });
    }
    return [];
  } catch (e) { return []; }
};

// ==========================================
// KARDEX
// ==========================================

export const getKardexMovements = (filters: KardexFilters = {}): KardexEntry[] => {
  if (!db) return [];
  try {
    let query = `
      SELECT sm.*, p.name as product_name, p.sku as product_sku, u.display_name as user_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
      WHERE 1 = 1
    `;
    const params: any[] = [];

    if (filters.productId) { query += ' AND sm.product_id = ?'; params.push(filters.productId); }
    if (filters.type) { query += ' AND sm.movement_type = ?'; params.push(filters.type); }
    if (filters.startDate) { query += ' AND date(sm.created_at) >= date(?)'; params.push(filters.startDate); }
    if (filters.endDate) { query += ' AND date(sm.created_at) <= date(?)'; params.push(filters.endDate); }
    if (filters.referenceId) { query += ' AND sm.reference_id = ?'; params.push(filters.referenceId); }

    query += filters.productId ? ' ORDER BY sm.created_at ASC' : ' ORDER BY sm.created_at DESC';

    const res = db.exec(query, params);
    if (res.length > 0 && res[0].values.length > 0) {
      const cols = (res[0].columns || (res[0] as any).lc);
      return res[0].values.map((row: any) => {
        const item: any = {};
        cols.forEach((col: any, i: any) => { item[col] = row[i]; });
        try { item.formatted_date = new Date(item.created_at).toLocaleString(); } catch { item.formatted_date = item.created_at; }
        return item as KardexEntry;
      });
    }
    return [];
  } catch (e) {
    logger.error('Kardex', 'get_movements', 'Error fetching Kardex', e);
    return [];
  }
};
