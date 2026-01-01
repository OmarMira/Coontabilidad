/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalAIService } from '../../src/services/ai/LocalAIService';

describe('LocalAIService - Arquitectura Validada', () => {
    let aiService: LocalAIService;

    beforeEach(() => {
        aiService = new LocalAIService();
    });

    it('debe usar configuración Ollama correcta', () => {
        expect(aiService.getConfig().model).toBe('deepseek-r1-distill-llama-8b');
        expect(aiService.getConfig().options.temperature).toBe(0.1);
    });

    it('debe acceder solo a vistas de solo lectura', () => {
        const allowedViews = aiService.getAllowedViews();
        expect(allowedViews.every(view =>
            view.endsWith('_summary') ||
            view.endsWith('_alerts') ||
            view.endsWith('_kpi') ||
            view.endsWith('_florida')
        )).toBe(true);
    });

    it('debe rechazar acceso a tablas crudas', () => {
        expect(() => aiService.queryRawTable('users')).toThrow();
        expect(() => aiService.queryRawTable('audit_chain')).toThrow();
    });
});
