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

def deep_merge_missing(target, source):
    # Only add keys that are missing in target
    for key, value in source.items():
        if key not in target:
            print(f"Adding missing key block: {key}")
            target[key] = value
        elif isinstance(value, dict) and isinstance(target[key], dict):
            deep_merge_missing(target[key], value)

print("Standardizing missing keys in EN from ES...")

en = load_json(path_en)
es = load_json(path_es)

# Especially check accounting namespace
if "accounting" in es and isinstance(es["accounting"], dict):
    if "accounting" not in en or not isinstance(en["accounting"], dict):
        # We ensured this in v2 script, but double check
        if "accounting" not in en: en["accounting"] = {}
        if not isinstance(en["accounting"], dict): en["accounting"] = {"label": en["accounting"]}
    
    # Merge keys from es accounting into en accounting
    print("Checking accounting namespace...")
    # Specifically target sub-blocks like incomeStatement, ledgerHub, journalEntry
    target_blocks = ["incomeStatement", "ledgerHub", "journalEntry", "trialBalance", "periods", "closure"]
    
    for block in target_blocks:
        if block in es["accounting"]:
            if block not in en["accounting"]:
                print(f"Copying missing block accounting.{block} to EN")
                en["accounting"][block] = es["accounting"][block]
            else:
                 # Check if keys are missing inside block
                 print(f"Merging missing keys inside accounting.{block}")
                 deep_merge_missing(en["accounting"][block], es["accounting"][block])

# Also check setup.settings refactoring.
# If es has settings at root (which it does), en should too.
if "settings" in es:
    if "settings" not in en:
        print("Copying root settings to EN")
        en["settings"] = es["settings"]
    else:
        deep_merge_missing(en["settings"], es["settings"])

# Also check security, maintenance
for root_key in ["security", "maintenance", "banking", "payroll"]:
    if root_key in es:
        if root_key not in en:
             print(f"Copying root {root_key} to EN")
             en[root_key] = es[root_key]
        else:
             deep_merge_missing(en[root_key], es[root_key])

save_json(path_en, en)
print("EN locales updated with missing structures.")
