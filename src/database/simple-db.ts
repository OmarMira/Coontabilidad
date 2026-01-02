// import initSqlJs from 'sql.js';
import initSqlJs from 'sql.js';
import { BasicEncryption } from '../core/security/BasicEncryption';
import { logger } from '../core/logging/SystemLogger';
import { ViewManager } from './views/ViewManager';
import { DatabaseInitializer } from './DatabaseInitializer';

let db: initSqlJs.Database | null = null;

// Exportar la instancia de db para acceso externo
export { db };
let isInitialized = false;
let opfsRoot: FileSystemDirectoryHandle | null = null;
let dbFile: FileSystemFileHandle | null = null;
let encryptionEnabled = false;
let currentPassword: string | null = null;

// Configuración de persistencia
export const DB_NAME = 'accountexpress.db';
const BACKUP_INTERVAL = 30000; // 30 segundos

export interface Customer {
  id: number;
  // Información personal
  name: string;
  business_name?: string;
  document_type: 'SSN' | 'EIN' | 'ITIN' | 'PASSPORT';
  document_number: string;
  business_type?: string;

  // Datos de contacto
  email: string;
  email_secondary?: string;
  phone: string;
  phone_secondary?: string;

  // Dirección
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  florida_county: string;

  // Datos comerciales
  credit_limit: number;
  payment_terms: number; // días
  tax_exempt: boolean;
  tax_id?: string;
  assigned_salesperson?: string;

  // Metadatos
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
}

export interface Supplier {
  id: number;
  // Información del proveedor
  name: string;
  business_name?: string;
  document_type: 'SSN' | 'EIN' | 'ITIN' | 'PASSPORT';
  document_number: string;
  business_type?: string;

  // Datos de contacto
  email: string;
  email_secondary?: string;
  phone: string;
  phone_secondary?: string;

  // Dirección
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  florida_county: string;

  // Datos comerciales
  credit_limit: number;
  payment_terms: number; // días
  tax_exempt: boolean;
  tax_id?: string;
  assigned_buyer?: string;

  // Metadatos
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'suspended';
  notes?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category_id?: number;
  category?: ProductCategory; // Para joins
  unit_of_measure: string; // unidad, pieza, kg, litro, etc.
  taxable: boolean;
  tax_rate?: number; // Tasa específica si es diferente a la estándar
  stock_quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  supplier_id?: number;
  supplier?: Supplier; // Para joins
  barcode?: string;
  image_path?: string;
  weight?: number;
  dimensions?: string; // "LxWxH"
  is_service: boolean; // true para servicios, false para productos físicos
  service_duration?: number; // duración en minutos para servicios
  warranty_period?: number; // período de garantía en días
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  parent?: ProductCategory; // Para categorías jerárquicas
  tax_rate?: number; // Tasa de impuesto por defecto para la categoría
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer?: Customer; // Para joins
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  product_id?: number;
  product?: Product; // Para joins
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  taxable: boolean;
  created_at: string;
}

export interface Bill {
  id: number;
  bill_number: string;
  supplier_id: number;
  supplier?: Supplier; // Para joins
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'received' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  created_at: string;
  items?: BillItem[];
}

export interface BillItem {
  id: number;
  bill_id: number;
  product_id?: number;
  product?: Product; // Para joins
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  taxable: boolean;
  created_at: string;
}

export interface Payment {
  id: number;
  customer_id: number;
  invoice_id?: number;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface SupplierPayment {
  id: number;
  supplier_id: number;
  bill_id?: number;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  reference_number?: string;
  notes?: string;
  created_at: string;
}

// ==========================================
// INTERFACES PARA PLAN DE CUENTAS Y DOBLE ENTRADA
// ==========================================
// INTERFACES PARA CONTABILIDAD
// ==========================================

export interface ChartOfAccount {
  id?: number;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  normal_balance: 'debit' | 'credit';
  parent_account?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  balance?: number; // Para cálculos
}

export interface JournalEntry {
  id?: number;
  entry_date: string;
  reference_number: string;
  reference?: string; // Temporary compatibility
  description: string;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  created_at?: string;
  created_by?: number;
  verified_by?: number;
  verified_at?: string;
  details?: JournalDetail[];
}

/**
 * Mapea una fila de base de datos a una entidad tipada
 */
function rowToEntity<T>(columns: string[], row: initSqlJs.SqlValue[]): T {
  const entity = {} as Record<string, unknown>;
  columns.forEach((col, index) => {
    entity[col] = row[index];
  });
  return entity as unknown as T;
}

export interface JournalDetail {
  id?: number;
  journal_entry_id?: number;
  account_code: string;
  account?: ChartOfAccount; // Para joins
  debit_amount: number;
  credit_amount: number;
  description?: string;
}

// Interfaces para reportes Florida DR-15
export interface FloridaDR15Report {
  period: string; // "2024-Q1"
  totalTaxableSales: number;
  totalTaxCollected: number;
  countyBreakdown: Array<{
    county: string;
    rate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
  exemptSales: number;
  adjustments: Array<{
    description: string;
    amount: number;
    type: 'credit' | 'debit';
  }>;
  netTaxDue: number;
  dueDate: Date;
  filedBy?: number;
  filedAt?: Date;
  status: 'pending' | 'filed' | 'paid' | 'late';
}

// Interfaces para vistas de IA (solo lectura)
export interface FinancialSummary {
  report_type: string;
  total_assets: number;
  total_liabilities_equity: number;
  imbalance: number;
  period: string;
}

export interface TaxSummary {
  period: string;
  total_sales: number;
  taxable_sales: number;
  exempt_sales: number;
  total_tax_collected: number;
  counties_breakdown: Array<{
    county: string;
    sales: number;
    tax: number;
  }>;
}

export interface BankAccount {
  id: number;
  account_name: string;
  bank_name: string;
  account_number: string;
  account_type: 'checking' | 'savings' | 'credit' | 'other';
  routing_number?: string;
  balance: number;
  currency: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  method_name: string;
  method_type: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';
  is_active: boolean;
  requires_reference: boolean;
  created_at: string;
}

export const initDB = async (password?: string): Promise<initSqlJs.Database> => {
  if (isInitialized && db) {
    return db;
  }

  try {
    logger.info('Database', 'init_start', 'Iniciando inicialización de base de datos SQLite con OPFS');

    // Configurar cifrado si se proporciona contraseña
    if (password && BasicEncryption.isSupported()) {
      encryptionEnabled = true;
      currentPassword = password;
      logger.info('Database', 'encryption_enabled', 'Cifrado habilitado con Web Crypto API');
    } else if (password) {
      logger.warn('Database', 'encryption_fallback', 'Web Crypto API no soportado, cifrado deshabilitado');
    }

    // Inicializar sql.js usando dynamic import
    const initSqlJs = (await import('sql.js')).default;
    const SQL = await initSqlJs({
      locateFile: (file: string) => `/${file}`
    });

    logger.info('Database', 'sqljs_loaded', 'SQL.js cargado correctamente');

    // Intentar usar OPFS para persistencia real
    let dbData: Uint8Array | null = null;

    try {
      // Verificar soporte OPFS
      if (typeof navigator !== 'undefined' && navigator.storage && 'getDirectory' in navigator.storage) {
        logger.info('Database', 'opfs_supported', 'OPFS soportado, usando almacenamiento persistente');
        opfsRoot = await navigator.storage.getDirectory();

        try {
          // Intentar cargar base de datos existente
          dbFile = await opfsRoot.getFileHandle(DB_NAME);
          const file = await dbFile.getFile();
          let fileData = new Uint8Array(await file.arrayBuffer());

          // Descifrar si está habilitado el cifrado
          if (encryptionEnabled && currentPassword && fileData.length > 28) {
            try {
              const { salt, iv, encrypted } = BasicEncryption.separateEncryptedData(fileData);
              dbData = await BasicEncryption.decrypt(encrypted, salt, iv, currentPassword);
              logger.info('Database', 'decrypt_success', `Base de datos descifrada correctamente: ${dbData.length} bytes`);
            } catch (error) {
              logger.error('Database', 'decrypt_failed', 'Error al descifrar base de datos', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
              throw new Error('Invalid password or corrupted database');
            }
          } else {
            dbData = fileData;
            logger.info('Database', 'load_success', `Base de datos cargada: ${dbData.length} bytes`);
          }
        } catch (error) {
          // Base de datos no existe, se creará nueva
          logger.info('Database', 'new_database', 'Base de datos no encontrada, creando nueva');
        }
      } else {
        logger.warn('Database', 'opfs_not_supported', 'OPFS no soportado, usando localStorage como fallback');
        // Intentar cargar desde localStorage
        dbData = await loadFromLocalStorage();
      }
    } catch (error) {
      logger.error('Database', 'opfs_init_failed', 'Error en inicialización OPFS, usando almacenamiento en memoria', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }

    // Crear instancia de base de datos
    db = new SQL.Database(dbData) as any;
    logger.info('Database', 'instance_created', 'Instancia de base de datos creada');

    // Configurar SQLite para mejor rendimiento
    if (db) {
      db.run('PRAGMA journal_mode=WAL');
      db.run('PRAGMA synchronous=NORMAL');
      db.run('PRAGMA cache_size=10000');
      db.run('PRAGMA foreign_keys=ON');
      logger.info('Database', 'pragma_configured', 'Configuración PRAGMA aplicada para optimización');
    }

    // Inicializar logger con la base de datos
    if (db) {
      logger.initialize(db);
    }

    // NUEVO: Inicialización robusta con manejo de FK
    if (db) {
      await DatabaseInitializer.initializeWithFix(db);
    }

    // Crear esquema de base de datos
    await createSchema();

    // Insertar datos de ejemplo si es nueva
    if (db) {
      // 1. Insertar tasas de impuesto iniciales si no existen (Independiente)
      const taxResult = db.exec("SELECT COUNT(*) as count FROM florida_tax_rates");
      const taxCount = taxResult[0]?.values[0]?.[0] as number || 0;
      if (taxCount === 0) {
        logger.info('Database', 'insert_tax_rates', 'Insertando tasas de impuesto iniciales');
        await insertInitialTaxRates();
      }

      // 2. Insertar plan de cuentas inicial si no existe (Requerido para Journal Entries)
      const accountResult = db.exec("SELECT COUNT(*) as count FROM chart_of_accounts");
      const accountCount = accountResult[0]?.values[0]?.[0] as number || 0;
      if (accountCount === 0) {
        logger.info('Database', 'insert_chart_accounts', 'Insertando plan de cuentas inicial');
        await insertInitialChartOfAccounts();
      }

      // 3. Insertar categorías de productos iniciales si no existen
      const categoryResult = db.exec("SELECT COUNT(*) as count FROM product_categories");
      const categoryCount = categoryResult[0]?.values[0]?.[0] as number || 0;
      if (categoryCount === 0) {
        logger.info('Database', 'insert_product_categories', 'Insertando categorías de productos iniciales');
        await insertInitialProductCategories();
      }

      // 4. Insertar productos iniciales si no existen
      const productResult = db.exec("SELECT COUNT(*) as count FROM products");
      const productCount = productResult[0]?.values[0]?.[0] as number || 0;
      if (productCount === 0) {
        logger.info('Database', 'insert_products', 'Insertando productos iniciales');
        await insertInitialProducts();
      }

      // 5. Insertar datos de ejemplo transaccionales (Clientes, Facturas, Asientos)
      const customerResult = db.exec("SELECT COUNT(*) as count FROM customers");
      const customerCount = customerResult[0]?.values[0]?.[0] as number || 0;
      if (customerCount === 0) {
        logger.info('Database', 'insert_sample_data', 'Insertando datos de ejemplo transaccionales');
        await insertSampleData();
      }

      // Inicializar datos de empresa si no existen
      initializeCompanyData();

      // Inicializar y crear vistas de solo lectura para IA
      try {
        const viewManagerInstance = new ViewManager(db);
        await viewManagerInstance.createAllViews();
        logger.info('Database', 'views_created', 'Vistas de solo lectura para IA inicializadas correctamente');
      } catch (error) {
        logger.error('Database', 'views_failed', 'Error al inicializar vistas de solo lectura', { error });
      }

      // NUEVO: Verificación profunda de datos transaccionales para el asistente IA
      if (db) {
        const invoiceResult = db.exec("SELECT COUNT(*) as count FROM invoices");
        const invoiceCount = invoiceResult[0]?.values[0]?.[0] as number || 0;

        const journalResult = db.exec("SELECT COUNT(*) as count FROM journal_entries");
        const journalCount = journalResult[0]?.values[0]?.[0] as number || 0;

        if (invoiceCount === 0 || journalCount === 0) {
          logger.info('Database', 'massive_data_injection', 'Tablas transaccionales vacías, inyectando datos masivos para IA');
          await insertMassiveSampleData();
        }
      }
    }

    // Configurar auto-save
    setupAutoSave();

    isInitialized = true;
    logger.info('Database', 'init_complete', 'Base de datos inicializada correctamente con persistencia');
    return db!;
  } catch (error) {
    logger.critical('Database', 'init_failed', `Error crítico en inicialización de base de datos: ${error instanceof Error ? error.message : 'Unknown error'}`, null, error as Error);
    throw new Error(`Database initialization failed: ${error}`);
  }
};

/**
* Inyecta un conjunto masivo de datos para pruebas reales del Asistente IA
*/
const insertMassiveSampleData = async (): Promise<void> => {
  if (!db) return;

  try {
    db.run('BEGIN TRANSACTION');

    // 1. Clientes Adicionales (Total: 8)
    db.run(`
    INSERT INTO customers (name, business_name, email, phone, city, state, florida_county, credit_limit, status) VALUES 
    ('Sarah Miller', 'Miller Design Studio', 'sarah@miller.com', '305-555-0001', 'Miami', 'FL', 'Miami-Dade', 10000.00, 'active'),
    ('David Chen', 'Tech Hub Orlando', 'david@techhub.com', '407-555-0002', 'Orlando', 'FL', 'Orange', 15000.00, 'active'),
    ('Elena Rossi', 'Rossi Catering', 'elena@rossi.com', '813-555-0003', 'Tampa', 'FL', 'Hillsborough', 5000.00, 'active'),
    ('Frank Wright', 'Wright Architecture', 'frank@wright.com', '904-555-0004', 'Jacksonville', 'FL', 'Duval', 20000.00, 'active'),
    ('Grace Lee', 'Glory Retail', 'grace@glory.com', '954-555-0005', 'Fort Lauderdale', 'FL', 'Broward', 8000.00, 'active')
  `);

    // 2. Proveedores Adicionales (Ya hay 5 en insertSampleData, añadimos coherencia)
    // No hace falta más proveedores, con 5 es suficiente (Tech Solutions, Office Supplies, FBS, Global Logistics, Janitorial Experts)

    // 3. Productos Adicionales (Total: 15)
    db.run(`
    INSERT INTO products (sku, name, description, price, cost, category_id, stock_quantity, min_stock_level, is_service, active) VALUES 
    ('PROD-005', 'Monitor Dell 27"', 'UltraSharp 4K Monitor', 450.00, 300.00, 3, 15, 5, 0, 1),
    ('PROD-006', 'Teclado Mecánico', 'RGB Mechanical Keyboard', 120.00, 65.00, 3, 25, 10, 0, 1),
    ('PROD-007', 'Mouse Inalámbrico', 'Ergonomic Wireless Mouse', 60.00, 32.00, 3, 40, 15, 0, 1),
    ('PROD-008', 'Escritorio Oficina', 'L-Shaped Office Desk', 350.00, 210.00, 4, 8, 2, 0, 1),
    ('PROD-009', 'Silla Ergonómica', 'Premium Mesh Office Chair', 250.00, 145.00, 4, 12, 3, 0, 1),
    ('SERV-005', 'Mantenimiento Red', 'Servicio de mantenimiento mensual de red', 250.00, 50.00, 5, 0, 0, 1, 1),
    ('SERV-006', 'Backup en la Nube', 'Suscripción mensual backup cloud', 45.00, 10.00, 2, 0, 0, 1, 1)
  `);

    // 4. Facturas de Venta e Items (Total: 18 facturas)
    for (let i = 1; i <= 15; i++) {
      const customerId = (i % 8) + 1;
      const productId = (i % 9) + 1;
      const qty = (i % 5) + 1;
      const unitPrice = 100 + (i * 10);
      const subtotal = qty * unitPrice;
      const tax = subtotal * 0.07;
      const total = subtotal + tax;
      const date = `2024-01-${i.toString().padStart(2, '0')}`;
      const status = i % 5 === 0 ? 'overdue' : (i % 3 === 0 ? 'sent' : 'paid');
      const dueDate = i % 5 === 0 ? '2023-12-01' : date;

      db.run(`
        INSERT INTO invoices (invoice_number, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, status) 
        VALUES ('INV-2024-${i.toString().padStart(3, '0')}', ${customerId}, '${date}', '${dueDate}', ${subtotal}, ${tax}, ${total}, '${status}')
      `);

      db.run(`
        INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, line_total)
        VALUES (last_insert_rowid(), ${productId}, 'Venta de prueba ${i}', ${qty}, ${unitPrice}, ${subtotal})
      `);
    }

    // 5. Facturas de Compra (Bills) (Total: 12 facturas)
    for (let i = 1; i <= 8; i++) {
      const supplierId = (i % 5) + 1;
      const amount = 300 + (i * 95.25);
      const tax = amount * 0.07;
      const total = amount + tax;
      const date = `2024-01-${(i + 2).toString().padStart(2, '0')}`;
      const status = 'paid';
      db.run(`
      INSERT INTO bills (bill_number, supplier_id, issue_date, due_date, subtotal, tax_amount, total_amount, status) 
      VALUES ('BILL-2024-${i.toString().padStart(3, '0')}', ${supplierId}, '${date}', '${date}', ${amount}, ${tax}, ${total}, '${status}')
    `);
    }

    // 6. Asientos Contables Coherentes (Journal Entries)
    // Primero asegurar que las cuentas existen (Inyección directa por seguridad)
    db.run(`INSERT OR IGNORE INTO chart_of_accounts (account_code, account_name, account_type, normal_balance, is_active) VALUES 
    ('1121', 'Cuentas por Cobrar - Clientes', 'asset', 'debit', 1),
    ('4110', 'Ingresos por Ventas', 'revenue', 'credit', 1),
    ('2121', 'Impuesto sobre Ventas Florida', 'liability', 'credit', 1),
    ('5240', 'Gastos Profesionales', 'expense', 'debit', 1),
    ('3100', 'Capital Social', 'equity', 'credit', 1)
  `);

    // Apertura (100k)
    db.run(`INSERT INTO journal_entries (entry_date, reference, description, total_debit, total_credit) VALUES ('2024-01-01', 'APER-01', 'Apertura ejercicio 2024', 100000, 100000)`);
    db.run(`INSERT INTO journal_details (journal_entry_id, account_code, debit_amount, credit_amount) VALUES (last_insert_rowid(), '1112', 100000, 0), (last_insert_rowid(), '3100', 0, 100000)`);

    // Registro de Venta Grande (10k)
    db.run(`INSERT INTO journal_entries (entry_date, reference, description, total_debit, total_credit) VALUES ('2024-01-05', 'SALE-01', 'Venta corporativa masiva', 10700, 10700)`);
    db.run(`INSERT INTO journal_details (journal_entry_id, account_code, debit_amount, credit_amount) VALUES (last_insert_rowid(), '1121', 10700, 0), (last_insert_rowid(), '4110', 0, 10000), (last_insert_rowid(), '2121', 0, 700)`);

    // Registro de Gasto Grande (5k)
    db.run(`INSERT INTO journal_entries (entry_date, reference, description, total_debit, total_credit) VALUES ('2024-01-10', 'EXP-01', 'Servicios legales anuales', 5350, 5350)`);
    db.run(`INSERT INTO journal_details (journal_entry_id, account_code, debit_amount, credit_amount) VALUES (last_insert_rowid(), '5240', 5000, 0), (last_insert_rowid(), '2121', 350, 0), (last_insert_rowid(), '1112', 0, 5350)`);

    db.run('COMMIT');
    logger.info('Database', 'massive_data_success', 'Datos inyectados correctamente');
  } catch (error) {
    db.run('ROLLBACK');
    logger.error('Database', 'massive_data_failed', 'Error inyectando datos masivos', {}, error as Error);
  }
};

// Crear esquema de base de datos
const createSchema = async (): Promise<void> => {
  if (!db) return;

  // Tabla del plan de cuentas (CRITICAL - DOCUMENTO TÉCNICO OFICIAL)
  db.run(`
    CREATE TABLE IF NOT EXISTS chart_of_accounts (
      account_code TEXT PRIMARY KEY,
      account_name TEXT NOT NULL,
      account_type TEXT NOT NULL CHECK(account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
      normal_balance TEXT NOT NULL CHECK(normal_balance IN ('debit', 'credit')),
      parent_account TEXT REFERENCES chart_of_accounts(account_code),
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER DEFAULT 1,
      updated_by INTEGER DEFAULT 1
    )
  `);

  // Tabla de clientes con campos completos para Florida
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      -- Información personal
      name TEXT NOT NULL,
      business_name TEXT,
      document_type TEXT DEFAULT 'SSN' CHECK(document_type IN ('SSN', 'EIN', 'ITIN', 'PASSPORT')),
      document_number TEXT,
      business_type TEXT,
      
      -- Datos de contacto
      email TEXT,
      email_secondary TEXT,
      phone TEXT,
      phone_secondary TEXT,
      
      -- Dirección
      address_line1 TEXT,
      address_line2 TEXT,
      city TEXT DEFAULT 'Miami',
      state TEXT DEFAULT 'FL',
      zip_code TEXT,
      florida_county TEXT DEFAULT 'Miami-Dade',
      
      -- Datos comerciales
      credit_limit DECIMAL(12,2) DEFAULT 0.00,
      payment_terms INTEGER DEFAULT 30,
      tax_exempt BOOLEAN DEFAULT 0,
      tax_id TEXT,
      assigned_salesperson TEXT,
      
      -- Metadatos
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de proveedores (suppliers) - REQUERIDA PARA productos
  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      business_name TEXT,
      document_type TEXT DEFAULT 'EIN' CHECK(document_type IN ('SSN', 'EIN', 'ITIN', 'PASSPORT')),
      document_number TEXT,
      business_type TEXT,
      email TEXT,
      email_secondary TEXT,
      phone TEXT,
      phone_secondary TEXT,
      address_line1 TEXT,
      address_line2 TEXT,
      city TEXT DEFAULT 'Miami',
      state TEXT DEFAULT 'FL',
      zip_code TEXT,
      florida_county TEXT DEFAULT 'Miami-Dade',
      credit_limit DECIMAL(12,2) DEFAULT 0.00,
      payment_terms INTEGER DEFAULT 30,
      tax_exempt BOOLEAN DEFAULT 0,
      tax_id TEXT,
      assigned_buyer TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de categorías de productos
  db.run(`
    CREATE TABLE IF NOT EXISTS product_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      parent_id INTEGER,
      tax_rate DECIMAL(5,2) DEFAULT 0.00,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES product_categories(id)
    )
  `);

  // Tabla de productos expandida
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      cost DECIMAL(10,2) DEFAULT 0,
      category_id INTEGER,
      unit_of_measure TEXT DEFAULT 'unidad',
      taxable BOOLEAN DEFAULT 1,
      tax_rate DECIMAL(5,2),
      stock_quantity INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 0,
      max_stock_level INTEGER DEFAULT 100,
      reorder_point INTEGER DEFAULT 10,
      supplier_id INTEGER,
      barcode TEXT,
      image_path TEXT,
      weight DECIMAL(8,2),
      dimensions TEXT,
      is_service BOOLEAN DEFAULT 0,
      service_duration INTEGER, -- minutos
      warranty_period INTEGER, -- días
      notes TEXT,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES product_categories(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )
  `);

  // Tabla de facturas
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      issue_date DATE DEFAULT CURRENT_DATE,
      due_date DATE,
      subtotal DECIMAL(12,2) DEFAULT 0.00,
      tax_amount DECIMAL(12,2) DEFAULT 0.00,
      total_amount DECIMAL(12,2) DEFAULT 0.00,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id)
    )
  `);

  // Tabla de líneas de factura
  db.run(`
    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER,
      description TEXT NOT NULL,
      quantity DECIMAL(10,3) DEFAULT 1.000,
      unit_price DECIMAL(10,2) DEFAULT 0.00,
      line_total DECIMAL(12,2) DEFAULT 0.00,
      taxable BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  // Tabla de pagos
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      invoice_id INTEGER,
      payment_number TEXT UNIQUE NOT NULL,
      payment_date DATE DEFAULT CURRENT_DATE,
      amount DECIMAL(12,2) NOT NULL,
      payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'check', 'credit_card', 'bank_transfer', 'other')),
      reference_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id),
      FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    )
  `);

  // Tabla de configuración de impuestos Florida
  db.run(`
    CREATE TABLE IF NOT EXISTS florida_tax_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      county_name TEXT UNIQUE NOT NULL,
      state_rate DECIMAL(5,4) DEFAULT 0.06,
      county_rate DECIMAL(5,4) DEFAULT 0.0,
      total_rate DECIMAL(5,4) DEFAULT 0.06,
      effective_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);


  // Tabla de facturas de compra (bills)
  db.run(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT UNIQUE NOT NULL,
      supplier_id INTEGER NOT NULL,
      issue_date DATE DEFAULT CURRENT_DATE,
      due_date DATE,
      subtotal DECIMAL(12,2) DEFAULT 0.00,
      tax_amount DECIMAL(12,2) DEFAULT 0.00,
      total_amount DECIMAL(12,2) DEFAULT 0.00,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'received', 'approved', 'paid', 'overdue', 'cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
    )
  `);

  // Tabla de líneas de factura de compra (bill_lines)
  db.run(`
    CREATE TABLE IF NOT EXISTS bill_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      product_id INTEGER,
      description TEXT NOT NULL,
      quantity DECIMAL(10,3) DEFAULT 1.000,
      unit_price DECIMAL(10,2) DEFAULT 0.00,
      line_total DECIMAL(12,2) DEFAULT 0.00,
      taxable BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  // Tabla de pagos a proveedores (supplier_payments)
  db.run(`
    CREATE TABLE IF NOT EXISTS supplier_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      bill_id INTEGER,
      payment_number TEXT UNIQUE NOT NULL,
      payment_date DATE DEFAULT CURRENT_DATE,
      amount DECIMAL(12,2) NOT NULL,
      payment_method TEXT DEFAULT 'check' CHECK(payment_method IN ('cash', 'check', 'credit_card', 'bank_transfer', 'other')),
      reference_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id),
      FOREIGN KEY (bill_id) REFERENCES bills (id)
    )
  `);

  // Tabla de auditoría con hash de integridad
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
      old_values TEXT,
      new_values TEXT,
      user_id INTEGER DEFAULT 1,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      audit_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de datos de la empresa
  db.run(`
    CREATE TABLE IF NOT EXISTS company_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      tax_id TEXT NOT NULL, -- EIN o Tax ID
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'FL',
      zip_code TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      website TEXT,
      logo_path TEXT,
      fiscal_year_start TEXT DEFAULT '01-01', -- MM-DD format
      currency TEXT DEFAULT 'USD',
      language TEXT DEFAULT 'es',
      timezone TEXT DEFAULT 'America/New_York',
      -- Configuraciones financieras
      sales_commission_rate DECIMAL(10,2) DEFAULT 0.00,
      sales_commission_percentage DECIMAL(5,2) DEFAULT 0.00,
      discount_amount DECIMAL(10,2) DEFAULT 50.00,
      discount_percentage DECIMAL(5,2) DEFAULT 0.00,
      shipping_rate DECIMAL(10,2) DEFAULT 0.00,
      shipping_percentage DECIMAL(5,2) DEFAULT 0.00,
      reposition_policy_days INTEGER DEFAULT 32,
      late_fee_amount DECIMAL(10,2) DEFAULT 0.00,
      late_fee_percentage DECIMAL(5,2) DEFAULT 0.00,
      annual_interest_rate DECIMAL(5,2) DEFAULT 0.00,
      grace_period_days INTEGER DEFAULT 0,
      documentation_cost DECIMAL(10,2) DEFAULT 0.00,
      other_costs DECIMAL(10,2) DEFAULT 0.00,
      chart_of_accounts_name TEXT DEFAULT 'Plan de Cuenta Ejemplo',
      date_format TEXT DEFAULT 'MM/DD/AAAA',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  // Tabla de cuentas bancarias
  db.run(`
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_name TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_type TEXT DEFAULT 'checking' CHECK(account_type IN ('checking', 'savings', 'credit', 'other')),
      routing_number TEXT,
      balance DECIMAL(12,2) DEFAULT 0.00,
      currency TEXT DEFAULT 'USD',
      is_active BOOLEAN DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de métodos de pago
  db.run(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method_name TEXT UNIQUE NOT NULL,
      method_type TEXT CHECK(method_type IN ('cash', 'check', 'credit_card', 'bank_transfer', 'other')),
      is_active BOOLEAN DEFAULT 1,
      requires_reference BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de logs del sistema
  db.run(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      level TEXT CHECK(level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')) NOT NULL,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      message TEXT NOT NULL,
      user_id INTEGER DEFAULT 1,
      ip_address TEXT,
      user_agent TEXT,
      data TEXT,
      stack_trace TEXT,
      resolved BOOLEAN DEFAULT FALSE,
      resolved_at DATETIME,
      resolved_by INTEGER,
      session_id TEXT
    )
  `);

  // Índices para optimizar consultas de logs
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON system_logs (timestamp DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_level ON system_logs (level)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_module ON system_logs (module)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_logs_resolved ON system_logs (resolved)`);

  // ==========================================
  // TABLAS PARA PLAN DE CUENTAS Y DOBLE ENTRADA
  // ==========================================

  // Tabla de asientos contables (journal entries)
  db.run(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date DATE NOT NULL,
      reference TEXT,
      description TEXT,
      total_debit DECIMAL(15,2) NOT NULL CHECK(total_debit >= 0),
      total_credit DECIMAL(15,2) NOT NULL CHECK(total_credit >= 0),
      is_balanced BOOLEAN GENERATED ALWAYS AS (total_debit = total_credit) STORED,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER DEFAULT 1,
      verified_by INTEGER,
      verified_at DATETIME
    )
  `);

  // Tabla de detalles de asientos contables
  db.run(`
    CREATE TABLE IF NOT EXISTS journal_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
      account_code TEXT NOT NULL REFERENCES chart_of_accounts(account_code),
      debit_amount DECIMAL(15,2) DEFAULT 0,
      credit_amount DECIMAL(15,2) DEFAULT 0,
      description TEXT,
      CHECK((debit_amount = 0 AND credit_amount > 0) OR (credit_amount = 0 AND debit_amount > 0))
    )
  `);

  // Tabla para reportes Florida DR-15
  db.run(`
    CREATE TABLE IF NOT EXISTS florida_tax_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL UNIQUE, -- "2024-Q1"
      total_taxable_sales DECIMAL(15,2) DEFAULT 0,
      total_tax_collected DECIMAL(15,2) DEFAULT 0,
      exempt_sales DECIMAL(15,2) DEFAULT 0,
      net_tax_due DECIMAL(15,2) DEFAULT 0,
      due_date DATE,
      filed_by INTEGER,
      filed_at DATETIME,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'filed', 'paid', 'late')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de desglose por condado para DR-15
  db.run(`
    CREATE TABLE IF NOT EXISTS florida_tax_report_counties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL REFERENCES florida_tax_reports(id),
      county_name TEXT NOT NULL,
      tax_rate DECIMAL(5,4) NOT NULL,
      taxable_amount DECIMAL(15,2) DEFAULT 0,
      tax_amount DECIMAL(15,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de ajustes para DR-15
  db.run(`
    CREATE TABLE IF NOT EXISTS florida_tax_report_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL REFERENCES florida_tax_reports(id),
      description TEXT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      adjustment_type TEXT CHECK(adjustment_type IN ('credit', 'debit')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================================
  // VISTAS PARA IA (SOLO LECTURA) - ESPECIFICACIÓN COMPLETA
  // ==========================================

  // Vista de resumen financiero para IA - ORDEN N°1 CORREGIDA
  db.run(`
    CREATE VIEW IF NOT EXISTS financial_summary AS
    SELECT 
      'balance_general' as reporte,
      COUNT(CASE WHEN account_type = 'asset' THEN 1 END) as total_activos,
      COUNT(CASE WHEN account_type IN ('liability', 'equity') THEN 1 END) as total_pasivos_patrimonio
    FROM chart_of_accounts 
    WHERE is_active = 1
  `);

  // Vista de resumen de inventario para IA
  db.run(`
    CREATE VIEW IF NOT EXISTS inventory_summary AS
    SELECT 
      'productos' as tipo,
      COUNT(*) as total_productos,
      SUM(CASE WHEN stock_quantity <= min_stock_level THEN 1 ELSE 0 END) as productos_bajo_stock,
      SUM(stock_quantity) as stock_total
    FROM products
    WHERE active = 1
  `);

  // Vista de resumen de impuestos Florida para IA - ORDEN N°1
  db.run(`
    CREATE VIEW IF NOT EXISTS tax_summary_florida AS
    SELECT 
      t.county_name as county,
      COUNT(i.id) as facturas,
      SUM(i.total_amount) as base_imponible,
      SUM(i.tax_amount) as impuesto_calculado
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    JOIN florida_tax_rates t ON c.florida_county = t.county_name
    WHERE i.status = 'paid'
    GROUP BY t.county_name
  `);

  // Vista de resumen de auditoría para IA
  db.run(`
    CREATE VIEW IF NOT EXISTS audit_summary AS
    SELECT 
      table_name,
      COUNT(*) as total_operaciones,
      MAX(timestamp) as ultima_operacion,
      COUNT(DISTINCT user_id) as usuarios_activos
    FROM audit_log
    WHERE timestamp >= date('now', '-30 days')
    GROUP BY table_name
    ORDER BY total_operaciones DESC
  `);

  // DROPEAR VISTAS ANTIGUAS
  db.run(`DROP VIEW IF EXISTS customers_summary`);
  db.run(`DROP VIEW IF EXISTS invoices_summary`);
  db.run(`DROP VIEW IF EXISTS v_clientes_reales`);
  db.run(`DROP VIEW IF EXISTS v_facturas_reales`);
  db.run(`DROP VIEW IF EXISTS v_proveedores_reales`);
  db.run(`DROP VIEW IF EXISTS datos_sistema`);

  // VISTA "TODO EN UNO" SOLICITADA
  db.run(`
    CREATE VIEW IF NOT EXISTS datos_sistema AS
    SELECT 
      (SELECT COUNT(*) FROM customers) as total_clientes,
      (SELECT GROUP_CONCAT(name, ', ') FROM (SELECT name FROM customers LIMIT 5)) as lista_clientes,
      (SELECT COUNT(*) FROM invoices) as facturas_venta,
      (SELECT COUNT(*) FROM bills) as facturas_compra,
      (SELECT MAX(total_amount) FROM invoices) as mayor_venta_monto,
      (SELECT invoice_number FROM invoices ORDER BY total_amount DESC LIMIT 1) as mayor_venta_numero,
      (SELECT COUNT(*) FROM suppliers) as total_proveedores,
      (SELECT IFNULL(SUM(stock_quantity * price), 0) FROM products) as valor_inventario
  `);

  // Vista de alertas para IA
  db.run(`
    CREATE VIEW IF NOT EXISTS alerts_summary AS
    SELECT 
      'facturas_vencidas' as tipo_alerta,
      COUNT(*) as cantidad,
      'high' as prioridad
    FROM invoices 
    WHERE status = 'overdue'
    UNION ALL
    SELECT 
      'stock_bajo' as tipo_alerta,
      COUNT(*) as cantidad,
      'medium' as prioridad
    FROM products 
    WHERE stock_quantity <= min_stock_level AND active = 1
    UNION ALL
    SELECT 
      'clientes_inactivos' as tipo_alerta,
      COUNT(*) as cantidad,
      'low' as prioridad
    FROM customers 
    WHERE status = 'inactive'
  `);

  console.log('Database schema created successfully');
  console.log('Vistas _summary para IA creadas: financial_summary, tax_summary_florida - ORDEN N°1 IMPLEMENTADA');


  // Tabla de historial de conversaciones IA
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      query TEXT NOT NULL,
      response TEXT NOT NULL,
      intent TEXT,
      data_points_used INTEGER DEFAULT 0,
      tokens_used INTEGER DEFAULT 0,
      processing_time INTEGER,
      model_used TEXT,
      was_fallback BOOLEAN DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================================
  // TABLAS NUEVAS FASE 3 (COMPLETE SCHEMA)
  // ==========================================

  // Tabla de ajustes manuales de inventario
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity_delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      adjusted_by INTEGER DEFAULT 1,
      adjusted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      CHECK(quantity_delta != 0)
    )
  `);

  // Tabla de envíos fiscales DR-15
  db.run(`
    CREATE TABLE IF NOT EXISTS dr15_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_year INTEGER NOT NULL,
      period_month INTEGER NOT NULL,
      total_tax_collected DECIMAL(15,2) DEFAULT 0,
      total_taxable_sales DECIMAL(15,2) DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'accepted', 'rejected')),
      submission_date DATETIME,
      confirmation_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(period_year, period_month)
    )
  `);

  // ==========================================
  // TRIGGERS CRÍTICOS FASE 2
  // ==========================================

  // 1. TRIGGER calculate_florida_tax (Aproximación en SQLite ya que no soporta lógica compleja en triggers)
  // Nota: SQLite triggers son limitados. La lógica compleja se mantiene en la capa de aplicación (FloridaTaxCalculator),
  // pero agregamos un trigger básico para mantener consistencia.
  db.run(`
    CREATE TRIGGER IF NOT EXISTS update_invoice_totals_after_insert
    AFTER INSERT ON invoice_lines
    BEGIN
      UPDATE invoices 
      SET 
        subtotal = (SELECT SUM(line_total) FROM invoice_lines WHERE invoice_id = NEW.invoice_id),
        tax_amount = (SELECT SUM(CASE WHEN taxable = 1 THEN line_total * 0.07 ELSE 0 END) FROM invoice_lines WHERE invoice_id = NEW.invoice_id),
        total_amount = (SELECT SUM(line_total + (CASE WHEN taxable = 1 THEN line_total * 0.07 ELSE 0 END)) FROM invoice_lines WHERE invoice_id = NEW.invoice_id)
      WHERE id = NEW.invoice_id;
    END;
  `);

  // 2. TRIGGER update_inventory_on_sale (Simplificado para SQLite)
  db.run(`
    CREATE TRIGGER IF NOT EXISTS decrease_stock_on_invoice
    AFTER INSERT ON invoice_lines
    BEGIN
      UPDATE products
      SET stock_quantity = stock_quantity - NEW.quantity
      WHERE id = NEW.product_id AND is_service = 0;
    END;
  `);

  // 5. TRIGGER auto_generate_numbers (Simulado con formateo en inserción o valores por defecto, 
  // SQLite no tiene secuencias complejas nativas "BEFORE INSERT" para alterar NEW.value fácilmente sin extensiones)

  // ==========================================
  // VISTAS OPTIMIZADAS PARA DEEPSEEK RAG (FASE 1.3 NUEVA)
  // ==========================================

  db.run(`
    CREATE VIEW IF NOT EXISTS v_ai_context_invoices AS
    SELECT 
        'INVOICE_DATA' as data_type,
        i.id,
        i.invoice_number as number,
        i.issue_date as date,
        c.name as customer_name,
        i.total_amount as total,
        i.tax_amount,
        json_object(
            'status', i.status,
            'items_count', (SELECT COUNT(*) FROM invoice_lines WHERE invoice_id = i.id)
        ) as metadata
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
  `);

  db.run(`
    CREATE VIEW IF NOT EXISTS v_ai_context_financial AS
    SELECT 
        'FINANCIAL_SNAPSHOT' as data_type,
        date('now') as snapshot_date,
        (SELECT SUM(total_amount) FROM invoices WHERE status = 'paid') as total_revenue,
        (SELECT SUM(total_amount) FROM bills WHERE status = 'paid') as total_expenses,
        ((SELECT IFNULL(SUM(total_amount), 0) FROM invoices WHERE status = 'paid') - (SELECT IFNULL(SUM(total_amount), 0) FROM bills WHERE status = 'paid')) as net_profit,
        (SELECT SUM(tax_amount) FROM invoices WHERE status = 'paid') as tax_liability,
        (SELECT SUM(balance) FROM bank_accounts) as cash_balance
  `);

  // Tabla de auditoría específica para IA
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      query TEXT,
      security_validation TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  logger.info('Database', 'schema_updated', 'Tablas de IA creadas correctamente');
};

// Insertar datos de ejemplo
const insertSampleData = async (): Promise<void> => {
  if (!db) return;

  // ============================================
  // ORDEN SEGURO: Desactivar FKs durante seeding
  // ============================================
  db.run(`PRAGMA foreign_keys = OFF`);

  try {
    // PASO 1: Tablas maestras SIN dependencias
    // -----------------------------------------

    // 1.1 Métodos de Pago (Sin FK)
    db.run(`
      INSERT INTO payment_methods (name, type, is_active, requires_reference) VALUES 
      ('Efectivo', 'cash', 1, 0),
      ('Transferencia Bancaria', 'bank_transfer', 1, 1),
      ('Cheque', 'check', 1, 1),
      ('Tarjeta de Crédito', 'credit_card', 1, 1),
      ('Zelle', 'digital', 1, 1)
    `);

    // 1.2 Datos de la Empresa (Sin FK)
    db.run(`
      INSERT INTO company_data (
        company_name, legal_name, address, city, state, zip_code, phone, email, tax_id, 
        fiscal_year_start, currency, timezone, date_format, is_active
      ) VALUES (
        'Account Express Demo Inc.', 'Account Express Demo Inc.', '100 Biscayne Blvd', 'Miami', 'FL', '33132', '(305) 555-0000', 
        'admin@accountexpress.com', 'US-DEMO-123', 
        '01-01', 'USD', 'America/New_York', 'MM/DD/YYYY', 1
      )
    `);

    // PASO 2: Tablas con FK (después de maestras)
    // --------------------------------------------

    // Clientes de ejemplo con datos completos
    db.run(`
    INSERT INTO customers (
      name, business_name, document_type, document_number, business_type,
      email, phone, address_line1, city, state, zip_code, florida_county,
      credit_limit, payment_terms, assigned_salesperson
    ) VALUES 
    (
      'John Smith', 'Acme Corp LLC', 'EIN', '12-3456789', 'Technology Services',
      'john@acmecorp.com', '(305) 555-0123', '1234 Biscayne Blvd', 'Miami', 'FL', '33132', 'Miami-Dade',
      50000.00, 30, 'Ana García'
    ),
    (
      'Maria Rodriguez', 'Florida Tech Solutions Inc', 'EIN', '98-7654321', 'Software Development',
      'maria@fltech.com', '(407) 555-0456', '5678 Orange Ave', 'Orlando', 'FL', '32801', 'Orange',
      25000.00, 15, 'Carlos López'
    ),
    (
      'Robert Johnson', 'Sunshine Retail Group', 'EIN', '45-6789012', 'Retail',
      'robert@sunshine.com', '(813) 555-0789', '9012 Tampa Bay Blvd', 'Tampa', 'FL', '33602', 'Hillsborough',
      75000.00, 45, 'Ana García'
    )
  `);

    // Los productos ya se insertan en insertInitialProducts

    // Facturas de ejemplo
    db.run(`
    INSERT INTO invoices (invoice_number, customer_id, issue_date, due_date, subtotal, tax_amount, total_amount, status) VALUES 
    ('INV-2024-001', 1, '2024-01-15', '2024-02-14', 1500.00, 105.00, 1605.00, 'paid'),
    ('INV-2024-002', 2, '2024-01-20', '2024-02-04', 299.99, 19.50, 319.49, 'sent'),
    ('INV-2024-003', 3, '2024-01-25', '2024-03-10', 2500.00, 175.00, 2675.00, 'draft')
  `);

    // Líneas de factura de ejemplo
    db.run(`
    INSERT INTO invoice_lines (invoice_id, product_id, description, quantity, unit_price, line_total) VALUES 
    (1, 1, 'Consultoría Contable - 10 horas', 10.000, 150.00, 1500.00),
    (2, 2, 'Software License - Anual', 1.000, 299.99, 299.99),
    (3, 3, 'Auditoría Fiscal Completa', 5.000, 500.00, 2500.00)
  `);

    // Pagos de ejemplo
    db.run(`
    INSERT INTO payments (customer_id, invoice_id, payment_number, payment_date, amount, payment_method, reference_number) VALUES 
    (1, 1, 'PAY-2024-001', '2024-02-10', 1605.00, 'bank_transfer', 'TXN-789456123'),
    (2, NULL, 'PAY-2024-002', '2024-01-25', 500.00, 'check', 'CHK-001234')
  `);

    // Tasas de impuestos para condados principales (REPARACIÓN: Dedup)

    // 1. Limpieza de duplicados existentes
    db.run(`DELETE FROM florida_tax_rates WHERE id NOT IN (SELECT MIN(id) FROM florida_tax_rates GROUP BY county_name)`);

    // 2. Asegurar unicidad futura
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_florida_county ON florida_tax_rates(county_name)`);

    // 3. Insertar solo si no existen
    db.run(`
    INSERT OR IGNORE INTO florida_tax_rates (county_name, county_rate, total_rate) VALUES 
    ('Miami-Dade', 0.01, 0.07),
    ('Orange', 0.005, 0.065),
    ('Hillsborough', 0.0075, 0.0675),
    ('Broward', 0.01, 0.07),
    ('Palm Beach', 0.01, 0.07)
  `);

    // Proveedores de ejemplo
    db.run(`
    INSERT INTO suppliers (
      name, business_name, document_type, document_number, business_type,
      email, phone, address_line1, city, state, zip_code, florida_county,
      credit_limit, payment_terms, assigned_buyer
    ) VALUES 
    (
      'Tech Solutions Inc', 'Tech Solutions Incorporated', 'EIN', '87-6543210', 'Technology Supplier',
      'contact@techsolutions.com', '(305) 555-1001', '2500 NW 87th Ave', 'Miami', 'FL', '33172', 'Miami-Dade',
      100000.00, 30, 'Carlos López'
    ),
    (
      'Office Supplies Pro', 'Office Supplies Pro LLC', 'EIN', '76-5432109', 'Office Equipment',
      'sales@officesupplies.com', '(407) 555-2002', '1800 Colonial Dr', 'Orlando', 'FL', '32804', 'Orange',
      50000.00, 15, 'Ana García'
    ),
    (
      'Florida Business Services', 'FBS Corp', 'EIN', '65-4321098', 'Professional Services',
      'info@flbusiness.com', '(813) 555-3003', '4200 W Kennedy Blvd', 'Tampa', 'FL', '33609', 'Hillsborough',
      75000.00, 45, 'María Rodríguez'
    ),
    (
      'Global Logistics', 'Global Logistics Florida', 'EIN', '54-3210987', 'Logistics',
      'ops@globallogistics.com', '(305) 555-4004', '1000 Port Blvd', 'Miami', 'FL', '33132', 'Miami-Dade',
      120000.00, 30, 'Carlos López'
    ),
    (
      'Janitorial Experts', 'Janitorial Experts LLC', 'EIN', '43-2109876', 'Cleaning',
      'service@janitorial.com', '(407) 555-5005', '500 International Dr', 'Orlando', 'FL', '32819', 'Orange',
      5000.00, 7, 'Ana García'
    )
  `);

    // Facturas de compra de ejemplo
    db.run(`
    INSERT INTO bills (bill_number, supplier_id, issue_date, due_date, subtotal, tax_amount, total_amount, status) VALUES 
    ('BILL-2024-001', 1, '2024-01-10', '2024-02-09', 2000.00, 140.00, 2140.00, 'approved'),
    ('BILL-2024-002', 2, '2024-01-15', '2024-01-30', 850.00, 55.25, 905.25, 'received'),
    ('BILL-2024-003', 3, '2024-01-20', '2024-03-05', 1500.00, 105.00, 1605.00, 'paid'),
    ('BILL-2024-004', 4, '2024-01-22', '2024-02-21', 500.00, 35.00, 535.00, 'approved')
  `);

    // Líneas de factura de compra de ejemplo
    db.run(`
    INSERT INTO bill_lines (bill_id, product_id, description, quantity, unit_price, line_total) VALUES 
    (1, 2, 'Software Licenses - Bulk Purchase', 10.000, 200.00, 2000.00),
    (2, 4, 'Office Equipment Setup', 5.000, 170.00, 850.00),
    (3, 1, 'Professional Consulting Services', 10.000, 150.00, 1500.00),
    (4, 3, 'Shipping Fees', 1.000, 500.00, 500.00)
  `);

    // Asientos Contables de ejemplo (Journal Entries)
    db.run(`
    INSERT INTO journal_entries (entry_date, reference, description, total_debit, total_credit) VALUES 
    ('2024-01-01', 'OB-2024', 'Asiento de Apertura', 100000.00, 100000.00),
    ('2024-01-15', 'INV-2024-001', 'Venta a John Smith', 1605.00, 1605.00),
    ('2024-01-20', 'BILL-2024-003', 'Pago a Florida Business Services', 1605.00, 1605.00)
  `);

    // Detalles de Asientos Contables (Journal Details)
    // 1. Apertura: Caja (1112) Debit 100k, Capital (3110) Credit 100k
    // 2. Venta: Cuentas por Cobrar (1121) Debit 1605, Ventas (4110) Credit 1500, Tax Payable (2121) Credit 105
    // 3. Compra: Gastos Profesionales (5240) Debit 1500, Tax Credit (1121?) Debit 105, Cash (1112) Credit 1605
    db.run(`
    INSERT INTO journal_details (journal_entry_id, account_code, debit_amount, credit_amount, description) VALUES 
    (1, '1112', 100000.00, 0, 'Apertura de banco'),
    (1, '3110', 0, 100000.00, 'Aporte de capital'),
    (2, '1121', 1605.00, 0, 'Saldo deudor cliente'),
    (2, '4110', 0, 1500.00, 'Venta de productos'),
    (2, '2121', 0, 105.00, 'Impuesto ventas Florida'),
    (3, '5240', 1500.00, 0, 'Servicios profesionales recibidos'),
    (3, '2121', 105.00, 0, 'Crédito fiscal Florida'),
    (3, '1112', 0, 1605.00, 'Pago en efectivo/banco')
  `);

    console.log('Sample data and Journal Entries inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
    throw error;
  } finally {
    // PASO 3: Reactivar Foreign Keys
    // -------------------------------
    db.run(`PRAGMA foreign_keys = ON`);
    console.log('✅ Foreign Keys reactivadas - Base de datos segura');
  }
};

// Insertar categorías de productos iniciales
const insertInitialProductCategories = async (): Promise<void> => {
  if (!db) return;

  db.run(`
    INSERT INTO product_categories (name, description, tax_rate, active, created_at, updated_at) VALUES 
    ('Servicios Profesionales', 'Servicios de consultoría, asesoría y profesionales', 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Software y Licencias', 'Software, aplicaciones y licencias digitales', 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Hardware y Equipos', 'Equipos de cómputo, hardware y tecnología', 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Suministros de Oficina', 'Materiales, suministros y artículos de oficina', 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Servicios de Mantenimiento', 'Servicios de mantenimiento y soporte técnico', 0.00, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  console.log('Initial product categories inserted successfully');
};

// Insertar productos iniciales
const insertInitialProducts = async (): Promise<void> => {
  if (!db) return;

  db.run(`
    INSERT INTO products (
      sku, name, description, price, cost, category_id, unit_of_measure,
      taxable, stock_quantity, min_stock_level, max_stock_level, reorder_point,
      is_service, active, created_at, updated_at
    ) VALUES 
    ('SERV-001', 'Consultoría Contable', 'Servicios de consultoría contable y fiscal para empresas en Florida', 150.00, 75.00, 1, 'hora', 1, 0, 0, 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SERV-002', 'Auditoría Fiscal', 'Servicios de auditoría y cumplimiento fiscal completo', 500.00, 250.00, 1, 'servicio', 1, 0, 0, 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SERV-003', 'Preparación de Impuestos', 'Preparación y presentación de declaraciones de impuestos', 200.00, 100.00, 1, 'servicio', 1, 0, 0, 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PROD-001', 'Licencia Software Contable', 'Licencia anual de software contable profesional', 299.99, 150.00, 2, 'unidad', 1, 50, 10, 100, 20, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PROD-002', 'Configuración Hardware', 'Configuración e instalación de hardware contable', 199.99, 100.00, 3, 'servicio', 1, 0, 0, 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PROD-003', 'Papel Bond A4', 'Resma de papel bond tamaño carta para impresión', 12.99, 8.50, 4, 'resma', 1, 100, 20, 200, 30, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('PROD-004', 'Tóner Impresora HP', 'Cartucho de tóner para impresoras HP LaserJet', 89.99, 55.00, 4, 'unidad', 1, 25, 5, 50, 10, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('SERV-004', 'Soporte Técnico', 'Servicios de soporte técnico y mantenimiento de sistemas', 120.00, 60.00, 5, 'hora', 1, 0, 0, 0, 0, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  console.log('Initial products inserted successfully');
};

const insertInitialTaxRates = async (): Promise<void> => {
  if (!db) return;

  db.run(`
    INSERT INTO florida_tax_rates (county_name, state_rate, county_rate, total_rate) VALUES
    ('Miami-Dade', 0.06, 0.01, 0.07),
    ('Broward', 0.06, 0.01, 0.07),
    ('Palm Beach', 0.06, 0.01, 0.07),
    ('Orange', 0.06, 0.005, 0.065),
    ('Hillsborough', 0.06, 0.015, 0.075),
    ('Monroe', 0.06, 0.015, 0.075),
    ('Duval', 0.06, 0.015, 0.075),
    ('Pinellas', 0.06, 0.01, 0.07),
    ('Lee', 0.06, 0.005, 0.065)
  `);

  console.log('Initial tax rates inserted successfully');
};

// Configurar auto-save
const setupAutoSave = (): void => {
  if (!db) return;

  setInterval(async () => {
    try {
      await saveDatabase();
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, BACKUP_INTERVAL);

  // Guardar al cerrar la ventana
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      saveDatabase().catch(console.error);
    });
  }

  console.log('Auto-save configured');
};

// Guardar base de datos
export const saveDatabase = async (): Promise<void> => {
  if (!db) return;

  try {
    let data = db.export();

    // Cifrar si está habilitado
    if (encryptionEnabled && currentPassword) {
      try {
        const encrypted = await BasicEncryption.encrypt(data, currentPassword);
        data = BasicEncryption.combineEncryptedData(encrypted.encrypted, encrypted.salt, encrypted.iv);
        console.log('Database encrypted before saving');
      } catch (error) {
        console.error('Encryption failed, saving unencrypted:', error);
      }
    }

    if (opfsRoot && dbFile) {
      // Guardar en OPFS - ensure proper ArrayBuffer type
      const writable = await dbFile.createWritable();
      // Convert to proper ArrayBuffer if it's a SharedArrayBuffer
      let dataBuffer: ArrayBuffer;
      if (data.buffer instanceof ArrayBuffer) {
        dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      } else {
        // Handle SharedArrayBuffer case
        const tempArray = new Uint8Array(data.length);
        tempArray.set(data);
        dataBuffer = tempArray.buffer;
      }
      await writable.write(dataBuffer);
      await writable.close();
      console.log('Database saved to OPFS');
    } else {
      // Fallback a localStorage (comprimido)
      const compressed = await compressData(data);
      localStorage.setItem('accountexpress-db', compressed);
      localStorage.setItem('accountexpress-encrypted', encryptionEnabled.toString());
      console.log('Database saved to localStorage (compressed)');
    }
  } catch (error) {
    console.error('Error saving database:', error);
  }
};

// Comprimir datos para localStorage
const compressData = async (data: Uint8Array): Promise<string> => {
  // Ensure proper ArrayBuffer type for compression
  let dataBuffer: ArrayBuffer;
  if (data.buffer instanceof ArrayBuffer) {
    dataBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  } else {
    // Handle SharedArrayBuffer case
    const tempArray = new Uint8Array(data.length);
    tempArray.set(data);
    dataBuffer = tempArray.buffer;
  }
  return await BasicEncryption.compressData(new Uint8Array(dataBuffer));
};

// Cargar desde localStorage
const loadFromLocalStorage = async (): Promise<Uint8Array | null> => {
  try {
    const stored = localStorage.getItem('accountexpress-db');
    const isEncrypted = localStorage.getItem('accountexpress-encrypted') === 'true';

    if (!stored) return null;

    let decoded = atob(stored);
    let data = new Uint8Array(decoded.split('').map(char => char.charCodeAt(0)));

    // Descifrar si es necesario
    if (isEncrypted && encryptionEnabled && currentPassword) {
      try {
        const { salt, iv, encrypted } = BasicEncryption.separateEncryptedData(data);
        const decryptedData = await BasicEncryption.decrypt(encrypted, salt, iv, currentPassword);
        // Ensure proper ArrayBuffer type
        const tempArray = new Uint8Array(decryptedData.length);
        tempArray.set(decryptedData);
        data = tempArray;
        console.log('Database decrypted from localStorage');
      } catch (error) {
        console.error('Failed to decrypt from localStorage:', error);
        return null;
      }
    }

    return data;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
};

// Verificar si el cifrado está habilitado
export const isEncryptionEnabled = (): boolean => {
  return encryptionEnabled;
};

// Cambiar contraseña de cifrado
export const changeEncryptionPassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
  if (!db || !encryptionEnabled) return false;

  try {
    // Verificar contraseña actual
    if (currentPassword !== oldPassword) {
      throw new Error('Invalid current password');
    }

    // Cambiar contraseña
    currentPassword = newPassword;

    // Guardar con nueva contraseña
    await saveDatabase();

    console.log('Encryption password changed successfully');
    return true;
  } catch (error) {
    console.error('Error changing encryption password:', error);
    return false;
  }
};

// Habilitar cifrado en base de datos existente
export const enableEncryption = async (password: string): Promise<boolean> => {
  if (!db || encryptionEnabled || !BasicEncryption.isSupported()) {
    return false;
  }

  try {
    encryptionEnabled = true;
    currentPassword = password;

    // Guardar base de datos cifrada
    await saveDatabase();

    console.log('Encryption enabled successfully');
    return true;
  } catch (error) {
    console.error('Error enabling encryption:', error);
    encryptionEnabled = false;
    currentPassword = null;
    return false;
  }
};

// Deshabilitar cifrado
export const disableEncryption = async (password: string): Promise<boolean> => {
  if (!db || !encryptionEnabled || currentPassword !== password) {
    return false;
  }

  try {
    encryptionEnabled = false;
    currentPassword = null;

    // Guardar base de datos sin cifrar
    await saveDatabase();

    console.log('Encryption disabled successfully');
    return true;
  } catch (error) {
    console.error('Error disabling encryption:', error);
    return false;
  }
};

// Verificar si la base de datos está lista
export const isDatabaseReady = (): boolean => {
  const ready = isInitialized && db !== null;
  console.log('Database ready check:', { isInitialized, dbExists: !!db, ready });
  return ready;
};

export const addCustomer = async (customerData: Partial<Customer>): Promise<number> => {
  logger.debug('CustomerModule', 'add_customer_start', 'Iniciando proceso de agregar cliente', { customerName: customerData.name });

  if (!db) {
    logger.error('CustomerModule', 'add_customer_failed', 'Base de datos no inicializada al intentar agregar cliente');
    throw new Error('Database not initialized. Please wait for the system to load completely.');
  }

  try {
    logger.debug('CustomerModule', 'add_customer_transaction', 'Iniciando transacción para agregar cliente');
    // Iniciar transacción
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO customers (
        name, business_name, document_type, document_number, business_type,
        email, email_secondary, phone, phone_secondary,
        address_line1, address_line2, city, state, zip_code, florida_county,
        credit_limit, payment_terms, tax_exempt, tax_id, assigned_salesperson,
        status, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const values = [
      customerData.name || '',
      customerData.business_name || null,
      customerData.document_type || 'SSN',
      customerData.document_number || null,
      customerData.business_type || null,
      customerData.email || null,
      customerData.email_secondary || null,
      customerData.phone || null,
      customerData.phone_secondary || null,
      customerData.address_line1 || null,
      customerData.address_line2 || null,
      customerData.city || 'Miami',
      customerData.state || 'FL',
      customerData.zip_code || null,
      customerData.florida_county || 'Miami-Dade',
      customerData.credit_limit || 0,
      customerData.payment_terms || 30,
      customerData.tax_exempt ? 1 : 0, // Convert boolean to number
      customerData.tax_id || null,
      customerData.assigned_salesperson || null,
      customerData.status || 'active',
      customerData.notes || null
    ];

    stmt.run(values);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const insertId = insertResult[0]?.values[0]?.[0] as number || 0;

    stmt.free();

    // Registrar en auditoría
    await logAuditEvent('customers', insertId, 'INSERT', null, customerData);

    // Confirmar transacción
    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    logger.info('CustomerModule', 'add_customer_success', `Cliente agregado exitosamente con ID: ${insertId}`, {
      customerId: insertId,
      customerName: customerData.name,
      customerEmail: customerData.email
    });

    return insertId;

  } catch (error) {
    logger.error('CustomerModule', 'add_customer_failed', `Error al agregar cliente: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      customerData: { name: customerData.name, email: customerData.email }
    }, error as Error);
    db?.run('ROLLBACK');
    throw error;
  }
};

export const getCustomers = (): Customer[] => {
  console.log('=== GETTING CUSTOMERS ===');
  console.log('Database initialized:', !!db);

  if (!db) {
    console.log('Database not initialized, returning empty array');
    return [];
  }

  try {
    const result = db.exec(`
      SELECT 
        id, name, business_name, document_type, document_number, business_type,
        email, email_secondary, phone, phone_secondary,
        address_line1, address_line2, city, state, zip_code, florida_county,
        credit_limit, payment_terms, tax_exempt, tax_id, assigned_salesperson,
        status, notes, created_at, updated_at
      FROM customers 
      ORDER BY created_at DESC
    `);

    console.log('Raw query result:', result);

    // Convertir el resultado a array de objetos
    const customers: Customer[] = [];

    if (result && result.length > 0 && result[0].values) {
      const columns = result[0].columns;
      const values = result[0].values;

      values.forEach((row: initSqlJs.SqlValue[]) => {
        const customerObj = rowToEntity<Record<string, unknown>>(columns, row);
        customers.push(processCustomerRow(customerObj));
      });
    }

    console.log('Processed customers:', customers);
    console.log('Customer count:', customers.length);
    return customers;

  } catch (error) {
    console.error('Error getting customers:', error);
    return [];
  }
};

// Función auxiliar para procesar una fila de cliente
const processCustomerRow = (row: Record<string, unknown>): Customer => {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    business_name: row.business_name ? String(row.business_name) : undefined,
    document_type: String(row.document_type || 'SSN') as 'SSN' | 'EIN' | 'ITIN' | 'PASSPORT',
    document_number: String(row.document_number || ''),
    business_type: row.business_type ? String(row.business_type) : undefined,
    email: String(row.email || ''),
    email_secondary: row.email_secondary ? String(row.email_secondary) : undefined,
    phone: String(row.phone || ''),
    phone_secondary: row.phone_secondary ? String(row.phone_secondary) : undefined,
    address_line1: String(row.address_line1 || ''),
    address_line2: row.address_line2 ? String(row.address_line2) : undefined,
    city: String(row.city || 'Miami'),
    state: String(row.state || 'FL'),
    zip_code: String(row.zip_code || ''),
    florida_county: String(row.florida_county || 'Miami-Dade'),
    credit_limit: Number(row.credit_limit || 0),
    payment_terms: Number(row.payment_terms || 30),
    tax_exempt: Boolean(Number(row.tax_exempt)), // Convert from SQLite integer to boolean
    tax_id: row.tax_id ? String(row.tax_id) : undefined,
    assigned_salesperson: row.assigned_salesperson ? String(row.assigned_salesperson) : undefined,
    status: String(row.status || 'active') as 'active' | 'inactive' | 'suspended',
    notes: row.notes ? String(row.notes) : undefined,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString())
  };
};

export const getCustomerById = (id: number): Customer | null => {
  if (!db) return null;

  try {
    const result = db.exec(`
      SELECT 
        id, name, business_name, document_type, document_number, business_type,
        email, email_secondary, phone, phone_secondary,
        address_line1, address_line2, city, state, zip_code, florida_county,
        credit_limit, payment_terms, tax_exempt, tax_id, assigned_salesperson,
        status, notes, created_at, updated_at
      FROM customers 
      WHERE id = ${id}
    `);

    if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
      const columns = result[0].columns;
      const row = result[0].values[0];

      const customerObj: any = {};
      columns.forEach((col: string, index: number) => {
        customerObj[col] = row[index];
      });

      return processCustomerRow(customerObj);
    }

    return null;

  } catch (error) {
    console.error('Error getting customer by ID:', error);
    return null;
  }
};

export const updateCustomer = (id: number, customerData: Partial<Customer>): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Obtener valores anteriores para auditoría
    const oldCustomer = getCustomerById(id);
    if (!oldCustomer) {
      return { success: false, message: 'Cliente no encontrado' };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      UPDATE customers 
      SET name = ?, business_name = ?, document_type = ?, document_number = ?, business_type = ?,
          email = ?, email_secondary = ?, phone = ?, phone_secondary = ?,
          address_line1 = ?, address_line2 = ?, city = ?, state = ?, zip_code = ?, florida_county = ?,
          credit_limit = ?, payment_terms = ?, tax_exempt = ?, tax_id = ?, assigned_salesperson = ?,
          status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const values = [
      customerData.name || oldCustomer.name,
      customerData.business_name || oldCustomer.business_name || null,
      customerData.document_type || oldCustomer.document_type,
      customerData.document_number || oldCustomer.document_number,
      customerData.business_type || oldCustomer.business_type || null,
      customerData.email || oldCustomer.email,
      customerData.email_secondary || oldCustomer.email_secondary || null,
      customerData.phone || oldCustomer.phone,
      customerData.phone_secondary || oldCustomer.phone_secondary || null,
      customerData.address_line1 || oldCustomer.address_line1,
      customerData.address_line2 || oldCustomer.address_line2 || null,
      customerData.city || oldCustomer.city,
      customerData.state || oldCustomer.state,
      customerData.zip_code || oldCustomer.zip_code,
      customerData.florida_county || oldCustomer.florida_county,
      customerData.credit_limit !== undefined ? customerData.credit_limit : oldCustomer.credit_limit,
      customerData.payment_terms !== undefined ? customerData.payment_terms : oldCustomer.payment_terms,
      customerData.tax_exempt !== undefined ? (customerData.tax_exempt ? 1 : 0) : (oldCustomer.tax_exempt ? 1 : 0), // Convert boolean to number
      customerData.tax_id || oldCustomer.tax_id || null,
      customerData.assigned_salesperson || oldCustomer.assigned_salesperson || null,
      customerData.status || oldCustomer.status,
      customerData.notes || oldCustomer.notes || null,
      id
    ];

    stmt.run(values);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se realizaron cambios' };
    }

    // Registrar en auditoría
    logAuditEvent('customers', id, 'UPDATE', oldCustomer, customerData);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    console.log(`Customer ${id} updated successfully`);
    return { success: true, message: `Cliente "${customerData.name || oldCustomer.name}" actualizado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error updating customer:', error);
    return { success: false, message: `Error al actualizar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

// Verificar si un cliente puede ser eliminado
export const canDeleteCustomer = (customerId: number): { canDelete: boolean; reason?: string } => {
  if (!db) return { canDelete: false, reason: 'Database not initialized' };

  try {
    // Verificar si tiene facturas
    const invoiceCheck = db.exec(`
      SELECT COUNT(*) as count FROM invoices WHERE customer_id = ${customerId}
    `);
    const invoiceCount = invoiceCheck[0]?.values[0]?.[0] as number || 0;

    if (invoiceCount > 0) {
      return {
        canDelete: false,
        reason: `El cliente tiene ${invoiceCount} factura(s) asociada(s). No se puede eliminar.`
      };
    }

    // Verificar si tiene pagos
    const paymentCheck = db.exec(`
      SELECT COUNT(*) as count FROM payments WHERE customer_id = ${customerId}
    `);
    const paymentCount = paymentCheck[0]?.values[0]?.[0] as number || 0;

    if (paymentCount > 0) {
      return {
        canDelete: false,
        reason: `El cliente tiene ${paymentCount} pago(s) registrado(s). No se puede eliminar.`
      };
    }

    return { canDelete: true };

  } catch (error) {
    console.error('Error checking if customer can be deleted:', error);
    return { canDelete: false, reason: 'Error al verificar las dependencias del cliente' };
  }
};

export const deleteCustomer = (id: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar si se puede eliminar
    const deleteCheck = canDeleteCustomer(id);
    if (!deleteCheck.canDelete) {
      return { success: false, message: deleteCheck.reason || 'No se puede eliminar el cliente' };
    }

    // Obtener datos del cliente para auditoría antes de eliminar
    const customer = getCustomerById(id);
    if (!customer) {
      return { success: false, message: 'Cliente no encontrado' };
    }

    db.run('BEGIN TRANSACTION');

    // Eliminar cliente
    const stmt = db.prepare('DELETE FROM customers WHERE id = ?');
    stmt.run([id]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar el cliente' };
    }

    // Registrar en auditoría
    logAuditEvent('customers', id, 'DELETE', customer, null);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    console.log(`Customer ${id} deleted successfully`);
    return { success: true, message: `Cliente "${customer.name}" eliminado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error deleting customer:', error);
    return { success: false, message: `Error al eliminar el cliente: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

// Función de auditoría mejorada
// Función para generar hash de auditoría con chaining
const generateAuditHash = async (auditData: any): Promise<string> => {
  try {
    let previousHash = '0';

    // Si no se proporciona previousHash, obtenerlo de la base de datos
    if (!auditData.previousHash) {
      const lastHashResult = db?.exec(`
        SELECT audit_hash FROM audit_log 
        ORDER BY id DESC 
        LIMIT 1
      `);

      previousHash = lastHashResult?.[0]?.values?.[0]?.[0] as string || '0';
    } else {
      previousHash = auditData.previousHash;
    }

    // Crear string para hash que incluye el hash anterior (chaining)
    const dataToHash = JSON.stringify({
      previousHash,
      tableName: auditData.tableName,
      recordId: auditData.recordId,
      action: auditData.action,
      oldValues: auditData.oldValues,
      newValues: auditData.newValues,
      timestamp: auditData.timestamp,
      userId: auditData.userId
    });

    // Generar hash SHA-256
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(dataToHash);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback simple hash para entornos sin Web Crypto API
      let hash = 0;
      for (let i = 0; i < dataToHash.length; i++) {
        const char = dataToHash.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    }
  } catch (error) {
    console.error('Error generating audit hash:', error);
    return Date.now().toString(16); // Fallback timestamp-based hash
  }
};

// Función auxiliar para hash síncrono (para funciones no async)
const generateSimpleHash = (auditData: any): string => {
  const dataString = JSON.stringify(auditData);
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

const logAuditEvent = async (tableName: string, recordId: number, action: string, oldValues: any, newValues: any): Promise<void> => {
  if (!db) return;

  try {
    // Generar datos de auditoría
    const auditData = {
      tableName,
      recordId,
      action,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      timestamp: new Date().toISOString(),
      userId: 1 // TODO: Implementar sistema de usuarios
    };

    // Generar hash con chaining
    const auditHash = await generateAuditHash(auditData);

    const stmt = db.prepare(`
      INSERT INTO audit_log (
        table_name, record_id, action, old_values, new_values, 
        user_id, timestamp, audit_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      tableName,
      recordId,
      action,
      auditData.oldValues,
      auditData.newValues,
      auditData.userId,
      auditData.timestamp,
      auditHash
    ]);

    stmt.free();

    logger.info('AuditSystem', 'log_event', `Audit event logged: ${action} on ${tableName} ID ${recordId}`, {
      tableName,
      recordId,
      action,
      auditHash: auditHash.substring(0, 8) + '...' // Log only first 8 chars for security
    });
  } catch (error) {
    logger.error('AuditSystem', 'log_event_failed', 'Error logging audit event', { tableName, recordId, action }, error as Error);
  }
};

// Obtener log de auditoría
export const getAuditLog = (limit: number = 100): Array<Record<string, any>> => {
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT * FROM audit_log 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);

    const result = stmt.getAsObject([limit]);
    stmt.free();

    return Array.isArray(result) ? result as Array<Record<string, any>> : [];
  } catch (error) {
    console.error('Error getting audit log:', error);
    return [];
  }
};

// Obtener estadísticas de la base de datos
export const getDatabaseInfo = () => {
  if (!db) return null;

  try {
    const info = {
      size: db.export().length,
      tables: {} as Record<string, number>,
      lastBackup: localStorage.getItem('accountexpress-last-backup'),
      opfsSupported: !!opfsRoot,
      autoSaveEnabled: true
    };

    // Contar registros por tabla
    const tables = ['customers', 'products', 'florida_tax_rates', 'audit_log'];

    for (const table of tables) {
      try {
        const result = db.exec(`SELECT COUNT(*) as count FROM ${table}`);
        info.tables[table] = result[0]?.values[0]?.[0] as number || 0;
      } catch (error) {
        info.tables[table] = 0;
      }
    }

    return info;
  } catch (error) {
    console.error('Error getting database info:', error);
    return null;
  }
};

// Crear backup manual
export const createBackup = async (): Promise<string> => {
  if (!db) throw new Error('Database not initialized');

  try {
    await saveDatabase();
    const timestamp = new Date().toISOString();
    localStorage.setItem('accountexpress-last-backup', timestamp);

    console.log('Manual backup created at:', timestamp);
    return timestamp;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

export const getStats = () => {
  if (!db) return { customers: 0 };

  try {
    const customerResult = db.exec("SELECT COUNT(*) as count FROM customers");

    const customerCount = customerResult[0]?.values[0]?.[0] as number || 0;

    return {
      customers: customerCount
    };

  } catch (error) {
    console.error('Error getting stats:', error);
    return { customers: 0 };
  }
};

// Condados de Florida para el dropdown
export const FLORIDA_COUNTIES = [
  'Alachua', 'Baker', 'Bay', 'Bradford', 'Brevard', 'Broward', 'Calhoun',
  'Charlotte', 'Citrus', 'Clay', 'Collier', 'Columbia', 'DeSoto', 'Dixie',
  'Duval', 'Escambia', 'Flagler', 'Franklin', 'Gadsden', 'Gilchrist',
  'Glades', 'Gulf', 'Hamilton', 'Hardee', 'Hendry', 'Hernando', 'Highlands',
  'Hillsborough', 'Holmes', 'Indian River', 'Jackson', 'Jefferson', 'Lafayette',
  'Lake', 'Lee', 'Leon', 'Levy', 'Liberty', 'Madison', 'Manatee', 'Marion',
  'Martin', 'Miami-Dade', 'Monroe', 'Nassau', 'Okaloosa', 'Okeechobee',
  'Orange', 'Osceola', 'Palm Beach', 'Pasco', 'Pinellas', 'Polk', 'Putnam',
  'Santa Rosa', 'Sarasota', 'Seminole', 'St. Johns', 'St. Lucie', 'Sumter',
  'Suwannee', 'Taylor', 'Union', 'Volusia', 'Wakulla', 'Walton', 'Washington'
];

// ==========================================
// FUNCIONES CRUD PARA FACTURAS
// ==========================================

// Generar número de factura automático
export const generateInvoiceNumber = (): string => {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.exec("SELECT COUNT(*) as count FROM invoices");
    const count = (result[0]?.values[0]?.[0] as number || 0) + 1;
    const year = new Date().getFullYear();
    return `INV-${year}-${count.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${new Date().getFullYear()}-${timestamp}`;
  }
};

// Obtener todas las facturas con información del cliente
export const getInvoices = (): Invoice[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT 
        i.*,
        c.name as customer_name,
        c.business_name as customer_business_name,
        c.email as customer_email
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `);

    if (!result[0]) return [];

    const invoices: Invoice[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: initSqlJs.SqlValue[]) => {
      const invoice = rowToEntity<Invoice & { customer_name: string; customer_business_name: string; customer_email: string }>(columns, row);

      // Agregar información del cliente
      invoice.customer = {
        name: invoice.customer_name,
        business_name: invoice.customer_business_name,
        email: invoice.customer_email
      } as Customer;

      invoices.push(invoice);
    });

    return invoices;
  } catch (error) {
    console.error('Error getting invoices:', error);
    return [];
  }
};

// Obtener factura por ID con líneas de factura
export const getInvoiceById = (id: number): Invoice | null => {
  if (!db) return null;

  try {
    // Obtener factura principal
    const invoiceResult = db.exec(`
      SELECT 
        i.*,
        c.name as customer_name,
        c.business_name as customer_business_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address_line1 as customer_address,
        c.city as customer_city,
        c.state as customer_state,
        c.zip_code as customer_zip
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `, [id]);

    if (!invoiceResult[0] || invoiceResult[0].values.length === 0) return null;

    const invoiceRow = invoiceResult[0].values[0];
    const columns = invoiceResult[0].columns;

    const invoice: any = {};
    columns.forEach((col, index) => {
      invoice[col] = invoiceRow[index];
    });

    // Agregar información del cliente
    invoice.customer = {
      name: invoice.customer_name,
      business_name: invoice.customer_business_name,
      email: invoice.customer_email,
      phone: invoice.customer_phone,
      address_line1: invoice.customer_address,
      city: invoice.customer_city,
      state: invoice.customer_state,
      zip_code: invoice.customer_zip
    };

    // Obtener líneas de factura
    const itemsResult = db.exec(`
      SELECT 
        il.*,
        p.name as product_name,
        p.sku as product_sku
      FROM invoice_lines il
      LEFT JOIN products p ON il.product_id = p.id
      WHERE il.invoice_id = ?
      ORDER BY il.id
    `, [id]);

    invoice.items = [];
    if (itemsResult[0]) {
      const itemColumns = itemsResult[0].columns;
      itemsResult[0].values.forEach(itemRow => {
        const item: any = {};
        itemColumns.forEach((col, index) => {
          item[col] = itemRow[index];
        });

        if (item.product_id) {
          item.product = {
            name: item.product_name,
            sku: item.product_sku
          };
        }

        invoice.items.push(item);
      });
    }

    return invoice as Invoice;
  } catch (error) {
    console.error('Error getting invoice by ID:', error);
    return null;
  }
};

// Crear nueva factura
export const createInvoice = (invoiceData: Partial<Invoice>, items: Partial<InvoiceItem>[]): { success: boolean; message: string; invoiceId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validaciones básicas
    if (!invoiceData.customer_id) {
      return { success: false, message: 'Customer ID is required' };
    }

    if (!items || items.length === 0) {
      return { success: false, message: 'At least one item is required' };
    }

    // Generar número de factura si no se proporciona
    const invoiceNumber = invoiceData.invoice_number || generateInvoiceNumber();

    // Obtener condado del cliente para cálculo de impuestos
    const customer = getCustomerById(invoiceData.customer_id);
    const county = customer?.florida_county || 'Miami-Dade';

    // Calcular totales usando tasa dinámica
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      subtotal += lineTotal;
      if (item.taxable) {
        taxAmount += lineTotal * getFloridaTaxRate(county); // Usar tasa dinámica por condado
      }
    });

    const total = subtotal + taxAmount;

    // Insertar factura principal
    const stmt = db.prepare(`
      INSERT INTO invoices (
        invoice_number, customer_id, issue_date, due_date, 
        subtotal, tax_amount, total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const issueDate = invoiceData.issue_date || new Date().toISOString().split('T')[0];
    const dueDate = invoiceData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    stmt.run([
      invoiceNumber,
      invoiceData.customer_id,
      issueDate,
      dueDate,
      subtotal,
      taxAmount,
      total,
      invoiceData.status || 'draft',
      invoiceData.notes || ''
    ]);

    const invoiceId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;

    // Insertar líneas de factura
    const itemStmt = db.prepare(`
      INSERT INTO invoice_lines (
        invoice_id, product_id, description, quantity, unit_price, line_total, taxable
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      itemStmt.run([
        invoiceId,
        item.product_id || null,
        item.description || '',
        item.quantity || 1,
        item.unit_price || 0,
        lineTotal,
        item.taxable ? 1 : 0
      ]);
    });

    // Registrar en auditoría
    logAuditAction('invoices', invoiceId, 'INSERT', null, {
      invoice_number: invoiceNumber,
      customer_id: invoiceData.customer_id,
      total_amount: total,
      status: invoiceData.status || 'draft'
    });

    // GENERAR ASIENTO CONTABLE AUTOMÁTICO (DOBLE ENTRADA)
    if (invoiceData.status === 'sent' || invoiceData.status === 'paid') {
      const fullInvoice = getInvoiceById(invoiceId);
      if (fullInvoice) {
        const journalResult = generateSalesJournalEntry(fullInvoice);
        if (!journalResult.success) {
          console.warn('Warning: Could not generate journal entry for invoice:', journalResult.message);
        } else {
          console.log('Journal entry created for invoice:', journalResult.entryId);
        }
      }
    }

    return {
      success: true,
      message: `Invoice ${invoiceNumber} created successfully`,
      invoiceId
    };

  } catch (error) {
    console.error('Error creating invoice:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error creating invoice'
    };
  }
};

// Actualizar factura
export const updateInvoice = (id: number, invoiceData: Partial<Invoice>, items?: Partial<InvoiceItem>[]): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Obtener factura actual para auditoría
    const currentInvoice = getInvoiceById(id);
    if (!currentInvoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // Actualizar factura principal
    const updateFields = [];
    const updateValues = [];

    if (invoiceData.issue_date !== undefined) {
      updateFields.push('issue_date = ?');
      updateValues.push(invoiceData.issue_date);
    }

    if (invoiceData.due_date !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(invoiceData.due_date);
    }

    if (invoiceData.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(invoiceData.status);
    }

    if (invoiceData.notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(invoiceData.notes);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      const updateQuery = `UPDATE invoices SET ${updateFields.join(', ')} WHERE id = ?`;
      db.exec(updateQuery, updateValues);
    }

    // Si se proporcionan items, actualizar líneas de factura
    if (items) {
      // Eliminar líneas existentes
      db.exec('DELETE FROM invoice_lines WHERE invoice_id = ?', [id]);

      // Insertar nuevas líneas
      let subtotal = 0;
      let taxAmount = 0;

      const itemStmt = db.prepare(`
        INSERT INTO invoice_lines (
          invoice_id, product_id, description, quantity, unit_price, line_total, taxable
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // Obtener condado para recálculo de impuestos
      const invoice = getInvoiceById(id);
      const county = invoice?.customer?.florida_county || 'Miami-Dade';
      const taxRate = getFloridaTaxRate(county);

      items.forEach(item => {
        const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
        subtotal += lineTotal;
        if (item.taxable) {
          taxAmount += lineTotal * taxRate;
        }

        itemStmt.run([
          id,
          item.product_id || null,
          item.description || '',
          item.quantity || 1,
          item.unit_price || 0,
          lineTotal,
          item.taxable ? 1 : 0
        ]);
      });

      // Actualizar totales
      const total = subtotal + taxAmount;
      db.exec(`
        UPDATE invoices 
        SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [subtotal, taxAmount, total, id]);
    }

    // Registrar en auditoría
    logAuditAction('invoices', id, 'UPDATE', currentInvoice, invoiceData);

    return { success: true, message: 'Invoice updated successfully' };

  } catch (error) {
    console.error('Error updating invoice:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error updating invoice'
    };
  }
};

// Eliminar factura
export const deleteInvoice = (id: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar si la factura existe
    const invoice = getInvoiceById(id);
    if (!invoice) {
      return { success: false, message: 'Invoice not found' };
    }

    // Verificar si la factura está pagada (no se puede eliminar)
    if (invoice.status === 'paid') {
      return { success: false, message: 'Cannot delete paid invoices' };
    }

    // Eliminar líneas de factura primero (por foreign key)
    db.exec('DELETE FROM invoice_lines WHERE invoice_id = ?', [id]);

    // Eliminar factura
    db.exec('DELETE FROM invoices WHERE id = ?', [id]);

    // Registrar en auditoría
    logAuditAction('invoices', id, 'DELETE', invoice, null);

    return { success: true, message: 'Invoice deleted successfully' };

  } catch (error) {
    console.error('Error deleting invoice:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error deleting invoice'
    };
  }
};

// Obtener productos activos para el formulario de factura
export const getActiveProducts = (): Product[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT * FROM products 
      WHERE active = 1 
      ORDER BY name
    `);

    if (!result[0]) return [];

    const products: Product[] = [];
    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const product: any = {};
      columns.forEach((col, index) => {
        product[col] = row[index];
      });
      products.push(product as Product);
    });

    return products;
  } catch (error) {
    console.error('Error getting active products:', error);
    return [];
  }
};

// Calcular tasa de impuesto por condado de Florida dinámicamente
export const getFloridaTaxRate = (county: string): number => {
  if (!db) return 0.06; // Tasa base por defecto

  try {
    const result = db.exec(`
      SELECT total_rate FROM florida_tax_rates 
      WHERE county_name = ? 
      ORDER BY effective_date DESC 
      LIMIT 1
    `, [county]);

    if (result && result.length > 0 && result[0].values.length > 0) {
      return Number(result[0].values[0][0]) || 0.06;
    }
  } catch (error) {
    console.error('Error getting tax rate for county:', county, error);
  }

  // Tasas de respaldo por condado de Florida (Seguir datos de insertInitialTaxRates)
  const fallbackRates: Record<string, number> = {
    'Miami-Dade': 0.07,
    'Broward': 0.07,
    'Orange': 0.065,
    'Hillsborough': 0.075,
    'Palm Beach': 0.07,
    'Pinellas': 0.07,
    'Duval': 0.075,
    'Lee': 0.065,
    'Polk': 0.07,
    'Brevard': 0.07,
    'Monroe': 0.075
  };

  return fallbackRates[county] || 0.06; // 6% tasa base de Florida
};

// Función mejorada para calcular impuestos con condado específico
export const calculateTaxAmount = (subtotal: number, county: string = 'Miami-Dade', taxableItems: boolean = true): { taxAmount: number; taxRate: number } => {
  if (!taxableItems || subtotal <= 0) {
    return { taxAmount: 0, taxRate: 0 };
  }

  const taxRate = getFloridaTaxRate(county);
  const taxAmount = subtotal * taxRate;

  return {
    taxAmount: Math.round(taxAmount * 100) / 100, // Redondear a 2 decimales
    taxRate
  };
};

// Función para validar integridad de cálculos financieros
export const validateFinancialCalculation = (subtotal: number, taxAmount: number, total: number, county: string): boolean => {
  const calculated = calculateTaxAmount(subtotal, county);
  const expectedTotal = subtotal + calculated.taxAmount;

  // Tolerancia de 1 centavo para errores de redondeo
  const tolerance = 0.01;

  return Math.abs(total - expectedTotal) <= tolerance &&
    Math.abs(taxAmount - calculated.taxAmount) <= tolerance;
};

// Actualizar estadísticas para incluir facturas
export const getStatsWithInvoices = () => {
  if (!db) return { customers: 0, invoices: 0, revenue: 0 };

  try {
    const customerResult = db.exec("SELECT COUNT(*) as count FROM customers");
    const invoiceResult = db.exec("SELECT COUNT(*) as count FROM invoices");
    const revenueResult = db.exec("SELECT SUM(total_amount) as total FROM invoices WHERE status = 'paid'");

    const customerCount = customerResult[0]?.values[0]?.[0] as number || 0;
    const invoiceCount = invoiceResult[0]?.values[0]?.[0] as number || 0;
    const revenue = revenueResult[0]?.values[0]?.[0] as number || 0;

    return {
      customers: customerCount,
      invoices: invoiceCount,
      revenue: revenue
    };

  } catch (error) {
    console.error('Error getting stats with invoices:', error);
    return { customers: 0, invoices: 0, revenue: 0 };
  }
};

// ==========================================
// FUNCIONES CRUD PARA PROVEEDORES
// ==========================================

// Agregar proveedor
export const addSupplier = (supplierData: Partial<Supplier>): number => {
  console.log('=== ADD SUPPLIER FUNCTION ===');
  console.log('Database object:', db);
  console.log('Is initialized:', isInitialized);
  console.log('Supplier data:', supplierData);

  if (!db) {
    console.error('Database not initialized when trying to add supplier');
    throw new Error('Database not initialized. Please wait for the system to load completely.');
  }

  try {
    console.log('Starting transaction...');
    // Iniciar transacción
    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO suppliers (
        name, business_name, document_type, document_number, business_type,
        email, email_secondary, phone, phone_secondary,
        address_line1, address_line2, city, state, zip_code, florida_county,
        credit_limit, payment_terms, tax_exempt, tax_id, assigned_buyer,
        status, notes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const values = [
      supplierData.name || '',
      supplierData.business_name || null,
      supplierData.document_type || 'EIN',
      supplierData.document_number || null,
      supplierData.business_type || null,
      supplierData.email || null,
      supplierData.email_secondary || null,
      supplierData.phone || null,
      supplierData.phone_secondary || null,
      supplierData.address_line1 || null,
      supplierData.address_line2 || null,
      supplierData.city || 'Miami',
      supplierData.state || 'FL',
      supplierData.zip_code || null,
      supplierData.florida_county || 'Miami-Dade',
      supplierData.credit_limit || 0,
      supplierData.payment_terms || 30,
      supplierData.tax_exempt ? 1 : 0,
      supplierData.tax_id || null,
      supplierData.assigned_buyer || null,
      supplierData.status || 'active',
      supplierData.notes || null
    ];

    console.log('Executing insert with values:', values);
    stmt.run(values);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const insertId = insertResult[0]?.values[0]?.[0] as number || 0;
    console.log('Insert ID:', insertId);

    stmt.free();

    // Registrar en auditoría
    logAuditEvent('suppliers', insertId, 'INSERT', null, supplierData);

    // Confirmar transacción
    db.run('COMMIT');
    console.log('Transaction committed');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    console.log(`Supplier added with ID: ${insertId}`);
    return insertId;

  } catch (error) {
    console.error('Error in addSupplier:', error);
    db?.run('ROLLBACK');
    throw error;
  }
};

// Obtener todos los proveedores
export const getSuppliers = (): Supplier[] => {
  console.log('=== GETTING SUPPLIERS ===');
  console.log('Database initialized:', !!db);

  if (!db) {
    console.log('Database not initialized, returning empty array');
    return [];
  }

  try {
    const result = db.exec(`
      SELECT 
        id, name, business_name, document_type, document_number, business_type,
        email, email_secondary, phone, phone_secondary,
        address_line1, address_line2, city, state, zip_code, florida_county,
        credit_limit, payment_terms, tax_exempt, tax_id, assigned_buyer,
        status, notes, created_at, updated_at
      FROM suppliers 
      ORDER BY created_at DESC
    `);

    console.log('Raw query result:', result);

    // Convertir el resultado a array de objetos
    const suppliers: Supplier[] = [];

    if (result && result.length > 0 && result[0].values) {
      const columns = result[0].columns;
      const values = result[0].values;

      values.forEach((row: initSqlJs.SqlValue[]) => {
        const supplierObj = rowToEntity<Record<string, unknown>>(columns, row);
        suppliers.push(processSupplierRow(supplierObj));
      });
    }

    console.log('Processed suppliers:', suppliers);
    console.log('Supplier count:', suppliers.length);
    return suppliers;

  } catch (error) {
    console.error('Error getting suppliers:', error);
    return [];
  }
};

// Función auxiliar para procesar una fila de proveedor
const processSupplierRow = (row: any): Supplier => {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    business_name: row.business_name ? String(row.business_name) : undefined,
    document_type: String(row.document_type || 'EIN') as 'SSN' | 'EIN' | 'ITIN' | 'PASSPORT',
    document_number: String(row.document_number || ''),
    business_type: row.business_type ? String(row.business_type) : undefined,
    email: String(row.email || ''),
    email_secondary: row.email_secondary ? String(row.email_secondary) : undefined,
    phone: String(row.phone || ''),
    phone_secondary: row.phone_secondary ? String(row.phone_secondary) : undefined,
    address_line1: String(row.address_line1 || ''),
    address_line2: row.address_line2 ? String(row.address_line2) : undefined,
    city: String(row.city || 'Miami'),
    state: String(row.state || 'FL'),
    zip_code: String(row.zip_code || ''),
    florida_county: String(row.florida_county || 'Miami-Dade'),
    credit_limit: Number(row.credit_limit || 0),
    payment_terms: Number(row.payment_terms || 30),
    tax_exempt: Boolean(Number(row.tax_exempt)),
    tax_id: row.tax_id ? String(row.tax_id) : undefined,
    assigned_buyer: row.assigned_buyer ? String(row.assigned_buyer) : undefined,
    status: String(row.status || 'active') as 'active' | 'inactive' | 'suspended',
    notes: row.notes ? String(row.notes) : undefined,
    created_at: String(row.created_at || new Date().toISOString()),
    updated_at: String(row.updated_at || new Date().toISOString())
  };
};

// Obtener proveedor por ID
export const getSupplierById = (id: number): Supplier | null => {
  if (!db) return null;

  try {
    const result = db.exec(`
      SELECT 
        id, name, business_name, document_type, document_number, business_type,
        email, email_secondary, phone, phone_secondary,
        address_line1, address_line2, city, state, zip_code, florida_county,
        credit_limit, payment_terms, tax_exempt, tax_id, assigned_buyer,
        status, notes, created_at, updated_at
      FROM suppliers 
      WHERE id = ${id}
    `);

    if (result && result.length > 0 && result[0].values && result[0].values.length > 0) {
      const columns = result[0].columns;
      const row = result[0].values[0];

      const supplierObj: any = {};
      columns.forEach((col: string, index: number) => {
        supplierObj[col] = row[index];
      });

      return processSupplierRow(supplierObj);
    }

    return null;

  } catch (error) {
    console.error('Error getting supplier by ID:', error);
    return null;
  }
};

// Actualizar proveedor
export const updateSupplier = (id: number, supplierData: Partial<Supplier>): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Obtener valores anteriores para auditoría
    const oldSupplier = getSupplierById(id);
    if (!oldSupplier) {
      return { success: false, message: 'Proveedor no encontrado' };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      UPDATE suppliers 
      SET name = ?, business_name = ?, document_type = ?, document_number = ?, business_type = ?,
          email = ?, email_secondary = ?, phone = ?, phone_secondary = ?,
          address_line1 = ?, address_line2 = ?, city = ?, state = ?, zip_code = ?, florida_county = ?,
          credit_limit = ?, payment_terms = ?, tax_exempt = ?, tax_id = ?, assigned_buyer = ?,
          status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const values = [
      supplierData.name || oldSupplier.name,
      supplierData.business_name || oldSupplier.business_name || null,
      supplierData.document_type || oldSupplier.document_type,
      supplierData.document_number || oldSupplier.document_number,
      supplierData.business_type || oldSupplier.business_type || null,
      supplierData.email || oldSupplier.email,
      supplierData.email_secondary || oldSupplier.email_secondary || null,
      supplierData.phone || oldSupplier.phone,
      supplierData.phone_secondary || oldSupplier.phone_secondary || null,
      supplierData.address_line1 || oldSupplier.address_line1,
      supplierData.address_line2 || oldSupplier.address_line2 || null,
      supplierData.city || oldSupplier.city,
      supplierData.state || oldSupplier.state,
      supplierData.zip_code || oldSupplier.zip_code,
      supplierData.florida_county || oldSupplier.florida_county,
      supplierData.credit_limit !== undefined ? supplierData.credit_limit : oldSupplier.credit_limit,
      supplierData.payment_terms !== undefined ? supplierData.payment_terms : oldSupplier.payment_terms,
      supplierData.tax_exempt !== undefined ? (supplierData.tax_exempt ? 1 : 0) : (oldSupplier.tax_exempt ? 1 : 0),
      supplierData.tax_id || oldSupplier.tax_id || null,
      supplierData.assigned_buyer || oldSupplier.assigned_buyer || null,
      supplierData.status || oldSupplier.status,
      supplierData.notes || oldSupplier.notes || null,
      id
    ];

    stmt.run(values);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se realizaron cambios' };
    }

    // Registrar en auditoría
    logAuditEvent('suppliers', id, 'UPDATE', oldSupplier, supplierData);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    console.log(`Supplier ${id} updated successfully`);
    return { success: true, message: `Proveedor "${supplierData.name || oldSupplier.name}" actualizado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error updating supplier:', error);
    return { success: false, message: `Error al actualizar el proveedor: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

// Verificar si un proveedor puede ser eliminado
export const canDeleteSupplier = (supplierId: number): { canDelete: boolean; reason?: string } => {
  if (!db) return { canDelete: false, reason: 'Database not initialized' };

  try {
    // Verificar si tiene facturas de compra
    const billCheck = db.exec(`
      SELECT COUNT(*) as count FROM bills WHERE supplier_id = ${supplierId}
    `);
    const billCount = billCheck[0]?.values[0]?.[0] as number || 0;

    if (billCount > 0) {
      return {
        canDelete: false,
        reason: `El proveedor tiene ${billCount} factura(s) de compra asociada(s). No se puede eliminar.`
      };
    }

    // Verificar si tiene pagos
    const paymentCheck = db.exec(`
      SELECT COUNT(*) as count FROM supplier_payments WHERE supplier_id = ${supplierId}
    `);
    const paymentCount = paymentCheck[0]?.values[0]?.[0] as number || 0;

    if (paymentCount > 0) {
      return {
        canDelete: false,
        reason: `El proveedor tiene ${paymentCount} pago(s) registrado(s). No se puede eliminar.`
      };
    }

    return { canDelete: true };

  } catch (error) {
    console.error('Error checking if supplier can be deleted:', error);
    return { canDelete: false, reason: 'Error al verificar las dependencias del proveedor' };
  }
};

// Eliminar proveedor
export const deleteSupplier = (id: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar si se puede eliminar
    const deleteCheck = canDeleteSupplier(id);
    if (!deleteCheck.canDelete) {
      return { success: false, message: deleteCheck.reason || 'No se puede eliminar el proveedor' };
    }

    // Obtener datos del proveedor para auditoría antes de eliminar
    const supplier = getSupplierById(id);
    if (!supplier) {
      return { success: false, message: 'Proveedor no encontrado' };
    }

    db.run('BEGIN TRANSACTION');

    // Eliminar proveedor
    const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?');
    stmt.run([id]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar el proveedor' };
    }

    // Registrar en auditoría
    logAuditEvent('suppliers', id, 'DELETE', supplier, null);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    console.log(`Supplier ${id} deleted successfully`);
    return { success: true, message: `Proveedor "${supplier.name}" eliminado correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error deleting supplier:', error);
    return { success: false, message: `Error al eliminar el proveedor: ${error instanceof Error ? error.message : 'Error desconocido'}` };
  }
};

// ==========================================
// FUNCIONES CRUD PARA FACTURAS DE COMPRA (BILLS)
// ==========================================

// Generar número de factura de compra automático
export const generateBillNumber = (): string => {
  if (!db) throw new Error('Database not initialized');

  try {
    const result = db.exec("SELECT COUNT(*) as count FROM bills");
    const count = (result[0]?.values[0]?.[0] as number || 0) + 1;
    const year = new Date().getFullYear();
    return `BILL-${year}-${count.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating bill number:', error);
    const timestamp = Date.now().toString().slice(-6);
    return `BILL-${new Date().getFullYear()}-${timestamp}`;
  }
};

// Obtener todas las facturas de compra con información del proveedor
export const getBills = (): Bill[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT 
        b.*,
        s.name as supplier_name,
        s.business_name as supplier_business_name,
        s.email as supplier_email
      FROM bills b
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      ORDER BY b.created_at DESC
    `);

    if (!result[0]) return [];

    const bills: Bill[] = [];
    const columns = result[0].columns;

    result[0].values.forEach((row: initSqlJs.SqlValue[]) => {
      const bill = rowToEntity<Bill & { supplier_name: string; supplier_business_name: string; supplier_email: string }>(columns, row);

      // Agregar información del proveedor
      bill.supplier = {
        name: bill.supplier_name,
        business_name: bill.supplier_business_name,
        email: bill.supplier_email
      } as Supplier;

      bills.push(bill);
    });

    return bills;
  } catch (error) {
    console.error('Error getting bills:', error);
    return [];
  }
};

// Obtener factura de compra por ID con líneas
export const getBillById = (id: number): Bill | null => {
  if (!db) return null;

  try {
    // Obtener factura principal
    const billResult = db.exec(`
      SELECT 
        b.*,
        s.name as supplier_name,
        s.business_name as supplier_business_name,
        s.email as supplier_email,
        s.phone as supplier_phone,
        s.address_line1 as supplier_address,
        s.city as supplier_city,
        s.state as supplier_state,
        s.zip_code as supplier_zip
      FROM bills b
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      WHERE b.id = ?
    `, [id]);

    if (!billResult[0] || billResult[0].values.length === 0) return null;

    const billRow = billResult[0].values[0];
    const columns = billResult[0].columns;

    const bill: any = {};
    columns.forEach((col, index) => {
      bill[col] = billRow[index];
    });

    // Agregar información del proveedor
    bill.supplier = {
      name: bill.supplier_name,
      business_name: bill.supplier_business_name,
      email: bill.supplier_email,
      phone: bill.supplier_phone,
      address_line1: bill.supplier_address,
      city: bill.supplier_city,
      state: bill.supplier_state,
      zip_code: bill.supplier_zip
    };

    // Obtener líneas de factura
    const itemsResult = db.exec(`
      SELECT 
        bl.*,
        p.name as product_name,
        p.sku as product_sku
      FROM bill_lines bl
      LEFT JOIN products p ON bl.product_id = p.id
      WHERE bl.bill_id = ?
      ORDER BY bl.id
    `, [id]);

    bill.items = [];
    if (itemsResult[0]) {
      const itemColumns = itemsResult[0].columns;
      itemsResult[0].values.forEach(itemRow => {
        const item: any = {};
        itemColumns.forEach((col, index) => {
          item[col] = itemRow[index];
        });

        if (item.product_id) {
          item.product = {
            name: item.product_name,
            sku: item.product_sku
          };
        }

        bill.items.push(item);
      });
    }

    return bill as Bill;
  } catch (error) {
    console.error('Error getting bill by ID:', error);
    return null;
  }
};

// Crear nueva factura de compra
export const createBill = (billData: Partial<Bill>, items: Partial<BillItem>[]): { success: boolean; message: string; billId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validaciones básicas
    if (!billData.supplier_id) {
      return { success: false, message: 'Supplier ID is required' };
    }

    if (!items || items.length === 0) {
      return { success: false, message: 'At least one item is required' };
    }

    // Generar número de factura si no se proporciona
    const billNumber = billData.bill_number || generateBillNumber();

    // Obtener condado del proveedor para cálculo de impuestos
    const supplier = getSupplierById(billData.supplier_id);
    const county = supplier?.florida_county || 'Miami-Dade';

    // Calcular totales usando tasa dinámica
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      subtotal += lineTotal;
      if (item.taxable) {
        taxAmount += lineTotal * getFloridaTaxRate(county); // Usar tasa dinámica por condado
      }
    });

    const total = subtotal + taxAmount;

    // Insertar factura principal
    const stmt = db.prepare(`
      INSERT INTO bills (
        bill_number, supplier_id, issue_date, due_date, 
        subtotal, tax_amount, total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const issueDate = billData.issue_date || new Date().toISOString().split('T')[0];
    const dueDate = billData.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    stmt.run([
      billNumber,
      billData.supplier_id,
      issueDate,
      dueDate,
      subtotal,
      taxAmount,
      total,
      billData.status || 'draft',
      billData.notes || ''
    ]);

    const billId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;

    // Insertar líneas de factura
    const itemStmt = db.prepare(`
      INSERT INTO bill_lines (
        bill_id, product_id, description, quantity, unit_price, line_total, taxable
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
      itemStmt.run([
        billId,
        item.product_id || null,
        item.description || '',
        item.quantity || 1,
        item.unit_price || 0,
        lineTotal,
        item.taxable ? 1 : 0
      ]);
    });

    // Registrar en auditoría
    logAuditEvent('bills', billId, 'INSERT', null, {
      bill_number: billNumber,
      supplier_id: billData.supplier_id,
      total_amount: total,
      status: billData.status || 'draft'
    });

    // GENERAR ASIENTO CONTABLE AUTOMÁTICO (DOBLE ENTRADA)
    if (billData.status === 'approved' || billData.status === 'paid') {
      const fullBill = getBillById(billId);
      if (fullBill) {
        const journalResult = generatePurchaseJournalEntry(fullBill);
        if (!journalResult.success) {
          console.warn('Warning: Could not generate journal entry for bill:', journalResult.message);
        } else {
          console.log('Journal entry created for bill:', journalResult.entryId);
        }
      }
    }

    return {
      success: true,
      message: `Factura de compra ${billNumber} creada correctamente`,
      billId
    };

  } catch (error) {
    console.error('Error creating bill:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error creating bill'
    };
  }
};

// Actualizar estadísticas para incluir proveedores
export const getStatsWithSuppliers = () => {
  if (!db) return { customers: 0, invoices: 0, revenue: 0, suppliers: 0, bills: 0, expenses: 0 };

  try {
    const customerResult = db.exec("SELECT COUNT(*) as count FROM customers");
    const invoiceResult = db.exec("SELECT COUNT(*) as count FROM invoices");
    const revenueResult = db.exec("SELECT SUM(total_amount) as total FROM invoices WHERE status = 'paid'");
    const supplierResult = db.exec("SELECT COUNT(*) as count FROM suppliers");
    const billResult = db.exec("SELECT COUNT(*) as count FROM bills");
    const expenseResult = db.exec("SELECT SUM(total_amount) as total FROM bills WHERE status = 'paid'");

    const customerCount = customerResult[0]?.values[0]?.[0] as number || 0;
    const invoiceCount = invoiceResult[0]?.values[0]?.[0] as number || 0;
    const revenue = revenueResult[0]?.values[0]?.[0] as number || 0;
    const supplierCount = supplierResult[0]?.values[0]?.[0] as number || 0;
    const billCount = billResult[0]?.values[0]?.[0] as number || 0;
    const expenses = expenseResult[0]?.values[0]?.[0] as number || 0;

    return {
      customers: customerCount,
      invoices: invoiceCount,
      revenue: revenue,
      suppliers: supplierCount,
      bills: billCount,
      expenses: expenses
    };

  } catch (error) {
    console.error('Error getting stats with suppliers:', error);
    return { customers: 0, invoices: 0, revenue: 0, suppliers: 0, bills: 0, expenses: 0 };
  }
};

// Actualizar factura de compra
export const updateBill = (id: number, billData: Partial<Bill>, items?: Partial<BillItem>[]): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Obtener factura actual para auditoría
    const currentBill = getBillById(id);
    if (!currentBill) {
      return { success: false, message: 'Factura de compra no encontrada' };
    }

    db.run('BEGIN TRANSACTION');

    // Actualizar factura principal
    const updateFields = [];
    const updateValues = [];

    if (billData.issue_date !== undefined) {
      updateFields.push('issue_date = ?');
      updateValues.push(billData.issue_date);
    }

    if (billData.due_date !== undefined) {
      updateFields.push('due_date = ?');
      updateValues.push(billData.due_date);
    }

    if (billData.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(billData.status);
    }

    if (billData.notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(billData.notes);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      const updateQuery = `UPDATE bills SET ${updateFields.join(', ')} WHERE id = ?`;
      db.exec(updateQuery, updateValues);
    }

    // Si se proporcionan items, actualizar líneas de factura
    if (items) {
      // Eliminar líneas existentes
      db.exec('DELETE FROM bill_lines WHERE bill_id = ?', [id]);

      // Obtener condado del proveedor para cálculo de impuestos
      const supplier = getSupplierById(currentBill.supplier_id);
      const county = supplier?.florida_county || 'Miami-Dade';

      // Insertar nuevas líneas y recalcular totales
      let subtotal = 0;
      let taxAmount = 0;

      const itemStmt = db.prepare(`
        INSERT INTO bill_lines (
          bill_id, product_id, description, quantity, unit_price, line_total, taxable
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      items.forEach(item => {
        const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
        subtotal += lineTotal;
        if (item.taxable) {
          taxAmount += lineTotal * getFloridaTaxRate(county); // Usar tasa dinámica por condado
        }

        itemStmt.run([
          id,
          item.product_id || null,
          item.description || '',
          item.quantity || 1,
          item.unit_price || 0,
          lineTotal,
          item.taxable ? 1 : 0
        ]);
      });

      itemStmt.free();

      // Actualizar totales
      const total = subtotal + taxAmount;
      db.exec(`
        UPDATE bills 
        SET subtotal = ?, tax_amount = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [subtotal, taxAmount, total, id]);
    }

    // Registrar en auditoría
    logAuditEvent('bills', id, 'UPDATE', currentBill, billData);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: 'Factura de compra actualizada correctamente' };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error updating bill:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar la factura de compra'
    };
  }
};

// Eliminar factura de compra
export const deleteBill = (id: number): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar si la factura existe
    const bill = getBillById(id);
    if (!bill) {
      return { success: false, message: 'Factura de compra no encontrada' };
    }

    // Verificar si la factura está pagada (no se puede eliminar)
    if (bill.status === 'paid') {
      return { success: false, message: 'No se pueden eliminar facturas de compra pagadas' };
    }

    // Verificar si tiene pagos asociados
    const paymentCheck = db.exec(`
      SELECT COUNT(*) as count FROM supplier_payments WHERE bill_id = ${id}
    `);
    const paymentCount = paymentCheck[0]?.values[0]?.[0] as number || 0;

    if (paymentCount > 0) {
      return {
        success: false,
        message: `La factura tiene ${paymentCount} pago(s) asociado(s). No se puede eliminar.`
      };
    }

    db.run('BEGIN TRANSACTION');

    // Eliminar líneas de factura primero (por foreign key)
    db.exec('DELETE FROM bill_lines WHERE bill_id = ?', [id]);

    // Eliminar factura
    const stmt = db.prepare('DELETE FROM bills WHERE id = ?');
    stmt.run([id]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar la factura de compra' };
    }

    // Registrar en auditoría
    logAuditEvent('bills', id, 'DELETE', bill, null);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    return { success: true, message: `Factura de compra ${bill.bill_number} eliminada correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error deleting bill:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al eliminar la factura de compra'
    };
  }
};

// ==========================================
// FUNCIONES CRUD PARA PLAN DE CUENTAS
// ==========================================

// Crear nueva cuenta contable
export const createChartOfAccount = (accountData: Partial<ChartOfAccount>): { success: boolean; message: string; accountId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    logger.info('ChartOfAccounts', 'create_start', `Creando cuenta: ${accountData.account_code} - ${accountData.account_name}`);

    // Validaciones básicas
    if (!accountData.account_code || !accountData.account_name || !accountData.account_type) {
      return { success: false, message: 'Código, nombre y tipo de cuenta son requeridos' };
    }

    // Verificar que el código no exista
    const existingAccount = db.exec(`SELECT account_code FROM chart_of_accounts WHERE account_code = ?`, [accountData.account_code]);
    if (existingAccount[0] && existingAccount[0].values.length > 0) {
      return { success: false, message: `El código de cuenta ${accountData.account_code} ya existe` };
    }

    // Verificar que la cuenta padre exista si se especifica
    if (accountData.parent_account) {
      const parentExists = db.exec(`SELECT account_code FROM chart_of_accounts WHERE account_code = ?`, [accountData.parent_account]);
      if (!parentExists[0] || parentExists[0].values.length === 0) {
        return { success: false, message: `La cuenta padre ${accountData.parent_account} no existe` };
      }
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO chart_of_accounts (
        account_code, account_name, account_type, normal_balance, parent_account,
        is_active, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      accountData.account_code || '',
      accountData.account_name || '',
      accountData.account_type || 'asset',
      accountData.normal_balance || 'debit',
      accountData.parent_account || null,
      accountData.is_active !== undefined ? (accountData.is_active ? 1 : 0) : 1,
      1, // TODO: Implementar sistema de usuarios
      1
    ]);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const insertId = insertResult[0]?.values[0]?.[0] as number || 0;

    stmt.free();

    // Registrar en auditoría
    logAuditEvent('chart_of_accounts', insertId, 'INSERT', null, accountData);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    logger.info('ChartOfAccounts', 'create_success', `Cuenta ${accountData.account_code} creada exitosamente`, {
      accountCode: accountData.account_code,
      accountId: insertId
    });

    return {
      success: true,
      message: `Cuenta ${accountData.account_code} - ${accountData.account_name} creada correctamente`,
      accountId: insertId
    };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('ChartOfAccounts', 'create_failed', `Error al crear cuenta: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      accountData: { code: accountData.account_code, name: accountData.account_name }
    }, error as Error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear la cuenta'
    };
  }
};

// Obtener cuenta por código
export const getChartOfAccountByCode = (accountCode: string): ChartOfAccount | null => {
  if (!db) return null;

  try {
    const result = db.exec(`
      SELECT 
        id, account_code, account_name, account_type, normal_balance, 
        parent_account, is_active, created_at, updated_at, created_by, updated_by
      FROM chart_of_accounts 
      WHERE account_code = ?
    `, [accountCode]);

    if (!result[0] || result[0].values.length === 0) return null;

    const columns = result[0].columns;
    const row = result[0].values[0];

    const account: any = {};
    columns.forEach((col, index) => {
      account[col] = row[index];
    });

    account.is_active = Boolean(account.is_active);

    return account as ChartOfAccount;

  } catch (error) {
    logger.error('ChartOfAccounts', 'get_by_code_failed', `Error al obtener cuenta ${accountCode}`, { accountCode }, error as Error);
    return null;
  }
};

// Actualizar cuenta contable
export const updateChartOfAccount = (accountCode: string, accountData: Partial<ChartOfAccount>): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Obtener cuenta actual para auditoría
    const currentAccount = getChartOfAccountByCode(accountCode);
    if (!currentAccount) {
      return { success: false, message: 'Cuenta no encontrada' };
    }

    logger.info('ChartOfAccounts', 'update_start', `Actualizando cuenta: ${accountCode}`);

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      UPDATE chart_of_accounts 
      SET account_name = ?, account_type = ?, normal_balance = ?, 
          parent_account = ?, is_active = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE account_code = ?
    `);

    stmt.run([
      accountData.account_name || currentAccount.account_name,
      accountData.account_type || currentAccount.account_type,
      accountData.normal_balance || currentAccount.normal_balance,
      accountData.parent_account || currentAccount.parent_account || null,
      accountData.is_active !== undefined ? (accountData.is_active ? 1 : 0) : (currentAccount.is_active ? 1 : 0),
      1, // TODO: Implementar sistema de usuarios
      accountCode
    ]);

    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se realizaron cambios' };
    }

    // Registrar en auditoría
    logAuditEvent('chart_of_accounts', currentAccount.id || 0, 'UPDATE', currentAccount, accountData);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    logger.info('ChartOfAccounts', 'update_success', `Cuenta ${accountCode} actualizada exitosamente`);
    return { success: true, message: `Cuenta ${accountCode} actualizada correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('ChartOfAccounts', 'update_failed', `Error al actualizar cuenta ${accountCode}`, { accountCode }, error as Error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar la cuenta'
    };
  }
};

// Eliminar cuenta contable (solo si no tiene movimientos)
export const deleteChartOfAccount = (accountCode: string): { success: boolean; message: string } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Verificar que la cuenta exista
    const account = getChartOfAccountByCode(accountCode);
    if (!account) {
      return { success: false, message: 'Cuenta no encontrada' };
    }

    logger.info('ChartOfAccounts', 'delete_start', `Eliminando cuenta: ${accountCode}`);

    // Verificar que no tenga cuentas hijas
    const childrenCheck = db.exec(`SELECT COUNT(*) as count FROM chart_of_accounts WHERE parent_account = ?`, [accountCode]);
    const childrenCount = childrenCheck[0]?.values[0]?.[0] as number || 0;

    if (childrenCount > 0) {
      return {
        success: false,
        message: `La cuenta tiene ${childrenCount} cuenta(s) hija(s). No se puede eliminar.`
      };
    }

    // Verificar que no tenga movimientos en journal_details
    const movementsCheck = db.exec(`SELECT COUNT(*) as count FROM journal_details WHERE account_code = ?`, [accountCode]);
    const movementsCount = movementsCheck[0]?.values[0]?.[0] as number || 0;

    if (movementsCount > 0) {
      return {
        success: false,
        message: `La cuenta tiene ${movementsCount} movimiento(s) contable(s). No se puede eliminar.`
      };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare('DELETE FROM chart_of_accounts WHERE account_code = ?');
    stmt.run([accountCode]);
    const changes = db.exec('SELECT changes() as changes')[0]?.values[0]?.[0] as number || 0;
    stmt.free();

    if (changes === 0) {
      db.run('ROLLBACK');
      return { success: false, message: 'No se pudo eliminar la cuenta' };
    }

    // Registrar en auditoría
    logAuditEvent('chart_of_accounts', account.id || 0, 'DELETE', account, null);

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    logger.info('ChartOfAccounts', 'delete_success', `Cuenta ${accountCode} eliminada exitosamente`);
    return { success: true, message: `Cuenta ${accountCode} eliminada correctamente` };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('ChartOfAccounts', 'delete_failed', `Error al eliminar cuenta ${accountCode}`, { accountCode }, error as Error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al eliminar la cuenta'
    };
  }
};

// Insertar plan de cuentas inicial
export const insertInitialChartOfAccounts = async (): Promise<{ success: boolean; message: string }> => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    logger.info('ChartOfAccounts', 'init_start', 'Insertando plan de cuentas inicial');

    // Verificar si ya existen cuentas
    const existingAccounts = db.exec("SELECT COUNT(*) as count FROM chart_of_accounts");
    const accountCount = existingAccounts[0]?.values[0]?.[0] as number || 0;

    if (accountCount > 0) {
      logger.info('ChartOfAccounts', 'init_skip', `Plan de cuentas ya existe: ${accountCount} cuentas`);
      return { success: true, message: 'Plan de cuentas ya existe' };
    }

    db.run('BEGIN TRANSACTION');

    const stmt = db.prepare(`
      INSERT INTO chart_of_accounts (
        account_code, account_name, account_type, normal_balance, parent_account,
        is_active, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Insertar cuentas iniciales (definidas en ChartOfAccounts.tsx)
    const initialAccounts = [
      // ACTIVOS
      { account_code: '1000', account_name: 'ACTIVOS', account_type: 'asset', normal_balance: 'debit', parent_account: null, is_active: true },
      { account_code: '1100', account_name: 'Activos Corrientes', account_type: 'asset', normal_balance: 'debit', parent_account: '1000', is_active: true },
      { account_code: '1110', account_name: 'Efectivo y Equivalentes', account_type: 'asset', normal_balance: 'debit', parent_account: '1100', is_active: true },
      { account_code: '1111', account_name: 'Caja Chica', account_type: 'asset', normal_balance: 'debit', parent_account: '1110', is_active: true },
      { account_code: '1112', account_name: 'Cuenta Corriente - Bank of America', account_type: 'asset', normal_balance: 'debit', parent_account: '1110', is_active: true },

      // PASIVOS
      { account_code: '2000', account_name: 'PASIVOS', account_type: 'liability', normal_balance: 'credit', parent_account: null, is_active: true },
      { account_code: '2100', account_name: 'Pasivos Corrientes', account_type: 'liability', normal_balance: 'credit', parent_account: '2000', is_active: true },
      { account_code: '2110', account_name: 'Cuentas por Pagar', account_type: 'liability', normal_balance: 'credit', parent_account: '2100', is_active: true },

      // PATRIMONIO
      { account_code: '3000', account_name: 'PATRIMONIO', account_type: 'equity', normal_balance: 'credit', parent_account: null, is_active: true },
      { account_code: '3100', account_name: 'Capital Social', account_type: 'equity', normal_balance: 'credit', parent_account: '3000', is_active: true },

      // INGRESOS
      { account_code: '4000', account_name: 'INGRESOS', account_type: 'revenue', normal_balance: 'credit', parent_account: null, is_active: true },
      { account_code: '4100', account_name: 'Ingresos Operacionales', account_type: 'revenue', normal_balance: 'credit', parent_account: '4000', is_active: true },
      { account_code: '4110', account_name: 'Ventas', account_type: 'revenue', normal_balance: 'credit', parent_account: '4100', is_active: true },

      // GASTOS
      { account_code: '5000', account_name: 'GASTOS', account_type: 'expense', normal_balance: 'debit', parent_account: null, is_active: true },
      { account_code: '5100', account_name: 'Costo de Ventas', account_type: 'expense', normal_balance: 'debit', parent_account: '5000', is_active: true },
      { account_code: '5200', account_name: 'Gastos Operacionales', account_type: 'expense', normal_balance: 'debit', parent_account: '5000', is_active: true }
    ];

    initialAccounts.forEach(account => {
      stmt.run([
        account.account_code,
        account.account_name,
        account.account_type,
        account.normal_balance,
        account.parent_account,
        account.is_active ? 1 : 0,
        1, // created_by
        1  // updated_by
      ]);
    });

    stmt.free();

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    logger.info('ChartOfAccounts', 'init_success', `Plan de cuentas inicial insertado: ${initialAccounts.length} cuentas`);
    return {
      success: true,
      message: `Plan de cuentas inicial creado con ${initialAccounts.length} cuentas`
    };

  } catch (error) {
    db?.run('ROLLBACK');
    logger.error('ChartOfAccounts', 'init_failed', 'Error al insertar plan de cuentas inicial', null, error as Error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear plan de cuentas inicial'
    };
  }
};

// Función auxiliar para auditoría (alias para compatibilidad)
const logAuditAction = logAuditEvent;

// Función para verificar integridad de la cadena de auditoría
export const verifyAuditIntegrity = async (): Promise<{ isValid: boolean; errors: string[]; totalRecords: number }> => {
  if (!db) {
    return { isValid: false, errors: ['Database not initialized'], totalRecords: 0 };
  }

  try {
    logger.info('AuditSystem', 'verify_integrity_start', 'Iniciando verificación de integridad de auditoría');

    const result = db.exec(`
      SELECT id, table_name, record_id, action, old_values, new_values, 
             user_id, timestamp, audit_hash
      FROM audit_log 
      ORDER BY id ASC
    `);

    if (!result[0] || result[0].values.length === 0) {
      return { isValid: true, errors: [], totalRecords: 0 };
    }

    const records = result[0].values;
    const errors: string[] = [];
    let previousHash = '0';

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const [id, tableName, recordId, action, oldValues, newValues, userId, timestamp, storedHash] = record;

      // Recrear el hash esperado
      const auditData = {
        tableName,
        recordId,
        action,
        oldValues,
        newValues,
        timestamp,
        userId
      };

      const expectedHash = await generateAuditHash({
        ...auditData,
        previousHash
      });

      if (expectedHash !== storedHash) {
        errors.push(`Record ID ${id}: Hash mismatch. Expected: ${expectedHash.substring(0, 8)}..., Found: ${storedHash?.toString().substring(0, 8)}...`);
      }

      previousHash = storedHash as string;
    }

    const isValid = errors.length === 0;

    logger.info('AuditSystem', 'verify_integrity_complete', 'Verificación de integridad completada', {
      totalRecords: records.length,
      isValid,
      errorsFound: errors.length
    });

    return {
      isValid,
      errors,
      totalRecords: records.length
    };

  } catch (error) {
    logger.error('AuditSystem', 'verify_integrity_failed', 'Error al verificar integridad de auditoría', null, error as Error);
    return {
      isValid: false,
      errors: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      totalRecords: 0
    };
  }
};

// Función para obtener estadísticas de auditoría
export const getAuditStats = (): { totalRecords: number; byTable: Record<string, number>; byAction: Record<string, number>; lastRecord: string } => {
  if (!db) {
    return { totalRecords: 0, byTable: {}, byAction: {}, lastRecord: 'N/A' };
  }

  try {
    // Total de registros
    const totalResult = db.exec('SELECT COUNT(*) as count FROM audit_log');
    const totalRecords = totalResult[0]?.values[0]?.[0] as number || 0;

    // Por tabla
    const tableResult = db.exec(`
      SELECT table_name, COUNT(*) as count 
      FROM audit_log 
      GROUP BY table_name 
      ORDER BY count DESC
    `);

    const byTable: Record<string, number> = {};
    if (tableResult[0]) {
      tableResult[0].values.forEach(row => {
        byTable[row[0] as string] = row[1] as number;
      });
    }

    // Por acción
    const actionResult = db.exec(`
      SELECT action, COUNT(*) as count 
      FROM audit_log 
      GROUP BY action 
      ORDER BY count DESC
    `);

    const byAction: Record<string, number> = {};
    if (actionResult[0]) {
      actionResult[0].values.forEach(row => {
        byAction[row[0] as string] = row[1] as number;
      });
    }

    // Último registro
    const lastResult = db.exec(`
      SELECT timestamp FROM audit_log 
      ORDER BY id DESC 
      LIMIT 1
    `);
    const lastRecord = lastResult[0]?.values[0]?.[0] as string || 'N/A';

    return {
      totalRecords,
      byTable,
      byAction,
      lastRecord
    };

  } catch (error) {
    logger.error('AuditSystem', 'get_stats_failed', 'Error al obtener estadísticas de auditoría', null, error as Error);
    return { totalRecords: 0, byTable: {}, byAction: {}, lastRecord: 'N/A' };
  }
};

// ==========================================
// FUNCIONES CRUD PARA PLAN DE CUENTAS
// ==========================================

// Obtener todas las cuentas del plan de cuentas
export const getChartOfAccounts = (): ChartOfAccount[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT 
        account_code, account_name, account_type, normal_balance, parent_account,
        is_active, created_at, updated_at, created_by, updated_by
      FROM chart_of_accounts 
      WHERE is_active = 1
      ORDER BY account_code
    `);

    if (!result[0]) return [];

    const accounts: ChartOfAccount[] = [];
    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const account: any = {};
      columns.forEach((col, index) => {
        account[col] = row[index];
      });

      // Calcular balance actual
      account.balance = getAccountBalance(account.account_code);

      accounts.push(account as ChartOfAccount);
    });

    return accounts;
  } catch (error) {
    console.error('Error getting chart of accounts:', error);
    return [];
  }
};

// Obtener balance de una cuenta específica
export const getAccountBalance = (accountCode: string): number => {
  if (!db) return 0;

  try {
    const result = db.exec(`
      SELECT 
        coa.normal_balance,
        COALESCE(SUM(jd.debit_amount), 0) as total_debits,
        COALESCE(SUM(jd.credit_amount), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_details jd ON coa.account_code = jd.account_code
      WHERE coa.account_code = ?
      GROUP BY coa.account_code, coa.normal_balance
    `, [accountCode]);

    if (!result[0] || result[0].values.length === 0) return 0;

    const [normalBalance, totalDebits, totalCredits] = result[0].values[0];
    const debits = Number(totalDebits) || 0;
    const credits = Number(totalCredits) || 0;

    // Calcular balance según el tipo normal de la cuenta
    if (normalBalance === 'debit') {
      return debits - credits;
    } else {
      return credits - debits;
    }
  } catch (error) {
    console.error('Error getting account balance:', error);
    return 0;
  }
};



// Función de diagnóstico para verificar el estado del sistema contable
export const diagnoseAccountingSystem = async (): Promise<{ success: boolean; message: string; details: any }> => {
  if (!db) {
    return {
      success: false,
      message: 'Database not initialized',
      details: { error: 'Database connection not available' }
    };
  }

  try {
    logger.info('AccountingDiagnosis', 'start_diagnosis', 'Iniciando diagnóstico del sistema contable');

    // Verificar que las tablas de contabilidad existan
    const tablesResult = db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('chart_of_accounts', 'journal_entries', 'journal_details')
      ORDER BY name
    `);

    const existingTables = tablesResult[0]?.values.map(row => row[0]) || [];
    logger.info('AccountingDiagnosis', 'tables_check', `Tablas encontradas: ${existingTables.join(', ')}`);

    // Verificar que el plan de cuentas tenga datos
    const accountsResult = db.exec('SELECT COUNT(*) as count FROM chart_of_accounts');
    const accountCount = accountsResult[0]?.values[0]?.[0] as number || 0;
    logger.info('AccountingDiagnosis', 'accounts_count', `Cuentas en el plan: ${accountCount}`);

    // Verificar estructura de algunas cuentas principales
    const mainAccountsResult = db.exec(`
      SELECT account_code, account_name, account_type 
      FROM chart_of_accounts 
      WHERE account_code IN ('1000', '2000', '3000', '4000', '5000')
      ORDER BY account_code
    `);

    const mainAccounts = mainAccountsResult[0]?.values || [];
    logger.info('AccountingDiagnosis', 'main_accounts', `Cuentas principales: ${mainAccounts.length}`);

    // Verificar integridad de asientos contables
    const journalResult = db.exec('SELECT COUNT(*) as count FROM journal_entries');
    const journalCount = journalResult[0]?.values[0]?.[0] as number || 0;
    logger.info('AccountingDiagnosis', 'journal_entries', `Asientos contables: ${journalCount}`);

    const diagnosis = {
      tablesExist: existingTables.length === 3,
      accountsCount: accountCount,
      journalCount,
      mainAccounts: mainAccounts.length,
      existingTables,
      mainAccountsData: mainAccounts
    };

    if (existingTables.length < 3) {
      logger.error('AccountingDiagnosis', 'missing_tables', 'Faltan tablas de contabilidad', {
        expected: ['chart_of_accounts', 'journal_entries', 'journal_details'],
        found: existingTables
      });
      return {
        success: false,
        message: 'Faltan tablas de contabilidad',
        details: diagnosis
      };
    }

    if (accountCount === 0) {
      logger.warn('AccountingDiagnosis', 'empty_chart', 'Plan de cuentas vacío, insertando datos iniciales');
      // Intentar insertar plan de cuentas inicial
      try {
        const insertResult = await insertInitialChartOfAccounts();
        if (!insertResult.success) {
          logger.error('AccountingDiagnosis', 'insert_failed', 'Error al insertar plan de cuentas inicial', { error: insertResult.message });
          return {
            success: false,
            message: 'Error al inicializar plan de cuentas',
            details: { ...diagnosis, insertError: insertResult.message }
          };
        }
      } catch (insertError) {
        logger.error('AccountingDiagnosis', 'insert_error', 'Excepción al insertar plan de cuentas', null, insertError as Error);
      }
    }

    logger.info('AccountingDiagnosis', 'diagnosis_complete', 'Diagnóstico completado exitosamente', diagnosis);
    return {
      success: true,
      message: 'Sistema contable funcionando correctamente',
      details: diagnosis
    };

  } catch (error) {
    logger.critical('AccountingDiagnosis', 'diagnosis_failed', 'Error crítico en diagnóstico', null, error as Error);
    return {
      success: false,
      message: `Error en diagnóstico: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : 'Unknown error' }
    };
  }
};

// Crear asiento contable automático
export const createJournalEntry = (
  entryData: Partial<JournalEntry>,
  details: Partial<JournalDetail>[]
): { success: boolean; message: string; entryId?: number } => {
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    // Validaciones críticas para integridad contable
    if (!details || details.length < 2) {
      return { success: false, message: 'Un asiento contable debe tener al menos 2 líneas' };
    }

    // Calcular totales
    let totalDebits = 0;
    let totalCredits = 0;

    details.forEach(detail => {
      totalDebits += Number(detail.debit_amount) || 0;
      totalCredits += Number(detail.credit_amount) || 0;
    });

    // VALIDACIÓN CRÍTICA: El asiento debe estar balanceado
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return {
        success: false,
        message: `Asiento desbalanceado: Débitos $${totalDebits.toFixed(2)} ≠ Créditos $${totalCredits.toFixed(2)}`
      };
    }

    db.run('BEGIN TRANSACTION');

    // Insertar asiento principal
    const stmt = db.prepare(`
      INSERT INTO journal_entries (
        entry_date, reference, description, total_debit, total_credit, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const entryDate = entryData.entry_date || new Date().toISOString().split('T')[0];

    stmt.run([
      entryDate,
      entryData.reference_number || entryData.reference || null,
      entryData.description || null,
      totalDebits,
      totalCredits,
      1 // TODO: Implementar sistema de usuarios
    ]);

    const entryId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
    stmt.free();

    // Insertar detalles del asiento
    const detailStmt = db.prepare(`
      INSERT INTO journal_details (
        journal_entry_id, account_code, debit_amount, credit_amount, description
      ) VALUES (?, ?, ?, ?, ?)
    `);

    details.forEach(detail => {
      // Validar que la cuenta exista
      if (!db) throw new Error('Database not initialized');

      const accountExists = db.exec(`SELECT account_code FROM chart_of_accounts WHERE account_code = ?`, [detail.account_code || '']);
      if (!accountExists[0] || accountExists[0].values.length === 0) {
        throw new Error(`La cuenta ${detail.account_code || 'undefined'} no existe en el plan de cuentas`);
      }

      detailStmt.run([
        entryId,
        detail.account_code || '',
        Number(detail.debit_amount) || 0,
        Number(detail.credit_amount) || 0,
        detail.description || ''
      ]);
    });

    detailStmt.free();

    // Registrar en auditoría
    logAuditEvent('journal_entries', entryId, 'INSERT', null, {
      entry_date: entryDate,
      reference_number: entryData.reference_number,
      total_debit: totalDebits,
      total_credit: totalCredits,
      details_count: details.length
    });

    db.run('COMMIT');

    // Auto-save
    setTimeout(() => saveDatabase(), 1000);

    return {
      success: true,
      message: `Asiento contable creado correctamente (ID: ${entryId})`,
      entryId
    };

  } catch (error) {
    db?.run('ROLLBACK');
    console.error('Error creating journal entry:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear el asiento contable'
    };
  }
};

// Obtener asientos contables con detalles
export const getJournalEntries = (limit: number = 50): JournalEntry[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT 
        id, entry_date, reference, description, total_debit, total_credit, 
        is_balanced, created_at, created_by, verified_by, verified_at
      FROM journal_entries 
      ORDER BY entry_date DESC, id DESC
      LIMIT ?
    `, [limit]);

    if (!result[0]) return [];

    const entries: JournalEntry[] = [];
    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const entry: any = {};
      columns.forEach((col, index) => {
        entry[col] = row[index];
      });

      // Obtener detalles del asiento
      entry.details = getJournalEntryDetails(entry.id);

      entries.push(entry as JournalEntry);
    });

    return entries;
  } catch (error) {
    console.error('Error getting journal entries:', error);
    return [];
  }
};

// Obtener detalles de un asiento específico
export const getJournalEntryDetails = (entryId: number): JournalDetail[] => {
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT 
        jd.id, jd.journal_entry_id, jd.account_code, jd.debit_amount, 
        jd.credit_amount, jd.description,
        coa.account_name, coa.account_type, coa.normal_balance
      FROM journal_details jd
      JOIN chart_of_accounts coa ON jd.account_code = coa.account_code
      WHERE jd.journal_entry_id = ?
      ORDER BY jd.id
    `, [entryId]);

    if (!result[0]) return [];

    const details: JournalDetail[] = [];
    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const detail: any = {};
      columns.forEach((col, index) => {
        detail[col] = row[index];
      });

      // Agregar información de la cuenta
      detail.account = {
        account_code: detail.account_code,
        account_name: detail.account_name,
        account_type: detail.account_type,
        normal_balance: detail.normal_balance
      };

      details.push(detail as JournalDetail);
    });

    return details;
  } catch (error) {
    console.error('Error getting journal entry details:', error);
    return [];
  }
};

// ==========================================
// FUNCIONES PARA GENERAR ASIENTOS AUTOMÁTICOS
// ==========================================

// Generar asiento automático para factura de venta
export const generateSalesJournalEntry = (invoice: Invoice): { success: boolean; message: string; entryId?: number } => {
  if (!invoice.customer) {
    return { success: false, message: 'Información del cliente requerida' };
  }

  const details: Partial<JournalDetail>[] = [
    // Débito: Cuentas por Cobrar
    {
      account_code: '1121',
      debit_amount: invoice.total_amount,
      credit_amount: 0,
      description: `Factura ${invoice.invoice_number} - ${invoice.customer.name}`
    },
    // Crédito: Ventas
    {
      account_code: '4110',
      debit_amount: 0,
      credit_amount: invoice.subtotal,
      description: `Venta - Factura ${invoice.invoice_number}`
    }
  ];

  // Si hay impuestos, agregar línea de impuestos por pagar
  if (invoice.tax_amount > 0) {
    details.push({
      account_code: '2121',
      debit_amount: 0,
      credit_amount: invoice.tax_amount,
      description: `Impuesto Florida - Factura ${invoice.invoice_number}`
    });
  }

  return createJournalEntry({
    entry_date: invoice.issue_date,
    reference_number: `INV-${invoice.invoice_number}`,
    description: `Venta a ${invoice.customer.name} - Factura ${invoice.invoice_number}`
  }, details);
};

// Generar asiento automático para factura de compra
export const generatePurchaseJournalEntry = (bill: Bill): { success: boolean; message: string; entryId?: number } => {
  if (!bill.supplier) {
    return { success: false, message: 'Información del proveedor requerida' };
  }

  const details: Partial<JournalDetail>[] = [
    // Débito: Gastos o Inventario (simplificado como gastos operativos)
    {
      account_code: '5200',
      debit_amount: bill.subtotal,
      credit_amount: 0,
      description: `Compra - Factura ${bill.bill_number}`
    },
    // Crédito: Cuentas por Pagar
    {
      account_code: '2111',
      debit_amount: 0,
      credit_amount: bill.total_amount,
      description: `Factura ${bill.bill_number} - ${bill.supplier.name}`
    }
  ];

  // Si hay impuestos, agregar línea de impuestos
  if (bill.tax_amount > 0) {
    details.push({
      account_code: '5510',
      debit_amount: bill.tax_amount,
      credit_amount: 0,
      description: `Impuesto Florida - Factura ${bill.bill_number}`
    });
  }

  return createJournalEntry({
    entry_date: bill.issue_date,
    reference_number: `BILL-${bill.bill_number}`,
    description: `Compra a ${bill.supplier.name} - Factura ${bill.bill_number}`
  }, details);
};

// Generar asiento automático para pago recibido
export const generatePaymentReceivedJournalEntry = (payment: Payment, customer: Customer): { success: boolean; message: string; entryId?: number } => {
  const details: Partial<JournalDetail>[] = [
    // Débito: Efectivo/Banco
    {
      account_code: payment.payment_method === 'cash' ? '1111' : '1112',
      debit_amount: payment.amount,
      credit_amount: 0,
      description: `Pago recibido ${payment.payment_number} - ${customer.name}`
    },
    // Crédito: Cuentas por Cobrar
    {
      account_code: '1121',
      debit_amount: 0,
      credit_amount: payment.amount,
      description: `Pago ${payment.payment_number} - ${customer.name}`
    }
  ];

  return createJournalEntry({
    entry_date: payment.payment_date,
    reference_number: `PAY-${payment.payment_number}`,
    description: `Pago recibido de ${customer.name} - ${payment.payment_number}`
  }, details);
};

// ==========================================
// FUNCIONES PARA REPORTES CONTABLES
// ==========================================

// Generar Balance General
export const generateBalanceSheet = (asOfDate?: string): { assets: ChartOfAccount[], liabilities: ChartOfAccount[], equity: ChartOfAccount[], totalAssets: number, totalLiabilitiesEquity: number, isBalanced: boolean } => {
  if (!db) return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesEquity: 0, isBalanced: false };

  try {
    const dateFilter = asOfDate ? `AND je.entry_date <= '${asOfDate}'` : '';

    const result = db.exec(`
      SELECT 
        coa.account_code, coa.account_name, coa.account_type, coa.normal_balance,
        COALESCE(SUM(jd.debit_amount), 0) as total_debits,
        COALESCE(SUM(jd.credit_amount), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_details jd ON coa.account_code = jd.account_code
      LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE coa.account_type IN ('asset', 'liability', 'equity') 
        AND coa.is_active = 1 
        ${dateFilter}
      GROUP BY coa.account_code, coa.account_name, coa.account_type, coa.normal_balance
      ORDER BY coa.account_code
    `);

    if (!result[0]) return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesEquity: 0, isBalanced: false };

    const assets: ChartOfAccount[] = [];
    const liabilities: ChartOfAccount[] = [];
    const equity: ChartOfAccount[] = [];
    let totalAssets = 0;
    let totalLiabilitiesEquity = 0;

    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const account: any = {};
      columns.forEach((col, index) => {
        account[col] = row[index];
      });

      const debits = Number(account.total_debits) || 0;
      const credits = Number(account.total_credits) || 0;

      // Calcular balance según tipo normal
      if (account.normal_balance === 'debit') {
        account.balance = debits - credits;
      } else {
        account.balance = credits - debits;
      }

      // Clasificar por tipo de cuenta
      if (account.account_type === 'asset') {
        assets.push(account);
        totalAssets += account.balance;
      } else if (account.account_type === 'liability') {
        liabilities.push(account);
        totalLiabilitiesEquity += account.balance;
      } else if (account.account_type === 'equity') {
        equity.push(account);
        totalLiabilitiesEquity += account.balance;
      }
    });

    const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilitiesEquity,
      isBalanced
    };

  } catch (error) {
    console.error('Error generating balance sheet:', error);
    return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilitiesEquity: 0, isBalanced: false };
  }
};

// Generar Estado de Resultados
export const generateIncomeStatement = (fromDate: string, toDate: string): { revenue: ChartOfAccount[], expenses: ChartOfAccount[], totalRevenue: number, totalExpenses: number, netIncome: number } => {
  if (!db) return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 };

  try {
    const result = db.exec(`
      SELECT 
        coa.account_code, coa.account_name, coa.account_type, coa.normal_balance,
        COALESCE(SUM(jd.debit_amount), 0) as total_debits,
        COALESCE(SUM(jd.credit_amount), 0) as total_credits
      FROM chart_of_accounts coa
      LEFT JOIN journal_details jd ON coa.account_code = jd.account_code
      LEFT JOIN journal_entries je ON jd.journal_entry_id = je.id
      WHERE coa.account_type IN ('revenue', 'expense') 
        AND coa.is_active = 1 
        AND je.entry_date BETWEEN ? AND ?
      GROUP BY coa.account_code, coa.account_name, coa.account_type, coa.normal_balance
      ORDER BY coa.account_code
    `, [fromDate, toDate]);

    if (!result[0]) return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 };

    const revenue: ChartOfAccount[] = [];
    const expenses: ChartOfAccount[] = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const account: any = {};
      columns.forEach((col, index) => {
        account[col] = row[index];
      });

      const debits = Number(account.total_debits) || 0;
      const credits = Number(account.total_credits) || 0;

      // Calcular balance según tipo normal
      if (account.normal_balance === 'debit') {
        account.balance = debits - credits;
      } else {
        account.balance = credits - debits;
      }

      // Clasificar por tipo de cuenta
      if (account.account_type === 'revenue') {
        revenue.push(account);
        totalRevenue += account.balance;
      } else if (account.account_type === 'expense') {
        expenses.push(account);
        totalExpenses += account.balance;
      }
    });

    const netIncome = totalRevenue - totalExpenses;

    return {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netIncome
    };

  } catch (error) {
    console.error('Error generating income statement:', error);
    return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netIncome: 0 };
  }
};

// ==========================================
// GESTIÓN DE DATOS DE LA EMPRESA
// ==========================================

export interface CompanyData {
  id: number;
  company_name: string;
  legal_name: string;
  tax_id: string; // EIN o Tax ID
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website?: string;
  logo_path?: string;
  fiscal_year_start: string; // MM-DD format
  currency: string;
  language: string;
  timezone: string;
  // Configuraciones financieras
  sales_commission_rate: number;
  sales_commission_percentage: number;
  discount_amount: number;
  discount_percentage: number;
  shipping_rate: number;
  shipping_percentage: number;
  reposition_policy_days: number;
  late_fee_amount: number;
  late_fee_percentage: number;
  annual_interest_rate: number;
  grace_period_days: number;
  documentation_cost: number;
  other_costs: number;
  chart_of_accounts_name: string;
  date_format: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export function getCompanyData(): CompanyData | null {
  try {
    logger.info('CompanyData', 'get_start', 'Obteniendo datos de la empresa');

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const result = db.exec(`
      SELECT * FROM company_data WHERE is_active = 1 LIMIT 1
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      logger.warn('CompanyData', 'not_found', 'No se encontraron datos de empresa');
      return null;
    }

    const row = result[0].values[0];
    const company: CompanyData = {
      id: row[0] as number,
      company_name: row[1] as string,
      legal_name: row[2] as string,
      tax_id: row[3] as string,
      address: row[4] as string,
      city: row[5] as string,
      state: row[6] as string,
      zip_code: row[7] as string,
      phone: row[8] as string,
      email: row[9] as string,
      website: row[10] as string || '',
      logo_path: row[11] as string || '',
      fiscal_year_start: row[12] as string,
      currency: row[13] as string,
      language: row[14] as string,
      timezone: row[15] as string,
      sales_commission_rate: Number(row[16]) || 0,
      sales_commission_percentage: Number(row[17]) || 0,
      discount_amount: Number(row[18]) || 50,
      discount_percentage: Number(row[19]) || 0,
      shipping_rate: Number(row[20]) || 0,
      shipping_percentage: Number(row[21]) || 0,
      reposition_policy_days: Number(row[22]) || 32,
      late_fee_amount: Number(row[23]) || 0,
      late_fee_percentage: Number(row[24]) || 0,
      annual_interest_rate: Number(row[25]) || 0,
      grace_period_days: Number(row[26]) || 0,
      documentation_cost: Number(row[27]) || 0,
      other_costs: Number(row[28]) || 0,
      chart_of_accounts_name: row[29] as string || 'Plan de Cuenta Ejemplo',
      date_format: row[30] as string || 'MM/DD/AAAA',
      created_at: row[31] as string,
      updated_at: row[32] as string,
      is_active: Boolean(row[33])
    };

    logger.info('CompanyData', 'get_success', 'Datos de empresa obtenidos', { company_name: company.company_name });
    return company;

  } catch (error) {
    logger.error('CompanyData', 'get_failed', 'Error al obtener datos de empresa', null, error as Error);
    throw error;
  }
}

export function updateCompanyData(companyData: Partial<CompanyData>): { success: boolean; message: string; warnings?: string[] } {
  try {
    logger.info('CompanyData', 'update_start', 'Actualizando datos de empresa', companyData);

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Verificar si hay datos contables asociados
    const warnings: string[] = [];
    const accountingDataCheck = checkAccountingDataAssociation();

    if (accountingDataCheck.hasData) {
      warnings.push('⚠️ ADVERTENCIA: Esta empresa tiene datos contables asociados');
      warnings.push(`📊 ${accountingDataCheck.invoices} facturas, ${accountingDataCheck.customers} clientes, ${accountingDataCheck.suppliers} proveedores`);

      // Si se está cambiando el nombre de la empresa y hay datos contables
      if (companyData.company_name || companyData.legal_name) {
        warnings.push('🔄 Cambiar el nombre puede afectar reportes y documentos existentes');
        warnings.push('📋 Se recomienda crear un respaldo antes de continuar');
      }
    }

    // Obtener datos actuales
    const currentData = getCompanyData();
    if (!currentData) {
      throw new Error('No se encontraron datos de empresa para actualizar');
    }

    // Preparar datos para actualización
    const updateData = {
      ...currentData,
      ...companyData,
      updated_at: new Date().toISOString()
    };

    // Ejecutar actualización
    const stmt = db.prepare(`
      UPDATE company_data SET
        company_name = ?,
        legal_name = ?,
        tax_id = ?,
        address = ?,
        city = ?,
        state = ?,
        zip_code = ?,
        phone = ?,
        email = ?,
        website = ?,
        logo_path = ?,
        fiscal_year_start = ?,
        currency = ?,
        language = ?,
        timezone = ?,
        sales_commission_rate = ?,
        sales_commission_percentage = ?,
        discount_amount = ?,
        discount_percentage = ?,
        shipping_rate = ?,
        shipping_percentage = ?,
        reposition_policy_days = ?,
        late_fee_amount = ?,
        late_fee_percentage = ?,
        annual_interest_rate = ?,
        grace_period_days = ?,
        documentation_cost = ?,
        other_costs = ?,
        chart_of_accounts_name = ?,
        date_format = ?,
        updated_at = ?
      WHERE id = ? AND is_active = 1
    `);

    stmt.run([
      updateData.company_name,
      updateData.legal_name,
      updateData.tax_id,
      updateData.address,
      updateData.city,
      updateData.state,
      updateData.zip_code,
      updateData.phone,
      updateData.email,
      updateData.website || null,
      updateData.logo_path || null,
      updateData.fiscal_year_start,
      updateData.currency,
      updateData.language,
      updateData.timezone,
      updateData.sales_commission_rate || 0,
      updateData.sales_commission_percentage || 0,
      updateData.discount_amount || 50,
      updateData.discount_percentage || 0,
      updateData.shipping_rate || 0,
      updateData.shipping_percentage || 0,
      updateData.reposition_policy_days || 32,
      updateData.late_fee_amount || 0,
      updateData.late_fee_percentage || 0,
      updateData.annual_interest_rate || 0,
      updateData.grace_period_days || 0,
      updateData.documentation_cost || 0,
      updateData.other_costs || 0,
      updateData.chart_of_accounts_name || 'Plan de Cuenta Ejemplo',
      updateData.date_format || 'MM/DD/AAAA',
      updateData.updated_at,
      currentData.id
    ]);

    // Registrar en auditoría
    const auditData = {
      old_name: currentData.company_name,
      new_name: updateData.company_name,
      changes: Object.keys(companyData),
      has_accounting_data: accountingDataCheck.hasData
    };

    logAuditEvent('company_data', currentData.id, 'UPDATE', JSON.stringify(currentData), JSON.stringify(updateData));

    logger.info('CompanyData', 'update_success', 'Datos de empresa actualizados', {
      company_id: currentData.id,
      changes: Object.keys(companyData),
      warnings_count: warnings.length
    });

    return {
      success: true,
      message: 'Datos de la empresa actualizados correctamente',
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    logger.error('CompanyData', 'update_failed', 'Error al actualizar datos de empresa', null, error as Error);
    return {
      success: false,
      message: `Error al actualizar datos de empresa: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

export function checkAccountingDataAssociation(): { hasData: boolean; customers: number; suppliers: number; invoices: number; bills: number } {
  try {
    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Contar registros en tablas principales
    const customersResult = db.exec('SELECT COUNT(*) as count FROM customers WHERE is_active = 1');
    const suppliersResult = db.exec('SELECT COUNT(*) as count FROM suppliers WHERE is_active = 1');
    const invoicesResult = db.exec('SELECT COUNT(*) as count FROM invoices');
    const billsResult = db.exec('SELECT COUNT(*) as count FROM bills');

    const customers = customersResult[0]?.values[0]?.[0] as number || 0;
    const suppliers = suppliersResult[0]?.values[0]?.[0] as number || 0;
    const invoices = invoicesResult[0]?.values[0]?.[0] as number || 0;
    const bills = billsResult[0]?.values[0]?.[0] as number || 0;

    const hasData = customers > 0 || suppliers > 0 || invoices > 0 || bills > 0;

    return { hasData, customers, suppliers, invoices, bills };

  } catch (error) {
    logger.error('CompanyData', 'check_association_failed', 'Error al verificar asociaciones contables', null, error as Error);
    return { hasData: false, customers: 0, suppliers: 0, invoices: 0, bills: 0 };
  }
}

export function initializeCompanyData(): void {
  try {
    logger.info('CompanyData', 'init_start', 'Inicializando datos de empresa por defecto');

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Verificar si ya existen datos
    const existing = getCompanyData();
    if (existing) {
      logger.info('CompanyData', 'init_skip', 'Datos de empresa ya existen');
      return;
    }

    // Crear datos por defecto
    const defaultCompany: Omit<CompanyData, 'id'> = {
      company_name: 'Mi Empresa',
      legal_name: 'Mi Empresa LLC',
      tax_id: '00-0000000',
      address: '123 Main Street',
      city: 'Miami',
      state: 'FL',
      zip_code: '33101',
      phone: '+1 (305) 000-0000',
      email: 'info@miempresa.com',
      website: 'www.miempresa.com',
      logo_path: '',
      fiscal_year_start: '01-01', // Enero 1
      currency: 'USD',
      language: 'es',
      timezone: 'America/New_York',
      // Configuraciones financieras por defecto
      sales_commission_rate: 0,
      sales_commission_percentage: 0,
      discount_amount: 50,
      discount_percentage: 0,
      shipping_rate: 0,
      shipping_percentage: 0,
      reposition_policy_days: 32,
      late_fee_amount: 0,
      late_fee_percentage: 0,
      annual_interest_rate: 0,
      grace_period_days: 0,
      documentation_cost: 0,
      other_costs: 0,
      chart_of_accounts_name: 'Plan de Cuenta Ejemplo',
      date_format: 'MM/DD/AAAA',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    };

    const stmt = db.prepare(`
      INSERT INTO company_data (
        company_name, legal_name, tax_id, address, city, state, zip_code,
        phone, email, website, logo_path, fiscal_year_start, currency,
        language, timezone, sales_commission_rate, sales_commission_percentage,
        discount_amount, discount_percentage, shipping_rate, shipping_percentage,
        reposition_policy_days, late_fee_amount, late_fee_percentage,
        annual_interest_rate, grace_period_days, documentation_cost,
        other_costs, chart_of_accounts_name, date_format,
        created_at, updated_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      defaultCompany.company_name,
      defaultCompany.legal_name,
      defaultCompany.tax_id,
      defaultCompany.address,
      defaultCompany.city,
      defaultCompany.state,
      defaultCompany.zip_code,
      defaultCompany.phone,
      defaultCompany.email,
      defaultCompany.website || null,
      defaultCompany.logo_path || null,
      defaultCompany.fiscal_year_start,
      defaultCompany.currency,
      defaultCompany.language,
      defaultCompany.timezone,
      defaultCompany.sales_commission_rate,
      defaultCompany.sales_commission_percentage,
      defaultCompany.discount_amount,
      defaultCompany.discount_percentage,
      defaultCompany.shipping_rate,
      defaultCompany.shipping_percentage,
      defaultCompany.reposition_policy_days,
      defaultCompany.late_fee_amount,
      defaultCompany.late_fee_percentage,
      defaultCompany.annual_interest_rate,
      defaultCompany.grace_period_days,
      defaultCompany.documentation_cost,
      defaultCompany.other_costs,
      defaultCompany.chart_of_accounts_name,
      defaultCompany.date_format,
      defaultCompany.created_at,
      defaultCompany.updated_at,
      defaultCompany.is_active ? 1 : 0
    ]);

    logger.info('CompanyData', 'init_success', 'Datos de empresa inicializados por defecto');

  } catch (error) {
    logger.error('CompanyData', 'init_failed', 'Error al inicializar datos de empresa', null, error as Error);
    throw error;
  }
}
// ==========================================
// GESTIÓN DE CATEGORÍAS DE PRODUCTOS
// ==========================================

export function getProductCategories(): ProductCategory[] {
  try {
    logger.info('ProductCategories', 'get_start', 'Obteniendo categorías de productos');

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const result = db.exec(`
      SELECT 
        c.*,
        p.name as parent_name
      FROM product_categories c
      LEFT JOIN product_categories p ON c.parent_id = p.id
      WHERE c.active = 1
      ORDER BY c.name
    `);

    if (result.length === 0) {
      logger.info('ProductCategories', 'get_empty', 'No se encontraron categorías');
      return [];
    }

    const categories: ProductCategory[] = [];
    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const category: any = {};

      columns.forEach((col, index) => {
        category[col] = row[index];
      });

      categories.push(category as ProductCategory);
    });

    logger.info('ProductCategories', 'get_success', 'Categorías obtenidas', { count: categories.length });
    return categories;

  } catch (error) {
    logger.error('ProductCategories', 'get_failed', 'Error al obtener categorías', null, error as Error);
    return [];
  }
}

export function createProductCategory(categoryData: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>): { success: boolean; message: string; id?: number } {
  try {
    logger.info('ProductCategories', 'create_start', 'Creando categoría de producto', categoryData);

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Validar datos requeridos
    if (!categoryData.name?.trim()) {
      return { success: false, message: 'El nombre de la categoría es requerido' };
    }

    // Verificar que no exista una categoría con el mismo nombre
    const existingResult = db.exec(`
      SELECT id FROM product_categories 
      WHERE LOWER(name) = LOWER(?) AND active = 1
    `, [categoryData.name.trim()]);

    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
      return { success: false, message: 'Ya existe una categoría con ese nombre' };
    }

    const stmt = db.prepare(`
      INSERT INTO product_categories (
        name, description, parent_id, tax_rate, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    stmt.run([
      categoryData.name.trim(),
      categoryData.description || null,
      categoryData.parent_id || null,
      categoryData.tax_rate || 0,
      categoryData.active ? 1 : 0,
      now,
      now
    ]);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const categoryId = insertResult[0]?.values[0]?.[0] as number || 0;

    stmt.free();

    // Registrar en auditoría
    logAuditEvent('product_categories', categoryId, 'INSERT', null, JSON.stringify(categoryData));

    logger.info('ProductCategories', 'create_success', 'Categoría creada', { id: categoryId, name: categoryData.name });

    return {
      success: true,
      message: `Categoría "${categoryData.name}" creada correctamente`,
      id: categoryId
    };

  } catch (error) {
    logger.error('ProductCategories', 'create_failed', 'Error al crear categoría', categoryData, error as Error);
    return {
      success: false,
      message: `Error al crear categoría: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

export function updateProductCategory(id: number, categoryData: Partial<ProductCategory>): { success: boolean; message: string } {
  try {
    logger.info('ProductCategories', 'update_start', 'Actualizando categoría', { id, ...categoryData });

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Obtener datos actuales para auditoría
    const currentResult = db.exec('SELECT * FROM product_categories WHERE id = ?', [id]);
    if (currentResult.length === 0 || currentResult[0].values.length === 0) {
      return { success: false, message: 'Categoría no encontrada' };
    }

    const stmt = db.prepare(`
      UPDATE product_categories SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        parent_id = COALESCE(?, parent_id),
        tax_rate = COALESCE(?, tax_rate),
        active = COALESCE(?, active),
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run([
      categoryData.name || null,
      categoryData.description || null,
      categoryData.parent_id || null,
      categoryData.tax_rate || null,
      categoryData.active !== undefined ? (categoryData.active ? 1 : 0) : null,
      new Date().toISOString(),
      id
    ]);

    // Registrar en auditoría
    logAuditEvent('product_categories', id, 'UPDATE', JSON.stringify(currentResult[0].values[0]), JSON.stringify(categoryData));

    logger.info('ProductCategories', 'update_success', 'Categoría actualizada', { id });

    return {
      success: true,
      message: 'Categoría actualizada correctamente'
    };

  } catch (error) {
    logger.error('ProductCategories', 'update_failed', 'Error al actualizar categoría', { id, ...categoryData }, error as Error);
    return {
      success: false,
      message: `Error al actualizar categoría: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

export function deleteProductCategory(id: number): { success: boolean; message: string } {
  try {
    logger.info('ProductCategories', 'delete_start', 'Eliminando categoría', { id });

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Verificar si hay productos asociados
    const productsResult = db.exec('SELECT COUNT(*) as count FROM products WHERE category_id = ? AND active = 1', [id]);
    const productCount = productsResult[0]?.values[0]?.[0] as number || 0;

    if (productCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${productCount} producto(s) asociado(s)`
      };
    }

    // Verificar si hay subcategorías
    const subcategoriesResult = db.exec('SELECT COUNT(*) as count FROM product_categories WHERE parent_id = ? AND active = 1', [id]);
    const subcategoryCount = subcategoriesResult[0]?.values[0]?.[0] as number || 0;

    if (subcategoryCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${subcategoryCount} subcategoría(s)`
      };
    }

    // Obtener datos actuales para auditoría
    const currentResult = db.exec('SELECT * FROM product_categories WHERE id = ?', [id]);

    // Marcar como inactiva en lugar de eliminar físicamente
    const stmt = db.prepare('UPDATE product_categories SET active = 0, updated_at = ? WHERE id = ?');
    stmt.run([new Date().toISOString(), id]);

    // Registrar en auditoría
    logAuditEvent('product_categories', id, 'DELETE', JSON.stringify(currentResult[0]?.values[0]), null);

    logger.info('ProductCategories', 'delete_success', 'Categoría eliminada', { id });

    return {
      success: true,
      message: 'Categoría eliminada correctamente'
    };

  } catch (error) {
    logger.error('ProductCategories', 'delete_failed', 'Error al eliminar categoría', { id }, error as Error);
    return {
      success: false,
      message: `Error al eliminar categoría: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

// ==========================================
// GESTIÓN DE PRODUCTOS EXPANDIDA
// ==========================================

export function getProducts(): Product[] {
  try {
    logger.info('Products', 'get_start', 'Obteniendo productos');

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const result = db.exec(`
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.active = 1
      ORDER BY p.name
    `);

    if (result.length === 0) {
      logger.info('Products', 'get_empty', 'No se encontraron productos');
      return [];
    }

    const products: Product[] = [];
    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const product: any = {};

      columns.forEach((col, index) => {
        if (col === 'category_name' && row[index]) {
          product.category = { name: row[index] as string } as ProductCategory;
        } else if (col === 'supplier_name' && row[index]) {
          product.supplier = { name: row[index] as string } as Supplier;
        } else {
          product[col] = row[index];
        }
      });

      products.push(product as Product);
    });

    logger.info('Products', 'get_success', 'Productos obtenidos', { count: products.length });
    return products;

  } catch (error) {
    logger.error('Products', 'get_failed', 'Error al obtener productos', null, error as Error);
    return [];
  }
}

export function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): { success: boolean; message: string; id?: number } {
  try {
    logger.info('Products', 'create_start', 'Creando producto', productData);

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Validar datos requeridos
    if (!productData.sku?.trim()) {
      return { success: false, message: 'El SKU es requerido' };
    }

    if (!productData.name?.trim()) {
      return { success: false, message: 'El nombre del producto es requerido' };
    }

    if (productData.price < 0) {
      return { success: false, message: 'El precio no puede ser negativo' };
    }

    // Verificar que no exista un producto con el mismo SKU
    const existingResult = db.exec(`
      SELECT id FROM products 
      WHERE LOWER(sku) = LOWER(?) AND active = 1
    `, [productData.sku.trim()]);

    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
      return { success: false, message: 'Ya existe un producto con ese SKU' };
    }

    const stmt = db.prepare(`
      INSERT INTO products (
        sku, name, description, price, cost, category_id, unit_of_measure,
        taxable, tax_rate, stock_quantity, min_stock_level, max_stock_level,
        reorder_point, supplier_id, barcode, image_path, weight, dimensions,
        is_service, service_duration, warranty_period, notes, active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    stmt.run([
      productData.sku.trim(),
      productData.name.trim(),
      productData.description || null,
      productData.price,
      productData.cost || 0,
      productData.category_id || null,
      productData.unit_of_measure || 'unidad',
      productData.taxable ? 1 : 0,
      productData.tax_rate || null,
      productData.stock_quantity || 0,
      productData.min_stock_level || 0,
      productData.max_stock_level || 100,
      productData.reorder_point || 10,
      productData.supplier_id || null,
      productData.barcode || null,
      productData.image_path || null,
      productData.weight || null,
      productData.dimensions || null,
      productData.is_service ? 1 : 0,
      productData.service_duration || null,
      productData.warranty_period || null,
      productData.notes || null,
      productData.active ? 1 : 0,
      now,
      now
    ]);

    const insertResult = db.exec("SELECT last_insert_rowid() as id");
    const productId = insertResult[0]?.values[0]?.[0] as number || 0;

    stmt.free();

    // Registrar en auditoría
    logAuditEvent('products', productId, 'INSERT', null, JSON.stringify(productData));

    logger.info('Products', 'create_success', 'Producto creado', { id: productId, sku: productData.sku });

    return {
      success: true,
      message: `Producto "${productData.name}" creado correctamente`,
      id: productId
    };

  } catch (error) {
    logger.error('Products', 'create_failed', 'Error al crear producto', productData, error as Error);
    return {
      success: false,
      message: `Error al crear producto: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

export function updateProduct(id: number, productData: Partial<Product>): { success: boolean; message: string } {
  try {
    logger.info('Products', 'update_start', 'Actualizando producto', { id, ...productData });

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Obtener datos actuales para auditoría
    const currentResult = db.exec('SELECT * FROM products WHERE id = ?', [id]);
    if (currentResult.length === 0 || currentResult[0].values.length === 0) {
      return { success: false, message: 'Producto no encontrado' };
    }

    // Validar SKU único si se está actualizando
    if (productData.sku) {
      const existingResult = db.exec(`
        SELECT id FROM products 
        WHERE LOWER(sku) = LOWER(?) AND id != ? AND active = 1
      `, [productData.sku.trim(), id]);

      if (existingResult.length > 0 && existingResult[0].values.length > 0) {
        return { success: false, message: 'Ya existe otro producto con ese SKU' };
      }
    }

    const stmt = db.prepare(`
      UPDATE products SET
        sku = COALESCE(?, sku),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        cost = COALESCE(?, cost),
        category_id = COALESCE(?, category_id),
        unit_of_measure = COALESCE(?, unit_of_measure),
        taxable = COALESCE(?, taxable),
        tax_rate = COALESCE(?, tax_rate),
        stock_quantity = COALESCE(?, stock_quantity),
        min_stock_level = COALESCE(?, min_stock_level),
        max_stock_level = COALESCE(?, max_stock_level),
        reorder_point = COALESCE(?, reorder_point),
        supplier_id = COALESCE(?, supplier_id),
        barcode = COALESCE(?, barcode),
        image_path = COALESCE(?, image_path),
        weight = COALESCE(?, weight),
        dimensions = COALESCE(?, dimensions),
        is_service = COALESCE(?, is_service),
        service_duration = COALESCE(?, service_duration),
        warranty_period = COALESCE(?, warranty_period),
        notes = COALESCE(?, notes),
        active = COALESCE(?, active),
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run([
      productData.sku || null,
      productData.name || null,
      productData.description || null,
      productData.price || null,
      productData.cost || null,
      productData.category_id || null,
      productData.unit_of_measure || null,
      productData.taxable !== undefined ? (productData.taxable ? 1 : 0) : null,
      productData.tax_rate || null,
      productData.stock_quantity || null,
      productData.min_stock_level || null,
      productData.max_stock_level || null,
      productData.reorder_point || null,
      productData.supplier_id || null,
      productData.barcode || null,
      productData.image_path || null,
      productData.weight || null,
      productData.dimensions || null,
      productData.is_service !== undefined ? (productData.is_service ? 1 : 0) : null,
      productData.service_duration || null,
      productData.warranty_period || null,
      productData.notes || null,
      productData.active !== undefined ? (productData.active ? 1 : 0) : null,
      new Date().toISOString(),
      id
    ]);

    // Registrar en auditoría
    logAuditEvent('products', id, 'UPDATE', JSON.stringify(currentResult[0].values[0]), JSON.stringify(productData));

    logger.info('Products', 'update_success', 'Producto actualizado', { id });

    return {
      success: true,
      message: 'Producto actualizado correctamente'
    };

  } catch (error) {
    logger.error('Products', 'update_failed', 'Error al actualizar producto', { id, ...productData }, error as Error);
    return {
      success: false,
      message: `Error al actualizar producto: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

export function deleteProduct(id: number): { success: boolean; message: string } {
  try {
    logger.info('Products', 'delete_start', 'Eliminando producto', { id });

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    // Verificar si el producto está siendo usado en facturas
    const invoiceItemsResult = db.exec('SELECT COUNT(*) as count FROM invoice_lines WHERE product_id = ?', [id]);
    const invoiceItemCount = invoiceItemsResult[0]?.values[0]?.[0] as number || 0;

    if (invoiceItemCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar el producto porque está siendo usado en ${invoiceItemCount} factura(s)`
      };
    }

    // Verificar si el producto está siendo usado en facturas de compra
    const billItemsResult = db.exec('SELECT COUNT(*) as count FROM bill_lines WHERE product_id = ?', [id]);
    const billItemCount = billItemsResult[0]?.values[0]?.[0] as number || 0;

    if (billItemCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar el producto porque está siendo usado en ${billItemCount} factura(s) de compra`
      };
    }

    // Obtener datos actuales para auditoría
    const currentResult = db.exec('SELECT * FROM products WHERE id = ?', [id]);

    // Marcar como inactivo en lugar de eliminar físicamente
    const stmt = db.prepare('UPDATE products SET active = 0, updated_at = ? WHERE id = ?');
    stmt.run([new Date().toISOString(), id]);

    // Registrar en auditoría
    logAuditEvent('products', id, 'DELETE', JSON.stringify(currentResult[0]?.values[0]), null);

    logger.info('Products', 'delete_success', 'Producto eliminado', { id });

    return {
      success: true,
      message: 'Producto eliminado correctamente'
    };

  } catch (error) {
    logger.error('Products', 'delete_failed', 'Error al eliminar producto', { id }, error as Error);
    return {
      success: false,
      message: `Error al eliminar producto: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

export function getProductById(id: number): Product | null {
  try {
    if (!db) return null;

    const result = db.exec(`
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `, [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const product: any = {};

    columns.forEach((col, index) => {
      if (col === 'category_name' && row[index]) {
        product.category = { name: row[index] as string } as ProductCategory;
      } else if (col === 'supplier_name' && row[index]) {
        product.supplier = { name: row[index] as string } as Supplier;
      } else {
        product[col] = row[index];
      }
    });

    return product as Product;
  } catch (error) {
    logger.error('Products', 'get_by_id_failed', 'Error al obtener producto por ID', { id }, error as Error);
    return null;
  }
}

export function updateProductStock(productId: number, quantity: number, operation: 'add' | 'subtract'): { success: boolean; message: string } {
  try {
    logger.info('Products', 'update_stock_start', 'Actualizando stock de producto', { productId, quantity, operation });

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const product = getProductById(productId);
    if (!product) {
      return { success: false, message: 'Producto no encontrado' };
    }

    let newStock: number;
    if (operation === 'add') {
      newStock = product.stock_quantity + quantity;
    } else {
      newStock = product.stock_quantity - quantity;
      if (newStock < 0) {
        return { success: false, message: 'Stock insuficiente' };
      }
    }

    const stmt = db.prepare('UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?');
    stmt.run([newStock, new Date().toISOString(), productId]);

    // Registrar en auditoría
    logAuditEvent('products', productId, 'UPDATE',
      JSON.stringify({ stock_quantity: product.stock_quantity }),
      JSON.stringify({ stock_quantity: newStock, operation, quantity })
    );

    logger.info('Products', 'update_stock_success', 'Stock actualizado', {
      productId,
      oldStock: product.stock_quantity,
      newStock,
      operation,
      quantity
    });

    return {
      success: true,
      message: `Stock actualizado. Nuevo stock: ${newStock}`
    };

  } catch (error) {
    logger.error('Products', 'update_stock_failed', 'Error al actualizar stock', { productId, quantity, operation }, error as Error);
    return {
      success: false,
      message: `Error al actualizar stock: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

export function getProductsLowStock(): Product[] {
  try {
    logger.info('Products', 'get_low_stock_start', 'Obteniendo productos con stock bajo');

    if (!db) {
      throw new Error('Base de datos no inicializada');
    }

    const result = db.exec(`
      SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.active = 1 
        AND p.is_service = 0 
        AND p.stock_quantity <= p.reorder_point
      ORDER BY p.stock_quantity ASC
    `);

    if (result.length === 0) {
      return [];
    }

    const products: Product[] = [];
    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const product: any = {};

      columns.forEach((col, index) => {
        if (col === 'category_name' && row[index]) {
          product.category = { name: row[index] as string } as ProductCategory;
        } else if (col === 'supplier_name' && row[index]) {
          product.supplier = { name: row[index] as string } as Supplier;
        } else {
          product[col] = row[index];
        }
      });

      products.push(product as Product);
    });

    logger.info('Products', 'get_low_stock_success', 'Productos con stock bajo obtenidos', { count: products.length });
    return products;

  } catch (error) {
    logger.error('Products', 'get_low_stock_failed', 'Error al obtener productos con stock bajo', null, error as Error);
    return [];
  }
}

// ==========================================
// FUNCIONES PARA REPORTES FLORIDA DR-15
// ==========================================

/**
 * Calcula el reporte DR-15 para un período específico
 * Cumple con requisitos legales de Florida
 */
export function calculateFloridaDR15Report(period: string): FloridaDR15Report | null {
  if (!db) {
    logger.error('DR15', 'calculate_no_db', 'Base de datos no disponible');
    return null;
  }

  try {
    logger.info('DR15', 'calculate_start', 'Calculando reporte DR-15', { period });

    // Determinar rango de fechas según el período
    const { startDate, endDate } = parsePeriod(period);

    // Obtener todas las facturas del período
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

    // Procesar cada factura
    invoicesResult[0].values.forEach(row => {
      const subtotal = Number(row[1]) || 0;
      const taxAmount = Number(row[2]) || 0;
      const county = row[4] as string || 'Miami-Dade';
      const isExempt = Boolean(row[5]);

      if (isExempt) {
        exemptSales += subtotal;
      } else {
        totalTaxableSales += subtotal;
        totalTaxCollected += taxAmount;

        // Agrupar por condado
        if (!countyBreakdown[county]) {
          const taxRate = getFloridaTaxRate(county);
          countyBreakdown[county] = {
            rate: taxRate,
            taxableAmount: 0,
            taxAmount: 0
          };
        }

        countyBreakdown[county].taxableAmount += subtotal;
        countyBreakdown[county].taxAmount += taxAmount;
      }
    });

    // Crear el reporte
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
      adjustments: [], // Se pueden agregar manualmente después
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

/**
 * Guarda un reporte DR-15 en la base de datos
 */
export function saveDR15Report(report: FloridaDR15Report): { success: boolean; message: string; id?: number } {
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  try {
    logger.info('DR15', 'save_start', 'Guardando reporte DR-15', { period: report.period });

    // Verificar si ya existe un reporte para este período
    const existingResult = db.exec(`
      SELECT id FROM florida_tax_reports WHERE period = ?
    `, [report.period]);

    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
      return { success: false, message: `Ya existe un reporte para el período ${report.period}` };
    }

    // Insertar reporte principal
    const insertResult = db.exec(`
      INSERT INTO florida_tax_reports (
        period, total_taxable_sales, total_tax_collected, exempt_sales, 
        net_tax_due, due_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      report.period,
      report.totalTaxableSales,
      report.totalTaxCollected,
      report.exemptSales,
      report.netTaxDue,
      report.dueDate.toISOString().split('T')[0],
      report.status
    ]);

    // Obtener el ID del reporte insertado
    const reportId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;

    // Insertar desglose por condado
    report.countyBreakdown.forEach(county => {
      db!.exec(`
        INSERT INTO florida_tax_report_counties (
          report_id, county_name, tax_rate, taxable_amount, tax_amount
        ) VALUES (?, ?, ?, ?, ?)
      `, [reportId, county.county, county.rate, county.taxableAmount, county.taxAmount]);
    });

    // Insertar ajustes si existen
    report.adjustments.forEach(adjustment => {
      db!.exec(`
        INSERT INTO florida_tax_report_adjustments (
          report_id, description, amount, type
        ) VALUES (?, ?, ?, ?)
      `, [reportId, adjustment.description, adjustment.amount, adjustment.type]);
    });

    // Registrar en auditoría
    const auditData = {
      period: report.period,
      total_tax: report.totalTaxCollected,
      counties: report.countyBreakdown.length
    };

    db.exec(`
      INSERT INTO audit_log (table_name, record_id, action, new_values, user_id, audit_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'florida_tax_reports',
      reportId,
      'INSERT',
      JSON.stringify(auditData),
      1,
      generateSimpleHash(auditData)
    ]);

    logger.info('DR15', 'save_success', 'Reporte DR-15 guardado correctamente', {
      period: report.period,
      reportId
    });

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

/**
 * Obtiene todos los reportes DR-15 guardados
 */
export function getDR15Reports(): FloridaDR15Report[] {
  if (!db) {
    logger.error('DR15', 'get_reports_no_db', 'Base de datos no disponible');
    return [];
  }

  try {
    logger.info('DR15', 'get_reports_start', 'Obteniendo reportes DR-15');

    const reportsResult = db.exec(`
      SELECT 
        id, period, total_taxable_sales, total_tax_collected, exempt_sales,
        net_tax_due, due_date, status, filed_by, filed_at
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

      // Obtener desglose por condado
      const countiesResult = db.exec(`
        SELECT county_name, tax_rate, taxable_amount, tax_amount
        FROM florida_tax_report_counties
        WHERE report_id = ?
      `, [reportId]);

      const countyBreakdown = countiesResult.length > 0 ?
        countiesResult[0].values.map(countyRow => ({
          county: countyRow[0] as string,
          rate: Number(countyRow[1]),
          taxableAmount: Number(countyRow[2]),
          taxAmount: Number(countyRow[3])
        })) : [];

      // Obtener ajustes
      const adjustmentsResult = db.exec(`
        SELECT description, amount, type
        FROM florida_tax_report_adjustments
        WHERE report_id = ?
      `, [reportId]);

      const adjustments = adjustmentsResult.length > 0 ?
        adjustmentsResult[0].values.map(adjRow => ({
          description: adjRow[0] as string,
          amount: Number(adjRow[1]),
          type: adjRow[2] as 'credit' | 'debit'
        })) : [];

      const report: FloridaDR15Report = {
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
      };

      reports.push(report);
    }

    logger.info('DR15', 'get_reports_success', 'Reportes DR-15 obtenidos', { count: reports.length });
    return reports;

  } catch (error) {
    logger.error('DR15', 'get_reports_failed', 'Error al obtener reportes DR-15', null, error as Error);
    return [];
  }
}

/**
 * Obtiene todas las tasas de impuesto de Florida de la DB
 */
export function getAllFloridaTaxRates(): { id: number; county: string; stateRate: number; discretionaryRate: number; totalRate: number }[] {
  if (!db) return [];
  try {
    const result = db.exec("SELECT id, county_name as county, state_rate as stateRate, county_rate as discretionaryRate, total_rate as totalRate FROM florida_tax_rates");
    if (result.length === 0 || result[0].values.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map(row => rowToEntity<any>(columns, row as initSqlJs.SqlValue[]));
  } catch (error) {
    console.error('Error getting all tax rates:', error);
    return [];
  }
}

/**
 * Marca un reporte DR-15 como presentado
 */
export function markDR15ReportAsFiled(period: string, filedBy: number = 1): { success: boolean; message: string } {
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  try {
    logger.info('DR15', 'mark_filed_start', 'Marcando reporte como presentado', { period, filedBy });

    const result = db.exec(`
      UPDATE florida_tax_reports 
      SET status = 'filed', filed_by = ?, filed_at = CURRENT_TIMESTAMP
      WHERE period = ?
    `, [filedBy, period]);

    logger.info('DR15', 'mark_filed_success', 'Reporte marcado como presentado', { period });

    return {
      success: true,
      message: `Reporte DR-15 para ${period} marcado como presentado`
    };

  } catch (error) {
    logger.error('DR15', 'mark_filed_failed', 'Error al marcar reporte como presentado', { period }, error as Error);
    return {
      success: false,
      message: `Error al actualizar reporte: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

// ==========================================
// FUNCIONES AUXILIARES PARA DR-15
// ==========================================

/**
 * Parsea un período (ej: "2024-Q1") y devuelve fechas de inicio y fin
 */
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
    // Período mensual (ej: "2024-01")
    const month = parseInt(quarter);
    return {
      startDate: `${yearNum}-${month.toString().padStart(2, '0')}-01`,
      endDate: `${yearNum}-${month.toString().padStart(2, '0')}-${getLastDayOfMonth(yearNum, month)}`
    };
  }
}

/**
 * Obtiene el último día del mes
 */
function getLastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return lastDay.toString().padStart(2, '0');
}

/**
 * Calcula la fecha de vencimiento para un período
 */
function calculateDueDate(period: string): Date {
  const { endDate } = parsePeriod(period);
  const periodEnd = new Date(endDate);

  // DR-15 vence el día 20 del mes siguiente al período
  const dueDate = new Date(periodEnd);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(20);

  return dueDate;
}

/**
 * Crea un reporte DR-15 vacío para períodos sin datos
 */
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

/**
 * Genera períodos disponibles para reportes
 */
export function getAvailableDR15Periods(): string[] {
  const periods: string[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Generar últimos 8 trimestres
  for (let year = currentYear - 1; year <= currentYear; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const period = `${year}-Q${quarter}`;
      const { endDate } = parsePeriod(period);

      // Solo incluir períodos que ya han terminado
      if (new Date(endDate) < currentDate) {
        periods.push(period);
      }
    }
  }

  return periods.reverse(); // Más recientes primero
}

// ==========================================
// FUNCIONES PARA MÉTODOS DE PAGO
// ==========================================

/**
 * Obtiene todos los métodos de pago activos
 */
export function getPaymentMethods(): PaymentMethod[] {
  if (!db) {
    logger.error('PaymentMethods', 'get_no_db', 'Base de datos no disponible');
    return [];
  }

  try {
    logger.info('PaymentMethods', 'get_start', 'Obteniendo métodos de pago');

    const result = db.exec(`
      SELECT id, method_name, method_type, is_active, requires_reference, created_at
      FROM payment_methods
      WHERE is_active = 1
      ORDER BY method_name ASC
    `);

    if (result.length === 0) {
      logger.info('PaymentMethods', 'get_empty', 'No hay métodos de pago');
      return [];
    }

    const paymentMethods: PaymentMethod[] = [];
    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const paymentMethod: any = {};
      columns.forEach((col, index) => {
        paymentMethod[col] = row[index];
      });
      paymentMethods.push(paymentMethod as PaymentMethod);
    });

    logger.info('PaymentMethods', 'get_success', 'Métodos de pago obtenidos', { count: paymentMethods.length });
    return paymentMethods;

  } catch (error) {
    logger.error('PaymentMethods', 'get_failed', 'Error al obtener métodos de pago', null, error as Error);
    return [];
  }
}

/**
 * Obtiene todos los métodos de pago (incluyendo inactivos)
 */
export function getAllPaymentMethods(): PaymentMethod[] {
  if (!db) {
    logger.error('PaymentMethods', 'get_all_no_db', 'Base de datos no disponible');
    return [];
  }

  try {
    logger.info('PaymentMethods', 'get_all_start', 'Obteniendo todos los métodos de pago');

    const result = db.exec(`
      SELECT id, method_name, method_type, is_active, requires_reference, created_at
      FROM payment_methods
      ORDER BY method_name ASC
    `);

    if (result.length === 0) {
      logger.info('PaymentMethods', 'get_all_empty', 'No hay métodos de pago');
      return [];
    }

    const paymentMethods: PaymentMethod[] = [];
    const columns = result[0].columns;

    result[0].values.forEach(row => {
      const paymentMethod: any = {};
      columns.forEach((col, index) => {
        paymentMethod[col] = row[index];
      });
      paymentMethods.push(paymentMethod as PaymentMethod);
    });

    logger.info('PaymentMethods', 'get_all_success', 'Todos los métodos de pago obtenidos', { count: paymentMethods.length });
    return paymentMethods;

  } catch (error) {
    logger.error('PaymentMethods', 'get_all_failed', 'Error al obtener todos los métodos de pago', null, error as Error);
    return [];
  }
}

/**
 * Crea un nuevo método de pago
 */
export function createPaymentMethod(methodData: Omit<PaymentMethod, 'id' | 'created_at'>): { success: boolean; message: string; id?: number } {
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  try {
    logger.info('PaymentMethods', 'create_start', 'Creando método de pago', methodData);

    // Verificar que no exista un método con el mismo nombre
    const existingResult = db.exec(`
      SELECT id FROM payment_methods WHERE method_name = ?
    `, [methodData.method_name]);

    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
      return { success: false, message: `Ya existe un método de pago con el nombre "${methodData.method_name}"` };
    }

    // Insertar nuevo método de pago
    db.exec(`
      INSERT INTO payment_methods (method_name, method_type, is_active, requires_reference)
      VALUES (?, ?, ?, ?)
    `, [
      methodData.method_name,
      methodData.method_type,
      methodData.is_active ? 1 : 0,
      methodData.requires_reference ? 1 : 0
    ]);

    // Obtener el ID del método insertado
    const newId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;

    // Registrar en auditoría
    const auditData = {
      method_name: methodData.method_name,
      method_type: methodData.method_type,
      is_active: methodData.is_active
    };

    db.exec(`
      INSERT INTO audit_log (table_name, record_id, action, new_values, user_id, audit_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'payment_methods',
      newId,
      'INSERT',
      JSON.stringify(auditData),
      1,
      generateSimpleHash(auditData)
    ]);

    logger.info('PaymentMethods', 'create_success', 'Método de pago creado correctamente', {
      id: newId,
      method_name: methodData.method_name
    });

    return {
      success: true,
      message: `Método de pago "${methodData.method_name}" creado correctamente`,
      id: newId
    };

  } catch (error) {
    logger.error('PaymentMethods', 'create_failed', 'Error al crear método de pago', methodData, error as Error);
    return {
      success: false,
      message: `Error al crear método de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

/**
 * Actualiza un método de pago existente
 */
export function updatePaymentMethod(id: number, methodData: Partial<PaymentMethod>): { success: boolean; message: string } {
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  try {
    logger.info('PaymentMethods', 'update_start', 'Actualizando método de pago', { id, ...methodData });

    // Verificar que el método existe
    const existingResult = db.exec(`
      SELECT id, method_name FROM payment_methods WHERE id = ?
    `, [id]);

    if (existingResult.length === 0 || existingResult[0].values.length === 0) {
      return { success: false, message: 'Método de pago no encontrado' };
    }

    const currentName = existingResult[0].values[0][1] as string;

    // Si se está cambiando el nombre, verificar que no exista otro con el mismo nombre
    if (methodData.method_name && methodData.method_name !== currentName) {
      const duplicateResult = db.exec(`
        SELECT id FROM payment_methods WHERE method_name = ? AND id != ?
      `, [methodData.method_name, id]);

      if (duplicateResult.length > 0 && duplicateResult[0].values.length > 0) {
        return { success: false, message: `Ya existe un método de pago con el nombre "${methodData.method_name}"` };
      }
    }

    // Construir la consulta de actualización dinámicamente
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (methodData.method_name !== undefined) {
      updateFields.push('method_name = ?');
      updateValues.push(methodData.method_name);
    }

    if (methodData.method_type !== undefined) {
      updateFields.push('method_type = ?');
      updateValues.push(methodData.method_type);
    }

    if (methodData.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(methodData.is_active ? 1 : 0);
    }

    if (methodData.requires_reference !== undefined) {
      updateFields.push('requires_reference = ?');
      updateValues.push(methodData.requires_reference ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return { success: false, message: 'No hay campos para actualizar' };
    }

    updateValues.push(id);

    // Ejecutar actualización
    db.exec(`
      UPDATE payment_methods 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // Registrar en auditoría
    db.exec(`
      INSERT INTO audit_log (table_name, record_id, action, new_values, user_id, audit_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'payment_methods',
      id,
      'UPDATE',
      JSON.stringify(methodData),
      1,
      generateSimpleHash(methodData)
    ]);

    logger.info('PaymentMethods', 'update_success', 'Método de pago actualizado correctamente', { id });

    return {
      success: true,
      message: 'Método de pago actualizado correctamente'
    };

  } catch (error) {
    logger.error('PaymentMethods', 'update_failed', 'Error al actualizar método de pago', { id, ...methodData }, error as Error);
    return {
      success: false,
      message: `Error al actualizar método de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

/**
 * Elimina un método de pago (soft delete - marca como inactivo)
 */
export function deletePaymentMethod(id: number): { success: boolean; message: string } {
  if (!db) {
    return { success: false, message: 'Base de datos no disponible' };
  }

  try {
    logger.info('PaymentMethods', 'delete_start', 'Eliminando método de pago', { id });

    // Verificar que el método existe
    const existingResult = db.exec(`
      SELECT id, method_name FROM payment_methods WHERE id = ?
    `, [id]);

    if (existingResult.length === 0 || existingResult[0].values.length === 0) {
      return { success: false, message: 'Método de pago no encontrado' };
    }

    const methodName = existingResult[0].values[0][1] as string;

    // Verificar si el método está siendo usado en pagos
    const usageResult = db.exec(`
      SELECT COUNT(*) as count FROM (
        SELECT 1 FROM payments WHERE payment_method = ?
        UNION ALL
        SELECT 1 FROM supplier_payments WHERE payment_method = ?
      )
    `, [methodName.toLowerCase().replace(' ', '_'), methodName.toLowerCase().replace(' ', '_')]);

    const usageCount = usageResult[0].values[0][0] as number;

    if (usageCount > 0) {
      // Si está en uso, solo marcar como inactivo
      db.exec(`
        UPDATE payment_methods 
        SET is_active = 0
        WHERE id = ?
      `, [id]);

      logger.info('PaymentMethods', 'delete_soft', 'Método de pago marcado como inactivo (en uso)', { id, methodName });

      return {
        success: true,
        message: `Método de pago "${methodName}" desactivado (estaba en uso en ${usageCount} transacciones)`
      };
    } else {
      // Si no está en uso, eliminar completamente
      db.exec(`
        DELETE FROM payment_methods WHERE id = ?
      `, [id]);

      // Registrar en auditoría
      db.exec(`
        INSERT INTO audit_log (table_name, record_id, action, old_values, user_id, audit_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'payment_methods',
        id,
        'DELETE',
        JSON.stringify({ method_name: methodName }),
        1,
        generateSimpleHash({ method_name: methodName })
      ]);

      logger.info('PaymentMethods', 'delete_hard', 'Método de pago eliminado completamente', { id, methodName });

      return {
        success: true,
        message: `Método de pago "${methodName}" eliminado correctamente`
      };
    }

  } catch (error) {
    logger.error('PaymentMethods', 'delete_failed', 'Error al eliminar método de pago', { id }, error as Error);
    return {
      success: false,
      message: `Error al eliminar método de pago: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

/**
 * Obtiene un método de pago por ID
 */
export function getPaymentMethodById(id: number): PaymentMethod | null {
  if (!db) {
    logger.error('PaymentMethods', 'get_by_id_no_db', 'Base de datos no disponible');
    return null;
  }

  try {
    logger.info('PaymentMethods', 'get_by_id_start', 'Obteniendo método de pago por ID', { id });

    const result = db.exec(`
      SELECT id, method_name, method_type, is_active, requires_reference, created_at
      FROM payment_methods
      WHERE id = ?
    `, [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      logger.warn('PaymentMethods', 'get_by_id_not_found', 'Método de pago no encontrado', { id });
      return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;

    const paymentMethod: any = {};
    columns.forEach((col, index) => {
      paymentMethod[col] = row[index];
    });

    logger.info('PaymentMethods', 'get_by_id_success', 'Método de pago obtenido', { id });
    return paymentMethod as PaymentMethod;

  } catch (error) {
    logger.error('PaymentMethods', 'get_by_id_failed', 'Error al obtener método de pago', { id }, error as Error);
    return null;
  }
}

/**
 * Verifica si se puede eliminar un método de pago
 */
export function canDeletePaymentMethod(id: number): { canDelete: boolean; reason?: string } {
  if (!db) {
    return { canDelete: false, reason: 'Base de datos no disponible' };
  }

  try {
    // Verificar que el método existe
    const existingResult = db.exec(`
      SELECT method_name FROM payment_methods WHERE id = ?
    `, [id]);

    if (existingResult.length === 0 || existingResult[0].values.length === 0) {
      return { canDelete: false, reason: 'Método de pago no encontrado' };
    }

    const methodName = existingResult[0].values[0][0] as string;

    // Verificar si está siendo usado
    const usageResult = db.exec(`
      SELECT COUNT(*) as count FROM (
        SELECT 1 FROM payments WHERE payment_method = ?
        UNION ALL
        SELECT 1 FROM supplier_payments WHERE payment_method = ?
      )
    `, [methodName.toLowerCase().replace(' ', '_'), methodName.toLowerCase().replace(' ', '_')]);

    const usageCount = usageResult[0].values[0][0] as number;

    if (usageCount > 0) {
      return {
        canDelete: false,
        reason: `El método de pago está siendo usado en ${usageCount} transacciones. Solo se puede desactivar.`
      };
    }

    return { canDelete: true };

  } catch (error) {
    logger.error('PaymentMethods', 'can_delete_failed', 'Error al verificar si se puede eliminar método de pago', { id }, error as Error);
    return { canDelete: false, reason: 'Error al verificar el método de pago' };
  }
}
// ==========================================
// FUNCIONES PARA CUENTAS BANCARIAS
// ==========================================

/**
 * Obtiene todas las cuentas bancarias
 */
export function getBankAccounts(): BankAccount[] {
  if (!db) {
    logger.error('BankAccounts', 'get_all_no_db', 'Base de datos no disponible');
    return [];
  }

  try {
    const result = db.exec("SELECT * FROM bank_accounts ORDER BY account_name");

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const account: any = {};
      columns.forEach((col, index) => {
        account[col] = row[index];
      });
      return account as BankAccount;
    });
  } catch (error) {
    logger.error('BankAccounts', 'get_failed', 'Error al obtener cuentas bancarias', null, error as Error);
    return [];
  }
}

/**
 * Obtiene una cuenta bancaria por ID
 */
export function getBankAccountById(id: number): BankAccount | null {
  if (!db) return null;

  try {
    const result = db.exec("SELECT * FROM bank_accounts WHERE id = ?", [id]);

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    const row = result[0].values[0];
    const columns = result[0].columns;
    const account: any = {};

    columns.forEach((col, index) => {
      account[col] = row[index];
    });

    return account as BankAccount;
  } catch (error) {
    logger.error('BankAccounts', 'get_by_id_failed', 'Error al obtener cuenta bancaria', { id }, error as Error);
    return null;
  }
}

/**
 * Crea una nueva cuenta bancaria
 */
export function createBankAccount(data: Omit<BankAccount, 'id' | 'created_at'>): { success: boolean; message: string; id?: number } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    const stmt = db.prepare(`
      INSERT INTO bank_accounts (
        account_name, bank_name, account_number, account_type, 
        routing_number, balance, currency, is_active, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      data.account_name,
      data.bank_name,
      data.account_number,
      data.account_type,
      data.routing_number || null,
      data.balance || 0,
      data.currency || 'USD',
      data.is_active ? 1 : 0,
      data.notes || null
    ]);

    const idResult = db.exec("SELECT last_insert_rowid()");
    const id = idResult[0].values[0][0] as number;

    // Auditoría
    db.exec(`
      INSERT INTO audit_log (table_name, record_id, action, new_values, user_id, audit_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'bank_accounts',
      id,
      'INSERT',
      JSON.stringify(data),
      1,
      generateSimpleHash(data)
    ]);

    logger.info('BankAccounts', 'create_success', 'Cuenta bancaria creada', { id });
    return { success: true, message: 'Cuenta bancaria creada correctamente', id };
  } catch (error) {
    logger.error('BankAccounts', 'create_failed', 'Error al crear cuenta bancaria', null, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

/**
 * Actualiza una cuenta bancaria existente
 */
export function updateBankAccount(id: number, data: Partial<BankAccount>): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    // Lista de campos actualizables
    const fields = ['account_name', 'bank_name', 'account_number', 'account_type', 'routing_number', 'balance', 'currency', 'is_active', 'notes'];

    fields.forEach(field => {
      if ((data as any)[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        let val = (data as any)[field];
        if (typeof val === 'boolean') val = val ? 1 : 0;
        updateValues.push(val);
      }
    });

    if (updateFields.length === 0) {
      return { success: false, message: 'No hay datos para actualizar' };
    }

    updateValues.push(id);

    const stmt = db.prepare(`UPDATE bank_accounts SET ${updateFields.join(', ')} WHERE id = ?`);
    stmt.run(updateValues);

    // Auditoría
    db.exec(`
      INSERT INTO audit_log (table_name, record_id, action, new_values, user_id, audit_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'bank_accounts',
      id,
      'UPDATE',
      JSON.stringify(data),
      1,
      generateSimpleHash(data)
    ]);

    logger.info('BankAccounts', 'update_success', 'Cuenta bancaria actualizada', { id });
    return { success: true, message: 'Cuenta bancaria actualizada correctamente' };
  } catch (error) {
    logger.error('BankAccounts', 'update_failed', 'Error al actualizar cuenta bancaria', { id }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

/**
 * Elimina una cuenta bancaria (o la desactiva si tiene saldo)
 */
export function deleteBankAccount(id: number): { success: boolean; message: string } {
  if (!db) return { success: false, message: 'Base de datos no disponible' };

  try {
    // Verificar saldo
    const account = getBankAccountById(id);
    if (!account) return { success: false, message: 'Cuenta no encontrada' };

    if (account.balance !== 0) {
      return { success: false, message: 'No se puede eliminar una cuenta con saldo diferente a 0. Ajuste el saldo o desactívela.' };
    }

    // Por seguridad, preferimos Soft Delete para bancos
    db.exec("UPDATE bank_accounts SET is_active = 0 WHERE id = ?", [id]);

    // Auditoría
    db.exec(`
      INSERT INTO audit_log (table_name, record_id, action, old_values, user_id, audit_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'bank_accounts',
      id,
      'DELETE', // Marcamos como DELETE en auditoría aunque sea soft delete para indicar la intención
      JSON.stringify(account),
      1,
      generateSimpleHash(account)
    ]);

    logger.info('BankAccounts', 'delete_success', 'Cuenta bancaria desactivada/eliminada', { id });
    return { success: true, message: 'Cuenta bancaria eliminada correctamente' };
  } catch (error) {
    logger.error('BankAccounts', 'delete_failed', 'Error al eliminar cuenta bancaria', { id }, error as Error);
    return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

/**
 * Obtiene todos los movimientos de inventario
 */
export function getInventoryMovements(): any[] {
  if (!db) return [];
  try {
    const result = db.exec(`
      SELECT m.*, p.name as product_name, p.sku as product_sku 
      FROM inventory_movements m
      JOIN products p ON m.product_id = p.id
      ORDER BY m.date DESC
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      return [];
    }

    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return [];
  }
}
