// ============================================
// SCRIPT DEFINITIVO PARA ARREGLAR LOGIN
// ============================================
// Este script crea/repara los usuarios admin y demo
// Copia y pega TODO este código en la consola del navegador (F12)

(async function arreglarLoginDefinitivo() {
    console.log('🔧 ARREGLANDO USUARIOS ADMIN Y DEMO...\n');

    const db = window.db || window.getDB?.();
    
    if (!db) {
        console.error('❌ No se pudo acceder a la base de datos');
        console.log('Asegúrate de estar en la aplicación y que la BD esté inicializada');
        return;
    }

    console.log('✅ Base de datos encontrada\n');

    // Función para hashear contraseñas (PBKDF2 con 600k iteraciones)
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        
        // Generar salt aleatorio
        const salt = crypto.getRandomValues(new Uint8Array(16));
        
        // Importar la contraseña como clave
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            data,
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        
        // Derivar el hash con PBKDF2
        const hashBuffer = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 600000,  // OWASP 2024 compliant
                hash: 'SHA-256'
            },
            keyMaterial,
            256
        );
        
        // Convertir a hex
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
        
        return `${saltHex}:${hashHex}`;
    }

    try {
        // Paso 1: Verificar que existan los roles
        console.log('📋 Verificando roles...');
        const rolesRes = db.exec("SELECT id, name FROM user_roles WHERE name IN ('admin', 'viewer')");
        
        if (!rolesRes.length || !rolesRes[0].values.length) {
            console.error('❌ No se encontraron roles en la base de datos');
            console.log('Ejecuta primero la inicialización de la base de datos');
            return;
        }

        const roles = {};
        rolesRes[0].values.forEach(row => {
            roles[row[1]] = row[0];
        });

        console.log('✅ Roles encontrados:', roles);
        console.log('');

        // Paso 2: Hashear las contraseñas
        console.log('🔐 Generando hashes de contraseñas...');
        const adminHash = await hashPassword('admin123');
        const demoHash = await hashPassword('demo123');
        console.log('✅ Hashes generados\n');

        // Paso 3: Eliminar usuarios existentes si existen
        console.log('🗑️  Eliminando usuarios existentes (si existen)...');
        db.run("DELETE FROM users WHERE username IN ('admin', 'demo')");
        console.log('✅ Usuarios antiguos eliminados\n');

        // Paso 4: Crear usuario ADMIN
        console.log('👤 Creando usuario ADMIN...');
        db.run(`
            INSERT INTO users (
                username, email, full_name, display_name, password_hash, role_id, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            'admin',
            'admin@accountexpress.com',
            'Administrador del Sistema',
            'Admin',
            adminHash,
            roles['admin'],
            1
        ]);
        console.log('✅ Usuario ADMIN creado');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('   Role: admin\n');

        // Paso 5: Crear usuario DEMO
        console.log('👤 Creando usuario DEMO...');
        db.run(`
            INSERT INTO users (
                username, email, full_name, display_name, password_hash, role_id, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            'demo',
            'demo@accountexpress.com',
            'Usuario de Demostración',
            'Demo',
            demoHash,
            roles['admin'],  // Demo también es admin para la demostración
            1
        ]);
        console.log('✅ Usuario DEMO creado');
        console.log('   Username: demo');
        console.log('   Password: demo123');
        console.log('   Role: admin\n');

        // Paso 6: Verificar que se crearon correctamente
        console.log('🔍 Verificando usuarios creados...');
        const verifyRes = db.exec(`
            SELECT u.username, u.email, u.full_name, r.name as role
            FROM users u
            JOIN user_roles r ON u.role_id = r.id
            WHERE u.username IN ('admin', 'demo')
        `);

        if (verifyRes.length && verifyRes[0].values.length === 2) {
            console.log('✅ Verificación exitosa:');
            verifyRes[0].values.forEach(row => {
                console.log(`   - ${row[0]} (${row[1]}) - Rol: ${row[3]}`);
            });
        } else {
            console.error('⚠️  Advertencia: No se pudieron verificar todos los usuarios');
        }

        console.log('\n' + '='.repeat(50));
        console.log('✅ ¡PROCESO COMPLETADO EXITOSAMENTE!');
        console.log('='.repeat(50));
        console.log('\n📝 CREDENCIALES DE ACCESO:');
        console.log('\n1️⃣  ADMIN:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('\n2️⃣  DEMO:');
        console.log('   Username: demo');
        console.log('   Password: demo123');
        console.log('\n🔄 Recarga la página (F5) y prueba hacer login');
        console.log('');

    } catch (error) {
        console.error('❌ ERROR:', error);
        console.error('Detalles:', error.message);
    }
})();
