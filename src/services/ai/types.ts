export interface SecurityValidation {
    allowed: boolean;
    reason: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface KnowledgeSnippet {
    source: 'system_knowledge' | 'florida_tax_law' | 'accounting_principles';
    content: string;
    relevance: number;
    lastUpdated: string;
}

export interface AssistantContext {
    timestamp: string;
    userQuery: string;
    detectedTopics: string[];
    localKnowledge: KnowledgeSnippet[];
    relevantData: any[];
    userPermissions: {
        userId: number;
        roles: string[];
        allowedViews: string[];
    };
    systemState: {
        databaseStatus: 'healthy' | 'degraded' | 'offline';
        lastBackup: string;
        taxPeriodActive: boolean;
    };
    conversationHistory: Array<{
        query: string;
        response: string;
        timestamp: string;
    }>;
}

export interface DeepSeekAIResponse {
    id: string;
    timestamp: string;
    query: string;
    response: {
        intent: string;
        information: string;
        action: string;
        explanation: string;
        considerations: string;
    };
    rawResponse: string;
    contextUsed: {
        topics: string[];
        dataPoints: number;
        knowledgeSnippets: number;
    };
    metadata: {
        model: string;
        tokensUsed: number;
        processingTime: number;
        fallbackUsed: boolean;
        fallbackReason?: string;
    };
}
