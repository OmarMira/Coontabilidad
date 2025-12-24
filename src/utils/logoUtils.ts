import { getCompanyData } from '../database/simple-db';
import { logger } from '../core/logging/SystemLogger';

/**
 * Obtiene la URL del logo de la empresa para usar en documentos y reportes
 */
export function getCompanyLogoUrl(): string | null {
  try {
    const companyData = getCompanyData();
    
    if (!companyData?.logo_path) {
      return null;
    }

    // Obtener el logo del localStorage
    const dataUrl = localStorage.getItem(`logo_${companyData.logo_path}`);
    
    if (!dataUrl) {
      logger.warn('LogoUtils', 'logo_not_found', 'Logo no encontrado en localStorage', { 
        logoPath: companyData.logo_path 
      });
      return null;
    }

    return dataUrl;
    
  } catch (error) {
    logger.error('LogoUtils', 'get_logo_failed', 'Error al obtener logo de empresa', null, error as Error);
    return null;
  }
}

/**
 * Obtiene información completa del logo (URL + dimensiones)
 */
export function getCompanyLogoInfo(): { url: string | null; width?: number; height?: number } {
  const url = getCompanyLogoUrl();
  
  if (!url) {
    return { url: null };
  }

  // En una implementación más avanzada, se podrían obtener las dimensiones reales
  // Por ahora retornamos dimensiones estándar para documentos
  return {
    url,
    width: 200, // Ancho estándar para documentos
    height: 100  // Alto estándar para documentos
  };
}

/**
 * Verifica si la empresa tiene un logo configurado
 */
export function hasCompanyLogo(): boolean {
  return getCompanyLogoUrl() !== null;
}

/**
 * Genera HTML para mostrar el logo en reportes
 */
export function getLogoHtml(maxWidth: number = 200, maxHeight: number = 100): string {
  const logoUrl = getCompanyLogoUrl();
  
  if (!logoUrl) {
    return '';
  }

  return `
    <img 
      src="${logoUrl}" 
      alt="Logo de la empresa" 
      style="max-width: ${maxWidth}px; max-height: ${maxHeight}px; object-fit: contain;"
    />
  `;
}

/**
 * Obtiene el logo como elemento Image para usar en canvas o PDF
 */
export function getLogoAsImage(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const logoUrl = getCompanyLogoUrl();
    
    if (!logoUrl) {
      resolve(null);
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      resolve(img);
    };
    
    img.onerror = () => {
      logger.error('LogoUtils', 'image_load_failed', 'Error al cargar imagen del logo');
      resolve(null);
    };
    
    img.src = logoUrl;
  });
}