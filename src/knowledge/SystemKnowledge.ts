import { getCustomers, getInvoices, getProducts } from '../database/simple-db';

/**
 * BASE DE CONOCIMIENTO DEL SISTEMA - GUÍAS Y OPERACIONES
 * 
 * Contiene guías paso a paso para todas las operaciones del sistema
 * y conocimiento contable especializado para Florida
 */

// ===========================================
// DATOS EN TIEMPO REAL (DINÁMICO)
// ===========================================

export const getSystemStats = () => {
    const customers = getCustomers();
    const invoices = getInvoices();
    const products = getProducts();

    return {
        customerCount: customers.length,
        invoiceCount: invoices.length,
        productCount: products.length,
        revenue: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
        pendingAmount: invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
    };
};

interface SystemGuide {
    title: string;
    description?: string;
    steps: string[];
    tips?: string[];
    relatedMenu: string;
    category: 'ventas' | 'compras' | 'inventario' | 'contabilidad' | 'impuestos' | 'sistema';
}

export const SYSTEM_GUIDES: Record<string, SystemGuide> = {
    // VENTAS
    createInvoice: {
        title: '¿Cómo crear una factura de venta?',
        description: 'Proceso para registrar una venta a cliente',
        steps: [
            'Ve al menú "CUENTAS POR COBRAR" en el sidebar',
            'Haz clic en "Facturas de Venta"',
            'Presiona el botón "Nueva Factura"',
            'Selecciona un cliente existente o crea uno nuevo',
            'Agrega los productos o servicios a facturar',
            'Verifica que el impuesto de Florida se calcule automáticamente',
            'Ingresa la forma de pago y términos',
            'Haz clic en "Guardar Factura"'
        ],
        tips: [
            'El sistema calcula automáticamente el impuesto según el condado del cliente',
            'Puedes agregar descuentos por línea o al total',
            'Los asientos contables se generan automáticamente'
        ],
        relatedMenu: 'CUENTAS POR COBRAR > Facturas de Venta',
        category: 'ventas'
    },

    createCustomer: {
        title: '¿Cómo registrar un nuevo cliente?',
        description: 'Agregar un cliente al sistema',
        steps: [
            'Ve al menú "CUENTAS POR COBRAR" en el sidebar',
            'Haz clic en "Clientes"',
            'Presiona el botón "Nuevo Cliente"',
            'Ingresa el nombre o razón social del cliente',
            'Completa la dirección incluyendo CONDADO (importante para impuestos)',
            'Agrega email, teléfono y términos de pago',
            'Haz clic en "Guardar"'
        ],
        tips: [
            'El condado es obligatorio para calcular correctamente los impuestos de Florida',
            'Puedes asignar crédito máximo y días de pago',
            'El sistema tiene autocompletado de direcciones'
        ],
        relatedMenu: 'CUENTAS POR COBRAR > Clientes',
        category: 'ventas'
    },

    // COMPRAS
    createBill: {
        title: '¿Cómo registrar una factura de compra?',
        description: 'Registrar gastos y compras a proveedores',
        steps: [
            'Ve al menú "CUENTAS POR PAGAR" en el sidebar',
            'Haz clic en "Facturas de Compra"',
            'Presiona "Nueva Factura de Compra"',
            'Selecciona el proveedor',
            'Ingresa el número de factura del proveedor',
            'Agrega los productos o gastos',
            'Verifica los impuestos y totales',
            'Guarda la factura'
        ],
        tips: [
            'Asocia la compra con la cuenta contable correcta',
            'Puedes programar la fecha de vencimiento para control de pagos'
        ],
        relatedMenu: 'CUENTAS POR PAGAR > Facturas de Compra',
        category: 'compras'
    },

    createSupplier: {
        title: '¿Cómo registrar un proveedor?',
        description: 'Agregar un nuevo proveedor al sistema',
        steps: [
            'Ve al menú "CUENTAS POR PAGAR"',
            'Haz clic en "Proveedores"',
            'Presiona "Nuevo Proveedor"',
            'Ingresa nombre, dirección y datos de contacto',
            'Configura los términos de pago',
            'Guarda el registro'
        ],
        tips: [
            'Puedes clasificar proveedores por categoría',
            'Agrega información bancaria para pagos electrónicos'
        ],
        relatedMenu: 'CUENTAS POR PAGAR > Proveedores',
        category: 'compras'
    },

    // INVENTARIO
    createProduct: {
        title: '¿Cómo agregar un producto al inventario?',
        description: 'Registrar productos o servicios',
        steps: [
            'Ve al menú "INVENTARIO"',
            'Haz clic en "Productos y Servicios"',
            'Presiona "Nuevo Producto"',
            'Ingresa nombre, descripción y SKU',
            'Define si es PRODUCTO (tiene stock) o SERVICIO (sin stock)',
            'Configura precios de compra y venta',
            'Asigna una categoría',
            'Define el stock mínimo para alertas',
            'Guarda el producto'
        ],
        tips: [
            'Los productos controlan inventario automáticamente',
            'Los servicios no afectan el stock',
            'Puedes definir múltiples unidades de medida'
        ],
        relatedMenu: 'INVENTARIO > Productos y Servicios',
        category: 'inventario'
    },

    // IMPUESTOS FLORIDA
    generateDR15: {
        title: '¿Cómo generar el reporte DR-15?',
        description: 'Reporte de impuestos Florida por período',
        steps: [
            'Ve al menú "IMPUESTOS FLORIDA"',
            'Haz clic en "Reportes DR-15"',
            'Presiona "Nuevo Reporte"',
            'Selecciona el período fiscal (trimestre/mes)',
            'Haz clic en "Calcular Reporte"',
            'Revisa el desglose por condado',
            'Verifica ventas gravables, exentas e impuesto total',
            'Guarda o exporta el reporte'
        ],
        tips: [
            'El sistema agrupa automáticamente las ventas por condado',
            'Las tasas se actualizan según la configuración de cada condado',
            'Puedes exportar a PDF para presentación al estado'
        ],
        relatedMenu: 'IMPUESTOS FLORIDA > Reportes DR-15',
        category: 'impuestos'
    },

    viewTaxRates: {
        title: '¿Cómo ver las tasas de impuesto por condado?',
        description: 'Consultar y configurar tasas de Florida',
        steps: [
            'Ve al menú "IMPUESTOS FLORIDA"',
            'Haz clic en "Tasas por Condado"',
            'Verás los 67 condados de Florida con sus tasas',
            'Cada condado muestra: tasa base (6%) + surtax local',
            'Puedes buscar por nombre de condado'
        ],
        tips: [
            'Miami-Dade tiene 7.5% (6% + 1.5% surtax)',
            'Broward tiene 7.0% (6% + 1% surtax)',
            'Las tasas se aplican automáticamente según la dirección del cliente'
        ],
        relatedMenu: 'IMPUESTOS FLORIDA > Tasas por Condado',
        category: 'impuestos'
    },

    // CONTABILIDAD
    viewBalance: {
        title: '¿Cómo ver el Balance General?',
        description: 'Estado de situación financiera',
        steps: [
            'Ve al menú "CONTABILIDAD"',
            'Haz clic en "Reportes Financieros"',
            'Selecciona "Balance General"',
            'Elige el período a consultar',
            'Visualiza Activos, Pasivos y Patrimonio'
        ],
        tips: [
            'El balance siempre debe cuadrar: ACTIVO = PASIVO + PATRIMONIO',
            'Los movimientos de ventas y compras actualizan el balance automáticamente',
            'Puedes exportar a Excel para análisis'
        ],
        relatedMenu: 'CONTABILIDAD > Reportes Financieros',
        category: 'contabilidad'
    },

    // SISTEMA
    createBackup: {
        title: '¿Cómo crear un respaldo de la base de datos?',
        description: 'Exportar backup cifrado .aex',
        steps: [
            'Ve al menú "ARCHIVO"',
            'Haz clic en "Respaldos y Restauración"',
            'Presiona "Crear Nuevo Respaldo"',
            'Ingresa una contraseña segura para cifrar',
            'Confirma la contraseña',
            'Espera a que se genere el archivo .aex',
            'El archivo se descargará automáticamente'
        ],
        tips: [
            'El backup está cifrado con AES-256-GCM',
            'Guarda la contraseña en un lugar seguro',
            'Se recomienda hacer respaldos semanales'
        ],
        relatedMenu: 'ARCHIVO > Respaldos y Restauración',
        category: 'sistema'
    },

    restoreBackup: {
        title: '¿Cómo restaurar un respaldo?',
        description: 'Importar backup cifrado .aex',
        steps: [
            'Ve al menú "ARCHIVO"',
            'Haz clic en "Respaldos y Restauración"',
            'Presiona "Restaurar Respaldo"',
            'Selecciona el archivo .aex a restaurar',
            'Ingresa la contraseña del respaldo',
            'Confirma que deseas reemplazar los datos actuales',
            'Espera a que se complete la restauración'
        ],
        tips: [
            '⚠️ ADVERTENCIA: La restauración reemplaza todos los datos actuales',
            'Haz un respaldo antes de restaurar si tienes datos importantes',
            'Solo funcionará si la contraseña es correcta'
        ],
        relatedMenu: 'ARCHIVO > Respaldos y Restauración',
        category: 'sistema'
    },

    // CONCILIACIÓN
    bankReconciliation: {
        title: '¿Cómo conciliar una cuenta bancaria paso a paso?',
        description: 'Proceso de cuadre entre banco y registros locales',
        steps: [
            'Navega a "HERRAMIENTAS" > "Cuentas Bancarias"',
            'Selecciona la cuenta bancaria a conciliar',
            'Haz clic en "Importar Estado de Cuenta"',
            'Sube tu archivo OFX, CSV o PDF bancario',
            'El sistema macheará automáticamente por monto y fecha',
            'Revisa los movimientos marcados en amarillo (diferencias)',
            'Asocia los movimientos no encontrados con facturas o gastos existentes',
            'Haz clic en "Finalizar Conciliación" cuando el saldo coincida'
        ],
        tips: [
            'Usa archivos OFX para mayor precisión en el matching',
            'El sistema sugiere la cuenta contable de gasto según el nombre del comercio'
        ],
        relatedMenu: 'HERRAMIENTAS > Cuentas Bancarias',
        category: 'contabilidad'
    },

    // PRESTAMOS
    loanPayment: {
        title: '¿Cómo registrar el pago de un préstamo?',
        description: 'Afectación de cuentas al pagar deuda financiera',
        steps: [
            'Ve a "CONTABILIDAD" > "Asientos Contables"',
            'Crea un nuevo asiento manual',
            'Debita la cuenta de "Pasivo: Préstamos Bancarios" (para reducir deuda)',
            'Debita la cuenta de "Gastos: Intereses Bancarios" (por la porción de interés)',
            'Acredita la cuenta de "Activo: Banco" (de donde sale el dinero)',
            'Verifica que el asiento cuadre (Pasivo + Gastos = Banco)',
            'Guarda el asiento'
        ],
        tips: [
            'Consulta tu tabla de amortización para separar capital de interés',
            'Puedes configurar pagos recurrentes en el módulo de Tesorería'
        ],
        relatedMenu: 'CONTABILIDAD > Asientos Contables',
        category: 'contabilidad'
    },

    // DEPRECIACION
    calculateDepreciation: {
        title: '¿Cómo calcular la depreciación de activos?',
        description: 'Registro del desgaste de activos fijos',
        steps: [
            'Navega a "LIBRO MAYOR" > "Activos Fijos"',
            'Selecciona el activo (ej: Vehículo, Computadora)',
            'Elige el método: "Línea Recta" o "Acelerada (MACRS)"',
            'Haz clic en "Calcular Depreciación Mensual"',
            'El sistema generará un asiento: Débito Gasto Depreciación / Crédito Depreciación Acumulada',
            'Verifica los montos y aprueba el asiento'
        ],
        tips: [
            'Para impuestos de Florida usa generalmente MACRS para mayor beneficio fiscal inicial',
            'Asegúrate de tener configurada la vida útil del activo correctamente'
        ],
        relatedMenu: 'CONTABILIDAD > Reportes Financieros > Activos',
        category: 'contabilidad'
    },

    // NOMINA
    processPayroll: {
        title: '¿Cómo procesar la nómina?',
        description: 'Cálculo y registro de pagos a empleados',
        steps: [
            'Ve a "RECURSOS HUMANOS" > "Nómina"',
            'Selecciona el período de pago',
            'Verifica horas trabajadas de cada empleado',
            'El sistema calcula automáticamente: salario bruto, retenciones (FICA, Medicare, impuestos), deducciones',
            'Revisa el salario neto de cada empleado',
            'Aprueba la nómina',
            'El sistema genera asientos: Débito Gasto Nómina / Crédito Nómina por Pagar',
            'Procesa el pago: Débito Nómina por Pagar / Crédito Banco'
        ],
        tips: [
            'Florida no tiene impuesto estatal sobre la renta, solo retenciones federales',
            'Remite las retenciones al IRS según tu calendario (mensual/trimestral)',
            'Genera formularios W-2 al final del año'
        ],
        relatedMenu: 'RECURSOS HUMANOS > Nómina',
        category: 'contabilidad'
    },

    // AUDITORIA
    prepareAudit: {
        title: '¿Cómo prepararse para una auditoría?',
        description: 'Organización de documentos para revisión externa',
        steps: [
            'Organiza todos los documentos de soporte: facturas, recibos, contratos',
            'Verifica que todos los asientos contables tengan respaldo documental',
            'Prepara conciliaciones bancarias de todos los meses del período',
            'Revisa el balance de comprobación para detectar anomalías',
            'Prepara explicaciones para transacciones inusuales o grandes',
            'Asegura que inventarios físicos coincidan con registros',
            'Revisa cumplimiento de obligaciones fiscales (DR-15, impuestos)',
            'Designa un punto de contacto para el auditor'
        ],
        tips: [
            'Mantén copias digitales de todos los documentos',
            'Prepara un índice de documentos para facilitar la búsqueda',
            'Revisa años anteriores para anticipar preguntas comunes'
        ],
        relatedMenu: 'CONTABILIDAD > Auditoría',
        category: 'contabilidad'
    },

    // CIERRE DE MES
    monthEndClose: {
        title: '¿Cómo hacer el cierre de mes?',
        description: 'Proceso de cierre contable mensual',
        steps: [
            'Registra todos los asientos de ajuste (depreciación, amortización)',
            'Registra gastos devengados no pagados',
            'Registra ingresos devengados no cobrados',
            'Concilia todas las cuentas bancarias',
            'Verifica saldos de cuentas por cobrar y por pagar',
            'Realiza conteo físico de inventario (si aplica)',
            'Genera balance de comprobación',
            'Prepara estados financieros (Balance, P&L, Flujo de Efectivo)',
            'Revisa y aprueba el cierre con gerencia'
        ],
        tips: [
            'Usa una checklist para no olvidar ningún paso',
            'Documenta todos los ajustes realizados',
            'Compara resultados con meses anteriores para detectar anomalías'
        ],
        relatedMenu: 'CONTABILIDAD > Cierre de Período',
        category: 'contabilidad'
    },

    // CUENTAS INCOBRABLES
    writeOffBadDebt: {
        title: '¿Cómo dar de baja cuentas incobrables?',
        description: 'Registro de cuentas por cobrar que no se podrán cobrar',
        steps: [
            'Identifica cuentas por cobrar con más de 90-120 días vencidas',
            'Documenta intentos de cobro realizados',
            'Obtén aprobación de gerencia para dar de baja',
            'Ve a "CONTABILIDAD" > "Asientos Contables"',
            'Crea asiento: Débito Gasto por Cuentas Incobrables / Crédito Cuentas por Cobrar',
            'Mantén registro separado para seguimiento futuro',
            'Si el cliente paga después: Débito Efectivo / Crédito Recuperación de Cuentas Incobrables'
        ],
        tips: [
            'Considera usar el método de provisión para cuentas incobrables',
            'Mantén políticas claras de crédito para minimizar pérdidas',
            'Documenta todo para propósitos fiscales'
        ],
        relatedMenu: 'CONTABILIDAD > Asientos Contables',
        category: 'contabilidad'
    },

    // AJUSTE DE INVENTARIO
    adjustInventory: {
        title: '¿Cómo ajustar el inventario?',
        description: 'Corrección de diferencias entre físico y sistema',
        steps: [
            'Ve a "INVENTARIO" > "Ajustes de Inventario"',
            'Realiza conteo físico del inventario',
            'Compara conteo físico con registros del sistema',
            'Investiga diferencias significativas',
            'Documenta razones del ajuste (robo, daño, error de conteo)',
            'Crea el ajuste en el sistema',
            'Si falta inventario: Débito Pérdida de Inventario / Crédito Inventario',
            'Si sobra inventario: Débito Inventario / Crédito Ganancia de Inventario'
        ],
        tips: [
            'Realiza conteos cíclicos regularmente para detectar problemas temprano',
            'Investiga diferencias grandes antes de ajustar',
            'Mantén seguridad física del inventario para prevenir robos'
        ],
        relatedMenu: 'INVENTARIO > Ajustes',
        category: 'inventario'
    },

    // IMPUESTO PROPIEDAD PERSONAL
    tangiblePropertyTax: {
        title: '¿Cómo declarar el impuesto sobre propiedad personal tangible?',
        description: 'Declaración anual de activos comerciales en Florida',
        steps: [
            'Prepara lista de todos los activos tangibles al 1 de enero',
            'Incluye: equipos, muebles, computadoras, vehículos comerciales',
            'Calcula el valor de mercado o valor en libros de cada activo',
            'Completa el formulario DR-405 antes del 1 de abril',
            'Presenta el formulario al Property Appraiser de tu condado',
            'Espera la factura del impuesto (generalmente en noviembre)',
            'Paga el impuesto antes del 31 de marzo del año siguiente'
        ],
        tips: [
            'Exención disponible si el valor total es menor a $25,000',
            'Mantén registros detallados de compras y ventas de activos',
            'Considera depreciar activos para reducir el valor imponible'
        ],
        relatedMenu: 'IMPUESTOS FLORIDA > Propiedad Personal',
        category: 'impuestos'
    },

    // CERTIFICADO DE REVENTA
    resaleCertificate: {
        title: '¿Cómo usar un certificado de reventa?',
        description: 'Comprar sin impuesto productos para reventa',
        steps: [
            'Obtén tu certificado de reventa (DR-13) del Florida Department of Revenue',
            'Proporciona el certificado a tus proveedores al hacer compras',
            'El proveedor no te cobrará impuesto de ventas',
            'Registra la compra normalmente en tu sistema',
            'Cuando vendas el producto, cobra el impuesto de ventas al cliente final',
            'Reporta y remite el impuesto cobrado en tu DR-15',
            'Renueva el certificado anualmente'
        ],
        tips: [
            'Solo usa el certificado para productos que realmente revenderás',
            'Uso indebido puede resultar en multas y auditorías',
            'Mantén copias de todos los certificados proporcionados'
        ],
        relatedMenu: 'IMPUESTOS FLORIDA > Certificados',
        category: 'impuestos'
    },
};

// ===========================================
// OPERACIONES RÁPIDAS (ACCESOS DIRECTOS)
// ===========================================

export const QUICK_OPERATIONS = [
    { label: 'Nueva Factura', guide: 'createInvoice' },
    { label: 'Nuevo Cliente', guide: 'createCustomer' },
    { label: 'Nuevo Producto', guide: 'createProduct' },
    { label: 'Reporte DR-15', guide: 'generateDR15' },
    { label: 'Balance General', guide: 'viewBalance' },
    { label: 'Crear Respaldo', guide: 'createBackup' },
    { label: 'Nueva Compra', guide: 'createBill' },
    { label: 'Tasas Florida', guide: 'viewTaxRates' }
];

// ===========================================
// CONOCIMIENTO CONTABLE (GAAP + FLORIDA)
// ===========================================

export const ACCOUNTING_KNOWLEDGE = {
    // Principios Contables
    principles: {
        doubleEntry: {
            name: 'Partida Doble',
            explanation: 'Cada transacción afecta al menos dos cuentas: una se debita y otra se acredita. La suma de débitos siempre debe igualar la suma de créditos.',
            example: 'Venta en efectivo: Débito Caja (aumenta activo) + Crédito Ingresos (aumenta ingreso)',
            rule: 'DÉBITOS = CRÉDITOS siempre'
        },
        accrual: {
            name: 'Base Devengado',
            explanation: 'Los ingresos y gastos se registran cuando se generan, no cuando se cobra o paga.',
            example: 'Una venta a crédito se registra como ingreso aunque no se haya cobrado aún'
        }
    },

    // Estructura de Cuentas
    accountStructure: {
        assets: {
            name: 'Activos',
            description: 'Lo que posee la empresa',
            examples: ['Caja', 'Bancos', 'Cuentas por Cobrar', 'Inventario', 'Equipos'],
            normalBalance: 'Débito'
        },
        liabilities: {
            name: 'Pasivos',
            description: 'Lo que debe la empresa',
            examples: ['Cuentas por Pagar', 'Préstamos', 'Impuestos por Pagar'],
            normalBalance: 'Crédito'
        },
        equity: {
            name: 'Patrimonio',
            description: 'Capital de los propietarios',
            examples: ['Capital Social', 'Utilidades Retenidas'],
            normalBalance: 'Crédito'
        },
        revenue: {
            name: 'Ingresos',
            description: 'Dinero ganado por la empresa',
            examples: ['Ventas', 'Servicios', 'Intereses'],
            normalBalance: 'Crédito'
        },
        expenses: {
            name: 'Gastos',
            description: 'Costos de operar el negocio',
            examples: ['Alquiler', 'Salarios', 'Servicios', 'Costo de Ventas'],
            normalBalance: 'Débito'
        }
    },

    floridaTax: {
        stateTaxRate: 0.06, // 6% base
        counties: {
            'Alachua': { surtax: 0.01, total: 0.07, code: 'ALACHUA' },
            'Baker': { surtax: 0.01, total: 0.07, code: 'BAKER' },
            'Bay': { surtax: 0.01, total: 0.07, code: 'BAY' },
            'Bradford': { surtax: 0.01, total: 0.07, code: 'BRADFORD' },
            'Brevard': { surtax: 0.01, total: 0.07, code: 'BREVARD' },
            'Broward': { surtax: 0.01, total: 0.07, code: 'BROWARD' },
            'Calhoun': { surtax: 0.01, total: 0.07, code: 'CALHOUN' },
            'Charlotte': { surtax: 0.01, total: 0.07, code: 'CHARLOTTE' },
            'Citrus': { surtax: 0.01, total: 0.07, code: 'CITRUS' },
            'Clay': { surtax: 0.01, total: 0.07, code: 'CLAY' },
            'Collier': { surtax: 0.01, total: 0.07, code: 'COLLIER' },
            'Columbia': { surtax: 0.01, total: 0.07, code: 'COLUMBIA' },
            'DeSoto': { surtax: 0.01, total: 0.07, code: 'DESOTO' },
            'Dixie': { surtax: 0.01, total: 0.07, code: 'DIXIE' },
            'Duval': { surtax: 0.01, total: 0.07, code: 'DUVAL' },
            'Escambia': { surtax: 0.015, total: 0.075, code: 'ESCAMBIA' },
            'Flagler': { surtax: 0.01, total: 0.07, code: 'FLAGLER' },
            'Franklin': { surtax: 0.01, total: 0.07, code: 'FRANKLIN' },
            'Gadsden': { surtax: 0.01, total: 0.07, code: 'GADSDEN' },
            'Gilchrist': { surtax: 0.01, total: 0.07, code: 'GILCHRIST' },
            'Glades': { surtax: 0.01, total: 0.07, code: 'GLADES' },
            'Gulf': { surtax: 0.01, total: 0.07, code: 'GULF' },
            'Hamilton': { surtax: 0.01, total: 0.07, code: 'HAMILTON' },
            'Hardee': { surtax: 0.01, total: 0.07, code: 'HARDEE' },
            'Hendry': { surtax: 0.01, total: 0.07, code: 'HENDRY' },
            'Hernando': { surtax: 0.01, total: 0.07, code: 'HERNANDO' },
            'Highlands': { surtax: 0.01, total: 0.07, code: 'HIGHLANDS' },
            'Hillsborough': { surtax: 0.015, total: 0.075, code: 'HILLSBOROUGH' },
            'Holmes': { surtax: 0.01, total: 0.07, code: 'HOLMES' },
            'Indian River': { surtax: 0.01, total: 0.07, code: 'INDIAN-RIVER' },
            'Jackson': { surtax: 0.01, total: 0.07, code: 'JACKSON' },
            'Jefferson': { surtax: 0.01, total: 0.07, code: 'JEFFERSON' },
            'Lafayette': { surtax: 0.01, total: 0.07, code: 'LAFAYETTE' },
            'Lake': { surtax: 0.01, total: 0.07, code: 'LAKE' },
            'Lee': { surtax: 0.01, total: 0.07, code: 'LEE' },
            'Leon': { surtax: 0.015, total: 0.075, code: 'LEON' },
            'Levy': { surtax: 0.01, total: 0.07, code: 'LEVY' },
            'Liberty': { surtax: 0.01, total: 0.07, code: 'LIBERTY' },
            'Madison': { surtax: 0.01, total: 0.07, code: 'MADISON' },
            'Manatee': { surtax: 0.01, total: 0.07, code: 'MANATEE' },
            'Marion': { surtax: 0.01, total: 0.07, code: 'MARION' },
            'Martin': { surtax: 0.01, total: 0.07, code: 'MARTIN' },
            'Miami-Dade': { surtax: 0.015, total: 0.075, code: 'MIAMI-DADE' },
            'Monroe': { surtax: 0.015, total: 0.075, code: 'MONROE' },
            'Nassau': { surtax: 0.01, total: 0.07, code: 'NASSAU' },
            'Okaloosa': { surtax: 0.01, total: 0.07, code: 'OKALOOSA' },
            'Okeechobee': { surtax: 0.01, total: 0.07, code: 'OKEECHOBEE' },
            'Orange': { surtax: 0.005, total: 0.065, code: 'ORANGE' },
            'Osceola': { surtax: 0.01, total: 0.07, code: 'OSCEOLA' },
            'Palm Beach': { surtax: 0.01, total: 0.07, code: 'PALM-BEACH' },
            'Pasco': { surtax: 0.01, total: 0.07, code: 'PASCO' },
            'Pinellas': { surtax: 0.01, total: 0.07, code: 'PINELLAS' },
            'Polk': { surtax: 0.01, total: 0.07, code: 'POLK' },
            'Putnam': { surtax: 0.01, total: 0.07, code: 'PUTNAM' },
            'St. Johns': { surtax: 0.01, total: 0.07, code: 'ST-JOHNS' },
            'St. Lucie': { surtax: 0.01, total: 0.07, code: 'ST-LUCIE' },
            'Santa Rosa': { surtax: 0.01, total: 0.07, code: 'SANTA-ROSA' },
            'Sarasota': { surtax: 0.01, total: 0.07, code: 'SARASOTA' },
            'Seminole': { surtax: 0.01, total: 0.07, code: 'SEMINOLE' },
            'Sumter': { surtax: 0.01, total: 0.07, code: 'SUMTER' },
            'Suwannee': { surtax: 0.01, total: 0.07, code: 'SUWANNEE' },
            'Taylor': { surtax: 0.01, total: 0.07, code: 'TAYLOR' },
            'Union': { surtax: 0.01, total: 0.07, code: 'UNION' },
            'Volusia': { surtax: 0.01, total: 0.07, code: 'VOLUSIA' },
            'Wakulla': { surtax: 0.01, total: 0.07, code: 'WAKULLA' },
            'Walton': { surtax: 0.01, total: 0.07, code: 'WALTON' },
            'Washington': { surtax: 0.01, total: 0.07, code: 'WASHINGTON' }
        },
        dr15: {
            description: 'Formulario de declaración de impuestos de ventas de Florida',
            dueDate: 'Día 20 del mes siguiente al período',
            filingPeriods: ['Mensual', 'Trimestral', 'Anual']
        },
        exemptions: {
            groceries: 'Alimentos no preparados están exentos del impuesto de ventas',
            prescription: 'Medicamentos con receta están exentos',
            manufacturing: 'Maquinaria de manufactura puede calificar para exención',
            resale: 'Productos comprados para reventa están exentos con certificado de reventa válido',
            agricultural: 'Equipos agrícolas pueden estar exentos bajo ciertas condiciones'
        },
        specialRules: {
            interstate: 'Ventas fuera de Florida no están sujetas al impuesto de ventas de Florida',
            services: 'La mayoría de servicios profesionales no están gravados en Florida',
            rentals: 'Alquileres comerciales están sujetos a impuesto de ventas',
            digital: 'Productos digitales descargables generalmente no están gravados'
        }
    },

    // Nuevos módulos
    payroll: {
        description: 'Gestión de nómina y pagos a empleados',
        keyConcepts: ['Salario Bruto', 'Retenciones', 'Salario Neto'],
        view: 'v_payroll_summary'
    },
    banking: {
        description: 'Conciliación bancaria y gestión de cuentas',
        keyConcepts: ['Libro Mayor', 'Estado de Cuenta', 'Conciliación'],
        view: 'v_bank_reconciliation_summary'
    },
    inventory: {
        description: 'Control de stock y movimientos',
        keyConcepts: ['FIFO', 'LIFO', 'Costo Promedio', 'Kardex'],
        view: 'v_inventory_movements_summary'
    },
    purchasing: {
        description: 'Gestión de compras y proveedores',
        keyConcepts: ['Órdenes de Compra', 'Cuentas por Pagar', 'Recepción de Bienes'],
        view: 'v_purchase_orders_summary'
    }
};

// ===========================================
// MÉTODOS DE BÚSQUEDA
// ===========================================

export const searchByTopic = async (topic: string): Promise<any[]> => {
    const results: any[] = [];
    const query = topic.toLowerCase();

    // Buscar en Guías
    Object.entries(SYSTEM_GUIDES).forEach(([key, guide]) => {
        if (guide.title.toLowerCase().includes(query) ||
            (guide.description && guide.description.toLowerCase().includes(query)) ||
            guide.category.includes(query as any)) {
            results.push({
                content: `GUÍA: ${guide.title}. ${guide.description || ''}. Pasos: ${guide.steps.join(', ')}`,
                relevance: 0.8,
                lastUpdated: '2024-01-01'
            });
        }
    });

    // Buscar en Conocimiento Contable
    if (ACCOUNTING_KNOWLEDGE.principles.doubleEntry.name.toLowerCase().includes(query) ||
        ACCOUNTING_KNOWLEDGE.principles.doubleEntry.explanation.toLowerCase().includes(query)) {
        results.push({
            content: `PRINCIPIO: ${ACCOUNTING_KNOWLEDGE.principles.doubleEntry.name}. ${ACCOUNTING_KNOWLEDGE.principles.doubleEntry.explanation}`,
            relevance: 0.9,
            lastUpdated: '2024-01-01'
        });
    }

    if (query.includes('florida') || query.includes('impuesto') || query.includes('tax')) {
        results.push({
            content: `IMPUESTOS FLORIDA: Tasa base ${ACCOUNTING_KNOWLEDGE.floridaTax.stateTaxRate * 100}%. Info DR-15: ${ACCOUNTING_KNOWLEDGE.floridaTax.dr15.description}`,
            relevance: 0.95,
            lastUpdated: '2024-01-01'
        });
    }

    return results;
};

// ===========================================
// PREGUNTAS FRECUENTES
// ===========================================

export const FAQ = [
    {
        question: '¿El sistema funciona sin internet?',
        answer: 'Sí, AccountExpress funciona 100% offline. Todos los datos se guardan localmente en tu navegador usando SQLite y OPFS.'
    },
    {
        question: '¿Mis datos están seguros?',
        answer: 'Sí, usamos cifrado AES-256-GCM de grado militar. Además, los respaldos .aex están cifrados con tu contraseña personal.'
    },
    {
        question: '¿La IA puede modificar mis datos?',
        answer: 'No, el asistente IA solo tiene acceso de LECTURA. No puede crear, modificar ni eliminar ningún registro.'
    },
    {
        question: '¿Cómo se calculan los impuestos?',
        answer: 'El sistema usa las tasas oficiales de cada condado de Florida. Se aplican automáticamente según la dirección del cliente.'
    },
    {
        question: '¿Cuántos condados de Florida están cubiertos?',
        answer: 'Los 67 condados de Florida están incluidos con sus tasas de impuesto actualizadas (6% base + surtax local).'
    },
    {
        question: '¿Qué es el DR-15?',
        answer: 'Es el formulario de declaración de impuestos de ventas de Florida. Debe presentarse antes del día 20 del mes siguiente al período de recaudación.'
    },
    {
        question: '¿Qué productos están exentos de impuesto en Florida?',
        answer: 'Alimentos no preparados, medicamentos con receta, productos para reventa (con certificado DR-13), y equipos agrícolas/manufactureros bajo ciertas condiciones.'
    },
    {
        question: '¿Qué es un certificado de reventa?',
        answer: 'Es el formulario DR-13 que permite comprar productos sin pagar impuesto cuando serán revendidos. Debe renovarse anualmente.'
    },
    {
        question: '¿Florida tiene impuesto sobre la renta?',
        answer: 'No, Florida no tiene impuesto estatal sobre la renta personal ni corporativo. Solo aplican impuestos federales.'
    },
    {
        question: '¿Qué es el impuesto sobre propiedad personal tangible?',
        answer: 'Es un impuesto anual sobre equipos, muebles y activos comerciales. Se declara el 1 de abril. Hay exención si el valor total es menor a $25,000.'
    },
    {
        question: '¿Qué es MACRS?',
        answer: 'Sistema de depreciación acelerada para impuestos federales. Permite deducir más en los primeros años de vida del activo.'
    },
    {
        question: '¿Qué es la Sección 179?',
        answer: 'Deducción fiscal que permite deducir el costo completo de equipos calificados en el año de compra (hasta $1,220,000 en 2024).'
    },
    {
        question: '¿Cómo hago un respaldo de mis datos?',
        answer: 'Ve a ARCHIVO > Respaldos y Restauración > Crear Nuevo Respaldo. El archivo .aex estará cifrado con tu contraseña.'
    },
    {
        question: '¿Puedo importar datos de otro sistema?',
        answer: 'Sí, puedes importar desde Excel/CSV o restaurar un respaldo .aex. Ve a ARCHIVO > Importar Datos.'
    },
    {
        question: '¿El sistema genera estados financieros?',
        answer: 'Sí, genera Balance General, Estado de Resultados (P&L), y Flujo de Efectivo. Ve a CONTABILIDAD > Reportes Financieros.'
    },
    {
        question: '¿Puedo procesar nómina?',
        answer: 'Sí, el módulo de nómina calcula salarios, retenciones federales (FICA, Medicare), y genera asientos contables automáticamente.'
    },
    {
        question: '¿Cómo concilio mi cuenta bancaria?',
        answer: 'Ve a HERRAMIENTAS > Cuentas Bancarias > Importar Estado de Cuenta. El sistema machea automáticamente transacciones por monto y fecha.'
    },
    {
        question: '¿Qué hago si tengo una cuenta incobrable?',
        answer: 'Documenta intentos de cobro, obtén aprobación de gerencia, y crea un asiento: Débito Gasto Cuentas Incobrables / Crédito Cuentas por Cobrar.'
    },
    {
        question: '¿Cómo preparo mi negocio para una auditoría?',
        answer: 'Organiza documentos de soporte, prepara conciliaciones bancarias, verifica balance de comprobación, y revisa cumplimiento fiscal.'
    },
    {
        question: '¿Puedo usar el sistema para múltiples empresas?',
        answer: 'Sí, puedes crear múltiples bases de datos y cambiar entre ellas. Cada empresa tiene sus propios datos separados.'
    }
];

export const SystemKnowledge = {
    SYSTEM_GUIDES,
    QUICK_OPERATIONS,
    ACCOUNTING_KNOWLEDGE,
    FAQ,
    searchByTopic
};

export default SystemKnowledge;
