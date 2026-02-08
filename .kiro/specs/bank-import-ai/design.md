# Design Document: Importación Bancaria con IA

**Fecha**: 7 de febrero de 2026  
**Versión**: 1.0  
**Estado**: Draft

---

## Overview

El sistema de Importación Bancaria con IA permite a los usuarios importar transacciones bancarias desde archivos (CSV, OFX, QFX), categorizarlas automáticamente usando machine learning, detectar duplicados, y vincularlas con facturas/gastos existentes. El sistema aprende continuamente de las correcciones del usuario para mejorar la precisión.

### Key Design Principles

1. **User Control**: Usuario siempre revisa y aprueba antes de importar
2. **Privacy First**: No enviar datos a servicios externos
3. **Continuous Learning**: Mejorar con cada corrección del usuario
4. **Robust Parsing**: Manejar variaciones en formatos de archivos
5. **Performance**: Procesar miles de transacciones rápidamente

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Bank Import AI System                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Presentation Layer                     │  │
│  │  - BankImportWizard.tsx (wizard de importación)          │  │
│  │  - TransactionPreview.tsx (preview y edición)            │  │
│  │  - ImportHistory.tsx (historial)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │                    Business Logic Layer                   │  │
│  │  - BankImportService.ts (orchestrator)                    │  │
│  │  - FileParserService.ts (CSV/OFX/QFX parsing)            │  │
│  │  - DuplicateDetector.ts (fuzzy matching)                 │  │
│  │  - AICategorizerService.ts (ML categorization)           │  │
│  │  - TransactionMatcher.ts (invoice/bill matching)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐  │
│  │                      Data Layer                           │  │
│  │  - ImportBatchService.ts (CRUD de batches)                │  │
│  │  - MLTrainingService.ts (training data management)        │  │
│  │  - simple-db.ts (base de datos SQLite)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### 1. FileParserService.ts

**Purpose**: Parsear archivos CSV, OFX, QFX y extraer transacciones

**Interface**:
```typescript
interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  balance?: number;
  type: 'debit' | 'credit';
  rawData: any;
}

interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: string[];
  format: 'csv' | 'ofx' | 'qfx';
}

class FileParserService {
  detectFormat(file: File): Promise<'csv' | 'ofx' | 'qfx' | 'unknown'>;
  parseCSV(file: File): Promise<ParseResult>;
  parseOFX(file: File): Promise<ParseResult>;
  parseQFX(file: File): Promise<ParseResult>;
  parse(file: File): Promise<ParseResult>;
}
```

**CSV Parsing Strategy**:
- Detect delimiter (comma, semicolon, tab)
- Detect header row automatically
- Map columns to fields using common patterns:
  - Date: "date", "fecha", "transaction date", "posted date"
  - Description: "description", "descripcion", "memo", "payee"
  - Amount: "amount", "monto", "debit", "credit"
  - Balance: "balance", "saldo", "running balance"

---

### 2. AICategorizerService.ts

**Purpose**: Categorizar transacciones usando machine learning

**Interface**:
```typescript
interface CategorizationSuggestion {
  categoryId: number;
  categoryName: string;
  confidence: number; // 0-100
  reasoning: string;
}

interface TrainingExample {
  description: string;
  amount: number;
  categoryId: number;
}

class AICategorizerService {
  categorize(transaction: ParsedTransaction): Promise<CategorizationSuggestion>;
  categorizeBatch(transactions: ParsedTransaction[]): Promise<CategorizationSuggestion[]>;
  addTrainingExample(example: TrainingExample): Promise<void>;
  retrain(): Promise<void>;
  getAccuracy(): Promise<number>;
}
```

**ML Algorithm**:
```
Algorithm: Naive Bayes Classifier (simple and effective)

Features:
- Description keywords (tokenized, lowercased)
- Amount range (< $50, $50-$500, > $500)
- Transaction type (debit/credit)

Training:
- Use historical transactions with assigned categories
- Extract features from each transaction
- Calculate probabilities: P(category | features)

Prediction:
- Extract features from new transaction
- Calculate P(category | features) for all categories
- Return category with highest probability
- Confidence = probability of top category

Continuous Learning:
- When user corrects a category, add to training data
- Retrain model weekly (or after N corrections)
- Track accuracy over time
```

---

### 3. DuplicateDetector.ts

**Purpose**: Detectar transacciones duplicadas

**Interface**:
```typescript
interface DuplicateMatch {
  existingTransactionId: number;
  confidence: number; // 0-100
  reason: string;
}

class DuplicateDetector {
  findDuplicates(transaction: ParsedTransaction): Promise<DuplicateMatch[]>;
  findDuplicatesBatch(transactions: ParsedTransaction[]): Promise<Map<number, DuplicateMatch[]>>;
}
```

**Duplicate Detection Algorithm**:
```
1. Exact Match (100% confidence):
   - Same date (exact)
   - Same amount (exact)
   - Same description (exact)

2. Fuzzy Match (70-95% confidence):
   - Date within ±3 days (score: 30 points)
   - Amount exact (score: 50 points)
   - Description similarity > 70% (score: 20 points)
   - Total score = confidence

3. Similarity Calculation:
   - Tokenize descriptions
   - Calculate Jaccard similarity (common words / total words)
   - Adjust for common words ("payment", "transfer", etc.)
```

---

### 4. TransactionMatcher.ts

**Purpose**: Vincular transacciones con facturas/gastos

**Interface**:
```typescript
interface TransactionMatch {
  type: 'invoice' | 'bill';
  id: number;
  confidence: number; // 0-100
  reason: string;
}

class TransactionMatcher {
  findMatches(transaction: ParsedTransaction): Promise<TransactionMatch[]>;
  findMatchesBatch(transactions: ParsedTransaction[]): Promise<Map<number, TransactionMatch[]>>;
}
```

**Matching Algorithm**:
```
For Debit Transactions (money out):
1. Search unpaid invoices
2. Match by amount (exact or within 1% tolerance)
3. Match by date (transaction date ± 7 days of invoice date)
4. Calculate confidence:
   - Exact amount + date within 3 days = 95%
   - Exact amount + date within 7 days = 85%
   - Amount within 1% + date within 3 days = 80%

For Credit Transactions (money in):
1. Search unpaid bills
2. Same matching logic as invoices
```

---

### 5. BankImportService.ts

**Purpose**: Orquestar el proceso completo de importación

**Interface**:
```typescript
interface ImportBatch {
  id: number;
  fileName: string;
  fileFormat: string;
  uploadedAt: string;
  processedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rolled_back';
  totalTransactions: number;
  importedTransactions: number;
  duplicatesSkipped: number;
  userId: number;
}

interface ImportPreview {
  transactions: ParsedTransaction[];
  suggestions: CategorizationSuggestion[];
  duplicates: Map<number, DuplicateMatch[]>;
  matches: Map<number, TransactionMatch[]>;
}

class BankImportService {
  uploadFile(file: File): Promise<ImportBatch>;
  generatePreview(batchId: number): Promise<ImportPreview>;
  importBatch(batchId: number, userEdits: Map<number, any>): Promise<Result>;
  rollbackBatch(batchId: number): Promise<Result>;
  getImportHistory(): Promise<ImportBatch[]>;
}
```

**Import Flow**:
```
1. Upload file → Create import batch
2. Parse file → Extract transactions
3. Detect duplicates → Mark probable duplicates
4. Categorize → AI suggests categories
5. Match → Find invoice/bill matches
6. Generate preview → Show to user
7. User edits → Apply corrections
8. Import → Create transactions + journal entries
9. Learn → Add corrections to training data
```

---

## Data Models

### Database Schema

```sql
-- Tabla de batches de importación
CREATE TABLE IF NOT EXISTS import_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL CHECK(file_format IN('csv', 'ofx', 'qfx')),
  file_size INTEGER NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending', 'processing', 'completed', 'failed', 'rolled_back')),
  total_transactions INTEGER DEFAULT 0,
  imported_transactions INTEGER DEFAULT 0,
  duplicates_skipped INTEGER DEFAULT 0,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de transacciones importadas (temporal, antes de confirmar)
CREATE TABLE IF NOT EXISTS import_transactions_temp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES import_batches(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  balance REAL,
  type TEXT NOT NULL CHECK(type IN('debit', 'credit')),
  suggested_category_id INTEGER REFERENCES accounts(id),
  confidence_score REAL,
  is_duplicate BOOLEAN DEFAULT 0,
  duplicate_of INTEGER REFERENCES bank_transactions(id),
  matched_invoice_id INTEGER REFERENCES invoices(id),
  matched_bill_id INTEGER REFERENCES bills(id),
  user_edited BOOLEAN DEFAULT 0,
  final_category_id INTEGER REFERENCES accounts(id),
  raw_data TEXT
);

-- Tabla de training data para ML
CREATE TABLE IF NOT EXISTS ml_training_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN('debit', 'credit')),
  category_id INTEGER NOT NULL REFERENCES accounts(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'user_correction' CHECK(source IN('historical', 'user_correction'))
);

CREATE INDEX IF NOT EXISTS idx_training_description ON ml_training_data(description);
CREATE INDEX IF NOT EXISTS idx_training_category ON ml_training_data(category_id);

-- Tabla de métricas de ML
CREATE TABLE IF NOT EXISTS ml_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_date DATE NOT NULL,
  accuracy REAL NOT NULL,
  precision_score REAL,
  recall_score REAL,
  total_predictions INTEGER NOT NULL,
  correct_predictions INTEGER NOT NULL,
  training_examples INTEGER NOT NULL
);
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: File Size Validation
*For any* uploaded file, if the file size exceeds 10MB, the upload should be rejected with a clear error message.
**Validates: Requirements 1.4**

### Property 2: Duplicate Detection - Exact Match
*For any* transaction, if there exists an existing transaction with the same date, amount, and description, it should be detected as an exact duplicate with 100% confidence.
**Validates: Requirements 3.2**

### Property 3: Duplicate Detection - Fuzzy Match
*For any* transaction, if there exists an existing transaction with similar date (±3 days), same amount, and similar description (>70% similarity), it should be detected as a fuzzy duplicate with confidence 70-95%.
**Validates: Requirements 3.3**

### Property 4: Duplicate Confidence Score Range
*For any* duplicate detection, the confidence score should be between 0 and 100 (inclusive).
**Validates: Requirements 3.4**

### Property 5: Duplicate Threshold
*For any* potential duplicate with confidence > 80%, it should be marked as "probable duplicate".
**Validates: Requirements 3.5**

### Property 6: AI Categorization Confidence Range
*For any* categorization suggestion, the confidence score should be between 0 and 100 (inclusive).
**Validates: Requirements 4.3**

### Property 7: Auto-Selection Threshold
*For any* categorization suggestion with confidence > 70%, the category should be auto-selected.
**Validates: Requirements 4.4**

### Property 8: Amount Matching Tolerance
*For any* transaction matching, if the amount difference is ≤ 1% of the invoice/bill amount, it should be considered a match.
**Validates: Requirements 5.3**

### Property 9: Date Matching Window
*For any* transaction matching, if the transaction date is within ±7 days of the invoice/bill date, it should be considered a potential match.
**Validates: Requirements 5.4**

### Property 10: Match Confidence Calculation
*For any* transaction match, the confidence score should be calculated based on amount exactness and date proximity.
**Validates: Requirements 5.5**

### Property 11: Match Confidence Threshold
*For any* transaction match with confidence > 80%, it should be suggested to the user.
**Validates: Requirements 5.6**

### Property 12: Transaction Creation
*For any* import batch, all non-duplicate transactions should be created in the database after user approval.
**Validates: Requirements 7.1**

### Property 13: Journal Entry Generation
*For any* imported transaction, a corresponding journal entry should be generated.
**Validates: Requirements 7.2**

### Property 14: Balanced Journal Entries
*For any* journal entry generated from import, the sum of debits should equal the sum of credits.
**Validates: Requirements 7.5**

### Property 15: Journal Entry Linkage
*For any* imported transaction, there should exist a corresponding journal entry linked via foreign key.
**Validates: Requirements 7.6**

### Property 16: Open Period Validation
*For any* import attempt, if the transaction date falls within a closed accounting period, the import should be rejected.
**Validates: Requirements 7.7**

### Property 17: Training Data Persistence
*For any* user correction of a category suggestion, the correction should be saved as training data in the database.
**Validates: Requirements 8.1**

### Property 18: Batch Tracking
*For any* imported transaction, it should have a batch_id linking it to the import batch.
**Validates: Requirements 9.1**

### Property 19: Rollback Completeness
*For any* rollback operation, all transactions and journal entries from that batch should be deleted.
**Validates: Requirements 9.2, 9.3, 9.4**

### Property 20: Rollback Period Validation
*For any* rollback attempt, if the accounting period is closed, the rollback should be rejected.
**Validates: Requirements 9.5**

### Property 21: Rollback Audit Logging
*For any* rollback operation, an audit log entry should be created with timestamp, user, and batch details.
**Validates: Requirements 9.6**

---

## Error Handling

### File Upload Errors

**Error Type**: `FILE_TOO_LARGE`
- **Trigger**: File size > 10MB
- **Response**: "File size exceeds 10MB limit. Please split into smaller files."
- **HTTP Status**: 400 Bad Request

**Error Type**: `UNSUPPORTED_FORMAT`
- **Trigger**: File format not CSV/OFX/QFX
- **Response**: "Unsupported file format. Please upload CSV, OFX, or QFX files."
- **HTTP Status**: 400 Bad Request

**Error Type**: `CORRUPTED_FILE`
- **Trigger**: File cannot be parsed
- **Response**: "File appears to be corrupted or in an unexpected format."
- **HTTP Status**: 400 Bad Request

### Parsing Errors

**Error Type**: `MISSING_REQUIRED_COLUMNS`
- **Trigger**: CSV missing date, description, or amount columns
- **Response**: "File is missing required columns: [column names]"
- **HTTP Status**: 400 Bad Request

**Error Type**: `INVALID_DATE_FORMAT`
- **Trigger**: Date cannot be parsed
- **Response**: "Invalid date format on line [N]. Expected MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD."
- **HTTP Status**: 400 Bad Request

**Error Type**: `INVALID_AMOUNT_FORMAT`
- **Trigger**: Amount cannot be parsed as number
- **Response**: "Invalid amount format on line [N]. Expected numeric value."
- **HTTP Status**: 400 Bad Request

### Business Logic Errors

**Error Type**: `PERIOD_CLOSED`
- **Trigger**: Attempting to import transactions in closed period
- **Response**: "Cannot import: accounting period is closed for [date range]"
- **HTTP Status**: 403 Forbidden

**Error Type**: `BATCH_NOT_FOUND`
- **Trigger**: Import batch ID does not exist
- **Response**: "Import batch not found"
- **HTTP Status**: 404 Not Found

**Error Type**: `ROLLBACK_NOT_ALLOWED`
- **Trigger**: Attempting to rollback batch in closed period
- **Response**: "Cannot rollback: accounting period is closed"
- **HTTP Status**: 403 Forbidden

### ML/AI Errors

**Error Type**: `CATEGORIZATION_FAILED`
- **Trigger**: ML model fails to categorize
- **Response**: Log error, return "uncategorized" with 0% confidence
- **HTTP Status**: 200 OK (graceful degradation)

**Error Type**: `MODEL_NOT_TRAINED`
- **Trigger**: ML model has insufficient training data
- **Response**: "AI categorization unavailable. Please categorize manually to build training data."
- **HTTP Status**: 200 OK (graceful degradation)

---

## Testing Strategy

### Dual Testing Approach

- **Unit Tests**: Verify parsing, duplicate detection, matching algorithms
- **Property Tests**: Verify universal properties across all inputs (minimum 100 iterations each)

### Unit Testing

**Focus Areas**:
1. **File Parsing**: Test with real bank files (CSV, OFX, QFX)
2. **Duplicate Detection**: Test exact and fuzzy matching
3. **AI Categorization**: Test with known descriptions
4. **Transaction Matching**: Test with various amounts and dates
5. **Error Handling**: Test all error conditions

**Example Unit Tests**:
```typescript
describe('FileParserService', () => {
  it('should parse Chase Bank CSV correctly', async () => {
    const file = loadTestFile('chase_statement.csv');
    const result = await parser.parseCSV(file);
    expect(result.success).toBe(true);
    expect(result.transactions.length).toBe(25);
    expect(result.transactions[0].date).toBe('2026-01-15');
  });

  it('should detect duplicate with exact match', async () => {
    const transaction = {
      date: '2026-01-15',
      description: 'Amazon Purchase',
      amount: 49.99,
      type: 'debit'
    };
    const duplicates = await detector.findDuplicates(transaction);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].confidence).toBe(100);
  });
});
```

### Property-Based Testing

**Configuration**:
- Minimum 100 iterations per property test
- Use `fast-check` library for TypeScript
- Tag each test with feature name and property number

**Property Test Examples**:
```typescript
import fc from 'fast-check';

describe('Bank Import AI - Property Tests', () => {
  /**
   * Feature: bank-import-ai, Property 4: Duplicate Confidence Score Range
   * For any duplicate detection, confidence should be 0-100
   */
  it('should always return confidence scores in valid range', () => {
    fc.assert(
      fc.property(
        fc.record({
          date: fc.date(),
          description: fc.string(),
          amount: fc.float({ min: 0.01, max: 10000 }),
          type: fc.constantFrom('debit', 'credit')
        }),
        async (transaction) => {
          const duplicates = await detector.findDuplicates(transaction);
          for (const dup of duplicates) {
            expect(dup.confidence).toBeGreaterThanOrEqual(0);
            expect(dup.confidence).toBeLessThanOrEqual(100);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: bank-import-ai, Property 14: Balanced Journal Entries
   * For any import, journal entries should balance
   */
  it('should generate balanced journal entries', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          date: fc.date(),
          description: fc.string(),
          amount: fc.float({ min: 0.01, max: 10000 }),
          type: fc.constantFrom('debit', 'credit'),
          categoryId: fc.integer({ min: 1, max: 100 })
        })),
        async (transactions) => {
          const batchId = await importService.createBatch(transactions);
          await importService.importBatch(batchId, new Map());
          
          const journalEntries = await getJournalEntriesByBatch(batchId);
          for (const entry of journalEntries) {
            const totalDebits = entry.items
              .filter(item => item.type === 'debit')
              .reduce((sum, item) => sum + item.amount, 0);
            const totalCredits = entry.items
              .filter(item => item.type === 'credit')
              .reduce((sum, item) => sum + item.amount, 0);
            
            expect(totalDebits).toBeCloseTo(totalCredits, 2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Test Scenarios**:
1. **End-to-End Import**: Upload file → Parse → Categorize → Import → Verify
2. **Duplicate Detection**: Import same file twice → Verify duplicates detected
3. **Rollback**: Import → Rollback → Verify all deleted
4. **Learning**: Import → Correct categories → Retrain → Verify improved accuracy

### ML Model Testing

**Accuracy Metrics**:
- **Precision**: % of correct predictions among all predictions
- **Recall**: % of correct predictions among all actual categories
- **F1 Score**: Harmonic mean of precision and recall
- **Confusion Matrix**: Detailed breakdown of predictions vs actuals

**Testing Strategy**:
- Split historical data: 80% training, 20% testing
- Measure accuracy on test set
- Track accuracy over time as model learns
- Target: > 80% accuracy after 100 training examples

---

## Performance Considerations

### Optimization Strategies

1. **Streaming Parsing**: Parse large files in chunks to avoid memory issues
2. **Batch Processing**: Process multiple transactions in single database transaction
3. **Caching**: Cache ML model predictions for similar descriptions
4. **Indexing**: Database indexes on date, amount, description for duplicate detection
5. **Lazy Loading**: Load transaction details only when needed

### Performance Targets

- Parse 1000 transactions: < 5 seconds
- Detect duplicates: < 2 seconds
- Categorize 1000 transactions: < 10 seconds
- Import 1000 transactions: < 30 seconds
- Rollback batch: < 5 seconds

---

## Security Considerations

### Data Protection

1. **Encryption in Transit**: HTTPS for file uploads
2. **Encryption at Rest**: Encrypt sensitive fields (account numbers)
3. **Temporary Files**: Delete uploaded files after processing
4. **Access Control**: Restrict import functionality to authorized users

### Privacy Compliance

- **GDPR**: Right to deletion, data portability
- **CCPA**: Disclosure of data collection, opt-out
- **No External Services**: All processing done locally, no data sent to third parties

---

## Maintenance and Updates

### ML Model Maintenance

**Retraining Schedule**:
- Automatic retraining: Weekly (if > 10 new training examples)
- Manual retraining: On-demand via admin panel
- Model versioning: Keep last 3 versions for rollback

**Monitoring**:
- Track accuracy metrics over time
- Alert if accuracy drops below threshold (< 70%)
- Review misclassifications monthly

### File Format Updates

**Process**:
- Monitor for new bank file formats
- Add parsers for new formats as needed
- Test with real bank files
- Document format specifications

---

## Future Enhancements

### Phase 2 (Post-Launch)

1. **Direct Bank API**: Connect with Plaid/Yodlee for automatic imports
2. **OCR Support**: Extract transactions from scanned statements
3. **Advanced ML**: Use deep learning for better categorization
4. **Multi-Currency**: Support international transactions
5. **Scheduled Imports**: Automatic daily/weekly imports

### Phase 3 (Advanced Features)

1. **Automatic Reconciliation**: Full reconciliation without user review
2. **Anomaly Detection**: Flag unusual transactions
3. **Predictive Analytics**: Forecast cash flow based on patterns
4. **Mobile App**: Import from mobile banking apps
5. **Blockchain Support**: Import crypto transactions

---

**Document Status**: Complete  
**Next Step**: Review design document, then create tasks.md  
**Estimated Implementation Time**: 3-4 days (24-32 horas)

