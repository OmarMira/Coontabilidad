
import json
import os


files = ["src/assets/locales/es.json", "src/assets/locales/en.json"]

new_keys_es = {
    "systemStatus": {
        "loading": "Cargando estado del sistema...",
        "title": "Estado del Sistema",
        "lastUpdate": "Última actualización:",
        "autoRefresh": "Auto-actualizar",
        "repairAll": "Reparar Todo",
        "repairing": "Reparando...",
        "generalStatus": "Estado General",
        "status": {
            "healthy": "Saludable",
            "degraded": "Degradado",
            "critical": "Crítico"
        },
        "passedChecks": "Checks Exitosos",
        "failedChecks": "Checks Fallidos",
        "warnings": "Advertencias",
        "responseTime": "Tiempo Respuesta",
        "integrityChecks": "Verificaciones de Integridad",
        "totalChecksSuffix": "checks totales",
        "systemInfo": "Información del Sistema",
        "version": "Versión",
        "timestamp": "Timestamp",
        "totalChecksLabel": "Total Checks",
        "performanceMetrics": "Métricas de Rendimiento",
        "verificationTime": "Tiempo de Verificación",
        "successRate": "Tasa de Éxito",
        "criticalFailures": "Checks Críticos Fallidos"
    },
    "common": {
        "retry": "Reintentar",
        "refresh": "Actualizar",
        "error": "Error"
    }
}

new_keys_en = {
    "systemStatus": {
        "loading": "Loading system status...",
        "title": "System Status",
        "lastUpdate": "Last update:",
        "autoRefresh": "Auto-refresh",
        "repairAll": "Repair All",
        "repairing": "Repairing...",
        "generalStatus": "General Status",
        "status": {
            "healthy": "Healthy",
            "degraded": "Degraded",
            "critical": "Critical"
        },
        "passedChecks": "Passed Checks",
        "failedChecks": "Failed Checks",
        "warnings": "Warnings",
        "responseTime": "Response Time",
        "integrityChecks": "Integrity Checks",
        "totalChecksSuffix": "total checks",
        "systemInfo": "System Information",
        "version": "Version",
        "timestamp": "Timestamp",
        "totalChecksLabel": "Total Checks",
        "performanceMetrics": "Performance Metrics",
        "verificationTime": "Verification Time",
        "successRate": "Success Rate",
        "criticalFailures": "Critical Failures"
    },
    "common": {
        "retry": "Retry",
        "refresh": "Refresh",
        "error": "Error"
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
                    if not isinstance(target[k], dict):
                         # If target exist and is string, convert to dict or warn
                         # In this case we assume no conflict or overwrite
                         target[k] = {}
                    merge(target[k], v)
                else:
                    # If key doesn't exist, set it
                    if k not in target:
                        target[k] = v
                    # Optional: Overwrite if you want to enforce these new values
                    # target[k] = v 
        
        merge(data, new_keys)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {file_path}")
            
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

update_json("src/assets/locales/es.json", new_keys_es)
update_json("src/assets/locales/en.json", new_keys_en)
