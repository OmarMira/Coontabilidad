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

def deep_merge(target, source):
    for key, value in source.items():
        if isinstance(value, dict):
            target.setdefault(key, {})
            deep_merge(target[key], value)
        else:
            target[key] = value

print("Unifying locales...")

en = load_json(path_en)
es = load_json(path_es) # assuming it's already mostly correct structure-wise

# TRANSFORM EN to match ES structure for specific blocks
# 1. accountingPeriods -> accounting.periods
if "accountingPeriods" in en:
    print("Moving accountingPeriods to accounting.periods in EN")
    if "accounting" not in en: en["accounting"] = {}
    if "periods" not in en["accounting"]: en["accounting"]["periods"] = {}
    
    # Merge content
    deep_merge(en["accounting"]["periods"], en["accountingPeriods"])
    del en["accountingPeriods"]

# 2. periodClosure -> accounting.closure
if "periodClosure" in en:
    print("Moving periodClosure to accounting.closure in EN")
    if "accounting" not in en: en["accounting"] = {}
    if "closure" not in en["accounting"]: en["accounting"]["closure"] = {}
    
    deep_merge(en["accounting"]["closure"], en["periodClosure"])
    del en["periodClosure"]

# 3. trialBalance -> accounting.trialBalance
if "trialBalance" in en:
    print("Moving trialBalance to accounting.trialBalance in EN")
    if "accounting" not in en: en["accounting"] = {}
    if "trialBalance" not in en["accounting"]: en["accounting"]["trialBalance"] = {}
    
    deep_merge(en["accounting"]["trialBalance"], en["trialBalance"])
    del en["trialBalance"]

# 4. Same for ES if needed (though user said ES was the template basically? or I should standardize both)
if "accountingPeriods" in es:
    print("Moving accountingPeriods to accounting.periods in ES")
    if "accounting" not in es: es["accounting"] = {}
    if "periods" not in es["accounting"]: es["accounting"]["periods"] = {}
    deep_merge(es["accounting"]["periods"], es["accountingPeriods"])
    del es["accountingPeriods"]

if "periodClosure" in es:
    print("Moving periodClosure to accounting.closure in ES")
    if "accounting" not in es: es["accounting"] = {}
    if "closure" not in es["accounting"]: es["accounting"]["closure"] = {}
    deep_merge(es["accounting"]["closure"], es["periodClosure"])
    del es["periodClosure"]
    
if "trialBalance" in es:
    print("Moving trialBalance to accounting.trialBalance in ES")
    if "accounting" not in es: es["accounting"] = {}
    if "trialBalance" not in es["accounting"]: es["accounting"]["trialBalance"] = {}
    deep_merge(es["accounting"]["trialBalance"], es["trialBalance"])
    del es["trialBalance"]


# SAVE
save_json(path_en, en)
save_json(path_es, es)
print("Locales unified.")
