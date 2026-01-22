/**
 * Script de verificación de roles en la base de datos
 * Ejecutar desde la consola del navegador para verificar que los roles existen
 */

import { getUserRoles } from '../database/simple-db';

export const verifyRoles = () => {
    console.log('=== VERIFICACIÓN DE ROLES ===');

    try {
        const roles = getUserRoles();
        console.log('Roles encontrados:', roles);

        if (roles.length === 0) {
            console.error('❌ NO HAY ROLES EN LA BASE DE DATOS');
            console.log('Solución: La base de datos necesita reinicializarse');
            console.log('1. Borrar datos de aplicación en DevTools > Application > Storage');
            console.log('2. Recargar la página');
        } else {
            console.log('✅ Roles disponibles:');
            roles.forEach(role => {
                console.log(`  - ${role.name} (nivel ${role.level}): ${role.description}`);
            });
        }

        return roles;
    } catch (error) {
        console.error('Error al verificar roles:', error);
        return [];
    }
};

// Auto-ejecutar al importar
if (typeof window !== 'undefined') {
    (window as any).verifyRoles = verifyRoles;
    console.log('Función verifyRoles() disponible en consola');
}
