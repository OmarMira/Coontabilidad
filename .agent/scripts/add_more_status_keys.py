
import json

new_keys_es = {
    "systemStatus": {
        "verifying": "Verificando estado del sistema...",
        "passed": "Pasados",
        "failed": "Fallidos",
        "verificationDetails": "Detalles de Verificación",
        "lastVerification": "Última verificación:",
        "viewJson": "Ver JSON (para monitoreo externo)"
    }
}

new_keys_en = {
    "systemStatus": {
        "verifying": "Verifying system status...",
        "passed": "Passed",
        "failed": "Failed",
        "verificationDetails": "Verification Details",
        "lastVerification": "Last verification:",
        "viewJson": "View JSON (for external monitoring)"
    }
}

def update_json(file_path, new_keys):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        def merge(target, source):
            for k, v in source.items():
                if isinstance(v, dict):
                    if k not in target:
                        target[k] = {}
                    merge(target[k], v)
                else:
                    target[k] = v
        
        merge(data, new_keys)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {file_path}")
            
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

update_json("src/assets/locales/es.json", new_keys_es)
update_json("src/assets/locales/en.json", new_keys_en)
