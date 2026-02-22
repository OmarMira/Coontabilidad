/**
 * Diagnóstico y Restauración Exhaustiva de Autenticación
 */
import {
    initDB,
    db,
    getUserRoles,
    createUserRole,
    createUser,
    updateUserPassword,
    getUserByUsername,
    hasUsers
} from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';

export const exhaustiveAuthDiagnostic = async () => {
    console.log('--- STARTING EXHAUSTIVE AUTH DIAGNOSTIC ---');

    try {
        // 1. Verificar Inicialización
        if (!db) {
            console.log('⚠️ Database not initialized. Attempting initDB()...');
            await initDB();
        }

        if (!db) {
            console.error('❌ CRITICAL: Could not initialize database.');
            return;
        }
        console.log('✅ Database is active.');

        // 2. Verificar Roles
        console.log('🔍 Checking user_roles...');
        const roles = getUserRoles();
        console.log('📊 Current roles:', roles);

        const systemRoles = [
            { name: 'admin', level: 100 },
            { name: 'accountant', level: 50 },
            { name: 'viewer', level: 10 }
        ];

        for (const sysRole of systemRoles) {
            const exists = roles.find(r => r.name === sysRole.name);
            if (!exists) {
                console.log(`➕ Creating missing role: ${sysRole.name}`);
                createUserRole({
                    name: sysRole.name,
                    description: `Sistema: ${sysRole.name}`,
                    level: sysRole.level
                });
            }
        }

        // Refrescar roles
        const updatedRoles = getUserRoles();
        console.log('✅ Final roles:', updatedRoles);

        // 3. Verificar Usuarios y Restaurar Contraseñas
        const systemUsers = [
            { username: 'admin', display_name: 'Administrador', password: 'admin123', role: 'admin' },
            { username: 'viewer', display_name: 'Usuario Viewer', password: 'viewer123', role: 'viewer' }
        ];

        for (const sysUser of systemUsers) {
            console.log(`👤 Processing user: ${sysUser.username}`);

            const role = updatedRoles.find(r => r.name === sysUser.role);
            if (!role) {
                console.error(`❌ Role ${sysUser.role} not found for user ${sysUser.username}`);
                continue;
            }

            const existingUser = getUserByUsername(sysUser.username);

            if (!existingUser) {
                console.log(`➕ User ${sysUser.username} not found. Creating...`);
                const result = await createUser({
                    username: sysUser.username,
                    password: sysUser.password,
                    display_name: sysUser.display_name,
                    role_id: role.id
                });
                console.log(`   Result:`, result);
            } else {
                console.log(`🔄 User ${sysUser.username} already exists. Resetting password...`);
                const result = await updateUserPassword(existingUser.id, sysUser.password);
                console.log(`   Password reset result:`, result);

                // Asegurarse de que esté activo
                (db as any).run('UPDATE users SET is_active = 1 WHERE id = ?', [existingUser.id]);
                console.log(`   User activated.`);
            }
        }

        console.log('--- DIAGNOSTIC COMPLETED ---');
        console.log('✅ You can now try logging in with:');
        console.log('   - admin / admin123');
        console.log('   - viewer / viewer123');

    } catch (error) {
        console.error('❌ Error during diagnostic:', error);
    }
};

// Expose to window
if (typeof window !== 'undefined') {
    (window as any).runAuthDiagnostic = exhaustiveAuthDiagnostic;
    console.log('💡 Run window.runAuthDiagnostic() to fix authentication issues.');
}
