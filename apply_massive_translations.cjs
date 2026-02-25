const fs = require('fs');

const path = './src/locales/es.json';
const es = JSON.parse(fs.readFileSync(path, 'utf8'));

// 1. Fix bankAccountList
if (es.bankAccountList) {
    es.bankAccountList.title = "Cuentas Bancarias";
    es.bankAccountList.subtitle = "Gestión estratégica de activos líquidos y bóvedas";
    es.bankAccountList.syncVault = "Sincronizar Bóveda";
    if (es.bankAccountList.stats) {
        es.bankAccountList.stats.entities = "Entidades";
    }
    // Clean up misplaced children if they exist at root too
    // Note: I'll keep them for safety but maybe they are used? 
    // Actually, looking at the code, components use 'bankAccountList.title'
}

// 2. Fix inv (it's mostly English)
if (es.inv) {
    es.inv.dashboard = {
        ...es.inv.dashboard,
        attentionRequired: "Atención Requerida",
        auditInventory: "Auditar Inventario",
        inventoryHealthy: "Inventario Saludable",
        lowStockAlerts: "Alertas Stock Bajo",
        minLevel: "Nivel Mín.",
        noRecentMovements: "Sin Movimientos Recientes",
        productsBelowMinimum: "Productos bajo el mínimo",
        recentMovements: "Movimientos Recientes",
        totalInventoryValue: "Valor Total Inventario",
        totalItemsInStock: "Total Ítems en Stock",
        viewAll: "Ver Todos",
        viewCriticalStock: "Ver Stock Crítico",
        weightedAverageCost: "Costo Promedio Ponderado"
    };
    es.inv.kardex = {
        ...es.inv.kardex,
        title: "Kardex de Inventario",
        productFilter: "Filtrar Producto",
        movementTypeFilter: "Filtrar Tipo Movimiento",
        date: "Fecha",
        type: "Tipo",
        product: "Producto",
        ref: "Ref",
        entry: "Entrada",
        exit: "Salida",
        balanceCol: "Saldo",
        user: "Usuario",
        all: "Todos",
        allProducts: "Todos los Productos",
        purchase: "Compra",
        sale: "Venta",
        adjustmentsFilter: "Ajustes",
        noMovementsFound: "No se encontraron movimientos"
    };
    es.inv.locations = {
        ...es.inv.locations,
        title: "Ubicaciones de Inventario",
        name: "Nombre",
        address: "Dirección",
        active: "Activo",
        description: "Descripción",
        edit: "Editar",
        cancel: "Cancelar",
        locationCreated: "Ubicación Creada",
        errorLoadingLocations: "Error al cargar ubicaciones"
    };
}

// 3. Fix generic placeholders found in audit
const genericFixes = [
    { path: 'accounting.closure.steps.transactions.title', value: 'Validación de Transacciones' },
    { path: 'accounting.closure.steps.transactions.desc', value: 'Verificación de integridad de asientos' },
    { path: 'accounting.closure.steps.payroll.title', value: 'Validación de Nómina' },
    { path: 'accounting.closure.steps.payroll.desc', value: 'Verificación de aportes y retenciones' },
    { path: 'accounting.closure.steps.adjustments.title', value: 'Ajustes de Cierre' },
    { path: 'accounting.closure.steps.adjustments.desc', value: 'Depreciaciones y conciliaciones finales' },
    { path: 'accounting.closure.steps.trialBalance.title', value: 'Balance de Comprobación' },
    { path: 'accounting.closure.steps.trialBalance.desc', value: 'Estado final de cuentas antes del cierre' },
    { path: 'accounting.closure.steps.confirmation.title', value: 'Confirmación Final' },
    { path: 'accounting.closure.steps.confirmation.desc', value: 'Certificación del cierre del período' },
    { path: 'accounting.closure.title', value: 'Asistente de Cierre' },
    { path: 'aiAssistant.title', value: 'Asistente IA Alpha Core' },
    { path: 'aiAssistant.proposals.title', value: 'Propuestas de Reparación' },
    { path: 'aiAssistant.proposals.subtitle', value: 'Acciones correctivas sugeridas por IA' },
    { path: 'ard.quality.title', value: 'Control de Calidad ARD' },
    { path: 'ard.quality.subtitle', value: 'Métricas de integridad de datos comerciales' }
];

function setPath(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

genericFixes.forEach(f => setPath(es, f.path, f.value));

// 4. Fix missing keys from audit
const missingKeys = [
    { path: 'accounting.periods.closureConfirm', value: '¿Está seguro de cerrar este período? Esta acción es irreversible.' },
    { path: 'accounting.periods.closureSuccess', value: 'Período cerrado exitosamente.' },
    { path: 'accounting.periods.creationSuccess', value: 'Período creado correctamente.' },
    { path: 'accounting.periods.lockConfirm', value: '¿Bloquear este período? No se podrán hacer más cambios.' },
    { path: 'accounting.periods.lockSuccess', value: 'Período bloqueado.' },
    { path: 'accounting.periods.reopenSuccess', value: 'Período reabierto correctamente.' },
    { path: 'common.periodMonths', value: 'Meses del Período' },
    { path: 'dr15.compliance.checksCompleted', value: 'Verificaciones de cumplimiento completadas' },
    { path: 'inv.reports.actionRequiredMsg', value: 'Se requiere acción inmediata en ítems de stock crítico.' },
    { path: 'maintenance.lastRepair', value: 'Última reparación ejecutada: {{date}}' },
    { path: 'maintenance.runningAction', value: 'Ejecutando acción de mantenimiento...' },
    { path: 'security.actions.repairAll', value: 'Reparar Todas las Vulnerabilidades' },
    { path: 'security.messages.bannerWarning', value: 'ATENCIÓN: Se detectaron inconsistencias de seguridad' },
    { path: 'security.messages.lastCheck', value: 'Última auditoría: {{date}}' },
    { path: 'security.messages.problemsCount', value: 'Problemas Críticos: {{count}}' },
    { path: 'security.messages.warningsCount', value: 'Advertencias: {{count}}' },
    { path: 'settings.manualBackupSuccess', value: 'Copia de seguridad manual guardada con éxito.' },
    { path: 'termsDefault', value: 'Net 30' }
];

missingKeys.forEach(f => setPath(es, f.path, f.value));

fs.writeFileSync(path, JSON.stringify(es, null, 2));
console.log('es.json updated with translations and fixes.');
