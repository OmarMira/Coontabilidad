import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

interface RepairCompleteModalProps {
    logs: string[];
    needsRestart: boolean;
    onClose: () => void;
}

export const RepairCompleteModal: React.FC<RepairCompleteModalProps> = ({ logs, needsRestart, onClose }) => {
    const { t } = useLocale();

    const handleRestart = () => {
        // Limpiar caché y recargar
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
                <CardHeader className="bg-green-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-6 h-6" />
                        {t('maintenance.restorationFinished')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <h3 className="font-semibold mb-2 text-sm">{t('maintenance.repairsApplied')}</h3>
                        <ul className="space-y-1 text-xs font-mono">
                            {logs.map((log, i) => (
                                <li key={i} className={
                                    log.includes('✅') ? 'text-green-600' :
                                        log.includes('⚠️') ? 'text-yellow-600' :
                                            log.includes('❌') ? 'text-red-600' :
                                                'text-gray-700'
                                }>
                                    {log}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {needsRestart && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-blue-900 text-sm">{t('maintenance.restartRecommended')}</p>
                                <p className="text-xs text-blue-700 mt-1">
                                    {t('maintenance.restartHint')}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        {needsRestart ? (
                            <Button onClick={handleRestart} className="flex-1 flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                {t('maintenance.restartSystem')}
                            </Button>
                        ) : (
                            <Button onClick={onClose} variant="outline" className="flex-1">
                                {t('maintenance.close')}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
