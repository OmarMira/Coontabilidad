
import json

def inspect_accounting_keys(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        found = []
        for k, v in data.items():
            if k.startswith("accounting"):
                found.append((k, type(v).__name__))
            if isinstance(v, dict):
                for k2, v2 in v.items():
                    if k2.startswith("accounting"):
                        found.append((f"{k}.{k2}", type(v2).__name__))

        print("Found keys starting with 'accounting':")
        for k, t in found:
            print(f"- {k} ({t})")

    except Exception as e:
        print(f"Error: {e}")

inspect_accounting_keys("src/assets/locales/es.json")
