/**
 * COMPONENTE DE BACKUP Y RESTAURACIÓN
 * 
 * Cumple con Master Prompt Sección 9: "Backup Cifrado"
 * - Interfaz para exportar/importar backups .aex
 * - Cifrado AES-256-GCM con contraseña del usuario
 * - Verificación de integridad con checksums
 * - Gestión segura de archivos de backup
 */

import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Database,
  FileText,
  Clock,
  HardDrive,
  Key,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { backupService, BackupResult, RestoreResult } from '../services/BackupService';
import { logger } from '../core/logging/SystemLogger';

export const BackupRestore: React.FC = () => {
  // Estados para exportación
  const [exportPassword, setExportPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [includeSystemLogs, setIncludeSystemLogs] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportPassword, setShowExportPassword] = useState(false);

  // Estados para importación
  const [importPassword, setImportPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showImportPassword, setShowImportPassword] = useState(false);

  // Estados generales
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [lastBackupInfo, setLastBackupInfo] = useState<BackupResult | null>(null);
  const [systemInfo, setSystemInfo] = useState<{
    lastBackupDate: string | null;
    estimatedDbSize: string;
  }>({
    lastBackupDate: null,
    estimatedDbSize: 'Calculando...'
  });

  // Referencias
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar disponibilidad del servicio
  const [serviceInfo, setServiceInfo] = useState<{
    available: boolean;
    encryption_supported: boolean;
    database_connected: boolean;
    supported_formats: string[];
    encryption_method: string;
    version: string;
  }>({
    available: false,
    encryption_supported: false,
    database_connected: false,
    supported_formats: [],
    encryption_method: '',
    version: ''
  });

  // Cargar información del servicio al montar el componente
  React.useEffect(() => {
    const loadServiceInfo = async () => {
      try {
        const info = await backupService.getServiceInfo();
        setServiceInfo(info);
      } catch (error) {
        console.error('Error loading service info:', error);
      }
    };
    
    loadServiceInfo();
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      // Obtener fecha del último backup desde localStorage
      const lastBackupDate = localStorage.getItem('lastBackupDate');
      
      // Calcular tamaño estimado de la base de datos
      let estimatedSize = 'No disponible';
      try {
        // Importar la base de datos para obtener estadísticas
        const dbModule = await import('../database/simple-db');
        const db = (dbModule as any).db;
        
        if (db) {
          // Obtener número de páginas y tamaño de página
          const pageSizeResult = db.exec('PRAGMA page_size');
          const pageCountResult = db.exec('PRAGMA page_count');
          
          if (pageSizeResult.length > 0 && pageCountResult.length > 0) {
            const pageSize = pageSizeResult[0].values[0][0] as number;
            const pageCount = pageCountResult[0].values[0][0] as number;
            const totalBytes = pageSize * pageCount;
            estimatedSize = formatFileSize(totalBytes);
          }
        }
      } catch (error) {
        console.warn('No se pudo calcular el tamaño de la base de datos:', error);
        estimatedSize = 'No disponible';
      }

      setSystemInfo({
        lastBackupDate,
        estimatedDbSize: estimatedSize
      });
    } catch (error) {
      console.error('Error cargando información del sistema:', error);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'warning', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateExportForm = (): string | null => {
    if (!exportPassword) {
      return 'Se requiere una contraseña para el backup';
    }
    if (exportPassword.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (exportPassword !== confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    return null;
  };

  const handleExport = async () => {
    const validationError = validateExportForm();
    if (validationError) {
      showMessage('error', validationError);
      return;
    }

    setIsExporting(true);

    try {
      logger.info('BackupRestore', 'export_start', 'Usuario iniciando exportación de backup');

      const result = await backupService.exportToAex(exportPassword, includeSystemLogs);

      if (result.success) {
        setLastBackupInfo(result);
        
        // Guardar fecha del último backup en localStorage
        localStorage.setItem('lastBackupDate', new Date().toISOString());
        
        // Recargar información del sistema
        loadSystemInfo();
        
        showMessage('success', result.message);
        
        // Limpiar formulario
        setExportPassword('');
        setConfirmPassword('');
        
        logger.info('BackupRestore', 'export_success', 'Backup exportado por usuario', {
          filename: result.filename,
          size: result.size
        });
      } else {
        showMessage('error', result.message);
        logger.error('BackupRestore', 'export_failed', 'Error en exportación de backup', { error: result.error });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      showMessage('error', `Error inesperado: ${errorMsg}`);
      logger.error('BackupRestore', 'export_exception', 'Excepción en exportación', null, error as Error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.aex')) {
        showMessage('error', 'Por favor seleccione un archivo .aex válido');
        return;
      }
      setSelectedFile(file);
      setMessage(null);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      showMessage('error', 'Seleccione un archivo de backup');
      return;
    }

    if (!importPassword) {
      showMessage('error', 'Ingrese la contraseña del backup');
      return;
    }

    setIsRestoring(true);

    try {
      logger.info('BackupRestore', 'restore_start', 'Usuario iniciando restauración de backup', {
        filename: selectedFile.name,
        size: selectedFile.size
      });

      const result = await backupService.restoreFromAex(selectedFile, importPassword);

      if (result.success) {
        showMessage('success', result.message);
        
        // Limpiar formulario
        setSelectedFile(null);
        setImportPassword('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Sugerir recargar la página
        setTimeout(() => {
          if (window.confirm('Backup restaurado exitosamente. ¿Desea recargar la página para ver los cambios?')) {
            window.location.reload();
          }
        }, 2000);

        logger.info('BackupRestore', 'restore_success', 'Backup restaurado por usuario', {
          tables: result.restored_tables,
          records: result.restored_records
        });
      } else {
        showMessage('error', result.message);
        logger.error('BackupRestore', 'restore_failed', 'Error en restauración de backup', { error: result.error });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      showMessage('error', `Error inesperado: ${errorMsg}`);
      logger.error('BackupRestore', 'restore_exception', 'Excepción en restauración', null, error as Error);
    } finally {
      setIsRestoring(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!serviceInfo.available) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Servicio No Disponible</h2>
        <p className="text-gray-400 mb-4">
          El servicio de backup no está disponible. Verifique que:
        </p>
        <ul className="text-gray-300 text-sm space-y-1 mb-6">
          <li>• La base de datos esté conectada</li>
          <li>• El cifrado Web Crypto API esté soportado</li>
          <li>• El navegador sea compatible</li>
        </ul>
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-white font-medium mb-2">Estado del Servicio:</h3>
          <ul className="text-sm space-y-1">
            <li className={`${serviceInfo.database_connected ? 'text-green-400' : 'text-red-400'}`}>
              • Base de datos: {serviceInfo.database_connected ? 'Conectada' : 'Desconectada'}
            </li>
            <li className={`${serviceInfo.encryption_supported ? 'text-green-400' : 'text-red-400'}`}>
              • Cifrado: {serviceInfo.encryption_supported ? 'Soportado' : 'No soportado'}
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Backup y Restauración</h1>
        <p className="text-gray-400">Gestión segura de copias de seguridad cifradas</p>
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' ? 'bg-green-900/20 border border-green-700' :
          message.type === 'error' ? 'bg-red-900/20 border border-red-700' :
          'bg-yellow-900/20 border border-yellow-700'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {message.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
            {message.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
            <span className={`${
              message.type === 'success' ? 'text-green-300' :
              message.type === 'error' ? 'text-red-300' :
              'text-yellow-300'
            }`}>
              {message.text}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'export'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Download className="w-4 h-4 inline mr-2" />
          Crear Backup
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'import'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Restaurar Backup
        </button>
      </div>

      {/* Contenido de Export */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-400" />
              Crear Backup Cifrado
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Configuración de Contraseña */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Contraseña del Backup *
                  </label>
                  <div className="relative">
                    <input
                      type={showExportPassword ? 'text' : 'password'}
                      value={exportPassword}
                      onChange={(e) => setExportPassword(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowExportPassword(!showExportPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                    >
                      {showExportPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Confirmar Contraseña *
                  </label>
                  <input
                    type={showExportPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Repetir contraseña"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeLogs"
                    checked={includeSystemLogs}
                    onChange={(e) => setIncludeSystemLogs(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="includeLogs" className="text-gray-300 text-sm">
                    Incluir logs del sistema
                  </label>
                </div>
              </div>

              {/* Información del Backup */}
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <Database className="w-4 h-4 mr-2 text-green-400" />
                    Información del Backup
                  </h4>
                  <ul className="text-gray-300 text-sm space-y-2">
                    <li className="flex items-center">
                      <Lock className="w-3 h-3 mr-2 text-blue-400" />
                      Cifrado: AES-256-GCM
                    </li>
                    <li className="flex items-center">
                      <FileText className="w-3 h-3 mr-2 text-green-400" />
                      Formato: .aex (AccountExpress)
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-3 h-3 mr-2 text-purple-400" />
                      Verificación: SHA-256 checksum
                    </li>
                    <li className="flex items-center">
                      <HardDrive className="w-3 h-3 mr-2 text-yellow-400" />
                      Incluye: Todas las tablas y esquemas
                    </li>
                  </ul>
                </div>

                {/* Estado del Sistema */}
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <h4 className="text-blue-300 font-medium mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Estado del Sistema
                  </h4>
                  <ul className="text-blue-200 text-sm space-y-2">
                    <li className="flex items-center justify-between">
                      <span>Último backup:</span>
                      <span className="font-mono">
                        {systemInfo.lastBackupDate 
                          ? new Date(systemInfo.lastBackupDate).toLocaleString()
                          : 'Nunca'
                        }
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Tamaño de BD:</span>
                      <span className="font-mono">{systemInfo.estimatedDbSize}</span>
                    </li>
                  </ul>
                </div>

                {lastBackupInfo && (
                  <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                    <h4 className="text-green-300 font-medium mb-2">Último Backup Creado</h4>
                    <ul className="text-green-200 text-sm space-y-1">
                      <li>• Archivo: {lastBackupInfo.filename}</li>
                      <li>• Tamaño: {lastBackupInfo.size ? formatFileSize(lastBackupInfo.size) : 'N/A'}</li>
                      <li>• Fecha: {new Date().toLocaleString()}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleExport}
                disabled={isExporting || !exportPassword || !confirmPassword}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isExporting ? 'Creando Backup...' : 'Crear Backup'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido de Import */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2 text-green-400" />
              Restaurar desde Backup
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Selección de Archivo */}
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Archivo de Backup (.aex) *
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".aex"
                    onChange={handleFileSelect}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>

                {selectedFile && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <h4 className="text-white font-medium mb-2">Archivo Seleccionado</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Nombre: {selectedFile.name}</li>
                      <li>• Tamaño: {formatFileSize(selectedFile.size)}</li>
                      <li>• Modificado: {new Date(selectedFile.lastModified).toLocaleString()}</li>
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Contraseña del Backup *
                  </label>
                  <div className="relative">
                    <input
                      type={showImportPassword ? 'text' : 'password'}
                      value={importPassword}
                      onChange={(e) => setImportPassword(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Contraseña del backup"
                    />
                    <button
                      type="button"
                      onClick={() => setShowImportPassword(!showImportPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                    >
                      {showImportPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advertencias */}
              <div className="space-y-4">
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <h4 className="text-red-300 font-medium mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Advertencia Importante
                  </h4>
                  <ul className="text-red-200 text-sm space-y-1">
                    <li>• Esta operación eliminará TODOS los datos actuales</li>
                    <li>• No se puede deshacer una vez iniciada</li>
                    <li>• Asegúrese de tener un backup actual antes de proceder</li>
                    <li>• Verifique que el archivo sea de confianza</li>
                  </ul>
                </div>

                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                  <h4 className="text-blue-300 font-medium mb-2">Proceso de Restauración</h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>1. Verificación de integridad (checksum)</li>
                    <li>2. Descifrado de datos</li>
                    <li>3. Recreación de esquemas</li>
                    <li>4. Restauración de datos</li>
                    <li>5. Validación final</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleRestore}
                disabled={isRestoring || !selectedFile || !importPassword}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestoring ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{isRestoring ? 'Restaurando...' : 'Restaurar Backup'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información de Seguridad */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Key className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-yellow-300 font-medium mb-1">Recomendaciones de Seguridad</h4>
            <ul className="text-yellow-200 text-sm space-y-1">
              <li>• Use contraseñas fuertes y únicas para cada backup</li>
              <li>• Almacene los backups en ubicaciones seguras y separadas</li>
              <li>• Pruebe regularmente la restauración de backups</li>
              <li>• Mantenga múltiples copias de backups importantes</li>
              <li>• No comparta las contraseñas de backup por medios inseguros</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;