# MASTER PROMPT: AccountExpress Next-Gen (v2.0)

## Arquitectura 100% Local-First & Forense

Este documento define la especificación técnica oficial del sistema para el desarrollo y mantenimiento.

---

### 🏗️ ARQUITECTURA DEL SISTEMA

const ARCHITECTURE = {
  core: {
    frontend: "React 18 + TypeScript 5.3",
    state: "Zustand (Global) + TanStack Query (Server State)",
    styling: "Vanilla CSS + Lucide Icons",
    routing: "Custom Router (Local-First Navigation)"
  },
  
  database: {
    engine: "SQLite 3.45 (via SQL.js/IndexedDB)",
    patterns: [
      "Atomic Transactions (BEGIN/COMMIT/ROLLBACK)",
      "Double Entry Accounting (Partida Doble)",
      "Immutability (Audit Hash Chain)"
    ]
  },

  // CAPA DE IA (ACTUALIZACIÓN CONFIRMADA)
  ai: {
    engine: "DeepSeek R1 Distill Llama 8B via Ollama (Local, 100% Offline) - PRIMARIO",
    fallback: "Sistema Experto Local basado en reglas SQL + análisis estático",
    access: "EXCLUSIVAMENTE vistas de solo lectura (v_invoice_summary, v_tax_alerts, v_audit_kpi)",
    role: "Asistente proactivo, consultor contable forense, especialista fiscal Florida",
    // NUEVO: Especificar características del modelo
    model_specs: {
      name: "deepseek-r1-distill-llama-8b",
      temperature: 0.1, // Para precisión contable
      context_window: "8192 tokens",
      reasoning: "Chain-of-Thought (CoT) para cálculos fiscales"
    }
  }
};

---

### ✅ IMPLEMENTACIÓN VERIFICADA (Commit: 2026-01-01)

const VERIFIED_IMPLEMENTATION = {
  // ✅ Arquitectura validada en commit actual
  ai_service: "LocalAIService.ts (reemplaza completamente DeepSeekService.ts)",
  config_files: ["src/config/ollama.ts", "src/config/ai-security.ts"],
  data_access: "Read-only mediante SQL queries a vistas _summary",
  // ✅ Correcciones aplicadas
  fixed_issues: [
    "FOREIGN KEY constraint failed (columna total_price → line_total)",
    "Eliminación de dependencias externas (Gemini/DeepSeek Cloud)",
    "Configuración Ollama optimizada para precisión contable"
  ],
  // ✅ Guía de instalación (de scripts/setup-ollama.js)
  setup_steps: [
    "1. Instalar Ollama desde https://ollama.com/",
    "2. Descargar modelo: `ollama pull deepseek-r1-distill-llama-8b`",
    "3. Iniciar servicio: `ollama serve` (por defecto en localhost:11434)"
  ]
};

---

### 📋 MIGRACIÓN Y LIMPIEZA COMPLETADA

- Se han eliminado todos los tokens y referencias a `Gemini` y `GoogleGenerativeAI`.
- El archivo `.env.local` ya no contiene APIs de IA externas.
- El sistema puede funcionar sin conexión a internet manteniendo el 100% de la capacidad de análisis.
