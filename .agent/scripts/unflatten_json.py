
import json
import os
import re

files = [
    'src/assets/locales/es.json',
    'src/assets/locales/en.json'
]

def to_camel_case(text):
    s = text.replace("-", " ").replace("_", " ")
    s = s.split()
    if len(text) == 0:
        return text
    return s[0].lower() + ''.join(i.capitalize() for i in s[1:])

def smart_key_conversion(key):
    # If key is all uppercase, convert to camelCase or lowercase
    if key.isupper() and "." not in key:
        return key.lower()
    return key

def unflatten(dictionary):
    result = {}
    for key, value in dictionary.items():
        parts = key.split('.')
        d = result
        for part in parts[:-1]:
            # Normalize part if needed? 
            # Logic: if we have REPORTSDASHBOARD.COMPLIANCE.TITLE
            # parts = [REPORTSDASHBOARD, COMPLIANCE, TITLE]
            # We want result['reportsDashboard']['compliance']['title'] = val
            
            # Simple normalization: lowercase if all upper
            if part.isupper():
                part = part.lower()
            
            if part not in d:
                d[part] = {}
            d = d[part]
            if not isinstance(d, dict):
                 # Conflict: Key is both leaf and branch. e.g. "a": "val", "a.b": "val2"
                 # Move "a" value to "a._self" or similar? Or just error?
                 # For locales, usually we accept overwriting or structural fix.
                 # Let's verify if we need to handle this.
                 print(f"Conflict at {part} for key {key}")
                 d = {} # Overwrite string with dict? Bad.

        last_part = parts[-1]
        if last_part.isupper():
            last_part = last_part.lower()
            
        d[last_part] = value
    return result

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # First pass: Lowercase keys that are UPPERCASE (and potentially split dots)
    # Actually, unflatten function handles splitting.
    
    new_data = unflatten(data)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, indent=2, ensure_ascii=False)
    print(f"Processed {file_path}")

if __name__ == "__main__":
    for f in files:
        if os.path.exists(f):
            process_file(f)
        else:
            print(f"File not found: {f}")
