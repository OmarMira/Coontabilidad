import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw, Activity, Wrench, CheckCircle } from 'lucide-react';
import { SchemaRepairService } from '@/database/SchemaRepairService';
import { db } from '@/database/simple-db';
import { RepairCompleteModal } from './RepairCompleteModal';

export const DatabaseMaintenance: React.FC = () => {
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

    const runAction = async (actionName: string, action: () => Promise<any>) => {
        setStatus(`Ejecutando: ${actionName}...`);
        setLogs([]);
        try {
            if (!db) throw new Error("Base de datos no disponible");
            const result = await action();
            setStatus('✅ Completado');
            if (Array.isArray(result)) setLogs(result);
        } catch (e: any) {
            setStatus('❌ Error');
            setLogs([e.message]);
        }
    };

    const handleSafeRepair = async () => {
        setStatus('🛠️ Ejecutando reparación segura...');
        setLogs([]);
        try {
            if (!db) throw new Error("Base de datos no disponible");
            const service = new SchemaRepairService(db);
            const result = await service.safeRepairWithValidation();

            const timestamp = new Date().toLocaleString();
            localStorage.setItem('db_last_repair', timestamp);
            setLastRepair(timestamp);
            setIsOptimized(true);

            setModalData({ logs: result.logs, needsRestart: result.needsRestart });
            setShowModal(true);
            setStatus('');
        } catch (e: any) {
            setStatus('❌ Error');
            setLogs([e.message]);
        }
    };

    const handleRepair = () => runAction('Reparar Esquema', async () => {
        const service = new SchemaRepairService(db!);
        return await service.repairSchema();
    });

    const handleSync = () => runAction('Sincronizar Vistas', async () => {
        const service = new SchemaRepairService(db!);
        const logs: string[] = [];
        await service.syncViews(logs);
        return logs;
    });

    const handleValidate = () => runAction('Validar Integridad', async () => {
        const service = new SchemaRepairService(db!);
        const { valid, errors } = service.validateIntegrity();
        return valid ? ['Sistema saludable. Sin errores FK.'] : errors;
    });

    return (
        <>
            <Card className="mt-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-orange-500" />
                            Mantenimiento de Base de Datos
                        </CardTitle>
                        {isOptimized && (
                            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                <CheckCircle className="w-4 h-4" />
                                Base de datos optimizada
                            </div>
                        )}
                    </div>
                    {lastRepair && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Última reparación: {lastRepair}
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
                        🛠️ SOLUCIONAR ERRORES DE BASE DE DATOS
                    </Button>

                    <div className="border-t pt-4">
                        <p className="text-sm font-semibold mb-3 text-muted-foreground">Herramientas Avanzadas</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button onClick={handleRepair} variant="outline" className="flex gap-2">
                                <Settings className="w-4 h-4" /> Reparar Esquema
                            </Button>
                            <Button onClick={handleSync} variant="outline" className="flex gap-2">
                                <RefreshCw className="w-4 h-4" /> Sincronizar Vistas
                            </Button>
                            <Button onClick={handleValidate} variant="outline" className="flex gap-2">
                                <Activity className="w-4 h-4" /> Validar Integridad
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
