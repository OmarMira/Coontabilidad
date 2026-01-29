# Sistema de Verdad Única - Account Express

Este directorio contiene el "Cerebro Central" del estado del proyecto. Su objetivo es mantener una fuente de verdad única, automatizada y transparente sobre la salud, el progreso y los problemas del software.

## 📂 Archivos del Sistema

1. **`VERDAD_ÚNICA.json`**:
    * **Qué es**: La base de datos maestra del estado del proyecto.
    * **Contiene**: Métricas de build, bugs, roadmap y cumplimiento legal.
    * **Quién lo edita**: Scripts automáticos (auditor) o desarrolladores (para roadmap/bugs).

2. **`generador_README.py`**:
    * **Qué es**: Script Python que transforma el JSON en el `README.md` principal.
    * **Cuándo corre**: Automáticamente después de cada auditoría o manualmente.

3. **`auditor_diario.js`**:
    * **Qué es**: Script Node.js que ejecuta pruebas reales (`npm run build`).
    * **Función**: Verifica si el código compila, cuenta errores y actualiza el JSON automáticamente.

4. **`dashboard.html`**:
    * **Qué es**: Visualizador web simple del estado actual.
    * **Uso**: Abrir con "Live Server" o un navegador local para ver métricas gráficas.

---

## 🔄 Flujo de Trabajo (Workflow)

### Para Desarrolladores Humanos

1. **Si encuentras un bug crítico**:
    * Abre `estado_sistema/VERDAD_ÚNICA.json`.
    * Añade una entrada en el array `"problemas_conocidos"`.
    * Ejecuta `python estado_sistema/generador_README.py`.

2. **Si terminas un módulo**:
    * Actualiza `"modulos_completados"` en el JSON.
    * Mueve items del roadmap de "Fase Inmediata" a completados (borrándolos).
    * Regenera el README.

### Para Agentes de IA

1. **Al iniciar sesión**:
    * **LEER** siempre `VERDAD_ÚNICA.json` para entender el contexto inmediato.
    * No confiar en información desactualizada de otros archivos.

2. **Al finalizar tareas**:
    * **ACTUALIZAR** el JSON si se resolvieron bugs o completaron tareas.
    * **EJECUTAR** el `auditor_diario.js` si se hicieron cambios de código significativos.

---

## ⚡ Comandos Rápidos

**Generar documentación actualizada:**

```bash
python estado_sistema/generador_README.py
```

**Ejecutar auditoría completa (Build + Update):**

```bash
node estado_sistema/auditor_diario.js
```
