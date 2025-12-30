import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompanyService } from './CompanyService';
import { SQLiteEngine } from '../../core/database/SQLiteEngine';

const mockRun = vi.fn();
const mockSelect = vi.fn();

vi.mock('../../core/database/SQLiteEngine', () => ({
    SQLiteEngine: class {
        async run(sql: string, params: any[]) { return mockRun(sql, params); }
        async select(sql: string, params: any[]) { return mockSelect(sql, params); }
    }
}));

describe('CompanyService', () => {
    let service: CompanyService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new CompanyService(new SQLiteEngine());
    });

    it('should retrieve company info', async () => {
        mockSelect.mockResolvedValue([{
            id: 1, name: 'Acme Corp', tax_id: '123', currency_code: 'USD'
        }]);

        const info = await service.getCompanyInfo();
        expect(info).toBeDefined();
        expect(info?.name).toBe('Acme Corp');
    });

    it('should insert new info if none exists', async () => {
        mockSelect.mockResolvedValue([]); // No existing info

        await service.updateCompanyInfo({
            name: 'New Corp',
            tax_id: '999',
            currency_code: 'EUR'
        });

        expect(mockRun).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO company_info'),
            expect.arrayContaining(['New Corp', '999', 'EUR'])
        );
    });

    it('should update info if exists', async () => {
        mockSelect.mockResolvedValue([{ id: 1, name: 'Old' }]); // Exists

        await service.updateCompanyInfo({
            name: 'Updated Corp',
            tax_id: '888',
            currency_code: 'USD'
        });

        expect(mockRun).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE company_info'),
            expect.arrayContaining(['Updated Corp', '888', 1]) // 1 is ID
        );
    });
});
