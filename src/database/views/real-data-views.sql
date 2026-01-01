-- VISTA 1: CLIENTES CON DATOS REALES
CREATE VIEW IF NOT EXISTS v_clientes_reales AS
SELECT 
    COUNT(*) as total_clientes,
    COUNT(CASE WHEN is_active = 1 THEN 1 END) as clientes_activos,
    COUNT(CASE WHEN is_active = 0 THEN 1 END) as clientes_inactivos,
    GROUP_CONCAT(name, ', ') as lista_clientes,
    (SELECT name FROM customers ORDER BY created_at DESC LIMIT 1) as ultimo_cliente
FROM customers;

-- VISTA 2: FACTURAS CON DATOS REALES  
CREATE VIEW IF NOT EXISTS v_facturas_reales AS
SELECT 
    COUNT(*) as total_facturas,
    COUNT(CASE WHEN type IN ('sale', 'invoice') THEN 1 END) as facturas_venta,
    COUNT(CASE WHEN type = 'purchase' THEN 1 END) as facturas_compra,
    SUM(CASE WHEN type IN ('sale', 'invoice') THEN total_amount ELSE 0 END) as total_ventas,
    SUM(CASE WHEN type = 'purchase' THEN total_amount ELSE 0 END) as total_compras,
    MAX(CASE WHEN type IN ('sale', 'invoice') THEN total_amount ELSE 0 END) as mayor_venta,
    MAX(CASE WHEN type = 'purchase' THEN total_amount ELSE 0 END) as mayor_compra
FROM invoices;

-- VISTA 3: PROVEEDORES REALES
CREATE VIEW IF NOT EXISTS v_proveedores_reales AS
SELECT 
    COUNT(*) as total_proveedores,
    GROUP_CONCAT(name, ', ') as lista_proveedores
FROM suppliers;
