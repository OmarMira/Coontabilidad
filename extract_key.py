import re

try:
    with open('.env.local', 'rb') as f:
        content = f.read()
        # Intentar decodificar como UTF-16LE (común en PowerShell defaults)
        try:
            text = content.decode('utf-16-le')
        except:
            # Fallback a ASCII ignorando errores
            text = content.decode('latin-1', errors='ignore')
            # Limpiar nulos
            text = text.replace('\x00', '')

    # Buscar patrón de Google Client ID
    match = re.search(r'(\d+-[a-zA-Z0-9]+\.apps\.googleusercontent\.com)', text)
    
    if match:
        print(f"KEY_FOUND:{match.group(1)}")
    else:
        print("KEY_NOT_FOUND")
        # Imprimir fragmento para depurar
        print(f"DEBUG_DUMP:{text[:100]}")

except Exception as e:
    print(f"ERROR:{str(e)}")
