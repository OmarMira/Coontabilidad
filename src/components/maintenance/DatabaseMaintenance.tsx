import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw, Activity, Wrench, CheckCircle } from 'lucide-react';
import { SchemaRepairService } from '@/database/SchemaRepairService';
import { db } from '@/database/simple-db';
import { RepairCompleteModal } from './RepairCompleteModal';
import { useLocale } from '@/i18n/useLocale';

export const DatabaseMaintenance: React.FC = () => {
    const { t, language } = useLocale();
    const [status, setStatus] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState<{ logs: string[]; needsRestart: boolean }>({ logs: [], needsRestart: false });
    const [lastRepair, setLastRepair] = useState<string | null>(null);
    const [isOptimized, setIsOptimized] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('db_last_repair');
        if (stored) {
            setLastRepair(stored);
            setIsOptimized(true);
        }
    }, []);

    const runAction = async (actionName: string, actionNameKey: string, action: () => Promise<any>) => {
        setStatus(t('maintenance.runningAction', { action: actionName }));
        setLogs([]);
        try {
            if (!db) throw new Error(t('maintenance.dbNotAvailable'));
            const result = await action();
            setStatus(`✅ ${t('maintenance.completed')}`);
            if (Array.isArray(result)) {
                // Traducir logs específicos si es posible, o dejarlos como vienen si son técnicos
                setLogs(result.map(log =>
                    log === 'Sistema saludable. Sin errores FK.' ? t('maintenance.systemHealthy') : log
                ));
            }
        } catch (e: any) {
            setStatus(`❌ ${t('maintenance.error')}`);
            setLogs([e.message]);
        }
    };

    const handleSafeRepair = async () => {
        setStatus(`🛠️ ${t('maintenance.executingSafeRepair')}`);
        setLogs([]);
        try {
            if (!db) throw new Error(t('maintenance.dbNotAvailable'));
            const service = new SchemaRepairService(db);
            const result = await service.safeRepairWithValidation();

            const timestamp = new Date().toLocaleString(language === 'es' ? 'es-ES' : 'en-US');
            localStorage.setItem('db_last_repair', timestamp);
            setLastRepair(timestamp);
            setIsOptimized(true);

            setModalData({ logs: result.logs, needsRestart: result.needsRestart });
            setShowModal(true);
            setStatus('');
        } catch (e: any) {
            setStatus(`❌ ${t('maintenance.error')}`);
            setLogs([e.message]);
        }
    };

    const handleRepair = () => runAction(t('maintenance.repairSchema'), 'repairSchema', async () => {
        const service = new SchemaRepairService(db!);
        return await service.repairSchema();
    });

    const handleSync = () => runAction(t('maintenance.syncViews'), 'syncViews', async () => {
        const service = new SchemaRepairService(db!);
        const logs: string[] = [];
        await service.syncViews(logs);
        return logs;
    });

    const handleValidate = () => runAction(t('maintenance.validateIntegrity'), 'validateIntegrity', async () => {
        const service = new SchemaRepairService(db!);
        const { valid, errors } = await service.validateIntegrity();
        return valid ? [t('maintenance.systemHealthy')] : errors;
    });

    return (
        <>
            <Card className="mt-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-orange-500" />
                            {t('maintenance.title')}
                        </CardTitle>
                        {isOptimized && (
                            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                <CheckCircle className="w-4 h-4" />
                                {t('maintenance.dbOptimized')}
                            </div>
                        )}
                    </div>
                    {lastRepair && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('maintenance.lastRepair', { date: lastRepair })}
                        </p>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={handleSafeRepair}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2"
                        size="lg"
                    >
                        <Wrench className="w-5 h-5" />
                        {t('maintenance.fixDbErrors')}
                    </Button>

                    <div className="border-t pt-4">
                        <p className="text-sm font-semibold mb-3 text-muted-foreground">{t('maintenance.advancedTools')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button onClick={handleRepair} variant="outline" className="flex gap-2">
                                <Settings className="w-4 h-4" /> {t('maintenance.repairSchema')}
                            </Button>
                            <Button onClick={handleSync} variant="outline" className="flex gap-2">
                                <RefreshCw className="w-4 h-4" /> {t('maintenance.syncViews')}
                            </Button>
                            <Button onClick={handleValidate} variant="outline" className="flex gap-2">
                                <Activity className="w-4 h-4" /> {t('maintenance.validateIntegrity')}
                            </Button>
                        </div>
                    </div>

                    {status && (
                        <div className="p-4 bg-gray-50 rounded-md">
                            <p className="font-semibold text-sm mb-2">{status}</p>
                            <div className="max-h-40 overflow-y-auto text-xs font-mono space-y-1">
                                {logs.map((L, i) => (
                                    <div key={i} className={L.includes('Error') || L.includes('Violación') || L.includes('❌') ? 'text-red-600' : 'text-green-600'}>
                                        {L}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {showModal && (
                <RepairCompleteModal
                    logs={modalData.logs}
                    needsRestart={modalData.needsRestart}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
};
