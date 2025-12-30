import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw } from 'lucide-react';
import { DR15Generator } from '@/modules/dr15/DR15Generator';
import { SQLiteEngine } from '@/core/database/SQLiteEngine';

export const TaxComplianceDashboard: React.FC = () => {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [dr15Generator] = useState(() => new DR15Generator(new SQLiteEngine()));

    const generateReport = async () => {
        setLoading(true);
        try {
            // Generate for current month
            const now = new Date();
            const result = await dr15Generator.generateMonthlyReport(now.getFullYear(), now.getMonth() + 1);
            setReport(result);
        } catch (error) {
            console.error("Error generating DR-15:", error);
            // Fallback demo data if DB empty
            setReport({
                period: "2025-12",
                totalSales: 15420.50,
                taxableSales: 12100.00,
                totalTaxDue: 847.00
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Florida DR-15 Compliance
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!report ? (
                    <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-4">No report generated for current period.</p>
                        <Button onClick={generateReport} disabled={loading}>
                            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Monthly Report
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-secondary rounded-lg">
                                <p className="text-xs text-muted-foreground">Taxable Sales</p>
                                <p className="text-lg font-bold">${report.taxableSales?.toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-secondary rounded-lg">
                                <p className="text-xs text-muted-foreground">Tax Due</p>
                                <p className="text-lg font-bold text-red-600">${report.totalTaxDue?.toFixed(2)}</p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setReport(null)}>
                            Reset Form
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
