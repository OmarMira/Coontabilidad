// ==========================================
// MÃ“DULO 23 â€” Users, Roles y Seeds
// ExtraÃ­do de simple-db.ts lÃ­neas 11539-12402 y 13938-13955
// Correcciones: columnas company_data y chart_of_accounts alineadas con esquema persistente
// ==========================================

import { getDB, getDBEngine } from './db-core';
import { logger } from '../../core/logging/SystemLogger';

// Helper para vinculaciÃ³n de parÃ¡metros en sql.js
const sqlRunWithParams = (database: any, sql: string, params: any[]): void => {
  const stmt = database.prepare(sql);
  try { stmt.run(params); } finally { stmt.free(); }
};

export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const currentHash = await hashPassword(password);
  return currentHash === hash;
}

export function hasActiveUsers(): boolean {
  const db = getDB();
  if (!db) return false;
  const res = db.exec("SELECT COUNT(*) FROM users WHERE is_active = 1");
  return res.length > 0 && (res[0].values[0][0] as number) > 0;
}

export function hasUsers(): boolean {
  const db = getDB();
  if (!db) return false;
  try {
    const result = db.exec(`SELECT COUNT(*) as count FROM users`);
    if (result.length > 0 && result[0].values.length > 0) {
      return (result[0].values[0][0] as number) > 0;
    }
    return false;
  } catch (error) {
    logger.error('db-users', 'check_users_exist', 'Error checking if users exist', error);
    return false;
  }
}

async function seedCompanyData(): Promise<void> {
  const db = getDB();
  if (!db) return;
  try {
    const res = db.exec("SELECT COUNT(*) FROM company_data");
    if (res[0].values[0][0] === 0) {
      sqlRunWithParams(db,
        `INSERT INTO company_data (name, tax_id, address, city, state, zip, phone, email, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'AccountExpress Demo',
          '12-3456789',
          '123 Business Way',
          'Miami',
          'FL',
          '33101',
          '(305) 555-0100',
          'info@accountexpress.com',
          new Date().toISOString()
        ]
      );
    }
  } catch (e) {
    logger.warn('db-users', 'seed_company_data', '[seedCompanyData] Skipped');
  }
}

async function seedChartOfAccounts(): Promise<void> {
  const db = getDB();
  if (!db) return;
  try {
    const res = db.exec("SELECT COUNT(*) FROM chart_of_accounts");
    if ((res[0].values[0][0] as number) > 0) return;

    const accounts = [
      { code: '1000', name: 'ACTIVOS', type: 'asset' },
      { code: '1100', name: 'ACTIVOS CIRCULANTES', type: 'asset' },
      { code: '1110', name: 'Efectivo y Equivalentes', type: 'asset' },
      { code: '1111', name: 'Caja General', type: 'asset' },
      { code: '1112', name: 'Cuenta Corriente - Bank of America', type: 'asset' },
      { code: '1113', name: 'Cuenta de Ahorros', type: 'asset' },
      { code: '1114', name: 'Cuenta Payroll', type: 'asset' },
      { code: '1120', name: 'Cuentas por Cobrar', type: 'asset' },
      { code: '1121', name: 'Cuentas por Cobrar - Clientes', type: 'asset' },
      { code: '1122', name: 'ProvisiÃ³n Cuentas Incobrables', type: 'asset' },
      { code: '1123', name: 'Otras Cuentas por Cobrar', type: 'asset' },
      { code: '1130', name: 'Inventario', type: 'asset' },
      { code: '1131', name: 'Inventario - Productos Terminados', type: 'asset' },
      { code: '1132', name: 'Inventario - Materias Primas', type: 'asset' },
      { code: '1200', name: 'ACTIVOS FIJOS', type: 'asset' },
      { code: '2000', name: 'PASIVOS', type: 'liability' },
      { code: '2100', name: 'PASIVOS CIRCULANTES', type: 'liability' },
      { code: '2110', name: 'Cuentas por Pagar', type: 'liability' },
      { code: '2111', name: 'Cuentas por Pagar - Proveedores', type: 'liability' },
      { code: '2120', name: 'Impuestos por Pagar', type: 'liability' },
      { code: '2121', name: 'Sales Tax por Pagar', type: 'liability' },
      { code: '2122', name: 'Payroll Tax por Pagar', type: 'liability' },
      { code: '2200', name: 'PASIVOS A LARGO PLAZO', type: 'liability' },
      { code: '3000', name: 'CAPITAL', type: 'equity' },
      { code: '3100', name: 'Capital Social', type: 'equity' },
      { code: '3200', name: 'Utilidades Retenidas', type: 'equity' },
      { code: '3300', name: 'Utilidad del Ejercicio', type: 'equity' },
      { code: '4000', name: 'INGRESOS', type: 'revenue' },
      { code: '4100', name: 'Ingresos por Ventas', type: 'revenue' },
      { code: '4110', name: 'Ventas de Productos', type: 'revenue' },
      { code: '4120', name: 'Ventas de Servicios', type: 'revenue' },
      { code: '4200', name: 'Otros Ingresos', type: 'revenue' },
      { code: '5000', name: 'COSTO DE VENTAS', type: 'expense' },
      { code: '5100', name: 'Costo de Productos Vendidos', type: 'expense' },
      { code: '6000', name: 'GASTOS OPERATIVOS', type: 'expense' },
      { code: '6100', name: 'Gastos de AdministraciÃ³n', type: 'expense' },
      { code: '6110', name: 'Sueldos y Salarios', type: 'expense' },
      { code: '6120', name: 'Renta y Arrendamientos', type: 'expense' },
      { code: '6130', name: 'Servicios PÃºblicos', type: 'expense' },
      { code: '6140', name: 'Seguros', type: 'expense' },
      { code: '6200', name: 'Gastos de Ventas', type: 'expense' },
      { code: '6210', name: 'Publicidad y Marketing', type: 'expense' },
      { code: '6220', name: 'Comisiones de Ventas', type: 'expense' },
      { code: '6300', name: 'Gastos Financieros', type: 'expense' },
      { code: '6310', name: 'Intereses sobre PrÃ©stamos', type: 'expense' },
      { code: '6320', name: 'Comisiones Bancarias', type: 'expense' },
      { code: '6330', name: 'PÃ©rdida en Venta de Activos', type: 'expense' },
      { code: '6400', name: 'Impuestos', type: 'expense' },
      { code: '6410', name: 'Impuesto sobre la Renta', type: 'expense' },
      { code: '6420', name: 'Impuestos Locales y Estatales', type: 'expense' },
      { code: '6430', name: 'Property Tax', type: 'expense' },
    ];

    for (const a of accounts) {
      sqlRunWithParams(db,
        `INSERT OR IGNORE INTO chart_of_accounts (code, name, type, active) VALUES (?, ?, ?, 1)`,
        [a.code, a.name, a.type]
      );
    }
  } catch (e) {
    logger.warn('db-users', 'seed_chart_of_accounts', '[seedChartOfAccounts] Skipped');
  }
}

export async function seedUsersAndRoles(): Promise<void> {
  const db = getDB();
  if (!db) return;

  try {
    const existingRoles = db.exec("SELECT COUNT(*) FROM user_roles");
    if (existingRoles[0].values[0][0] === 0) {
      const roles = [
        { name: 'admin', display: 'Administrador', level: 100 },
        { name: 'contador', display: 'Contador', level: 80 },
        { name: 'vendedor', display: 'Vendedor', level: 40 },
        { name: 'comprador', display: 'Comprador', level: 40 },
        { name: 'auditor', display: 'Auditor', level: 20 },
        { name: 'viewer', display: 'Consulta', level: 10 },
      ];
      for (const r of roles) {
        sqlRunWithParams(db,
          `INSERT OR IGNORE INTO user_roles (name, description, level, is_active, created_at) VALUES (?, ?, ?, 1, ?)`,
          [r.name, r.display, r.level, new Date().toISOString()]
        );
      }
    }

    const existingUsers = db.exec("SELECT COUNT(*) FROM users");
    if (existingUsers[0].values[0][0] === 0) {
      const hashedPassword = await hashPassword('admin123');
      sqlRunWithParams(db,
        `INSERT INTO users (username, password_hash, full_name, role, is_active, created_at) VALUES ('admin', ?, 'Administrador del Sistema', 'admin', 1, ?)`,
        [hashedPassword, new Date().toISOString()]
      );
    }

    await seedCompanyData();
    await seedChartOfAccounts();

    logger.info('Database', 'seed', 'Usuarios, roles y datos iniciales configurados');
  } catch (error) {
    logger.error('Database', 'seed_error', `Error en sembrado inicial: ${error}`);
  }
}

export async function seedSystemDefaults(): Promise<void> {
  try {
    await seedCompanyData();
    await seedChartOfAccounts();
  } catch (e) {
    logger.warn('db-users', 'seed_system_defaults', '[seedSystemDefaults] Error parcial en inicializacion');
  }
}

export async function createUser(userData: any): Promise<{ success: boolean; message: string; userId?: number }> {
  const db = getDB();
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    const emailToCheck = userData.email || userData.username;
    const existing = db.exec(`SELECT id FROM users WHERE username = ? OR email = ?`, [userData.username, emailToCheck]);
    if (existing[0]?.values.length > 0) {
      return { success: false, message: 'El nombre de usuario o email ya existe' };
    }

    const passwordHash = await hashPassword(userData.password);
    sqlRunWithParams(db,
      `INSERT INTO users(username, email, full_name, display_name, password_hash, role_id, is_active, picture) VALUES(?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        userData.username,
        userData.email || userData.username,
        userData.full_name || userData.username,
        userData.display_name || userData.username,
        passwordHash,
        userData.role_id || 2,
        userData.picture || null
      ]
    );

    const idRes = db.exec("SELECT last_insert_rowid()");
    const userId = idRes[0].values[0][0] as number;
    return { success: true, message: 'Usuario creado exitosamente', userId };
  } catch (error) {
    logger.error('Database', 'create_user_error', `Error al crear usuario: ${error}`);
    return { success: false, message: `Error al crear usuario: ${error}` };
  }
}

export const getUsers = (filters?: { activeOnly?: boolean }): any[] => {
  const db = getDB();
  if (!db) return [];
  try {
    const res = db.exec(`SELECT u.*, r.name as role_name FROM users u LEFT JOIN user_roles r ON u.role_id = r.id`);
    if (res.length === 0) return [];
    const columns = res[0].columns;
    return res[0].values.map((row: any) => {
      const user: any = {};
      columns.forEach((col: string, idx: number) => { user[col] = row[idx]; });
      return user;
    });
  } catch (error) {
    logger.error('Database', 'get_users_error', `Error al obtener usuarios: ${error}`);
    return [];
  }
};

export const getUserByUsername = (username: string): any | null => {
  const db = getDB();
  if (!db) return null;
  try {
    const stmt = db.prepare(`SELECT u.*, r.name as role_name FROM users u LEFT JOIN user_roles r ON u.role_id = r.id WHERE u.username = ?`);
    try {
      stmt.bind([username]);
      if (stmt.step()) {
        return stmt.getAsObject();
      }
      return null;
    } finally {
      if (stmt.free) stmt.free();
    }
  } catch (error) {
    logger.error('Users', 'get_user_failed', 'Error getting user by username', { username }, error as Error);
    return null;
  }
};

export const updateUser = (id: number, updates: {
  email?: string;
  full_name?: string;
  display_name?: string;
  role_id?: number;
  is_active?: boolean;
  last_login?: string;
  picture?: string;
}): { success: boolean; message: string } => {
  const db = getDB();
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const setParts: string[] = [];
    const values: any[] = [];

    if (updates.email !== undefined) { setParts.push('email = ?'); values.push(updates.email); }
    if (updates.full_name !== undefined) { setParts.push('full_name = ?'); values.push(updates.full_name); }
    if (updates.display_name !== undefined) { setParts.push('display_name = ?'); values.push(updates.display_name); }
    if (updates.role_id !== undefined) { setParts.push('role_id = ?'); values.push(updates.role_id); }
    if (updates.is_active !== undefined) { setParts.push('is_active = ?'); values.push(updates.is_active ? 1 : 0); }
    if (updates.last_login !== undefined) { setParts.push('last_login = ?'); values.push(updates.last_login); }
    if (updates.picture !== undefined) { setParts.push('picture = ?'); values.push(updates.picture); }

    if (setParts.length === 0) return { success: true, message: 'No hay actualizaciones para aplicar' };

    values.push(id);
    sqlRunWithParams(db, `UPDATE users SET ${setParts.join(', ')} WHERE id = ?`, values);
    return { success: true, message: 'Usuario actualizado exitosamente' };
  } catch (error) {
    logger.error('Database', 'update_user_error', `Error al actualizar usuario: ${error}`);
    return { success: false, message: `Error al actualizar usuario: ${error}` };
  }
};

export const deactivateUser = (id: number): { success: boolean; message: string } => {
  const db = getDB();
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    sqlRunWithParams(db, "UPDATE users SET is_active = 0 WHERE id = ?", [id]);
    return { success: true, message: 'Usuario desactivado' };
  } catch (error) {
    logger.error('Database', 'deactivate_user_error', `Error al desactivar usuario: ${error}`);
    return { success: false, message: `Error al desactivar usuario: ${error}` };
  }
};

export const getUserRoles = (): any[] => {
  const db = getDB();
  if (!db) return [];
  try {
    const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='user_roles'");
    if (tableCheck.length === 0) return [];
    const result = db.exec('SELECT id, name, description, level FROM user_roles WHERE name IS NOT NULL ORDER BY level DESC');
    if (!result.length || !result[0]?.values?.length) return [];
    return result[0].values
      .filter((row: any) => row[1] != null)
      .map((row: any) => ({
        id: row[0] as number,
        name: row[1] as string,
        description: row[2] as string,
        level: row[3] as number
      }));
  } catch (error) {
    logger.error('Database', 'get_roles_error', `Error al obtener roles: ${error}`);
    return [];
  }
};

export const updateUserPassword = async (id: number, newPassword: string): Promise<{ success: boolean; message: string }> => {
  const db = getDB();
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const hashedPassword = await hashPassword(newPassword);
    sqlRunWithParams(db, "UPDATE users SET password_hash = ? WHERE id = ?", [hashedPassword, id]);
    return { success: true, message: 'ContraseÃ±a actualizada' };
  } catch (error) {
    logger.error('Database', 'update_password_error', `Error al actualizar contraseÃ±a: ${error}`);
    return { success: false, message: `Error al actualizar contraseÃ±a: ${error}` };
  }
};

export const createUserRole = (roleData: { name: string; description?: string; level?: number }): { success: boolean; message: string; roleId?: number } => {
  const db = getDB();
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const existing = db.exec("SELECT id FROM user_roles WHERE name = ?", [roleData.name]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return { success: false, message: 'El nombre del rol ya existe' };
    }
    sqlRunWithParams(db,
      "INSERT INTO user_roles (name, description, level, created_at) VALUES (?, ?, ?, ?)",
      [roleData.name, roleData.description || '', roleData.level || 10, new Date().toISOString()]
    );
    const idRes = db.exec("SELECT last_insert_rowid()");
    const roleId = idRes[0].values[0][0] as number;
    return { success: true, message: 'Rol creado exitosamente', roleId };
  } catch (error) {
    logger.error('Database', 'create_role_error', `Error al crear rol: ${error}`);
    return { success: false, message: `Error al crear rol: ${error}` };
  }
};

export const updateUserRole = (id: number, updates: { name?: string; description?: string; level?: number }): { success: boolean; message: string } => {
  const db = getDB();
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const setParts: string[] = [];
    const values: any[] = [];
    if (updates.name !== undefined) { setParts.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { setParts.push('description = ?'); values.push(updates.description); }
    if (updates.level !== undefined) { setParts.push('level = ?'); values.push(updates.level); }
    if (setParts.length === 0) return { success: true, message: 'No hay cambios' };
    values.push(id);
    sqlRunWithParams(db, `UPDATE user_roles SET ${setParts.join(', ')} WHERE id = ?`, values);
    return { success: true, message: 'Rol actualizado exitosamente' };
  } catch (error) {
    logger.error('Database', 'update_role_error', `Error al actualizar rol: ${error}`);
    return { success: false, message: `Error al actualizar rol: ${error}` };
  }
};

export const deleteUserRole = (id: number): { success: boolean; message: string } => {
  const db = getDB();
  if (!db) return { success: false, message: 'Database not initialized' };
  try {
    const checkProtected = db.exec("SELECT name FROM user_roles WHERE id = ?", [id]);
    if (checkProtected.length === 0 || checkProtected[0].values.length === 0) {
      return { success: false, message: 'Rol no encontrado' };
    }
    const roleName = checkProtected[0].values[0][0] as string;
    const protectedRoles = ['admin', 'contador', 'vendedor', 'auditor', 'viewer', 'comprador'];
    if (protectedRoles.includes(roleName)) {
      return { success: false, message: 'No se pueden eliminar los roles crÃ­ticos del sistema' };
    }
    const usersInRole = db.exec("SELECT COUNT(*) FROM users WHERE role_id = ?", [id]);
    const userCount = usersInRole[0].values[0][0] as number;
    if (userCount > 0) {
      return { success: false, message: `No se puede eliminar el rol porque tiene ${userCount} usuario(s) asignado(s)` };
    }
    db.run('DELETE FROM user_roles WHERE id = ?', [id]);
    return { success: true, message: 'Rol eliminado correctamente' };
  } catch (error) {
    logger.error('Roles', 'delete_role_failed', 'Error deleting role', { id }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
};



