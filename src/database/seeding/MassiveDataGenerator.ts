// MassiveDataGenerator.ts - Generador de datos masivos para testing
import { getDB } from '../simple-db';

interface GeneratorConfig {
  customers: number;
  suppliers: number;
  products: number;
  invoices: number;
  bills: number;
  quotes: number;
  employees: number;
  bankAccounts: number;
}

const DEFAULT_CONFIG: GeneratorConfig = {
  customers: 30,
  suppliers: 20,
  products: 100,
  invoices: 50,
  bills: 50,
  quotes: 30,
  employees: 15,
  bankAccounts: 5
};

// Datos de ejemplo realistas
const FLORIDA_COUNTIES = [
  'Miami-Dade', 'Broward', 'Palm Beach', 'Hillsborough', 'Orange',
  'Pinellas', 'Duval', 'Lee', 'Polk', 'Brevard', 'Volusia', 'Pasco',
  'Seminole', 'Sarasota', 'Manatee', 'Collier', 'Osceola', 'Marion'
];

const FIRST_NAMES = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker'
];

const COMPANY_PREFIXES = [
  'Global', 'United', 'American', 'National', 'International', 'Premier', 'Elite',
  'Advanced', 'Superior', 'Professional', 'Quality', 'Reliable', 'Trusted', 'Prime'
];

const COMPANY_SUFFIXES = [
  'Solutions', 'Services', 'Group', 'Corp', 'Industries', 'Enterprises', 'Systems',
  'Technologies', 'Partners', 'Associates', 'Consulting', 'Holdings', 'International'
];

const PRODUCT_CATEGORIES = [
  'Electronics', 'Office Supplies', 'Furniture', 'Software', 'Hardware',
  'Accessories', 'Tools', 'Equipment', 'Materials', 'Services'
];

const PRODUCT_NAMES = [
  'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Scanner',
  'Desk', 'Chair', 'Cabinet', 'Pen', 'Paper', 'Notebook', 'Folder', 'Stapler',
  'Calculator', 'Phone', 'Tablet', 'Headset', 'Webcam', 'Router', 'Switch',
  'Cable', 'Adapter', 'Battery', 'Charger', 'Case', 'Stand', 'Lamp', 'Clock'
];

// Funciones auxiliares
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

function generateEmail(firstName: string, lastName: string, domain: string = 'example.com'): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generatePhone(): string {
  return `+1-${randomInt(200, 999)}-${randomInt(200, 999)}-${randomInt(1000, 9999)}`;
}

function generateCompanyName(): string {
  return `${randomElement(COMPANY_PREFIXES)} ${randomElement(COMPANY_SUFFIXES)}`;
}

function generateAddress(): { address: string; city: string; state: string; zip: string } {
  const streetNumber = randomInt(100, 9999);
  const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Pine Rd', 'Cedar Ln', 'Elm St'];
  return {
    address: `${streetNumber} ${randomElement(streets)}`,
    city: randomElement(['Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Fort Lauderdale']),
    state: 'FL',
    zip: `${randomInt(30000, 39999)}`
  };
}

/**
 * Genera datos masivos para todas las tablas del sistema
 */
export async function generateMassiveTestData(config: Partial<GeneratorConfig> = {}): Promise<{
  success: boolean;
  message: string;
  stats: any;
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const db = getDB();

  if (!db) {
    return { success: false, message: 'Database not initialized', stats: {} };
  }

  try {
    console.log('🚀 Iniciando generación de datos masivos...');

    // CRÍTICO: Verificar que exista el plan de cuentas antes de generar asientos contables
    const accountsCheck = db.exec("SELECT COUNT(*) as count FROM chart_of_accounts");
    const accountCount = accountsCheck[0]?.values[0]?.[0] as number || 0;

    if (accountCount === 0) {
      console.warn('⚠️ Plan de cuentas vacío. Los asientos contables no se generarán.');
    }

    db.run('BEGIN TRANSACTION');

    const stats = {
      customers: 0,
      suppliers: 0,
      products: 0,
      productCategories: 0,
      invoices: 0,
      bills: 0,
      quotes: 0,
      employees: 0,
      bankAccounts: 0,
      journalEntries: 0,
      payments: 0
    };

    // 1. Generar Categorías de Productos
    console.log('📦 Generando categorías de productos...');
    const categoryIds: number[] = [];
    for (const categoryName of PRODUCT_CATEGORIES) {
      const stmt = db.prepare(`
        INSERT INTO product_categories (name, description, active)
        VALUES (?, ?, 1)
      `);
      stmt.run([categoryName, `Categoría de ${categoryName}`]);
      const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      categoryIds.push(id);
      stmt.free();
      stats.productCategories++;
    }

    // 2. Generar Productos
    console.log('📦 Generando productos...');
    const productIds: number[] = [];
    for (let i = 0; i < cfg.products; i++) {
      const categoryId = randomElement(categoryIds);
      const productName = `${randomElement(PRODUCT_NAMES)} ${randomElement(['Pro', 'Plus', 'Premium', 'Standard', 'Basic'])} ${i + 1}`;
      const sku = `PRD-${String(i + 1).padStart(5, '0')}`;
      const price = randomFloat(10, 5000);
      const cost = price * randomFloat(0.4, 0.7);
      const stock = randomInt(0, 500);

      const stmt = db.prepare(`
        INSERT INTO products (
          sku, name, description, category_id, price, cost, 
          stock_quantity, reorder_point, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      stmt.run([
        sku, productName, `Descripción de ${productName}`,
        categoryId, price, cost, stock, randomInt(10, 50)
      ]);
      const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      productIds.push(id);
      stmt.free();
      stats.products++;
    }

    // 3. Generar Clientes
    console.log('👥 Generando clientes...');
    const customerIds: number[] = [];
    for (let i = 0; i < cfg.customers; i++) {
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const isCompany = Math.random() > 0.5;
      const name = isCompany ? generateCompanyName() : `${firstName} ${lastName}`;
      const addr = generateAddress();
      const county = randomElement(FLORIDA_COUNTIES);

      const stmt = db.prepare(`
        INSERT INTO customers (
          name, email, phone, address_line1, city, state, zip_code,
          florida_county, tax_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `);
      stmt.run([
        name,
        generateEmail(firstName, lastName, isCompany ? 'company.com' : 'gmail.com'),
        generatePhone(),
        addr.address, addr.city, addr.state, addr.zip,
        county,
        `${randomInt(10, 99)}-${randomInt(1000000, 9999999)}`
      ]);
      const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      customerIds.push(id);
      stmt.free();
      stats.customers++;
    }

    // 4. Generar Proveedores
    console.log('🏢 Generando proveedores...');
    const supplierIds: number[] = [];
    for (let i = 0; i < cfg.suppliers; i++) {
      const companyName = generateCompanyName();
      const addr = generateAddress();
      const contactFirstName = randomElement(FIRST_NAMES);
      const contactLastName = randomElement(LAST_NAMES);
      const county = randomElement(FLORIDA_COUNTIES);
      const docType = randomElement(['EIN', 'SSN', 'ITIN'] as const);

      const stmt = db.prepare(`
        INSERT INTO suppliers (
          name, business_name, document_type, document_number,
          email, phone, address_line1, city, state, 
          zip_code, florida_county, tax_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `);
      stmt.run([
        companyName,
        `${companyName} LLC`,
        docType,
        `${randomInt(10, 99)}-${randomInt(1000000, 9999999)}`,
        generateEmail(contactFirstName, contactLastName, 'supplier.com'),
        generatePhone(),
        addr.address,
        addr.city,
        addr.state,
        addr.zip,
        county,
        `${randomInt(10, 99)}-${randomInt(1000000, 9999999)}`
      ]);
      const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      supplierIds.push(id);
      stmt.free();
      stats.suppliers++;
    }

    // 5. Generar Cuentas Bancarias
    console.log('🏦 Generando cuentas bancarias...');
    const bankAccountIds: number[] = [];
    const banks = ['Bank of America', 'Wells Fargo', 'Chase', 'Citibank', 'TD Bank'];
    for (let i = 0; i < cfg.bankAccounts; i++) {
      const stmt = db.prepare(`
        INSERT INTO bank_accounts (
          bank_name, account_name, account_number, account_type,
          currency, balance, is_active
        ) VALUES (?, ?, ?, ?, 'USD', ?, 1)
      `);
      const accountTypes = ['checking', 'savings', 'other'];
      const accountType = randomElement(accountTypes);
      const accountLabel = accountType === 'checking' ? 'Checking' : accountType === 'savings' ? 'Savings' : 'Business';

      stmt.run([
        randomElement(banks),
        `${accountLabel} Account ${i + 1}`,
        `${randomInt(1000000000, 9999999999)}`,
        accountType,
        randomFloat(10000, 500000)
      ]);
      const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      bankAccountIds.push(id);
      stmt.free();
      stats.bankAccounts++;
    }

    // 6. Generar Facturas de Venta (Invoices)
    console.log('📄 Generando facturas de venta...');
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2026-01-31');

    for (let i = 0; i < cfg.invoices; i++) {
      const customerId = randomElement(customerIds);
      const issueDate = randomDate(startDate, endDate);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);

      // Obtener condado del cliente para impuestos
      const customerRes = db.exec("SELECT florida_county FROM customers WHERE id = ?", [customerId]);
      const county = customerRes[0]?.values[0]?.[0] as string || 'Miami-Dade';
      const taxRateRes = db.exec("SELECT total_rate FROM florida_tax_rates WHERE county_name = ?", [county]);
      const taxRate = taxRateRes[0]?.values[0]?.[0] as number || 0.07;

      // Generar líneas de factura
      const numItems = randomInt(1, 5);
      let subtotal = 0;
      const items: any[] = [];

      for (let j = 0; j < numItems; j++) {
        const productId = randomElement(productIds);
        const productRes = db.exec("SELECT name, price FROM products WHERE id = ?", [productId]);
        const productName = productRes[0]?.values[0]?.[0] as string;
        const productPrice = productRes[0]?.values[0]?.[1] as number;

        const quantity = randomInt(1, 10);
        const unitPrice = productPrice * randomFloat(0.9, 1.1); // Variación de precio
        const lineTotal = quantity * unitPrice;
        subtotal += lineTotal;

        items.push({
          productId,
          description: productName,
          quantity,
          unitPrice,
          lineTotal,
          taxable: true
        });
      }

      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;
      const status = randomElement(['draft', 'sent', 'paid', 'paid', 'paid']); // Más pagadas

      // Insertar factura
      const invoiceStmt = db.prepare(`
        INSERT INTO invoices (
          invoice_number, customer_id, issue_date, due_date,
          subtotal, tax_amount, total_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      invoiceStmt.run([
        `INV-${new Date(issueDate).getFullYear()}-${String(i + 1).padStart(5, '0')}`,
        customerId,
        issueDate,
        dueDate.toISOString().split('T')[0],
        subtotal,
        taxAmount,
        total,
        status
      ]);
      const invoiceId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      invoiceStmt.free();

      // Insertar líneas
      for (const item of items) {
        const lineStmt = db.prepare(`
          INSERT INTO invoice_lines (
            invoice_id, product_id, description, quantity, unit_price, line_total, taxable
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        lineStmt.run([
          invoiceId, item.productId, item.description, item.quantity,
          item.unitPrice, item.lineTotal, item.taxable ? 1 : 0
        ]);
        lineStmt.free();
      }

      // Si está pagada, crear pago
      if (status === 'paid') {
        const paymentStmt = db.prepare(`
          INSERT INTO payments (
            customer_id, invoice_id, payment_number, payment_date,
            amount, payment_method, reference_number
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        paymentStmt.run([
          customerId,
          invoiceId,
          `PAY-${String(stats.payments + 1).padStart(5, '0')}`,
          issueDate,
          total,
          randomElement(['cash', 'check', 'credit_card', 'bank_transfer']),
          `REF-${randomInt(100000, 999999)}`
        ]);
        paymentStmt.free();
        stats.payments++;
      }

      stats.invoices++;
    }

    // 7. Generar Facturas de Compra (Bills)
    console.log('📋 Generando facturas de compra...');

    for (let i = 0; i < cfg.bills; i++) {
      const supplierId = randomElement(supplierIds);
      const issueDate = randomDate(startDate, endDate);
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 45);

      // Generar líneas de factura
      const numItems = randomInt(1, 5);
      let subtotal = 0;
      const items: any[] = [];

      for (let j = 0; j < numItems; j++) {
        const productId = randomElement(productIds);
        const productRes = db.exec("SELECT name, cost FROM products WHERE id = ?", [productId]);
        const productName = productRes[0]?.values[0]?.[0] as string;
        const productCost = productRes[0]?.values[0]?.[1] as number;

        const quantity = randomInt(5, 50);
        const unitPrice = productCost * randomFloat(0.95, 1.05);
        const lineTotal = quantity * unitPrice;
        subtotal += lineTotal;

        items.push({
          productId,
          description: productName,
          quantity,
          unitPrice,
          lineTotal
        });
      }

      const taxAmount = subtotal * 0.07;
      const total = subtotal + taxAmount;
      const status = randomElement(['received', 'approved', 'paid', 'paid']);

      // Insertar factura de compra
      const billStmt = db.prepare(`
        INSERT INTO bills (
          bill_number, supplier_id, issue_date, due_date,
          subtotal, tax_amount, total_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      billStmt.run([
        `BILL-${new Date(issueDate).getFullYear()}-${String(i + 1).padStart(5, '0')}`,
        supplierId,
        issueDate,
        dueDate.toISOString().split('T')[0],
        subtotal,
        taxAmount,
        total,
        status
      ]);
      const billId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      billStmt.free();

      // Insertar líneas
      for (const item of items) {
        const lineStmt = db.prepare(`
          INSERT INTO bill_lines (
            bill_id, product_id, description, quantity, unit_price, line_total, taxable
          ) VALUES (?, ?, ?, ?, ?, ?, 1)
        `);
        lineStmt.run([
          billId, item.productId, item.description, item.quantity,
          item.unitPrice, item.lineTotal
        ]);
        lineStmt.free();
      }

      // Si está pagada, crear pago a proveedor
      if (status === 'paid') {
        const paymentStmt = db.prepare(`
          INSERT INTO supplier_payments (
            supplier_id, bill_id, payment_number, payment_date,
            amount, payment_method, reference_number
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        paymentStmt.run([
          supplierId,
          billId,
          `SPAY-${String(stats.payments + 1).padStart(5, '0')}`,
          issueDate,
          total,
          randomElement(['check', 'bank_transfer', 'credit_card']),
          `REF-${randomInt(100000, 999999)}`
        ]);
        paymentStmt.free();
        stats.payments++;
      }

      stats.bills++;
    }

    // 8. Generar Cotizaciones (Quotes)
    console.log('💼 Generando cotizaciones...');

    for (let i = 0; i < cfg.quotes; i++) {
      const customerId = randomElement(customerIds);
      const issueDate = randomDate(startDate, endDate);
      const expirationDate = new Date(issueDate);
      expirationDate.setDate(expirationDate.getDate() + 30);

      const customerRes = db.exec("SELECT florida_county FROM customers WHERE id = ?", [customerId]);
      const county = customerRes[0]?.values[0]?.[0] as string || 'Miami-Dade';
      const taxRateRes = db.exec("SELECT total_rate FROM florida_tax_rates WHERE county_name = ?", [county]);
      const taxRate = taxRateRes[0]?.values[0]?.[0] as number || 0.07;

      const numItems = randomInt(1, 4);
      let subtotal = 0;
      const items: any[] = [];

      for (let j = 0; j < numItems; j++) {
        const productId = randomElement(productIds);
        const productRes = db.exec("SELECT name, price FROM products WHERE id = ?", [productId]);
        const productName = productRes[0]?.values[0]?.[0] as string;
        const productPrice = productRes[0]?.values[0]?.[1] as number;

        const quantity = randomInt(1, 10);
        const unitPrice = productPrice;
        const discount = randomElement([0, 0, 0, 5, 10, 15]); // Mayoría sin descuento
        const lineTotal = quantity * unitPrice * (1 - discount / 100);
        subtotal += lineTotal;

        items.push({
          productId,
          description: productName,
          quantity,
          unitPrice,
          discount,
          lineTotal
        });
      }

      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;
      const status = randomElement(['draft', 'sent', 'sent', 'accepted', 'rejected', 'expired']);

      const quoteStmt = db.prepare(`
        INSERT INTO quotes (
          quote_number, customer_id, issue_date, expiration_date,
          subtotal, tax_amount, total_amount, status, terms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      quoteStmt.run([
        `QT-${new Date(issueDate).getFullYear()}-${String(i + 1).padStart(5, '0')}`,
        customerId,
        issueDate,
        expirationDate.toISOString().split('T')[0],
        subtotal,
        taxAmount,
        total,
        status,
        'Válido por 30 días. Precios sujetos a cambio sin previo aviso.'
      ]);
      const quoteId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      quoteStmt.free();

      for (const item of items) {
        const lineStmt = db.prepare(`
          INSERT INTO quote_lines (
            quote_id, product_id, description, quantity, unit_price,
            discount_percentage, line_total, taxable
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `);
        lineStmt.run([
          quoteId, item.productId, item.description, item.quantity,
          item.unitPrice, item.discount, item.lineTotal
        ]);
        lineStmt.free();
      }

      stats.quotes++;
    }

    // 9. Generar Empleados
    console.log('👨‍💼 Generando empleados...');
    const employeeIds: number[] = [];
    const departments = ['Sales', 'Accounting', 'IT', 'HR', 'Operations', 'Management'];
    const positions = ['Manager', 'Specialist', 'Analyst', 'Coordinator', 'Assistant', 'Director'];

    for (let i = 0; i < cfg.employees; i++) {
      const firstName = randomElement(FIRST_NAMES);
      const lastName = randomElement(LAST_NAMES);
      const hireDate = randomDate(new Date('2020-01-01'), new Date('2025-12-31'));

      const stmt = db.prepare(`
        INSERT INTO employees (
          employee_number, first_name, last_name, email, phone,
          hire_date, department, position, salary_type, salary_rate,
          status, florida_county
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `);
      stmt.run([
        `EMP-${String(i + 1).padStart(5, '0')}`,
        firstName,
        lastName,
        generateEmail(firstName, lastName, 'company.com'),
        generatePhone(),
        hireDate,
        randomElement(departments),
        randomElement(positions),
        randomElement(['monthly', 'hourly']),
        randomFloat(3000, 8000),
        randomElement(FLORIDA_COUNTIES)
      ]);
      const id = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
      employeeIds.push(id);
      stmt.free();
      stats.employees++;
    }

    // 10. Generar Movimientos de Inventario
    console.log('📦 Generando movimientos de inventario...');
    let inventoryMovements = 0;

    // Movimientos de entrada (compras)
    for (let i = 0; i < 100; i++) {
      const productId = randomElement(productIds);
      const quantity = randomInt(10, 100);
      const date = randomDate(startDate, endDate);

      const stmt = db.prepare(`
        INSERT INTO stock_movements (
          product_id, quantity, movement_type, reference_type, reference_id,
          notes, created_at
        ) VALUES (?, ?, 'purchase', 'purchase_order', ?, 'Compra de inventario', ?)
      `);
      stmt.run([productId, quantity, randomInt(1, cfg.bills), date]);
      stmt.free();
      inventoryMovements++;
    }

    // Movimientos de salida (ventas)
    for (let i = 0; i < 100; i++) {
      const productId = randomElement(productIds);
      const quantity = -randomInt(1, 20); // Negativo para salidas
      const date = randomDate(startDate, endDate);

      const stmt = db.prepare(`
        INSERT INTO stock_movements (
          product_id, quantity, movement_type, reference_type, reference_id,
          notes, created_at
        ) VALUES (?, ?, 'sale', 'invoice', ?, 'Venta de producto', ?)
      `);
      stmt.run([productId, quantity, randomInt(1, cfg.invoices), date]);
      stmt.free();
      inventoryMovements++;
    }

    // Ajustes de inventario
    for (let i = 0; i < 30; i++) {
      const productId = randomElement(productIds);
      const quantity = randomInt(-10, 10);
      const date = randomDate(startDate, endDate);

      const stmt = db.prepare(`
        INSERT INTO stock_movements (
          product_id, quantity, movement_type, reference_type, reference_id,
          notes, created_at
        ) VALUES (?, ?, 'adjustment', 'adjustment', 0, 'Ajuste de inventario', ?)
      `);
      stmt.run([productId, quantity, date]);
      stmt.free();
      inventoryMovements++;
    }

    // 11. Generar Asientos Contables de Ejemplo (solo si existe plan de cuentas)
    if (accountCount > 0) {
      console.log('📊 Generando asientos contables...');

      for (let i = 0; i < 50; i++) {
        const entryDate = randomDate(startDate, endDate);
        const amount = randomFloat(100, 10000);

        const journalStmt = db.prepare(`
          INSERT INTO journal_entries (
            entry_date, reference, description, total_debit, total_credit,
            created_by
          ) VALUES (?, ?, ?, ?, ?, 1)
        `);
        journalStmt.run([
          entryDate,
          `JE-${new Date(entryDate).getFullYear()}-${String(i + 1).padStart(5, '0')}`,
          `Asiento contable ${i + 1}`,
          amount,
          amount
        ]);
        const journalId = db.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
        journalStmt.free();

        // Débito
        const debitStmt = db.prepare(`
          INSERT INTO journal_details (
            journal_entry_id, account_code, description, debit_amount, credit_amount
          ) VALUES (?, ?, ?, ?, 0)
        `);
        debitStmt.run([journalId, '1110', 'Débito', amount]);
        debitStmt.free();

        // Crédito
        const creditStmt = db.prepare(`
          INSERT INTO journal_details (
            journal_entry_id, account_code, description, debit_amount, credit_amount
          ) VALUES (?, ?, ?, 0, ?)
        `);
        creditStmt.run([journalId, '4110', 'Crédito', amount]);
        creditStmt.free();

        stats.journalEntries++;
      }
    } else {
      console.log('⏭️ Saltando generación de asientos contables (plan de cuentas vacío)');
    }

    db.run('COMMIT');

    console.log('✅ Generación de datos completada!');
    console.log('📊 Estadísticas:', stats);
    console.log(`📦 Movimientos de inventario: ${inventoryMovements}`);

    return {
      success: true,
      message: 'Datos masivos generados exitosamente',
      stats: { ...stats, inventoryMovements }
    };

  } catch (error: any) {
    db?.run('ROLLBACK');
    console.error('❌ Error generando datos:', error);
    return {
      success: false,
      message: `Error: ${error.message}`,
      stats: {}
    };
  }
}

/**
 * Limpia todos los datos de prueba (CUIDADO!)
 */
export function clearAllTestData(): { success: boolean; message: string } {
  const db = getDB();
  if (!db) return { success: false, message: 'Database not initialized' };

  try {
    db.run('BEGIN TRANSACTION');

    // Orden importante por foreign keys
    const tables = [
      'journal_details', 'journal_entries',
      'invoice_lines', 'payments', 'invoices',
      'bill_lines', 'supplier_payments', 'bills',
      'quote_lines', 'quotes',
      'stock_movements',
      'payroll_line_items', 'payroll_entries', 'payroll_periods', 'employees',
      'reconciliation_matches', 'reconciliation_statements',
      'products', 'product_categories',
      'customers', 'suppliers',
      'bank_accounts'
    ];

    for (const table of tables) {
      db.run(`DELETE FROM ${table}`);
    }

    db.run('COMMIT');

    return { success: true, message: 'Todos los datos de prueba eliminados' };
  } catch (error: any) {
    db?.run('ROLLBACK');
    return { success: false, message: `Error: ${error.message}` };
  }
}
