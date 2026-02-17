import React from 'react';

interface TaxSummaryProps {
    subtotal: number;
    taxAmount: number;
    total: number;
    county?: string;
}

import { useLocale } from '@/i18n/useLocale';

export const TaxSummary: React.FC<TaxSummaryProps> = ({ subtotal, taxAmount, total, county }) => {
    const { t } = useLocale();

    return (
        <div className="bg-muted/50 rounded-lg p-4 border space-y-2">
            <div className="flex justify-between text-sm">
                <span>{t('common.subtotal')}</span>
                <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span>{t('common.tax')} {county ? `(${county})` : ''}</span>
                <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>{t('common.total')}</span>
                <span>${total.toFixed(2)}</span>
            </div>
        </div>
    );
};
