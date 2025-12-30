// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuditTrailMonitor } from './AuditTrailMonitor';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Shield: () => <div data-testid="icon-Shield" />,
    ShieldCheck: () => <div data-testid="icon-ShieldCheck" />,
    ShieldAlert: () => <div data-testid="icon-ShieldAlert" />,
    RefreshCw: () => <div data-testid="icon-RefreshCw" />,
    Activity: () => <div data-testid="icon-Activity" />
}));

describe('AuditTrailMonitor', () => {
    it('should show verifying state initially', () => {
        render(<AuditTrailMonitor />);
        expect(screen.getByText(/Verificando/i)).toBeInTheDocument();
        expect(screen.getByText(/Calculando hashes/i)).toBeInTheDocument();
    });

    it('should show secure or compromised state after timeout', async () => {
        render(<AuditTrailMonitor />);
        await waitFor(() => {
            const secure = screen.queryByText(/Cadena Segura/i);
            const compromised = screen.queryByText(/Integridad Comprometida/i);
            expect(secure || compromised).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('should refresh verification on click', async () => {
        render(<AuditTrailMonitor />);
        // Wait for first verification
        await waitFor(() => screen.queryByText(/(Segura|Comprometida)/i));

        // Click refresh (icon RefreshCw)
        // Click refresh (icon RefreshCw)
        const refreshButtons = screen.getAllByRole('button');
        const refreshButton = refreshButtons.find(b => b.querySelector('[data-testid="icon-RefreshCw"]'));
        fireEvent.click(refreshButton!);

        // Should go back to verifying
        expect(screen.getByText(/Verificando/i)).toBeInTheDocument();
    });
});
