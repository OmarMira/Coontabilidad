// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackupRestoreWizard } from './BackupRestoreWizard';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    HardDrive: () => <div data-testid="icon-HardDrive" />,
    Download: () => <div data-testid="icon-Download" />,
    Upload: () => <div data-testid="icon-Upload" />,
    Shield: () => <div data-testid="icon-Shield" />,
    CheckCircle: () => <div data-testid="icon-CheckCircle" />,
    AlertTriangle: () => <div data-testid="icon-AlertTriangle" />,
    Lock: () => <div data-testid="icon-Lock" />
}));

describe('BackupRestoreWizard', () => {
    it('should render menu initially', () => {
        render(<BackupRestoreWizard />);
        expect(screen.getByText(/Respaldo y Restauración/i)).toBeInTheDocument();
        expect(screen.getByText(/Crear Respaldo/i)).toBeInTheDocument();
        expect(screen.getByText(/Restaurar Sistema/i)).toBeInTheDocument();
    });

    it('should navigate to backup screen', () => {
        render(<BackupRestoreWizard />);
        // "Crear Respaldo" is big test inside a button, might be split by spans.
        // Let's click the button that *contains* "Crear Respaldo"
        const btn = screen.getByText(/Crear Respaldo/i).closest('button');
        fireEvent.click(btn!);
        expect(screen.getByText(/Crear Respaldo Seguro/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Dejar vacío para usar clave/i)).toBeInTheDocument();
    });

    it('should simulate backup process', async () => {
        render(<BackupRestoreWizard />);
        const btn = screen.getByText(/Crear Respaldo/i).closest('button');
        fireEvent.click(btn!);

        const backupBtn = screen.getByRole('button', { name: /Generar y Descargar/i });
        fireEvent.click(backupBtn);

        expect(screen.getByText(/Cifrando datos.../i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText(/Backup creado correctamente/i)).toBeInTheDocument();
        });
    });

    it('should navigate to restore screen', () => {
        render(<BackupRestoreWizard />);
        const btn = screen.getByText(/Restaurar Sistema/i).closest('button');
        fireEvent.click(btn!);
        expect(screen.getByText(/Arrastre su archivo/i)).toBeInTheDocument();
        expect(screen.getByText(/ADVERTENCIA/i)).toBeInTheDocument();
    });
});
