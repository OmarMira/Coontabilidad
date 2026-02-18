import json
import os

path_en = 'src/assets/locales/en.json'
path_es = 'src/assets/locales/es.json'

def load_json(p):
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(p, data):
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def deep_merge_missing(target, source, path=""):
    if not isinstance(source, dict):
        print(f"Skipping merge for non-dict source at {path}: {type(source)}")
        return
    if not isinstance(target, dict):
        print(f"Skipping merge for non-dict target at {path}: {type(target)}")
        return

    for key, value in source.items():
        if key not in target:
            # print(f"Adding missing key: {path}.{key}")
            target[key] = value
        elif isinstance(value, dict) and isinstance(target[key], dict):
            deep_merge_missing(target[key], value, f"{path}.{key}")

print("Standardizing missing keys in EN from ES...")

en = load_json(path_en)
es = load_json(path_es)

if "accounting" in es and isinstance(es["accounting"], dict):
    if "accounting" not in en: en["accounting"] = {}
    if not isinstance(en["accounting"], dict): en["accounting"] = {"label": en["accounting"]}
    
    target_blocks = ["incomeStatement", "ledgerHub", "journalEntry", "trialBalance", "periods", "closure"]
    
    for block in target_blocks:
        if block in es["accounting"]:
            if block not in en["accounting"]:
                print(f"Copying missing block accounting.{block} to EN")
                en["accounting"][block] = es["accounting"][block]
            else:
                 print(f"Merging missing keys inside accounting.{block}")
                 deep_merge_missing(en["accounting"][block], es["accounting"][block], f"accounting.{block}")

# Root checks
for root_key in ["settings", "security", "maintenance", "banking", "payroll"]:
    if root_key in es:
        if root_key not in en:
             print(f"Copying root {root_key} to EN")
             en[root_key] = es[root_key]
        else:
             print(f"Merging missing keys inside {root_key}")
             deep_merge_missing(en[root_key], es[root_key], root_key)

save_json(path_en, en)
print("EN locales updated.")
