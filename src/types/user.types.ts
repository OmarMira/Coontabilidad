/**
 * Tipos TypeScript para el sistema de gestión de usuarios
 */

export interface UserRole {
    id: number;
    name: 'admin' | 'accountant' | 'viewer';
    description: string;
    level: number;
    created_at: string;
}

export interface User {
    id: number;
    username: string;
    display_name: string;
    password_hash?: string; // Solo para uso interno, nunca exponer
    role_id: number;
    role_name?: string;
    role_description?: string;
    role_level?: number;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateUserDto {
    username: string;
    password: string;
    display_name: string;
    role_id: number;
}

export interface UpdateUserDto {
    display_name?: string;
    role_id?: number;
    is_active?: boolean;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

export interface UserFilters {
    activeOnly?: boolean;
    roleId?: number;
    search?: string;
}

export interface UserServiceResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}
