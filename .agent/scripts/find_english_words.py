"""
Script para encontrar TODAS las palabras en inglés en textos visibles
de los componentes React (.tsx)
"""

import os
import re
from pathlib import Path
from typing import List, Dict

# Palabras en inglés comunes que NO deben aparecer en textos visibles
ENGLISH_WORDS = [
    # Acciones
    'Loading', 'Error', 'Success', 'Delete', 'Edit', 'Save', 'Cancel', 'Submit',
    'Create', 'Update', 'Search', 'Filter', 'Export', 'Import', 'Print',
    'Download', 'Upload', 'Back', 'Next', 'Previous', 'Close', 'Open', 'View',
    'Details', 'Add', 'Remove', 'Clear', 'Reset', 'Refresh', 'Reload',
    
    # Estados
    'Status', 'Active', 'Inactive', 'Pending', 'Approved', 'Rejected', 'Draft',
    'Processing', 'Completed', 'Failed', 'Cancelled', 'Confirmed',
    
    # Formularios
    'Select', 'All', 'None', 'Yes', 'No', 'Ok', 'Confirm', 'Warning', 'Info',
    'Help', 'Settings', 'Profile', 'Logout', 'Login', 'Register', 'Forgot',
    'Password', 'Email', 'Username', 'Name', 'Address', 'Phone', 'Date', 'Time',
    
    # Datos
    'Amount', 'Price', 'Quantity', 'Description', 'Notes', 'Comments',
    'Attachments', 'Files', 'Images', 'Documents', 'Reports', 'Dashboard',
    
    # Navegación
    'Home', 'Customers', 'Suppliers', 'Products', 'Services', 'Invoices',
    'Bills', 'Payments', 'Receipts', 'Orders', 'Quotes', 'Contracts', 'Projects',
    'Tasks', 'Events', 'Calendar', 'Messages', 'Notifications', 'Alerts',
    
    # Frases
    'Audit Trail', 'New Sale', 'Process Sale', 'Add Line', 'Select Customer',
    'Select Product', 'Tax Jurisdiction', 'User', 'Customer', 'Supplier',
    'Product', 'Invoice', 'Bill', 'Payment', 'Receipt', 'Order', 'Quote',
    'Item', 'Items', 'Total', 'Subtotal', 'Tax', 'Discount', 'Grand Total',
    'Unit Price', 'Line Total', 'Qty', 'Quantity'
]

# Excepciones: palabras que son iguales en inglés y español
EXCEPTIONS = ['Total', 'Error', 'Email', 'ID']

def find_english_in_tsx(components_dir: str) -> List[Dict]:
    """Encuentra palabras en inglés en archivos .tsx"""
    results = []
    exclude_dirs = {'elite', 'ui', 'node_modules', '.git'}
    
    # Crear patrón regex para buscar palabras en inglés
    # Solo buscar en contenido entre > y < (texto visible)
    words_to_find = [w for w in ENGLISH_WORDS if w not in EXCEPTIONS]
    pattern = re.compile(r'\>([^<]*(' + '|'.join(words_to_find) + r')[^<]*)\<', re.IGNORECASE)
    
    for root, dirs, files in os.walk(components_dir):
        # Excluir directorios
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if file.endswith('.tsx'):
                filepath = Path(root) / file
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        for line_num, line in enumerate(f, 1):
                            # Buscar solo en contenido entre tags
                            matches = pattern.findall(line)
                            if matches:
                                for match in matches:
                                    full_text = match[0].strip()
                                    word_found = match[1]
                                    
                                    results.append({
                                        'file': str(filepath.relative_to(components_dir)),
                                        'line': line_num,
                                        'word': word_found,
                                        'context': full_text[:100]
                                    })
                except Exception as e:
                    print(f"Error leyendo {filepath}: {e}")
    
    return results

def main():
    components_dir = 'src/components'
    
    if not os.path.exists(components_dir):
        print(f"❌ Directorio no encontrado: {components_dir}")
        return
    
    print("🔍 Buscando palabras en inglés en textos visibles...")
    print("=" * 80)
    
    results = find_english_in_tsx(components_dir)
    
    if not results:
        print("✅ No se encontraron palabras en inglés en textos visibles")
        return
    
    # Agrupar por archivo
    by_file = {}
    for r in results:
        file = r['file']
        if file not in by_file:
            by_file[file] = []
        by_file[file].append(r)
    
    print(f"\n❌ Se encontraron {len(results)} palabras en inglés en {len(by_file)} archivos\n")
    
    for file, items in sorted(by_file.items()):
        print(f"\n📄 {file}")
        print("-" * 80)
        for item in items:
            print(f"  Línea {item['line']}: '{item['word']}' en: {item['context']}")
    
    print("\n" + "=" * 80)
    print(f"Total: {len(results)} palabras en inglés encontradas")

if __name__ == '__main__':
    main()
