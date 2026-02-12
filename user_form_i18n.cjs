
const fs = require('fs');

const esFile = 'src/assets/locales/es.json';
const enFile = 'src/assets/locales/en.json';

const esUpdates = {
    "userForm.editUser": "Editar Usuario",
    "userForm.newUser": "Nuevo Usuario",
    "userForm.editUserDesc": "Modificar información del usuario",
    "userForm.newUserDesc": "Crear un nuevo usuario del sistema",
    "userForm.username": "Nombre de Usuario",
    "userForm.usernamePlaceholder": "usuario123",
    "userForm.email": "Email",
    "userForm.emailPlaceholder": "juan@ejemplo.com",
    "userForm.fullName": "Nombre Completo",
    "userForm.fullNamePlaceholder": "Juan Pérez",
    "userForm.displayName": "Nombre para Mostrar",
    "userForm.displayNamePlaceholder": "Juan Pérez",
    "userForm.userRole": "Rol del Usuario",
    "userForm.selectRole": "Seleccionar rol...",
    "userForm.changePasswordOptional": "Cambiar Contraseña (Opcional)",
    "userForm.userPassword": "Contraseña del Usuario",
    "userForm.generatePassword": "Generar Password",
    "userForm.generatedPasswordAlert": "Contraseña generada: {pwd}\n\nPor favor, cópiela antes de guardar.",
    "userForm.newPassword": "Nueva Contraseña",
    "userForm.confirmPassword": "Confirmar Contraseña",
    "userForm.passwordPlaceholder": "••••••••",
    "userForm.passwordLeaveBlank": "* Deje en blanco si no desea cambiar la contraseña actual.",
    "userForm.cancel": "Cancelar",
    "userForm.save": "Guardar",
    "userForm.updating": "Actualizando...",
    "userForm.saving": "Guardando...",
    "userForm.update": "Actualizar",
    "userForm.create": "Crear Usuario",
    "userForm.errorSaving": "Error al guardar el usuario",
    "userForm.errorPasswordLength": "La contraseña debe tener al menos 6 caracteres",
    "userForm.errorPasswordMismatch": "Las contraseñas no coinciden",
    "userForm.errorUsernameLength": "El nombre de usuario debe tener al menos 3 caracteres",
    "userForm.errorEmailInvalid": "Debe ingresar un email válido",
    "userForm.errorFullNameRequired": "El nombre completo es requerido",
    "userForm.errorDisplayNameRequired": "El nombre para mostrar es requerido",
    "userForm.errorRoleRequired": "Debe seleccionar un rol"
};

const enUpdates = {
    "userForm.editUser": "Edit User",
    "userForm.newUser": "New User",
    "userForm.editUserDesc": "Modify user information",
    "userForm.newUserDesc": "Create a new system user",
    "userForm.username": "Username",
    "userForm.usernamePlaceholder": "user123",
    "userForm.email": "Email",
    "userForm.emailPlaceholder": "john@example.com",
    "userForm.fullName": "Full Name",
    "userForm.fullNamePlaceholder": "John Doe",
    "userForm.displayName": "Display Name",
    "userForm.displayNamePlaceholder": "John Doe",
    "userForm.userRole": "User Role",
    "userForm.selectRole": "Select role...",
    "userForm.changePasswordOptional": "Change Password (Optional)",
    "userForm.userPassword": "User Password",
    "userForm.generatePassword": "Generate Password",
    "userForm.generatedPasswordAlert": "Generated password: {pwd}\n\nPlease copy it before saving.",
    "userForm.newPassword": "New Password",
    "userForm.confirmPassword": "Confirm Password",
    "userForm.passwordPlaceholder": "••••••••",
    "userForm.passwordLeaveBlank": "* Leave blank if you don't want to change current password.",
    "userForm.cancel": "Cancel",
    "userForm.save": "Save",
    "userForm.updating": "Updating...",
    "userForm.saving": "Saving...",
    "userForm.update": "Update",
    "userForm.create": "Create User",
    "userForm.errorSaving": "Error saving user",
    "userForm.errorPasswordLength": "Password must be at least 6 characters long",
    "userForm.errorPasswordMismatch": "Passwords do not match",
    "userForm.errorUsernameLength": "Username must be at least 3 characters long",
    "userForm.errorEmailInvalid": "Must enter a valid email",
    "userForm.errorFullNameRequired": "Full name is required",
    "userForm.errorDisplayNameRequired": "Display name is required",
    "userForm.errorRoleRequired": "Must select a role"
};

function update(file, updates) {
    try {
        let content = fs.readFileSync(file, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        let json = JSON.parse(content);
        Object.assign(json, updates);
        fs.writeFileSync(file, JSON.stringify(json, null, 4));
        console.log(`✅ Updated ${file}`);
    } catch (e) {
        console.error(`❌ Error updating ${file}: ${e.message}`);
    }
}

update(esFile, esUpdates);
update(enFile, enUpdates);
