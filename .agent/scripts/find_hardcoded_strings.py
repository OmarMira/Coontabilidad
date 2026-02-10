#!/usr/bin/env python3
"""
Script para identificar textos estáticos en componentes React
que necesitan ser traducidos usando el sistema i18n.

Uso:
    python find_hardcoded_strings.py [directorio]

Ejemplo:
    python find_hardcoded_strings.py src/components
"""

import os
import re
import sys
import json
from pathlib import Path
from typing import List, Dict, Tuple

# Patrones de texto estático en español
SPANISH_PATTERNS = [
    r'["\']([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)["\']',  # Palabras capitalizadas en español
    r'>\s*([A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+)\s*<',   # Texto entre tags HTML
    r'placeholder=["\']([^"\']+)["\']',        # Placeholders
    r'title=["\']([^"\']+)["\']',              # Títulos
    r'aria-label=["\']([^"\']+)["\']',         # ARIA labels
]

# Palabras clave comunes en español que indican texto hardcodeado
SPANISH_KEYWORDS = [
    'gestión', 'administración', 'configuración', 'agregar', 'editar', 'eliminar',
    'guardar', 'cancelar', 'buscar', 'filtrar', 'exportar', 'imprimir',
    'cliente', 'proveedor', 'producto', 'factura', 'pago', 'reporte',
    'usuario', 'sistema', 'datos', 'información', 'total', 'subtotal',
    'descripción', 'cantidad', 'precio', 'fecha', 'estado', 'activo',
    'inactivo', 'pendiente', 'completado', 'error', 'éxito', 'advertencia'
]

# Archivos y directorios a ignorar
IGNORE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '__pycache__',
    '.next',
    'coverage',
    '*.test.tsx',
    '*.test.ts',
    '*.spec.tsx',
    '*.spec.ts'
]

def should_ignore(path: str) -> bool:
    """Verifica si un archivo/directorio debe ser ignorado"""
    for pattern in IGNORE_PATTERNS:
        if pattern in path:
            return True
    return False

def find_hardcoded_strings(file_path: str) -> List[Dict[str, any]]:
    """
    Encuentra strings hardcodeados en un archivo TypeScript/TSX
    
    Returns:
        Lista de diccionarios con información sobre cada string encontrado
    """
    findings = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            
        # Buscar patrones de texto en español
        for line_num, line in enumerate(lines, 1):
            # Ignorar comentarios
            if line.strip().startswith('//') or line.strip().startswith('/*'):
                continue
                
            # Buscar palabras clave en español
            for keyword in SPANISH_KEYWORDS:
                if keyword.lower() in line.lower():
                    # Extraer el contexto (texto alrededor)
                    context = line.strip()[:100]
                    
                    findings.append({
                        'file': file_path,
                        'line': line_num,
                        'keyword': keyword,
                        'context': context,
                        'severity': 'medium'
                    })
                    break  # Solo reportar una vez por línea
                    
    except Exception as e:
        print(f"Error leyendo {file_path}: {e}")
        
    return findings

def scan_directory(directory: str) -> Dict[str, List[Dict]]:
    """
    Escanea un directorio recursivamente buscando archivos TSX/TS
    
    Returns:
        Diccionario con archivos como claves y findings como valores
    """
    results = {}
    
    for root, dirs, files in os.walk(directory):
        # Filtrar directorios a ignorar
        dirs[:] = [d for d in dirs if not should_ignore(os.path.join(root, d))]
        
        for file in files:
            if file.endswith(('.tsx', '.ts')) and not should_ignore(file):
                file_path = os.path.join(root, file)
                findings = find_hardcoded_strings(file_path)
                
                if findings:
                    results[file_path] = findings
                    
    return results

def generate_report(results: Dict[str, List[Dict]], output_format: str = 'text'):
    """
    Genera un reporte de los resultados
    
    Args:
        results: Diccionario con los resultados del escaneo
        output_format: 'text', 'json', o 'markdown'
    """
    total_files = len(results)
    total_findings = sum(len(findings) for findings in results.values())
    
    if output_format == 'json':
        print(json.dumps({
            'summary': {
                'total_files': total_files,
                'total_findings': total_findings
            },
            'results': results
        }, indent=2, ensure_ascii=False))
        
    elif output_format == 'markdown':
        print(f"# 🌐 Reporte de Strings Hardcodeados\n")
        print(f"**Total de archivos con strings hardcodeados:** {total_files}")
        print(f"**Total de strings encontrados:** {total_findings}\n")
        print("---\n")
        
        for file_path, findings in sorted(results.items()):
            print(f"## 📄 {file_path}")
            print(f"**Strings encontrados:** {len(findings)}\n")
            
            for finding in findings[:10]:  # Limitar a 10 por archivo
                print(f"- **Línea {finding['line']}:** `{finding['keyword']}`")
                print(f"  ```typescript")
                print(f"  {finding['context']}")
                print(f"  ```\n")
                
            if len(findings) > 10:
                print(f"*... y {len(findings) - 10} más*\n")
                
            print("---\n")
            
    else:  # text
        print(f"\n{'='*80}")
        print(f"🌐 REPORTE DE STRINGS HARDCODEADOS")
        print(f"{'='*80}\n")
        print(f"Total de archivos con strings hardcodeados: {total_files}")
        print(f"Total de strings encontrados: {total_findings}\n")
        
        # Agrupar por prioridad
        high_priority = []
        medium_priority = []
        
        for file_path, findings in results.items():
            if 'Dashboard' in file_path or 'List' in file_path or 'Form' in file_path:
                high_priority.append((file_path, findings))
            else:
                medium_priority.append((file_path, findings))
                
        if high_priority:
            print(f"\n🔴 ALTA PRIORIDAD ({len(high_priority)} archivos)")
            print("-" * 80)
            for file_path, findings in sorted(high_priority, key=lambda x: len(x[1]), reverse=True)[:10]:
                rel_path = os.path.relpath(file_path)
                print(f"\n  📄 {rel_path}")
                print(f"     {len(findings)} strings encontrados")
                
        if medium_priority:
            print(f"\n🟡 PRIORIDAD MEDIA ({len(medium_priority)} archivos)")
            print("-" * 80)
            for file_path, findings in sorted(medium_priority, key=lambda x: len(x[1]), reverse=True)[:5]:
                rel_path = os.path.relpath(file_path)
                print(f"\n  📄 {rel_path}")
                print(f"     {len(findings)} strings encontrados")
                
        print(f"\n{'='*80}\n")
        print("💡 RECOMENDACIONES:")
        print("  1. Comenzar con archivos de ALTA PRIORIDAD")
        print("  2. Usar el hook useTranslation() en cada componente")
        print("  3. Reemplazar strings estáticos con t('clave')")
        print("  4. Agregar traducciones faltantes a translations.ts")
        print(f"\n{'='*80}\n")

def main():
    """Función principal"""
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    else:
        directory = 'src/components'
        
    if not os.path.exists(directory):
        print(f"❌ Error: El directorio '{directory}' no existe")
        sys.exit(1)
        
    print(f"🔍 Escaneando directorio: {directory}")
    print("⏳ Esto puede tomar unos segundos...\n")
    
    results = scan_directory(directory)
    
    # Determinar formato de salida
    output_format = 'text'
    if '--json' in sys.argv:
        output_format = 'json'
    elif '--markdown' in sys.argv:
        output_format = 'markdown'
        
    generate_report(results, output_format)
    
    # Guardar reporte en archivo si se especifica
    if '--output' in sys.argv:
        idx = sys.argv.index('--output')
        if idx + 1 < len(sys.argv):
            output_file = sys.argv[idx + 1]
            with open(output_file, 'w', encoding='utf-8') as f:
                # Redirigir stdout temporalmente
                import sys
                old_stdout = sys.stdout
                sys.stdout = f
                generate_report(results, output_format)
                sys.stdout = old_stdout
            print(f"\n✅ Reporte guardado en: {output_file}")

if __name__ == '__main__':
    main()
