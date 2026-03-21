/**
 * Módulo 16 — Products y Categorías
 * Extraído de simple-db.ts líneas 8876–9572
 */

import { db } from './db-core';
import { saveDatabase } from './db-persistence';
import { logAuditEvent } from './db-audit';
import { logger } from '../../core/logging/SystemLogger';
import type { Product, ProductCategory, Supplier } from './db-types';

// ==========================================
// PRODUCT CATEGORIES
// ==========================================

export function getProductCategories(): ProductCategory[] {
  try {
    if (!db) throw new Error('Base de datos no inicializada');
    const result = db.exec(`
      SELECT c.*, p.name as parent_name
      FROM product_categories c
      LEFT JOIN product_categories p ON c.parent_id = p.id
      WHERE c.active = 1 ORDER BY c.name
    `);
    if (result.length === 0) return [];
    const columns = (result[0].columns || (result[0] as any).lc);
    return result[0].values.map((row: any) => {
      const cat: any = {};
      columns.forEach((col: any, i: any) => { cat[col] = row[i]; });
      return cat as ProductCategory;
    });
  } catch (error) {
    logger.error('ProductCategories', 'get_failed', 'Error al obtener categorías', null, error as Error);
    return [];
  }
}

export function createProductCategory(categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>, userId?: number): { success: boolean; message: string; id?: number } {
  try {
    if (!db) throw new Error('Base de datos no inicializada');
    if (!categoryData.name?.trim()) return { success: false, message: 'El nombre de la categoría es requerido' };
    const existing = db.exec("SELECT id FROM product_categories WHERE LOWER(name) = LOWER(?) AND active = 1", [categoryData.name.trim()]);
    if (existing.length > 0 && existing[0].values.length > 0) return { success: false, message: 'Ya existe una categoría con ese nombre' };
    const now = new Date().toISOString();
    const stmt = db.prepare("INSERT INTO product_categories(name, description, parent_id, tax_rate, active, created_at, updated_at, created_by, updated_by) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)");
    stmt.run([categoryData.name.trim(), categoryData.description || null, categoryData.parent_id || null,
      (categoryData as any).tax_rate || 0, categoryData.active ? 1 : 0, now, now, userId || 1, userId || 1]);
    const id = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] as number || 0;
    stmt.free();
    logAuditEvent('product_categories', id, 'INSERT', null, JSON.stringify(categoryData), userId);
    logger.info('ProductCategories', 'create_success', 'Categoría creada', { id, name: categoryData.name });
    return { success: true, message: `Categoría "${categoryData.name}" creada correctamente`, id };
  } catch (error) {
    logger.error('ProductCategories', 'create_failed', 'Error al crear categoría', categoryData, error as Error);
    return { success: false, message: `Error al crear categoría: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

export function updateProductCategory(id: number, categoryData: Partial<ProductCategory>, userId?: number): { success: boolean; message: string } {
  try {
    if (!db) throw new Error('Base de datos no inicializada');
    const currentResult = db.exec('SELECT * FROM product_categories WHERE id = ?', [id]);
    if (currentResult.length === 0 || currentResult[0].values.length === 0) return { success: false, message: 'Categoría no encontrada' };
    const stmt = db.prepare(`
      UPDATE product_categories SET
        name = COALESCE(?, name), description = COALESCE(?, description),
        parent_id = COALESCE(?, parent_id), tax_rate = COALESCE(?, tax_rate),
        active = COALESCE(?, active), updated_at = ?, updated_by = ?
      WHERE id = ?
    `);
    stmt.run([categoryData.name || null, categoryData.description || null, categoryData.parent_id || null,
      (categoryData as any).tax_rate || null, categoryData.active !== undefined ? (categoryData.active ? 1 : 0) : null,
      new Date().toISOString(), userId || 1, id]);
    stmt.free();
    logAuditEvent('product_categories', id, 'UPDATE', JSON.stringify(currentResult[0].values[0]), JSON.stringify(categoryData), userId);
    logger.info('ProductCategories', 'update_success', 'Categoría actualizada', { id });
    return { success: true, message: 'Categoría actualizada correctamente' };
  } catch (error) {
    logger.error('ProductCategories', 'update_failed', 'Error al actualizar categoría', { id }, error as Error);
    return { success: false, message: `Error al actualizar categoría: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

export function deleteProductCategory(id: number, userId?: number): { success: boolean; message: string } {
  try {
    if (!db) throw new Error('Base de datos no inicializada');
    const productCount = db.exec('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND active = 1', [id])[0]?.values[0]?.[0] as number || 0;
    if (productCount > 0) return { success: false, message: `No se puede eliminar la categoría porque tiene ${productCount} producto(s) asociado(s)` };
    const subcategoryCount = db.exec('SELECT COUNT(*) as count FROM product_categories WHERE parent_id = ? AND active = 1', [id])[0]?.values[0]?.[0] as number || 0;
    if (subcategoryCount > 0) return { success: false, message: `No se puede eliminar la categoría porque tiene ${subcategoryCount} subcategoría(s)` };
    const currentResult = db.exec('SELECT * FROM product_categories WHERE id = ?', [id]);
    const stmt = db.prepare('UPDATE product_categories SET active = 0, updated_at = ? WHERE id = ?');
    stmt.run([new Date().toISOString(), id]);
    stmt.free();
    logAuditEvent('product_categories', id, 'DELETE', JSON.stringify(currentResult[0]?.values[0]), null, userId);
    logger.info('ProductCategories', 'delete_success', 'Categoría eliminada', { id });
    return { success: true, message: 'Categoría eliminada correctamente' };
  } catch (error) {
    logger.error('ProductCategories', 'delete_failed', 'Error al eliminar categoría', { id }, error as Error);
    return { success: false, message: `Error al eliminar categoría: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

// ==========================================
// PRODUCTS
// ==========================================

function mapProductRow(columns: string[], row: any): Product {
  const product: any = {};
  columns.forEach((col: any, index: any) => {
    if (col === 'category_name' && row[index]) {
      product.category = { name: row[index] as string } as ProductCategory;
    } else if (col === 'supplier_name' && row[index]) {
      product.supplier = { name: row[index] as string } as Supplier;
    } else {
      product[col] = row[index];
    }
  });
  return product as Product;
}

export function getProducts(): Product[] {
  try {
    if (!db) throw new Error('Base de datos no inicializada');
    const result = db.exec(`
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.active = 1 ORDER BY p.name
    `);
    if (result.length === 0) return [];
    const columns = (result[0].columns || (result[0] as any).lc);
    return result[0].values.map((row: any) => mapProductRow(columns, row));
  } catch (error) {
    logger.error('Products', 'get_failed', 'Error al obtener productos', null, error as Error);
    return [];
  }
}

export function getProductById(id: number): Product | null {
  try {
    if (!db) return null;
    const result = db.exec(`
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `, [id]);
    if (result.length === 0 || result[0].values.length === 0) return null;
    const columns = (result[0].columns || (result[0] as any).lc);
    return mapProductRow(columns, result[0].values[0]);
  } catch (error) {
    logger.error('Products', 'get_by_id_failed', 'Error al obtener producto por ID', { id }, error as Error);
    return null;
  }
}

export function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>, userId?: number): { success: boolean; message: string; id?: number } {
  try {
    if (!db) throw new Error('Base de datos no inicializada');
    if (!productData.sku?.trim()) return { success: false, message: 'El SKU es requerido' };
    if (!productData.name?.trim()) return { success: false, message: 'El nombre del producto es requerido' };
    if (productData.price < 0) return { success: false, message: 'El precio no puede ser negativo' };
    const existing = db.exec("SELECT id FROM products WHERE LOWER(sku) = LOWER(?) AND active = 1", [productData.sku.trim()]);
    if (existing.length > 0 && existing[0].values.length > 0) return { success: false, message: 'Ya existe un producto con ese SKU' };
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO products(
        sku, name, description, price, cost, category_id, unit_of_measure,
        taxable, tax_rate, stock_quantity, min_stock_level, max_stock_level,
        reorder_point, supplier_id, barcode, image_path, weight, dimensions,
        is_service, service_duration, warranty_period, notes, active,
        created_at, updated_at, created_by, updated_by
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      productData.sku.trim(), productData.name.trim(), productData.description || null,
      productData.price, productData.cost || 0, productData.category_id || null,
      productData.unit_of_measure || 'unidad', productData.taxable ? 1 : 0,
      productData.tax_rate || null, productData.stock_quantity || 0,
      productData.min_stock_level || 0, productData.max_stock_level || 100,
      productData.reorder_point || 10, productData.supplier_id || null,
      productData.barcode || null, productData.image_path || null,
      productData.weight || null, productData.dimensions || null,
      productData.is_service ? 1 : 0, productData.service_duration || null,
      productData.warranty_period || null, productData.notes || null,
      productData.active ? 1 : 0, now, now, userId || 1, userId || 1
    ]);
    const id = db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] as number || 0;
    stmt.free();
    logAuditEvent('products', id, 'INSERT', null, JSON.stringify(productData), userId);
    setTimeout(() => saveDatabase(), 1000);
    return { success: true, message: `Producto "${productData.name}" creado correctamente`, id };
  } catch (error) {
    logger.error('Products', 'create_failed', 'Error al crear producto', productData, error as Error);
    return { success: false, message: `Error al crear producto: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

export function updateProduct(id: number, productData: Partial<Product>, userId?: number): { success: boolean; message: string } {
  try {
    if (!db) throw new Error('Base de datos no inicializada');
    const currentResult = db.exec('SELECT * FROM products WHERE id = ?', [id]);
    if (currentResult.length === 0 || currentResult[0].values.length === 0) return { success: false, message: 'Producto no encontrado' };
    if (productData.sku) {
      const existing = db.exec("SELECT id FROM products WHERE LOWER(sku) = LOWER(?) AND id != ? AND active = 1", [productData.sku.trim(), id]);
      if (existing.length > 0 && existing[0].values.length > 0) return { success: false, message: 'Ya existe otro producto con ese SKU' };
    }
    const stmt = db.prepare(`
      UPDATE products SET
        sku = COALESCE(?, sku), name = COALESCE(?, name), description = COALESCE(?, description),
        price = COALESCE(?, price), cost = COALESCE(?, cost), category_id = COALESCE(?, category_id),
        unit_of_measure = COALESCE(?, unit_of_measure), taxable = COALESCE(?, taxable),
        tax_rate = COALESCE(?, tax_rate), stock_quantity = COALESCE(?, stock_quantity),
        min_stock_level = COALESCE(?, min_stock_level), max_stock_level = COALESCE(?, max_stock_level),
        reorder_point = COALESCE(?, reorder_point), supplier_id = COALESCE(?, supplier_id),
        barcode = COALESCE(?, barcode), image_path = COALESCE(?, image_path),
        weight = COALESCE(?, weight), dimensions = COALESCE(?, dimensions),
        is_service = COALESCE(?, is_service), service_duration = COALESCE(?, service_duration),
        warranty_period = COALESCE(?, warranty_period), notes = COALESCE(?, notes),
        active = COALESCE(?, active), updated_at = ?, updated_by = ?
      WHERE id = ?
    `);
    stmt.run([
      productData.sku || null, productData.name || null, productData.description || null,
      productData.price || null, productData.cost || null, productData.category_id || null,
      productData.unit_of_measure || null, productData.taxable !== undefined ? (productData.taxable ? 1 : 0) : null,
      productData.tax_rate || null, productData.stock_quantity || null,
      productData.min_stock_level || null, productData.max_stock_level || null,
      productData.reorder_point || null, productData.supplier_id || null,
      productData.barcode || null, productData.image_path || null,
      productData.weight || null, productData.dimensions || null,
      productData.is_service !== undefined ? (productData.is_service ? 1 : 0) : null,
      productData.service_duration || null, productData.warranty_period || null,
      productData.notes || null, productData.active !== undefined ? (productData.active ? 1 : 0) : null,
      new Date().toISOString(), userId || 1, id
    ]);
    stmt.free();
    logAuditEvent('products', id, 'UPDATE', JSON.stringify(currentResult[0].values[0]), JSON.stringify(productData), userId);
    setTimeout(() => saveDatabase(), 1000);
    return { success: true, message: 'Producto actualizado correctamente' };
  } catch (error) {
    logger.error('Products', 'update_failed', 'Error al actualizar producto', { id }, error as Error);
    return { success: false, message: `Error al actualizar producto: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

export function deleteProduct(id: number, userId?: number): { success: boolean; message: string } {
  try {
    if (!db) throw new Error('Base de datos no inicializada');
    const invoiceCount = db.exec('SELECT COUNT(*) as count FROM invoice_lines WHERE product_id = ?', [id])[0]?.values[0]?.[0] as number || 0;
    if (invoiceCount > 0) return { success: false, message: `No se puede eliminar el producto porque está siendo usado en ${invoiceCount} factura(s)` };
    const billCount = db.exec('SELECT COUNT(*) as count FROM bill_lines WHERE product_id = ?', [id])[0]?.values[0]?.[0] as number || 0;
    if (billCount > 0) return { success: false, message: `No se puede eliminar el producto porque está siendo usado en ${billCount} factura(s) de compra` };
    const currentResult = db.exec('SELECT * FROM products WHERE id = ?', [id]);
    const stmt = db.prepare('UPDATE products SET active = 0, updated_at = ? WHERE id = ?');
    stmt.run([new Date().toISOString(), id]);
    stmt.free();
    logAuditEvent('products', id, 'DELETE', JSON.stringify(currentResult[0]?.values[0]), null, userId);
    setTimeout(() => saveDatabase(), 1000);
    return { success: true, message: 'Producto eliminado correctamente' };
  } catch (error) {
    logger.error('Products', 'delete_failed', 'Error al eliminar producto', { id }, error as Error);
    return { success: false, message: `Error al eliminar producto: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

export function updateProductStock(productId: number, quantity: number, operation: 'add' | 'subtract'): { success: boolean; message: string } {
  try {
    if (!db) throw new Error('Base de datos no inicializada');
    const product = getProductById(productId);
    if (!product) return { success: false, message: 'Producto no encontrado' };
    let newStock: number;
    if (operation === 'add') {
      newStock = product.stock_quantity + quantity;
    } else {
      newStock = product.stock_quantity - quantity;
      if (newStock < 0) return { success: false, message: 'Stock insuficiente' };
    }
    const stmt = db.prepare('UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?');
    stmt.run([newStock, new Date().toISOString(), productId]);
    stmt.free();
    logAuditEvent('products', productId, 'UPDATE',
      JSON.stringify({ stock_quantity: product.stock_quantity }),
      JSON.stringify({ stock_quantity: newStock, operation, quantity }));
    setTimeout(() => saveDatabase(), 1000);
    return { success: true, message: `Stock actualizado. Nuevo stock: ${newStock}` };
  } catch (error) {
    logger.error('Products', 'update_stock_failed', 'Error al actualizar stock', { productId, quantity, operation }, error as Error);
    return { success: false, message: `Error al actualizar stock: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
}

export function getProductsLowStock(): Product[] {
  try {
    if (!db) throw new Error('Base de datos no inicializada');
    const result = db.exec(`
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.active = 1 AND p.is_service = 0 AND p.stock_quantity <= p.reorder_point
      ORDER BY p.stock_quantity ASC
    `);
    if (result.length === 0) return [];
    const columns = (result[0].columns || (result[0] as any).lc);
    return result[0].values.map((row: any) => mapProductRow(columns, row));
  } catch (error) {
    logger.error('Products', 'get_low_stock_failed', 'Error al obtener productos con stock bajo', null, error as Error);
    return [];
  }
}
