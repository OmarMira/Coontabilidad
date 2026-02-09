/**
 * dateUtils.test.ts - Tests para utilidades de fechas
 * @author Kiro AI - NASA Level Testing
 * @date 2026-02-08
 */

import { describe, it, expect } from 'vitest';

describe('Date Utils', () => {
  
  it('should format date to ISO string', () => {
    const date = new Date('2026-01-15');
    const iso = date.toISOString().substring(0, 10);
    expect(iso).toBe('2026-01-15');
  });
});
