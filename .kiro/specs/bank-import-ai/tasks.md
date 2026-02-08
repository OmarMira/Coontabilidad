# Implementation Plan: Importación Bancaria con IA

**Fecha**: 7 de febrero de 2026  
**Versión**: 1.0  
**Tiempo Estimado**: 3-4 días (24-32 horas)

---

## Overview

Este plan implementa un sistema inteligente de importación bancaria que parsea archivos (CSV, OFX, QFX), categoriza transacciones con IA, detecta duplicados, y vincula con facturas/gastos. El sistema aprende continuamente de las correcciones del usuario.

**Orden de Implementación**:
1. Base de datos y modelos
2. File parsers (CSV, OFX, QFX)
3. Duplicate detector
4. AI categorizer (ML model)
5. Transaction matcher
6. Import orchestrator
7. UI wizard
8. Testing y validación

---

## Tasks

- [ ] 1. Configurar estructura de base de datos
  - Crear tabla `import_batches`
  - Crear tabla `import_transactions_temp`
  - Crear tabla `ml_training_data`
  - Crear tabla `ml_metrics`
  - Crear índices necesarios
  - _Requirements: 9.1, 8.1_

- [ ] 2. Implementar FileParserService
  - [ ] 2.1 Implementar detección automática de formato
    - Detectar CSV por delimitadores
    - Detectar OFX/QFX por XML tags
    - Retornar formato detectado
    - _Requirements: 1.6_

  - [ ] 2.2 Implementar CSV parser
    - Detectar delimiter (comma, semicolon, tab)
    - Detectar header row automáticamente
    - Mapear columnas a campos (date, description, amount, balance)
    - Parsear fechas en múltiples formatos
    - Parsear montos con diferentes separadores
    - Manejar caracteres especiales
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.7_

  - [ ]* 2.3 Escribir unit tests para CSV parser
    - Probar con archivos reales de bancos (Chase, Bank of America, Wells Fargo)
    - Probar diferentes formatos de fecha
    - Probar diferentes separadores de monto
    - _Requirements: 2.1-2.7_

  - [ ] 2.4 Implementar OFX parser
    - Parsear XML de OFX
    - Extraer transacciones (STMTTRN elements)
    - Mapear campos OFX a campos internos
    - _Requirements: 1.2, 2.3_

  - [ ] 2.5 Implementar QFX parser
    - Parsear XML de QFX (similar a OFX)
    - Extraer transacciones
    - Mapear campos QFX a campos internos
    - _Requirements: 1.3, 2.3_

  - [ ]* 2.6 Escribir unit tests para OFX/QFX parsers
    - Probar con archivos reales de bancos
    - Verificar extracción correcta de campos
    - _Requirements: 1.2, 1.3, 2.3_

  - [ ] 2.7 Implementar validaciones de archivo
    - Validar tamaño ≤ 10MB
    - Validar formato soportado
    - Mostrar errores claros
    - _Requirements: 1.4, 1.5, 1.7_

  - [ ]* 2.8 Escribir property test para file size validation
    - **Property 1: File Size Validation**
    - **Validates: Requirements 1.4**

- [ ] 3. Checkpoint - Validar parsers
  - Asegurar que todos los tests pasen
  - Probar con archivos reales de múltiples bancos
  - Verificar manejo de errores
  - Preguntar al usuario si hay dudas

- [ ] 4. Implementar DuplicateDetector
  - [ ] 4.1 Implementar exact matching
    - Comparar date (exact)
    - Comparar amount (exact)
    - Comparar description (exact)
    - Retornar 100% confidence si match
    - _Requirements: 3.2_

  - [ ]* 4.2 Escribir property test para exact matching
    - **Property 2: Duplicate Detection - Exact Match**
    - **Validates: Requirements 3.2**

  - [ ] 4.3 Implementar fuzzy matching
    - Comparar date (±3 days)
    - Comparar amount (exact)
    - Comparar description (Jaccard similarity > 70%)
    - Calcular confidence score (0-100)
    - _Requirements: 3.3, 3.4_

  - [ ]* 4.4 Escribir property tests para fuzzy matching
    - **Property 3: Duplicate Detection - Fuzzy Match**
    - **Property 4: Duplicate Confidence Score Range**
    - **Validates: Requirements 3.3, 3.4**

  - [ ] 4.5 Implementar threshold logic
    - Marcar como "probable duplicate" si confidence > 80%
    - _Requirements: 3.5_

  - [ ]* 4.6 Escribir property test para threshold
    - **Property 5: Duplicate Threshold**
    - **Validates: Requirements 3.5**

  - [ ] 4.7 Implementar batch duplicate detection
    - Procesar múltiples transacciones eficientemente
    - Usar índices de base de datos
    - _Requirements: 3.1_

  - [ ]* 4.8 Escribir unit tests para duplicate detection
    - Probar con transacciones idénticas
    - Probar con transacciones similares
    - Probar con transacciones diferentes
    - _Requirements: 3.1-3.5_

- [ ] 5. Checkpoint - Validar duplicate detection
  - Asegurar que todos los tests pasen
  - Verificar precisión > 95%
  - Verificar performance con 1000 transacciones
  - Preguntar al usuario si hay dudas

- [ ] 6. Implementar AICategorizerService
  - [ ] 6.1 Implementar feature extraction
    - Tokenizar description (lowercase, remove stopwords)
    - Extraer amount range (< $50, $50-$500, > $500)
    - Extraer transaction type (debit/credit)
    - _Requirements: 4.1_

  - [ ] 6.2 Implementar Naive Bayes classifier
    - Calcular P(category | features) para todas las categorías
    - Retornar categoría con mayor probabilidad
    - Calcular confidence score (probabilidad × 100)
    - _Requirements: 4.2, 4.3_

  - [ ]* 6.3 Escribir property test para confidence range
    - **Property 6: AI Categorization Confidence Range**
    - **Validates: Requirements 4.3**

  - [ ] 6.4 Implementar auto-selection logic
    - Auto-seleccionar si confidence > 70%
    - _Requirements: 4.4_

  - [ ]* 6.5 Escribir property test para auto-selection
    - **Property 7: Auto-Selection Threshold**
    - **Validates: Requirements 4.4**

  - [ ] 6.6 Implementar training data management
    - Cargar training data de base de datos
    - Agregar nuevos ejemplos
    - Retrain model
    - _Requirements: 8.1_

  - [ ]* 6.7 Escribir property test para training data persistence
    - **Property 17: Training Data Persistence**
    - **Validates: Requirements 8.1**

  - [ ] 6.8 Implementar batch categorization
    - Procesar múltiples transacciones eficientemente
    - Cachear predicciones para descripciones similares
    - _Requirements: 4.1_

  - [ ]* 6.9 Escribir unit tests para AI categorizer
    - Probar con descripciones conocidas
    - Verificar accuracy con test set
    - Probar retraining
    - _Requirements: 4.1-4.4, 8.1_

- [ ] 7. Checkpoint - Validar AI categorizer
  - Asegurar que todos los tests pasen
  - Verificar accuracy > 80% con training data
  - Verificar performance con 1000 transacciones
  - Preguntar al usuario si hay dudas

- [ ] 8. Implementar TransactionMatcher
  - [ ] 8.1 Implementar invoice matching (para débitos)
    - Buscar facturas no pagadas
    - Comparar amount (exact o ±1%)
    - Comparar date (±7 days)
    - Calcular confidence score
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

  - [ ]* 8.2 Escribir property tests para matching
    - **Property 8: Amount Matching Tolerance**
    - **Property 9: Date Matching Window**
    - **Property 10: Match Confidence Calculation**
    - **Validates: Requirements 5.3, 5.4, 5.5**

  - [ ] 8.3 Implementar bill matching (para créditos)
    - Buscar gastos no pagados
    - Misma lógica que invoice matching
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ] 8.4 Implementar threshold logic
    - Sugerir match si confidence > 80%
    - _Requirements: 5.6_

  - [ ]* 8.5 Escribir property test para match threshold
    - **Property 11: Match Confidence Threshold**
    - **Validates: Requirements 5.6**

  - [ ]* 8.6 Escribir unit tests para transaction matcher
    - Probar con facturas/gastos conocidos
    - Probar diferentes tolerancias de monto
    - Probar diferentes offsets de fecha
    - _Requirements: 5.1-5.6_

- [ ] 9. Checkpoint - Validar transaction matcher
  - Asegurar que todos los tests pasen
  - Verificar recall > 70% (encuentra la mayoría de matches)
  - Verificar precision > 80% (pocos falsos positivos)
  - Preguntar al usuario si hay dudas

- [ ] 10. Implementar BankImportService (orchestrator)
  - [ ] 10.1 Implementar upload y creación de batch
    - Validar archivo
    - Crear registro en import_batches
    - Guardar archivo temporalmente
    - _Requirements: 1.1-1.7_

  - [ ] 10.2 Implementar generación de preview
    - Parsear archivo
    - Detectar duplicados
    - Categorizar con IA
    - Buscar matches
    - Guardar en import_transactions_temp
    - Retornar preview completo
    - _Requirements: 2.1-2.7, 3.1-3.5, 4.1-4.4, 5.1-5.6, 6.1-6.7_

  - [ ] 10.3 Implementar importación final
    - Aplicar ediciones del usuario
    - Crear bank_transactions
    - Generar journal entries
    - Actualizar batch status
    - Eliminar archivo temporal
    - _Requirements: 7.1, 7.2_

  - [ ]* 10.4 Escribir property tests para import
    - **Property 12: Transaction Creation**
    - **Property 13: Journal Entry Generation**
    - **Property 14: Balanced Journal Entries**
    - **Property 15: Journal Entry Linkage**
    - **Validates: Requirements 7.1, 7.2, 7.5, 7.6**

  - [ ] 10.5 Implementar validación de período contable
    - Verificar que período esté abierto
    - Rechazar import si período cerrado
    - _Requirements: 7.7_

  - [ ]* 10.6 Escribir property test para period validation
    - **Property 16: Open Period Validation**
    - **Validates: Requirements 7.7**

  - [ ] 10.7 Implementar rollback
    - Eliminar todas las transacciones del batch
    - Eliminar todos los journal entries del batch
    - Actualizar batch status a 'rolled_back'
    - Crear audit log entry
    - _Requirements: 9.1-9.6_

  - [ ]* 10.8 Escribir property tests para rollback
    - **Property 18: Batch Tracking**
    - **Property 19: Rollback Completeness**
    - **Property 20: Rollback Period Validation**
    - **Property 21: Rollback Audit Logging**
    - **Validates: Requirements 9.1-9.6**

  - [ ]* 10.9 Escribir unit tests para import service
    - Probar flujo completo end-to-end
    - Probar rollback
    - Probar error handling
    - _Requirements: 1.1-12.5_

- [ ] 11. Checkpoint - Validar import service
  - Asegurar que todos los tests pasen
  - Probar flujo completo con archivo real
  - Verificar journal entries balancean
  - Verificar rollback funciona
  - Preguntar al usuario si hay dudas

- [ ] 12. Implementar UI de importación
  - [ ] 12.1 Crear BankImportWizard.tsx
    - Paso 1: Upload de archivo
    - Paso 2: Preview de transacciones
    - Paso 3: Edición de categorías/matches
    - Paso 4: Confirmación e importación
    - Mostrar progress indicator
    - _Requirements: 1.1-1.7, 6.1-6.7_

  - [ ] 12.2 Crear TransactionPreview.tsx
    - Tabla de transacciones con todas las columnas
    - Highlight de duplicados (rojo)
    - Highlight de low-confidence (amarillo)
    - Edición inline de categorías
    - Edición inline de descripciones
    - Checkbox para excluir transacciones
    - _Requirements: 6.1-6.7_

  - [ ] 12.3 Crear ImportHistory.tsx
    - Lista de import batches
    - Filtros por fecha, status
    - Detalle de cada batch
    - Botón para rollback (si período abierto)
    - _Requirements: 9.1-9.7, 11.1-11.6_

  - [ ] 12.4 Agregar rutas en App.tsx y Sidebar
    - Ruta /banking/import
    - Ruta /banking/import-history
    - Agregar sección "Banking" en Sidebar

- [ ] 13. Implementar aprendizaje continuo
  - [ ] 13.1 Implementar captura de correcciones
    - Cuando usuario cambia categoría, guardar en ml_training_data
    - Marcar como source='user_correction'
    - _Requirements: 8.1_

  - [ ] 13.2 Implementar retraining automático
    - Trigger: Cada 10 correcciones o semanalmente
    - Recargar training data
    - Retrain Naive Bayes model
    - Guardar métricas en ml_metrics
    - _Requirements: 8.2, 8.3_

  - [ ] 13.3 Crear dashboard de métricas de ML
    - Mostrar accuracy over time
    - Mostrar precision/recall
    - Mostrar total training examples
    - Mostrar confusion matrix
    - _Requirements: 8.4, 8.5, 11.1-11.6_

- [ ] 14. Testing exhaustivo y validación final
  - [ ]* 14.1 Ejecutar todos los property tests (21 properties)
    - Verificar que todos pasen con 100 iteraciones
    - Documentar cualquier fallo

  - [ ]* 14.2 Ejecutar todos los unit tests
    - Verificar parsers con archivos reales
    - Verificar duplicate detection
    - Verificar AI categorization
    - Verificar transaction matching
    - Verificar import flow

  - [ ] 14.3 Testing de integración end-to-end
    - Upload archivo real
    - Verificar preview correcto
    - Editar categorías
    - Importar
    - Verificar transacciones creadas
    - Verificar journal entries
    - Rollback
    - Verificar todo eliminado

  - [ ] 14.4 Testing de ML accuracy
    - Usar 80% de datos históricos para training
    - Usar 20% para testing
    - Medir accuracy, precision, recall
    - Target: > 80% accuracy

  - [ ] 14.5 Testing de performance
    - Parse 1000 transactions: < 5 segundos
    - Detect duplicates: < 2 segundos
    - Categorize 1000 transactions: < 10 segundos
    - Import 1000 transactions: < 30 segundos

- [ ] 15. Checkpoint final - Revisión completa
  - Todos los tests pasan (unit + property + integration)
  - ML accuracy > 80% con training data
  - Performance cumple con targets
  - UI es intuitiva y fácil de usar
  - Documentación completa
  - Preguntar al usuario si está listo para producción

- [ ] 16. Actualizar documentación
  - Actualizar PROGRESO_IMPLEMENTACION.md
  - Marcar Fase 5 como completada
  - Actualizar completitud del sistema (98% → 100%)
  - Crear documento de resumen de implementación
  - Documentar decisiones técnicas importantes

---

## Notes

### Tareas Opcionales (marcadas con *)
- Las tareas marcadas con `*` son tests y pueden ser opcionales para un MVP rápido
- Sin embargo, para un sistema de importación bancaria, se recomienda implementar todos los tests
- Los datos bancarios son sensibles y requieren validación exhaustiva

### Orden de Prioridad
1. **ALTA**: File parsers (tareas 2.x) - Core functionality
2. **ALTA**: Duplicate detector (tareas 4.x) - Prevenir errores
3. **MEDIA**: AI categorizer (tareas 6.x) - Nice to have, puede ser manual
4. **MEDIA**: Transaction matcher (tareas 8.x) - Automatización
5. **ALTA**: Import service (tareas 10.x) - Core functionality
6. **MEDIA**: UI (tareas 12.x) - Usabilidad
7. **BAJA**: ML learning (tareas 13.x) - Mejora continua

### Librerías Recomendadas
- **CSV Parsing**: `csv-parse` o `papaparse`
- **OFX/QFX Parsing**: `ofx-js` o custom XML parser
- **ML**: `ml.js` (JavaScript) o `scikit-learn` (Python via API)
- **String Similarity**: `string-similarity` o custom Jaccard
- **File Upload**: `react-dropzone`

### Riesgos
- **Medio**: Variaciones en formatos de archivos bancarios → Probar con múltiples bancos
- **Bajo**: ML accuracy insuficiente → Permitir categorización manual
- **Bajo**: Performance con archivos grandes → Usar streaming parsing

---

## Success Criteria

- [ ] Soporta CSV, OFX, QFX correctamente
- [ ] Detección de duplicados > 95% precisión
- [ ] Categorización automática > 80% precisión (con training data)
- [ ] Matching con facturas > 70% recall
- [ ] Tiempo de procesamiento < 5 segundos para 1000 transacciones
- [ ] Usuario puede corregir todas las sugerencias
- [ ] Aprendizaje mejora precisión con el tiempo
- [ ] Sin errores de importación
- [ ] Rollback funciona correctamente
- [ ] Sin errores TypeScript

---

**Total Tasks**: 16 main tasks, 50+ sub-tasks  
**Estimated Time**: 3-4 days (24-32 hours)  
**Complexity**: ⭐⭐⭐⭐☆ (High)  
**Priority**: Low (can be postponed for post-launch)

