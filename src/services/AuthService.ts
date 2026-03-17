import { logger } from '../core/logging/SystemLogger';
import { getDB } from '@/database/modules/db-core';
import { GoogleAuthService } from './GoogleAuthService';

export interface UserSession {
    userId: number;
    email: string;
    role: string;
    expiresAt: number;
    isDemo: boolean;
}

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export class AuthService {

    /**
     * Inicia sesión con Email y Contraseña
     */
    static async login(email: string, passwordHash: string): Promise<UserSession | null> {
        const db = getDB();
        if (!db) throw new Error("Database not initialized");

        try {
            // Validate user against DB
            const res = db.exec("SELECT id, email, role_id FROM users WHERE email = ? AND password_hash = ?", [email, passwordHash]);

            if (res.length > 0 && res[0].values.length > 0) {
                const user = res[0].values[0];
                return this.createSession(user[0] as number, user[1] as string, 'admin'); // TODO: Resolve role name
            }
            return null;
        } catch (e) {
            console.error('AUTH ERROR:', e);
            logger.error('AuthService', 'login_fail', 'Error during local login', null, e as Error);
            return null;
        }
    }

    /**
     * Crea una sesión real para un usuario autenticado
     */
    static createSession(userId: number, email: string, role: string): UserSession {
        const session: UserSession = {
            userId,
            email,
            role,
            expiresAt: Date.now() + SESSION_DURATION,
            isDemo: false
        };
        this.saveSession(session);
        return session;
    }

    /**
     * Crea sesión para modo Demo (Sin persistencia real de usuario)
     */
    static createDemoSession(): UserSession {
        const session: UserSession = {
            userId: 999999, // ID ficticio
            email: 'demo@accountexpress.local',
            role: 'demo',
            expiresAt: Date.now() + SESSION_DURATION,
            isDemo: true
        };
        this.saveSession(session);
        return session;
    }

    /**
     * Guarda la sesión en localStorage
     */
    private static saveSession(session: UserSession) {
        localStorage.setItem('ae_session', JSON.stringify(session));
    }

    /**
     * Recupera la sesión activa si es válida
     */
    static getSession(): UserSession | null {
        try {
            const raw = localStorage.getItem('ae_session');
            if (!raw) return null;

            const session = JSON.parse(raw) as UserSession;
            if (Date.now() > session.expiresAt) {
                this.logout();
                return null;
            }
            return session;
        } catch {
            return null;
        }
    }

    static logout() {
        localStorage.removeItem('ae_session');
        GoogleAuthService.signOut();
    }
}
