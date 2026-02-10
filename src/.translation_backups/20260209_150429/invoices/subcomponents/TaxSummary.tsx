import React from 'react';

interface TaxSummaryProps {
    subtotal: number;
    taxAmount: number;
    total: number;
    county?: string;
}

export const TaxSummary: React.FC<TaxSummaryProps> = ({ subtotal, taxAmount, total, county }) => {
    return (
        <div className="bg-muted/50 rounded-lg p-4 border space-y-2">
            <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span>Impuesto {county ? `(${county})` : ''}</span>
                <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
            </div>
        </div>
    );
};
