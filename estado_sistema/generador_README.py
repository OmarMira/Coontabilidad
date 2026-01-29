import json
import datetime
import os

# Rutas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(BASE_DIR, 'estado_sistema', 'VERDAD_ÚNICA.json')
README_PATH = os.path.join(BASE_DIR, 'README.md')

def generar_badges(data):
    # Genera badges simples usando shields.io (formato markdown)
    badges = []
    
    # Estado del Build
    build_color = "success" if data['estado_sistema']['build_status'] == 'exitoso' else "critical"
    badges.append(f"![Build](https://img.shields.io/badge/Build-{data['estado_sistema']['build_status']}-{build_color})")
    
    # Progreso
    progreso = data['estado_sistema']['porcentaje_completado']
    color_progreso = "green" if progreso > 80 else "yellow"
    badges.append(f"![Progreso](https://img.shields.io/badge/Progreso-{progreso}%25-{color_progreso})")
    
    # Florida Compliance
    compliance = data['calidad']['florida_compliance']
    badges.append(f"![Florida Tax](https://img.shields.io/badge/Florida_Compliance-{compliance}%25-blue)")
    
    return " ".join(badges)

def generar_tabla_problemas(problemas):
    if not problemas:
        return "*No hay problemas críticos reportados.*"
    
    tabla = "| ID | Descripción | Componente | Prioridad |\n|---|---|---|---|\n"
    for p in problemas:
        prio_icon = "🔴" if p['prioridad'] == 'alta' else "🟡"
        tabla += f"| {p['id']} | {p['descripcion']} | `{p['componente']}` | {prio_icon} {p['prioridad']} |\n"
    return tabla

def generar_readme():
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        sys_state = data['estado_sistema']
        roadmap = data['roadmap']
        
        contenido = f"""# Account Express - Estado del Proyecto

{generar_badges(data)}

> **Última actualización:** {data['ultima_actualizacion']}
> **Versión de Verdad Única:** {data['version']}

## 📊 Estado del Sistema

| Métrica | Valor |
|---------|-------|
| **Módulos Completados** | {sys_state['modulos_completados']} / {sys_state['modulos_totales']} ({sys_state['porcentaje_completado']}%) |
| **Estado del Build** | {sys_state['build_status']} ({sys_state['last_build_time']}) |
| **Errores TypeScript** | {sys_state['typescript_errors']} |
| **Florida Compliance** | {data['calidad']['florida_compliance']}% |

---

## 🚧 Problemas Conocidos (Prioridad Alta)

{generar_tabla_problemas(data['problemas_conocidos'])}

---

## 🗺️ Roadmap Actual

### 🚀 Fase Inmediata
{chr(10).join([f'- [ ] {item}' for item in roadmap['fase_inmediata']])}

### 📅 Fase Media
{chr(10).join([f'- [ ] {item}' for item in roadmap['fase_media']])}

### 🔭 Fase Larga
{chr(10).join([f'- [ ] {item}' for item in roadmap['fase_larga']])}

---

## 🛠️ Desarrollo & Mantenimiento

Este README es generado automáticamente por el sistema de **Verdad Única**.
Para actualizar el estado, modifique `/estado_sistema/VERDAD_ÚNICA.json` y ejecute:

```bash
python estado_sistema/generador_README.py
```
"""
        
        with open(README_PATH, 'w', encoding='utf-8') as f:
            f.write(contenido)
            
        print(f"✅ README.md generado exitosamente en {README_PATH}")
        
    except Exception as e:
        print(f"❌ Error generando README: {str(e)}")

if __name__ == "__main__":
    generar_readme()
