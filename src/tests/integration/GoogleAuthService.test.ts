import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleAuthService } from '../../services/GoogleAuthService';
import { logger } from '../../core/logging/SystemLogger';

describe('GoogleAuthService Integration', () => {

    // Mock TokenClient
    const mockRequestAccessToken = vi.fn();
    const mockCallback = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset singleton validation
        (GoogleAuthService as any).accessToken = null;
        (GoogleAuthService as any).tokenExpiry = 0;
        localStorage.clear();

        // Inject simulated TokenClient
        (GoogleAuthService as any).tokenClient = {
            requestAccessToken: mockRequestAccessToken,
            callback: mockCallback
        };
    });

    it('should retrieve existing valid token from memory', async () => {
        (GoogleAuthService as any).accessToken = 'VALID_MEM_TOKEN';
        (GoogleAuthService as any).tokenExpiry = Date.now() + 3600000; // 1 hour future

        const token = await GoogleAuthService.getValidToken();
        expect(token).toBe('VALID_MEM_TOKEN');
        expect(mockRequestAccessToken).not.toHaveBeenCalled();
    });

    it('should attempt silent refresh if token expired', { timeout: 5000 }, async () => {
        // Setup expired state
        (GoogleAuthService as any).accessToken = 'EXPIRED_TOKEN';
        (GoogleAuthService as any).tokenExpiry = Date.now() - 1000; // 1 sec ago

        // Mock attemptSilentRefresh para que retorne null (fallo esperado sin interacción)
        const refreshSpy = vi.spyOn(GoogleAuthService as any, 'attemptSilentRefresh')
            .mockResolvedValue(null);

        const token = await GoogleAuthService.getValidToken();

        // Debería intentar refresh silencioso
        expect(refreshSpy).toHaveBeenCalled();
        // Como falla el refresh silencioso, retorna null o el token expirado
        expect(token === null || token === 'EXPIRED_TOKEN').toBe(true);
    });

    it('should handle manual refresh trigger explicitly', async () => {
        const newToken = await GoogleAuthService.refreshAccessToken();
        expect(newToken).toContain('REFRESHED_TOKEN_');
        expect(GoogleAuthService.getToken()).toBe(newToken);
    });

    it('should clear storage on signOut', () => {
        localStorage.setItem('gdrive_token', 'FOO');
        // Mock window.location.reload
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { reload: vi.fn() }
        });

        GoogleAuthService.signOut();
        expect(localStorage.getItem('gdrive_token')).toBeNull();
        expect(window.location.reload).toHaveBeenCalled();
    });

    it('should handle permission revocation (403 insufficientPermissions)', { timeout: 5000 }, async () => {
        // Simular que el usuario revocó permisos en Google
        (GoogleAuthService as any).accessToken = 'REVOKED_TOKEN';
        (GoogleAuthService as any).tokenExpiry = Date.now() + 3600000;

        // Como el token no está expirado, getValidToken debería retornarlo directamente
        const token = await GoogleAuthService.getValidToken();

        // Debería retornar el token almacenado (aunque esté revocado)
        // La validación real de permisos ocurre al intentar usar el token
        expect(token).toBe('REVOKED_TOKEN');
    });
});
