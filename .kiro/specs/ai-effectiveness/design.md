# Design Document - IA Efectiva para Account Express

## Overview

Este documento describe el diseño técnico para transformar el asistente de IA de Account Express de un sistema reactivo a uno proactivo y efectivo. El sistema actual (ModernConversationalAssistant) solo responde preguntas cuando se le solicita. El nuevo diseño implementará monitoreo continuo, alertas inteligentes, validación predictiva, memoria conversacional y conocimiento especializado expandido.

### Current State Analysis

**Componentes Existentes:**
- `ModernConversationalAssistant`: Orquestador principal de consultas
- `SemanticQueryAnalyzer`: Análisis semántico de consultas
- `IntelligentSQLGenerator`: Generación de SQL para consultas de datos
- `AccountingKnowledgeBase`: Base de conocimiento con ~15 conceptos contables
- `SystemKnowledge`: Guías del sistema y procedimientos
- `LocalAIService`: Procesamiento de consultas generales

**Limitaciones Identificadas:**
- Solo 5 de 67 condados de Florida tienen información completa
- Conocimiento contable limitado (15 conceptos vs 50+ necesarios)
- No hay monitoreo proactivo
- No hay sistema de alertas
- No hay memoria conversacional
- No hay validación predictiva en tiempo real

### Design Goals

1. **Proactividad**: El sistema debe monitorear y alertar sin intervención del usuario
2. **Conocimiento Completo**: Cobertura de 67 condados y 50+ conceptos contables
3. **Inteligencia Contextual**: Memoria conversacional y sugerencias contextuales
4. **Prevención de Errores**: Validación en tiempo real antes de guardar datos
5. **Análisis de Riesgos**: Identificación automática de riesgos financieros

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  (UnifiedAssistant, AlertPanel, ValidationFeedback)         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   AI Orchestrator Layer                      │
│              (AIOrchestrator - NEW)                          │
│  - Route queries to appropriate services                     │
│  - Coordinate proactive monitoring                           │
│  - Manage conversation context                               │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────┴────────┐ ┌───┴────────┐ ┌───┴──────────────┐
│  Knowledge      │ │ Proactive  │ │  Validation      │
│  Services       │ │ Monitoring │ │  Services        │
│                 │ │            │ │                  │
│ - FloridaGAAP   │ │ - Monitor  │ │ - Predictive     │
│   Knowledge     │ │ - Alerts   │ │   Validator      │
│ - Expanded      │ │ - Risk     │ │ - GAAP Rules     │
│   Accounting    │ │   Analyzer │ │   Engine         │
│   KB            │ │            │ │                  │
└─────────────────┘ └────────────┘ └──────────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                     Data Layer                               │
│  (DatabaseService, ConversationStore, AlertStore)           │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Reactive Query Flow (Existing):**
```
User Query → AIOrchestrator → SemanticAnalyzer → 
  → Knowledge/Data Service → Response
```

**Proactive Monitoring Flow (NEW):**
```
Transaction Event → ProactiveMonitor → RiskAnalyzer → 
  → AlertSystem → User Notification
```

**Validation Flow (NEW):**
```
User Input → PredictiveValidator → GAAPRulesEngine → 
  → Validation Result → UI Feedback
```

## Components and Interfaces

### 1. AIOrchestrator (NEW)

**Purpose**: Coordina todos los servicios de IA y maneja el contexto conversacional.

**Interface:**
```typescript
interface AIOrchestrator {
  // Query Processing
  processQuery(query: string, userId: number, context: ConversationContext): Promise<AIResponse>;
  
  // Proactive Monitoring
  startMonitoring(userId: number): void;
  stopMonitoring(userId: number): void;
  
  // Context Management
  getConversationContext(userId: number): ConversationContext;
  clearConversationContext(userId: number): void;
  
  // Validation
  validateEntry(entry: AccountingEntry, context: ModuleContext): ValidationResult;
}

interface ConversationContext {
  userId: number;
  sessionId: string;
  messages: Message[];
  currentModule?: string;
  userPreferences: UserPreferences;
  startTime: Date;
}

interface AIResponse {
  success: boolean;
  content: string;
  data?: any;
  suggestions: string[];
  alerts?: Alert[];
  validationErrors?: ValidationError[];
  metadata: ResponseMetadata;
}
```

**Responsibilities:**
- Route queries to appropriate knowledge services
- Maintain conversation context per user session
- Coordinate proactive monitoring services
- Aggregate responses from multiple services
- Track user preferences and module context

### 2. FloridaGAAPKnowledge (NEW)

**Purpose**: Base de conocimiento expandida con información completa de Florida.

**Interface:**
```typescript
interface FloridaGAAPKnowledge {
  // County Information
  getCountyTaxRate(countyName: string): CountyTaxInfo;
  getAllCounties(): CountyTaxInfo[];
  getCountyRegulations(countyName: string): Regulation[];
  
  // Accounting Concepts
  getConcept(conceptKey: string, language: 'es' | 'en'): AccountingConcept;
  searchConcepts(query: string, language: 'es' | 'en'): AccountingConcept[];
  getAllConcepts(language: 'es' | 'en'): AccountingConcept[];
  
  // Industry-Specific Guidance
  getIndustryGuidance(industry: string): IndustryGuidance;
  
  // Tax Credits and Deductions
  getTaxCredit(creditType: string): TaxCreditInfo;
  getDeductionRules(deductionType: string): DeductionRules;
}

interface CountyTaxInfo {
  name: string;
  code: string;
  stateTaxRate: number;
  surtaxRate: number;
  totalRate: number;
  regulations: Regulation[];
  dr15Requirements: DR15Requirements;
  lastUpdated: Date;
}

interface AccountingConcept {
  key: string;
  name: string;
  definition: string;
  examples: string[];
  relatedConcepts: string[];
  gaapReferences: string[];
  floridaSpecific?: string;
  industryApplications?: IndustryApplication[];
}
```

**Data Structure:**
- 67 condados de Florida con información completa
- 50+ conceptos contables (expandido desde 15)
- 10+ industrias con guías específicas
- Información de Sección 179, MACRS, créditos fiscales
- Reglas de exenciones y certificados de reventa

### 3. ProactiveMonitor (NEW)

**Purpose**: Monitorea el sistema continuamente y detecta anomalías.

**Interface:**
```typescript
interface ProactiveMonitor {
  // Transaction Monitoring
  analyzeTransaction(transaction: Transaction): MonitoringResult;
  detectAnomalies(transactions: Transaction[]): Anomaly[];
  
  // Financial Health Monitoring
  calculateFinancialRatios(companyId: number): FinancialRatios;
  checkRatioThresholds(ratios: FinancialRatios): Alert[];
  
  // Compliance Monitoring
  checkComplianceDeadlines(companyId: number): ComplianceAlert[];
  verifyTaxCalculations(transaction: Transaction): TaxValidationResult;
  
  // Accounts Receivable Monitoring
  analyzeARAging(companyId: number): ARAging Analysis;
  detectOverdueAccounts(threshold: number): OverdueAccount[];
}

interface MonitoringResult {
  isValid: boolean;
  anomalies: Anomaly[];
  alerts: Alert[];
  suggestions: string[];
}

interface Anomaly {
  type: 'unusual_amount' | 'pattern_deviation' | 'duplicate' | 'imbalance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEntities: string[];
  detectedAt: Date;
}
```

**Monitoring Rules:**
- Double-entry bookkeeping validation
- Unusual transaction amounts (>3 standard deviations)
- Duplicate transaction detection
- Tax calculation accuracy
- Financial ratio thresholds
- AR aging analysis
- Compliance deadline tracking

### 4. AlertSystem (NEW)

**Purpose**: Sistema inteligente de alertas con priorización y agrupación.

**Interface:**
```typescript
interface AlertSystem {
  // Alert Generation
  createAlert(alert: AlertInput): Alert;
  
  // Alert Management
  getAlerts(userId: number, filters?: AlertFilters): Alert[];
  resolveAlert(alertId: string, resolution: AlertResolution): void;
  dismissAlert(alertId: string): void;
  
  // Alert Grouping
  groupRelatedAlerts(alerts: Alert[]): AlertGroup[];
  
  // Alert Preferences
  getUserPreferences(userId: number): AlertPreferences;
  updatePreferences(userId: number, prefs: AlertPreferences): void;
  
  // Alert History
  getAlertHistory(userId: number, dateRange: DateRange): Alert[];
}

interface Alert {
  id: string;
  type: AlertType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedEntities: string[];
  suggestedActions: string[];
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: AlertResolution;
}

interface AlertGroup {
  id: string;
  alerts: Alert[];
  commonType: AlertType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  summary: string;
}

interface AlertPreferences {
  enabledTypes: AlertType[];
  minimumPriority: 'critical' | 'high' | 'medium' | 'low';
  notificationChannels: ('ui' | 'email' | 'sms')[];
  quietHours?: { start: string; end: string };
}
```

**Alert Categories:**
- **Critical**: Descuadres contables, errores de integridad
- **High**: Vencimientos, límites excedidos, riesgos financieros
- **Medium**: Recomendaciones de optimización, varianzas presupuestarias
- **Low**: Sugerencias de mejora, recordatorios generales

**Alert Grouping Logic:**
- Group alerts by type within 1-hour window
- Group alerts affecting same entity
- Suppress duplicate alerts within 24 hours

### 5. PredictiveValidator (NEW)

**Purpose**: Validación en tiempo real de entradas antes de guardar.

**Interface:**
```typescript
interface PredictiveValidator {
  // Entry Validation
  validateAccountingEntry(entry: AccountingEntry): ValidationResult;
  validateInvoice(invoice: Invoice): ValidationResult;
  validateBudgetEntry(entry: BudgetEntry): ValidationResult;
  
  // Duplicate Detection
  detectDuplicateTransaction(transaction: Transaction): DuplicateCheckResult;
  
  // GAAP Validation
  validateAgainstGAAP(entry: AccountingEntry): GAAPValidationResult;
  
  // Tax Validation
  validateTaxCalculation(transaction: Transaction): TaxValidationResult;
  
  // Completeness Validation
  validateRequiredFields(data: any, schema: Schema): FieldValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  canProceed: boolean;
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  suggestedFix?: string;
}
```

**Validation Rules:**
- Double-entry balance (debits = credits)
- Required field completeness
- Data type and format validation
- Business rule validation (e.g., dates, amounts)
- GAAP compliance
- Tax calculation accuracy
- Duplicate detection
- Unusual amount detection

### 6. RiskAnalyzer (NEW)

**Purpose**: Análisis de riesgos financieros y predicción de problemas.

**Interface:**
```typescript
interface RiskAnalyzer {
  // Financial Ratio Analysis
  analyzeFinancialHealth(companyId: number): FinancialHealthReport;
  
  // Risk Detection
  detectLiquidityRisk(ratios: FinancialRatios): RiskAssessment;
  detectConcentrationRisk(companyId: number): RiskAssessment;
  detectCreditRisk(customerId: number): RiskAssessment;
  
  // Trend Analysis
  analyzeCashFlowTrends(companyId: number, months: number): TrendAnalysis;
  analyzeMarginTrends(companyId: number, months: number): TrendAnalysis;
  
  // Predictions
  predictCashShortfall(companyId: number, days: number): CashFlowPrediction;
}

interface FinancialHealthReport {
  overallScore: number; // 0-100
  ratios: FinancialRatios;
  risks: RiskAssessment[];
  recommendations: string[];
  trends: TrendAnalysis[];
}

interface FinancialRatios {
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
  grossMargin: number;
  netMargin: number;
  returnOnAssets: number;
  daysReceivable: number;
  daysPayable: number;
  inventoryTurnover: number;
}

interface RiskAssessment {
  riskType: 'liquidity' | 'concentration' | 'credit' | 'operational';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  indicators: string[];
  recommendations: string[];
}
```

**Risk Thresholds:**
- Current Ratio < 1.5 → Liquidity risk
- Single customer > 20% revenue → Concentration risk
- Gross Margin < 30% → Profitability risk
- Days Receivable > 60 → Collection risk
- Inventory Turnover < industry average → Inventory risk

### 7. ConversationMemory (NEW)

**Purpose**: Mantiene contexto conversacional y memoria de sesión.

**Interface:**
```typescript
interface ConversationMemory {
  // Context Management
  saveMessage(userId: number, message: Message): void;
  getConversationHistory(userId: number, limit?: number): Message[];
  clearContext(userId: number): void;
  
  // Context Resolution
  resolvePronouns(message: string, context: ConversationContext): string;
  extractEntitiesFromContext(context: ConversationContext): Entity[];
  
  // Preference Tracking
  trackPreference(userId: number, preference: UserPreference): void;
  getPreferences(userId: number): UserPreferences;
  
  // Search
  searchConversations(userId: number, query: string): Conversation[];
  getConversationsByDate(userId: number, date: Date): Conversation[];
}

interface Message {
  id: string;
  userId: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  entities: Entity[];
  intent?: string;
}

interface Entity {
  type: 'customer' | 'invoice' | 'product' | 'account' | 'date' | 'amount';
  value: string;
  confidence: number;
}
```

**Context Retention:**
- Store last 50 messages per session
- Persist conversations for 30 days
- Extract and track entities mentioned
- Track user preferences expressed
- Support pronoun resolution

## Data Models

### Alert Data Model

```typescript
interface AlertData {
  id: string;
  userId: number;
  companyId: number;
  type: AlertType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedEntities: {
    type: string;
    id: string;
    name: string;
  }[];
  suggestedActions: string[];
  metadata: {
    source: string;
    detectionMethod: string;
    confidence: number;
  };
  status: 'active' | 'resolved' | 'dismissed';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: {
    method: string;
    notes: string;
    resolvedBy: number;
  };
}

type AlertType = 
  | 'accounting_imbalance'
  | 'unusual_transaction'
  | 'duplicate_transaction'
  | 'tax_calculation_error'
  | 'compliance_deadline'
  | 'ar_overdue'
  | 'liquidity_risk'
  | 'concentration_risk'
  | 'budget_variance'
  | 'data_quality';
```

### Knowledge Entry Data Model

```typescript
interface KnowledgeEntry {
  id: string;
  key: string;
  type: 'concept' | 'procedure' | 'regulation' | 'tax_rule';
  category: string;
  content: {
    es: TranslatedContent;
    en: TranslatedContent;
  };
  metadata: {
    source: string;
    lastUpdated: Date;
    updatedBy: number;
    version: number;
    approvalStatus: 'draft' | 'approved' | 'archived';
  };
  searchKeywords: {
    es: string[];
    en: string[];
  };
  relatedEntries: string[];
}
```

### Conversation Data Model

```typescript
interface ConversationData {
  id: string;
  userId: number;
  sessionId: string;
  messages: Message[];
  context: {
    currentModule?: string;
    entities: Entity[];
    preferences: UserPreferences;
  };
  startTime: Date;
  endTime?: Date;
  metadata: {
    messageCount: number;
    queriesProcessed: number;
    alertsGenerated: number;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundancies Eliminated:**
- Properties 1.1 and 1.3 both check data completeness for counties → Combined into Property 1
- Properties 1.2 and 1.5 both check correctness of county information → Combined into Property 2
- Properties 4.2 and 4.3 both deal with alert deduplication → Combined into Property 8
- Properties 7.2, 7.3, and 7.4 all test context retention → Combined into Property 14

**Properties Consolidated:**
- All validation properties (6.1-6.7) share the same core mechanism → Grouped as Properties 11-13
- All risk analysis properties (8.1-8.7) use the same analysis engine → Grouped as Properties 15-16

This reduces the total from 70+ potential properties to 18 focused, non-redundant properties.

### Property 1: Complete County Coverage
*For any* Florida county name (from the list of 67 counties), querying the Knowledge_Base should return complete tax rate information including state rate, surtax, total rate, and regulations.

**Validates: Requirements 1.1, 1.3**

### Property 2: Accurate County Information
*For any* Florida county, when a user queries about that county, the AI_Assistant should provide tax rate information that matches the official Florida Department of Revenue rates.

**Validates: Requirements 1.2, 1.5**

### Property 3: Tax Rate Update Notifications
*For any* tax rate update that affects a user's configured counties, the System should generate a notification to that user within 24 hours of the update.

**Validates: Requirements 1.4**

### Property 4: Expanded Accounting Knowledge
*For any* query about accounting concepts, the Knowledge_Base should contain at least 50 distinct accounting concepts covering US GAAP principles, and the AI_Assistant should provide definition, examples, and applicable regulations for each.

**Validates: Requirements 2.1, 2.4**

### Property 5: Real-Time Transaction Analysis
*For any* transaction created in the system, the Proactive_Monitor should analyze it within 1 second and detect any violations of double-entry bookkeeping rules.

**Validates: Requirements 3.1, 3.2**

### Property 6: Anomaly Detection
*For any* unusual transaction pattern (amount >3 standard deviations from mean, duplicate transaction, or unusual timing), the Proactive_Monitor should generate an alert with details about the anomaly.

**Validates: Requirements 3.3**

### Property 7: Financial Ratio Monitoring
*For any* company, when financial ratios are calculated daily and any ratio exceeds its threshold (e.g., current ratio < 1.5), the Proactive_Monitor should generate an appropriately prioritized alert.

**Validates: Requirements 3.4, 3.5, 3.6, 3.7**

### Property 8: Alert Deduplication and Grouping
*For any* set of alerts generated within a 24-hour period, the Alert_System should suppress exact duplicates and group related alerts (same type, same entity, or within 1-hour window) into a single notification.

**Validates: Requirements 4.2, 4.3**

### Property 9: Alert Prioritization
*For any* alert generated, the Alert_System should correctly categorize it into one of four priority levels (critical, high, medium, low) based on severity and impact, and critical alerts should be displayed prominently in the UI immediately.

**Validates: Requirements 4.1, 4.4**

### Property 10: Alert History Persistence
*For any* alert generated, the Alert_System should maintain a permanent record with timestamp, resolution status, and resolution method (if resolved) that can be retrieved from history.

**Validates: Requirements 4.5, 4.7**

### Property 11: GAAP Validation
*For any* accounting entry, when submitted, the PredictiveValidator should validate it against GAAP rules in real-time and prevent submission if it would cause an imbalance (debits ≠ credits).

**Validates: Requirements 6.1, 6.2**

### Property 12: Duplicate Transaction Detection
*For any* transaction being created, the PredictiveValidator should detect if a potential duplicate exists (same amount, same date, same accounts within 24 hours) and alert the user before saving.

**Validates: Requirements 6.3**

### Property 13: Required Field Validation
*For any* data entry form, the PredictiveValidator should validate that all required fields are complete and in the correct format before allowing submission.

**Validates: Requirements 6.5**

### Property 14: Conversation Context Retention
*For any* user session, the AI_Assistant should maintain conversation context including previous messages, entities mentioned, and user preferences, and should correctly resolve pronoun references and follow-up questions based on this context.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 15: Financial Risk Detection
*For any* company, when key financial ratios are calculated, the RiskAnalyzer should detect and alert about risks when thresholds are exceeded: current ratio < 1.5 (liquidity), single customer > 20% revenue (concentration), gross margin < 30% (profitability), or AR > 60 days (collection).

**Validates: Requirements 8.2, 8.3, 8.4, 8.5, 8.7**

### Property 16: Module-Specific Contextual Assistance
*For any* module the user is currently using, the AI_Assistant should provide module-specific guidance and suggestions relevant to that module's functionality and data model.

**Validates: Requirements 9.2, 9.3, 9.5, 9.6, 9.7**

### Property 17: Knowledge Versioning
*For any* knowledge entry update, the System should create a new version, log the change with timestamp and user, and ensure the AI_Assistant uses the most current approved version for all queries.

**Validates: Requirements 10.3, 10.4, 10.5**

### Property 18: Critical Knowledge Update Notifications
*For any* critical knowledge update (tax rates, regulations, compliance deadlines), the System should notify all affected users within 24 hours of the update being approved.

**Validates: Requirements 10.7**

## Error Handling

### Error Categories

**1. Knowledge Base Errors**
- Missing county information → Fallback to state-level information + log gap
- Concept not found → Suggest similar concepts + offer to add to knowledge base
- Outdated information → Display warning + last update date

**2. Monitoring Errors**
- Transaction analysis failure → Log error + continue monitoring other transactions
- Ratio calculation error (missing data) → Alert user about incomplete data
- Alert generation failure → Log error + retry once

**3. Validation Errors**
- GAAP rule engine failure → Allow submission with warning + manual review flag
- Duplicate detection failure → Proceed with warning
- Tax calculation error → Block submission + suggest manual review

**4. Context Errors**
- Conversation context lost → Start fresh context + notify user
- Pronoun resolution failure → Ask for clarification
- Entity extraction error → Proceed without entity context

### Error Recovery Strategies

**Graceful Degradation:**
- If proactive monitoring fails, system continues to function reactively
- If knowledge base is incomplete, provide partial information + indicate gaps
- If validation fails, allow manual override with warning

**Retry Logic:**
- Alert generation: Retry once after 5 seconds
- Knowledge base queries: Retry with broader search
- Transaction analysis: Skip and log for batch processing

**User Communication:**
- Clear error messages in user's language (ES/EN)
- Suggest alternative actions when errors occur
- Provide contact information for persistent errors

## Testing Strategy

### Dual Testing Approach

This system requires both **unit tests** and **property-based tests** for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of county data (Miami-Dade, Broward, Orange)
- Edge cases (empty inputs, invalid data, boundary values)
- Integration points between components
- Error conditions and recovery

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Validation of correctness properties defined above

Both types of tests are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across all possible inputs.

### Property-Based Testing Configuration

**Framework**: fast-check (TypeScript/JavaScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `// Feature: ai-effectiveness, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import * as fc from 'fast-check';

// Feature: ai-effectiveness, Property 1: Complete County Coverage
test('Property 1: All 67 Florida counties have complete tax information', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...ALL_FLORIDA_COUNTIES),
      (countyName) => {
        const info = knowledgeBase.getCountyTaxRate(countyName);
        expect(info).toBeDefined();
        expect(info.stateTaxRate).toBe(0.06);
        expect(info.surtaxRate).toBeGreaterThanOrEqual(0);
        expect(info.totalRate).toBe(info.stateTaxRate + info.surtaxRate);
        expect(info.regulations).toBeDefined();
        expect(info.dr15Requirements).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Component-Level Tests**:
- Test each service independently with mocked dependencies
- Test error handling and edge cases
- Test integration between components

**Example Unit Test**:
```typescript
describe('AlertSystem', () => {
  it('should categorize critical alerts correctly', () => {
    const alert = alertSystem.createAlert({
      type: 'accounting_imbalance',
      description: 'Debits do not equal credits',
      affectedEntities: [{ type: 'entry', id: '123' }]
    });
    
    expect(alert.priority).toBe('critical');
  });
  
  it('should suppress duplicate alerts within 24 hours', () => {
    const alert1 = alertSystem.createAlert({ /* ... */ });
    const alert2 = alertSystem.createAlert({ /* same data */ });
    
    const activeAlerts = alertSystem.getAlerts(userId);
    expect(activeAlerts.length).toBe(1);
  });
});
```

### Integration Testing

**End-to-End Scenarios**:
1. User creates transaction → Monitor detects anomaly → Alert generated → User notified
2. User asks question → Context retrieved → Knowledge queried → Response generated
3. User enters invalid data → Validator catches error → Suggestion provided → User corrects

**Performance Testing**:
- Monitor should analyze transactions within 1 second
- Knowledge queries should return within 500ms
- Alert generation should complete within 2 seconds

### Test Coverage Goals

- Unit test coverage: >80% of code
- Property test coverage: 100% of correctness properties
- Integration test coverage: All critical user flows
- Error handling coverage: All error categories

---

**Design Version**: 1.0  
**Last Updated**: 2026-02-03  
**Status**: Ready for Implementation

