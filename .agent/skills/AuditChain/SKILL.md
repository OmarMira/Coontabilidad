---
name: AuditChain
description: Sistema de verificación y generación de cadenas de auditoría inmutable utilizando SHA-256 para asientos contables.
version: 1.0.0
---

# AuditChain Skill

**Propósito**: Garantizar que cada transacción contable esté ligada criptográficamente a la anterior, formando una cadena inmutable (Audit Trail) que detecte manipulaciones.

## Capacidades

- **Generación de Hashes**: Utiliza SHA-256 para hashear la data del asiento + el hash anterior.
- **Verificación Forense**: Permite validar si la cadena ha sido alterada.

## Uso

Este skill es activado automáticamente por el `security-auditor` y el `backend-specialist` al procesar transacciones críticas.

### Protocolo de Registro

1. Obtener el último hash de `audit_chain`.
2. Serializar la nueva transacción.
3. Ejecutar `AuditChain_Forensics` para generar el nuevo sello.
4. Persistir el sello en la base de datos.
