import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocale } from '../../i18n/useLocale';

export const PayableReports: React.FC = () => {
    const { t } = useLocale();

    const data = [
        { name: t('payableReports.days030'), amount: 1500 },
        { name: t('payableReports.days3160'), amount: 300 },
        { name: t('payableReports.days6190'), amount: 0 },
        { name: t('payableReports.days90plus'), amount: 100 },
    ];

    return (
        <div className="grid grid-cols-1 gap-6">
            <Card className="bg-slate-900 border-white/5 text-white w-full">
                <CardHeader>
                    <CardTitle>{t('payableReports.agingBalance')}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" stroke="#888888" />
                            <YAxis stroke="#888888" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};
