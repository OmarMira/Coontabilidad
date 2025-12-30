import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuditChainVerifier } from '@/modules/audit/AuditChainVerifier';
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, Activity } from 'lucide-react';

interface AuditStatus {
    status: 'secure' | 'compromised' | 'verifying' | 'unknown';
    lastHash: string;
    totalEvents: number;
    lastVerified: Date;
    errors: string[];
}

export const AuditTrailMonitor: React.FC = () => {
    const [status, setStatus] = useState<AuditStatus>({
        status: 'unknown',
        lastHash: '...',
        totalEvents: 0,
        lastVerified: new Date(),
        errors: []
    });

    const verifyChain = async () => {
        setStatus(prev => ({ ...prev, status: 'verifying' }));

        // Mock verification for UI demo
        setTimeout(() => {
            const isSecure = Math.random() > 0.1; // 90% secure
            setStatus({
                status: isSecure ? 'secure' : 'compromised',
                lastHash: Array(64).fill(0).map(() => (Math.random() * 16 | 0).toString(16)).join('').slice(0, 16) + '...',
                totalEvents: Math.floor(Math.random() * 1000) + 50,
                lastVerified: new Date(),
                errors: isSecure ? [] : ['Hash Mismatch at Block #45', 'Broken Link #89']
            });
        }, 1500);
    };

    useEffect(() => {
        verifyChain();
    }, []);

    return (
        <Card className="bg-gray-900 border-gray-800 text-white">
            <CardHeader className="pb-2 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        Monitor de Integridad
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={verifyChain}
                        className={`h-8 w-8 p-0 ${status.status === 'verifying' ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex items-center gap-4 mb-6">
                    <div className={`
                        w-16 h-16 rounded-full flex items-center justify-center border-4
                        ${status.status === 'secure' ? 'border-green-500/20 bg-green-500/10' : ''}
                        ${status.status === 'compromised' ? 'border-red-500/20 bg-red-500/10' : ''}
                        ${status.status === 'verifying' ? 'border-blue-500/20 bg-blue-500/10 animate-pulse' : ''}
                        ${status.status === 'unknown' ? 'border-gray-700 bg-gray-800' : ''}
                    `}>
                        {status.status === 'secure' && <ShieldCheck className="w-8 h-8 text-green-500" />}
                        {status.status === 'compromised' && <ShieldAlert className="w-8 h-8 text-red-500" />}
                        {(status.status === 'verifying' || status.status === 'unknown') && <Shield className="w-8 h-8 text-gray-400" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">
                            {status.status === 'secure' && 'Cadena Segura'}
                            {status.status === 'compromised' && 'Integridad Comprometida'}
                            {status.status === 'verifying' && 'Verificando...'}
                            {status.status === 'unknown' && 'Estado Desconocido'}
                        </h3>
                        {status.status === 'secure' && <p className="text-xs text-green-400">Verificación SHA-256 Exitosa</p>}
                        {status.status === 'compromised' && <p className="text-xs text-red-400">Se detectaron {status.errors.length} errores</p>}
                        {status.status === 'verifying' && <p className="text-xs text-blue-400">Calculando hashes...</p>}
                    </div>
                </div>

                <div className="space-y-2 text-xs font-mono text-gray-500 bg-black/30 p-3 rounded">
                    <div className="flex justify-between">
                        <span>Eventos:</span>
                        <span className="text-white">{status.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Último Hash:</span>
                        <span className="text-white">{status.lastHash}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Verificado:</span>
                        <span className="text-white">{status.lastVerified.toLocaleTimeString()}</span>
                    </div>
                </div>

                {status.status === 'compromised' && (
                    <div className="mt-4 bg-red-900/20 border border-red-900/50 p-2 rounded text-xs text-red-300">
                        <ul className="list-disc pl-4 space-y-1">
                            {status.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
