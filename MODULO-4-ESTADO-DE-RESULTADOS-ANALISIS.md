# Análisis y Planificación: Módulo 4 - Estado de Resultados (P&L)

## 1. Objetivo

Implementar el reporte de **Estado de Resultados** (Profit & Loss Statement) que permita visualizar la rentabilidad del negocio en un período específico. Este reporte es fundamental para la toma de decisiones y el cumplimiento fiscal.

## 2. Alcance Funcional

- **Selector de Período**: Flexibilidad para seleccionar mes, año o rango personalizado.
- **Estructura del Reporte**:
  - (+) **Ingresos Operacionales** (Cuentas 4xxx)
  - (-) **Costo de Ventas** (Cuentas 51xx)
  - (=) **Utilidad Bruta**
  - (-) **Gastos Operacionales** (Cuentas 52xx)
  - (=) **Utilidad Operativa**
  - (+/-) **Otros Ingresos/Gastos**
  - (=) **Utilidad Neta antes de Impuestos**
- **Validación Cruzada**: La utilidad neta debe coincidir con el cambio en el patrimonio (si se cerrara el periodo).
- **Exportación**: PDF profesional para presentación.

## 3. Especificación Técnica (Basada en Esquema Real)

### 3.1. Corrección de Esquema (Lecciones Aprendidas Módulo 3)

Utilizaremos estrictamente los nombres de columnas verificados en la base de datos real:

- Tabla `journal_details`: `debit_amount`, `credit_amount`, `journal_entry_id`, `account_code`.
- Tabla `chart_of_accounts`: `account_code`, `account_name`, `account_type`, `is_active`.

### 3.2. Lógica de Negocio (Backend - `simple-db.ts`)

Nueva función `getIncomeStatement(startDate: string, endDate: string)`:

```sql
SELECT 
    ca.account_type,
    ca.account_group_code, -- (Si existe, o inferir por prefijo)
    ca.account_code,
    ca.account_name,
    SUM(jd.credit_amount - jd.debit_amount) as net_balance -- Ingresos son Crédito normal
FROM chart_of_accounts ca
JOIN journal_details jd ON ca.account_code = jd.account_code
JOIN journal_entries je ON jd.journal_entry_id = je.id
WHERE 
    ca.account_type IN ('revenue', 'expense') 
    AND je.entry_date BETWEEN ? AND ?
GROUP BY ca.account_type, ca.account_code
```

*Nota*: Para cuentas de **Ingresos** (`revenue`), el saldo positivo es `Crédito - Débito`. Para **Gastos** (`expense`), el saldo positivo es `Débito - Crédito`. La query deberá manejar este signo o hacerlo en JS.

### 3.3. Interfaz de Usuario (Frontend)

Nuevo componente: `src/components/accounting/IncomeStatement.tsx`

- Reutilizar estilos de `TrialBalanceReport`.
- Secciones colapsables para Ingresos y Gastos.
- Resaltado visual de la Utilidad Neta (Verde si ganancia, Rojo si pérdida).

## 4. Plan de Implementación

1. **Backend**: Implementar `getIncomeStatement` en `simple-db.ts`.
2. **Frontend**: Crear componente visual en React.
3. **Integración**: Conectar frontend con backend.
4. **Testing**:
    - Verificar con los datos de prueba generados en Módulo 3 (Venta de $3,000 + Gasto de impuestos).
    - Verificar cálculo: `Ingresos ($3,000) - Gastos ($0 conocidos, quizás impuestos) = Utilidad`.

## 5. Criterios de Aceptación

- [ ] Muestra Ingresos y Gastos separados correctamente.
- [ ] Calcula Utilidad Bruta y Neta con precisión.
- [ ] Coincide matemáticamente con los asientos ingresados.
- [ ] Exporta a PDF.
