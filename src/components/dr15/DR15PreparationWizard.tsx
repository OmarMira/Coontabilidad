import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloridaTaxCalculator } from '@/modules/billing/FloridaTaxCalculator';
import { ExplanationEngine } from '@/modules/ai/ExplanationEngine';
import { FileText, ChevronRight, CheckCircle, Calculator, AlertTriangle, Shield, Download } from 'lucide-react';
import { dr15PDFGenerator } from '@/modules/dr15/DR15PDFGenerator';
import { CountyBreakdownTable } from './CountyBreakdownTable';
import { DORComplianceChecklist } from './DORComplianceChecklist';
import { useLocale } from '@/i18n/useLocale';

interface WizardStepProps {
    onNext: () => void;
    onBack?: () => void;
    data: DR15Data;
    updateData: (updates: Partial<DR15Data>) => void;
    engine: ExplanationEngine;
}

interface DR15Data {
    period: string; // YYYY-MM
    year: number;
    month: number;
    grossSales: number;
    exemptSales: number;
    taxableSales: number;
    taxCollected: number;
    surtaxCollected: number;
    totalTaxDue: number;
    confirmed: boolean;
    countyBreakdown?: Array<{
        county: string;
        grossSales: number;
        taxableSales: number;
        taxRate: number;
        taxCollected: number;
    }>;
    auditHash?: string;
}

const StepSelectPeriod: React.FC<WizardStepProps> = ({ onNext, data, updateData }) => {
    const { t } = useLocale();
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-black tracking-tight text-white">{t('dr15.step1Title')}</h3>
            <div className="grid gap-2">
                <label className="text-sm text-slate-500">{t('dr15.periodLabel')}</label>
                <input
                    type="month"
                    value={data.period}
                    onChange={(e) => updateData({ period: e.target.value })}
                    className="bg-white/10 border border-white/10 rounded p-2 text-white w-full"
                />
            </div>
            <div className="bg-blue-900/20 p-4 rounded border border-blue-900">
                <p className="text-sm text-blue-200">
                    {t('dr15.step1Hint')}
                </p>
            </div>
            <Button onClick={onNext} disabled={!data.period} className="w-full">
                {t('dr15.next')} <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    );
};

const StepReviewFigures: React.FC<WizardStepProps> = ({ onNext, onBack, data, updateData, engine }) => {
    const { t } = useLocale();
    const explanation = engine.explainDR15Summary({
        grossSales: data.grossSales,
        exemptSales: data.exemptSales,
        taxCollected: data.totalTaxDue
    });

    // DOR Validation
    const validation = {
        isValid: data.totalTaxDue > 0 && data.taxableSales <= data.grossSales,
        errors: data.totalTaxDue <= 0 ? [t('dr15.errorNoTax')] : [],
        warnings: data.exemptSales > data.grossSales * 0.5 ? [t('dr15.warningExempt50')] : []
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-black tracking-tight text-white">{t('dr15.step2Title')}</h3>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded">
                    <label className="text-xs text-slate-600 block">{t('dr15.grossSales')}</label>
                    <span className="text-xl font-mono text-white">${data.grossSales.toFixed(2)}</span>
                </div>
                <div className="bg-white/10 p-3 rounded">
                    <label className="text-xs text-slate-600 block">{t('dr15.exemptSales')}</label>
                    <span className="text-xl font-mono text-green-400">${data.exemptSales.toFixed(2)}</span>
                </div>
                <div className="bg-white/10 p-3 rounded">
                    <label className="text-xs text-slate-600 block">{t('dr15.taxableSales')}</label>
                    <span className="text-xl font-mono text-white">${data.taxableSales.toFixed(2)}</span>
                </div>
                <div className="bg-white/10 p-3 rounded bg-blue-900/20 border border-blue-800">
                    <label className="text-xs text-blue-300 block">{t('dr15.taxCollected')}</label>
                    <span className="text-xl font-black tracking-tight font-mono text-blue-400">${data.totalTaxDue.toFixed(2)}</span>
                </div>
            </div>

            {/* County breakdown table */}
            {data.countyBreakdown && data.countyBreakdown.length > 0 && (
                <CountyBreakdownTable data={data.countyBreakdown} />
            )}

            {/* DOR Validation */}
            <DORComplianceChecklist
                validation={validation}
                period={data.period}
                fein="12-3456789"
                totalTax={data.totalTaxDue}
            />

            <div className="bg-white/10 p-3 rounded border border-white/10">
                <div className="flex items-start gap-2">
                    <BotIcon className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-purple-400 uppercase">{t('dr15.aiExplanation')}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1">{explanation}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" onClick={onBack} className="flex-1">{t('dr15.back')}</Button>
                <Button onClick={onNext} className="flex-1">{t('dr15.confirmAndNext')} <ChevronRight className="w-4 h-4 ml-2" /></Button>
            </div>
        </div>
    );
};

const StepFinalize: React.FC<WizardStepProps> = ({ onBack, data, updateData }) => {
    const { t } = useLocale();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDownloadPDF = async () => {
        setIsProcessing(true);
        try {
            const companyData = {
                name: 'AccountExpress Next-Gen',
                fein: '12-3456789',
                address: '123 Business St',
                city: 'Miami',
                state: 'FL',
                zipCode: '33101'
            };

            await dr15PDFGenerator.downloadPDF(data, companyData);
        } catch (error) {
            console.error(error);
            alert(t('dr15.pdfError') + ": " + (error as Error).message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
                {isProcessing ? (
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <CheckCircle className="w-16 h-16 text-green-500" />
                )}
            </div>
            <div>
                <h3 className="text-xl font-black tracking-tight text-white">
                    {isProcessing ? t('dr15.processing') : t('dr15.readyToGenerate')}
                </h3>
                <p className="text-slate-500 mt-2">
                    {isProcessing
                        ? t('dr15.workerCompiling')
                        : <>{t('dr15.reportReady')} <span className="text-white font-mono">{data.period}</span> {t('dr15.isReady')}.</>}
                </p>
            </div>

            <div className="bg-yellow-900/20 p-4 rounded text-left border border-yellow-800/50">
                <div className="flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <p className="text-xs text-yellow-200">
                        {t('dr15.auditWarning')}
                    </p>
                </div>
            </div>

            {/* PDF download button */}
            <Button
                onClick={handleDownloadPDF}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-bounce' : ''}`} />
                {isProcessing ? t('dr15.generatingPdf') : `📥 ${t('dr15.downloadPdf')}`}
            </Button>

            <Button
                onClick={() => updateData({ confirmed: true })}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
                <Shield className="w-4 h-4 mr-2" />
                {t('dr15.finalizeAndSign')}
            </Button>
            <Button variant="ghost" onClick={isProcessing ? undefined : onBack} disabled={isProcessing} className="w-full text-slate-500">{t('dr15.reviewAgain')}</Button>
        </div>
    );
};

const BotIcon = (props: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
    </svg>
)

export const DR15PreparationWizard: React.FC = () => {
    const { t } = useLocale();
    const [step, setStep] = useState(1);
    const [data, setData] = useState<DR15Data>({
        period: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        grossSales: 0,
        exemptSales: 0,
        taxableSales: 0,
        taxCollected: 0,
        surtaxCollected: 0,
        totalTaxDue: 0,
        confirmed: false
    });
    const [engine] = useState(() => new ExplanationEngine('es-US')); // Spanish for output

    const loadMockData = () => {
        // Parse year and month from period
        const [year, month] = data.period.split('-').map(Number);

        // Simulate DB fetch based on period
        setData(prev => ({
            ...prev,
            year,
            month,
            grossSales: 15450.00,
            exemptSales: 2450.00,
            taxableSales: 13000.00,
            taxCollected: 910.00,
            totalTaxDue: 910.00,
            countyBreakdown: [
                { county: 'Miami-Dade', grossSales: 8500.00, taxableSales: 8500.00, taxRate: 0.065, taxCollected: 552.50 },
                { county: 'Broward', grossSales: 4500.00, taxableSales: 4500.00, taxRate: 0.060, taxCollected: 270.00 },
                { county: 'Palm Beach', grossSales: 2450.00, taxableSales: 0, taxRate: 0.060, taxCollected: 0 }
            ],
            auditHash: Array(64).fill('0').map((_, i) => (Math.random() * 16 | 0).toString(16)).join('')
        }));
    };

    const updateData = (updates: Partial<DR15Data>) => setData(prev => ({ ...prev, ...updates }));

    const nextStep = () => {
        if (step === 1) loadMockData();
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    if (data.confirmed) {
        return (
            <Card className="w-full max-w-2xl mx-auto bg-slate-900 border-white/5">
                <CardContent className="py-10 text-center space-y-4">
                    <Shield className="w-16 h-16 text-blue-500 mx-auto" />
                    <h2 className="text-2xl font-black tracking-tight text-white">{t('dr15.reportGenerated')}</h2>
                    <p className="text-slate-500">{t('dr15.reportAudited')}</p>
                    <div className="bg-black/50 p-4 rounded font-mono text-xs text-slate-600 break-all max-w-md mx-auto">
                        Hash: {Array(64).fill('0').map((_, i) => (Math.random() * 16 | 0).toString(16)).join('')}
                    </div>
                    <Button onClick={() => { setStep(1); setData(prev => ({ ...prev, confirmed: false, period: '' })); }}>
                        {t('dr15.createNewReport')}
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-2xl mx-auto bg-slate-900 border-white/5 text-gray-100 shadow-xl">
            <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        {t('dr15.wizardTitle')}
                    </CardTitle>
                    <div className="text-xs font-mono text-slate-600">
                        {t('dr15.stepOf', { current: step, total: 3 })}
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-white/10 h-1 mt-4 rounded-full overflow-hidden">
                    <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {step === 1 && <StepSelectPeriod onNext={nextStep} data={data} updateData={updateData} engine={engine} />}
                {step === 2 && <StepReviewFigures onNext={nextStep} onBack={prevStep} data={data} updateData={updateData} engine={engine} />}
                {step === 3 && <StepFinalize onNext={() => { }} onBack={prevStep} data={data} updateData={updateData} engine={engine} />}
            </CardContent>
        </Card>
    );
};
