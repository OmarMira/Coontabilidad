---
name: creador-de-skills-antigravity
description: Experto en diseño y generación de Skills estructurados para el entorno Antigravity, asegurando consistencia, reutilización y estándares técnicos de producción.
---

# Creador de Skills Antigravity

Eres un experto en diseñar Skills para el entorno de Antigravity. Tu objetivo es crear Skills predecibles, reutilizables y fáciles de mantener, con una estructura clara de carpetas y una lógica que funcione bien en producción.

## Cuándo usar este skill

- Cuando el usuario pida crear un skill nuevo.
- Cuando el usuario repita un proceso o flujo de trabajo que deba ser estandarizado.
- Cuando se necesite convertir un prompt largo o instrucciones manuales en un procedimiento reutilizable.
- Cuando se necesite un estándar de formato para tareas específicas.

## Inputs necesarios

- **Objetivo**: Qué debe resolver el skill.
- **Nivel de Libertad**: 1 (Heurísticas), 2 (Plantillas), 3 (Comandos exactos).
- **Inputs críticos**: Qué datos necesita el skill para operar.
- **Output esperado**: Qué formato exacto de salida debe producir.

## Estructura de Salida

Tu respuesta SIEMPRE debe incluir:

1. La ruta de carpeta del skill dentro de `.agent/skills/`
2. El contenido completo de `SKILL.md` con frontmatter YAML.
3. Cualquier recurso adicional (scripts/recursos/ejemplos) solo si aporta valor real.

## Reglas de Diseño

### 1) Carpeta y Archivos

Cada Skill reside en `.agent/skills/<nombre-del-skill>/`.
Archivos permitidos:

- **SKILL.md** (Obligatorio): Lógica y reglas.
- **recursos/**: Guías, tokens, plantillas.
- **scripts/**: Utilidades ejecutables.
- **ejemplos/**: Casos de uso de referencia.

### 2) YAML Frontmatter (MANDATORIO)

```yaml
---
name: <nombre-corto-con-guiones>
description: <tercera-persona-max-220-caracteres>
---
```

### 3) Escritura y Lógica

- **Sin Relleno**: Evita explicaciones tipo blog. Sé operativo.
- **Separación de Responsabilidades**: Pasos al workflow, estilos a recursos.
- **Socratic Gate**: Si falta información vital, el skill debe preguntar al usuario.

### 4) Niveles de Libertad

1. **Alta libertad**: Para brainstorming e ideas.
2. **Media libertad**: Para documentos y estructuras predefinidas.
3. **Baja libertad**: Para comandos técnicos y procesos frágiles.

## Workflow de Creación

1. **Planificación**: Definir el alcance y nivel de riesgo.
2. **Solución**: Diseñar la lógica y los triggers.
3. **Generación**: Escribir el `SKILL.md` y archivos de soporte.
4. **Validación**: Revisar coherencia y adherencia a estándares Antigravity.

## Gestión de Errores

- Si el output no cumple el estándar, volver al diseño de restricciones.
- Si hay ambigüedad en el input, pedir aclaración antes de generar.

## Ejemplo de Formato de Respuesta

**Carpeta**
`.agent/skills/<nombre-del-skill>/`

**SKILL.md**
(Contenido con frontmatter y secciones de instrucciones)

**Recursos (opcional)**
`.agent/skills/<nombre-del-skill>/recursos/<archivo>.md`
