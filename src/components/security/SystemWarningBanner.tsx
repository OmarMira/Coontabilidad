/**
 * Banner de Advertencia del Sistema
 * Muestra advertencias no críticas en la parte superior de la aplicación
 */

import React from 'react';
import { SystemIntegrityReport } from '../../types/integrity.types';
import { AlertTriangle, X, Wrench } from 'lucide-react';
import { useLocale } from '../../i18n/useLocale';

interface Props {
    report: SystemIntegrityReport;
    onDismiss: () => void;
    onViewDetails: () => void;
}

export const SystemWarningBanner: React.FC<Props> = ({ report, onDismiss, onViewDetails }) => {
    const { t } = useLocale();
    const warningChecks = report.checks.filter(c => !c.result.passed && c.severity === 'warning');

    if (warningChecks.length === 0) return null;

    return (
        <div className="bg-yellow-50 border-b border-yellow-200">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-yellow-800">
                                {t('security.messages.bannerWarning', { count: warningChecks.length, s: warningChecks.length > 1 ? 's' : '' })}
                            </p>
                            <p className="text-xs text-yellow-700 mt-0.5">
                                {warningChecks.map(c => c.name).join(', ')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onViewDetails}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 rounded-md transition-colors flex items-center gap-1.5"
                        >
                            <Wrench className="w-3.5 h-3.5" />
                            {t('security.actions.details')}
                        </button>
                        <button
                            onClick={onDismiss}
                            className="p-1 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-md transition-colors"
                            aria-label={t('security.actions.dismiss')}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
