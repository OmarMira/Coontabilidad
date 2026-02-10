"""
Script de Traducción Automatizada
Traduce automáticamente todos los textos en inglés a español en archivos .tsx
"""

import os
import re
import shutil
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Tuple

# Diccionario de traducciones (sincronizado con translations.ts)
TRANSLATIONS = {
    # Acciones
    'Loading': 'Cargando',
    'Processing': 'Procesando',
    'Save': 'Guardar',
    'Cancel': 'Cancelar',
    'Delete': 'Eliminar',
    'Edit': 'Editar',
    'Add': 'Agregar',
    'Create': 'Crear',
    'Update': 'Actualizar',
    'Search': 'Buscar',
    'Filter': 'Filtrar',
    'Export': 'Exportar',
    'Import': 'Importar',
    'Print': 'Imprimir',
    'Download': 'Descargar',
    'Upload': 'Subir',
    'Back': 'Volver',
    'Next': 'Siguiente',
    'Previous': 'Anterior',
    'Close': 'Cerrar',
    'Open': 'Abrir',
    'View': 'Ver',
    'Details': 'Detalles',
    'Refresh': 'Actualizar',
    'Reload': 'Recargar',
    'Clear': 'Limpiar',
    'Reset': 'Restablecer',
    'Remove': 'Quitar',
    
    # Formularios
    'Select': 'Seleccionar',
    'Select All': 'Seleccionar Todo',
    'Select None': 'Deseleccionar Todo',
    'Select Customer': 'Seleccionar Cliente',
    'Select Product': 'Seleccionar Producto',
    'Select Supplier': 'Seleccionar Proveedor',
    'Yes': 'Sí',
    'No': 'No',
    'Ok': 'Aceptar',
    'Confirm': 'Confirmar',
    'Submit': 'Enviar',
    
    # Entidades
    'Customer': 'Cliente',
    'Customers': 'Clientes',
    'Supplier': 'Proveedor',
    'Suppliers': 'Proveedores',
    'Product': 'Producto',
    'Products': 'Productos',
    'Service': 'Servicio',
    'Services': 'Servicios',
    'Invoice': 'Factura',
    'Invoices': 'Facturas',
    'Bill': 'Factura de Compra',
    'Bills': 'Facturas de Compra',
    'Payment': 'Pago',
    'Payments': 'Pagos',
    'Receipt': 'Recibo',
    'Receipts': 'Recibos',
    'Order': 'Orden',
    'Orders': 'Órdenes',
    'Quote': 'Cotización',
    'Quotes': 'Cotizaciones',
    'User': 'Usuario',
    'Users': 'Usuarios',
    
    # Campos
    'Name': 'Nombre',
    'Description': 'Descripción',
    'Quantity': 'Cantidad',
    'Qty': 'Cant',
    'Price': 'Precio',
    'Unit Price': 'Precio Unitario',
    'Amount': 'Monto',
    'Subtotal': 'Subtotal',
    'Tax': 'Impuesto',
    'Discount': 'Descuento',
    'Grand Total': 'Total General',
    'Date': 'Fecha',
    'Time': 'Hora',
    'Address': 'Dirección',
    'Phone': 'Teléfono',
    'Password': 'Contraseña',
    'Username': 'Usuario',
    'Notes': 'Notas',
    'Comments': 'Comentarios',
    'Attachments': 'Adjuntos',
    'Files': 'Archivos',
    'Images': 'Imágenes',
    'Documents': 'Documentos',
    
    # Estados
    'Status': 'Estado',
    'Active': 'Activo',
    'Inactive': 'Inactivo',
    'Pending': 'Pendiente',
    'Approved': 'Aprobado',
    'Rejected': 'Rechazado',
    'Draft': 'Borrador',
    'Completed': 'Completado',
    'Failed': 'Fallido',
    'Cancelled': 'Cancelado',
    'Confirmed': 'Confirmado',
    
    # Navegación
    'Dashboard': 'Panel de Control',
    'Home': 'Inicio',
    'Reports': 'Reportes',
    'Settings': 'Configuración',
    'Profile': 'Perfil',
    'Help': 'Ayuda',
    'Logout': 'Cerrar Sesión',
    'Login': 'Iniciar Sesión',
    
    # Mensajes
    'Warning': 'Advertencia',
    'Info': 'Información',
    'Success': 'Éxito',
    'No data available': 'No hay datos disponibles',
    'Are you sure?': '¿Está seguro?',
    'Please wait...': 'Por favor espere...',
    'No results found': 'No se encontraron resultados',
    
    # Frases específicas
    'Audit Trail': 'Trazabilidad',
    'New Sale': 'Nueva Venta',
    'Process Sale': 'Procesar Venta',
    'Add Line': 'Agregar Línea',
    'Tax Jurisdiction': 'Jurisdicción Fiscal',
    'County': 'Condado',
    'Item': 'Artículo',
    'Items': 'Artículos',
    'Line Total': 'Total Línea',
    
    # Placeholders comunes
    'Search...': 'Buscar...',
    'Select...': 'Seleccionar...',
    'Enter description': 'Ingrese descripción',
    'Enter quantity': 'Ingrese cantidad',
    'Enter price': 'Ingrese precio',
    'Enter notes...': 'Ingrese notas...',
}

class AutoTranslator:
    def __init__(self, components_dir: str, dry_run: bool = False, backup: bool = True):
        self.components_dir = Path(components_dir)
        self.dry_run = dry_run
        self.backup = backup
        self.backup_dir = Path(components_dir).parent / '.translation_backups' / datetime.now().strftime('%Y%m%d_%H%M%S')
        self.changes_log = []
        
    def create_backup(self, file_path: Path):
        """Crea backup del archivo"""
        if not self.backup:
            return
        
        relative_path = file_path.relative_to(self.components_dir)
        backup_path = self.backup_dir / relative_path
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file_path, backup_path)
        
    def translate_content(self, content: str) -> Tuple[str, List[str]]:
        """Traduce el contenido del archivo"""
        changes = []
        modified_content = content
        
        # Ordenar por longitud descendente para evitar reemplazos parciales
        sorted_translations = sorted(TRANSLATIONS.items(), key=lambda x: len(x[0]), reverse=True)
        
        for english, spanish in sorted_translations:
            # Buscar en textos entre > y <
            pattern = rf'(\>)([^<]*?)({re.escape(english)})([^<]*?)(\<)'
            matches = list(re.finditer(pattern, modified_content, re.IGNORECASE))
            
            if matches:
                count = len(matches)
                # Reemplazar preservando el case
                for match in reversed(matches):  # Reverse para no afectar índices
                    original = match.group(3)
                    # Preservar capitalización
                    if original.isupper():
                        replacement = spanish.upper()
                    elif original.istitle():
                        replacement = spanish.title()
                    else:
                        replacement = spanish
                    
                    start = match.start(3)
                    end = match.end(3)
                    modified_content = modified_content[:start] + replacement + modified_content[end:]
                
                changes.append(f"  ✅ '{english}' → '{spanish}' ({count} veces)")
        
        return modified_content, changes
    
    def translate_file(self, file_path: Path) -> Dict:
        """Traduce un archivo individual"""
        print(f"\n📄 Procesando: {file_path.relative_to(self.components_dir)}")
        
        # Leer contenido
        with open(file_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Traducir
        translated_content, changes = self.translate_content(original_content)
        
        # Verificar si hubo cambios
        if translated_content == original_content:
            print("  ℹ️  No requiere traducción")
            return {
                'file': str(file_path.relative_to(self.components_dir)),
                'status': 'skipped',
                'changes': []
            }
        
        # Mostrar cambios
        for change in changes:
            print(change)
        
        # Aplicar cambios si no es dry-run
        if not self.dry_run:
            self.create_backup(file_path)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(translated_content)
            print("  ✅ Traducción aplicada")
            status = 'translated'
        else:
            print("  ⚠️  DRY RUN - Cambios NO aplicados")
            status = 'dry_run'
        
        return {
            'file': str(file_path.relative_to(self.components_dir)),
            'status': status,
            'changes': changes
        }
    
    def run(self):
        """Ejecuta la traducción en todos los archivos"""
        print("=" * 80)
        print("🌐 TRADUCCIÓN AUTOMATIZADA - INGLÉS → ESPAÑOL")
        print("=" * 80)
        print(f"📁 Directorio: {self.components_dir}")
        print(f"🔧 Modo: {'DRY RUN' if self.dry_run else 'PRODUCTION'}")
        print(f"💾 Backup: {'Sí' if self.backup else 'No'}")
        print("=" * 80)
        
        # Encontrar archivos .tsx
        exclude_dirs = {'elite', 'ui', 'node_modules', '.git', 'i18n'}
        tsx_files = []
        
        for root, dirs, files in os.walk(self.components_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file.endswith('.tsx'):
                    tsx_files.append(Path(root) / file)
        
        print(f"\n📊 Archivos encontrados: {len(tsx_files)}")
        
        # Traducir archivos
        results = []
        for file_path in tsx_files:
            result = self.translate_file(file_path)
            results.append(result)
        
        # Generar reporte
        self.generate_report(results)
    
    def generate_report(self, results: List[Dict]):
        """Genera reporte de traducción"""
        print("\n" + "=" * 80)
        print("📊 REPORTE DE TRADUCCIÓN")
        print("=" * 80)
        
        translated = [r for r in results if r['status'] == 'translated']
        skipped = [r for r in results if r['status'] == 'skipped']
        dry_run = [r for r in results if r['status'] == 'dry_run']
        
        print(f"\n✅ Archivos traducidos: {len(translated)}")
        print(f"⏭️  Archivos sin cambios: {len(skipped)}")
        if dry_run:
            print(f"⚠️  Archivos en dry-run: {len(dry_run)}")
        
        print(f"\n📊 Total de archivos procesados: {len(results)}")
        
        if self.backup and not self.dry_run:
            print(f"💾 Backups guardados en: {self.backup_dir}")
        
        print("\n" + "=" * 80)
        print("✅ TRADUCCIÓN COMPLETADA")
        print("=" * 80)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Traduce componentes de inglés a español')
    parser.add_argument('--dry-run', action='store_true', help='Muestra cambios sin aplicarlos')
    parser.add_argument('--no-backup', action='store_true', help='No crear backups')
    parser.add_argument('--dir', default='src/components', help='Directorio de componentes')
    
    args = parser.parse_args()
    
    components_dir = args.dir
    if not os.path.exists(components_dir):
        print(f"❌ Error: Directorio no encontrado: {components_dir}")
        return
    
    translator = AutoTranslator(
        components_dir=components_dir,
        dry_run=args.dry_run,
        backup=not args.no_backup
    )
    
    translator.run()


if __name__ == '__main__':
    main()
