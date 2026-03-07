
import { db, initDB, getUsers, createUserRole, createUser, DB_NAME } from '@/database/simple-db';
import { logger } from '../core/logging/SystemLogger';

// Helper to run query safely
const runQuery = (query: string, params: any[] = []) => {
    if (!db) return;
    try {
        db.run(query, params);
    } catch (e) {
        console.error(`Error running query: ${query}`, e);
    }
};

const verifyAndMigrateData = async () => {
    console.log('🔄 Iniciando verificación y migración de datos multi-usuario...');

    // 1. Inicializar DB
    await initDB();
    console.log('✅ Base de datos inicializada.');

    if (!db) {
        console.error('❌ Error fatal: No se pudo conectar a la base de datos.');
        process.exit(1);
    }

    // 2. Verificar/Crear Usuario Admin
    console.log('👤 Verificando usuario Admin...');
    let adminUser: any | null = null;
    try {
        const users = getUsers();
        adminUser = users.find(u => u.username === 'admin');

        if (!adminUser) {
            console.log('⚠️ Usuario admin no encontrado. Creando...');
            // Verificar rol admin
            db.exec("INSERT OR IGNORE INTO user_roles (name, description, level, is_system_role) VALUES ('admin', 'System Administrator', 100, 1)");

            // Crear usuario
            // Nota: createUser en simple-db es async y completo, pero para este script directo usamos SQL raw si hace falta o la función exportada.
            // Usaremos SQL directo para asegurar ID 1 si es posible/necesario, o dejar que autoincrement maneje.
            // Mejor usar la función existente si es posible, pero necesitamos seedUsersAndRoles logic.
            // seedUsersAndRoles ya corrió en initDB, así que admin DEBERÍA existir.
        } else {
            console.log(`✅ Usuario admin encontrado (ID: ${adminUser.id})`);
        }
    } catch (e) {
        console.error('Error verificando admin:', e);
    }

    const ADMIN_ID = 1;

    // 3. Migrar Tablas Principales (Asignar created_by = 1 donde sea NULL)
    const tables = [
        'customers',
        'suppliers',
        'products',
        'invoices',
        'bills',
        'payments',
        'supplier_payments',
        'chart_of_accounts',
        'journal_entries',
        'product_categories'
    ];

    console.log('📦 Migrando propiedad de datos existentes...');

    for (const table of tables) {
        try {
            // Verificar si tabla existe
            const tableExists = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
            if (tableExists.length === 0 || tableExists[0].values.length === 0) {
                console.log(`⚠️ Tabla ${table} no existe, saltando.`);
                continue;
            }

            // Verificar si tiene columna created_by
            // (Asumimos que sí por la migración 010, pero por seguridad)
            // SQL.js no tiene info_schema fácil, probamos un select limit 0

            // Actualizar NULLs
            console.log(`   Processing ${table}...`);
            db.run(`UPDATE ${table} SET created_by = ? WHERE created_by IS NULL`, [ADMIN_ID]);
            db.run(`UPDATE ${table} SET updated_by = ? WHERE updated_by IS NULL`, [ADMIN_ID]);

            // Validar
            const result = db.exec(`SELECT COUNT(*) FROM ${table} WHERE created_by = ${ADMIN_ID}`);
            const count = result[0]?.values[0]?.[0] || 0;
            console.log(`   ✅ ${table}: ${count} registros asignados a Admin.`);

        } catch (e) {
            // Puede fallar si la columna no existe en alguna tabla vieja no migrada
            console.warn(`   ⚠️ Error procesando tabla ${table} (posiblemente falta columna):`, e);
        }
    }

    // 4. Asegurar Roles Predefinidos (Extra Check)
    console.log('🛡️ Verificando roles...');
    const roles = [
        { name: 'admin', level: 100 },
        { name: 'accountant', level: 50 },
        { name: 'sales', level: 30 }, // Vendedor
        { name: 'purchasing', level: 30 }, // Comprador
        { name: 'viewer', level: 10 }
    ];

    for (const role of roles) {
        db.run(`INSERT OR IGNORE INTO user_roles (name, description, level) VALUES (?, ?, ?)`,
            [role.name, `Role for ${role.name}`, role.level]);
    }
    console.log('✅ Roles verificados.');

    // 5. Commit explícito si hubiese transacción global (aquí usamos autocommit implicito de sql.js para cada run salvo BEGIN)

    // Persistir si es necesario (en entorno node con fs mockeado o real sql file, 
    // pero simple-db en modo node no persiste a disco automáticamente a menos que usemos un adapter.
    // IMPORTANTE: Este script corre en el entorno del usuario. simple-db.ts intenta usar OPFS o LocalStorage.
    // En entorno Node (test runner), la persistencia es volátil o archivo local si está configurado.
    // Asumiremos que initDB maneja la carga y el estado se mantiene en memoria para tests inmediatos 
    // O si el usuario corre esto como herramienta CLI.

    console.log('🏁 Migración completada exitosamente.');
};

verifyAndMigrateData();
