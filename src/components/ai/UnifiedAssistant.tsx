/**
 * UNIFIED AI ASSISTANT - COMPONENTE PRINCIPAL UNIFICADO
 * 
 * Reemplaza IAPanel.tsx y FinancialAssistantChat.tsx
 * Tres modos: Dashboard, Chat, Guide
 * Acceso exclusivo a vistas _summary (solo lectura)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Brain,
    MessageSquare,
    BarChart3,
    BookOpen,
    X,
    Send,
    RefreshCw,
    AlertCircle,
    ChevronRight,
    Search,
    HelpCircle,
    Lightbulb
} from 'lucide-react';
import { ConversationalIAService, ConversationResponse } from '../../services/ConversationalIAService';
import { iaService, IAResponse } from '../../services/IAService';
import { SYSTEM_GUIDES, QUICK_OPERATIONS } from '../../knowledge/SystemKnowledge';
import { logger } from '../../core/logging/SystemLogger';

type AssistantMode = 'dashboard' | 'chat' | 'guide';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type?: 'query' | 'response' | 'error' | 'guide';
}

interface UnifiedAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: AssistantMode;
    // Real-time data props
    stats?: {
        customers: number;
        invoices: number;
        revenue: number;
        suppliers: number;
        bills: number;
        expenses: number;
    };
    transactionCount?: number;
    auditStatus?: {
        healthy: boolean;
        lastEvent: string;
        integrityScore: number;
    };
    complianceMetrics?: {
        taxCompliance: number;
        dr15Status: string;
        pendingForms: number;
    };
}

export const UnifiedAssistant: React.FC<UnifiedAssistantProps> = ({
    isOpen,
    onClose,
    initialMode = 'dashboard',
    stats,
    transactionCount,
    auditStatus,
    complianceMetrics
}) => {
    const [mode, setMode] = useState<AssistantMode>(initialMode);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<IAResponse | null>(null);
    const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && mode === 'dashboard') {
            loadDashboardAnalysis();
        }
    }, [isOpen, mode]);

    // Cargar análisis del dashboard
    const loadDashboardAnalysis = async () => {
        setIsLoading(true);
        try {
            const result = await iaService.analyzeFinancialHealth();
            setAnalysis(result);
            logger.info('UnifiedAssistant', 'dashboard_loaded', 'Análisis cargado exitosamente');
        } catch (error) {
            logger.error('UnifiedAssistant', 'dashboard_error', 'Error cargando análisis', {}, error as Error);
        } finally {
            setIsLoading(false);
        }
    };

    // Procesar consulta de chat
    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: input,
            timestamp: new Date(),
            type: 'query'
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const service = ConversationalIAService.getInstance();
            const response = await service.processQuery(input);

            const assistantMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.content,
                timestamp: new Date(),
                type: 'response'
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `⚠️ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                timestamp: new Date(),
                type: 'error'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    // Ejecutar guía rápida
    const handleQuickGuide = (guideKey: string) => {
        const guide = SYSTEM_GUIDES[guideKey];
        if (!guide) return;

        const guideMessage: Message = {
            id: Date.now(),
            role: 'assistant',
            content: formatGuide(guide),
            timestamp: new Date(),
            type: 'guide'
        };

        setMessages(prev => [...prev, guideMessage]);
        setMode('chat');
    };

    const formatGuide = (guide: { title: string; steps: string[]; tips?: string[] }) => {
        let content = `📖 **${guide.title}**\n\n`;
        content += `**Pasos:**\n`;
        guide.steps.forEach((step, index) => {
            content += `${index + 1}. ${step}\n`;
        });
        if (guide.tips && guide.tips.length > 0) {
            content += `\n💡 **Tips:**\n`;
            guide.tips.forEach(tip => {
                content += `• ${tip}\n`;
            });
        }
        return content;
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl border border-gray-700">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Asistente Financiero IA</h2>
                            <p className="text-sm text-gray-400">Solo lectura • Procesamiento local</p>
                        </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setMode('dashboard')}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${mode === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-sm">Dashboard</span>
                        </button>
                        <button
                            onClick={() => setMode('chat')}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${mode === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-sm">Chat</span>
                        </button>
                        <button
                            onClick={() => setMode('guide')}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${mode === 'guide' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            <span className="text-sm">Guías</span>
                        </button>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden">

                    {/* DASHBOARD MODE */}
                    {mode === 'dashboard' && (
                        <div className="h-full overflow-y-auto p-6 space-y-6">
                            {/* Real-time System Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Clientes</p>
                                    <p className="text-2xl font-bold text-white">{stats?.customers || 0}</p>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Ingresos</p>
                                    <p className="text-2xl font-bold text-green-400">${stats?.revenue.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Gastos</p>
                                    <p className="text-2xl font-bold text-red-400">${stats?.expenses.toLocaleString() || 0}</p>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Salud Audit</p>
                                    <p className={`text-2xl font-bold ${auditStatus?.healthy ? 'text-blue-400' : 'text-yellow-400'}`}>
                                        {auditStatus?.integrityScore || 0}%
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Análisis Financiero IA</h3>
                                    <p className="text-xs text-gray-400">Última auditoría: {auditStatus?.lastEvent ? new Date(auditStatus.lastEvent).toLocaleTimeString() : 'N/A'}</p>
                                </div>
                                <button
                                    onClick={loadDashboardAnalysis}
                                    disabled={isLoading}
                                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    <span>Actualizar Análisis</span>
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                                </div>
                            ) : analysis ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Alertas */}
                                    <div className="bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
                                        <h4 className="font-semibold text-white mb-3 flex items-center">
                                            <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                                            Alertas
                                        </h4>
                                        <div className="space-y-2">
                                            {analysis.alerts.map((alert, i) => (
                                                <p key={i} className="text-sm text-white bg-red-800/30 p-2 rounded">{alert}</p>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div className="bg-green-900/20 border-l-4 border-green-500 p-4 rounded-r-lg">
                                        <h4 className="font-semibold text-white mb-3 flex items-center">
                                            <ChevronRight className="w-5 h-5 mr-2 text-green-400" />
                                            Acciones Recomendadas
                                        </h4>
                                        <div className="space-y-2">
                                            {analysis.actions.map((action, i) => (
                                                <p key={i} className="text-sm text-white bg-green-800/30 p-2 rounded">{action}</p>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Análisis Detallado */}
                                    <div className="md:col-span-2 bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-r-lg">
                                        <h4 className="font-semibold text-white mb-3 flex items-center">
                                            <Search className="w-5 h-5 mr-2 text-purple-400" />
                                            Análisis Detallado
                                        </h4>
                                        <p className="text-sm text-white whitespace-pre-line">{analysis.analysis}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-8">No hay datos de análisis</p>
                            )}
                        </div>
                    )}

                    {/* CHAT MODE */}
                    {mode === 'chat' && (
                        <div className="h-full flex flex-col">
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.length === 0 && (
                                    <div className="text-center py-8">
                                        <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-white mb-2">¿En qué puedo ayudarte?</h3>
                                        <p className="text-gray-400 text-sm mb-6">Puedo analizar datos financieros, inventario, impuestos y más</p>

                                        {/* Quick Questions */}
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {['Balance general', 'Productos con stock bajo', 'Impuestos Florida'].map((q) => (
                                                <button
                                                    key={q}
                                                    onClick={() => { setInput(q); handleSendMessage(); }}
                                                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-sm text-white rounded-lg transition-colors"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : msg.type === 'error'
                                                    ? 'bg-red-900/50 text-red-200'
                                                    : msg.type === 'guide'
                                                        ? 'bg-purple-900/50 text-white'
                                                        : 'bg-gray-800 text-white'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-line">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-800 p-3 rounded-lg">
                                            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-gray-700">
                                <div className="flex space-x-2">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Escribe tu pregunta..."
                                        className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || isLoading}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GUIDE MODE */}
                    {mode === 'guide' && (
                        <div className="h-full overflow-y-auto p-6">
                            <h3 className="text-lg font-semibold text-white mb-6">Guías del Sistema</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(SYSTEM_GUIDES).map(([key, guide]: [string, { title: string; steps: string[] }]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleQuickGuide(key)}
                                        className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg text-left transition-colors border border-gray-700"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="p-2 bg-blue-600/20 rounded-lg">
                                                <BookOpen className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-white">{guide.title}</h4>
                                                <p className="text-sm text-gray-400 mt-1">{guide.steps.length} pasos</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Quick Operations */}
                            <h3 className="text-lg font-semibold text-white mt-8 mb-4">Operaciones Rápidas</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {QUICK_OPERATIONS.map((op: { label: string; guide: string }, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => handleQuickGuide(op.guide)}
                                        className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg text-center transition-colors"
                                    >
                                        <Lightbulb className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                                        <p className="text-sm text-white">{op.label}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-700 text-center">
                    <p className="text-xs text-gray-500">
                        🔒 Acceso exclusivo a vistas _summary • No modifica datos • Procesamiento 100% local
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UnifiedAssistant;
