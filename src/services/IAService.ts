import { AIFactory, AIResponse } from './ai/AIFactory';

/**
 * IAService (PROXY)
 * 
 * Este servicio ha sido consolidado en AIFactory.ts.
 * Se mantiene como pasarela para no romper la compatibilidad con componentes existentes.
 */
export class IAService {
  async analyzeFinancialHealth(): Promise<AIResponse> {
    return await AIFactory.processQuery('análisis de salud financiera');
  }

  async querySummary(viewName: string): Promise<any[]> {
    const response = await AIFactory.processQuery(`Consulta resumen de ${viewName}`);
    return response.data || [];
  }

  async isAvailable(): Promise<boolean> {
    return true; // Asumimos disponible si la factoría está cargada
  }
}

export const iaService = new IAService();
export default iaService;