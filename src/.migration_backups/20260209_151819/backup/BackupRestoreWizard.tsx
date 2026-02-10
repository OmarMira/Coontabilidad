import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HardDrive, Download, Upload, Shield, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { BackupManager } from '@/modules/backup/BackupManager';
import { SQLiteEngine } from '@/core/database/SQLiteEngine';

// Assuming we can instantiate engines or they are passed/context
// For this UI component, we will mock logic for now or instantiate if possible.

export const BackupRestoreWizard: React.FC = () => {
    const [mode, setMode] = useState<'menu' | 'backup' | 'restore'>('menu');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleBackup = async () => {
        setStatus('processing');
        try {
            // Mock
            setTimeout(() => {
                setStatus('success');
                setMessage('Backup creado correctamente: backup_20241230.enc');
            }, 1500);
        } catch (e) {
            setStatus('error');
            setMessage('Error al crear backup');
        }
    };

    const handleRestore = async (file: File) => {
        setStatus('processing');
        try {
            // Mock
            setTimeout(() => {
                setStatus('success');
                setMessage('Sistema restaurado correctamente desde ' + file.name);
            }, 2000);
        } catch (e) {
            setStatus('error');
            setMessage('Error de restauración / Contraseña incorrecta');
        }
    };

    if (mode === 'menu') {
        return (
            <Card className="bg-gray-900 border-gray-800 text-white w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="w-5 h-5 text-blue-400" />
                        Respaldo y Restauración
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Gestione la seguridad de sus datos mediante copias cifradas AES-256.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={() => setMode('backup')}
                        className="w-full h-16 text-lg justify-start px-6 bg-gray-800 hover:bg-gray-700 border border-gray-700"
                    >
                        <Download className="w-6 h-6 mr-4 text-green-400" />
                        <div className="text-left">
                            <span className="block font-bold">Crear Respaldo</span>
                            <span className="text-xs text-gray-400 font-normal">Descargar copia cifrada de la base de datos</span>
                        </div>
                    </Button>
                    <Button
                        onClick={() => setMode('restore')}
                        className="w-full h-16 text-lg justify-start px-6 bg-gray-800 hover:bg-gray-700 border border-gray-700"
                    >
                        <Upload className="w-6 h-6 mr-4 text-orange-400" />
                        <div className="text-left">
                            <span className="block font-bold">Restaurar Sistema</span>
                            <span className="text-xs text-gray-400 font-normal">Importar y reemplazar datos desde un archivo</span>
                        </div>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (mode === 'backup') {
        return (
            <Card className="bg-gray-900 border-gray-800 text-white w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>Crear Respaldo Seguro</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'success' ? (
                        <div className="text-center py-6 space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            <p className="text-green-400">{message}</p>
                            <Button onClick={() => { setMode('menu'); setStatus('idle'); }} variant="outline">Volver</Button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Contraseña de Cifrado (Opcional)</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                    <input
                                        type="password"
                                        placeholder="Dejar vacío para usar clave del sistema"
                                        className="w-full bg-gray-800 border-gray-700 rounded p-2 pl-9 text-white"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Esta contraseña será requerida para restaurar el archivo. Si la pierde, los datos serán irrecuperables.
                                </p>
                            </div>
                            <Button
                                onClick={handleBackup}
                                disabled={status === 'processing'}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                {status === 'processing' ? 'Cifrando datos...' : 'Generar y Descargar'}
                            </Button>
                            <Button variant="ghost" onClick={() => setMode('menu')} className="w-full">Cancelar</Button>
                        </>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (mode === 'restore') {
        return (
            <Card className="bg-gray-900 border-gray-800 text-white w-full max-w-lg mx-auto">
                <CardHeader>
                    <CardTitle>Restaurar Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'success' ? (
                        <div className="text-center py-6 space-y-4">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                            <p className="text-green-400">{message}</p>
                            <Button onClick={() => { setMode('menu'); setStatus('idle'); }} variant="outline">Volver</Button>
                        </div>
                    ) : (
                        <>
                            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center bg-gray-800/50">
                                <Upload className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                                <p className="text-sm text-gray-400">Arrastre su archivo .enc aquí o haga clic para seleccionar</p>
                                <input type="file" className="hidden" id="file-upload" onChange={(e) => {
                                    if (e.target.files?.[0]) handleRestore(e.target.files[0]);
                                }} />
                                <label htmlFor="file-upload" className="mt-4 inline-block bg-blue-600 px-4 py-2 rounded cursor-pointer hover:bg-blue-700 text-sm">
                                    Seleccionar Archivo
                                </label>
                            </div>

                            <div className="bg-red-900/20 border border-red-900/50 p-3 rounded flex gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <p className="text-xs text-red-300">
                                    ADVERTENCIA: La restauración reemplazará COMPLETAMENTE los datos actuales. Asegúrese de tener un respaldo de la sesión actual antes de proceder.
                                </p>
                            </div>

                            <Button variant="ghost" onClick={() => setMode('menu')} className="w-full">Cancelar</Button>
                        </>
                    )}
                </CardContent>
            </Card>
        )
    }

    return null;
};
