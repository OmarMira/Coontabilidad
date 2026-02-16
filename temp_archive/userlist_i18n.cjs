/**
 * UserList.tsx i18n Translation Keys
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esKeys = {
    "userList.title": "Gestión de Usuarios",
    "userList.subtitle": "Administrar usuarios y permisos del sistema",
    "userList.newUser": "Nuevo Usuario",
    "userList.search": "Buscar usuarios...",
    "userList.table.user": "Usuario",
    "userList.table.name": "Nombre",
    "userList.table.role": "Rol",
    "userList.table.status": "Estado",
    "userList.table.lastAccess": "Último Acceso",
    "userList.table.actions": "Acciones",
    "userList.noRole": "Sin rol",
    "userList.status.active": "Activo",
    "userList.status.inactive": "Inactivo",
    "userList.never": "Nunca",
    "userList.editUser": "Editar usuario",
    "userList.deactivateUser": "Desactivar usuario",
    "userList.noUsers": "No se encontraron usuarios",
    "userList.noUsersSearch": "Intenta con otro término de búsqueda",
    "userList.noUsersCreate": "Crea tu primer usuario",
    "userList.stats.total": "Total Usuarios",
    "userList.stats.active": "Activos",
    "userList.stats.admins": "Administradores",
    "userList.confirmDeactivate": "¿Está seguro de desactivar este usuario?"
};

const enKeys = {
    "userList.title": "User Management",
    "userList.subtitle": "Manage system users and permissions",
    "userList.newUser": "New User",
    "userList.search": "Search users...",
    "userList.table.user": "User",
    "userList.table.name": "Name",
    "userList.table.role": "Role",
    "userList.table.status": "Status",
    "userList.table.lastAccess": "Last Access",
    "userList.table.actions": "Actions",
    "userList.noRole": "No role",
    "userList.status.active": "Active",
    "userList.status.inactive": "Inactive",
    "userList.never": "Never",
    "userList.editUser": "Edit user",
    "userList.deactivateUser": "Deactivate user",
    "userList.noUsers": "No users found",
    "userList.noUsersSearch": "Try another search term",
    "userList.noUsersCreate": "Create your first user",
    "userList.stats.total": "Total Users",
    "userList.stats.active": "Active",
    "userList.stats.admins": "Administrators",
    "userList.confirmDeactivate": "Are you sure you want to deactivate this user?"
};

function update(file, updates) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        let json = JSON.parse(content);

        Object.keys(updates).forEach(key => {
            json[key] = updates[key];
        });

        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file} with ${Object.keys(updates).length} keys`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esKeys);
update(enFile, enKeys);

console.log('\n✅ UserList translation keys added successfully!');
console.log(`📊 Total: ${Object.keys(esKeys).length} keys per language`);
