/**
 * BASE DE CONOCIMIENTO DEL SISTEMA - GUÍAS Y OPERACIONES
 * 
 * Contiene guías paso a paso para todas las operaciones del sistema
 * y conocimiento contable especializado para Florida
 */

// ===========================================
// GUÍAS DEL SISTEMA (OPERACIONES)
// ===========================================

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
    }
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

    // Florida Tax
    floridaTax: {
        stateTaxRate: 0.06, // 6% base
        counties: {
            'Miami-Dade': { surtax: 0.015, total: 0.075, code: 'MD' },
            'Broward': { surtax: 0.01, total: 0.07, code: 'BW' },
            'Orange': { surtax: 0.005, total: 0.065, code: 'OR' },
            'Hillsborough': { surtax: 0.015, total: 0.075, code: 'HB' },
            'Palm Beach': { surtax: 0.01, total: 0.07, code: 'PB' }
        },
        dr15: {
            description: 'Formulario de declaración de impuestos de ventas de Florida',
            dueDate: 'Día 20 del mes siguiente al período',
            filingPeriods: ['Mensual', 'Trimestral', 'Anual']
        }
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
