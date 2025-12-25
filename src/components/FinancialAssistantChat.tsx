/**
 * ASISTENTE CONVERSACIONAL FINANCIERO
 * 
 * Chat interactivo para consultas específicas
 * - Botón flotante para abrir/cerrar
 * - Interfaz de chat con mensajes
 * - Preguntas rápidas predefinidas
 * - Procesamiento de lenguaje natural
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X, 
  MessageSquare, 
  Brain, 
  User, 
  Bot,
  ChevronRight, 
  Search, 
  AlertCircle, 
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import ConversationalIAService, { ConversationResponse } from '../services/ConversationalIAService';
import { logger } from '../core/logging/SystemLogger';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'query' | 'response' | 'error' | 'suggestion';
  data?: any;
}

export const FinancialAssistantChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: `👋 ¡Hola! Soy tu asistente financiero de **AccountExpress Next-Gen**.

**Puedo ayudarte con:**

📊 **Análisis Financiero**
• Estados de cuenta y balances
• Flujo de caja y tendencias
• Rentabilidad y márgenes

📦 **Gestión de Inventario**
• Productos con stock bajo
• Movimientos recientes
• Proyecciones de demanda

🏛️ **Impuestos Florida**
• Cálculo de sales tax por condado
• Reportes DR-15
• Cumplimiento fiscal

👥 **Gestión de Clientes**
• Morosidad y cobranza
• Actividad por condado
• Segmentación de clientes

⚠️ **Alertas y Riesgos**
• Facturas vencidas
• Irregularidades contables
• Recomendaciones proactivas

**Ejemplo de preguntas:**
• "¿Cuál es mi balance general?"
• "Muéstrame los productos con stock bajo"
• "Genera reporte de impuestos para Miami-Dade"
• "¿Qué clientes tienen facturas vencidas?"`,
      timestamp: new Date(),
      type: 'suggestion'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick suggestions
  const quickQuestions = [
    "Balance general actual",
    "Productos que necesito reponer",
    "Impuestos de Florida este mes",
    "Clientes con mayor morosidad",
    "Facturas pendientes de pago",
    "Análisis de rentabilidad"
  ];

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: input,
      timestamp: new Date(),
      type: 'query'
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    const userQuery = input;
    setInput('');

    try {
      logger.info('FinancialAssistant', 'user_query', 'Usuario realizó consulta', { query: userQuery });

      // Process with conversational AI
      const response: ConversationResponse = await ConversationalIAService.processQuery(userQuery);

      // Add assistant response
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        type: response.requiresAttention ? 'error' : 'response',
        data: response.data
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Add suggestions if available
      if (response.suggestions && response.suggestions.length > 0) {
        const suggestionsMessage: Message = {
          id: messages.length + 3,
          role: 'assistant',
          content: `💡 **Sugerencias relacionadas:**\n\n${response.suggestions.map(s => `• ${s}`).join('\n')}`,
          timestamp: new Date(),
          type: 'suggestion'
        };
        setMessages(prev => [...prev, suggestionsMessage]);
      }

      logger.info('FinancialAssistant', 'response_success', 'Respuesta generada exitosamente', { 
        query: userQuery,
        hasData: !!response.data,
        requiresAttention: response.requiresAttention
      });

    } catch (error) {
      const errorMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: `❌ **No pude procesar tu consulta**

**Posibles causas:**
• La pregunta requiere acceso a datos no disponibles para IA
• Formato de pregunta no reconocido
• Error temporal del sistema

**Sugerencias:**
• Reformula tu pregunta más específicamente
• Usa una de las preguntas rápidas sugeridas
• Verifica que los datos existan en el sistema`,
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
      logger.error('FinancialAssistant', 'response_error', 'Error procesando consulta', { query: userQuery }, error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Floating Button
  const FloatingButton = () => (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 z-50 group"
      aria-label="Abrir asistente financiero"
    >
      <Brain size={24} />
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
        IA
      </span>
      <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-white text-gray-800 px-3 py-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Asistente Financiero
      </div>
    </button>
  );

  // Chat Window
  const ChatWindow = () => (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Chat Container */}
      <div className="absolute bottom-0 right-0 w-full md:w-1/2 lg:w-1/3 h-3/4 md:h-4/5 bg-white rounded-t-2xl md:rounded-l-2xl md:rounded-r-none shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Brain className="h-6 w-6 mr-3" />
              <div>
                <h3 className="font-bold">Asistente Financiero IA</h3>
                <p className="text-sm text-blue-100">Modo solo lectura • Análisis en tiempo real</p>
              </div>
            </div>
            <button
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-50 border border-blue-100'
                    : msg.type === 'error'
                    ? 'bg-red-50 border border-red-100'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-start mb-2">
                  {msg.role === 'user' ? (
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                  ) : (
                    <Bot className="h-5 w-5 mr-2 text-purple-600" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">
                      {msg.role === 'user' ? 'Tú' : 'Asistente Financiero'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 last:mb-0">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <div className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-purple-600" />
                  <div className="flex space-x-1">
                    <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600">Analizando...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="border-t p-3 bg-gray-50">
          <div className="text-sm font-medium text-gray-600 mb-2">Preguntas rápidas:</div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center"
                onClick={() => handleQuickQuestion(q)}
                disabled={isProcessing}
              >
                <ChevronRight className="h-3 w-3 mr-1" />
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <textarea
              placeholder="Escribe tu pregunta financiera aquí..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isProcessing}
              className="flex-1 min-h-[60px] resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={isProcessing || !input.trim()}
              className="self-end bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors"
            >
              {isProcessing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            💡 Tip: Sé específico en tus preguntas para obtener mejores respuestas
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <FloatingButton />
      <ChatWindow />
    </>
  );
};

export default FinancialAssistantChat;