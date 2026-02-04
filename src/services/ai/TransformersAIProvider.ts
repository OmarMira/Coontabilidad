import { pipeline } from '@xenova/transformers';

/**
 * TransformersAIProvider - Browser-based AI using Transformers.js
 * 
 * NO requiere instalación externa
 * NO requiere API keys
 * Funciona 100% offline después de primera carga
 * 
 * Modelo: LaMini-Flan-T5-783M (Q&A optimizado)
 */
export class TransformersAIProvider {
    private pipeline: any = null;
    private isReady = false;
    private readonly MODEL = 'Xenova/LaMini-Flan-T5-783M';

    /**
     * Initialize the AI model
     * Primera vez descarga ~783MB (lo hace el navegador automáticamente)
     */
    async initialize(): Promise<void> {
        if (this.isReady) return;

        try {
            console.log('Loading Transformers.js model...');

            // Create text2text-generation pipeline
            this.pipeline = await pipeline('text2text-generation', this.MODEL);

            this.isReady = true;
            console.log('✅ Transformers.js ready');
        } catch (error) {
            console.error('Failed to load Transformers.js:', error);
            throw new Error('AI model initialization failed');
        }
    }

    /**
     * Check if provider is available
     */
    async isAvailable(): Promise<boolean> {
        return this.isReady || await this.initialize().then(() => true).catch(() => false);
    }

    /**
     * Generate answer to query
     */
    async query(prompt: string, context?: string): Promise<string> {
        if (!this.isReady) {
            await this.initialize();
        }

        try {
            // Construct prompt with context
            const fullPrompt = context
                ? `Context: ${context}\n\nQuestion: ${prompt}\n\nAnswer:`
                : `Question: ${prompt}\n\nAnswer:`;

            // Generate response
            const result = await this.pipeline(fullPrompt, {
                max_length: 512,
                temperature: 0.3,  // Low temperature for factual responses
                do_sample: true,
                top_p: 0.9
            });

            return result[0].generated_text;
        } catch (error) {
            console.error('Transformers.js query failed:', error);
            throw error;
        }
    }

    /**
     * Analyze financial data
     */
    async analyzeData(data: any[], question: string): Promise<string> {
        // Convert data to context
        const context = this.formatDataAsContext(data);

        // Query with context
        return await this.query(question, context);
    }

    /**
     * Format data as natural language context
     */
    private formatDataAsContext(data: any[]): string {
        if (data.length === 0) {
            return 'No data available.';
        }

        // Take first 10 records to avoid token limits
        const sample = data.slice(0, 10);

        // Convert to readable format
        const lines = sample.map(item => {
            const pairs = Object.entries(item)
                .filter(([key, val]) => val !== null && val !== undefined)
                .map(([key, val]) => `${key}: ${val}`)
                .join(', ');
            return `- ${pairs}`;
        });

        return `Data (${data.length} records, showing first ${sample.length}):\n${lines.join('\n')}`;
    }

    /**
     * Get provider info
     */
    getInfo(): { name: string; model: string; offline: boolean } {
        return {
            name: 'Transformers.js',
            model: this.MODEL,
            offline: true
        };
    }
}
