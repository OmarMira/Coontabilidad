---
name: double-entry-validator
description: Valida la integridad de la partida doble y la adherencia al Plan de Cuentas estándar US GAAP (1xxx-5xxx).
version: 1.0.0
---

# Double-Entry Validator Skill

Este skill actúa como el "guardián contable" del sistema. Su única responsabilidad es asegurar que ninguna transacción financiera (Journal Entry) se persista en la base de datos si viola la ecuación fundamental de la contabilidad.

## ⚠️ Reglas Críticas (Hard Constraints)

1. **Ecuación Fundamental**: Para *todo* asiento (`journal_entry_id`), la suma de débitos debe ser **exactamente igual** a la suma de créditos.
    * `SUM(debits) - SUM(credits) === 0`
    * Diferencia permitida: 0 (Cero). Cero centavos.
2. **Plan de Cuentas (US GAAP Standard)**:
    * **1xxx**: Activos (Assets) - Normal Débito
    * **2xxx**: Pasivos (Liabilities) - Normal Crédito
    * **3xxx**: Capital/Patrimonio (Equity) - Normal Crédito
    * **4xxx**: Ingresos (Revenue) - Normal Crédito
    * **5xxx**: Gastos (Expenses) - Normal Débito
    * **6xxx-9xxx**: Otros (si aplica).
3. **Atomocidad**: Un asiento contable (Header + Lines) debe guardarse en una sola transacción atómica.

## Flujo de Validación

Antes de `COMMIT` en `createJournalEntry`:

### Paso 1: Verificación de Estructura

* ¿Existen al menos 2 líneas? (No existe asiento de una sola pata).
* ¿Las cuentas existen y están activas en `chart_of_accounts`?

### Paso 2: Verificación Matemática (Partida Doble)

```typescript
let totalDebit = 0;
let totalCredit = 0;
for (line of lines) {
    totalDebit += line.debit; // Enteros (centavos)
    totalCredit += line.credit;
}
if (totalDebit !== totalCredit) {
    THROW "Accounting Equation Violation: Debits != Credits";
}
```

### Paso 3: Validación de Lógica de Negocio (Opcional/Avanzado)

* No permitir asientos directos contra cuentas de sistema bloqueadas (e.g., Retained Earnings auto-calculado) sin permisos especiales.

## Comandos Relacionados

* `validar contabilidad`: Escanea toda la tabla de `journal_entries` buscando desbalances históricos.
* `cerrar mes`: Valida que todo esté balanceado antes de generar asientos de cierre.

## Archivos Clave

* `src/database/simple-db.ts`: Tablas `journal_entries`, `journal_details`, `chart_of_accounts`.
