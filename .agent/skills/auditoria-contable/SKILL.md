---
name: auditoria-contable
description: Valida la integridad de la partida doble y busca discrepancias en los asientos contables.
---

# Auditoría de Integridad Contable

Este skill ejecuta una validación profunda sobre el libro diario para asegurar el principio fundamental de contabilidad: **Partida Doble**.

## Reglas de Validación

El proceso debe verificar cada asiento contable (`JournalEntry`) contra las siguientes reglas:

1. **Balance Débito/Crédito**:
    - `SUM(Débitos) == SUM(Créditos)` (permitiendo tolerancia de 0.01).

2. **Estructura Mínima**:
    - Todo asiento debe tener **mínimo 2 líneas** (detalles).

3. **Consistencia de Línea**:
    - Una línea individual no puede tener montos en Débito Y Crédito simultáneamente.
    - Debe tener valor en al menos uno de los dos.

4. **Unicidad de Cuentas**:
    - No deben existir múltiples líneas para la misma cuenta (`account_code`) en un mismo asiento (deberían consolidarse).

## Ejecución

1. Obtener todos los asientos mediante `getJournalEntries()`.
2. Instanciar el validador: `DoubleEntryValidator`.
3. Invocar `DoubleEntryValidator.validateJournalEntry(entry)` para cada registro.
4. Generar un reporte con los IDs de asientos fallidos y el motivo del fallo.

## Referencias Código Fuente

- **Validador**: `src/services/accounting/DoubleEntryValidator.ts`
- **Tipos**: `JournalEntry`, `ValidationResult`.
