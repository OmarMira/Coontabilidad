---
name: generar-dr15
description: Usa este skill cuando el usuario pida calcular impuestos de Florida, generar el reporte DR-15 o validar tasas por condado.
---

# Generar Reporte Fiscal DR-15

Este skill permite generar el reporte mensual de impuestos sobre ventas para el estado de Florida (Formulario DR-15).

## Pasos

1. **Validar Tasas de Impuesto**:
   - Verificar que la tabla `florida_tax_rates` esté poblada.
   - Confirmar las tasas por condado (Surax) vigentes.

2. **Calcular Ventas del Periodo**:
   - Consultar todas las facturas (`invoices`) dentro del rango de fechas especificado.
   - Separar ventas gravables de ventas exentas.
   - Identificar el condado de cada venta (basado en la dirección del cliente o la configuración de envío).

3. **Generar Estructura DR-15**:
   - Calcular el impuesto base estatal (6%).
   - Calcular la sobretasa discrecional del condado (Discretionary Sales Surtax).
   - Sumarizar totales por columna del formulario DR-15.
   - Calcular créditos o penalidades si aplican.

4. **Persistencia y Reporte**:
   - Guardar el reporte generado en `florida_tax_reports`.
   - Guardar el detalle por condados en `florida_tax_report_counties`.
   - Utilizar `src/modules/dr15/DR15Generator.ts` para la lógica de negocio.

## Comandos Relacionados

- Consultar tabla `florida_tax_rates`.
- Ejecutar función `generateDR15Report(period)`.
