// SCRIPT PARA ARREGLAR LOGIN - Copia TODO en la consola del navegador (F12)
(async function() {
    const db = window.db || window.getDB?.();
    if (!db) { console.error('❌ DB no encontrada'); return; }
    
    async function hash(pwd) {
        const enc = new TextEncoder();
        const data = enc.encode(pwd);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.importKey('raw', data, 'PBKDF2', false, ['deriveBits']);
        const hashBuf = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256
        );
        const hashArr = new Uint8Array(hashBuf);
        const combined = new Uint8Array(salt.length + hashArr.length);
        combined.set(salt);
        combined.set(hashArr, salt.length);
        return btoa(String.fromCharCode(...combined));
    }
    
    const users = [
        { user: 'admin', pwd: 'admin123', email: 'admin@empresa.com', name: 'Admin' },
        { user: 'demo', pwd: 'demo123', email: 'demo@empresa.com', name: 'Demo' }
    ];
    
    for (const u of users) {
        const h = await hash(u.pwd);
        const exists = db.exec(`SELECT id FROM users WHERE username = ?`, [u.user]);
        
        if (exists.length === 0 || exists[0].values.length === 0) {
            db.run(`INSERT INTO users (username, email, display_name, password_hash, role_id, is_active) 
                    VALUES (?, ?, ?, ?, 1, 1)`, [u.user, u.email, u.name, h]);
            console.log(`✅ Usuario ${u.user} creado`);
        } else {
            db.run(`UPDATE users SET password_hash = ?, is_active = 1 WHERE username = ?`, [h, u.user]);
            console.log(`✅ Usuario ${u.user} actualizado`);
        }
    }
    
    console.log('\n🎉 LISTO! Ahora puedes entrar con:');
    console.log('   • admin / admin123');
    console.log('   • demo / demo123');
    console.log('\n💡 O usa el botón "ACCESO RÁPIDO DEMO"');
})();
