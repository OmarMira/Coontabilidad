/**
 * Script de inicialización forzada de la base de datos
 * Ejecutar si los usuarios no existen o el login no funciona
 */

import { initDB, getUserRoles, createUserRole, createUser } from '../database/simple-db';

export const forceInitializeDatabase = async () => {
    console.log('🔄 Iniciando reinicialización forzada de la base de datos...');

    try {
        // 1. Inicializar BD
        await initDB();
        console.log('✅ Base de datos inicializada');

        // 2. Verificar roles
        const roles = getUserRoles();
        console.log(`📊 Roles encontrados: ${roles.length}`);

        // 3. Si no hay roles, crearlos
        if (roles.length === 0) {
            console.log('⚠️ No hay roles, creando roles del sistema...');

            const adminRole = createUserRole({
                name: 'admin',
                description: 'Administrador del sistema con acceso completo',
                level: 100
            });

            const accountantRole = createUserRole({
                name: 'accountant',
                description: 'Contador con acceso a módulos contables',
                level: 50
            });

            const viewerRole = createUserRole({
                name: 'viewer',
                description: 'Usuario de solo lectura',
                level: 10
            });

            console.log('✅ Roles creados:', { adminRole, accountantRole, viewerRole });
        }

        // 4. Obtener roles actualizados
        const updatedRoles = getUserRoles();
        const adminRole = updatedRoles.find(r => r.name === 'admin');
        const accountantRole = updatedRoles.find(r => r.name === 'accountant');
        const viewerRole = updatedRoles.find(r => r.name === 'viewer');

        if (!adminRole || !accountantRole || !viewerRole) {
            console.error('❌ Error: No se pudieron crear los roles');
            return false;
        }

        // 5. Crear usuarios de prueba
        console.log('👥 Creando usuarios de prueba...');

        const adminUser = await createUser({
            username: 'admin',
            password: 'admin123',
            display_name: 'Administrador',
            role_id: adminRole.id
        });

        const demoUser = await createUser({
            username: 'demo',
            password: 'demo123',
            display_name: 'Usuario Demo',
            role_id: accountantRole.id
        });

        const viewerUser = await createUser({
            username: 'viewer',
            password: 'viewer123',
            display_name: 'Usuario Viewer',
            role_id: viewerRole.id
        });

        console.log('✅ Usuarios creados:', { adminUser, demoUser, viewerUser });

        console.log('🎉 Inicialización completada exitosamente!');
        console.log('📝 Usuarios disponibles:');
        console.log('   - admin / admin123 (Administrador)');
        console.log('   - demo / demo123 (Contador)');
        console.log('   - viewer / viewer123 (Solo lectura)');

        return true;
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        return false;
    }
};

// Exportar para uso en consola
if (typeof window !== 'undefined') {
    (window as any).forceInitDB = forceInitializeDatabase;
    console.log('💡 Función disponible: window.forceInitDB()');
}
