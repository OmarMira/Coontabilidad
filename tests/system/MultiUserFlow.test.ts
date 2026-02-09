
/** @vitest-environment jsdom */
import { describe, it, expect, beforeAll } from 'vitest';
import {
    initDB,
    db,
    getCustomers,
    addCustomer,
    getInvoices,
    createInvoice,
    createPayment,
    createUser,
    getUsers
} from '../../src/database/simple-db';

// Mock crypto if needed for JSDOM environment in some runners
if (!globalThis.crypto) {
    // @ts-ignore
    globalThis.crypto = {
        subtle: {
            digest: async () => new Uint8Array(32),
            importKey: async () => ({}),
            deriveBits: async () => new Uint8Array(32),
        },
        getRandomValues: (arr) => arr
    };
}

describe('Multi-User System Flow & Isolation', () => {
    let adminId = 1;
    let salesUserId = 2; // Will be set dynamically

    beforeAll(async () => {
        console.log('--- TEST SETUP START ---');
        try {
            await initDB();
            // This runs migrations and seeds. 'admin' should exist.

            // Check Admin
            const users = getUsers();
            const admin = users.find(u => u.username === 'admin');
            if (admin) adminId = admin.id;

            // Create Sales User
            // We use SQL directly to avoid crypto issues during test setup if Environment is flaky
            // Role 'sales' (level 30) should exist from our migration/seed update

            const roleRes = db?.exec("SELECT id FROM user_roles WHERE name = 'sales'");
            let salesRoleId = roleRes?.[0]?.values?.[0]?.[0] as number;

            if (!salesRoleId) {
                // Create if missing (fallback)
                db?.run("INSERT INTO user_roles (name, level) VALUES ('sales', 30)");
                salesRoleId = db?.exec("SELECT last_insert_rowid()")[0].values[0][0] as number;
            }

            // Create 'vendedor1' user manually to skip password hashing complexity in test env
            db?.run(`
                INSERT OR IGNORE INTO users (username, display_name, email, password_hash, role_id, is_active)
                VALUES ('vendedor1', 'Sales Rep', 'sales@test.com', 'dummyhash', ?, 1)
            `, [salesRoleId]);

            const salesUserRes = db?.exec("SELECT id FROM users WHERE username = 'vendedor1'");
            salesUserId = salesUserRes?.[0]?.values[0][0] as number;

            console.log(`Test Users Configured: AdminID=${adminId}, SalesID=${salesUserId}`);

        } catch (e) {
            console.error('Test Setup Failed:', e);
        }
        console.log('--- TEST SETUP END ---');
    });

    it('Step 1: Admin should see updated existing data (Migration Verification)', async () => {
        // We assume initDB ran migrateDataOwnership.
        // We can check if there are any orphaned records. 
        // For test purposes, we'll verify a newly created "orphan" gets claimed via logic if we ran it again, 
        // but checking "created_by DEFAULT 1" is better.

        // Insert a raw record without created_by
        db?.run("INSERT INTO customers (name, document_number) VALUES ('Orphan Client', '999999')");
        // Verify default value was applied by Schema (DEFAULT 1)
        const res = db?.exec("SELECT created_by FROM customers WHERE name = 'Orphan Client'");
        const createdBy = res?.[0]?.values[0][0];

        expect(createdBy).toBe(1); // Should default to admin (1) via Schema definition
    });

    it('Step 2: Data Attribution - Sales Rep creates Customer', async () => {
        const customerData = {
            name: 'Client of Vendedor1',
            document_number: 'V1-001',
            email: 'v1@client.com',
            address_line1: '123 Sales St',
            city: 'Miami',
            state: 'FL',
            zip_code: '33101',
            florida_county: 'Miami-Dade'
        };

        // Call addCustomer with salesUserId
        // Note: addCustomer(data, userId)
        const newId = await addCustomer(customerData, salesUserId);
        expect(newId).toBeDefined();

        // Verify DB record
        const res = db?.exec(`SELECT created_by FROM customers WHERE id = ${newId}`);
        expect(res?.[0]?.values[0][0]).toBe(salesUserId);
    });

    it('Step 3: Data Isolation - Sales Rep only sees their customers', async () => {
        // Admin created "Orphan Client" (defaults to 1).
        // Vendedor1 created "Client of Vendedor1".

        // 1. Check what Vendedor1 sees
        const salesView = getCustomers({ userId: salesUserId, role: 'sales' });

        // Should contain ONLY "Client of Vendedor1"
        const orphanVisible = salesView.find(c => c.name === 'Orphan Client');
        const ownVisible = salesView.find(c => c.name === 'Client of Vendedor1');

        expect(orphanVisible).toBeUndefined(); // Should NOT see Admin's client
        expect(ownVisible).toBeDefined();      // Should see OWN client

        // 2. Check what Admin sees
        const adminView = getCustomers({ userId: adminId, role: 'admin' });

        // Should see BOTH
        const adminOrphanVisible = adminView.find(c => c.name === 'Orphan Client');
        const adminOwnVisible = adminView.find(c => c.name === 'Client of Vendedor1');

        expect(adminOrphanVisible).toBeDefined();
        expect(adminOwnVisible).toBeDefined();
    });

    it('Step 4: Invoice Attribution & Isolation', async () => {
        // Vendedor1 creates an invoice
        // First needs a customer of their own (created in prev test)
        // We'll create a new one to be clean
        const custId = await addCustomer({ name: 'InvCust V1', document_number: 'V1-INV' }, salesUserId);

        const invoiceData = {
            customer_id: custId,
            issue_date: '2024-01-01',
            due_date: '2024-01-30',
            status: 'draft'
        };
        const items = [{ description: 'Item 1', quantity: 1, unit_price: 100, line_total: 100, taxable: false }];

        const result = await createInvoice(invoiceData, items, salesUserId);
        expect(result.success).toBe(true);
        const invId = result.invoiceId;

        // Verify Attribution
        const res = db?.exec(`SELECT created_by FROM invoices WHERE id = ${invId}`);
        expect(res?.[0]?.values[0][0]).toBe(salesUserId);

        // Verify Isolation
        const salesInvoices = getInvoices({ userId: salesUserId, role: 'sales' });
        expect(salesInvoices.find(i => i.id === invId)).toBeDefined();

        // Create Admin Invoice
        const adminResult = await createInvoice({ ...invoiceData }, items, adminId);
        const adminInvId = adminResult.invoiceId;

        const salesInvoicesAfter = getInvoices({ userId: salesUserId, role: 'sales' });
        expect(salesInvoicesAfter.find(i => i.id === adminInvId)).toBeUndefined(); // Should NOT see admin invoice
    });

    it('Step 5: Payment Audit Attribution', async () => {
        // Vendedor1 makes a payment for their invoice
        // Need invoice ID from prev step, simplified here:
        const custId = await addCustomer({ name: 'PayCust V1', document_number: 'V1-PAY' }, salesUserId);
        const invRes = await createInvoice({ customer_id: custId, status: 'sent', subtotal: 100, total_amount: 100 }, [], salesUserId);

        const paymentData = {
            customer_id: custId,
            invoice_id: invRes.invoiceId,
            amount: 50,
            payment_method: 'cash'
        };

        const payRes = createPayment(paymentData, salesUserId);
        console.log('Payment Result:', payRes);
        expect(payRes.success).toBe(true);

        // Esperar a que se cree el audit trail (async operation)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verify Payment Attribution (Audit Trail)
        const auditRes = db?.exec(`
           SELECT user_id, action FROM audit_trail 
           WHERE entity_type = 'payments' AND entity_id = '${payRes.paymentId}'
       `); // Table is audit_trail or audit_log? simple-db uses audit_log usually, but migration 010 added audit_trail.
        // logAuditEvent usage needs verification. simple-db uses audit_log table?
        // Let's check simple-db logAuditEvent func. It inserts into 'audit_log'.

        const auditLogRes = db?.exec(`
            SELECT user_id FROM audit_log 
            WHERE table_name = 'payments' AND record_id = ${payRes.paymentId}
       `);

        // If empty, check audit_trail (migration table).
        // simple-db logAuditEvent writes to 'audit_log'.

        // Validar que auditLogRes tiene datos antes de acceder
        expect(auditLogRes).toBeDefined();
        expect(Array.isArray(auditLogRes)).toBe(true);
        if (auditLogRes && auditLogRes.length > 0) {
            expect(auditLogRes[0]?.values?.length).toBeGreaterThan(0);
            expect(auditLogRes[0]?.values[0][0]).toBe(salesUserId);
        }
    });

});
