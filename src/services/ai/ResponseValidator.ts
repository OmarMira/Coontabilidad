import { DeepSeekAIResponse } from './types';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    requiredAction: 'REQUERY_WITH_CORRECT_VIEW' | 'APPEND_DATA_WARNING' | null;
}

export class ResponseValidator {
    static validate(response: DeepSeekAIResponse): ValidationResult {
        const errors: string[] = [];
        const content = response.rawResponse.toLowerCase();

        // ❌ PROHIBIDO: Respuestas que son solo documentación
        if (content.includes('¿cómo') && (content.includes('pasos:') || content.includes('1.'))) {
            // Si además no hay datos específicos de la DB
            if (response.contextUsed.dataPoints === 0) {
                errors.push('RESPONSE_IS_DOCUMENTATION_NOT_DATA');
            }
        }

        // ❌ PROHIBIDO: Respuestas sin datos específicos para intenciones de datos
        const intent = response.response.intent.toUpperCase();
        if (intent.includes('CLIENTE') || intent.includes('PROVEEDOR') || intent.includes('FACTURA')) {
            if (response.contextUsed.dataPoints === 0) {
                errors.push('RESPONSE_LACKS_SPECIFIC_DATA');
            }
        }

        // ❌ PROHIBIDO: Usar datos de demostración hardcodeados si no existen en la DB
        // (Simulado: si el contenido tiene nombres de demo conocidos pero dataPoints es 0)
        if (content.includes('tech solutions inc') && response.contextUsed.dataPoints === 0) {
            errors.push('USING_DEMO_DATA_NOT_REAL_DB');
        }

        return {
            isValid: errors.length === 0,
            errors,
            requiredAction: errors.length > 0 ? 'REQUERY_WITH_CORRECT_VIEW' : null
        };
    }
}
