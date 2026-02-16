
import json
import sys

def find_mirror_keys(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        mirror_keys = []
        
        def traverse(obj, prefix=''):
            for k, v in obj.items():
                full_key = f"{prefix}.{k}" if prefix else k
                if isinstance(v, dict):
                    traverse(v, full_key)
                elif isinstance(v, str):
                    # Check if value equals the last part of the key or the full key
                    # The prompt says "value equals the key" (e.g., "field.name": "field.name")
                    # However, typical i18n key might be "field.name", and value "field.name"
                    if v == k or v == full_key:
                        mirror_keys.append((full_key, v))

        traverse(data)
        
        print(f"Found {len(mirror_keys)} mirror keys.")
        for k, v in mirror_keys:
            print(f"{k}: {v}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        find_mirror_keys(sys.argv[1])
    else:
        print("Usage: python find_mirror_keys.py <path_to_json>")
