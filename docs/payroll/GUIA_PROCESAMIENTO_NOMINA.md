# 📋 Guía: Cómo Procesar Nómina

**Versión**: 1.0  
**Fecha**: Febrero 2026  
**Sistema**: ERP Contable - Módulo de Nómina

---

## 📌 Requisitos Previos

Antes de procesar nómina, asegúrate de tener:
- ✅ Empleados registrados en el sistema
- ✅ Información fiscal completa (SSN, Filing Status, Allowances)
- ✅ Tasas de pago configuradas (hourly_rate o salary)
- ✅ Período contable abierto

---

## 🔄 Proceso Completo de Nómina

### Paso 1: Verificar Información de Empleados

**Navegación**: Nómina > Gestión de Empleados

**Verificar que cada empleado tenga**:
- ✅ **SSN** (Social Security Number) - Requerido para impuestos
- ✅ **Filing Status** - Single, Married, Married Separate, o Head of Household
- ✅ **Allowances** - Número de deducciones personales (0-10)
- ✅ **Pay Type** - Hourly o Salaried
- ✅ **Pay Rate** - Tarifa por hora o salario anual

**Si falta información**:
1. Click en el empleado
2. Click en "Editar"
3. Completar campos faltantes
4. Click en "Guardar"

---

### Paso 2: Procesar Nómina Individual

**Navegación**: Nómina > Procesar Nómina

**Proceso**:

1. **Seleccionar Empleado**
   - Usar dropdown para seleccionar empleado
   - El sistema carga automáticamente su información

2. **Ingresar Período de Pago**
   - Pay Period Start: Fecha de inicio del período
   - Pay Period End: Fecha de fin del período
   - Pay Date: Fecha en que se pagará

3. **Ingresar Horas Trabajadas** (para empleados por hora)
   - Regular Hours: Horas normales (máx 40/semana)
   - Overtime Hours: Horas extras (pago 1.5x)

4. **Agregar Bonuses/Commissions** (opcional)
   - Bonuses: Bonos únicos
   - Commissions: Comisiones por ventas

5. **Click en "Calcular Preview"**
   - El sistema calcula automáticamente:
     - Gross Pay (pago bruto)
     - Taxes (FICA, Medicare, Federal)
     - Net Pay (pago neto)

6. **Revisar Cálculos**
   - Verificar que los montos sean correctos
   - Revisar desglose de impuestos
   - Confirmar net pay

7. **Click en "Aprobar y Procesar"**
   - El sistema:
     - Guarda el payroll con status "approved"
     - Genera asiento contable automático
     - Actualiza YTD totals del empleado

---

### Paso 3: Revisar Nóminas Procesadas

**Navegación**: Nómina > Revisar Nómina

**Funcionalidades**:


**Filtros Disponibles**:
- Por empleado
- Por rango de fechas
- Por status (draft, approved, paid, voided)

**Acciones**:
- **Ver Paystub**: Click en "Ver Paystub" para ver detalles completos
- **Void Payroll**: Anular una nómina (solo si no está en período cerrado)

**Información Mostrada**:
- Employee Name
- Pay Period
- Gross Pay
- Net Pay
- Status
- Pay Date

---

### Paso 4: Ver Paystub Detallado

**Desde**: Revisar Nómina > Click "Ver Paystub"

**Información en Paystub**:

**Earnings (Ingresos)**:
- Regular Pay: Horas normales × tarifa
- Overtime Pay: Horas extras × (tarifa × 1.5)
- Bonuses: Bonos adicionales
- Commissions: Comisiones
- **Gross Pay**: Total de ingresos

**Taxes (Impuestos)**:
- Social Security Tax: 6.2% (hasta wage base limit)
- Medicare Tax: 1.45%
- Additional Medicare: 0.9% (si aplica, >$200k)
- Federal Income Tax: Según brackets y filing status

**Deductions (Deducciones)**:
- Other Deductions: Deducciones adicionales
- **Total Deductions**: Suma de impuestos + deducciones

**Net Pay**: Gross Pay - Total Deductions

**YTD Totals** (Year-to-Date):
- YTD Gross Pay
- YTD Federal Tax
- YTD FICA
- YTD Medicare

---

## 💡 Consejos y Mejores Prácticas

### Frecuencia de Procesamiento
- **Biweekly** (quincenal): Más común, 26 períodos/año
- **Monthly** (mensual): 12 períodos/año
- **Weekly** (semanal): 52 períodos/año

### Validaciones Automáticas
El sistema valida automáticamente:
- ✅ SSN presente y válido
- ✅ Filing status configurado
- ✅ Pay rate > 0
- ✅ Horas regulares ≤ límite configurado
- ✅ Período contable abierto

### Cálculo de Overtime
- Horas extras se pagan a 1.5x la tarifa regular
- Solo aplica para empleados hourly
- Ejemplo: $20/hora → Overtime = $30/hora

### Límites de Impuestos 2026
- **Social Security**: 6.2% hasta $168,600 wage base
- **Medicare**: 1.45% sin límite
- **Additional Medicare**: 0.9% sobre $200,000 (single) o $250,000 (married)

---

## ⚠️ Errores Comunes y Soluciones

### Error: "Employee SSN is required"
**Solución**: Ir a Gestión de Empleados > Editar empleado > Agregar SSN

### Error: "Filing status not configured"
**Solución**: Ir a Gestión de Empleados > Editar empleado > Seleccionar Filing Status

### Error: "Period is closed"
**Solución**: No se puede procesar nómina en período cerrado. Contactar administrador para reabrir período si es necesario.

### Error: "Invalid pay rate"
**Solución**: Verificar que hourly_rate o salary sea mayor a 0

---

## 📊 Ejemplo Completo

**Empleado**: John Doe  
**Pay Type**: Hourly  
**Hourly Rate**: $25.00  
**Filing Status**: Single  
**Allowances**: 1

**Horas Trabajadas**:
- Regular Hours: 80 (2 semanas × 40 horas)
- Overtime Hours: 5

**Cálculos**:
- Regular Pay: 80 × $25 = $2,000.00
- Overtime Pay: 5 × ($25 × 1.5) = $187.50
- **Gross Pay**: $2,187.50

**Impuestos**:
- Social Security: $2,187.50 × 6.2% = $135.63
- Medicare: $2,187.50 × 1.45% = $31.72
- Federal Income Tax: ~$218.75 (según brackets)
- **Total Taxes**: $386.10

**Net Pay**: $2,187.50 - $386.10 = **$1,801.40**

---

## 🔗 Recursos Adicionales

- **Guía de Reportes IRS**: Ver `GUIA_REPORTES_IRS.md`
- **Checklist de Cierre**: Ver `CHECKLIST_CIERRE_PERIODO.md`
- **IRS Tax Tables**: https://www.irs.gov/pub/irs-pdf/p15.pdf

---

**Última Actualización**: Febrero 2026  
**Soporte**: Contactar al administrador del sistema
