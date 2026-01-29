---
name: audit-chain-integrity
description: Sistema de verificación y generación de cadenas de auditoría inmutable utilizando SHA-256, Logic Clocks y Hashing Encadenado.
version: 1.0.0
---

# AuditChain Integrity Skill

Este skill define el protocolo criptográfico para asegurar que el registro de auditoría (`audit_log` o `audit_trail`) sea inmutable y verificable. Cada entrada en el log depende criptográficamente de la anterior, haciendo imposible la alteración silenciosa de registros históricos (Anti-Tamper).

## ⚠️ Reglas Críticas (Hard Constraints)

1. **Algoritmo**: SHA-256 exclusivamente.
2. **Payload del Hash**: Debe incluir obligatoriamente:
    * `previous_hash`: El hash del registro inmediatamente anterior (ordenado por `logic_clock`).
    * `logic_clock`: Un entero incremental global (Lamport Clock simplificado) para ordenamiento causal.
    * `entity_data`: Datos clave de la operación (ID, tabla, cambios).
    * `timestamp`: ISO 8601.
    * `user_id`: Actor.
    * `salt`: Un secreto rotativo del sistema (opcional pero recomendado).
3. **Verificación**: La validación recorre la cadena recalculando hashes; si uno difiere, detecta corrupción ("Tamper Detected").

## Estructura del Payload

```json
{
  "previous_hash": "a1b2c3...",
  "logic_clock": 1042,
  "timestamp": "2026-01-27T10:00:00Z",
  "table_name": "invoices",
  "record_id": 501,
  "action": "UPDATE",
  "changes": "{\"status\": \"paid\"}",
  "user_id": 1
}
```

## Flujo de Generación (Insert)

1. **Lock**: Bloquear escritura en tabla de auditoría (SQLite 'BEGIN EXCLUSIVE' o similar lógico).
2. **Fetch Last**: Obtener el último registro: `SELECT hash, logic_clock FROM audit_trail ORDER BY logic_clock DESC LIMIT 1`.
3. **Calculate**:
    * `new_clock = last_clock + 1`
    * `current_hash = SHA256(last_hash + new_clock + datapayload)`
4. **Insert**: Guardar registro.
5. **Unlock**: Commit transacción.

## Flujo de Verificación (Integrity Check)

1. Leer todos los registros ordenados por `logic_clock`.
2. Para cada registro `n`:
    * Recalcular hash esperado usando `n.data` y `hash(n-1)`.
    * Comparar con `n.stored_hash`.
3. Si coinciden todos: Integridad = OK.
4. Si falla: Retornar ID del primer registro corrupto.

## Comandos Relacionados

* `verificar integridad`: Ejecuta el chequeo completo de la cadena.
* `auditar cambios [tabla]`: Lista historial verificando hashes al vuelo.

## Archivos Clave

* `src/core/security/AuditService.ts` (Implementación ideal)
* `src/database/simple-db.ts` (Persistencia actual)
