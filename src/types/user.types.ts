/**
 * Tipos TypeScript para el sistema de gestión de usuarios
 */

export interface UserRole {
    id: number;
    name: string;
    description: string;
    level: number;
    permissions_json: string;
    is_system_role: boolean;
    created_at: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    full_name: string;
    display_name: string; // Keep for compatibility
    password_hash?: string;
    role_id: number;
    role_name?: string;
    permissions?: Record<string, string[]>;
    role_description?: string;
    role_level?: number;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateUserDto {
    username: string;
    email: string;
    full_name: string;
    password: string;
    display_name: string;
    role_id: number;
}

export interface UpdateUserDto {
    email?: string;
    full_name?: string;
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

export interface AuditEntry {
    id: number;
    user_id: number;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'OTHER';
    entity_type: string;
    entity_id: string | number;
    old_value?: string;
    new_value?: string;
    ip_address?: string;
    timestamp: string;
}
