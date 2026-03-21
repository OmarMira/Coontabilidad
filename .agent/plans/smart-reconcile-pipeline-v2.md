# PLAN TÉCNICO DE IMPLEMENTACIÓN

## Smart Reconcile — Pipeline de Ingesta Robusto

**Proyecto:** omarmira-coontabilidad  
**Módulo:** BankReconciliationImporter  
**Versión:** 2.0 — Fase 2 (Planificación)  
**Fecha:** 24 de febrero de 2026  
**Estado:** 📋 Documentado — Pendiente de Implementación

---

## 1. Contexto y Motivación

Este documento formaliza las decisiones de arquitectura derivadas del análisis técnico del módulo de importación de extractos bancarios. La versión 1.0 (MVP) implementó el flujo básico de detección automática. Este plan define los requisitos para elevar el módulo a nivel de producción contable de grado auditable.

## 2. Estado Actual — v1.0 (MVP)

### 2.1 Lo que fue implementado

- `StatementSmartParser.ts`: Motor que analiza archivos OFX y CSV.
- Detección automática del número de cuenta y nombre del banco.
- `findBankAccountByNumber` en el motor de base de datos.
- Creación on-the-fly de cuenta nueva con pre-relleno de datos.

### 2.2 Gaps Identificados (Riesgos)

- **GAP 1 — Falsos positivos:** La búsqueda por LIKE %número puede devolver múltiples cuentas.
- **GAP 2 — Sin validación de balance:** No se verifica la continuidad de saldos.
- **GAP 3 — Alcance limitado:** Sin soporte real para validación matemática de OCR en PDFs.
- **GAP 4 — Branding:** Terminología "Neural" poco profesional para auditores.

## 3. Arquitectura — Pipeline de Ingesta Robusto (4 Capas)

| Capa | Nombre | Responsabilidad | Resultado si falla |
| :--- | :--- | :--- | :--- |
| 1 | **Extract Layer** | OCR / Parser — Obtiene texto crudo. | Error de lectura → Detención |
| 2 | **Logic Layer** | **The Triangle** — Saldo Inicial + Créditos − Débitos = Saldo Final | **BLOCKER** — Cancelación |
| 3 | **Audit Layer** | **Continuity Check** — Verifica que el archivo encaje con el historial. | **BLOCKER** — Gap detectado |
| 4 | **Persistence Layer** | Escritura atómica en base de datos. | Rollback automático |

### 3.1 El Triángulo de la Verdad (Validación Matemática)

Fórmula: `Saldo Inicial + Σ Créditos − Σ Débitos = Saldo Final`
*Ejemplo real (BofA Enero 2025):*
`$32,615.55 + $18,893.25 − $17,047.19 = $34,461.61` ✅ **Cuadra**

## 4. Tabla de Decisión: Blocker vs Warning

| Escenario | Comportamiento | Mensaje de UI (UX) |
| :--- | :--- | :--- |
| Saldo inicial no coincide con sistema | **BLOCKER** | "Hueco temporal detectado. Sistema tiene registros hasta [fecha] con saldo [X]." |
| Triángulo matemático no cierra | **BLOCKER** | "Las transacciones extraídas no cuadran con los saldos del archivo. Revisar OCR." |
| Archivo ya importado (Duplicado) | **Warning** | "¿Deseas reimportar el período [mes]? Esto puede crear duplicados." |
| Saldo final difiere por ajuste menor | **Warning** | "Diferencia de $X detectada. Puede ser un ajuste pendiente. ¿Continuar?" |

## 5. Plan de Implementación — Fase 2

1. **Seguridad (Prioridad Alta):** Implementar **Disambiguation Modal** si `findBankAccountByNumber` retorna más de una cuenta.
2. **Integridad (Prioridad Alta):** Forzar la extracción de campos de balance y validar el **Triángulo** antes de mostrar la pre-visualización.
3. **Alcance (Prioridad Media):** Crear **PDF Template Parsers** para Bank of America y Chase para mejorar la precisión del OCR.
4. **Branding (Prioridad Baja):** Renombrar "Importador Neural" por **"Importador Inteligente de Extractos"**.

---
*Este documento es la hoja de ruta oficial para la evolución del módulo de conciliación.*
