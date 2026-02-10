/**
 * Backup Location Selector - NIVEL NASA
 * Componente UI para seleccionar ubicación de backup/restauración
 */

import React, { useState } from 'react';
import { HardDrive, Download, Cloud, FolderOpen, Usb, AlertCircle } from 'lucide-react';
import { BackupLocationService, BackupLocation } from '../../services/BackupLocationService';

interface Props {
    onLocationSelected: (location: BackupLocation, customPath?: string) => void;
    mode: 'save' | 'restore';
}

export const BackupLocationSelector: React.FC<Props> = ({ onLocationSelected, mode }) => {
    const [selectedLocation, setSelectedLocation] = useState<BackupLocation>('downloads');
    const [customPath, setCustomPath] = useState<string>('');
    const [isSelecting, setIsSelecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isFileSystemSupported = BackupLocationService.isFileSystemAccessSupported();

    const handleLocationClick = async (location: BackupLocation) => {
        setError(null);
        setSelectedLocation(location);

        if (location === 'local-disk' || location === 'custom') {
            // Abrir selector de carpeta
            setIsSelecting(true);
            try {
                const destination = await BackupLocationService.chooseBackupLocation();
                if (destination) {
                    setCustomPath(destination.path || 'Ubicación personalizada');
                    onLocationSelected(location, destination.path);
                } else {
                    // Usuario canceló
                    setSelectedLocation('downloads');
                }
            } catch (e) {
                setError('Error seleccionando ubicación. Intenta de nuevo.');
                setSelectedLocation('downloads');
            } finally {
                setIsSelecting(false);
            }
        } else {
            onLocationSelected(location);
        }
    };

    const locations = [
        {
            id: 'downloads' as BackupLocation,
            name: 'Carpeta de Descargas',
            description: 'Guardar en la carpeta de descargas del navegador',
            icon: Download,
            color: 'blue',
            available: true
        },
        {
            id: 'local-disk' as BackupLocation,
            name: 'Disco Local',
            description: 'Elegir una carpeta en tu disco duro',
            icon: HardDrive,
            color: 'green',
            available: isFileSystemSupported
        },
        {
            id: 'google-drive' as BackupLocation,
            name: 'Google Drive',
            description: 'Guardar en tu cuenta de Google Drive',
            icon: Cloud,
            color: 'purple',
            available: true
        },
        {
            id: 'custom' as BackupLocation,
            name: 'Pendrive / Disco Externo',
            description: 'Guardar en un dispositivo USB externo',
            icon: Usb,
            color: 'orange',
            available: isFileSystemSupported
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    {mode === 'save' ? '¿Dónde deseas guardar el backup?' : '¿Desde dónde deseas restaurar?'}
                </h3>
                {!isFileSystemSupported && (
                    <div className="flex items-center text-sm text-amber-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        <span>Algunas opciones no disponibles en este navegador</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locations.map((location) => {
                    const Icon = location.icon;
                    const isSelected = selectedLocation === location.id;
                    const isDisabled = !location.available;

                    return (
                        <button
                            key={location.id}
                            onClick={() => !isDisabled && handleLocationClick(location.id)}
                            disabled={isDisabled || isSelecting}
                            className={`
                                relative p-6 rounded-xl border-2 transition-all text-left
                                ${isSelected 
                                    ? `border-${location.color}-500 bg-${location.color}-50 shadow-lg` 
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }
                                ${isDisabled 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'cursor-pointer hover:shadow-md'
                                }
                                ${isSelecting ? 'opacity-50 cursor-wait' : ''}
                            `}
                        >
                            <div className="flex items-start space-x-4">
                                <div className={`
                                    p-3 rounded-lg
                                    ${isSelected 
                                        ? `bg-${location.color}-100` 
                                        : 'bg-gray-100'
                                    }
                                `}>
                                    <Icon className={`
                                        w-6 h-6
                                        ${isSelected 
                                            ? `text-${location.color}-600` 
                                            : 'text-slate-700'
                                        }
                                    `} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        {location.name}
                                    </h4>
                                    <p className="text-sm text-slate-700">
                                        {location.description}
                                    </p>
                                    {isSelected && customPath && (
                                        <div className="mt-2 flex items-center text-sm text-gray-700">
                                            <FolderOpen className="w-4 h-4 mr-1" />
                                            <span className="font-medium">{customPath}</span>
                                        </div>
                                    )}
                                    {isDisabled && (
                                        <p className="mt-2 text-xs text-amber-600">
                                            No disponible en este navegador
                                        </p>
                                    )}
                                </div>
                            </div>
                            {isSelected && (
                                <div className="absolute top-3 right-3">
                                    <div className={`w-6 h-6 rounded-full bg-${location.color}-500 flex items-center justify-center`}>
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {isSelecting && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-sm text-blue-800">Esperando selección de ubicación...</p>
                </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Recomendaciones:</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                    <li>• <strong>Descargas:</strong> Rápido y simple, pero debes mover el archivo manualmente</li>
                    <li>• <strong>Disco Local:</strong> Control total sobre la ubicación del archivo</li>
                    <li>• <strong>Google Drive:</strong> Backup automático en la nube, accesible desde cualquier lugar</li>
                    <li>• <strong>Pendrive:</strong> Ideal para backups físicos y portables</li>
                </ul>
            </div>
        </div>
    );
};
