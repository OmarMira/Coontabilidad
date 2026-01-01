export const AI_SECURITY_CONFIG = {
    allowedTables: [
        'financial_summary',
        'tax_summary_florida',
        'inventory_summary',
        'alerts_summary',
        'v_clientes_reales',
        'v_facturas_reales',
        'v_proveedores_reales',
        'products',  // Acceso limitado para inventario
        'v_invoice_summary',
        'v_tax_alerts',
        'v_audit_kpi',
        'v_florida_tax_summary',
        'v_financial_health',
        'v_customers_summary',
        'v_customers_purchase_ranking',
        'v_suppliers_summary',
        'v_invoice_type_summary',
        'v_top_selling_products'
    ],
    maxContextDataPoints: 50,
    enableAuditLog: true
};
