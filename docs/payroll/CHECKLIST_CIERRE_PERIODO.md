# ✅ Checklist: Cierre de Período Contable (con Nómina)

**Versión**: 1.0  
**Fecha**: Febrero 2026  
**Sistema**: ERP Contable

---

## 📋 Checklist Completo

### 🔵 ANTES DE CERRAR EL PERÍODO

#### 1. Transacciones Registradas
- [ ] Todas las facturas de venta están registradas
- [ ] Todas las facturas de compra están registradas
- [ ] Todos los gastos del período están en el sistema
- [ ] No hay transacciones en estado "borrador"
- [ ] Todos los asientos contables están balanceados

#### 2. Conciliación Bancaria
- [ ] Estado de cuenta bancario descargado
- [ ] Todas las transacciones bancarias conciliadas
- [ ] Cargos bancarios registrados
- [ ] Intereses registrados
- [ ] Saldo bancario = Saldo contable

#### 3. **NÓMINA** ⭐ (NUEVO)
- [ ] **Todas las nóminas del período están procesadas**
- [ ] **Todas las nóminas están en status "approved" o "paid"**
- [ ] **No hay nóminas pendientes de aprobar**
- [ ] **Asientos contables de nómina generados automáticamente**
- [ ] **Impuestos de nómina calculados correctamente**
- [ ] **YTD totals actualizados para todos los empleados**

#### 4. Ajustes Contables
- [ ] Depreciaciones del período calculadas
- [ ] Asientos de ajuste registrados
- [ ] Acumulaciones (accruals) registradas
- [ ] Diferimientos (deferrals) registrados
- [ ] Inventario reconciliado (si aplica)

#### 5. Balance de Comprobación
- [ ] Balance de comprobación generado
- [ ] Total débitos = Total créditos
- [ ] No hay cuentas desbalanceadas
- [ ] Todas las cuentas están correctamente clasificadas

---

### 🟢 DURANTE EL CIERRE

#### Paso 1: Abrir Wizard de Cierre
**Navegación**: Contabilidad > Cierres y Períodos

1. [ ] Seleccionar período a cerrar
2. [ ] Click en "Iniciar Cierre"
3. [ ] Se abre el Wizard de Cierre (6 pasos)

#### Paso 2: Validación de Transacciones (Paso 1/6)
- [ ] Revisar facturas registradas
- [ ] Revisar gastos registrados
- [ ] Confirmar que no hay transacciones pendientes
- [ ] Verificar que asientos están balanceados
- [ ] ✅ Status: PASSED o WARNING
- [ ] Click en "Siguiente"

#### Paso 3: Conciliación Bancaria (Paso 2/6)
- [ ] Verificar conciliación completada
- [ ] Confirmar que no hay transacciones sin conciliar
- [ ] Validar que saldos coinciden
- [ ] ✅ Status: PASSED
- [ ] Click en "Siguiente"

#### Paso 4: **Validación de Nómina** (Paso 3/6) ⭐
- [ ] **Revisar resumen de nóminas procesadas**
- [ ] **Verificar tarjetas de estadísticas**:
  - [ ] Nóminas Procesadas: Total, Aprobadas, Pendientes
  - [ ] Pago Bruto Total y Neto
  - [ ] Impuestos Retenidos Totales
- [ ] **Revisar checklist de validaciones**:
  - [ ] ✅ Nóminas del período procesadas
  - [ ] ✅ No hay nóminas pendientes de aprobar
  - [ ] ✅ Asientos contables generados
  - [ ] ✅ Impuestos calculados correctamente
- [ ] **Si hay warnings**: Click en "Ir a Nóminas" para resolver
- [ ] ✅ Status: PASSED o WARNING (puede continuar)
- [ ] Click en "Siguiente"

#### Paso 5: Ajustes Contables (Paso 4/6)
- [ ] Verificar depreciaciones calculadas
- [ ] Confirmar asientos de ajuste registrados
- [ ] Validar acumulaciones
- [ ] Verificar inventario reconciliado
- [ ] ✅ Status: PASSED o WARNING
- [ ] Click en "Siguiente"

#### Paso 6: Balance de Comprobación (Paso 5/6)
- [ ] Revisar balance generado
- [ ] Confirmar débitos = créditos
- [ ] Verificar que no hay cuentas desbalanceadas
- [ ] Validar clasificación de cuentas
- [ ] ✅ Status: PASSED
- [ ] Click en "Siguiente"

#### Paso 7: Confirmación y Cierre (Paso 6/6)
- [ ] Revisar resumen completo
- [ ] Verificar todos los pasos en verde
- [ ] Leer advertencias (si las hay)
- [ ] Confirmar que deseas cerrar el período
- [ ] Click en "Cerrar Período"
- [ ] ✅ Período cerrado exitosamente

---

### 🔴 DESPUÉS DEL CIERRE

#### 1. Verificación Inmediata
- [ ] Verificar que período aparece como "Cerrado"
- [ ] Confirmar que no se pueden crear transacciones en período cerrado
- [ ] Revisar log de cierre en historial

#### 2. Generación de Reportes Financieros
- [ ] Balance General (Balance Sheet)
- [ ] Estado de Resultados (Income Statement)
- [ ] Estado de Flujo de Efectivo (Cash Flow Statement)
- [ ] Reporte de Variaciones Presupuestarias

#### 3. **Reportes de Nómina** ⭐ (Si aplica)

**Si es fin de Quarter (Q1, Q2, Q3, Q4)**:
- [ ] **Generar Form 941 (Quarterly Federal Tax Return)**
- [ ] Revisar montos calculados
- [ ] Descargar PDF
- [ ] Guardar en carpeta de reportes IRS
- [ ] Presentar al IRS antes del deadline

**Si es fin de Año Fiscal**:
- [ ] **Generar Form W-2 para CADA empleado**
  - [ ] Revisar información de cada empleado
  - [ ] Descargar PDF de cada W-2
  - [ ] Imprimir 3 copias por empleado
  - [ ] Entregar Copy B y C a empleados (antes del 31 de enero)
- [ ] **Generar Form W-3 (Transmittal Summary)**
  - [ ] Verificar suma de todas las W-2
  - [ ] Descargar PDF
  - [ ] Presentar al IRS junto con Copy A de todas las W-2 (antes del 31 de enero)

#### 4. Archivo y Backup
- [ ] Exportar reportes a PDF
- [ ] Guardar en carpeta organizada por período
- [ ] Crear backup de base de datos
- [ ] Almacenar en ubicación segura
- [ ] Mantener por 7 años (requerimiento legal)

#### 5. Comunicación
- [ ] Notificar a equipo contable que período está cerrado
- [ ] Informar a gerencia sobre resultados del período
- [ ] Compartir reportes con stakeholders
- [ ] Actualizar dashboard ejecutivo

---

## ⚠️ Situaciones Especiales

### Si el Wizard Muestra Errores (Status: ERROR)
**NO PUEDES CERRAR** hasta resolver:
1. Identificar el paso con error
2. Revisar mensaje de error específico
3. Corregir el problema
4. Volver a ejecutar validación
5. Continuar cuando status sea PASSED

### Si el Wizard Muestra Warnings (Status: WARNING)
**PUEDES CERRAR** pero se recomienda revisar:
- Warnings de nómina pendiente: Aprobar nóminas antes de cerrar
- Warnings de transacciones pendientes: Revisar si son del período
- Warnings de depreciaciones: Verificar si aplican al período

### Si Necesitas Reabrir un Período Cerrado
**Solo Administradores**:
1. Ir a Contabilidad > Cierres y Períodos
2. Seleccionar período cerrado
3. Click en "Reabrir Período"
4. Ingresar razón (se registra en log)
5. Confirmar reapertura
6. ⚠️ Esto se registra en auditoría

---

## 📊 Ejemplo de Timeline

### Cierre Mensual (Ejemplo: Enero 2026)

**1-31 Enero**: Operaciones normales
- Procesar nóminas quincenales (15 y 31 de enero)
- Registrar transacciones diarias

**1-5 Febrero**: Preparación
- Completar transacciones pendientes de enero
- Procesar última nómina de enero
- Realizar conciliación bancaria
- Calcular depreciaciones

**5-7 Febrero**: Cierre
- Ejecutar Wizard de Cierre
- Resolver warnings si los hay
- Cerrar período

**7-10 Febrero**: Post-Cierre
- Generar reportes financieros
- Revisar resultados
- Comunicar a stakeholders

**Si es Q1 (Fin de Marzo)**:
- **Antes del 30 de Abril**: Generar y presentar Form 941 Q1

**Si es Fin de Año (Diciembre)**:
- **Antes del 31 de Enero**: Generar W-2, W-3 y presentar al IRS

---

## 💡 Tips para un Cierre Exitoso

### Preparación
- Mantener transacciones al día durante todo el mes
- No dejar todo para el último día
- Procesar nóminas a tiempo (no esperar al cierre)

### Comunicación
- Avisar al equipo con anticipación sobre fecha de cierre
- Establecer deadline interno (antes del cierre oficial)
- Coordinar con departamentos para información pendiente

### Automatización
- Usar asientos recurrentes para gastos fijos
- Configurar depreciaciones automáticas
- Aprovechar generación automática de asientos de nómina

### Revisión
- Hacer mini-cierres semanales para detectar problemas temprano
- Revisar balance de comprobación antes del cierre oficial
- Validar nóminas inmediatamente después de procesarlas

---

## 📞 Soporte

### Si Tienes Problemas
1. Revisar esta guía completa
2. Consultar documentación técnica
3. Contactar al administrador del sistema
4. Si es tema fiscal: Consultar con CPA

### Recursos Adicionales
- **Guía de Procesamiento de Nómina**: `GUIA_PROCESAMIENTO_NOMINA.md`
- **Guía de Reportes IRS**: `GUIA_REPORTES_IRS.md`
- **Manual de Usuario**: Documentación completa del sistema

---

**Última Actualización**: Febrero 2026  
**Versión**: 1.0 - Incluye validación de nómina en wizard  
**Soporte**: Contactar al administrador del sistema
