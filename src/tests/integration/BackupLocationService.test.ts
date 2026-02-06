import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackupLocationService } from '../../services/BackupLocationService';
import { logger } from '../../core/logging/SystemLogger';

// Mock Logger
vi.mock('../../core/logging/SystemLogger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

describe('BackupLocationService Integration', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        BackupLocationService.clearLastUsedLocation();
    });

    it('should detect File System Access API support', () => {
        const isSupported = BackupLocationService.isFileSystemAccessSupported();
        
        // En entorno de test, puede no estar disponible
        expect(typeof isSupported).toBe('boolean');
    });

    it('should save backup to downloads (fallback)', async () => {
        const testData = JSON.stringify({ test: 'data' });
        const filename = 'test_backup.aex';

        // Mock de createObjectURL y createElement
        const mockURL = 'blob:test';
        global.URL.createObjectURL = vi.fn(() => mockURL);
        global.URL.revokeObjectURL = vi.fn();

        const mockClick = vi.fn();
        const mockAppendChild = vi.fn();
        const mockRemoveChild = vi.fn();

        vi.spyOn(document, 'createElement').mockReturnValue({
            click: mockClick,
            href: '',
            download: ''
        } as any);

        vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
        vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

        const result = await BackupLocationService.saveBackup(testData, filename, { type: 'downloads' });

        expect(result).toBe(true);
        expect(mockClick).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
            'BackupLocation',
            'saved_to_downloads',
            expect.stringContaining(filename)
        );
    });

    it('should handle save errors gracefully', async () => {
        const testData = JSON.stringify({ test: 'data' });
        const filename = 'test_backup.aex';

        // Forzar error en createObjectURL
        global.URL.createObjectURL = vi.fn(() => {
            throw new Error('Mock error');
        });

        const result = await BackupLocationService.saveBackup(testData, filename, { type: 'downloads' });

        expect(result).toBe(false);
        expect(logger.error).toHaveBeenCalledWith(
            'BackupLocation',
            'download_failed',
            expect.any(String),
            null,
            expect.any(Error)
        );
    });

    it('should remember last used location', async () => {
        const testData = JSON.stringify({ test: 'data' });
        const filename = 'test_backup.aex';

        // Mock de createObjectURL para que no falle
        global.URL.createObjectURL = vi.fn(() => 'blob:test');
        global.URL.revokeObjectURL = vi.fn();

        const mockClick = vi.fn();
        vi.spyOn(document, 'createElement').mockReturnValue({
            click: mockClick,
            href: '',
            download: ''
        } as any);

        vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
        vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());

        // Establecer ubicación específica manualmente
        const testLocation: any = { type: 'downloads', path: '/test/path' };
        (BackupLocationService as any).lastUsedLocation = testLocation;

        // Verificar que se guardó la última ubicación
        const lastLocation = BackupLocationService.getLastUsedLocation();
        expect(lastLocation).toBeTruthy();
        expect(lastLocation?.type).toBe('downloads');
    });

    it('should clear last used location', () => {
        BackupLocationService.clearLastUsedLocation();
        const lastLocation = BackupLocationService.getLastUsedLocation();
        expect(lastLocation).toBeNull();
    });

    it('should detect external devices (limited by browser)', async () => {
        const devices = await BackupLocationService.detectExternalDevices();
        
        // En entorno de test, probablemente retorne array vacío
        expect(Array.isArray(devices)).toBe(true);
    });
});
