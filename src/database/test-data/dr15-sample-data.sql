-- ================================================================
-- DATASET DE PRUEBA FLORIDA DR-15
-- Períodos: Enero, Febrero, Marzo 2026
-- Condados: Miami-Dade (6.5%), Broward (6.0%), Palm Beach (6.0%)
-- Escenario: Restaurante + Retail en Florida
-- ================================================================

-- ENERO 2026 - MIAMI-DADE COUNTY
-- Restaurante "Ocean Grill" - Ventas altas temporada turística

-- Factura 1: Cena corporativa
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (1, 'INV-2026-001', '2026-01-05', 2500.00, 162.50, 2662.50, 'paid', 'Cena corporativa - 20 personas');

-- Factura 2: Evento privado
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (1, 'INV-2026-002', '2026-01-12', 4800.00, 312.00, 5112.00, 'paid', 'Evento privado - Catering completo');

-- Factura 3: Servicio regular
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (1, 'INV-2026-003', '2026-01-18', 1850.00, 120.25, 1970.25, 'paid', 'Servicio de almuerzo corporativo');

-- Factura 4: Fin de semana
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (1, 'INV-2026-004', '2026-01-25', 3200.00, 208.00, 3408.00, 'paid', 'Cena de aniversario');

-- ENERO 2026 - BROWARD COUNTY
-- Tienda "Tech Solutions" - Retail de electrónicos

-- Factura 5: Venta de laptops
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (2, 'INV-2026-005', '2026-01-08', 5600.00, 336.00, 5936.00, 'paid', 'Venta de 4 laptops empresariales');

-- Factura 6: Accesorios y periféricos
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (2, 'INV-2026-006', '2026-01-15', 1200.00, 72.00, 1272.00, 'paid', 'Teclados, mouse, monitores');

-- Factura 7: Servicio técnico
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (2, 'INV-2026-007', '2026-01-22', 890.00, 53.40, 943.40, 'paid', 'Mantenimiento y reparaciones');

-- ENERO 2026 - PALM BEACH COUNTY
-- Boutique "Coastal Fashion" - Ropa y accesorios

-- Factura 8: Venta temporada
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (3, 'INV-2026-008', '2026-01-10', 3400.00, 204.00, 3604.00, 'paid', 'Colección primavera-verano');

-- Factura 9: Accesorios premium
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (3, 'INV-2026-009', '2026-01-20', 2100.00, 126.00, 2226.00, 'paid', 'Bolsos y zapatos de diseñador');

-- ================================================================
-- FEBRERO 2026 - MIAMI-DADE COUNTY
-- ================================================================

-- Factura 10: San Valentín - Evento especial
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (1, 'INV-2026-010', '2026-02-14', 6200.00, 403.00, 6603.00, 'paid', 'Cena San Valentín - Menú especial');

-- Factura 11: Catering corporativo
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (1, 'INV-2026-011', '2026-02-20', 3800.00, 247.00, 4047.00, 'paid', 'Desayuno y almuerzo corporativo');

-- Factura 12: Servicio regular
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (1, 'INV-2026-012', '2026-02-28', 2400.00, 156.00, 2556.00, 'paid', 'Cena familiar - Grupo grande');

-- FEBRERO 2026 - BROWARD COUNTY

-- Factura 13: Equipos de oficina
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (2, 'INV-2026-013', '2026-02-05', 4200.00, 252.00, 4452.00, 'paid', 'Impresoras y escáneres');

-- Factura 14: Software y licencias
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (2, 'INV-2026-014', '2026-02-18', 2800.00, 168.00, 2968.00, 'paid', 'Licencias Microsoft Office');

-- FEBRERO 2026 - PALM BEACH COUNTY

-- Factura 15: Colección nueva
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (3, 'INV-2026-015', '2026-02-12', 5100.00, 306.00, 5406.00, 'paid', 'Nueva colección resort wear');

-- Factura 16: Accesorios
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (3, 'INV-2026-016', '2026-02-25', 1900.00, 114.00, 2014.00, 'paid', 'Joyería y accesorios');

-- ================================================================
-- MARZO 2026 - MIAMI-DADE COUNTY
-- ================================================================

-- Factura 17: Spring Break - Alta temporada
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (1, 'INV-2026-017', '2026-03-15', 7500.00, 487.50, 7987.50, 'paid', 'Spring Break - Evento masivo');

-- Factura 18: Catering empresarial
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (1, 'INV-2026-018', '2026-03-22', 4100.00, 266.50, 4366.50, 'paid', 'Conferencia empresarial');

-- MARZO 2026 - BROWARD COUNTY

-- Factura 19: Renovación equipos
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (2, 'INV-2026-019', '2026-03-10', 8900.00, 534.00, 9434.00, 'paid', 'Renovación completa de equipos');

-- Factura 20: Servicios de instalación
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (2, 'INV-2026-020', '2026-03-25', 1500.00, 90.00, 1590.00, 'paid', 'Instalación y configuración');

-- MARZO 2026 - PALM BEACH COUNTY

-- Factura 21: Temporada alta
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (3, 'INV-2026-021', '2026-03-08', 6800.00, 408.00, 7208.00, 'paid', 'Colección exclusiva primavera');

-- Factura 22: Evento especial
INSERT INTO invoices (customer_id, invoice_number, issue_date, subtotal, tax_amount, total_amount, status, notes)
VALUES (3, 'INV-2026-022', '2026-03-28', 3200.00, 192.00, 3392.00, 'paid', 'Fashion show - Accesorios');

-- ================================================================
-- RESUMEN ESPERADO POR PERÍODO
-- ================================================================

-- ENERO 2026:
--   Miami-Dade:  $12,350.00 subtotal × 6.5% = $802.75 tax
--   Broward:     $7,690.00 subtotal × 6.0% = $461.40 tax
--   Palm Beach:  $5,500.00 subtotal × 6.0% = $330.00 tax
--   TOTAL ENERO: $25,540.00 subtotal, $1,594.15 tax

-- FEBRERO 2026:
--   Miami-Dade:  $12,400.00 subtotal × 6.5% = $806.00 tax
--   Broward:     $7,000.00 subtotal × 6.0% = $420.00 tax
--   Palm Beach:  $7,000.00 subtotal × 6.0% = $420.00 tax
--   TOTAL FEBRERO: $26,400.00 subtotal, $1,646.00 tax

-- MARZO 2026:
--   Miami-Dade:  $11,600.00 subtotal × 6.5% = $754.00 tax
--   Broward:     $10,400.00 subtotal × 6.0% = $624.00 tax
--   Palm Beach:  $10,000.00 subtotal × 6.0% = $600.00 tax
--   TOTAL MARZO: $32,000.00 subtotal, $1,978.00 tax

-- TOTAL 3 MESES: $83,940.00 subtotal, $5,218.15 tax collected
