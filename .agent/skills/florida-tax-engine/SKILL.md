---
name: florida-tax-engine
description: Motor de cálculo fiscal para Florida Sales Tax y Discretionary Sales Surtax utilizando aritmética de enteros (centavos) para precisión financiera absoluta.
version: 1.0.0
---

# Florida Tax Engine Skill

Este skill encapsula la lógica para determinar y calcular los impuestos aplicables en el estado de Florida, manejando la tasa base estatal (6%) y los recargos discrecionales por condado (Surtax), estrictamente en CENTAVOS para evitar errores de punto flotante.

## ⚠️ Reglas Críticas (Hard Constraints)

1. **Aritmética Entera**: TODOS los montos monetarios deben tratarse como INTEGER (centavos).
    * $100.00 => 10000
    * Tasa 6% => 600 (puntos base) o un multiplicador entero manejado cuidadosamente.
    * Fórmula: `Impuesto = (Monto * TasaPuntosBase) / 10000` con redondeo `Math.round`.
2. **Prohibido Floats**: Bajo ninguna circunstancia utilizar tipos `float` o `double` para almacenamiento o cálculo.
3. **Persistencia**: Utilizar `wa-sqlite` (o la abstracción de base de datos actual) para consultar tasas vigentes.

## Tabla de Tasas (Referencia 2024-2025)

Las tasas se almacenan en `florida_tax_rates` como enteros (basis points) o decimales convertidos en el momento exacto de cálculo.

| Condado | Tasa Total | Surtax | Implementación (Basis Points) |
| :--- | :--- | :--- | :--- |
| Miami-Dade | 7.0% | 1.0% | 700 |
| Broward | 6.0% | 0.0% | 600 |
| Palm Beach | 7.0% | 1.0% | 700 |
| Hillsborough | 7.5% | 1.5% | 750 |
| Orange | 6.5% | 0.5% | 650 |

## Flujo de Ejecución

### 1. Determinar Condado y Tasa

Entrada: `zip_code` o `county_name`.
Salida: `total_rate_basis_points` (Integers).

```typescript
// Ejemplo conceptual
const STATE_RATE_BP = 600; // 6.00%
const countySurtaxBP = getCountySurtax(countyName); // e.g., 100 for Miami-Dade
const totalRateBP = STATE_RATE_BP + countySurtaxBP;
```

### 2. Calcular Impuesto (Sales Tax)

Entrada: `subtotal_cents` (Integer).

```typescript
function calculateTax(subtotalCents: number, rateBP: number): number {
    // (15000 * 700) / 10000 = 1050 cents ($10.50)
    return Math.round((subtotalCents * rateBP) / 10000);
}
```

### 3. Calcular Discretionary Tax Cap (Si aplica)

Florida aplica el surtax solo a los primeros $5,000 de una compra de propiedad tangible (item único).

* Lógica: Si `item_price > 500000`, el surtax aplica solo sobre 500000. El 6% estatal aplica sobre el total.

## Comandos Relacionados

* `calcular impuestos factura`: Invoca este motor para una invoice completa.
* `validar tasas miami`: Verifica que las tasas en DB coincidan con la tabla maestra.

## Archivos Clave

* `src/database/simple-db.ts`: Tablas `florida_tax_rates`, `invoices`.
