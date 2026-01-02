import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Upload, Loader2, Check } from 'lucide-react';
import { BackupManager } from '@/modules/backup/BackupManager';
import { SQLiteEngine } from '@/core/database/SQLiteEngine';

const ProgressProps = ({ value }: { value: number }) => (
    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
        <div className="bg-primary h-full transition-all" style={{ width: `${value}%` }} />
    </div>
);

export const BackupRestoreWidget: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>('');
    const [backupManager] = useState(() => new BackupManager(new SQLiteEngine()));
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = async () => {
        setLoading(true);
        setStatus('Creating encrypted backup...');
        setProgress(30);

        try {
            const backupPath = await backupManager.createBackup();
            setProgress(100);
            setStatus(`Backup saved to: ${backupPath}`);
        } catch (error) {
            setStatus('Backup Failed');
            console.error(error);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 3000);
        }
    };

    const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus('Reading backup file...');
        setProgress(20);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            setStatus('Decrypting and Restoring...');
            setProgress(50);

            // Assuming default password for now or prompting - for MVP executing with default
            await backupManager.restoreBackup(uint8Array, 'default-system-key');

            setProgress(100);
            setStatus('System successfully restored!');

            // Reload to reflect changes
            setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            console.error(error);
            setStatus('Restore Failed: Invalid file or password');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-500" />
                    Secure Backup & Restore
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Button onClick={handleBackup} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                        Backup
                    </Button>
                    <Button
                        variant="outline"
                        disabled={loading}
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Restore
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleRestoreFile}
                        className="hidden"
                        accept=".enc,.backup,.json"
                    />
                </div>

                {loading && (
                    <div className="space-y-2">
                        <ProgressProps value={progress} />
                        <p className="text-xs text-center text-muted-foreground">{status}</p>
                    </div>
                )}

                {!loading && status && (
                    <div className="text-xs text-center text-green-600 bg-green-50 p-2 rounded">
                        <Check className="w-3 h-3 inline mr-1" />
                        {status}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
