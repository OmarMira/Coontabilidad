# Diagnóstico de Internationalización (i18n) - Revisión de Código

**Fecha:** 14 de Febrero de 2026
**Estado:** CRÍTICO
**Alcance:** Componentes Principales (`CompanyDataForm`, `UserForm`, `PayrollReports`)

## 1. Resumen Ejecutivo

Se ha realizado una auditoría de código profunda ante la imposibilidad de navegar visualmente por todas las rutas. El diagnóstico confirma que **existen brechas críticas de traducción** que explican los "raw keys" (claves crudas) reportados por el usuario.

El problema principal no es que el código no use `t()`, sino que **las claves de traducción no existen en los archivos `en.json` y `es.json`**.

## 2. Hallazgos Críticos

### A. CompanyDataForm.tsx (Datos de Empresa)

* **Estado:** 🛑 FALTANTE (100% de las claves)
* **Problema:** El componente hace uso correcto de `t('companyData.title')`, `t('companyData.field.companyName')`, etc., pero la sección `companyData` **no existe** en los archivos de traducción.
* **Síntoma:** El usuario ve `companyData.title` en la pantalla en lugar de "Company Information" o "Información de la Empresa".
* **Acción Requerida:** Crear la sección `companyData` en `en.json` y `es.json` con aproximadamente 30 claves.

### B. UserForm.tsx (Perfil de Usuario / Gestión de Usuarios)

* **Estado:** 🛑 FALTANTE (100% de las claves)
* **Problema:** El componente usa el namespace `userForm.*` (ej. `userForm.username`, `userForm.errorPasswordLength`), pero esta sección **no existe** en los archivos JSON.
* **Síntoma:** Formularios de usuario y perfil muestran claves crudas.
* **Acción Requerida:** Crear la sección `userForm` en `en.json` y `es.json` con aproximadamente 25 claves.

### C. PayrollReports.tsx (Reportes de Nómina)

* **Estado:** ⚠️ PARCIAL / MIXTO
* **Análisis:**
  * El código ha sido refactorizado para usar `t()` en casi todos los textos visibles y en la generación de PDFs (`doc.text(t(...))`).
  * Las claves `payroll.reports.*` **SÍ EXISTEN** en `en.json` y `es.json`.
* **Causa Probable de "Mezcla de Idiomas":**
  * Es posible que algunas claves específicas falten en `en.json` y el sistema esté usando el *fallback* a español (si está configurado así).
  * O bien, el usuario está viendo una versión en caché anterior a la refactorización completa.
  * **Nota:** Hay una constante hardcodeada `companyData` en la línea 61 para propósitos de demostración/fallback que podría estar apareciendo si no hay datos reales de empresa.
* **Acción Requerida:** Verificar integridad de todas las claves en `en.json` y asegurar que no haya valores en español copiados por error.

## 3. Otros Componentes

Se sospecha que otros componentes administrativos (en `src/components/settings/`) podrían sufrir del mismo problema de "código listo para i18n pero sin claves en JSON".

## 4. Plan de Acción Inmediato

1. **Generar claves faltantes:** Inyectar las secciones `companyData` y `userForm` en los archivos locales.
2. **Verificación de Payroll:** Revisar con "lupa" el archivo `en.json` en la sección `payroll.reports` para asegurar que los valores sean inglés puro.
3. **Compilación TSA:** Ejecutar `tsc` para asegurar que los cambios en tipos (si los hay) no rompan el build.
