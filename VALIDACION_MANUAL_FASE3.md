# 📋 GUÍA DE VALIDACIÓN MANUAL - FASE 3 (IA PROACTIVA)

**Objetivo**: Validar manualmente todas las funcionalidades de IA Proactiva

---

## ✅ CHECKLIST DE VALIDACIÓN

### 1. INICIALIZACIÓN DE IA

#### Paso 1.1: Verificar Inicio Automático
- [ ] Abrir AccountExpress
- [ ] Abrir DevTools → Console
- [ ] Buscar mensaje: `"AI Anomaly Detector started successfully"`
- [ ] Verificar que no hay errores

**Resultado Esperado**: IA se inicia automáticamente sin errores

---

### 2. DETECCIÓN DE ASIENTOS DESCUADRADOS

#### Paso 2.1: Crear Asiento Descuadrado
- [ ] Ir a "Asientos Manuales"
- [ ] Crear asiento con:
  - Débito: $1,000.00
  - Crédito: $999.50
- [ ] Guardar asiento

#### Paso 2.2: Esperar Detección
- [ ] Esperar 1 hora (o ejecutar manualmente `AnomalyDetector.detectAll()` en console)
- [ ] Ir al Dashboard
- [ ] Verificar badge "Asistente Inteligente" muestra "1 Propuesta"

#### Paso 2.3: Revisar Propuesta
- [ ] Click en sección "Propuestas de la IA"
- [ ] Verificar propuesta muestra:
  - Módulo: "accounting"
  - Operación: "CORRECT_JOURNAL_ENTRY"
  - Razón: "Asiento descuadrado detectado"
  - Diferencia: $0.50
- [ ] Click en "✅ Aprobar"
- [ ] Verificar mensaje de éxito

**Resultado Esperado**: Asiento descuadrado detectado y propuesta creada

---

### 3. DETECCIÓN DE FACTURAS VENCIDAS

#### Paso 3.1: Crear Factura Vencida
- [ ] Ir a "Facturas"
- [ ] Crear factura con:
  - Fecha de vencimiento: 60 días atrás
  - Monto: $5,000.00
  - Estado: "sent"
- [ ] Guardar factura

#### Paso 3.2: Esperar Detección
- [ ] Ejecutar `AnomalyDetector.detectAll()` en console
- [ ] Ir al Dashboard
- [ ] Verificar badge muestra propuesta

#### Paso 3.3: Revisar Propuesta
- [ ] Abrir propuesta
- [ ] Verificar muestra:
  - Operación: "SEND_PAYMENT_REMINDER"
  - Días vencidos: ~60
  - Saldo pendiente: $5,000.00
- [ ] Click en "✅ Aprobar" o "❌ Rechazar"

**Resultado Esperado**: Factura vencida detectada correctamente

---

### 4. DETECCIÓN DE TRANSACCIONES DUPLICADAS

#### Paso 4.1: Crear Duplicados
- [ ] Ir a "Transacciones Bancarias"
- [ ] Crear 3 transacciones idénticas:
  - Fecha: Hoy
  - Descripción: "Pago a Proveedor XYZ"
  - Monto: $1,000.00
- [ ] Guardar todas

#### Paso 4.2: Esperar Detección
- [ ] Ejecutar `AnomalyDetector.detectAll()` en console
- [ ] Verificar propuesta creada

#### Paso 4.3: Revisar Propuesta
- [ ] Verificar muestra:
  - Operación: "REVIEW_DUPLICATES"
  - Cantidad: 3 transacciones
  - IDs de transacciones

**Resultado Esperado**: Duplicados detectados correctamente

---

### 5. DETECCIÓN DE GASTOS INUSUALES

#### Paso 5.1: Crear Historial Normal
- [ ] Ir a "Gastos"
- [ ] Crear 5 gastos en "Office Supplies":
  - $100, $120, $150, $180, $140
- [ ] Guardar todos

#### Paso 5.2: Crear Gasto Inusual
- [ ] Crear gasto en "Office Supplies":
  - Monto: $5,000.00 (33x el promedio)
- [ ] Guardar

#### Paso 5.3: Esperar Detección
- [ ] Ejecutar `AnomalyDetector.detectAll()` en console
- [ ] Verificar propuesta creada

#### Paso 5.4: Revisar Propuesta
- [ ] Verificar muestra:
  - Operación: "REVIEW_UNUSUAL_EXPENSE"
  - Monto: $5,000.00
  - Promedio: ~$138.00

**Resultado Esperado**: Gasto inusual detectado

---

### 6. DETECCIÓN DE SALDOS NEGATIVOS

#### Paso 6.1: Crear Saldo Negativo
- [ ] Ir a "Asientos Manuales"
- [ ] Crear asiento que deje cuenta "Cash" en negativo:
  - Débito: Gastos $1,000.00
  - Crédito: Cash $1,000.00
  - (Repetir hasta que Cash sea negativo)

#### Paso 6.2: Esperar Detección
- [ ] Ejecutar `AnomalyDetector.detectAll()` en console
- [ ] Verificar propuesta creada

#### Paso 6.3: Revisar Propuesta
- [ ] Verificar muestra:
  - Operación: "REVIEW_NEGATIVE_BALANCE"
  - Cuenta: "1010 - Cash"
  - Saldo negativo

**Resultado Esperado**: Saldo negativo detectado

---

### 7. AUTO-REFRESH DEL PANEL

#### Paso 7.1: Verificar Auto-Refresh
- [ ] Abrir Dashboard con propuestas pendientes
- [ ] Abrir otra tab de AccountExpress
- [ ] En la segunda tab, aprobar una propuesta
- [ ] Volver a la primera tab
- [ ] Esperar 30 segundos
- [ ] Verificar que el contador se actualiza automáticamente

**Resultado Esperado**: Panel se actualiza cada 30s sin recargar página

---

### 8. APROBAR PROPUESTA

#### Paso 8.1: Aprobar
- [ ] Abrir propuesta
- [ ] Click en "✅ Aprobar"
- [ ] Verificar confirmación: "¿Aprobar esta propuesta de la IA?"
- [ ] Click en "OK"
- [ ] Verificar mensaje: "✅ Propuesta aprobada y ejecutada"
- [ ] Verificar que propuesta desaparece de la lista

**Resultado Esperado**: Propuesta aprobada correctamente

---

### 9. RECHAZAR PROPUESTA

#### Paso 9.1: Rechazar
- [ ] Abrir propuesta
- [ ] Click en "❌ Rechazar"
- [ ] Verificar confirmación: "¿Rechazar esta propuesta?"
- [ ] Click en "OK"
- [ ] Verificar mensaje: "❌ Propuesta rechazada"
- [ ] Verificar que propuesta desaparece de la lista

**Resultado Esperado**: Propuesta rechazada correctamente

---

### 10. BADGE EN DASHBOARD

#### Paso 10.1: Sin Propuestas
- [ ] Aprobar/rechazar todas las propuestas
- [ ] Ir al Dashboard
- [ ] Verificar "Asistente Inteligente" muestra:
  - "Monitoreando tu contabilidad 24/7"
- [ ] Verificar que sección de propuestas NO se muestra

#### Paso 10.2: Con Propuestas
- [ ] Crear anomalía (ej: asiento descuadrado)
- [ ] Ejecutar `AnomalyDetector.detectAll()` en console
- [ ] Ir al Dashboard
- [ ] Verificar badge muestra:
  - Punto verde pulsante
  - "1 Propuesta" (o número correcto)
- [ ] Verificar que sección de propuestas SÍ se muestra

**Resultado Esperado**: Badge se actualiza dinámicamente

---

### 11. SCHEDULER AUTOMÁTICO

#### Paso 11.1: Verificar Scheduler
- [ ] Abrir DevTools → Console
- [ ] Ejecutar: `console.log('Scheduler test')`
- [ ] Crear anomalía
- [ ] Esperar 1 hora
- [ ] Verificar en console: "Escaneo completado"
- [ ] Verificar nueva propuesta en Dashboard

**Resultado Esperado**: Scheduler ejecuta cada hora automáticamente

---

### 12. MANEJO DE ERRORES

#### Paso 12.1: Error en Detección
- [ ] Simular error (ej: corromper DB temporalmente)
- [ ] Ejecutar `AnomalyDetector.detectAll()` en console
- [ ] Verificar en console: Error manejado gracefully
- [ ] Verificar que aplicación sigue funcionando

#### Paso 12.2: Error en Aprobación
- [ ] Simular error en aprobación
- [ ] Intentar aprobar propuesta
- [ ] Verificar mensaje de error apropiado
- [ ] Verificar que aplicación sigue funcionando

**Resultado Esperado**: Errores manejados sin crashear

---

### 13. PERFORMANCE

#### Paso 13.1: Detección Rápida
- [ ] Crear 100 asientos (50 descuadrados)
- [ ] Ejecutar `AnomalyDetector.detectAll()` en console
- [ ] Medir tiempo en console
- [ ] Verificar que toma <5 segundos

#### Paso 13.2: UI Responsive
- [ ] Con 10+ propuestas pendientes
- [ ] Abrir Dashboard
- [ ] Scroll por la página
- [ ] Click en diferentes propuestas
- [ ] Verificar que UI permanece responsive

**Resultado Esperado**: Performance aceptable

---

### 14. LOGGING

#### Paso 14.1: Verificar Logs
- [ ] Abrir DevTools → Console
- [ ] Ejecutar `AnomalyDetector.detectAll()` en console
- [ ] Verificar logs:
  - "Iniciando escaneo de anomalías"
  - "X asientos descuadrados detectados"
  - "Escaneo completado"
- [ ] Aprobar propuesta
- [ ] Verificar log: "Propuesta X aprobada"

**Resultado Esperado**: Logging completo y claro

---

## 📊 RESULTADOS DE VALIDACIÓN

### Resumen de Tests

| Test | Resultado | Notas |
|------|-----------|-------|
| 1. Inicialización | ⬜ PASS / ⬜ FAIL | |
| 2. Asientos Descuadrados | ⬜ PASS / ⬜ FAIL | |
| 3. Facturas Vencidas | ⬜ PASS / ⬜ FAIL | |
| 4. Duplicados | ⬜ PASS / ⬜ FAIL | |
| 5. Gastos Inusuales | ⬜ PASS / ⬜ FAIL | |
| 6. Saldos Negativos | ⬜ PASS / ⬜ FAIL | |
| 7. Auto-refresh | ⬜ PASS / ⬜ FAIL | |
| 8. Aprobar | ⬜ PASS / ⬜ FAIL | |
| 9. Rechazar | ⬜ PASS / ⬜ FAIL | |
| 10. Badge | ⬜ PASS / ⬜ FAIL | |
| 11. Scheduler | ⬜ PASS / ⬜ FAIL | |
| 12. Errores | ⬜ PASS / ⬜ FAIL | |
| 13. Performance | ⬜ PASS / ⬜ FAIL | |
| 14. Logging | ⬜ PASS / ⬜ FAIL | |

### Problemas Encontrados

```
[Documentar aquí cualquier problema encontrado]

Ejemplo:
- Test 3: Facturas vencidas no se detectan en Firefox
- Test 11: Scheduler no ejecuta en Safari
```

### Observaciones

```
[Agregar observaciones generales]

Ejemplo:
- Detección funciona perfectamente
- UI muy responsive
- Badge se actualiza correctamente
```

---

## 🎯 CRITERIOS DE ACEPTACIÓN

Para que Fase 3 se considere **100% COMPLETADA**, todos los tests deben pasar:

- [ ] ✅ Todos los tests manuales: **PASS**
- [ ] ✅ Todos los tests unitarios: **PASS** (ejecutar `npm test`)
- [ ] ✅ Detección de 5 tipos de anomalías funciona
- [ ] ✅ Propuestas se crean automáticamente
- [ ] ✅ Badge se actualiza correctamente
- [ ] ✅ Auto-refresh funciona
- [ ] ✅ Aprobar/rechazar funciona
- [ ] ✅ Scheduler ejecuta cada hora
- [ ] ✅ No hay errores en Console
- [ ] ✅ Performance aceptable (<5s detección)

---

## 📝 FIRMA DE VALIDACIÓN

**Validado por**: ___________________________  
**Fecha**: ___________________________  
**Resultado General**: ⬜ APROBADO / ⬜ RECHAZADO

**Comentarios**:
```
[Agregar comentarios finales]
```

---

**🎉 Si todos los tests pasan, Fase 3 está 100% COMPLETADA**
