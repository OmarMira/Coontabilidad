
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { LocalAIService } from '../../src/services/ai/LocalAIService';
import { ChainOfThoughtProcessor } from '../../src/services/ai/ChainOfThoughtProcessor';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe.skip('DeepSeek R1 Implementation Validation', () => {

    beforeEach(() => {
        fetchMock.mockReset();
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                response: '<think>Calculando...</think>42',
                message: { content: '<think>Analizando...</think>Resultado' }
            })
        });
    });

    test('ChainOfThoughtProcessor debe extraer thinking tags', () => {
        const response = "<think>Calculando paso 1...</think>La respuesta es 42";
        const extracted = ChainOfThoughtProcessor.extractReasoningFromResponse(response);

        expect(extracted.thinking).toBe("Calculando paso 1...");
        expect(extracted.finalAnswer).toBe("La respuesta es 42");
    });

    test('LocalAIService debe usar configuración DeepSeek', async () => {
        const aiService = new LocalAIService();
        const config = aiService.getConfig();

        expect(config.model).toBe('deepseek-r1-distill-llama-8b');
        expect(config.temperature).toBe(0.1);
    });

    test('LocalAIService debe prohibir acceso a tablas sensibles', () => {
        const aiService = new LocalAIService();

        expect(() => aiService.queryRawTable('users')).toThrow();
        expect(() => aiService.queryRawTable('passwords')).toThrow();
    });
});
