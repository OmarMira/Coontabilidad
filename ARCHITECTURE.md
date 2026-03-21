# Architecture Rules — Account Express

## Fuente de verdad
- Los modulos src/database/modules/db-*.ts son la fuente de verdad de toda la logica de negocio
- simple-db.ts es proveedor de conexion y wrapper — NO contiene logica propia

## Reglas obligatorias
- simple-db.ts NO puede contener logica nueva
- NO duplicar logica entre modulo y monolito
- Toda funcion nueva va a su modulo correspondiente
- simple-db.ts solo delega hacia modulos o provee conexion

## Estado actual del refactor
- v65: monolito reducido de 14,000 a 10,730 lineas
- Pendiente: migracion por dominios (Strangler Pattern)

## Orden de migracion por dominios
1. invoices (piloto)
2. customers
3. payments
4. tax
5. inventory
6. payroll

## Prohibicion explicita
Ningun desarrollador (humano o IA) puede:
- Agregar logica nueva a simple-db.ts
- Copiar funciones entre modulos y simple-db.ts
- Usar scripts masivos de eliminacion sin mapa de dependencias previo
