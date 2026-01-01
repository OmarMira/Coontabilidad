-- VISTAS DE SOLO LECTURA PARA IA LOCAL - ADAPTADAS AL ESQUEMA REAL
-- Estas vistas exponen solo datos agregados/anónimos para análisis
-- Acceso: EXCLUSIVAMENTE para LocalAIService.ts

-- 1. RESUMEN DE FACTURACIÓN (para análisis de ventas)
CREATE VIEW IF NOT EXISTS v_invoice_summary AS
SELECT 
    i.id,
    i.invoice_number as number,
    i.issue_date as date,
    'sale' as type,
    c.name as customer_name,
    c.florida_county as county,
    i.subtotal,
    i.tax_amount,
    i.total_amount as total,
    COUNT(il.id) as line_count
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
LEFT JOIN invoice_lines il ON i.id = il.invoice_id
WHERE i.issue_date >= date('now', '-90 days')
GROUP BY i.id
ORDER BY i.issue_date DESC;

-- 2. ALERTAS FISCALES FLORIDA (para monitoreo proactivo)
-- Adaptada para usar florida_tax_rates ya que tax_transactions no existe en el esquema base
CREATE VIEW IF NOT EXISTS v_tax_alerts AS
SELECT 
    'TAX_DISCREPANCY' as alert_type,
    i.id as invoice_id,
    c.florida_county as county,
    i.subtotal as taxable_base,
    i.tax_amount,
    tr.total_rate as expected_rate,
    ROUND((i.tax_amount / NULLIF(i.subtotal, 0)), 4) as calculated_rate,
    ABS(ROUND((i.tax_amount / NULLIF(i.subtotal, 0)), 4) - tr.total_rate) as discrepancy_percentage,
    CASE 
        WHEN ABS(ROUND((i.tax_amount / NULLIF(i.subtotal, 0)), 4) - tr.total_rate) > 0.01 THEN 'HIGH'
        WHEN ABS(ROUND((i.tax_amount / NULLIF(i.subtotal, 0)), 4) - tr.total_rate) > 0.001 THEN 'MEDIUM'
        ELSE 'LOW'
    END as severity
FROM invoices i
JOIN customers c ON i.customer_id = c.id
JOIN florida_tax_rates tr ON c.florida_county = tr.county_name
WHERE ABS(ROUND((i.tax_amount / NULLIF(i.subtotal, 0)), 4) - tr.total_rate) > 0.0001
UNION ALL
SELECT 
    'MISSING_COUNTY' as alert_type,
    i.id as invoice_id,
    NULL as county,
    i.subtotal as taxable_base,
    i.tax_amount,
    NULL as expected_rate,
    NULL as calculated_rate,
    100 as discrepancy_percentage,
    'HIGH' as severity
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id
WHERE (c.florida_county IS NULL OR c.florida_county = '')
    AND i.issue_date >= date('now', '-30 days');

-- 3. KPIs DE AUDITORÍA (para integridad del hash-chain)
-- Basada en audit_log real
CREATE VIEW IF NOT EXISTS v_audit_kpi AS
SELECT
    'HASH_CHAIN_INTEGRITY' as kpi_name,
    COUNT(*) as total_events,
    MIN(timestamp) as first_event,
    MAX(timestamp) as last_event,
    COUNT(DISTINCT table_name) as entities_monitored,
    -- Verificación de integridad de cadena
    SUM(CASE WHEN audit_hash IS NULL THEN 1 ELSE 0 END) as non_hashed_blocks,
    SUM(CASE WHEN audit_hash IS NOT NULL THEN 1 ELSE 0 END) as hashed_blocks,
    -- Últimas 24 horas
    SUM(CASE WHEN timestamp >= datetime('now', '-24 hours') THEN 1 ELSE 0 END) as events_last_24h
FROM audit_log;

-- 4. DATOS FISCALES FLORIDA (para explicaciones de DR-15)
CREATE VIEW IF NOT EXISTS v_florida_tax_summary AS
SELECT
    c.florida_county as county,
    tr.total_rate as current_rate,
    COUNT(DISTINCT i.id) as invoice_count,
    SUM(i.subtotal) as total_taxable_base,
    SUM(i.tax_amount) as total_tax_collected,
    MIN(i.issue_date) as first_calculation,
    MAX(i.issue_date) as last_calculation,
    -- Para DR-15
    strftime('%Y', i.issue_date) as report_year,
    strftime('%m', i.issue_date) as report_month
FROM invoices i
JOIN customers c ON i.customer_id = c.id
JOIN florida_tax_rates tr ON c.florida_county = tr.county_name
GROUP BY c.florida_county, report_year, report_month
ORDER BY report_year DESC, report_month DESC, c.florida_county;

-- 5. SALUD FINANCIERA (para análisis de patrones)
CREATE VIEW IF NOT EXISTS v_financial_health AS
SELECT
    'LIQUIDITY' as metric_category,
    COUNT(DISTINCT je.id) as total_journal_entries,
    SUM(jd.debit_amount) as cash_inflows,
    SUM(jd.credit_amount) as cash_outflows,
    strftime('%Y-%m', je.entry_date) as period
FROM journal_entries je
JOIN journal_details jd ON je.id = jd.journal_entry_id
WHERE jd.account_code LIKE '11%' -- Cuentas de disponibilidad (Caja/Banco)
  AND je.entry_date >= date('now', '-180 days')
GROUP BY period
UNION ALL
SELECT
    'TAX_BURDEN' as metric_category,
    COUNT(DISTINCT i.id) as invoice_count,
    SUM(i.subtotal) as taxable_sales,
    SUM(i.tax_amount) as tax_collected,
    strftime('%Y-%m', i.issue_date) as period
FROM invoices i
WHERE i.issue_date >= date('now', '-180 days')
GROUP BY period;
