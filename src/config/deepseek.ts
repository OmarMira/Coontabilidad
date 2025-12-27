export const DEEPSEEK_CONFIG = {
  apiKey: import.meta.env.REACT_APP_DEEPSEEK_API_KEY,
  endpoint: import.meta.env.REACT_APP_DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat',
  maxTokens: parseInt(import.meta.env.REACT_APP_MAX_TOKENS || '4000'),
  temperature: 0.3,
  timeout: 60000 // Aumentado a 60 segundos
};

export const SECURITY_FILTERS = {
  blockedKeywords: [
    'DELETE', 'UPDATE', 'INSERT', 'DROP', 'ALTER',
    'PASSWORD', 'CREDIT_CARD', 'SSN', ';--', 'UNION',
    'MODIFY', 'CHANGE', 'REMOVE', 'DELETAR', 'MODIFICAR'
  ],
  allowedTables: [
    'financial_summary', 'tax_summary_florida',
    'inventory_summary', 'customers_summary',
    'invoices_summary', 'alerts_summary',
    'products_summary', 'suppliers_summary'
  ]
};

export const CONTEXT_RULES = {
  maxDataRows: 50,
  maxKnowledgeSnippets: 10,
  maxConversationHistory: 5,
  dataRetentionDays: 30
};