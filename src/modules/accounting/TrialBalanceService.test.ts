import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrialBalanceService } from './TrialBalanceService';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

describe('TrialBalanceService', () => {
    let service: TrialBalanceService;
    let mockEngine: any;

    beforeEach(() => {
        mockEngine = {
            select: vi.fn()
        };
        service = new TrialBalanceService(mockEngine as unknown as SQLiteEngine);
    });

    it('debe calcular correctamente los saldos iniciales y finales basado en la naturaleza de la cuenta', async () => {
        // Datos de prueba (1 cuenta deudora, 1 cuenta acreedora)
        const mockRawData = [
            {
                account_code: '1112',
                account_name: 'Banco',
                account_type: 'asset',
                normal_balance: 'debit',
                previous_debit: 1000,
                previous_credit: 200,
                period_debit: 500,
                period_credit: 100
            },
            {
                account_code: '3100',
                account_name: 'Capital',
                account_type: 'equity',
                normal_balance: 'credit',
                previous_debit: 0,
                previous_credit: 1000,
                period_debit: 100,
                period_credit: 500
            }
        ];

        mockEngine.select.mockResolvedValue(mockRawData);

        const result = await service.generateTrialBalance('2024-01-01', '2024-01-31');

        // Verificaciones para cuenta DEBIT (Banco)
        const banco = result.find(r => r.account_code === '1112');
        expect(banco?.initial_balance).toBe(800); // 1000 - 200
        expect(banco?.total_debit).toBe(1500); // 1000 + 500
        expect(banco?.total_credit).toBe(300); // 200 + 100
        expect(banco?.final_balance).toBe(1200); // 1500 - 300

        // Verificaciones para cuenta CREDIT (Capital)
        const capital = result.find(r => r.account_code === '3100');
        expect(capital?.initial_balance).toBe(1000); // 1000 - 0
        expect(capital?.total_debit).toBe(100); // 0 + 100
        expect(capital?.total_credit).toBe(1500); // 1000 + 500
        expect(capital?.final_balance).toBe(1400); // 1500 - 100
    });

    it('debe validar correctamente la ecuación contable (D = C)', () => {
        const balancedData: any[] = [
            { period_debit: 100, period_credit: 0 },
            { period_debit: 0, period_credit: 100 }
        ];

        const result = service.validateAccountingEquation(balancedData);
        expect(result.isValid).toBe(true);
        expect(result.difference).toBe(0);

        const unbalancedData: any[] = [
            { period_debit: 100, period_credit: 0 },
            { period_debit: 0, period_credit: 100.05 }
        ];

        const result2 = service.validateAccountingEquation(unbalancedData);
        expect(result2.isValid).toBe(false);
        expect(result2.difference).toBeCloseTo(0.05);
        expect(result2.errors.length).toBeGreaterThan(0);
    });

    it('debe detectar desbalances de $0.01 o más', () => {
        const data: any[] = [
            { period_debit: 10.00, period_credit: 10.01 }
        ];
        expect(service.validateAccountingEquation(data).isValid).toBe(false);

        const dataSmall: any[] = [
            { period_debit: 10.00, period_credit: 10.0001 }
        ];
        expect(service.validateAccountingEquation(dataSmall).isValid).toBe(true);
    });
});
