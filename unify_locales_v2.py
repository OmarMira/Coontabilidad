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

def ensure_dict(d, key):
    if key in d:
        if not isinstance(d[key], dict):
            print(f"Converting '{key}' from {type(d[key])} to dict (value was: {d[key]})")
            # Preserve the string value if possible?
            val = d[key]
            d[key] = {}
            # Maybe store old value in "title" or "label"?
            if isinstance(val, str):
                d[key]["label"] = val
    else:
        d[key] = {}

def deep_merge(target, source):
    for key, value in source.items():
        if isinstance(value, dict):
            target.setdefault(key, {})
            # If target[key] is not dict?? 
            if not isinstance(target[key], dict):
                 # Convert to dict and move value to label
                 old_val = target[key]
                 target[key] = {"label": old_val}
            
            deep_merge(target[key], value)
        else:
            target[key] = value

print("Unifying locales...")

en = load_json(path_en)
es = load_json(path_es) 

# Ensure 'accounting' root is dict in both
ensure_dict(en, "accounting")
ensure_dict(es, "accounting")

# 1. accountingPeriods -> accounting.periods
if "accountingPeriods" in en:
    print("Moving accountingPeriods to accounting.periods in EN")
    ensure_dict(en["accounting"], "periods")
    deep_merge(en["accounting"]["periods"], en["accountingPeriods"])
    del en["accountingPeriods"]

# 2. periodClosure -> accounting.closure
if "periodClosure" in en:
    print("Moving periodClosure to accounting.closure in EN")
    ensure_dict(en["accounting"], "closure")
    deep_merge(en["accounting"]["closure"], en["periodClosure"])
    del en["periodClosure"]

# 3. trialBalance -> accounting.trialBalance
if "trialBalance" in en:
    print("Moving trialBalance to accounting.trialBalance in EN")
    ensure_dict(en["accounting"], "trialBalance")
    deep_merge(en["accounting"]["trialBalance"], en["trialBalance"])
    del en["trialBalance"]

# 4. Same for ES
if "accountingPeriods" in es:
    print("Moving accountingPeriods to accounting.periods in ES")
    ensure_dict(es["accounting"], "periods")
    deep_merge(es["accounting"]["periods"], es["accountingPeriods"])
    del es["accountingPeriods"]

if "periodClosure" in es:
    print("Moving periodClosure to accounting.closure in ES")
    ensure_dict(es["accounting"], "closure")
    deep_merge(es["accounting"]["closure"], es["periodClosure"])
    del es["periodClosure"]
    
if "trialBalance" in es:
    print("Moving trialBalance to accounting.trialBalance in ES")
    ensure_dict(es["accounting"], "trialBalance")
    deep_merge(es["accounting"]["trialBalance"], es["trialBalance"])
    del es["trialBalance"]


# SAVE
save_json(path_en, en)
save_json(path_es, es)
print("Locales unified.")
