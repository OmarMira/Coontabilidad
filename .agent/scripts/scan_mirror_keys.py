
import json
import sys

def scan_mirror_keys(es_path, en_path):
    try:
        with open(es_path, 'r', encoding='utf-8') as f:
            es_data = json.load(f)
        with open(en_path, 'r', encoding='utf-8') as f:
            en_data = json.load(f)

        found_count = 0

        def traverse(es_obj, en_obj, prefix=''):
            nonlocal found_count
            for k, v in es_obj.items():
                full_key = f"{prefix}.{k}" if prefix else k
                
                if isinstance(v, dict):
                    if k in en_obj and isinstance(en_obj[k], dict):
                        traverse(v, en_obj[k], full_key)
                elif isinstance(v, str):
                    # Check for mirror key pattern
                    # "key": "key" OR "nested.key": "nested.key"
                    if v == k or v == full_key:
                        en_val = en_obj.get(k, "MISSING_IN_EN")
                        print(f"MIRROR_KEY: {full_key} ||| EN: {en_val}")
                        found_count += 1

        traverse(es_data, en_data)
        print(f"Total mirror keys found: {found_count}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        scan_mirror_keys(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python scan_mirror_keys.py <es_json> <en_json>")
