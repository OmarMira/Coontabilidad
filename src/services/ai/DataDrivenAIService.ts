import { AIFactory, AIResponse } from './AIFactory';

/**
 * DataDrivenAIService (PROXY)
 * 
 * Este servicio ha sido consolidado en AIFactory.ts.
 */
export class DataDrivenAIService {
    static async processQueryWithStrictValidation(question: string): Promise<AIResponse> {
        return await AIFactory.processQuery(question);
    }
}
