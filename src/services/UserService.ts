/**
 * UserService - Servicio de gestión de usuarios
 * Integrado con sistema de auditoría y seguridad existente
 */

import {
    createUser as dbCreateUser,
    getUsers as dbGetUsers,
    getUserByUsername as dbGetUserByUsername,
    updateUser as dbUpdateUser,
    deactivateUser as dbDeactivateUser,
    getUserRoles as dbGetUserRoles,
    updateUserPassword as dbUpdateUserPassword,
    verifyPassword,
    hashPassword
} from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';
import type { User, UserRole, CreateUserDto, UpdateUserDto, UserFilters, UserServiceResponse } from '../types/user.types';

/**
 * Servicio singleton para gestión de usuarios
 */
export class UserService {
    private static instance: UserService;

    private constructor() {
        logger.info('UserService', 'init', 'UserService inicializado');
    }

    /**
     * Obtener instancia singleton
     */
    static getInstance(): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService();
        }
        return UserService.instance;
    }

    /**
     * Crear un nuevo usuario
     */
    async createUser(data: CreateUserDto, createdBy?: number): Promise<UserServiceResponse<number>> {
        try {
            // Validaciones
            if (!data.username || data.username.length < 3) {
                return { success: false, message: 'El nombre de usuario debe tener al menos 3 caracteres' };
            }

            if (!data.password || data.password.length < 6) {
                return { success: false, message: 'La contraseña debe tener al menos 6 caracteres' };
            }

            if (!data.email || !data.email.includes('@')) {
                return { success: false, message: 'La dirección de email no es válida' };
            }

            if (!data.full_name || data.full_name.length < 2) {
                return { success: false, message: 'El nombre completo es requerido' };
            }

            if (!data.display_name || data.display_name.length < 2) {
                return { success: false, message: 'El nombre para mostrar es requerido' };
            }

            // Validar que el rol existe
            const roles = dbGetUserRoles();
            const roleExists = roles.some(r => r.id === data.role_id);
            if (!roleExists) {
                return { success: false, message: 'El rol especificado no existe' };
            }

            // Crear usuario
            const result = await dbCreateUser(data);

            if (result.success && result.userId) {
                logger.info('UserService', 'user_created', `Usuario creado: ${data.username}`, {
                    userId: result.userId,
                    createdBy: createdBy || 1
                });

                return {
                    success: true,
                    message: 'Usuario creado correctamente',
                    data: result.userId
                };
            }

            return { success: false, message: result.message };
        } catch (error) {
            logger.error('UserService', 'create_user_error', 'Error al crear usuario', { username: data.username }, error as Error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Error desconocido al crear usuario'
            };
        }
    }

    /**
     * Obtener lista de usuarios
     */
    getUsers(filters?: UserFilters): User[] {
        try {
            let users = dbGetUsers({ activeOnly: filters?.activeOnly });

            // Filtrar por rol si se especifica
            if (filters?.roleId) {
                users = users.filter(u => u.role_id === filters.roleId);
            }

            // Búsqueda por texto
            if (filters?.search) {
                const searchLower = filters.search.toLowerCase();
                users = users.filter(u =>
                    u.username.toLowerCase().includes(searchLower) ||
                    u.email.toLowerCase().includes(searchLower) ||
                    u.full_name.toLowerCase().includes(searchLower) ||
                    u.display_name.toLowerCase().includes(searchLower)
                );
            }

            // Remover password_hash de la respuesta
            return users.map(u => {
                const { password_hash, ...userWithoutPassword } = u;
                return userWithoutPassword as User;
            });
        } catch (error) {
            logger.error('UserService', 'get_users_error', 'Error al obtener usuarios', {}, error as Error);
            return [];
        }
    }

    /**
     * Obtener usuario por username
     */
    getUserByUsername(username: string, includePassword: boolean = false): User | null {
        try {
            const user = dbGetUserByUsername(username);

            if (!user) return null;

            // Por defecto, no incluir password_hash
            if (!includePassword) {
                const { password_hash, ...userWithoutPassword } = user;
                return userWithoutPassword as User;
            }

            return user as User;
        } catch (error) {
            logger.error('UserService', 'get_user_error', 'Error al obtener usuario', { username }, error as Error);
            return null;
        }
    }

    /**
     * Actualizar usuario
     */
    updateUser(id: number, updates: UpdateUserDto, updatedBy?: number): UserServiceResponse {
        try {
            // Validaciones
            if (updates.display_name && updates.display_name.length < 2) {
                return { success: false, message: 'El nombre para mostrar debe tener al menos 2 caracteres' };
            }

            // Validar que el rol existe si se está actualizando
            if (updates.role_id) {
                const roles = dbGetUserRoles();
                const roleExists = roles.some(r => r.id === updates.role_id);
                if (!roleExists) {
                    return { success: false, message: 'El rol especificado no existe' };
                }
            }

            const result = dbUpdateUser(id, updates);

            if (result.success) {
                logger.info('UserService', 'user_updated', `Usuario actualizado: ${id}`, {
                    updates,
                    updatedBy: updatedBy || 1
                });
            }

            return result;
        } catch (error) {
            logger.error('UserService', 'update_user_error', 'Error al actualizar usuario', { id, updates }, error as Error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Error desconocido al actualizar usuario'
            };
        }
    }

    /**
     * Desactivar usuario
     */
    deactivateUser(id: number, deactivatedBy?: number): UserServiceResponse {
        try {
            const result = dbDeactivateUser(id);

            if (result.success) {
                logger.info('UserService', 'user_deactivated', `Usuario desactivado: ${id}`, {
                    deactivatedBy: deactivatedBy || 1
                });
            }

            return result;
        } catch (error) {
            logger.error('UserService', 'deactivate_user_error', 'Error al desactivar usuario', { id }, error as Error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Error desconocido al desactivar usuario'
            };
        }
    }

    /**
     * Obtener roles disponibles
     */
    getRoles(): UserRole[] {
        try {
            return dbGetUserRoles() as UserRole[];
        } catch (error) {
            logger.error('UserService', 'get_roles_error', 'Error al obtener roles', {}, error as Error);
            return [];
        }
    }

    /**
     * Cambiar contraseña de usuario
     */
    async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<UserServiceResponse> {
        try {
            // Validar nueva contraseña
            if (!newPassword || newPassword.length < 6) {
                return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' };
            }

            // Obtener usuario con password_hash
            const users = dbGetUsers();
            const user = users.find(u => u.id === userId);

            if (!user || !user.password_hash) {
                return { success: false, message: 'Usuario no encontrado' };
            }

            // Verificar contraseña actual
            const isValid = await verifyPassword(currentPassword, user.password_hash);
            if (!isValid) {
                logger.warn('UserService', 'invalid_password', `Intento de cambio de contraseña con password incorrecta: ${userId}`);
                return { success: false, message: 'La contraseña actual es incorrecta' };
            }

            // Actualizar contraseña
            const result = await dbUpdateUserPassword(userId, newPassword);

            if (result.success) {
                logger.info('UserService', 'password_changed', `Contraseña cambiada para usuario: ${userId}`);
            }

            return result;
        } catch (error) {
            logger.error('UserService', 'change_password_error', 'Error al cambiar contraseña', { userId }, error as Error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Error desconocido al cambiar contraseña'
            };
        }
    }

    /**
     * Resetear contraseña de usuario (Administración)
     */
    async resetUserPassword(userId: number, newPassword: string): Promise<UserServiceResponse> {
        try {
            if (!newPassword || newPassword.length < 6) {
                return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' };
            }

            const result = await dbUpdateUserPassword(userId, newPassword);

            if (result.success) {
                logger.info('UserService', 'password_reset', `Contraseña reseteada por administrador para usuario: ${userId}`);
            }

            return result;
        } catch (error) {
            logger.error('UserService', 'reset_password_error', 'Error al resetear contraseña', { userId }, error as Error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Error al resetear la contraseña'
            };
        }
    }


    /**
     * Autenticar usuario (para login)
     */
    async authenticateUser(username: string, password: string): Promise<UserServiceResponse<User>> {
        try {
            // Obtener usuario con password_hash
            const user = dbGetUserByUsername(username);

            if (!user) {
                logger.warn('UserService', 'auth_failed', `Intento de login con usuario inexistente: ${username}`);
                return { success: false, message: 'Usuario o contraseña incorrectos' };
            }

            if (!user.is_active) {
                logger.warn('UserService', 'auth_inactive', `Intento de login con usuario inactivo: ${username}`);
                return { success: false, message: 'Usuario desactivado' };
            }

            // Verificar contraseña
            const isValid = await verifyPassword(password, user.password_hash);
            if (!isValid) {
                logger.warn('UserService', 'auth_invalid_password', `Intento de login con password incorrecta: ${username}`);
                return { success: false, message: 'Usuario o contraseña incorrectos' };
            }

            // Actualizar last_login
            dbUpdateUser(user.id, { last_login: new Date().toISOString() });

            // Remover password_hash de la respuesta
            const { password_hash, ...userWithoutPassword } = user;

            logger.info('UserService', 'auth_success', `Login exitoso: ${username}`, { userId: user.id });

            return {
                success: true,
                message: 'Autenticación exitosa',
                data: userWithoutPassword as User
            };
        } catch (error) {
            logger.error('UserService', 'auth_error', 'Error en autenticación', { username }, error as Error);
            return {
                success: false,
                message: 'Error en el proceso de autenticación'
            };
        }
    }

    /**
     * Verificar si un usuario tiene un rol específico
     */
    hasRole(user: User, roleName: string): boolean {
        return user.role_name === roleName;
    }

    /**
     * Verificar si un usuario tiene nivel de acceso suficiente
     */
    hasMinimumLevel(user: User, minimumLevel: number): boolean {
        return (user.role_level || 0) >= minimumLevel;
    }
}

// Exportar instancia singleton
export default UserService.getInstance();
