// @ts-nocheck
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DR15PreparationWizard } from './DR15PreparationWizard';

// Mock UI components if they are not standard HTML, but we used standard imports or simple divs if library missing in test env.
// Assuming setup handles module resolution for aliases.

// Mock ExplanationEngine
vi.mock('@/modules/ai/ExplanationEngine', () => {
    return {
        ExplanationEngine: class {
            constructor(locale: string) { }
            explainDR15Summary() {
                return "AI Explanation Mock";
            }
        }
    }
});

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    FileText: () => <div data-testid="icon-FileText" />,
    ChevronRight: () => <div data-testid="icon-ChevronRight" />,
    CheckCircle: () => <div data-testid="icon-CheckCircle" />,
    Calculator: () => <div data-testid="icon-Calculator" />,
    AlertTriangle: () => <div data-testid="icon-AlertTriangle" />,
    Shield: () => <div data-testid="icon-Shield" />
}));

describe('DR15PreparationWizard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render step 1 initially', () => {
        render(<DR15PreparationWizard />);
        expect(screen.getByText(/Paso 1: Seleccionar Periodo Fiscal/i)).toBeInTheDocument();
        // Since we are using standard input type="month", let's check it exists
        // Using container queries since testing-library queries can be tricky without aria-labels specific
        // We rely on integration style "it's there"
    });

    it('should enable next button when period is selected', () => {
        const { container } = render(<DR15PreparationWizard />);
        // Find input by type directly to avoid selector ambiguity
        const fileInput = container.querySelector('input[type="month"]');
        expect(fileInput).toBeInTheDocument();

        fireEvent.change(fileInput!, { target: { value: '2023-10' } });

        // Button should be enabled
        const button = screen.getByRole('button', { name: /Siguiente/i });
        expect(button).not.toBeDisabled();
    });

    it('should progress to step 2 review figures', async () => {
        const { container } = render(<DR15PreparationWizard />);
        const input = container.querySelector('input[type="month"]');
        fireEvent.change(input!, { target: { value: '2023-10' } });

        const nextButton = screen.getByRole('button', { name: /Siguiente/i });
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText(/Paso 2: Revisar Cifras Calculadas/i)).toBeInTheDocument();
        });

        // Check if explanation is shown
        expect(screen.getByText(/Explicación IA/i)).toBeInTheDocument();
    });

    it('should show success screen after confirmation', async () => {
        const { container } = render(<DR15PreparationWizard />);
        // Step 1
        fireEvent.change(container.querySelector('input[type="month"]')!, { target: { value: '2023-10' } });
        fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

        // Step 2
        await waitFor(() => screen.getByText(/Paso 2/i));
        fireEvent.click(screen.getByRole('button', { name: /Confirmar y Siguiente/i }));

        // Step 3
        await waitFor(() => screen.getByText(/Listo para Generar/i));
        fireEvent.click(screen.getByRole('button', { name: /Finalizar y Firmar Reporte/i }));

        // Success
        await waitFor(() => {
            expect(screen.getByText(/Reporte Generado Exitosamente/i)).toBeInTheDocument();
        });
    });
});
