# MODELO CONTABLE OFICIAL - ACCOUNT EXPRESS

Este documento define la estructura y nomenclatura oficial para el motor contable del sistema. Cualquier desviación de este modelo debe ser tratada como un bug de integridad.

## 1. Tabla Oficial de Líneas: `journal_details`

Se ha determinado que **`journal_details`** es la ÚNICA tabla autorizada para registrar los movimientos de cargo y abono (asientos contables).

### Esquema de Columnas

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | INTEGER | Clave primaria. |
| `journal_entry_id` | TEXT (UUID) | ID del asiento principal (`journal_entries.id`). |
| `account_code` | TEXT | Código de la cuenta (Plan de Cuentas). |
| `debit_amount` | INTEGER | Monto débito en **enteros (centavos)**. |
| `credit_amount` | INTEGER | Monto crédito en **enteros (centavos)**. |
| `description` | TEXT | Descripción específica de la línea de movimiento. |
| `logic_clock` | INTEGER | Contador secuencial de integridad. |

---

## 2. Tablas Obsoletas (PROHIBIDAS)

Las siguientes tablas han sido deprectadas y eliminadas del motor lógico. **NO deben ser referenciadas en nuevos servicios ni en migraciones:**

- ❌ `ledger_lines` (Antiguo modelo de Fase 2)
- ❌ `journal_entry_lines` (Modelo temporal de reconstrucción)
- ❌ `company_info` (Reemplazada por `company_base_data`)

---

## 3. Reglas de Oro de Integridad

1. **Aritmética de Enteros**: Todos los valores de `debit_amount` y `credit_amount` deben ser tratados como enteros (centavos) para evitar errores de coma flotante.
2. **Reloj Lógico (`logic_clock`)**: Cada inserción en `journal_details` debe heredar el `logic_clock` generado por el `AccountingService`.
3. **Inmutabilidad**: Una vez que un asiento en `journal_entries` tiene estado `POSTED`, sus líneas en `journal_details` no pueden ser eliminadas ni modificadas.
4. **Balance Obligatorio**: Σ `debit_amount` = Σ `credit_amount` para cada `journal_entry_id`.

---

## 4. Servicios que implementan este modelo

- `src/services/accounting/AccountingService.ts`
- `src/modules/accounting/TrialBalanceService.ts`
- `src/services/audit/AuditChainService.ts`
