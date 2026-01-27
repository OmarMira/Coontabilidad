---
name: generar-dr15
description: Usa esta skill cuando el usuario quiera generar el reporte fiscal DR-15, calcular impuestos de Florida o validar tasas por condado.
---

# Generar Reporte Fiscal DR-15 (Florida)

Esta skill permite generar el formulario DR-15 para la declaración de impuestos sobre las ventas en Florida. Utiliza los servicios internos del sistema para calcular las obligaciones tributarias basadas en las facturas y recibos registrados.

## Instrucciones de Uso

1. **Identificar el Periodo Fiscal**:
    - Determina el mes y año solicitado por el usuario (ej. "Enero 2024").
    - Si no se especifica, asume el mes actual o pregunta al usuario.

2. **Ejecutar Cálculo de Impuestos**:
    - Utiliza el módulo de reportes fiscales para agregar las ventas imponibles y exentas.
    - Archivos clave a consultar:
      - `src/modules/tax/FloridaTaxCalculator.ts` (Cálculo de tasas por condado)
      - `src/services/TaxReportingService.ts` (Generación de reportes)

3. **Generar Documento**:
    - Invoca la generación del PDF.
    - El componente de UI relevante es `src/components/dr15/DR15PreparationWizard.tsx`.

4. **Validación**:
    - Verifica que las tasas aplicadas correspondan a los condados registrados (ej. Miami-Dade 7.0%).
    - Confirma que el `Total Tax Due` coincide con la suma de los desgloses.

## Comandos Relacionados

- Si necesitas verificar las tasas actuales, revisa `src/database/simple-db.ts` o la tabla `florida_tax_rates`.
