import { describe, it, expect } from 'vitest';
import { AccountingEngine } from '../../src/modules/accounting/AccountingEngine';
import { hybridEncryption } from '../../src/core/security/HybridEncryptionSystem';

describe('Phase 1: Integrity Check', () => {

    describe('AccountingEngine Integrity', () => {
        it('should correctly validate a balanced double-entry', () => {
            const lines = [
                { account_code: '1000', debit: 100, credit: 0 },
                { account_code: '2000', debit: 0, credit: 100 }
            ];
            const result = AccountingEngine.validateDoubleEntry(lines as any);
            expect(result.isValid).toBe(true);
            expect(result.difference).toBe(0);
        });

        it('should detect an unbalanced entry', () => {
            const lines = [
                { account_code: '1000', debit: 100, credit: 0 },
                { account_code: '2000', debit: 0, credit: 90 }
            ];
            const result = AccountingEngine.validateDoubleEntry(lines as any);
            expect(result.isValid).toBe(false);
            expect(result.difference).toBe(10);
        });

        it('should calculate normal balance correctly', () => {
            // Asset (Debit nature)
            expect(AccountingEngine.calculateAccountBalance(500, 200, 'debit')).toBe(300);
            // Liability (Credit nature)
            expect(AccountingEngine.calculateAccountBalance(200, 500, 'credit')).toBe(300);
        });
    });

    describe('HybridEncryptionSystem Integrity', () => {
        it('should encrypt and decrypt correctly using available methods', async () => {
            const data = { test: 'account_express_layer_1' };
            const password = 'extremely_safe_password';

            const encrypted = await hybridEncryption.encrypt(data, password);
            expect(encrypted.method).toBeDefined();

            const decrypted = await hybridEncryption.decrypt(encrypted, password);
            expect(decrypted.test).toBe('account_express_layer_1');
        });
    });
});
