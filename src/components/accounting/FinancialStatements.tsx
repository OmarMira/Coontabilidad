import React, { useState } from 'react';
import { BalanceSheet } from '../BalanceSheet';
import { IncomeStatement } from './IncomeStatement';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const FinancialStatements: React.FC = () => {
    const [view, setView] = useState<'balance' | 'income'>('balance');

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-gray-800 pb-4 no-print">
                <Button
                    variant={view === 'balance' ? 'default' : 'ghost'}
                    onClick={() => setView('balance')}
                    className={view === 'balance' ? 'bg-blue-600' : 'text-gray-400'}
                >
                    Balance General
                </Button>
                <Button
                    variant={view === 'income' ? 'default' : 'ghost'}
                    onClick={() => setView('income')}
                    className={view === 'income' ? 'bg-blue-600' : 'text-gray-400'}
                >
                    Estado de Resultados
                </Button>
            </div>

            {view === 'balance' && <BalanceSheet />}
            {view === 'income' && <IncomeStatement />}
        </div>
    );
};
