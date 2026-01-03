# Diagnóstico de Esquema Real (Run-Time)

Este documento registra la estructura real de la base de datos SQLite en tiempo de ejecución, detectada durante la implementación del Módulo 3. Existe una discrepancia entre las migraciones iniciales (`001_initial_schema.ts`) y la base de datos actual.

## Tabla: `chart_of_accounts`

| Columna Real (Runtime) | Columna Migración (001) | Notas |
|-----------------------|-------------------------|-------|
| `account_code`        | `code`                  | Usado en JOINs y Queries |
| `account_name`        | `name`                  | |
| `is_active`           | `active`                | |

## Tabla: `journal_details`

| Columna Real (Runtime) | Columna Migración (001) | Notas |
|-----------------------|-------------------------|-------|
| `journal_entry_id`    | `journal_id`            | FK a journal_entries |
| `debit_amount`        | `debit`                 | Monto Débito |
| `credit_amount`       | `credit`                | Monto Crédito |
| `account_code`        | `account_code`          | Coincide |

## Tabla: `journal_entries`

| Columna Real (Runtime) | Columna Migración (001) | Notas |
|-----------------------|-------------------------|-------|
| `total_debit`         | `total` (singular)      | |
| `total_credit`        | -                       | |

## Acción Correctiva

Para futuras consultas SQL directas (fuera del ORM/Models), SE DEBE usar los nombres de columna "Real (Runtime)".
Se recomienda eventualmente crear una migración de alineación, pero por ahora se prioriza la estabilidad de los datos existentes.
