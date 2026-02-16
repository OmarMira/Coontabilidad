
import json
import os

files = {
    'es': 'src/assets/locales/es.json',
    'en': 'src/assets/locales/en.json'
}

new_keys = {
    "forensic": {
        "title": { "es": "Suite de Auditoría Forense", "en": "Forensic Accounting Suite" },
        "subtitle": { "es": "AccountExpress Next-Gen • Edición Florida", "en": "AccountExpress Next-Gen • Florida Edition" },
        "version": { "es": "v2.0 Beta", "en": "v2.0 Beta" },
        "mvp": { "es": "MVP", "en": "MVP" },
        "secureEntry": { "es": "Entrada Segura de Transacciones", "en": "Secure Transaction Entry" },
        "complianceSecurity": { "es": "Cumplimiento y Seguridad", "en": "Compliance & Security" },
        "technicalStatus": { "es": "Estado Técnico", "en": "Technical Status" },
        "taxEngine": { "es": "Motor Fiscal Florida", "en": "Florida Tax Engine" },
        "online": { "es": "EN LÍNEA", "en": "ONLINE" },
        "ledger": { "es": "Libro Mayor Inmutable", "en": "Immutable Ledger" },
        "connected": { "es": "CONECTADO", "en": "CONNECTED" },
        "encryption": { "es": "Worker de Encriptación", "en": "Encryption Worker" },
        "active": { "es": "ACTIVO", "en": "ACTIVE" },
        "auditChain": {
            "title": { "es": "Seguridad de Cadena de Auditoría", "en": "Audit Chain Security" },
            "status": { "es": "Estado de la Cadena", "en": "Chain Status" },
            "verifying": { "es": "Verificando...", "en": "Verifying..." },
            "secure": { "es": "INMUTABLE Y SEGURO", "en": "IMMUTABLE & SECURE" },
            "unverified": { "es": "NO VERIFICADO", "en": "UNVERIFIED" },
            "verifyBtn": { "es": "Verificar Integridad", "en": "Verify Integrity" },
            "latestSeal": { "es": "Último Sello", "en": "Latest Seal" }
        },
        "backupWidget": {
            "title": { "es": "Respaldo y Restauración Segura", "en": "Secure Backup & Restore" },
            "backupBtn": { "es": "Respaldar", "en": "Backup" },
            "restoreBtn": { "es": "Restaurar", "en": "Restore" },
            "creating": { "es": "Creando respaldo encriptado...", "en": "Creating encrypted backup..." },
            "saved": { "es": "Respaldo guardado en: {path}", "en": "Backup saved to: {path}" },
            "failed": { "es": "Fallo de Respaldo", "en": "Backup Failed" },
            "reading": { "es": "Leyendo archivo de respaldo...", "en": "Reading backup file..." },
            "decrypting": { "es": "Desencriptando y Restaurando...", "en": "Decrypting and Restoring..." },
            "success": { "es": "¡Sistema restaurado exitosamente!", "en": "System successfully restored!" },
            "restoreFailed": { "es": "Fallo de Restauración: Archivo o contraseña inválida", "en": "Restore Failed: Invalid file or password" }
        },
        "taxCompliance": {
            "title": { "es": "Cumplimiento DR-15 Florida", "en": "Florida DR-15 Compliance" },
            "noReport": { "es": "No hay reporte generado para el período actual.", "en": "No report generated for current period." },
            "generateBtn": { "es": "Generar Reporte Mensual", "en": "Generate Monthly Report" },
            "taxableSales": { "es": "Ventas Gravables", "en": "Taxable Sales" },
            "taxDue": { "es": "Impuesto Adeudado", "en": "Tax Due" },
            "resetBtn": { "es": "Reiniciar Formulario", "en": "Reset Form" }
        }
    },
    "systemStatus": {
        "pass": { "es": "PASO", "en": "PASS" },
        "fail": { "es": "FALLO", "en": "FAIL" }
    }
}

def update_locales():
    for lang, path in files.items():
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Helper to merge keys
            def merge(target, source):
                for k, v in source.items():
                    if isinstance(v, dict) and "es" not in v: # It's a nested structure
                        if k not in target:
                            target[k] = {}
                        merge(target[k], v)
                    else: # It's a leaf node with translations
                        if k not in target or target[k] == k: # Update if missing or mirror (though looking at structure)
                             target[k] = v[lang]

            merge(data, new_keys)

            with open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Updated {path}")

        except Exception as e:
            print(f"Error updating {path}: {e}")

if __name__ == "__main__":
    update_locales()
