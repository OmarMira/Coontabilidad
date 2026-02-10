"""
Script de Traducción SEGURO - Solo traduce textos visibles
NO modifica código, variables, ni palabras clave
"""

import os
import re
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple

# Diccionario de traducciones
TRANSLATIONS = {
    # SOLO frases y textos visibles, NO palabras clave de código
    'Loading...': 'Cargando...',
    'Processing...': 'Procesando...',
    'Please wait...': 'Por favor espere...',
    'No data available': 'No hay datos disponibles',
    'Are you sure?': '¿Está seguro?',
    'No results found': 'No se encontraron resultados',
    
    # Placeholders
    'Search...': 'Buscar...',
    'Select...': 'Seleccionar...',
    'Enter description': 'Ingrese descripción',
    'Enter quantity': 'Ingrese cantidad',
    'Enter price': 'Ingrese precio',
    'Enter notes...': 'Ingrese notas...',
    
    # Botones y acciones (solo en contexto de UI)
    '>Loading<': '>Cargando<',
    '>Processing<': '>Procesando<',
    '>Save<': '>Guardar<',
    '>Cancel<': '>Cancelar<',
    '>Delete<': '>Eliminar<',
    '>Edit<': '>Editar<',
    '>Add<': '>Agregar<',
    '>Create<': '>Crear<',
    '>Update<': '>Actualizar<',
    '>Search<': '>Buscar<',
    '>Filter<': '>Filtrar<',
    '>Export<': '>Exportar<',
    '>Import<': '>Importar<',
    '>Print<': '>Imprimir<',
    '>Download<': '>Descargar<',
    '>Upload<': '>Subir<',
    '>Back<': '>Volver<',
    '>Next<': '>Siguiente<',
    '>Previous<': '>Anterior<',
    '>Close<': '>Cerrar<',
    '>Open<': '>Abrir<',
    '>View<': '>Ver<',
    '>Details<': '>Detalles<',
    '>Refresh<': '>Actualizar<',
    '>Clear<': '>Limpiar<',
    '>Reset<': '>Restablecer<',
    '>Remove<': '>Quitar<',
    '>Confirm<': '>Confirmar<',
    '>Submit<': '>Enviar<',
    '>Yes<': '>Sí<',
    '>No<': '>No<',
    '>Ok<': '>Aceptar<',
}

def safe_translate(components_dir: str, dry_run: bool = False):
    """Traduce SOLO textos visibles de forma segura"""
    print("=" * 80)
    print("🌐 TRADUCCIÓN SEGURA - SOLO TEXTOS VISIBLES")
    print("=" * 80)
    print(f"📁 Directorio: {components_dir}")
    print(f"🔧 Modo: {'DRY RUN' if dry_run else 'PRODUCTION'}")
    print("=" * 80)
    
    components_path = Path(components_dir)
    exclude_dirs = {'elite', 'ui', 'node_modules', '.git', 'i18n'}
    
    # Encontrar archivos .tsx
    tsx_files = []
    for root, dirs, files in os.walk(components_path):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file.endswith('.tsx'):
                tsx_files.append(Path(root) / file)
    
    print(f"\n📊 Archivos encontrados: {len(tsx_files)}\n")
    
    total_changes = 0
    files_modified = 0
    
    for file_path in tsx_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        file_changes = 0
        
        # Aplicar traducciones
        for english, spanish in TRANSLATIONS.items():
            if english in content:
                count = content.count(english)
                content = content.replace(english, spanish)
                file_changes += count
        
        if content != original_content:
            files_modified += 1
            total_changes += file_changes
            print(f"✅ {file_path.name}: {file_changes} cambios")
            
            if not dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
    
    print("\n" + "=" * 80)
    print(f"📊 Archivos modificados: {files_modified}")
    print(f"📊 Total de cambios: {total_changes}")
    print("=" * 80)
    print("✅ TRADUCCIÓN COMPLETADA")
    print("=" * 80)

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Traducción segura de textos visibles')
    parser.add_argument('--dry-run', action='store_true', help='Muestra cambios sin aplicarlos')
    parser.add_argument('--dir', default='src/components', help='Directorio de componentes')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.dir):
        print(f"❌ Error: Directorio no encontrado: {args.dir}")
        exit(1)
    
    safe_translate(args.dir, args.dry_run)
