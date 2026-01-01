-- VISTAS SQL OPTIMIZADAS PARA IA (AccountExpress Next-Gen)
-- Adaptadas al esquema real: florida_county, total_amount, bills vs invoices.

-- A. RESUMEN COMPLETO DE CLIENTES
CREATE VIEW IF NOT EXISTS v_customers_summary AS
SELECT 
    COUNT(DISTINCT id) as total_customers,
    COUNT(DISTINCT CASE WHEN status = 'active' THEN id END) as active_customers,
    COUNT(DISTINCT florida_county) as counties_covered,
    GROUP_CONCAT(DISTINCT florida_county) as counties_list,
    MAX(created_at) as latest_customer_added
FROM customers;

-- B. RANKING DE CLIENTES POR COMPRAS (Ventas para nosotros)
CREATE VIEW IF NOT EXISTS v_customers_purchase_ranking AS
SELECT 
    c.id,
    c.name,
    c.florida_county as county,
    COUNT(DISTINCT i.id) as purchase_count,
    SUM(i.total_amount) as total_purchased,
    MAX(i.issue_date) as last_purchase_date,
    RANK() OVER (ORDER BY SUM(i.total_amount) DESC) as purchase_rank
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
GROUP BY c.id
ORDER BY total_purchased DESC NULLS LAST;

-- C. RESUMEN DE PROVEEDORES (SUPPLIERS)
CREATE VIEW IF NOT EXISTS v_suppliers_summary AS
SELECT 
    s.id,
    s.name as supplier_name,
    COUNT(DISTINCT b.id) as invoice_count,
    SUM(b.total_amount) as total_amount,
    AVG(b.total_amount) as average_invoice,
    MIN(b.issue_date) as first_purchase,
    MAX(b.issue_date) as last_purchase,
    RANK() OVER (ORDER BY SUM(b.total_amount) DESC) as supplier_rank
FROM suppliers s
JOIN bills b ON s.id = b.supplier_id
GROUP BY s.id
ORDER BY total_amount DESC;

-- D. RESUMEN GLOBAL COMPRA vs VENTA
CREATE VIEW IF NOT EXISTS v_invoice_type_summary AS
SELECT 
    'Venta' as type,
    COUNT(*) as count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as average_amount,
    MAX(issue_date) as last_date
FROM invoices
UNION ALL
SELECT 
    'Compra' as type,
    COUNT(*) as count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as average_amount,
    MAX(issue_date) as last_date
FROM bills;

-- E. PRODUCTOS MÁS VENDIDOS
CREATE VIEW IF NOT EXISTS v_top_selling_products AS
SELECT 
    p.id,
    p.sku,
    p.name,
    pc.name as category,
    COUNT(DISTINCT il.invoice_id) as times_sold,
    SUM(il.quantity) as total_quantity,
    SUM(il.line_total) as total_revenue,
    RANK() OVER (ORDER BY SUM(il.line_total) DESC) as rank
FROM products p
JOIN product_categories pc ON p.category_id = pc.id
JOIN invoice_lines il ON p.id = il.product_id
JOIN invoices i ON il.invoice_id = i.id
GROUP BY p.id
HAVING total_revenue > 0
ORDER BY total_revenue DESC
LIMIT 20;
