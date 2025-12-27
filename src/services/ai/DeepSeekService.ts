import { DEEPSEEK_CONFIG } from '../../config/deepseek';
import { ContextBuilder } from './ContextBuilder';
import { SecurityValidator } from './SecurityValidator';
import { DatabaseService } from '../database/DatabaseService';
import { DeepSeekAIResponse, AssistantContext, SecurityValidation } from './types';

export class DeepSeekService {
    private contextBuilder: ContextBuilder;
    private securityValidator: SecurityValidator;
    private abortController: AbortController | null = null;

    constructor() {
        this.contextBuilder = new ContextBuilder();
        this.securityValidator = new SecurityValidator();
    }

    async processQuery(userQuery: string, userId: number = 1): Promise<DeepSeekAIResponse> {
        const startTime = Date.now();
        console.log(`[DeepSeekService] Processing query for user ${userId}: "${userQuery}"`);

        try {
            // 1. VALIDACIÓN DE SEGURIDAD
            const securityCheck = this.securityValidator.validateQuery(userQuery);
            if (!securityCheck.allowed) {
                console.warn(`[DeepSeekService] Query blocked: ${securityCheck.reason}`);
                return this.createSecurityResponse(userQuery, securityCheck, Date.now() - startTime);
            }

            // 2. CONSTRUIR CONTEXTO
            const context = await this.contextBuilder.buildContext(userQuery, userId);

            // 3. LLAMADA A API CON TIMEOUT
            this.abortController = new AbortController();
            const timeoutId = setTimeout(() => {
                this.abortController?.abort();
            }, DEEPSEEK_CONFIG.timeout);

            const systemPrompt = this.buildSystemPrompt(context);

            try {
                const apiResponse = await this.callDeepSeekAPI(systemPrompt, userQuery);
                clearTimeout(timeoutId);

                // 4. VALIDACIÓN DE RESPUESTA
                const responseValidation = this.securityValidator.validateResponse(apiResponse.content);
                if (!responseValidation.valid) {
                    throw new Error(`API response validation failed: ${responseValidation.issues.join(', ')}`);
                }

                const formattedResponse = this.formatResponse(
                    apiResponse,
                    context,
                    Date.now() - startTime
                );

                // AUDITORÍA Y PERSISTENCIA
                await this.securityValidator.auditInteraction(userId, userQuery, formattedResponse, securityCheck);
                await this.saveConversation(userId, userQuery, formattedResponse);

                return formattedResponse;

            } catch (apiError: any) {
                clearTimeout(timeoutId);
                throw apiError;
            }

        } catch (error: any) {
            console.error('[DeepSeekService] Principal error in processQuery:', error.message);
            // El fallback NO debe llamar a ConversationalIAService para evitar bucles.
            return await this.fallbackToLocalSystem(userQuery, userId, startTime, error.message);
        }
    }

    private buildSystemPrompt(context: AssistantContext): string {
        return `
# IDENTIDAD Y ROL
Eres "ContaExpress", el asistente IA especializado de AccountExpress Next-Gen, un ERP contable offline-first para Florida, USA.

# REGLAS ABSOLUTAS DE SEGURIDAD
1. ⛔ **NUNCA** sugieras, ejecutes o generes código SQL que modifique datos (INSERT, UPDATE, DELETE, DROP, ALTER)
2. ⛔ **NUNCA** expongas datos sensibles (contraseñas, CC, SSN)
3. ✅ **SIEMPRE** guía al usuario a usar las funciones de la interfaz de AccountExpress
4. ✅ **SOLO** analiza datos de vistas que terminen en '_summary'
5. ✅ **SIEMPRE** responde en español profesional

# CONTEXTO ACTUAL DEL SISTEMA
Fecha: ${new Date().toISOString().split('T')[0]}
Estado BD: ${context.systemState.databaseStatus}
Último backup: ${context.systemState.lastBackup}

# CONOCIMIENTO ESPECÍFICO
${context.localKnowledge.map(k => `- ${k.content}`).join('\n')}

# DATOS FINANCIEROS (RESUMEN)
${JSON.stringify(context.relevantData.slice(0, 5), null, 2)}

# FORMATO DE RESPUESTA OBLIGATORIO
Responde en español usando estas secciones:

### 🎯 INTENCIÓN IDENTIFICADA
[Qué entendiste que quiere el usuario]

### 📊 INFORMACIÓN RELEVANTE
[Datos o conceptos aplicables]

### 👉 ACCIÓN RECOMENDADA EN ACCOUNTEXPRESS
[Pasos concretos en la interfaz]

### 🔍 EXPLICACIÓN TÉCNICA/CONTABLE
[Detalle contable]

### ⚠️ CONSIDERACIONES DE SEGURIDAD/FLORIDA
[Alertas o mejores prácticas]

# PREGUNTA DEL USUARIO:
"${context.userQuery}"
`;
    }

    private async callDeepSeekAPI(systemPrompt: string, userQuery: string): Promise<any> {
        const response = await fetch(DEEPSEEK_CONFIG.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: DEEPSEEK_CONFIG.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userQuery }
                ],
                max_tokens: DEEPSEEK_CONFIG.maxTokens,
                temperature: DEEPSEEK_CONFIG.temperature
            }),
            signal: this.abortController?.signal
        });

        if (!response.ok) throw new Error(`DeepSeek API error: ${response.status}`);

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            usage: data.usage || {},
            id: data.id
        };
    }

    private formatResponse(apiResponse: any, context: AssistantContext, processingTime: number): DeepSeekAIResponse {
        const rawContent = apiResponse.content;

        const extractSection = (name: string) => {
            const regex = new RegExp(`### \\s*${name}\\s*\\n([\\s\\S]*?)(?=###|$)`);
            const match = rawContent.match(regex);
            return match ? match[1].trim() : '';
        };

        return {
            id: apiResponse.id || `ai_${Date.now()}`,
            timestamp: new Date().toISOString(),
            query: context.userQuery,
            response: {
                intent: extractSection('INTENCIÓN IDENTIFICADA'),
                information: extractSection('INFORMACIÓN RELEVANTE'),
                action: extractSection('ACCIÓN RECOMENDADA'),
                explanation: extractSection('EXPLICACIÓN TÉCNICA'),
                considerations: extractSection('CONSIDERACIONES')
            },
            rawResponse: rawContent,
            contextUsed: {
                topics: context.detectedTopics,
                dataPoints: context.relevantData.length,
                knowledgeSnippets: context.localKnowledge.length
            },
            metadata: {
                model: DEEPSEEK_CONFIG.model,
                tokensUsed: apiResponse.usage?.total_tokens || 0,
                processingTime,
                fallbackUsed: false
            }
        };
    }

    private async fallbackToLocalSystem(userQuery: string, userId: number, startTime: number, errorReason?: string): Promise<DeepSeekAIResponse> {
        console.log('[DeepSeekService] Returning fallback marker to Smart Router.');

        // Devolvemos un objeto que indica que se debe usar el fallback local.
        // El ConversationalIAService (Smart Router) detectará metadata.fallbackUsed = true
        // y procederá con los motores locales.
        return {
            id: `fallback_${Date.now()}`,
            timestamp: new Date().toISOString(),
            query: userQuery,
            response: {
                intent: 'Fallback Local',
                information: 'Activando motores locales por fallo en DeepSeek.',
                action: 'Usando motor de búsqueda local',
                explanation: errorReason || 'DeepSeek API connection issue',
                considerations: 'IA Local activada'
            },
            rawResponse: 'FALLBACK_TRIGGERED',
            contextUsed: { topics: ['fallback'], dataPoints: 0, knowledgeSnippets: 0 },
            metadata: {
                model: 'local_fallback',
                tokensUsed: 0,
                processingTime: Date.now() - startTime,
                fallbackUsed: true,
                fallbackReason: errorReason || 'DeepSeek API failure'
            }
        };
    }

    private createSecurityResponse(query: string, validation: SecurityValidation, time: number): DeepSeekAIResponse {
        return {
            id: `sec_${Date.now()}`,
            timestamp: new Date().toISOString(),
            query,
            response: {
                intent: 'Consulta bloqueada por seguridad',
                information: `Motivo: ${validation.reason}`,
                action: 'Reformula tu consulta evitando comandos de escritura o términos sensibles.',
                explanation: `Severidad: ${validation.severity}`,
                considerations: 'El sistema prohíbe la modificación de datos vía IA.'
            },
            rawResponse: 'BLOQUEO SEGURIDAD',
            contextUsed: { topics: ['seguridad'], dataPoints: 0, knowledgeSnippets: 0 },
            metadata: { model: 'safety_layer', tokensUsed: 0, processingTime: time, fallbackUsed: false }
        };
    }

    private async saveConversation(userId: number, query: string, response: DeepSeekAIResponse): Promise<void> {
        try {
            await DatabaseService.getInstance().executeSafeQuery(
                `INSERT INTO ai_conversations 
                (user_id, query, response, intent, data_points_used, tokens_used, processing_time, model_used)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    query,
                    response.rawResponse,
                    response.response.intent,
                    response.contextUsed.dataPoints,
                    response.metadata.tokensUsed,
                    response.metadata.processingTime,
                    response.metadata.model
                ]
            );
        } catch (error) {
            console.error('[DeepSeekService] Failed to save conversation history', error);
        }
    }

    cancelRequest(): void {
        this.abortController?.abort();
    }
}
