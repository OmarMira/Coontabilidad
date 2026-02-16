/**
 * RoleManager.tsx - Missing table, modal and form translations
 */

const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esKeys = {
    // Table headers
    "roleManager.table.name": "Nombre",
    "roleManager.table.description": "Descripción",
    "roleManager.table.level": "Nivel",
    "roleManager.table.actions": "Acciones",

    // Table content
    "roleManager.table.levelBadge": "Nivel {level}",

    // Tooltips
    "roleManager.tooltip.editRole": "Editar rol",
    "roleManager.tooltip.deleteRole": "Eliminar rol",

    // Empty state
    "roleManager.empty.title": "No hay roles creados",
    "roleManager.empty.desc": "Crea tu primer rol personalizado",

    // Modal titles
    "roleManager.modal.newRole": "Nuevo Rol",
    "roleManager.modal.editRole": "Editar Rol",

    // Form labels
    "roleManager.form.roleName": "Nombre del Rol",
    "roleManager.form.description": "Descripción",
    "roleManager.form.accessLevel": "Nivel de Acceso (0-100)",
    "roleManager.form.systemPermissions": "Permisos del Sistema",

    // Form placeholders
    "roleManager.form.namePlaceholder": "ej: manager, supervisor",
    "roleManager.form.descPlaceholder": "Descripción del rol",

    // Help text
    "roleManager.form.levelHelp": "0-10: Solo lectura | 11-50: Usuario estándar | 51-99: Avanzado | 100: Administrador"
};

const enKeys = {
    // Table headers
    "roleManager.table.name": "Name",
    "roleManager.table.description": "Description",
    "roleManager.table.level": "Level",
    "roleManager.table.actions": "Actions",

    // Table content
    "roleManager.table.levelBadge": "Level {level}",

    // Tooltips
    "roleManager.tooltip.editRole": "Edit role",
    "roleManager.tooltip.deleteRole": "Delete role",

    // Empty state
    "roleManager.empty.title": "No roles created",
    "roleManager.empty.desc": "Create your first custom role",

    // Modal titles
    "roleManager.modal.newRole": "New Role",
    "roleManager.modal.editRole": "Edit Role",

    // Form labels
    "roleManager.form.roleName": "Role Name",
    "roleManager.form.description": "Description",
    "roleManager.form.accessLevel": "Access Level (0-100)",
    "roleManager.form.systemPermissions": "System Permissions",

    // Form placeholders
    "roleManager.form.namePlaceholder": "e.g.: manager, supervisor",
    "roleManager.form.descPlaceholder": "Role description",

    // Help text
    "roleManager.form.levelHelp": "0-10: Read-only | 11-50: Standard user | 51-99: Advanced | 100: Administrator"
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

console.log('\n✅ RoleManager remaining translation keys added!');
console.log(`📊 Total: ${Object.keys(esKeys).length} keys per language`);
