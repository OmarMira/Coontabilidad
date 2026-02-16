// SCRIPT PARA INSERTAR LOS 67 CONDADOS DE FLORIDA
// Copia TODO este código en la consola del navegador (F12)

(function insertarCondados() {
    console.log('🏛️ INSERTANDO 67 CONDADOS DE FLORIDA...\n');

    const db = window.db || window.getDB?.();
    
    if (!db) {
        console.error('❌ No se pudo acceder a la base de datos');
        return;
    }

    const counties = [
        { name: "Alachua", code: "ALACHUA", surtax: 150 },
        { name: "Baker", code: "BAKER", surtax: 100 },
        { name: "Bay", code: "BAY", surtax: 100 },
        { name: "Bradford", code: "BRADFORD", surtax: 100 },
        { name: "Brevard", code: "BREVARD", surtax: 100 },
        { name: "Broward", code: "BROWARD", surtax: 100 },
        { name: "Calhoun", code: "CALHOUN", surtax: 150 },
        { name: "Charlotte", code: "CHARLOTTE", surtax: 100 },
        { name: "Citrus", code: "CITRUS", surtax: 100 },
        { name: "Clay", code: "CLAY", surtax: 150 },
        { name: "Collier", code: "COLLIER", surtax: 100 },
        { name: "Columbia", code: "COLUMBIA", surtax: 100 },
        { name: "DeSoto", code: "DESOTO", surtax: 150 },
        { name: "Dixie", code: "DIXIE", surtax: 100 },
        { name: "Duval", code: "DUVAL", surtax: 150 },
        { name: "Escambia", code: "ESCAMBIA", surtax: 150 },
        { name: "Flagler", code: "FLAGLER", surtax: 100 },
        { name: "Franklin", code: "FRANKLIN", surtax: 100 },
        { name: "Gadsden", code: "GADSDEN", surtax: 150 },
        { name: "Gilchrist", code: "GILCHRIST", surtax: 100 },
        { name: "Glades", code: "GLADES", surtax: 100 },
        { name: "Gulf", code: "GULF", surtax: 100 },
        { name: "Hamilton", code: "HAMILTON", surtax: 100 },
        { name: "Hardee", code: "HARDEE", surtax: 100 },
        { name: "Hendry", code: "HENDRY", surtax: 100 },
        { name: "Hernando", code: "HERNANDO", surtax: 50 },
        { name: "Highlands", code: "HIGHLANDS", surtax: 150 },
        { name: "Hillsborough", code: "HILLSBOROUGH", surtax: 150 },
        { name: "Holmes", code: "HOLMES", surtax: 100 },
        { name: "Indian River", code: "INDIAN-RIVER", surtax: 100 },
        { name: "Jackson", code: "JACKSON", surtax: 150 },
        { name: "Jefferson", code: "JEFFERSON", surtax: 100 },
        { name: "Lafayette", code: "LAFAYETTE", surtax: 100 },
        { name: "Lake", code: "LAKE", surtax: 100 },
        { name: "Lee", code: "LEE", surtax: 50 },
        { name: "Leon", code: "LEON", surtax: 150 },
        { name: "Levy", code: "LEVY", surtax: 100 },
        { name: "Liberty", code: "LIBERTY", surtax: 150 },
        { name: "Madison", code: "MADISON", surtax: 150 },
        { name: "Manatee", code: "MANATEE", surtax: 100 },
        { name: "Marion", code: "MARION", surtax: 100 },
        { name: "Martin", code: "MARTIN", surtax: 50 },
        { name: "Miami-Dade", code: "MIAMI-DADE", surtax: 100 },
        { name: "Monroe", code: "MONROE", surtax: 150 },
        { name: "Nassau", code: "NASSAU", surtax: 100 },
        { name: "Okaloosa", code: "OKALOOSA", surtax: 50 },
        { name: "Okeechobee", code: "OKEECHOBEE", surtax: 100 },
        { name: "Orange", code: "ORANGE", surtax: 50 },
        { name: "Osceola", code: "OSCEOLA", surtax: 150 },
        { name: "Palm Beach", code: "PALM-BEACH", surtax: 100 },
        { name: "Pasco", code: "PASCO", surtax: 100 },
        { name: "Pinellas", code: "PINELLAS", surtax: 100 },
        { name: "Polk", code: "POLK", surtax: 100 },
        { name: "Putnam", code: "PUTNAM", surtax: 100 },
        { name: "Santa Rosa", code: "SANTA-ROSA", surtax: 50 },
        { name: "Sarasota", code: "SARASOTA", surtax: 100 },
        { name: "Seminole", code: "SEMINOLE", surtax: 100 },
        { name: "St. Johns", code: "ST-JOHNS", surtax: 50 },
        { name: "St. Lucie", code: "ST-LUCIE", surtax: 100 },
        { name: "Sumter", code: "SUMTER", surtax: 100 },
        { name: "Suwannee", code: "SUWANNEE", surtax: 100 },
        { name: "Taylor", code: "TAYLOR", surtax: 100 },
        { name: "Union", code: "UNION", surtax: 100 },
        { name: "Volusia", code: "VOLUSIA", surtax: 50 },
        { name: "Wakulla", code: "WAKULLA", surtax: 100 },
        { name: "Walton", code: "WALTON", surtax: 100 },
        { name: "Washington", code: "WASHINGTON", surtax: 100 }
    ];

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const c of counties) {
        try {
            // Verificar si ya existe
            const exists = db.exec("SELECT id FROM florida_tax_rates WHERE county_code = ?", [c.code]);
            
            if (exists.length === 0 || exists[0].values.length === 0) {
                // Insertar nuevo
                db.run(
                    "INSERT INTO florida_tax_rates (county_name, county_code, base_rate, surtax_rate, total_rate, effective_date, is_active) VALUES (?, ?, 600, ?, ?, '2026-01-01', 1)",
                    [c.name, c.code, c.surtax, 600 + c.surtax]
                );
                inserted++;
            } else {
                // Actualizar existente
                db.run(
                    "UPDATE florida_tax_rates SET county_name = ?, base_rate = 600, surtax_rate = ?, total_rate = ?, is_active = 1 WHERE county_code = ?",
                    [c.name, c.surtax, 600 + c.surtax, c.code]
                );
                updated++;
            }
        } catch (e) {
            console.error(`❌ Error con ${c.name}:`, e.message);
            errors++;
        }
    }

    // Verificar resultado final
    const finalCount = db.exec("SELECT COUNT(*) as c FROM florida_tax_rates");
    const total = finalCount[0]?.values[0]?.[0] || 0;

    console.log('\n📊 RESULTADO:');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Condados insertados: ${inserted}`);
    console.log(`🔄 Condados actualizados: ${updated}`);
    if (errors > 0) console.log(`❌ Errores: ${errors}`);
    console.log(`📍 Total en base de datos: ${total}/67`);
    console.log('═══════════════════════════════════════');

    if (total === 67) {
        console.log('\n🎉 ¡PERFECTO! Los 67 condados están en la base de datos');
        console.log('💡 Recarga la página y ejecuta IRON CORE VERIFICATION');
    } else {
        console.log(`\n⚠️  Faltan ${67 - total} condados`);
    }
})();
