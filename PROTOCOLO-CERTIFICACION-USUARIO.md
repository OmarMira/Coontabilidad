# 🔍 PROTOCOLO DE CERTIFICACIÓN - VERIFICACIÓN MANUAL OBLIGATORIA

## ⚠️ **ADVERTENCIA CRÍTICA**
**NO confíes en reportes automáticos de la IA.** La única certificación válida es tu verificación manual paso a paso.

## 📋 **CHECKLIST DE CERTIFICACIÓN DEFINITIVO**

### **PASO 1: Preparación del Entorno**
```bash
# 1. Asegúrate de tener la última versión
cd "C:\Account Express"
git pull origin main

# 2. Instala dependencias
npm install

# 3. Inicia servidor en modo verbose
npm run dev
```

### **PASO 2: CERTIFICAR BackupRestore.tsx**

**🔧 TAREA 1 - BackupRestore.tsx:**
- [ ] **Navegación:** Puedo acceder a ARCHIVO → Respaldos y Restauración
- [ ] **Descarga Real:** Al hacer clic "Crear Backup Ahora":
  - [ ] Mi navegador **descarga automáticamente** un archivo `.aex`
  - [ ] El archivo tiene nombre como `coontabilidad-backup-YYYY-MM-DD.aex`
  - [ ] El archivo tiene tamaño > 0 bytes (no está vacío)
- [ ] **Estado de Loading:** Aparece spinner "Creando Backup..." durante la operación
- [ ] **Restauración Completa:**
  - [ ] Puedo seleccionar un archivo `.aex` desde mi PC
  - [ ] Aparece botón "Restaurar Backup" cuando selecciono archivo
  - [ ] Al hacer clic, aparece diálogo: "Esto eliminará todos los datos actuales"
  - [ ] Tras confirmar, aparece mensaje de éxito/error claro
- [ ] **Estado del Sistema:**
  - [ ] Se muestra "Fecha del último backup"
  - [ ] La fecha se actualiza después de crear un backup
  - [ ] Se muestra "Tamaño de BD" con valor real (no "Calculando...")

### **PASO 3: CERTIFICAR FloridaTaxReport.tsx**

**📊 TAREA 2 - FloridaTaxReport.tsx:**
- [ ] **Navegación:** Puedo acceder a sección de Reportes DR-15
- [ ] **Dropdown de Condados:**
  - [ ] El selector tiene **67+ opciones** (condados reales de Florida)
  - [ ] Incluye: Miami-Dade, Orange, Broward, Hillsborough, Palm Beach
  - [ ] NO son solo 3-5 opciones de ejemplo
- [ ] **Generación de Reporte:**
  - [ ] Selecciono condado (ej: Miami-Dade) y período
  - [ ] Hago clic "Generar Reporte"
  - [ ] Aparece tabla con **datos numéricos reales** O mensaje "No hay datos"
  - [ ] Tabla tiene columnas: Base Imponible, Tasa, Impuesto, Total
- [ ] **Exportación CSV:**
  - [ ] Con datos en tabla, hago clic "Exportar CSV"
  - [ ] Mi navegador descarga archivo `reporte_dr15_*.csv`
  - [ ] Al abrir CSV, contiene **los mismos números que la tabla**
  - [ ] Archivo CSV está bien formateado (comas, comillas, encabezados)

## 🚨 **COMANDO DE DIAGNÓSTICO DE EMERGENCIA**

Si encuentras errores, ejecuta esto en Consola del Navegador (F12):

```javascript
// DIAGNÓSTICO COMPLETO - Pegar en Consola F12
(() => {
  console.group('🔍 DIAGNÓSTICO AccountExpress - Certificación');
  
  // Estado general
  console.log('URL actual:', window.location.pathname);
  console.log('Errores en consola:', console.error.length || 'No detectados');
  
  // Verificar componentes en DOM
  const backup = document.querySelector('[class*="Backup"], [class*="backup"]');
  const report = document.querySelector('[class*="Report"], [class*="report"]');
  console.log('Componente Backup:', backup ? '✅ Montado' : '❌ No encontrado');
  console.log('Componente Report:', report ? '✅ Montado' : '❌ No encontrado');
  
  // Verificar servicios globales
  console.log('BackupService:', window.backupService ? '✅ Disponible' : '❌ No disponible');
  console.log('Database:', window.db ? '✅ Conectada' : '❌ No conectada');
  
  // Errores de red recientes
  const networkErrors = performance.getEntriesByType('resource')
    .filter(r => r.transferSize === 0 && r.name.includes('localhost'))
    .slice(-5);
  console.log('Errores de red:', networkErrors.length ? networkErrors : 'Ninguno');
  
  // Elementos de error visibles
  const errors = document.querySelectorAll('[class*="error"], [class*="Error"]');
  console.log('Mensajes de error visibles:', errors.length);
  
  console.groupEnd();
})();
```

## ❌ **SI ALGÚN ÍTEM FALLA**

**NO certificar el componente.** En su lugar, reportar:

```markdown
❌ CERTIFICACIÓN FALLIDA

Componente: [BackupRestore/FloridaTaxReport]
Ítem fallido: [descripción específica]
Comportamiento observado: [lo que realmente pasa]
Comportamiento esperado: [lo que debería pasar]

REQUIERE: Corrección inmediata antes de proceder.
```

## ✅ **CERTIFICACIÓN EXITOSA**

Solo cuando **TODOS** los ítems tengan ✅, reportar:

```markdown
✅ CERTIFICACIÓN EXITOSA

Componente: [nombre]
Fecha: [fecha actual]
Verificado por: Usuario final
Estado: Funcionalidad completa confirmada

APROBADO para uso en producción.
```

## 🎯 **REGLAS DE CERTIFICACIÓN**

1. **Un solo ❌ = Componente NO certificado**
2. **Solo el usuario puede certificar (no la IA)**
3. **Verificación manual obligatoria para cada función**
4. **No confiar en reportes automáticos**
5. **Probar en navegador real, no simulaciones**

---

**Este protocolo garantiza que solo funcionalidad REAL sea certificada.**