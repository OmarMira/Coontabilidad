import React, { useState, useRef } from 'react';
import { Upload, X, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { logger } from '../core/logging/SystemLogger';

interface LogoUploaderProps {
  currentLogo?: string;
  onLogoChange: (logoPath: string | null) => void;
  disabled?: boolean;
}

export function LogoUploader({ currentLogo, onLogoChange, disabled = false }: LogoUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Formato no válido. Use JPG, PNG, GIF o WebP.';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return 'El archivo es muy grande. Máximo 5MB.';
    }
    
    return null;
  };

  const processFile = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      logger.info('LogoUploader', 'upload_start', 'Iniciando carga de logo', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Validar archivo
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Crear un canvas para redimensionar la imagen si es necesario
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();

      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            // Calcular dimensiones manteniendo proporción (máximo 400x400)
            const maxSize = 400;
            let { width, height } = img;
            
            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = (height * maxSize) / width;
                width = maxSize;
              } else {
                width = (width * maxSize) / height;
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;

            // Dibujar imagen redimensionada
            ctx?.drawImage(img, 0, 0, width, height);

            // Convertir a base64
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // Generar nombre único para el archivo
            const timestamp = Date.now();
            const logoPath = `company-logo-${timestamp}.jpg`;
            
            // Almacenar en localStorage (en una implementación real, se guardaría en el servidor)
            localStorage.setItem(`logo_${logoPath}`, dataUrl);
            
            logger.info('LogoUploader', 'upload_success', 'Logo cargado exitosamente', {
              logoPath,
              originalSize: file.size,
              processedSize: dataUrl.length,
              dimensions: `${width}x${height}`
            });

            onLogoChange(logoPath);
            setSuccess('Logo cargado exitosamente');
            
            // Limpiar mensaje de éxito después de 3 segundos
            setTimeout(() => setSuccess(null), 3000);
            
            resolve();
          } catch (error) {
            logger.error('LogoUploader', 'process_failed', 'Error al procesar imagen', null, error as Error);
            reject(new Error('Error al procesar la imagen'));
          }
        };

        img.onerror = () => {
          reject(new Error('Error al cargar la imagen'));
        };

        img.src = URL.createObjectURL(file);
      });

    } catch (error) {
      logger.error('LogoUploader', 'upload_failed', 'Error al cargar logo', null, error as Error);
      setError(`Error al cargar el logo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveLogo = () => {
    if (currentLogo) {
      // Eliminar del localStorage
      localStorage.removeItem(`logo_${currentLogo}`);
      
      logger.info('LogoUploader', 'logo_removed', 'Logo eliminado', { logoPath: currentLogo });
      
      onLogoChange(null);
      setSuccess('Logo eliminado');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const getLogoUrl = (logoPath: string): string | null => {
    try {
      const dataUrl = localStorage.getItem(`logo_${logoPath}`);
      return dataUrl;
    } catch (error) {
      logger.error('LogoUploader', 'get_logo_failed', 'Error al obtener logo', { logoPath }, error as Error);
      return null;
    }
  };

  const logoUrl = currentLogo ? getLogoUrl(currentLogo) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          Logo de la Empresa
        </label>
        {currentLogo && (
          <button
            onClick={handleRemoveLogo}
            disabled={disabled}
            className="text-red-400 hover:text-red-300 disabled:text-gray-500 text-sm flex items-center space-x-1"
          >
            <X className="h-4 w-4" />
            <span>Eliminar</span>
          </button>
        )}
      </div>

      {/* Vista previa del logo actual */}
      {logoUrl && (
        <div className="flex justify-center mb-4">
          <div className="relative bg-white rounded-lg p-4 shadow-lg">
            <img
              src={logoUrl}
              alt="Logo de la empresa"
              className="max-w-48 max-h-32 object-contain"
            />
            <div className="absolute -top-2 -right-2">
              <div className="bg-green-500 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Área de carga */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${dragOver && !disabled
            ? 'border-blue-400 bg-blue-900/20' 
            : disabled
              ? 'border-gray-600 bg-gray-800 cursor-not-allowed'
              : 'border-gray-600 hover:border-gray-500 bg-gray-700'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 text-sm">Procesando imagen...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-center">
              {currentLogo ? (
                <Image className="h-8 w-8 text-gray-400" />
              ) : (
                <Upload className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-gray-300 text-sm font-medium">
                {currentLogo ? 'Cambiar logo' : 'Subir logo de la empresa'}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Arrastra una imagen aquí o haz clic para seleccionar
              </p>
              <p className="text-gray-500 text-xs">
                JPG, PNG, GIF o WebP • Máximo 5MB • Se redimensionará automáticamente
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
        <p className="text-blue-200 text-xs">
          <strong>💡 Recomendación:</strong> Use un logo con fondo transparente (PNG) para mejores resultados en documentos. 
          El logo aparecerá en facturas, reportes y documentos oficiales.
        </p>
      </div>
    </div>
  );
}