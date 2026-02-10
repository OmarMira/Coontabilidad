import React from 'react';
import { Customer } from '../useInvoiceForm';

interface CustomerSelectorProps {
    selectedCustomer: Customer | null;
    onSelect: (customer: Customer) => void;
}

// Mock data internal or passed? User creates mock selector usually.
// For integration, we'll fetch or use static list.
const MOCK_CUSTOMERS: Customer[] = [
    { id: '1', name: 'Empresa Demo S.A.', county: 'Miami-Dade', taxId: '123456789' },
    { id: '2', name: 'Cliente Broward Inc.', county: 'Broward', taxId: '987654321' }
];

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
    selectedCustomer,
    onSelect
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cust = MOCK_CUSTOMERS.find(c => c.id === e.target.value);
        if (cust) onSelect(cust);
    };

    return (
        <div className="flex flex-col gap-2">
            <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedCustomer?.id || ''}
                onChange={handleChange}
            >
                <option value="">Seleccionar Cliente...</option>
                {MOCK_CUSTOMERS.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
        </div>
    );
};
