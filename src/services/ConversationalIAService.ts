
import { ModernConversationalAssistant, AssistantResponse } from './ai/ModernConversationalAssistant';

export interface ConversationResponse {
    content: string;
    data: any;
    metadata: {
        query: string;
        timestamp: string;
        intent: string;
        confidence: number;
        dataSource: string;
        processingTime: number;
    };
    suggestions: string[];
    requiresAttention: boolean;
}

export class ConversationalIAService {
    private static instance: ConversationalIAService;
    private assistant: ModernConversationalAssistant;

    private constructor() {
        this.assistant = new ModernConversationalAssistant();
    }

    static getInstance(): ConversationalIAService {
        if (!this.instance) {
            this.instance = new ConversationalIAService();
        }
        return this.instance;
    }

    async processQuery(userQuery: string, userId: number = 1): Promise<ConversationResponse> {
        const response = await this.assistant.processQuery(userQuery, userId);
        return this.mapToConversationResponse(response);
    }

    private mapToConversationResponse(res: AssistantResponse): ConversationResponse {
        return {
            content: res.content,
            data: res.data,
            metadata: res.metadata,
            suggestions: res.suggestions,
            requiresAttention: res.requiresAttention
        };
    }
}

export default class ConversationalIAServiceStatic {
    static async processQuery(query: string): Promise<ConversationResponse> {
        const service = ConversationalIAService.getInstance();
        return await service.processQuery(query);
    }
}
