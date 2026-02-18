import json
import os

files = [
    r"src\assets\locales\en.json",
    r"src\assets\locales\es.json"
]

def fix_structure():
    for path in files:
        if not os.path.exists(path):
            continue
            
        print(f"Processing {path}...")
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error loading {path}: {e}")
            continue

        # HELPER: Move key from source_dict to root
        def move_to_root(source_parent, key):
            if key in source_parent:
                print(f"  Moving {key} to root")
                if key not in data:
                    data[key] = source_parent[key]
                else:
                    # Merge logic
                    if isinstance(data[key], dict) and isinstance(source_parent[key], dict):
                        data[key].update(source_parent[key])
                    else:
                        # Overwrite if not merged
                        data[key] = source_parent[key]
                
                # Remove from source
                del source_parent[key]

        # 1. Inspect 'setup'
        if "setup" in data and isinstance(data["setup"], dict):
            # Keys to extract from setup
            targets = ["security", "maintenance", "settings", "banking", "payroll", "accounting"]
            for t in targets:
                move_to_root(data["setup"], t)
                
        # 2. Inspect 'modules'
        if "modules" in data and isinstance(data["modules"], dict):
            targets = ["security", "maintenance", "settings", "banking", "payroll", "accounting"]
            for t in targets:
                move_to_root(data["modules"], t)

        # 3. Ensure 'common' exists
        if "common" not in data:
             pass # potentially fatal if missing, but we assume it exists somewhere

        # 4. Sort keys for consistency
        sorted_data = {k: data[k] for k in sorted(data)}
        
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(sorted_data, f, indent=2, ensure_ascii=False)
        print(f"Saved {path}")

fix_structure()
