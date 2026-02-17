import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Calculator } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

interface ComplianceStatus {
    lastFilingPeriod?: string;
    nextFilingDue: Date;
    estimatedLiability: number;
    status: 'compliant' | 'due' | 'overdue';
}

export const TaxComplianceWidget: React.FC = () => {
    const { t } = useLocale();
    const [status, setStatus] = useState<ComplianceStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data fetch
        setTimeout(() => {
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            // Florida specific: Due date is typically the 1st, late after the 20th
            const nextDue = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20);

            setStatus({
                lastFilingPeriod: '2025-11', // Assuming 1 month ago
                nextFilingDue: nextDue, // 20th of next month
                estimatedLiability: 1250.00, // Mock amount
                status: 'compliant'
            });
            setLoading(false);
        }, 500);
    }, []);

    if (loading) {
        return <div className="animate-pulse bg-white/10 h-48 rounded-lg mt-4"></div>;
    }

    if (!status) return null;

    return (
        <Card className="bg-slate-900 border-white/5 text-white">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-400" />
                    {t('taxCompliance.title')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-sm">{t('taxCompliance.status')}</span>
                        <div className="flex items-center gap-1.5 text-green-400 bg-green-900/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-[0.2em] border border-green-800">
                            <CheckCircle className="w-3 h-3" />
                            {t('taxCompliance.upToDate')}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-white/10/50 p-3 rounded border border-white/10">
                            <span className="text-xs text-slate-600 block mb-1">{t('taxCompliance.nextDue')}</span>
                            <span className="text-sm font-medium block">
                                {status.nextFilingDue.toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-orange-400">
                                {t('taxCompliance.dr15Period')} {new Date().getFullYear()}-{new Date().getMonth() + 1}
                            </span>
                        </div>
                        <div className="bg-white/10/50 p-3 rounded border border-white/10">
                            <span className="text-xs text-slate-600 block mb-1">{t('taxCompliance.estimatedTax')}</span>
                            <span className="text-lg font-bold text-white block">
                                ${status.estimatedLiability.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8">
                            <FileText className="w-3 h-3 mr-2" />
                            {t('taxCompliance.prepareFiling')}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
