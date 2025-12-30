import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const PayableReports: React.FC = () => {
    const data = [
        { name: '0-30 Días', amount: 1500 },
        { name: '31-60 Días', amount: 300 },
        { name: '61-90 Días', amount: 0 },
        { name: '90+ Días', amount: 100 },
    ];

    return (
        <div className="grid grid-cols-1 gap-6">
            <Card className="bg-gray-900 border-gray-800 text-white w-full">
                <CardHeader>
                    <CardTitle>Antigüedad de Saldos (Proveedores)</CardTitle>
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
