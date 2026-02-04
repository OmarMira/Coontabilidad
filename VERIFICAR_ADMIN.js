// ============================================
// SCRIPT PARA VERIFICAR USUARIO ADMIN
// ============================================
// Copia y pega este script en la consola del navegador (F12)

(function verificarAdmin() {
    console.log('🔍 Verificando usuario admin...\n');

    const db = window.db || window.getDB?.();
    
    if (!db) {
        console.error('❌ No se pudo acceder a la base de datos');
        return;
    }

    try {
        // 1. Verificar si existe el usuario admin
        const result = db.exec("SELECT id, username, email, password_hash, is_active FROM users WHERE username = 'admin'");
        
        if (result.length === 0 || result[0].values.length === 0) {
            console.error('❌ NO EXISTE el usuario admin');
            console.log('\n💡 Necesitas crear el usuario admin. Ejecuta este script:\n');
            console.log(`
(async function crearAdmin() {
    const db = window.db || window.getDB?.();
    
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const keyMaterial = await crypto.subtle.importKey(
            'raw', data, 'PBKDF2', false, ['deriveBits']
        );
        const hashBuffer = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial, 256
        );
        const hashArray = new Uint8Array(hashBuffer);
        const combined = new Uint8Array(salt.length + hashArray.length);
        combined.set(salt);
        combined.set(hashArray, salt.length);
        return btoa(String.fromCharCode(...combined));
    }
    
    const hash = await hashPassword('admin123');
    db.run(\`
        INSERT INTO users (username, email, password_hash, full_name, display_name, role_id, is_active)
        VALUES ('admin', 'admin@accountexpress.com', ?, 'System Admin', 'Admin', 1, 1)
    \`, [hash]);
    
    console.log('✅ Usuario admin creado');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
})();
            `);
            return;
        }

        const admin = result[0].values[0];
        const [id, username, email, password_hash, is_active] = admin;

        console.log('✅ Usuario admin encontrado:');
        console.log('   ID:', id);
        console.log('   Username:', username);
        console.log('   Email:', email);
        console.log('   Activo:', is_active ? 'Sí' : 'No');
        console.log('   Hash:', password_hash ? password_hash.substring(0, 20) + '...' : 'NO TIENE HASH');

        if (!password_hash) {
            console.error('\n❌ El usuario admin NO TIENE contraseña (password_hash es NULL)');
            console.log('\n💡 Ejecuta este script para asignar contraseña:\n');
            console.log(`
(async function asignarPassword() {
    const db = window.db || window.getDB?.();
    
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const keyMaterial = await crypto.subtle.importKey(
            'raw', data, 'PBKDF2', false, ['deriveBits']
        );
        const hashBuffer = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial, 256
        );
        const hashArray = new Uint8Array(hashBuffer);
        const combined = new Uint8Array(salt.length + hashArray.length);
        combined.set(salt);
        combined.set(hashArray, salt.length);
        return btoa(String.fromCharCode(...combined));
    }
    
    const hash = await hashPassword('admin123');
    db.run("UPDATE users SET password_hash = ? WHERE username = 'admin'", [hash]);
    
    console.log('✅ Contraseña asignada a admin');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
})();
            `);
            return;
        }

        if (!is_active) {
            console.error('\n❌ El usuario admin está DESACTIVADO');
            console.log('\n💡 Ejecuta este script para activarlo:\n');
            console.log(`
db.run("UPDATE users SET is_active = 1 WHERE username = 'admin'");
console.log('✅ Usuario admin activado');
            `);
            return;
        }

        console.log('\n✅ El usuario admin está configurado correctamente');
        console.log('\n🔐 Contraseñas que deberías probar:');
        console.log('   1. admin123');
        console.log('   2. admin');
        console.log('   3. Admin123');
        console.log('   4. password');
        
        console.log('\n💡 Si ninguna funciona, ejecuta este script para resetear a "admin123":\n');
        console.log(`
(async function resetPassword() {
    const db = window.db || window.getDB?.();
    
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const keyMaterial = await crypto.subtle.importKey(
            'raw', data, 'PBKDF2', false, ['deriveBits']
        );
        const hashBuffer = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial, 256
        );
        const hashArray = new Uint8Array(hashBuffer);
        const combined = new Uint8Array(salt.length + hashArray.length);
        combined.set(salt);
        combined.set(hashArray, salt.length);
        return btoa(String.fromCharCode(...combined));
    }
    
    const hash = await hashPassword('admin123');
    db.run("UPDATE users SET password_hash = ? WHERE username = 'admin'", [hash]);
    
    console.log('✅ Contraseña reseteada');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
})();
        `);

    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
