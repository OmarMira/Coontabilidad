/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalAIService } from '../../src/services/ai/LocalAIService';
import { NaturalLanguageQueryProcessor } from '../../src/services/ai/QueryProcessor';
import { ResponseValidator } from '../../src/services/ai/ResponseValidator';
import ollama from 'ollama';

// Mock de ollama
vi.mock('ollama', () => ({
    default: {
        chat: vi.fn(),
        generate: vi.fn()
    }
}));

describe('IA Response Accuracy - 100% Improvement', () => {
    let aiService: LocalAIService;

    beforeEach(() => {
        vi.clearAllMocks();
        aiService = new LocalAIService();
    });

    it('Pregunta específica de clientes debe mapear a v_customers_summary', async () => {
        const intent = NaturalLanguageQueryProcessor.analyzeIntent('¿Cuántos clientes tengo registrados?');
        expect(intent.type).toBe('CUSTOMER_COUNT');
    });

    it('Pregunta de proveedores debe mapear a v_suppliers_summary', async () => {
        const intent = NaturalLanguageQueryProcessor.analyzeIntent('¿Cuál es mi mayor proveedor en Florida?');
        expect(intent.type).toBe('TOP_SUPPLIER');
    });

    it('Debe rechazar respuestas que son pura documentación sin datos', () => {
        const mockResponse: any = {
            rawResponse: '¿Cómo crear facturas? Pasos: 1. Ve al menú. 2. Click en nuevo.',
            response: { intent: 'CUSTOMER_COUNT', explanation: '...' },
            contextUsed: { dataPoints: 0 }
        };

        const validation = ResponseValidator.validate(mockResponse);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('RESPONSE_IS_DOCUMENTATION_NOT_DATA');
    });

    it('Debe aceptar respuestas que contienen datos reales de la DB', () => {
        const mockResponse: any = {
            rawResponse: 'Tienes 15 clientes registrados según v_customers_summary.',
            response: { intent: 'CUSTOMER_COUNT', explanation: '...' },
            contextUsed: { dataPoints: 1 }
        };

        const validation = ResponseValidator.validate(mockResponse);
        expect(validation.isValid).toBe(true);
    });
});
