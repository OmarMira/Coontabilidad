---
name: creador-de-habilidades
description: Utilidad para diseñar y estructurar nuevas habilidades (skills) siguiendo los estándares de Antigravity AI.
---

# 🛠️ Skill de Creación de Habilidades

Este skill está diseñado para ayudarte a crear otras habilidades de manera estructurada y profesional. Sigue estas guías para garantizar que la nueva habilidad sea efectiva y fácil de usar por el agente.

## 📁 Estructura de una Habilidad

Cada habilidad debe residir en su propia carpeta dentro de `.agent/skills/nombre-de-la-habilidad/` y contener:

1. **SKILL.md** (Obligatorio): El núcleo de la habilidad. Contiene las instrucciones detalladas y el frontmatter YAML.
2. **scripts/** (Opcional): Scripts de ayuda, utilidades o herramientas específicas que la habilidad necesite ejecutar.
3. **examples/** (Opcional): Implementaciones de referencia, casos de uso o patrones para que el agente entienda cómo aplicar la habilidad.
4. **resources/** (Opcional): Archivos adicionales, plantillas, documentación externa o activos que la habilidad mencione.

## 📝 Requisitos de SKILL.md

El archivo `SKILL.md` debe comenzar con un bloque YAML:

```yaml
---
name: nombre-unico-de-la-habilidad
description: Breve resumen de qué hace y cuándo debe usarse.
---
```

### Contenido Sugerido

* **Objetivo**: ¿Qué problema resuelve esta habilidad?
* **Reglas y Restricciones**: Qué debe y qué no debe hacer el agente al usarla.
* **Workflow Pasos**: Una guía paso a paso para la ejecución.
* **Mejores Prácticas**: Consejos para obtener resultados de alta calidad.

## 🚀 Proceso de Creación para el Agente

Cuando el usuario pida crear una nueva habilidad:

1. **Definición**: Determina el nombre (kebab-case) y la descripción clara.
2. **Planificación**: Identifica si se necesitan scripts o archivos de ejemplo.
3. **Implementación**:
    * Crea el directorio: `mkdir -p .agent/skills/nombre-habilidad`
    * Escribe el `SKILL.md`.
    * Añade archivos de soporte si aplica.
4. **Validación**: Lee el archivo creado para confirmar que las instrucciones son precisas y no contradictorias.

## 💡 Consejos de Diseño

* **Claridad**: Usa un lenguaje directo y accionable.
* **Contexto**: Explica al agente *por qué* esta habilidad es necesaria.
* **Modularidad**: No intentes que una sola habilidad haga demasiadas cosas. Divide habilidades complejas en varias menores.
* **Idioma**: Si el proyecto está en un idioma específico, mantén la coherencia en la documentación de la habilidad.
