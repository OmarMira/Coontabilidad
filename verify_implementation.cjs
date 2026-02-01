
const fs = require('fs');
const path = require('path');

// verify_implementation.js
(async () => {
    console.log("🔍 VERIFICANDO IMPLEMENTACIÓN...");

    // 1. Verificar WorkerOrchestrator
    const workerFiles = [
        'src/workers/pdf.worker.ts',
        'src/workers/csv.worker.ts',
        'src/core/workers/WorkerOrchestrator.ts'
    ];

    // 2. Verificar vistas SQL
    // Note: These are view NAMES, not files. We check if they are in the ViewManager.ts file content or by importing.
    // Since we are running in node, importing TS files directly might be tricky without ts-node.
    // We will check by reading the ViewManager.ts file content for the string names.
    const sqlViews = [
        'v_payroll_summary',
        'v_bank_reconciliation_summary',
        'v_inventory_movements_summary',
        'v_purchase_orders_summary'
    ];

    // 3. Verificar Delta Calculator
    const deltaFiles = [
        // 'src/core/audit/DeltaCalculator.ts', // This might not exist if I put logic in AuditService
        'src/services/AuditService.ts',
        'src/services/audit/AuditChainService.ts'
    ];

    // Verificar existencia de archivos
    console.log("\n📁 Verificando Archivos:");
    for (const file of [...workerFiles, ...deltaFiles]) {
        const fullPath = path.join(process.cwd(), file);
        try {
            await fs.promises.access(fullPath);
            console.log(`✅ ${file}`);
        } catch {
            console.log(`❌ ${file}`);
        }
    }

    // Verificar Vistas en ViewManager.ts
    console.log("\n📊 Verificando Vistas Registradas en ViewManager.ts:");
    try {
        const viewManagerPath = path.join(process.cwd(), 'src/database/views/ViewManager.ts');
        const content = await fs.promises.readFile(viewManagerPath, 'utf8');

        for (const view of sqlViews) {
            if (content.includes(view)) {
                console.log(`✅ ${view} encontrada en código`);
            } else {
                console.log(`❌ ${view} NO encontrada en código`);
            }
        }
    } catch (err) {
        console.error("❌ Error leyendo ViewManager.ts:", err.message);
    }

    // Verificar Delta Logic in AuditChainService
    console.log("\n🔍 Verificando Lógica Delta:");
    try {
        const auditPath = path.join(process.cwd(), 'src/services/audit/AuditChainService.ts');
        const content = await fs.promises.readFile(auditPath, 'utf8');

        if (content.includes('JSON.stringify(oldData[key])') && content.includes('_is_delta')) {
            console.log("✅ Lógica de Delta detectada en recordEvent");
        } else {
            console.log("❌ Lógica de Delta NO detectada claramente");
        }
    } catch (err) {
        console.error("❌ Error leyendo AuditChainService.ts:", err.message);
    }

})();
