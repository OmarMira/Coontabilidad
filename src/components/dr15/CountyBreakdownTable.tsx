/**
 * COUNTY BREAKDOWN TABLE - DR-15
 * 
 * Shows detailed sales and tax breakdown by Florida county
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useLocale } from '@/i18n/useLocale';

export interface CountyBreakdown {
    county: string;
    grossSales: number;
    taxableSales: number;
    taxRate: number;
    taxCollected: number;
}

interface CountyBreakdownTableProps {
    data: CountyBreakdown[];
    showAllCounties?: boolean;
}

export const CountyBreakdownTable: React.FC<CountyBreakdownTableProps> = ({
    data,
    showAllCounties = false
}) => {
    const { t } = useLocale();

    // Sort by tax collected (descending)
    const sortedData = [...data].sort((a, b) => b.taxCollected - a.taxCollected);

    // Show only counties with data if showAllCounties is false
    const displayData = showAllCounties ? sortedData : sortedData.filter(c => c.taxCollected > 0);

    // Calculate totals
    const totals = displayData.reduce(
        (acc, county) => ({
            grossSales: acc.grossSales + county.grossSales,
            taxableSales: acc.taxableSales + county.taxableSales,
            taxCollected: acc.taxCollected + county.taxCollected
        }),
        { grossSales: 0, taxableSales: 0, taxCollected: 0 }
    );

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    {t('dr15.county.title')}
                </CardTitle>
                <p className="text-sm text-slate-500">
                    {t('dr15.county.countiesWithActivity', { count: displayData.length })}
                </p>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/10">
                                <th className="text-left p-3 font-semibold text-slate-400">{t('dr15.county.county')}</th>
                                <th className="text-right p-3 font-semibold text-slate-400">{t('dr15.grossSales')}</th>
                                <th className="text-right p-3 font-semibold text-slate-400">{t('dr15.taxableSales')}</th>
                                <th className="text-center p-3 font-semibold text-slate-400">{t('dr15.county.rate')}</th>
                                <th className="text-right p-3 font-semibold text-slate-400">{t('dr15.taxCollected')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.map((county, index) => (
                                <tr
                                    key={county.county}
                                    className={`border-b border-white/10 hover:bg-white/10 transition-colors ${index % 2 === 0 ? 'bg-slate-900' : ''
                                        }`}
                                >
                                    <td className="p-3 font-medium text-white">{county.county}</td>
                                    <td className="p-3 text-right text-slate-400">
                                        ${county.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-right text-slate-400">
                                        ${county.taxableSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-center text-blue-400 font-mono">
                                        {(county.taxRate * 100).toFixed(1)}%
                                    </td>
                                    <td className="p-3 text-right text-green-400 font-semibold">
                                        ${county.taxCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}

                            {/* Totals row */}
                            <tr className="border-t-2 border-blue-500 bg-white/10 font-bold">
                                <td className="p-3 text-white">TOTAL</td>
                                <td className="p-3 text-right text-white">
                                    ${totals.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-right text-white">
                                    ${totals.taxableSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-3 text-center text-slate-500">—</td>
                                <td className="p-3 text-right text-green-400 text-lg">
                                    ${totals.taxCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {displayData.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        <p className="text-lg">📭 {t('dr15.county.noData')}</p>
                        <p className="text-sm mt-2">{t('dr15.county.noDataHint')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
