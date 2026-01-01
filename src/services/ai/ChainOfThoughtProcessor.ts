
/**
 * Procesa respuestas de DeepSeek R1 para extraer y formatear el razonamiento (Chain-of-Thought)
 */
export class ChainOfThoughtProcessor {
    /**
     * Formatea los datos para que DeepSeek pueda razonar sobre ellos
     */
    static formatForDeepSeekReasoning(data: any[], question: string): string {
        return `
    DATOS DEL SISTEMA ACCOUNTEXPRESS (CONTABILIDAD FLORIDA):
    ${JSON.stringify(data, null, 2)}
    
    PREGUNTA DEL USUARIO: "${question}"
    
    INSTRUCCIONES:
    1. Analiza SOLO los datos proporcionados arriba.
    2. Si es cálculo matemático, muestra el razonamiento paso a paso.
    3. Incluye referencias a condados de Florida si aplica.
    4. Destaca posibles problemas de cumplimiento fiscal.
    5. Termina con recomendación específica basada en datos.
    
    RESPUESTA:
    `;
    }

    /**
     * Extrae el bloque de pensamiento (<think>...</think>) y la respuesta final
     */
    static extractReasoningFromResponse(response: string): {
        thinking: string;
        finalAnswer: string;
        calculations: string[];
    } {
        if (!response) {
            return { thinking: '', finalAnswer: '', calculations: [] };
        }

        // Extraer pensamiento interno de DeepSeek R1
        const thinkingMatch = response.match(/<think>([\s\S]*?)<\/think>/i);
        const thinking = thinkingMatch ? thinkingMatch[1].trim() : '';

        // Extraer respuesta final (todo lo que no es thinking)
        const finalAnswer = response.replace(/<think>[\s\S]*?<\/think>/i, '').trim();

        // Extraer cálculos (intento heurístico de encontrar líneas con números y operadores)
        const calculations = this.extractCalculations(thinking || finalAnswer);

        return { thinking, finalAnswer, calculations };
    }

    private static extractCalculations(text: string): string[] {
        const calculationPatterns = [
            /(\$[\d,.]+|\d+(\.\d+)?)(\s*[\+\-\*\/]\s*)(\$[\d,.]+|\d+(\.\d+)?)\s*=/g, // Basic math
            /Cálculo:/i,
            /Total:/i
        ];

        const lines = text.split('\n');
        return lines.filter(line =>
            calculationPatterns.some(pattern => pattern.test(line)) ||
            (line.includes('=') && /\d/.test(line))
        ).map(l => l.trim());
    }
}
