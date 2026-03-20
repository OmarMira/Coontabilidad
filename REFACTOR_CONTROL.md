# REFACTOR CONTROL — Account Express
## Strangler Pattern: simple-db.ts -> modulos db-*.ts

---

## ESTADO DEL SISTEMA AL INICIO
| Metrica | Valor |
|---|---|
| Fecha inicio | 20/03/2026 |
| Ultimo commit | 104a0ab |
| Tag de partida | v65-stable-before-refactor |
| simple-db.ts lineas | 10,730 |
| Tests pasando | 363 / 363 |
| Tests fallando | 0 |
| Errores TypeScript | 0 |

---

## REGLAS ABSOLUTAS
- Antigravity ejecuta una orden a la vez y espera
- Nunca encadenar pasos automaticamente
- Si tsc o vitest reportan errores nuevos: DETENER y reportar. No corregir nada.
- Nunca eliminar sin reemplazar primero
- Un dominio a la vez
- Ante cualquier duda: DETENER y reportar output exacto

---

## CHECKLIST DE EJECUCION

### FASE 0 - Preparacion
- [x] ORDEN 1 - Checkpoint inicial + tag v65-stable-before-refactor
- [x] ORDEN 2 - Crear ARCHITECTURE.md con reglas arquitectonicas
- [x] ORDEN 3 - Crear REFACTOR_CONTROL.md en repositorio

### FASE 1 - Dominio: invoices (piloto)
- [x] ORDEN 4 - Mapa completo de dependencias de createInvoice
- [x] ORDEN 5 - Validacion y clasificacion del mapa (sin tocar codigo)
- [x] ORDEN 6 - Wrapper createInvoice -> delega a db-invoices.ts
- [x] ORDEN 7 - Resolver dependencias si hay errores (iterativo)
- [x] ORDEN 8 - Wrappers restantes del dominio invoices
- [ ] ORDEN 9 - Verificacion final + commit + tag v66-invoices-wrapped

### FASE 2 - Dominio: customers
- [ ] ORDEN 10 - Mapa de dependencias dominio customers
- [ ] ORDEN 11 - Validacion del mapa
- [ ] ORDEN 12 - Wrappers dominio customers
- [ ] ORDEN 13 - Verificacion final + commit + tag v67-customers-wrapped

### FASE 3 - Dominio: payments
- [ ] ORDEN 14 - Mapa de dependencias dominio payments
- [ ] ORDEN 15 - Validacion del mapa
- [ ] ORDEN 16 - Wrappers dominio payments
- [ ] ORDEN 17 - Verificacion final + commit + tag v68-payments-wrapped

### FASE 4 - Dominio: tax
- [ ] ORDEN 18 - Mapa de dependencias dominio tax
- [ ] ORDEN 19 - Validacion del mapa
- [ ] ORDEN 20 - Wrappers dominio tax
- [ ] ORDEN 21 - Verificacion final + commit + tag v69-tax-wrapped

### FASE 5 - Dominio: inventory
- [ ] ORDEN 22 - Mapa de dependencias dominio inventory
- [ ] ORDEN 23 - Validacion del mapa
- [ ] ORDEN 24 - Wrappers dominio inventory
- [ ] ORDEN 25 - Verificacion final + commit + tag v70-inventory-wrapped

### FASE 6 - Dominio: payroll
- [ ] ORDEN 26 - Mapa de dependencias dominio payroll
- [ ] ORDEN 27 - Validacion del mapa
- [ ] ORDEN 28 - Wrappers dominio payroll
- [ ] ORDEN 29 - Verificacion final + commit + tag v71-payroll-wrapped

### FASE FINAL
- [ ] ORDEN 30 - Verificacion integral del sistema completo
- [ ] ORDEN 31 - Commit final + tag v72-arquitectura-limpia

---

## REGISTRO DE EJECUCION

### ORDEN 1 - Checkpoint inicial
**Estado:** COMPLETADA
**Commit:** fb3ffa8
**Tag:** v65-stable-before-refactor
**Resultado:** exito

### ORDEN 2 - ARCHITECTURE.md
**Estado:** COMPLETADA
**Commit:** 104a0ab
**Resultado:** exito

### ORDEN 3 - REFACTOR_CONTROL.md en repositorio
**Estado:** COMPLETADA
**Resultado:** pendiente verificacion

### ORDEN 4 - Mapa dependencias createInvoice
**Estado:** COMPLETADA
**Bloque:** lineas 4702-4827 (126 lineas)
**Resultado:** exito

### ORDEN 5 - Validacion del mapa
**Estado:** COMPLETADA
**Resultado:** exito — 6/8 dependencias en modulos, 2 son infraestructura (no bloquean)
**Tabla de clasificacion:**
| Funcion | Existe en modulo | Modulo | Accion |
|---|---|---|---|
| isDateLocked | SI | db-journal.ts | usar modulo |
| generateInvoiceNumber | SI | db-invoices.ts | usar modulo |
| getCustomerById | SI | db-customers.ts | usar modulo |
| getFloridaTaxRate | SI | db-invoices.ts | usar modulo |
| getInvoiceById | SI | db-invoices.ts | usar modulo |
| generateSalesJournalEntry | SI | db-journal-auto.ts | usar modulo |
| logAuditAction | NO | simple-db linea 6912 | dejar — infraestructura |
| saveDatabase | NO | simple-db linea 3747 | dejar — infraestructura core |

### ORDEN 6 - Wrapper createInvoice
**Estado:** COMPLETADA
**Tests post-wrapper:** 363/363
**Errores TS:** 0

### ORDEN 7 - Resolver dependencias invoices
**Estado:** COMPLETADA
**Nota:** import consolidado corregido para incluir _createInvoice

### ORDEN 8 - Wrappers restantes invoices
**Estado:** COMPLETADA
**Funciones completadas:**
- [x] updateInvoice
- [x] deleteInvoice
- [x] getInvoices
- [x] getInvoiceById
- [x] generateInvoiceNumber

### ORDEN 9 - Commit dominio invoices
**Estado:** PENDIENTE
**Tag:** v66-invoices-wrapped
**Lineas simple-db.ts al cerrar:** -

---

## PROGRESO DE REDUCCION simple-db.ts
| Hito | Lineas | Reduccion |
|---|---|---|
| Original | ~14,000 | - |
| v65 ronda 1 | 10,730 | -3,270 |
| v66 invoices | - | - |
| v67 customers | - | - |
| v68 payments | - | - |
| v69 tax | - | - |
| v70 inventory | - | - |
| v71 payroll | - | - |
| v72 final | - | - |


