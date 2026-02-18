/**
 * DOR COMPLIANCE CHECKLIST
 * 
 * Validates DR-15 report compliance with
 * Florida Department of Revenue requirements
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

interface DORComplianceChecklistProps {
    validation: ValidationResult;
    period: string;
    fein?: string;
    totalTax: number;
}

export const DORComplianceChecklist: React.FC<DORComplianceChecklistProps> = ({
    validation,
    period,
    fein,
    totalTax
}) => {
    const { t } = useLocale();

    // Individual checks
    const checks = [
        {
            id: 'period',
            label: t('dr15.compliance.validPeriod'),
            passed: !!period && period.length > 0,
            critical: true
        },
        {
            id: 'fein',
            label: t('dr15.compliance.feinRegistered'),
            passed: !!fein && fein.length > 0,
            critical: true
        },
        {
            id: 'totals',
            label: t('dr15.compliance.taxCalculated'),
            passed: totalTax > 0,
            critical: true
        },
        {
            id: 'validation',
            label: t('dr15.compliance.mathValidation'),
            passed: validation.isValid,
            critical: true
        },
        {
            id: 'errors',
            label: t('dr15.compliance.noCriticalErrors'),
            passed: validation.errors.length === 0,
            critical: true
        },
        {
            id: 'warnings',
            label: t('dr15.compliance.noWarnings'),
            passed: validation.warnings.length === 0,
            critical: false
        }
    ];

    const passedChecks = checks.filter(c => c.passed).length;
    const totalChecks = checks.length;
    const criticalPassed = checks.filter(c => c.critical && c.passed).length;
    const totalCritical = checks.filter(c => c.critical).length;

    const allCriticalPassed = criticalPassed === totalCritical;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className={`w-6 h-6 ${allCriticalPassed ? 'text-green-400' : 'text-red-400'}`} />
                    {t('dr15.compliance.title')}
                </CardTitle>
                <p className="text-sm text-slate-500">
                    {t('dr15.compliance.checksCompleted', { passed: passedChecks, total: totalChecks })}
                    {!allCriticalPassed && ` - ${t('dr15.compliance.requiresAttention')}`}
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Progress bar */}
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${allCriticalPassed ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                        style={{ width: `${(passedChecks / totalChecks) * 100}%` }}
                    />
                </div>

                {/* Check list */}
                <div className="space-y-2">
                    {checks.map(check => (
                        <div
                            key={check.id}
                            className={`flex items-center gap-3 p-3 rounded-lg ${check.passed ? 'bg-green-900/20' : 'bg-red-900/20'
                                }`}
                        >
                            {check.passed ? (
                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            )}

                            <div className="flex-1">
                                <p className={`text-sm font-medium ${check.passed ? 'text-green-300' : 'text-red-300'}`}>
                                    {check.label}
                                </p>
                                {check.critical && !check.passed && (
                                    <p className="text-xs text-red-400 mt-1">
                                        ⚠️ {t('dr15.compliance.criticalRequirement')}
                                    </p>
                                )}
                            </div>

                            {check.critical && (
                                <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">
                                    {t('dr15.compliance.critical')}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Errors */}
                {validation.errors.length > 0 && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-400" />
                            <h4 className="font-semibold text-red-300">{t('dr15.compliance.criticalErrors')}</h4>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-200">
                            {validation.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <h4 className="font-semibold text-yellow-300">{t('dr15.compliance.warnings')}</h4>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-200">
                            {validation.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Final status */}
                {allCriticalPassed && validation.errors.length === 0 && (
                    <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <p className="text-green-300 font-medium">
                                ✅ {t('dr15.compliance.readyToSubmit')}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
