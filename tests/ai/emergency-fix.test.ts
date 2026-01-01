
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { LocalAIService } from '../../src/services/ai/LocalAIService';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock database (ContextManager imports db directly)
vi.mock('../../src/database/simple-db', () => ({
    db: {
        exec: vi.fn((query) => {
            if (query.includes('v_clientes_reales')) return [{ columns: ['total'], values: [[10]] }];
            if (query.includes('v_facturas_reales')) return [{ columns: ['total'], values: [[5]] }];
            if (query.includes('v_proveedores_reales')) return [{ columns: ['total'], values: [[3]] }];
            return [];
        })
    }
}));

describe('Emergency AI Fix Validation', () => {
    let aiService: LocalAIService;

    beforeEach(() => {
        aiService = new LocalAIService();
        fetchMock.mockReset();

        // Mock DeepSeek response simulating data usage
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                response: `
            <think>
            Analizando datos:
            - Clientes encontrados: 10
            - Facturas: 5
            </think>
            Actualmente tienes 10 clientes registrados y 5 facturas procesadas.
            `,
                message: {
                    content: `
                <think>
                Analizando datos:
                - Clientes encontrados: 10
                - Facturas: 5
                </think>
                Actualmente tienes 10 clientes registrados y 5 facturas procesadas.
                `
                }
            })
        });
    });

    test('IA debe dar respuestas específicas y no genéricas', async () => {
        const preguntas = [
            'cuantos clientes tengo',
            'cuantas facturas se hicieron',
            'cual es la mayor venta',
            'cuantos proveedores tengo'
        ];

        for (const pregunta of preguntas) {
            const respuesta = await aiService.processQuery(pregunta);
            const textoRespuesta = respuesta.response.explanation + respuesta.response.information;

            // VERIFICAR QUE NO SEA GENÉRICA
            expect(textoRespuesta).not.toMatch(/Basado en \d+ registros/);
            expect(textoRespuesta).not.toMatch(/Resumen Ejecutivo/);
            expect(textoRespuesta).not.toMatch(/registros relevantes/);

            // VERIFICAR QUE TENGA DATOS REALES (Simulados en el mock)
            expect(textoRespuesta).toMatch(/\d+/); // Al menos un número
        }
    });
});
