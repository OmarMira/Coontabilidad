# Plan de Implementación: Conciliación Bancaria Inteligente (Smart Reconcile)

Este plan detalla la implementación de la detección automática de cuentas bancarias mediante la extracción de metadatos de estados de cuenta electrónicos (OFX/CSV) y la integración del flujo de creación de cuentas "on-the-fly".

## 1. Análisis y Preparación

- **Objetivo**: Eliminar la necesidad de seleccionar manualmente la cuenta bancaria antes de subir un archivo.
- **Archivos Objetivo**:
  - `src/components/banking/BankReconciliationImporter.tsx` (UI de carga)
  - `src/services/banking/StatementSmartParser.ts` (Nuevo Servicio)
  - `src/assets/locales/es.json` (Traducciones)
  - `src/assets/locales/en.json` (Traducciones)

## 2. Fase 1: Motor de Extracción (Smart Parser)

Crear un servicio `StatementSmartParser.ts` que:

- Detecte el formato (OFX vs CSV).
- Extraiga el número de cuenta y el nombre del banco.
- Maneje heurísticas para CSVs comunes (detección de cabeceras).

## 3. Fase 2: Refactorización de la UI de Importación

Modificar `BankReconciliationImporter.tsx`:

- Permitir la carga de archivos sin cuenta seleccionada.
- Al cargar archivo:
  1. Mostrar estado "Analizando metadatos...".
  2. Llamar al `SmartParser`.
  3. Buscar coincidencia en la base de datos local.
  4. Si se encuentra: Seleccionar automáticamente y avanzar al mapeo.
  5. Si NO se encuentra: Mostrar un modal de interrupción.

## 4. Fase 3: Flujo de Creación "On-the-fly"

Integrar `BankAccountForm`:

- El modal de interrupción ofrecerá un botón: "Registrar Cuenta Bancaria".
- Al hacer clic, abrir el formulario de cuenta pre-rellenado con la información extraída.
- Una vez guardada la cuenta, el sistema la selecciona y continúa el proceso de importación del archivo original.

## 5. Fase 4: Pruebas y Validación

- Probar con archivos OFX estándar.
- Probar con CSVs de diferentes formatos.
- Validar el flujo de error cuando el archivo no tiene información de cuenta.

## Verificación Final

- El usuario arrastra un archivo.
- El sistema dice: "Cuenta detectada: Chase xxxx-9012. Procesando...".
- El usuario puede conciliar inmediatamente.
