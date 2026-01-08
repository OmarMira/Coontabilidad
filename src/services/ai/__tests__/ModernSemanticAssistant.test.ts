
import { ModernConversationalAssistant } from '../ModernConversationalAssistant';
import { SemanticQueryAnalyzer } from '../SemanticQueryAnalyzer';
import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../../../database/simple-db';

describe('Modern Semantic Assistant - PRUEBAS MULTILINGÜES', () => {
    let assistant: ModernConversationalAssistant;

    beforeAll(async () => {
        assistant = new ModernConversationalAssistant();
        await assistant.initialize();
    });

    describe('Soporte de Español (Spanish Support)', () => {
        it('DEBE detectar español y responder en español', async () => {
            const res = await assistant.processQuery("cuántos clientes tengo?");
            expect(res.metadata.language).toBe('es');
            // Aceptamos éxito o mensaje informativo de falta de datos, pero EN ESPAÑOL
            expect(res.content).toMatch(/cuenta con|no hay registros reales/);
            expect(res.content).toContain('cliente'); // Nombre traducido
            expect(res.metadata.intent).toBe('COUNT');
        });

        it('DEBE explicar conceptos en español', async () => {
            const res = await assistant.processQuery("qué es un activo?");
            expect(res.metadata.language).toBe('es');
            expect(res.content).toContain('Recurso con valor');
        });
    });

    describe('Soporte de Inglés (English Support)', () => {
        it('DEBE detectar inglés y responder en inglés', async () => {
            const res = await assistant.processQuery("how many customers do I have?");
            expect(res.metadata.language).toBe('en');
            // Aceptamos éxito o mensaje informativo de falta de datos, pero EN INGLÉS
            expect(res.content).toMatch(/currently has|no real records/);
            expect(res.content).toContain('customer'); // English name
            expect(res.metadata.intent).toBe('COUNT');
        });

        it('DEBE explicar conceptos en inglés', async () => {
            const res = await assistant.processQuery("what is an asset?");
            expect(res.metadata.language).toBe('en');
            expect(res.content).toContain('resource with economic value');
        });

        it('DEBE identificar el mejor cliente en inglés', async () => {
            const res = await assistant.processQuery("who is my best customer?");
            expect(res.metadata.language).toBe('en');
            expect(res.content).toMatch(/best result corresponds to|no real records/);
            expect(res.metadata.intent).toBe('FIND_MAX');
        });
    });

    describe('Normalización y Mezcla (Normalization & Mixed)', () => {
        it('DEBE manejar tildes (qué -> que)', async () => {
            const res = await assistant.processQuery("qué es la depreciación macrs?");
            expect(res.metadata.intent).toBe('EXPLAIN');
            expect(res.content).toContain('MACRS');
        });

        it('DEBE manejar mezcla con predominio de idioma', async () => {
            // Predominio inglés por "what is the definition of"
            const res = await assistant.processQuery("what is the definition of activo?");
            expect(res.metadata.language).toBe('en');
            expect(res.metadata.intent).toBe('EXPLAIN');
            expect(res.content).toContain('resource with economic value'); // Definición en inglés
        });
    });
});
