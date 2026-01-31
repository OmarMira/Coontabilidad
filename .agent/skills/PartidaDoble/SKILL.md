---
name: PartidaDoble
description: Valida la integridad de la partida doble y busca discrepancias en los asientos contables.
version: 1.0.0
---

# PartidaDoble Skill

**Propósito**: Asegurar que cada transacción cumpla con la regla fundamental de la contabilidad: Débitos = Créditos. Previene la persistencia de datos corruptos o descuadrados.

## Capacidades

- **Validación en Tiempo Real**: Comprueba el balance antes de la inserción en base de datos.
- **Detección de Errores de Redondeo**: Maneja precisiones decimales para asegurar balances perfectos.

## Uso

### Reglas de Validación

- Mínimo 2 líneas por asiento.
- Error si la diferencia entre Débito y Crédito es > 0.001.
