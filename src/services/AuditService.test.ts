
import { describe, it, expect, vi } from 'vitest';
import { AuditService } from '../services/AuditService';

describe('AuditService', () => {
    describe('computeDelta', () => {
        it('should return null if oldData exists but newData is undefined', () => {
            const oldData = { a: 1 };
            const newData = undefined;
            const delta = AuditService.computeDelta(oldData, newData);
            expect(delta).toBeNull();
        });

        it('should return newData if oldData is undefined', () => {
            const oldData = undefined;
            const newData = { a: 1 };
            const delta = AuditService.computeDelta(oldData, newData);
            expect(delta).toEqual(newData);
        });

        it('should return empty object if both are strictly equal', () => {
            const oldData = { a: 1 };
            const newData = { a: 1 };
            const delta = AuditService.computeDelta(oldData, newData);
            expect(delta).toEqual({});
        });

        it('should return only changed fields', () => {
            const oldData = { id: 1, name: 'Old', age: 30 };
            const newData = { id: 1, name: 'New', age: 30 };
            const delta = AuditService.computeDelta(oldData, newData);
            expect(delta).toEqual({ name: 'New' });
        });

        it('should handle nested objects (simple equality check)', () => {
            const oldData = { config: { theme: 'dark' } };
            const newData = { config: { theme: 'light' } };
            const delta = AuditService.computeDelta(oldData, newData);
            // Since we use JSON.stringify in implementation for values, this should work
            expect(delta).toEqual({ config: { theme: 'light' } });
        });
    });
});
