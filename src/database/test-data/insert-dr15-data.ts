/**
 * SCRIPT DE INSERCIÓN DE DATOS DE PRUEBA DR-15
 * 
 * Este script inserta datos de prueba realistas para validar
 * el generador de reportes DR-15 de Florida.
 * 
 * Ejecutar desde consola del navegador:
 * 1. Abrir http://localhost:3000
 * 2. Abrir DevTools (F12)
 * 3. Copiar y pegar este código en la consola
 * 4. Ejecutar: await insertDR15TestData()
 */

async function insertDR15TestData() {
    console.log('🚀 Iniciando inserción de datos de prueba DR-15...');

    try {
        // Importar funciones de base de datos
        const { addCustomer, createInvoice } = await import('./database/simple-db');

        // ================================================================
        // PASO 1: CREAR CLIENTES DE PRUEBA
        // ================================================================

        console.log('📝 Creando clientes de prueba...');

        // Cliente 1: Miami-Dade County (Restaurante)
        const customer1 = await addCustomer({
            name: 'Ocean Grill Corp',
            business_name: 'Ocean Grill Miami',
            email: 'info@oceangrill.com',
            phone: '305-555-0100',
            address_line1: '1200 Ocean Drive',
            city: 'Miami Beach',
            state: 'FL',
            zip_code: '33139',
            florida_county: 'Miami-Dade',
            tax_exempt: false,
            credit_limit: 50000,
            payment_terms: 30,
            status: 'active'
        });

        // Cliente 2: Broward County (Tech Retail)
        const customer2 = await addCustomer({
            name: 'Tech Solutions LLC',
            business_name: 'Tech Solutions Fort Lauderdale',
            email: 'sales@techsolutions.com',
            phone: '954-555-0200',
            address_line1: '500 E Las Olas Blvd',
            city: 'Fort Lauderdale',
            state: 'FL',
            zip_code: '33301',
            florida_county: 'Broward',
            tax_exempt: false,
            credit_limit: 75000,
            payment_terms: 30,
            status: 'active'
        });

        // Cliente 3: Palm Beach County (Boutique)
        const customer3 = await addCustomer({
            name: 'Coastal Fashion Inc',
            business_name: 'Coastal Fashion Boutique',
            email: 'contact@coastalfashion.com',
            phone: '561-555-0300',
            address_line1: '200 Worth Avenue',
            city: 'Palm Beach',
            state: 'FL',
            zip_code: '33480',
            florida_county: 'Palm Beach',
            tax_exempt: false,
            credit_limit: 60000,
            payment_terms: 30,
            status: 'active'
        });

        console.log(`✅ Clientes creados: ${customer1}, ${customer2}, ${customer3}`);

        // ================================================================
        // PASO 2: CREAR FACTURAS - ENERO 2026
        // ================================================================

        console.log('📄 Creando facturas de Enero 2026...');

        const invoicesEnero = [
            // Miami-Dade
            { customer_id: customer1, invoice_number: 'INV-2026-001', issue_date: '2026-01-05', subtotal: 2500.00, tax_amount: 162.50, notes: 'Cena corporativa - 20 personas' },
            { customer_id: customer1, invoice_number: 'INV-2026-002', issue_date: '2026-01-12', subtotal: 4800.00, tax_amount: 312.00, notes: 'Evento privado - Catering completo' },
            { customer_id: customer1, invoice_number: 'INV-2026-003', issue_date: '2026-01-18', subtotal: 1850.00, tax_amount: 120.25, notes: 'Servicio de almuerzo corporativo' },
            { customer_id: customer1, invoice_number: 'INV-2026-004', issue_date: '2026-01-25', subtotal: 3200.00, tax_amount: 208.00, notes: 'Cena de aniversario' },

            // Broward
            { customer_id: customer2, invoice_number: 'INV-2026-005', issue_date: '2026-01-08', subtotal: 5600.00, tax_amount: 336.00, notes: 'Venta de 4 laptops empresariales' },
            { customer_id: customer2, invoice_number: 'INV-2026-006', issue_date: '2026-01-15', subtotal: 1200.00, tax_amount: 72.00, notes: 'Teclados, mouse, monitores' },
            { customer_id: customer2, invoice_number: 'INV-2026-007', issue_date: '2026-01-22', subtotal: 890.00, tax_amount: 53.40, notes: 'Mantenimiento y reparaciones' },

            // Palm Beach
            { customer_id: customer3, invoice_number: 'INV-2026-008', issue_date: '2026-01-10', subtotal: 3400.00, tax_amount: 204.00, notes: 'Colección primavera-verano' },
            { customer_id: customer3, invoice_number: 'INV-2026-009', issue_date: '2026-01-20', subtotal: 2100.00, tax_amount: 126.00, notes: 'Bolsos y zapatos de diseñador' }
        ];

        for (const inv of invoicesEnero) {
            await createInvoice({
                customer_id: inv.customer_id,
                invoice_number: inv.invoice_number,
                issue_date: inv.issue_date,
                due_date: new Date(new Date(inv.issue_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                subtotal: inv.subtotal,
                tax_amount: inv.tax_amount,
                total_amount: inv.subtotal + inv.tax_amount,
                status: 'paid',
                notes: inv.notes
            }, []);
        }

        console.log(`✅ ${invoicesEnero.length} facturas de Enero creadas`);

        // ================================================================
        // PASO 3: CREAR FACTURAS - FEBRERO 2026
        // ================================================================

        console.log('📄 Creando facturas de Febrero 2026...');

        const invoicesFebrero = [
            // Miami-Dade
            { customer_id: customer1, invoice_number: 'INV-2026-010', issue_date: '2026-02-14', subtotal: 6200.00, tax_amount: 403.00, notes: 'Cena San Valentín - Menú especial' },
            { customer_id: customer1, invoice_number: 'INV-2026-011', issue_date: '2026-02-20', subtotal: 3800.00, tax_amount: 247.00, notes: 'Desayuno y almuerzo corporativo' },
            { customer_id: customer1, invoice_number: 'INV-2026-012', issue_date: '2026-02-28', subtotal: 2400.00, tax_amount: 156.00, notes: 'Cena familiar - Grupo grande' },

            // Broward
            { customer_id: customer2, invoice_number: 'INV-2026-013', issue_date: '2026-02-05', subtotal: 4200.00, tax_amount: 252.00, notes: 'Impresoras y escáneres' },
            { customer_id: customer2, invoice_number: 'INV-2026-014', issue_date: '2026-02-18', subtotal: 2800.00, tax_amount: 168.00, notes: 'Licencias Microsoft Office' },

            // Palm Beach
            { customer_id: customer3, invoice_number: 'INV-2026-015', issue_date: '2026-02-12', subtotal: 5100.00, tax_amount: 306.00, notes: 'Nueva colección resort wear' },
            { customer_id: customer3, invoice_number: 'INV-2026-016', issue_date: '2026-02-25', subtotal: 1900.00, tax_amount: 114.00, notes: 'Joyería y accesorios' }
        ];

        for (const inv of invoicesFebrero) {
            await createInvoice({
                customer_id: inv.customer_id,
                invoice_number: inv.invoice_number,
                issue_date: inv.issue_date,
                due_date: new Date(new Date(inv.issue_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                subtotal: inv.subtotal,
                tax_amount: inv.tax_amount,
                total_amount: inv.subtotal + inv.tax_amount,
                status: 'paid',
                notes: inv.notes
            }, []);
        }

        console.log(`✅ ${invoicesFebrero.length} facturas de Febrero creadas`);

        // ================================================================
        // PASO 4: CREAR FACTURAS - MARZO 2026
        // ================================================================

        console.log('📄 Creando facturas de Marzo 2026...');

        const invoicesMarzo = [
            // Miami-Dade
            { customer_id: customer1, invoice_number: 'INV-2026-017', issue_date: '2026-03-15', subtotal: 7500.00, tax_amount: 487.50, notes: 'Spring Break - Evento masivo' },
            { customer_id: customer1, invoice_number: 'INV-2026-018', issue_date: '2026-03-22', subtotal: 4100.00, tax_amount: 266.50, notes: 'Conferencia empresarial' },

            // Broward
            { customer_id: customer2, invoice_number: 'INV-2026-019', issue_date: '2026-03-10', subtotal: 8900.00, tax_amount: 534.00, notes: 'Renovación completa de equipos' },
            { customer_id: customer2, invoice_number: 'INV-2026-020', issue_date: '2026-03-25', subtotal: 1500.00, tax_amount: 90.00, notes: 'Instalación y configuración' },

            // Palm Beach
            { customer_id: customer3, invoice_number: 'INV-2026-021', issue_date: '2026-03-08', subtotal: 6800.00, tax_amount: 408.00, notes: 'Colección exclusiva primavera' },
            { customer_id: customer3, invoice_number: 'INV-2026-022', issue_date: '2026-03-28', subtotal: 3200.00, tax_amount: 192.00, notes: 'Fashion show - Accesorios' }
        ];

        for (const inv of invoicesMarzo) {
            await createInvoice({
                customer_id: inv.customer_id,
                invoice_number: inv.invoice_number,
                issue_date: inv.issue_date,
                due_date: new Date(new Date(inv.issue_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                subtotal: inv.subtotal,
                tax_amount: inv.tax_amount,
                total_amount: inv.subtotal + inv.tax_amount,
                status: 'paid',
                notes: inv.notes
            }, []);
        }

        console.log(`✅ ${invoicesMarzo.length} facturas de Marzo creadas`);

        // ================================================================
        // RESUMEN FINAL
        // ================================================================

        console.log('\n📊 RESUMEN DE DATOS INSERTADOS:');
        console.log('================================');
        console.log('✅ 3 Clientes creados');
        console.log('✅ 22 Facturas creadas (9 Enero + 7 Febrero + 6 Marzo)');
        console.log('\n💰 TOTALES ESPERADOS POR MES:');
        console.log('Enero 2026:   $25,540.00 subtotal, $1,594.15 tax');
        console.log('Febrero 2026: $26,400.00 subtotal, $1,646.00 tax');
        console.log('Marzo 2026:   $32,000.00 subtotal, $1,978.00 tax');
        console.log('\n🎯 TOTAL 3 MESES: $83,940.00 subtotal, $5,218.15 tax');
        console.log('\n✅ Datos de prueba DR-15 insertados correctamente!');

        return {
            success: true,
            customers: 3,
            invoices: 22,
            totalSubtotal: 83940.00,
            totalTax: 5218.15
        };

    } catch (error) {
        console.error('❌ Error insertando datos de prueba:', error);
        throw error;
    }
}

// Exportar para uso en consola
if (typeof window !== 'undefined') {
    (window as any).insertDR15TestData = insertDR15TestData;
    console.log('✅ Función insertDR15TestData() disponible en consola');
    console.log('💡 Ejecutar: await insertDR15TestData()');
}
