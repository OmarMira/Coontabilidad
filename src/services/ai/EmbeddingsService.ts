import { pipeline, FeatureExtractionPipeline } from '@xenova/transformers';

/**
 * EmbeddingsService - Generate embeddings for RAG (Retrieval Augmented Generation)
 * 
 * Uses MiniLM model (23MB) for semantic search
 */
export class EmbeddingsService {
    private pipeline: FeatureExtractionPipeline | null = null;
    private readonly MODEL = 'Xenova/all-MiniLM-L6-v2';
    private cache: Map<string, number[]> = new Map();

    async initialize(): Promise<void> {
        if (this.pipeline) return;

        this.pipeline = await pipeline('feature-extraction', this.MODEL) as FeatureExtractionPipeline;
    }

    /**
     * Generate embedding for text
     */
    async embed(text: string): Promise<number[]> {
        // Check cache
        if (this.cache.has(text)) {
            return this.cache.get(text)!;
        }

        if (!this.pipeline) {
            await this.initialize();
        }

        // Generate embedding
        const output = await this.pipeline!(text, {
            pooling: 'mean',
            normalize: true
        });

        // Convert to array
        const embedding = Array.from(output.data) as number[];

        // Cache result
        this.cache.set(text, embedding);

        return embedding;
    }

    /**
     * Calculate cosine similarity between two embeddings
     */
    cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error('Embeddings must have same length');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Find most similar texts to query
     */
    async findSimilar(
        query: string,
        documents: Array<{ text: string; metadata?: any }>,
        topK: number = 5
    ): Promise<Array<{ text: string; similarity: number; metadata?: any }>> {
        // Generate query embedding
        const queryEmbedding = await this.embed(query);

        // Generate embeddings for all documents (or use cache)
        const results: Array<{ text: string; similarity: number; metadata?: any }> = [];

        for (const doc of documents) {
            const docEmbedding = await this.embed(doc.text);
            const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);

            results.push({
                text: doc.text,
                similarity,
                metadata: doc.metadata
            });
        }

        // Sort by similarity (descending)
        results.sort((a, b) => b.similarity - a.similarity);

        // Return top K
        return results.slice(0, topK);
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}
