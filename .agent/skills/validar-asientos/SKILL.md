---
name: validar-asientos
description: Ejecuta validaciones de partida doble y consistencia contable en los asientos. Úsalo cuando el usuario pida verificar la integridad de la base de datos.
---

# Instrucciones

Este proceso asegura que la contabilidad del sistema mantenga la integridad referencial y el principio de partida doble.

1. **Validación de Partida Doble**:
   - Cada asiento debe tener al menos 2 líneas.
   - La suma de **Débitos** debe ser exactamente igual a la suma de **Créditos**.
   - Se permite una diferencia máxima de 0.01 por temas de redondeo.
   - Reporta cualquier ID de transacción que falle esta validación.

2. **Consistencia de Cuentas**:
   - Cada línea debe tener un débito O un crédito (no ambos).
   - Verifica que no existan cuentas duplicadas dentro del mismo asiento (genera advertencia si se encuentran).

3. **Balance de Comprobación**:
   - El sistema debe verificar el balance entre Activos, Pasivos y Patrimonio.
   - Fórmula: `Activos = Pasivos + Patrimonio`.
   - Utiliza la función `getTrialBalanceReport(year, month)` del motor de base de datos para extraer los saldos actuales.

# Referencias Técnicas

- **Validador Lógico**: `src/services/accounting/DoubleEntryValidator.ts`
- **Reportes**: `src/components/accounting/TrialBalanceReport.tsx`
- **Consultas SQL**: `src/database/simple-db.ts`
