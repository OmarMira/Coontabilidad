// SCRIPT DE RESETEO COMPLETO DE BASE DE DATOS
// Ejecutar en la consola del navegador (F12) para forzar recreación limpia

(async function resetDatabase() {
    console.log("🔥 INICIANDO RESETEO COMPLETO DE BASE DE DATOS...\n");

    try {
        // 1. Limpiar LocalStorage
        console.log("🧹 Limpiando LocalStorage...");
        localStorage.clear();
        console.log("✅ LocalStorage limpiado\n");

        // 2. Limpiar OPFS (si existe)
        if (navigator.storage && navigator.storage.getDirectory) {
            console.log("🧹 Limpiando OPFS...");
            try {
                const root = await navigator.storage.getDirectory();
                const entries = [];
                for await (const entry of root.values()) {
                    entries.push(entry.name);
                }

                for (const name of entries) {
                    await root.removeEntry(name, { recursive: true });
                    console.log(`  Eliminado: ${name}`);
                }
                console.log("✅ OPFS limpiado\n");
            } catch (e) {
                console.warn("⚠️ No se pudo limpiar OPFS:", e.message);
            }
        }

        // 3. Limpiar IndexedDB
        console.log("🧹 Limpiando IndexedDB...");
        const databases = await indexedDB.databases();
        for (const db of databases) {
            if (db.name) {
                indexedDB.deleteDatabase(db.name);
                console.log(`  Eliminado: ${db.name}`);
            }
        }
        console.log("✅ IndexedDB limpiado\n");

        console.log("✅ RESETEO COMPLETADO");
        console.log("🔄 Recarga la página (F5) para crear una base de datos limpia");

    } catch (error) {
        console.error("❌ ERROR EN RESETEO:", error);
    }
})();
