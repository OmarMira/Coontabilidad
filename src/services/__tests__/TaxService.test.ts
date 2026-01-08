import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxService } from '../TaxService';
import { DatabaseService } from '../../database/DatabaseService';

// Mock DatabaseService
vi.mock('../../database/DatabaseService', () => {
    return {
        DatabaseService: {
            executeQuery: vi.fn(),
            dbInstance: {}
        }
    };
});

// Mock BasicEncryption (skip hashing complexity for unit tests)
vi.mock('../../core/security/BasicEncryption', () => ({
    BasicEncryption: {
        hash: vi.fn().mockResolvedValue('mock-hash-123')
    }
}));

describe('TaxService Logic', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const MOCK_CONFIG_MIAMI = {
        county_code: 'MIAMI-DADE',
        county_name: 'Miami-Dade',
        base_rate: 600, // 6%
        surtax_rate: 100, // 1%
        effective_date: '2020-01-01',
        expiry_date: null
    };

    it('Debe calcular impuesto exacto 7% para Miami-Dade ($100 -> $7)', async () => {
        (DatabaseService.executeQuery as any).mockResolvedValue([MOCK_CONFIG_MIAMI]);

        const amount = 10000; // $100.00
        const result = await TaxService.calculateFloridaSalesTax(amount, 'MIAMI-DADE', '2026-01-01');

        expect(result.taxAmount).toBe(700);
        expect(result.totalRate).toBe(700);
        expect(DatabaseService.executeQuery).toHaveBeenCalledWith(
            expect.stringContaining('SELECT * FROM florida_tax_config'),
            ['MIAMI-DADE']
        );
    });

    it('Debe aplicar redondeo estandar (DOR Rule): $1.55 * 7% = 10.85c -> 11c', async () => {
        (DatabaseService.executeQuery as any).mockResolvedValue([MOCK_CONFIG_MIAMI]);

        // $1.55 = 155 cents.
        // 155 * 0.07 = 10.85
        // Round(10.85) = 11
        const result = await TaxService.calculateFloridaSalesTax(155, 'MIAMI-DADE', '2026-01-01');
        expect(result.taxAmount).toBe(11);
    });

    it('Debe aplicar redondeo estandar hacia abajo: $1.00 * 7% = 7.00c -> 7c', async () => {
        (DatabaseService.executeQuery as any).mockResolvedValue([MOCK_CONFIG_MIAMI]);
        // 100 * 0.07 = 7
        const result = await TaxService.calculateFloridaSalesTax(100, 'MIAMI-DADE', '2026-01-01');
        expect(result.taxAmount).toBe(7);
    });

    it('Debe fallar si el condado no existe', async () => {
        (DatabaseService.executeQuery as any).mockResolvedValue([]); // Empty

        await expect(TaxService.calculateFloridaSalesTax(100, 'INVALID', '2026-01-01'))
            .rejects
            .toThrow('County code not found');
    });

    it('Debe validar que el monto sea entero', async () => {
        await expect(TaxService.calculateFloridaSalesTax(100.50, 'MIAMI-DADE', '2026-01-01'))
            .rejects
            .toThrow('Invalid amount');
    });

});
