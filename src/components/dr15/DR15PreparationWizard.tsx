import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloridaTaxCalculator } from '@/modules/billing/FloridaTaxCalculator';
import { ExplanationEngine } from '@/modules/ai/ExplanationEngine';
import { FileText, ChevronRight, CheckCircle, Calculator, AlertTriangle, Shield, Download } from 'lucide-react';
import { dr15PDFGenerator } from '@/modules/dr15/DR15PDFGenerator';
import { CountyBreakdownTable } from './CountyBreakdownTable';
import { DORComplianceChecklist } from './DORComplianceChecklist';

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
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Paso 1: Seleccionar Periodo Fiscal</h3>
            <div className="grid gap-2">
                <label className="text-sm text-gray-400">Periodo (Mes/Año)</label>
                <input
                    type="month"
                    value={data.period}
                    onChange={(e) => updateData({ period: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded p-2 text-white w-full"
                />
            </div>
            <div className="bg-blue-900/20 p-4 rounded border border-blue-900">
                <p className="text-sm text-blue-200">
                    Seleccione el mes para el cual desea generar el reporte DR-15.
                    El sistema calculará automáticamente las ventas brutas basándose en las facturas emitidas en ese mes.
                </p>
            </div>
            <Button onClick={onNext} disabled={!data.period} className="w-full">
                Siguiente <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    );
};

const StepReviewFigures: React.FC<WizardStepProps> = ({ onNext, onBack, data, updateData, engine }) => {
    const explanation = engine.explainDR15Summary({
        grossSales: data.grossSales,
        exemptSales: data.exemptSales,
        taxCollected: data.totalTaxDue
    });

    // Validación DOR
    const validation = {
        isValid: data.totalTaxDue > 0 && data.taxableSales <= data.grossSales,
        errors: data.totalTaxDue <= 0 ? ['No hay impuestos calculados para este período'] : [],
        warnings: data.exemptSales > data.grossSales * 0.5 ? ['Más del 50% de ventas están exentas'] : []
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">Paso 2: Revisar Cifras Calculadas</h3>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 p-3 rounded">
                    <label className="text-xs text-gray-500 block">Ventas Brutas</label>
                    <span className="text-xl font-mono text-white">${data.grossSales.toFixed(2)}</span>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                    <label className="text-xs text-gray-500 block">Ventas Exentas</label>
                    <span className="text-xl font-mono text-green-400">${data.exemptSales.toFixed(2)}</span>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                    <label className="text-xs text-gray-500 block">Ventas Gravables</label>
                    <span className="text-xl font-mono text-white">${data.taxableSales.toFixed(2)}</span>
                </div>
                <div className="bg-gray-800 p-3 rounded bg-blue-900/20 border border-blue-800">
                    <label className="text-xs text-blue-300 block">Impuesto Recaudado</label>
                    <span className="text-xl font-bold font-mono text-blue-400">${data.totalTaxDue.toFixed(2)}</span>
                </div>
            </div>

            {/* Tabla de desglose por condado */}
            {data.countyBreakdown && data.countyBreakdown.length > 0 && (
                <CountyBreakdownTable data={data.countyBreakdown} />
            )}

            {/* Validación DOR */}
            <DORComplianceChecklist
                validation={validation}
                period={data.period}
                fein="12-3456789"
                totalTax={data.totalTaxDue}
            />

            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                <div className="flex items-start gap-2">
                    <BotIcon className="w-5 h-5 text-purple-400 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-purple-400 uppercase">Explicación IA</h4>
                        <p className="text-xs text-gray-300 leading-relaxed mt-1">{explanation}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" onClick={onBack} className="flex-1">Atrás</Button>
                <Button onClick={onNext} className="flex-1">Confirmar y Siguiente <ChevronRight className="w-4 h-4 ml-2" /></Button>
            </div>
        </div>
    );
};

const StepFinalize: React.FC<WizardStepProps> = ({ onBack, data, updateData }) => {
    const handleDownloadPDF = () => {
        const companyData = {
            name: 'AccountExpress Next-Gen',
            fein: '12-3456789',
            address: '123 Business St',
            city: 'Miami',
            state: 'FL',
            zipCode: '33101'
        };

        dr15PDFGenerator.downloadPDF(data, companyData);
    };

    return (
        <div className="space-y-6 text-center py-4">
            <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-white">Listo para Generar</h3>
                <p className="text-gray-400 mt-2">
                    El reporte DR-15 para el periodo <span className="text-white font-mono">{data.period}</span> está listo.
                </p>
            </div>

            <div className="bg-yellow-900/20 p-4 rounded text-left border border-yellow-800/50">
                <div className="flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <p className="text-xs text-yellow-200">
                        Al confirmar, se registrará un evento inmutable en la cadena de auditoría SHA-256 certificando la generación de este reporte fiscal.
                    </p>
                </div>
            </div>

            {/* Botón de descarga PDF */}
            <Button
                onClick={handleDownloadPDF}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
                <Download className="w-4 h-4 mr-2" />
                📥 Descargar PDF DR-15
            </Button>

            <Button onClick={() => updateData({ confirmed: true })} className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Shield className="w-4 h-4 mr-2" />
                Finalizar y Firmar Reporte
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-gray-400">Volver a Revisar</Button>
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
            <Card className="w-full max-w-2xl mx-auto bg-gray-900 border-gray-800">
                <CardContent className="py-10 text-center space-y-4">
                    <Shield className="w-16 h-16 text-blue-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Reporte Generado Exitosamente</h2>
                    <p className="text-gray-400">El reporte DR-15 ha sido generado y auditorizado.</p>
                    <div className="bg-black/50 p-4 rounded font-mono text-xs text-gray-500 break-all max-w-md mx-auto">
                        Hash: {Array(64).fill('0').map((_, i) => (Math.random() * 16 | 0).toString(16)).join('')}
                    </div>
                    <Button onClick={() => { setStep(1); setData(prev => ({ ...prev, confirmed: false, period: '' })); }}>
                        Crear Nuevo Reporte
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-2xl mx-auto bg-gray-900 border-gray-800 text-gray-100 shadow-xl">
            <CardHeader className="border-b border-gray-800 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        Preparación DR-15 Florida
                    </CardTitle>
                    <div className="text-xs font-mono text-gray-500">
                        Paso {step} de 3
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-gray-800 h-1 mt-4 rounded-full overflow-hidden">
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
