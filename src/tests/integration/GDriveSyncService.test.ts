import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GDriveSyncService } from '../../services/GDriveSyncService';
import { GoogleAuthService } from '../../services/GoogleAuthService';
import { server } from '../../mocks/server';
import { http, HttpResponse, delay } from 'msw';
import { logger } from '../../core/logging/SystemLogger';

// Mock Logger to avoid visual noise
vi.mock('../../core/logging/SystemLogger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

describe('GDriveSyncService Integration', () => {

    const mockBlob = new Blob(['test content'], { type: 'application/json' });

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        // Ensure Auth has a valid token
        vi.spyOn(GoogleAuthService, 'getValidToken').mockResolvedValue('TEST_TOKEN');
        (GoogleAuthService as any).accessToken = 'TEST_TOKEN';
    });

    it('should handle Network Failure (503) with Retry logic', { timeout: 15000 }, async () => {
        // Scenario: 2 failures (503), then success
        let attempts = 0;
        server.use(
            http.post('https://www.googleapis.com/upload/drive/v3/files', async () => {
                attempts++;
                if (attempts <= 2) {
                    return new HttpResponse(null, { status: 503 });
                }
                return HttpResponse.json({ id: 'success_file_id' });
            })
        );

        const result = await GDriveSyncService.uploadBackup(mockBlob, 'retry_test.aex');

        expect(attempts).toBe(3); // 2 fails + 1 success
        expect(result).toBe(true);
    });

    it('should fail gracefully on Storage Quota Exceeded (403)', { timeout: 15000 }, async () => {
        vi.spyOn(GoogleAuthService, 'getValidToken').mockResolvedValue('QUOTA_LIMIT_TOKEN');

        // Handler is already set up in handlers.ts to respond to this token with 403 Quota

        const result = await GDriveSyncService.uploadBackup(mockBlob, 'quota_test.aex');

        expect(result).toBe(false);
        // We verify the logger call implicitly via result, or spy on logger if needed.
        // Check console error logs in report.
    });

    it('should prune old backups (Rotation Policy)', { timeout: 15000 }, async () => {
        // The mock handler returns 6 files. 
        // The service should delete the oldest (slice(5)).
        // We track DELETE requests.

        const deleteSpy = vi.fn();
        server.use(
            http.delete('https://www.googleapis.com/drive/v3/files/:fileId', ({ params }) => {
                deleteSpy(params.fileId);
                return new HttpResponse(null, { status: 204 });
            })
        );

        await GDriveSyncService.uploadBackup(mockBlob, 'rotation_test.aex');

        // Wait for async prune to complete (it's not awaited in uploadBackup)
        // With 15s timeout we can wait a bit longer to be safe
        await new Promise(r => setTimeout(r, 500));

        // Expect 'file_6' is newest (index 0) ... 'file_1' is oldest (index 5)
        // logic: if files > 5, delete files.slice(5).
        // Mock returns 6 files. Slice(5) gives the 6th element (index 5) -> file_1.
        expect(deleteSpy).toHaveBeenCalledWith('file_1'); // The oldest file
    });

    it('should recover from 401 Token Expiry during upload', { timeout: 15000 }, async () => {
        // 1. Initial token is EXPIRED_TOKEN (triggers 401 in mock)
        vi.spyOn(GoogleAuthService, 'getValidToken').mockResolvedValue('EXPIRED_TOKEN');

        // 2. Mock Refresh
        const refreshSpy = vi.spyOn(GoogleAuthService, 'refreshAccessToken').mockResolvedValue('NEW_VALID_TOKEN');

        // 3. Setup Mock: EXPIRED_TOKEN -> 401, NEW_VALID_TOKEN -> 200
        server.use(
            http.post('https://www.googleapis.com/upload/drive/v3/files', ({ request }) => {
                const auth = request.headers.get('Authorization');
                if (auth === 'Bearer EXPIRED_TOKEN') {
                    return HttpResponse.json({ error: { code: 401 } }, { status: 401 });
                }
                if (auth === 'Bearer NEW_VALID_TOKEN') {
                    return HttpResponse.json({ id: 'recovered_file_id' });
                }
                return HttpResponse.json({}, { status: 500 });
            })
        );

        const result = await GDriveSyncService.uploadBackup(mockBlob, 'auth_recovery.aex');

        expect(refreshSpy).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it('should handle large files (10MB) without memory leaks', { timeout: 30000 }, async () => {
        // Crear blob de 10MB
        const size10MB = 10 * 1024 * 1024;
        const largeData = new Uint8Array(size10MB);
        
        // Llenar con datos aleatorios
        for (let i = 0; i < size10MB; i++) {
            largeData[i] = Math.floor(Math.random() * 256);
        }
        
        const largeBlob = new Blob([largeData], { type: 'application/json' });
        
        // Medir memoria inicial (si está disponible)
        const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        // Intentar subir
        const result = await GDriveSyncService.uploadBackup(largeBlob, 'large_test.aex');
        
        // Verificar que se subió correctamente
        expect(result).toBe(true);
        
        // Medir memoria final
        const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        // Verificar que no hay fuga masiva de memoria (tolerancia de 20MB)
        if (initialMemory > 0 && finalMemory > 0) {
            const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
            expect(memoryIncrease).toBeLessThan(20); // Menos de 20MB de incremento
            logger.info('MemoryTest', 'large_file', `Memory increase: ${memoryIncrease.toFixed(2)}MB`);
        }
        
        // Limpiar
        largeData.fill(0);
    });

    it('should handle network latency gracefully', { timeout: 15000 }, async () => {
        // Simular latencia de red (500ms)
        server.use(
            http.post('https://www.googleapis.com/upload/drive/v3/files', async () => {
                await delay(500); // Simular latencia
                return HttpResponse.json({ id: 'latency_test_file_id' });
            })
        );

        const startTime = performance.now();
        const result = await GDriveSyncService.uploadBackup(mockBlob, 'latency_test.aex');
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        
        expect(result).toBe(true);
        expect(duration).toBeGreaterThan(500); // Al menos la latencia simulada
        expect(duration).toBeLessThan(2000); // Pero no demasiado tiempo
        
        logger.info('LatencyTest', 'duration', `Upload completed in ${duration.toFixed(0)}ms`);
    });
});
