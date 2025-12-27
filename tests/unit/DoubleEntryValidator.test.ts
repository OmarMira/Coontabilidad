/**
 * TESTS UNITARIOS - VALIDADOR DE PARTIDA DOBLE
 */

import { DoubleEntryValidator, JournalEntry } from '../../src/services/accounting/DoubleEntryValidator';

describe('DoubleEntryValidator', () => {
  test('should validate balanced journal entry', () => {
    const entry: JournalEntry = {
      id: 1,
      date: '2024-12-26',
      description: 'Venta en efectivo',
      reference: 'INV-001',
      details: [
        { account_id: 1, account_code: '1110', account_name: 'Caja', debit: 1000, credit: 0 },
        { account_id: 2, account_code: '4100', account_name: 'Ventas', debit: 0, credit: 1000 }
      ]
    };
    
    const result = DoubleEntryValidator.validateJournalEntry(entry);
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.totals.debits).toBe(1000);
    expect(result.totals.credits).toBe(1000);
  });
  
  test('should reject unbalanced journal entry', () => {
    const entry: JournalEntry = {
      id: 2,
      date: '2024-12-26',
      description: 'Asiento desbalanceado',
      reference: 'TEST-001',
      details: [
        { account_id: 1, account_code: '1110', account_name: 'Caja', debit: 1000, credit: 0 },
        { account_id: 2, account_code: '4100', account_name: 'Ventas', debit: 0, credit: 900 }
      ]
    };
    
    const result = DoubleEntryValidator.validateJournalEntry(entry);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(expect.stringContaining('no igualan'));
    expect(result.totals.difference).toBe(100);
  });
});
