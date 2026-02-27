import json
import os

file_paths = [
    r'c:\Account Express\src\locales\es.json',
    r'c:\Account Express\src\locales\en.json'
]

navigation_es = {
    "dashboard": "Dashboard",
    "accounting": "Contabilidad",
    "sales": "Ventas y Clientes",
    "purchases": "Compras y Gastos",
    "inventory": "Inventario",
    "reports": "Reportes",
    "tools": "Herramientas",
    "configuration": "Configuración",
    "quarantine_audit": "Auditoría Forense",
    "logout": "Cerrar Sesión"
}

navigation_en = {
    "dashboard": "Dashboard",
    "accounting": "Accounting",
    "sales": "Sales & Customers",
    "purchases": "Purchases & Expenses",
    "inventory": "Inventory",
    "reports": "Reports",
    "tools": "Tools",
    "configuration": "Configuration",
    "quarantine_audit": "Forensic Audit",
    "logout": "Logout"
}

for path in file_paths:
    if os.path.exists(path):
        print(f"Processing {path}...")
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Merge or add
        if 'navigation' not in data:
            data['navigation'] = {}
        
        nav = navigation_es if 'es.json' in path else navigation_en
        for k, v in nav.items():
            if k not in data['navigation']:
                data['navigation'][k] = v
                
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {path}")
    else:
        print(f"File {path} not found")
