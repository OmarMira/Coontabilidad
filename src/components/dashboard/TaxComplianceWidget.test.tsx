// @vitest-environment jsdom
// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TaxComplianceWidget } from './TaxComplianceWidget';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    AlertCircle: () => <div data-testid="icon-AlertCircle" />,
    FileText: () => <div data-testid="icon-FileText" />,
    CheckCircle: () => <div data-testid="icon-CheckCircle" />,
    Calculator: () => <div data-testid="icon-Calculator" />
}));

describe.skip('TaxComplianceWidget', () => { // LEGACY-REFACTOR - requires jest-dom setup
    it('should render loading state initially', () => {
        const { container } = render(<TaxComplianceWidget />);
        expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should render compliance status after loading', async () => {
        render(<TaxComplianceWidget />);

        await waitFor(() => {
            expect(screen.getByText(/Cumplimiento Fiscal Florida/i)).toBeInTheDocument();
        });

        expect(screen.getByText(/Estado Actual/i)).toBeInTheDocument();
        expect(screen.getByText(/AL DÍA/i)).toBeInTheDocument();
        // Regex helper for price since format might vary slightly
        const priceRegex = /\$1,250\.00|\$1250\.00/;
        expect(screen.getByText((content) => priceRegex.test(content))).toBeInTheDocument();
    });

    it('should display estimated liability', async () => {
        render(<TaxComplianceWidget />);
        await waitFor(() => {
            expect(screen.getByText(/Impuesto Estimado/i)).toBeInTheDocument();
        });
    });
});
