/**
 * Backup Location Service - NIVEL NASA
 * Permite al usuario elegir dónde guardar y desde dónde restaurar backups
 * Soporta: Disco Local, Pendrive, Google Drive, Descargas
 */

import { logger } from '../core/logging/SystemLogger';
import { GDriveSyncService } from './GDriveSyncService';

export type BackupLocation = 'downloads' | 'local-disk' | 'google-drive' | 'custom';

export interface BackupDestination {
    type: BackupLocation;
    handle?: FileSystemDirectoryHandle; // Para File System Access API
    path?: string; // Para mostrar al usuario
}

export class BackupLocationService {
    private static lastUsedLocation: BackupDestination | null = null;

    /**
     * Verifica si File System Access API está disponible
     */
    static isFileSystemAccessSupported(): boolean {
        return 'showSaveFilePicker' in window && 'showDirectoryPicker' in window;
    }

    /**
     * Permite al usuario elegir dónde guardar el backup
     */
    static async chooseBackupLocation(): Promise<BackupDestination | null> {
        try {
            if (!this.isFileSystemAccessSupported()) {
                logger.warn('BackupLocation', 'api_not_supported', 'File System Access API no disponible');
                return { type: 'downloads' }; // Fallback a descargas
            }

            // Mostrar selector de directorio
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            const destination: BackupDestination = {
                type: 'custom',
                handle: dirHandle,
                path: dirHandle.name
            };

            this.lastUsedLocation = destination;
            logger.info('BackupLocation', 'location_selected', `Usuario seleccionó: ${dirHandle.name}`);
            
            return destination;
        } catch (e: any) {
            if (e.name === 'AbortError') {
                logger.info('BackupLocation', 'cancelled', 'Usuario canceló selección');
                return null;
            }
            logger.error('BackupLocation', 'selection_error', 'Error seleccionando ubicación', null, e);
            return null;
        }
    }

    /**
     * Guarda el backup en la ubicación elegida
     */
    static async saveBackup(
        data: string,
        filename: string,
        destination?: BackupDestination
    ): Promise<boolean> {
        const dest = destination || this.lastUsedLocation || { type: 'downloads' };

        try {
            switch (dest.type) {
                case 'google-drive':
                    return await this.saveToGoogleDrive(data, filename);
                
                case 'custom':
                case 'local-disk':
                    if (dest.handle) {
                        return await this.saveToFileSystem(data, filename, dest.handle);
                    }
                    // Fallback a descargas si no hay handle
                    return await this.saveToDownloads(data, filename);
                
                case 'downloads':
                default:
                    return await this.saveToDownloads(data, filename);
            }
        } catch (e) {
            logger.error('BackupLocation', 'save_failed', 'Error guardando backup', null, e as Error);
            return false;
        }
    }

    /**
     * Guarda en Google Drive
     */
    private static async saveToGoogleDrive(data: string, filename: string): Promise<boolean> {
        try {
            const blob = new Blob([data], { type: 'application/json' });
            return await GDriveSyncService.uploadBackup(blob, filename);
        } catch (e) {
            logger.error('BackupLocation', 'gdrive_failed', 'Error guardando en Google Drive', null, e as Error);
            return false;
        }
    }

    /**
     * Guarda usando File System Access API
     */
    private static async saveToFileSystem(
        data: string,
        filename: string,
        dirHandle: FileSystemDirectoryHandle
    ): Promise<boolean> {
        try {
            // Crear archivo en el directorio seleccionado
            const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
            
            // Obtener writable stream con safe fallback
            const writable = await (fileHandle.createWritable?.() ?? Promise.reject(new Error('createWritable not available')));
            
            // Escribir datos
            await writable.write(data);
            await writable.close();
            
            logger.info('BackupLocation', 'saved_to_disk', `Backup guardado en: ${dirHandle.name}/${filename}`);
            return true;
        } catch (e) {
            logger.error('BackupLocation', 'filesystem_failed', 'Error guardando en disco', null, e as Error);
            return false;
        }
    }

    /**
     * Guarda en carpeta de Descargas (método tradicional)
     */
    private static async saveToDownloads(data: string, filename: string): Promise<boolean> {
        try {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            logger.info('BackupLocation', 'saved_to_downloads', `Backup descargado: ${filename}`);
            return true;
        } catch (e) {
            logger.error('BackupLocation', 'download_failed', 'Error descargando backup', null, e as Error);
            return false;
        }
    }

    /**
     * Permite al usuario elegir un archivo de backup para restaurar
     */
    static async chooseBackupFile(): Promise<File | null> {
        try {
            if (!this.isFileSystemAccessSupported()) {
                // Fallback a input file tradicional
                return await this.chooseFileTraditional();
            }

            // Usar File System Access API
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    {
                        description: 'AccountExpress Backup',
                        accept: {
                            'application/json': ['.aex', '.json']
                        }
                    }
                ],
                multiple: false
            });

            const file = await fileHandle.getFile();
            logger.info('BackupLocation', 'file_selected', `Usuario seleccionó: ${file.name}`);
            
            return file;
        } catch (e: any) {
            if (e.name === 'AbortError') {
                logger.info('BackupLocation', 'cancelled', 'Usuario canceló selección de archivo');
                return null;
            }
            logger.error('BackupLocation', 'file_selection_error', 'Error seleccionando archivo', null, e);
            return null;
        }
    }

    /**
     * Método tradicional para elegir archivo (fallback)
     */
    private static async chooseFileTraditional(): Promise<File | null> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.aex,.json';
            
            input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                resolve(file || null);
            };
            
            input.oncancel = () => {
                resolve(null);
            };
            
            input.click();
        });
    }

    /**
     * Detecta dispositivos externos (pendrives, discos externos)
     * Nota: Requiere permisos y solo funciona en navegadores compatibles
     */
    static async detectExternalDevices(): Promise<string[]> {
        try {
            if ('storage' in navigator && 'estimate' in (navigator as any).storage) {
                // Intentar detectar dispositivos montados
                // Nota: Esta API es limitada por seguridad del navegador
                const estimate = await (navigator as any).storage.estimate();
                logger.info('BackupLocation', 'storage_info', 'Información de almacenamiento', estimate);
            }
            
            // Por ahora, retornamos lista vacía
            // La detección real de pendrives requiere permisos especiales
            return [];
        } catch (e) {
            logger.warn('BackupLocation', 'detection_failed', 'No se pudo detectar dispositivos externos');
            return [];
        }
    }

    /**
     * Obtiene la última ubicación usada
     */
    static getLastUsedLocation(): BackupDestination | null {
        return this.lastUsedLocation;
    }

    /**
     * Limpia la última ubicación usada
     */
    static clearLastUsedLocation(): void {
        this.lastUsedLocation = null;
    }
}
