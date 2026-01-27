---
name: generar-dr15
description: Usa este skill cuando el usuario quiera generar, calcular o validar el reporte de impuestos de Florida (DR-15) para un periodo específico.
---

# Instrucciones

Este módulo permite la generación completa del reporte de impuestos sobre las ventas de Florida (DR-15). Sigue estos pasos para procesar el reporte:

1. **Selección del Periodo**:
   - El sistema debe recibir el mes y año (ej: "Enero 2026").
   - Los datos se cargan desde las tablas de transacciones fiscales.

2. **Cálculo de Totales**:
   - Calcula **Gross Sales** (Ventas Brutas).
   - Calcula **Taxable Sales** (Ventas Gravables).
   - Calcula el **Tax Collected** (Impuesto Recaudado).
   - Realiza un desglose por condado (County Breakdown) usando las tasas dinámicas (6.0%, 6.5%, 7.0%, etc.).

3. **Validación de Cumplimiento (DOR Compliance)**:
   - Verifica que el FEIN de la empresa esté registrado.
   - Valida que las sumas matemáticas coincidan con el desglose por condado.
   - Genera un **Hash de Auditoría SHA-256** para integridad.

4. **Generación de PDF**:
   - Usa el método `dr15PDFGenerator.downloadPDF(data, companyData)` para generar el archivo final.
   - El PDF debe incluir el encabezado oficial del Florida Department of Revenue y el desglose detallado.

# Referencias Técnicas

- **Generador PDF**: `src/modules/dr15/DR15PDFGenerator.ts`
- **UI de Tabla**: `src/components/dr15/CountyBreakdownTable.tsx`
- **Validaciones**: `src/components/dr15/DORComplianceChecklist.tsx`
