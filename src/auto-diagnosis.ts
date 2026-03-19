// AUTO-DIAGNÃ“STICO DE USUARIOS
// Este script se ejecuta automÃ¡ticamente al cargar la pÃ¡gina

(async function autoDiagnosis() {
    console.log("ðŸ” ========== AUTO-DIAGNÃ“STICO DE USUARIOS ==========");

    // Esperar a que la base de datos se inicialice
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // Importar dinÃ¡micamente
        const { getDB } = await import('./database/modules/db-core');
        const db = getDB();

        if (!db) {
            console.error("âŒ Base de datos NO inicializada");
            return;
        }

        console.log("âœ… Base de datos inicializada\n");

        // 1. Verificar tabla users
        console.log("ðŸ“‹ ESTRUCTURA DE TABLA 'users':");
        const schema = db.exec("PRAGMA table_info(users)");
        if (schema[0]) {
            schema[0].values.forEach((col: any) => {
                console.log(`  ${col[1]} (${col[2]})`);
            });
        }
        console.log("");

        // 2. Contar usuarios
        const countResult = db.exec("SELECT COUNT(*) as count FROM users");
        const userCount = countResult[0]?.values[0]?.[0] || 0;
        console.log(`ðŸ‘¥ TOTAL USUARIOS: ${userCount}\n`);

        // 3. Listar usuarios
        console.log("ðŸ“ LISTA DE USUARIOS:");
        const users = db.exec("SELECT id, username, email, is_active, role_id FROM users");
        if (users[0]) {
            users[0].values.forEach((user: any) => {
                console.log(`  ID: ${user[0]}, User: ${user[1]}, Email: ${user[2]}, Active: ${user[3]}, Role: ${user[4]}`);
            });
        } else {
            console.log("  (Sin usuarios)");
        }
        console.log("");

        // 4. Verificar hash del admin
        const adminHash = db.exec("SELECT password_hash FROM users WHERE username = 'admin'");
        if (adminHash[0]?.values[0]) {
            const hash = adminHash[0].values[0][0];
            console.log(`ðŸ” HASH DE ADMIN: ${hash?.toString().substring(0, 20)}...`);
        } else {
            console.log("âŒ Usuario admin NO encontrado");
        }
        console.log("");

        // 5. Verificar roles
        console.log("ðŸŽ­ ROLES:");
        const roles = db.exec("SELECT id, name, level FROM user_roles");
        if (roles[0]) {
            roles[0].values.forEach((role: any) => {
                console.log(`  ID: ${role[0]}, Name: ${role[1]}, Level: ${role[2]}`);
            });
        }

        console.log("\nðŸ” ========== FIN DEL DIAGNÃ“STICO ==========");

    } catch (error) {
        console.error("âŒ ERROR EN DIAGNÃ“STICO:", error);
    }
})();

export { };

