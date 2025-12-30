// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { InvoiceForm } from './InvoiceForm';

// Mock de módulos
vi.mock('./useInvoiceForm', () => ({
    useInvoiceForm: () => ({
        customer: { id: '1', name: 'Cliente Test', county: 'Miami-Dade' },
        lines: [
            { id: '1', description: 'Producto 1', quantity: 2, unitPrice: 50, taxExempt: false }
        ],
        subtotal: 100,
        taxAmount: 6.5,
        total: 106.5,
        auditHash: null,
        loading: false,
        error: null,
        setCustomer: vi.fn(),
        addLine: vi.fn(),
        updateLine: vi.fn(),
        removeLine: vi.fn(),
        saveInvoice: vi.fn().mockResolvedValue('invoice-123'),
        calculateTax: vi.fn()
    })
}));

vi.mock('./subcomponents/CustomerSelector', () => ({
    CustomerSelector: ({ selectedCustomer, onSelect }: any) => (
        <div data-testid="customer-selector">
            Customer Selector Mock
            {selectedCustomer && <span>{selectedCustomer.name}</span>}
        </div>
    )
}));

vi.mock('./subcomponents/TaxSummary', () => ({
    TaxSummary: ({ subtotal, taxAmount, total, county }: any) => (
        <div data-testid="tax-summary">
            <div>Subtotal: {subtotal}</div>
            <div>Tax: {taxAmount}</div>
            <div>Total: {total}</div>
            <div>County: {county}</div>
        </div>
    )
}));

describe('InvoiceForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('se renderiza correctamente', () => {
        render(<InvoiceForm />);

        expect(screen.getByText('Facturación Forense Florida')).toBeInTheDocument();
        expect(screen.getByTestId('customer-selector')).toBeInTheDocument();
        expect(screen.getByTestId('tax-summary')).toBeInTheDocument();
        expect(screen.getByText('Guardar con Auditoría')).toBeInTheDocument();
    });

    test('muestra el resumen de impuestos correctamente', () => {
        render(<InvoiceForm />);

        expect(screen.getByText('Subtotal: 100')).toBeInTheDocument();
        expect(screen.getByText('Tax: 6.5')).toBeInTheDocument();
        expect(screen.getByText('Total: 106.5')).toBeInTheDocument();
        expect(screen.getByText('County: Miami-Dade')).toBeInTheDocument();
    });

    test('el botón de guardar está habilitado con datos válidos', () => {
        render(<InvoiceForm />);

        const saveButton = screen.getByText('Guardar con Auditoría');
        expect(saveButton).toBeEnabled();
    });
});
