"""
ELITE DESIGN SYSTEM - AUTOMATED MIGRATION SCRIPT
Migra automáticamente todas las páginas al estándar elite.

Uso:
    python migrate_to_elite.py [--dry-run] [--backup]

Opciones:
    --dry-run    Muestra los cambios sin aplicarlos
    --backup     Crea backup de archivos antes de modificar
"""

import os
import re
import shutil
from pathlib import Path
from typing import List, Tuple, Dict
import json
from datetime import datetime

class EliteMigrator:
    def __init__(self, components_dir: str, dry_run: bool = False, backup: bool = True):
        self.components_dir = Path(components_dir)
        self.dry_run = dry_run
        self.backup = backup
        self.changes_log = []
        self.backup_dir = Path(components_dir).parent / '.migration_backups' / datetime.now().strftime('%Y%m%d_%H%M%S')
        
    def find_tsx_files(self) -> List[Path]:
        """Encuentra todos los archivos .tsx en el directorio de componentes."""
        tsx_files = []
        exclude_dirs = {'elite', 'ui', 'node_modules', '.git'}
        
        for root, dirs, files in os.walk(self.components_dir):
            # Excluir directorios específicos
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file.endswith('.tsx'):
                    tsx_files.append(Path(root) / file)
        
        return tsx_files
    
    def create_backup(self, file_path: Path):
        """Crea un backup del archivo."""
        if not self.backup:
            return
        
        relative_path = file_path.relative_to(self.components_dir)
        backup_path = self.backup_dir / relative_path
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file_path, backup_path)
        print(f"  📦 Backup creado: {backup_path}")
    
    def apply_color_transformations(self, content: str) -> Tuple[str, List[str]]:
        """Aplica transformaciones de colores gray-* → slate-*."""
        changes = []
        
        # Mapeo de colores
        color_map = {
            'text-gray-300': 'text-slate-400',
            'text-gray-400': 'text-slate-500',
            'text-gray-500': 'text-slate-600',
            'text-gray-600': 'text-slate-700',
            'bg-gray-700': 'bg-white/5',
            'bg-gray-800': 'bg-white/10',
            'bg-gray-900': 'bg-slate-900',
            'border-gray-600': 'border-white/10',
            'border-gray-700': 'border-white/10',
            'border-gray-800': 'border-white/5',
        }
        
        for old_color, new_color in color_map.items():
            if old_color in content:
                count = content.count(old_color)
                content = content.replace(old_color, new_color)
                changes.append(f"  🎨 {old_color} → {new_color} ({count} veces)")
        
        return content, changes
    
    def apply_typography_transformations(self, content: str) -> Tuple[str, List[str]]:
        """Aplica transformaciones de tipografía."""
        changes = []
        
        # Headers de tabla: text-xs font-medium → text-[10px] font-black uppercase tracking-[0.2em]
        pattern_table_header = r'className="([^"]*?)text-xs font-medium([^"]*?)"'
        matches = re.findall(pattern_table_header, content)
        if matches:
            content = re.sub(
                pattern_table_header,
                r'className="\1text-[10px] font-black uppercase tracking-[0.2em]\2"',
                content
            )
            changes.append(f"  📝 Headers de tabla actualizados ({len(matches)} encontrados)")
        
        # Títulos H1: text-2xl font-bold → text-2xl font-black tracking-tight
        if 'text-2xl font-bold' in content:
            count = content.count('text-2xl font-bold')
            content = content.replace('text-2xl font-bold', 'text-2xl font-black tracking-tight')
            changes.append(f"  📝 H1 actualizado: font-bold → font-black tracking-tight ({count} veces)")
        
        # Títulos H2: text-xl font-bold → text-xl font-black tracking-tight
        if 'text-xl font-bold' in content:
            count = content.count('text-xl font-bold')
            content = content.replace('text-xl font-bold', 'text-xl font-black tracking-tight')
            changes.append(f"  📝 H2 actualizado: font-bold → font-black tracking-tight ({count} veces)")
        
        # Títulos H3: text-lg font-medium → text-lg font-black tracking-tight
        if 'text-lg font-medium' in content:
            count = content.count('text-lg font-medium')
            content = content.replace('text-lg font-medium', 'text-lg font-black tracking-tight')
            changes.append(f"  📝 H3 actualizado: font-medium → font-black tracking-tight ({count} veces)")
        
        return content, changes
    
    def apply_class_replacements(self, content: str) -> Tuple[str, List[str]]:
        """Aplica reemplazos de clases CSS."""
        changes = []
        
        # Reemplazar clases comunes con clases elite
        class_map = {
            'text-sm text-gray-300': 'elite-text',
            'text-xs text-gray-400': 'elite-text-small',
            'text-xs text-gray-500': 'elite-text-small',
        }
        
        for old_class, new_class in class_map.items():
            if old_class in content:
                count = content.count(old_class)
                content = content.replace(old_class, new_class)
                changes.append(f"  🔄 {old_class} → {new_class} ({count} veces)")
        
        return content, changes
    
    def migrate_file(self, file_path: Path) -> Dict:
        """Migra un archivo individual."""
        print(f"\n📄 Procesando: {file_path.relative_to(self.components_dir)}")
        
        # Leer contenido
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        content = original_content
        all_changes = []
        
        # Aplicar transformaciones
        content, color_changes = self.apply_color_transformations(content)
        all_changes.extend(color_changes)
        
        content, typo_changes = self.apply_typography_transformations(content)
        all_changes.extend(typo_changes)
        
        content, class_changes = self.apply_class_replacements(content)
        all_changes.extend(class_changes)
        
        # Verificar si hubo cambios
        if content == original_content:
            print("  ✅ No requiere cambios (ya está estandarizado)")
            return {
                'file': str(file_path.relative_to(self.components_dir)),
                'status': 'skipped',
                'changes': []
            }
        
        # Mostrar cambios
        for change in all_changes:
            print(change)
        
        # Aplicar cambios si no es dry-run
        if not self.dry_run:
            self.create_backup(file_path)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("  ✅ Cambios aplicados")
            status = 'migrated'
        else:
            print("  ⚠️  DRY RUN - Cambios NO aplicados")
            status = 'dry_run'
        
        return {
            'file': str(file_path.relative_to(self.components_dir)),
            'status': status,
            'changes': all_changes
        }
    
    def run(self):
        """Ejecuta la migración en todos los archivos."""
        print("=" * 80)
        print("🎨 ELITE DESIGN SYSTEM - AUTOMATED MIGRATION")
        print("=" * 80)
        print(f"📁 Directorio: {self.components_dir}")
        print(f"🔧 Modo: {'DRY RUN' if self.dry_run else 'PRODUCTION'}")
        print(f"💾 Backup: {'Sí' if self.backup else 'No'}")
        print("=" * 80)
        
        # Encontrar archivos
        tsx_files = self.find_tsx_files()
        print(f"\n📊 Archivos encontrados: {len(tsx_files)}")
        
        # Migrar archivos
        results = []
        for file_path in tsx_files:
            result = self.migrate_file(file_path)
            results.append(result)
            self.changes_log.append(result)
        
        # Generar reporte
        self.generate_report(results)
    
    def generate_report(self, results: List[Dict]):
        """Genera un reporte de la migración."""
        print("\n" + "=" * 80)
        print("📊 REPORTE DE MIGRACIÓN")
        print("=" * 80)
        
        migrated = [r for r in results if r['status'] == 'migrated']
        skipped = [r for r in results if r['status'] == 'skipped']
        dry_run = [r for r in results if r['status'] == 'dry_run']
        
        print(f"\n✅ Archivos migrados: {len(migrated)}")
        print(f"⏭️  Archivos sin cambios: {len(skipped)}")
        if dry_run:
            print(f"⚠️  Archivos en dry-run: {len(dry_run)}")
        
        print(f"\n📊 Total de archivos procesados: {len(results)}")
        
        # Guardar reporte JSON
        report_path = self.components_dir.parent / 'migration_report.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_files': len(results),
                'migrated': len(migrated),
                'skipped': len(skipped),
                'dry_run': len(dry_run),
                'results': results
            }, f, indent=2)
        
        print(f"\n📄 Reporte guardado en: {report_path}")
        
        if self.backup and not self.dry_run:
            print(f"💾 Backups guardados en: {self.backup_dir}")
        
        print("\n" + "=" * 80)
        print("✅ MIGRACIÓN COMPLETADA")
        print("=" * 80)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Migra componentes al Elite Design System')
    parser.add_argument('--dry-run', action='store_true', help='Muestra cambios sin aplicarlos')
    parser.add_argument('--no-backup', action='store_true', help='No crear backups')
    parser.add_argument('--dir', default='src/components', help='Directorio de componentes')
    
    args = parser.parse_args()
    
    components_dir = args.dir
    if not os.path.exists(components_dir):
        print(f"❌ Error: Directorio no encontrado: {components_dir}")
        return
    
    migrator = EliteMigrator(
        components_dir=components_dir,
        dry_run=args.dry_run,
        backup=not args.no_backup
    )
    
    migrator.run()


if __name__ == '__main__':
    main()
