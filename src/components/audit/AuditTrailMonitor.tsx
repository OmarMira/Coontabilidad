import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuditChainService } from '@/services/audit/AuditChainService';
import { getDBEngine } from '@/database/simple-db';
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, Activity } from 'lucide-react';
import { useLocale } from '@/i18n/useLocale';

interface AuditStatus {
    status: 'secure' | 'compromised' | 'verifying' | 'unknown';
    lastHash: string;
    totalEvents: number;
    lastVerified: Date;
    errors: string[];
}

export const AuditTrailMonitor: React.FC = () => {
    const { t } = useLocale();
    const [status, setStatus] = useState<AuditStatus>({
        status: 'unknown',
        lastHash: '...',
        totalEvents: 0,
        lastVerified: new Date(),
        errors: []
    });

    const verifyChain = async () => {
        setStatus(prev => ({ ...prev, status: 'verifying' }));
        try {
            const engine = getDBEngine();
            const auditChain = new AuditChainService(engine);
            const report = await auditChain.verifyIntegrity();

            setStatus({
                status: report.valid ? 'secure' : 'compromised',
                lastHash: report.lastChainHash
                    ? report.lastChainHash.slice(0, 16) + '...'
                    : 'GENESIS',
                totalEvents: report.totalRecords,
                lastVerified: new Date(),
                errors: report.errors.map(e => e.message)
            });
        } catch (err) {
            setStatus(prev => ({
                ...prev,
                status: 'unknown',
                errors: [err instanceof Error ? err.message : 'Error verificando cadena']
            }));
        }
    };

    useEffect(() => {
        verifyChain();
    }, []);

    return (
        <Card className="bg-slate-900 border-white/5 text-white">
            <CardHeader className="pb-2 border-b border-white/5/50">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        {t('auditTrail.title')}
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
                        ${status.status === 'unknown' ? 'border-white/10 bg-white/10' : ''}
                    `}>
                        {status.status === 'secure' && <ShieldCheck className="w-8 h-8 text-green-500" />}
                        {status.status === 'compromised' && <ShieldAlert className="w-8 h-8 text-red-500" />}
                        {(status.status === 'verifying' || status.status === 'unknown') && <Shield className="w-8 h-8 text-slate-500" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">
                            {status.status === 'secure' && t('auditTrail.status.secure')}
                            {status.status === 'compromised' && t('auditTrail.status.compromised')}
                            {status.status === 'verifying' && t('auditTrail.status.verifying')}
                            {status.status === 'unknown' && t('auditTrail.status.unknown')}
                        </h3>
                        {status.status === 'secure' && <p className="text-xs text-green-400">{t('auditTrail.verification.success')}</p>}
                        {status.status === 'compromised' && <p className="text-xs text-red-400">{t('auditTrail.verification.errors').replace('{count}', status.errors.length.toString())}</p>}
                        {status.status === 'verifying' && <p className="text-xs text-blue-400">{t('auditTrail.verification.calculating')}</p>}
                    </div>
                </div>

                <div className="space-y-2 text-xs font-mono text-slate-600 bg-black/30 p-3 rounded">
                    <div className="flex justify-between">
                        <span>{t('auditTrail.table.description')}:</span>
                        <span className="text-white">{status.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('auditTrail.details')}:</span>
                        <span className="text-white">{status.lastHash}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('auditTrail.table.timestamp')}:</span>
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
