---
name: validar-contabilidad
description: Valida la integridad de la partida doble y busca asientos descuadrados en la base de datos.
---

# Auditoría Contable y Validación de Partida Doble

Esta skill se encarga de verificar la salud financiera del sistema, asegurando que todos los asientos contables cumplan con el principio fundamental: `Debe = Haber`.

## Procedimiento de Validación

1. **Escaneo de Asientos**:
    - Recorre la tabla `journal_entries` y sus detalles `journal_entry_details`.
    - Suma los débitos y créditos para cada `journal_entry_id`.

2. **Detección de Descuadres**:
    - Identifica cualquier asiento donde `|Total Debit - Total Credit| > 0.01`.
    - Reporta el ID del asiento, la fecha y el monto de la diferencia.

3. **Verificación de Huérfanos**:
    - Busca detalles de asientos que no tengan un encabezado válido en `journal_entries`.
    - Busca asientos sin detalles asociados.

4. **Corrección (Opcional)**:
    - Si se encuentran discrepancias menores (rounding errors), sugiere un asiento de ajuste automático.
    - Para discrepancias mayores, marca el asiento como "Requiere Revisión".

## Código Fuente

- `src/services/accounting/DoubleEntryValidator.ts` (Si existe)
- Alternativamente revisar la lógica en `src/database/simple-db.ts` relacionada con `JournalEntry`.

## Ejecución

Puede ser invocado desde la consola de diagnósticos o mediante el comando de voz/texto "Verificar integridad contable".
