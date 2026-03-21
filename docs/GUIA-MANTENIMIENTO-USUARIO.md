# 📖 Guía de Mantenimiento para el Usuario Final

**Versión del Sistema**: v0.2.0-stable-build  
**Fecha de esta guía**: 16 de Febrero, 2026  
**Audiencia**: Usuario no técnico que necesita mantener el sistema funcionando

---

## 🎯 OBJETIVO DE ESTA GUÍA

Permitirte mantener el sistema estable y detectar problemas SIN necesitar conocimientos técnicos avanzados. Solo necesitas saber ejecutar comandos básicos.

---

## 🖥️ COMANDOS QUE DEBES CONOCER

### Comando 1: Verificar Salud del Sistema

```bash
npm run verificar
```

**¿Qué hace?**  

- Verifica que el build funciona
- Ejecuta tests automáticos
- Revisa errores de TypeScript
- Genera un reporte en `docs/salud-diaria/`

**¿Cuándo usarlo?**  
Cada día ANTES de empezar a trabajar con el sistema.

**¿Qué esperar?**  

```
🔍 Iniciando verificación diaria...
📦 Verificando build...
✅ Build: OK

🧪 Ejecutando tests...
✅ Tests: OK

📘 Verificando TypeScript...
✅ TypeScript: OK

📊 RESUMEN:
Build: ✅
Tests: ✅
TypeScript: ✅

📄 Reporte guardado en: docs/salud-diaria/2026-02-16.md
```

---

### Comando 2: Hacer Backup de Base de Datos

```bash
npm run backup
```

**¿Qué hace?**  

- Crea una copia de seguridad de la base de datos
- La guarda en la carpeta `backups/` con fecha y hora
- Mantiene solo los últimos 10 backups (borra automáticamente los antiguos)

**¿Cuándo usarlo?**  

- Antes de hacer cambios importantes
- Al final de cada semana
- Antes de actualizar el sistema

**¿Qué esperar?**  

```
💾 Iniciando backup de base de datos...
✅ Backup creado exitosamente:
   📄 backups/database-backup-2026-02-16T14-30-00.db
   💾 Tamaño: 2.45 MB
```

---

### Comando 3: Verificar + Backup (RECOMENDADO)

```bash
npm run salud
```

**¿Qué hace?**  
Ejecuta ambos comandos anteriores en secuencia.

**¿Cuándo usarlo?**  
Cada día al iniciar tu jornada de trabajo.

---

## 📅 RUTINA RECOMENDADA

### ☀️ Cada Día de Trabajo

**Al iniciar el día:**

```bash
npm run salud
```

**Resultado esperado:**  
✅ Todo verde → Puedes trabajar normal  
❌ Algo rojo → Revisar el reporte en `docs/salud-diaria/YYYY-MM-DD.md`

---

### 📊 Cada Semana

1. **Lunes**: Revisar reportes de salud de toda la semana pasada
   - Ver carpeta `docs/salud-diaria/`
   - Buscar patrones de errores

2. **Miércoles**: Actualizar `docs/BUGS-PRODUCCION.md` con nuevos bugs detectados

3. **Viernes**: Hacer backup manual adicional (importante)

   ```bash
   npm run backup
   ```

---

### 🗓️ Al Final del Mes (Día 30)

1. Abrir `docs/BUGS-PRODUCCION.md`
2. Contar bugs críticos y de Base de Datos
3. **Decidir si hacer Fase 3**:
   - ✅ 0-2 bugs menores → **NO** hacer Fase 3
   - ⚠️ 3-5 bugs mixtos → Evaluar caso por caso
   - 🔴 5+ bugs de DB → **SÍ** hacer Fase 3

---

## 🚨 QUÉ HACER CUANDO ALGO FALLA

### Si `npm run verificar` muestra ❌

#### Problema: Build fallido

```bash
npm run build
# Leer el error completo en la consola
# Copiar el mensaje de error
# Buscar en Google: "npm build error [mensaje]"
```

**Acción inmediata**: No trabajar en el sistema hasta corregir.

---

#### Problema: Tests fallidos

```bash
npm test
# Ver qué test específico falla
# Anotar el nombre del test
```

**Acción inmediata**:  

1. Abrir `docs/BUGS-PRODUCCION.md`
2. Agregar entrada nueva (ver formato abajo)
3. Si es crítico, buscar ayuda técnica

---

#### Problema: TypeScript con errores

```bash
npx tsc --noEmit
# Ver errores específicos
```

**Acción inmediata**:  
Si el sistema funciona normalmente a pesar del error:

- Documentar en `BUGS-PRODUCCION.md` como BUG BAJO
- Continuar trabajando, no es urgente

Si el sistema NO funciona:

- Documentar como BUG CRÍTICO
- Buscar ayuda técnica inmediata

---

### Si encuentras un bug en la aplicación

**Pasos a seguir**:

1. **Abrir** `docs/BUGS-PRODUCCION.md`

2. **Decidir severidad**:
   - 🔴 **Crítico**: El sistema no funciona, no puedo trabajar
   - 🟡 **Medio**: Incómodo pero puedo trabajar
   - 🟢 **Bajo**: Problema cosmético

3. **Agregar entrada** siguiendo este formato:

```markdown
### BUG-002: [Título corto del problema]
- **Descripción**: [Explicar qué pasa]
- **Frecuencia**: [Siempre / A veces / Raro]
- **Pasos para reproducir**:
  1. Hago clic en "Crear Cliente"
  2. Lleno el formulario
  3. Hago clic en "Guardar"
  4. [Aquí pasa el error]
- **Error reportado**: [Si hay mensaje, copiarlo aquí]
- **Impacto**: No puedo crear clientes nuevos
- **Fecha detectado**: 2026-02-16
- **Status**: [ ] Pendiente
```

1. **Actualizar fecha** al inicio del documento

2. **Actualizar tabla resumen** (incrementar contador de categoría)

---

## 📂 UBICACIÓN DE ARCHIVOS IMPORTANTES

```
Account Express/
├── docs/
│   ├── ESTADO-DEL-PROYECTO.md          ← Estado actual y plan Fase 3
│   ├── BUGS-PRODUCCION.md              ← Bugs encontrados (tú editas esto)
│   ├── GUIA-MANTENIMIENTO-USUARIO.md   ← Esta guía
│   └── salud-diaria/                   ← Reportes automáticos
│       ├── 2026-02-16.md
│       ├── 2026-02-17.md
│       └── ...
├── backups/                            ← Backups de base de datos
│   ├── database-backup-2026-02-16.db
│   └── ...
└── scripts/
    ├── verificacion-diaria.js          ← Script de salud (no editar)
    └── backup-db.js                    ← Script de backup (no editar)
```

---

## 📞 CUÁNDO PEDIR AYUDA TÉCNICA (FASE 3)

**Criterios para iniciar Fase 3** (después de 30 días en producción):

```markdown
SI tienes:
✅ 5+ bugs relacionados con Base de Datos
✅ Inconsistencias frecuentes en datos
✅ Problemas de sincronización

ENTONCES:
1. Recopilar `docs/BUGS-PRODUCCION.md`
2. Recopilar `docs/ESTADO-DEL-PROYECTO.md`
3. Abrir nueva conversación con IA de desarrollo
4. Proveer ambos documentos
5. Solicitar "Iniciar Fase 3: Unificación DatabaseCore"
```

---

## ✅ CHECKLIST DIARIO (IMPRIMIR Y PEGAR)

```
[ ] Ejecutar: npm run salud
[ ] Verificar resultado: ¿Todo verde?
    [ ] Sí → Trabajar normal
    [ ] No → Revisar reporte en docs/salud-diaria/
[ ] Si encontré bugs hoy: Actualizar docs/BUGS-PRODUCCION.md
[ ] Fin del día: Sistema funcionando correctamente
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Qué hago si olvido hacer la verificación diaria?**  
R: Ejecútala apenas lo recuerdes. Es mejor tarde que nunca.

**P: ¿Puedo borrar los reportes viejos de `salud-diaria/`?**  
R: Sí, después de 1 mes puedes borrar los más antiguos. Mantén al menos los últimos 30 días.

**P: ¿Dónde están los backups de la base de datos?**  
R: En la carpeta `backups/`. El script mantiene automáticamente los últimos 10.

**P: ¿Qué pasa si `npm run backup` da error?**  
R: Revisa que la base de datos esté en la ubicación correcta. Contacta soporte técnico si persiste.

**P: ¿Cuándo SÍ debo hacer Fase 3?**  
R: Solo si después de 30 días tienes 5+ bugs críticos de base de datos. Caso contrario, NO es necesario.

---

## 🎓 FILOSOFÍA DE MANTENIMIENTO

> **"Si funciona bien, no lo toques"**

El objetivo NO es "mejorar" el sistema continuamente, sino:

- ✅ Mantenerlo funcionando
- ✅ Detectar problemas temprano
- ✅ Documentar bugs para decisiones futuras
- ❌ NO hacer cambios "porque sí"
- ❌ NO actualizar dependencias sin razón

**Fase 3 es OPCIONAL** y solo se hace si hay problemas reales y medibles.

---

**Generado**: 16 de Febrero, 2026  
**Próxima revisión**: 16 de Marzo, 2026  
**Mantenido por**: Usuario Final
