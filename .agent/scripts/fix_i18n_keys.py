#!/usr/bin/env python3
"""
Translation Key Validation and Repair Script - FIXED VERSION
Properly detects t() calls and ignores import paths
"""

import json
import re
from pathlib import Path
from collections import OrderedDict
from typing import Set, Dict

# Paths
ROOT_DIR = Path(__file__).parent.parent.parent
SRC_DIR = ROOT_DIR / "src"
ES_JSON = SRC_DIR / "assets" / "locales" / "es.json"
EN_JSON = SRC_DIR / "assets" / "locales" / "en.json"

def is_valid_translation_key(key: str) -> bool:
    """Check if a key is a valid translation key (not a file path or invalid key)"""
    # Reject obvious file paths and invalid keys
    if '/' in key or '\\' in key:
        return False
    if key.startswith('./') or key.startswith('../'):
        return False
    if key in [' ', ',', '-', '.', '']:
        return False
    # Valid keys should follow the pattern: word.word or word.word.word
    # Allow only alphanumeric, dots, hyphens, underscores
    if not re.match(r'^[a-zA-Z0-9._-]+$', key):
        return False
    return True

def extract_keys_from_code() -> Set[str]:
    """Extract all t('key') and t(\"key\") calls from TypeScript/TSX files"""
    keys = set()
    # More specific pattern to avoid matching file paths
    patterns = [
        re.compile(r"[^a-zA-Z]t\(['\"]([a-zA-Z0-9._-]+)['\"]\)"),  # t('key')
        re.compile(r"[^a-zA-Z]t\(['\"]([a-zA-Z0-9._-]+)['\"],"),   # t('key', {...})
    ]
    
    for file_path in list(SRC_DIR.rglob("*.tsx")) + list(SRC_DIR.rglob("*.ts")):
        if 'node_modules' in str(file_path):
            continue
        try:
            content = file_path.read_text(encoding='utf-8')
            for pattern in patterns:
                matches = pattern.findall(content)
                for match in matches:
                    if is_valid_translation_key(match):
                        keys.add(match)
        except Exception as e:
            print(f"⚠️  Error reading {file_path.name}: {e}")
    
    return keys

def load_json_and_clean(file_path: Path) -> Dict[str, str]:
    """Load JSON and remove invalid keys"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Filter out invalid keys
        cleaned = {}
        for key, value in data.items():
            if is_valid_translation_key(key):
                cleaned[key] = value
        
        print(f"   Removed {len(data) - len(cleaned)} invalid keys from {file_path.name}")
        return cleaned
    except Exception as e:
        print(f"❌ Error loading {file_path}: {e}")
        return {}

def save_json(file_path: Path, data: Dict[str, str]):
    """Save JSON with proper formatting"""
    # Sort keys alphabetically
    sorted_data = OrderedDict(sorted(data.items()))
    
    with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(sorted_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Saved {file_path.name} with {len(data)} keys")

def main():
    print("🔍 SCANNING CODEBASE FOR TRANSLATION KEYS...")
    keys_in_code = extract_keys_from_code()
    print(f"   Found {len(keys_in_code)} unique keys in code\n")
    
    print("📋 LOADING AND CLEANING EXISTING TRANSLATIONS...")
    es_data = load_json_and_clean(ES_JSON)
    en_data = load_json_and_clean(EN_JSON)
    print(f"   ES: {len(es_data)} valid keys")
    print(f"   EN: {len(en_data)} valid keys\n")
    
    # Find missing keys
    missing_in_es = keys_in_code - set(es_data.keys())
    missing_in_en = keys_in_code - set(en_data.keys())
    
    print("🔎 ANALYSIS RESULTS:")
    print(f"  Missing in ES: {len(missing_in_es)} keys")
    print(f"   Missing in EN: {len(missing_in_en)} keys\n")
    
    if missing_in_es:
        print("📝 ADDING MISSING KEYS (showing first 30):")
        for i, key in enumerate(sorted(missing_in_es)[:30]):
            print(f"   + {key}")
        if len(missing_in_es) > 30:
            print(f"   ... and {len(missing_in_es) - 30} more\n")
    
    # Add missing keys with the key itself as placeholder
    for key in missing_in_es:
        es_data[key] = key
    
    for key in missing_in_en:
        en_data[key] = key
    
    # Save cleaned files
    print("\n💾 SAVING CLEANED AND SYNCHRONIZED FILES...")
    save_json(ES_JSON, es_data)
    save_json(EN_JSON, en_data)
    
    print("\n✅ DONE! Translation files cleaned and synchronized.")
    print(f"   🔹 ES: {len(es_data)} keys")
    print(f"   🔹 EN: {len(en_data)} keys")

if __name__ == "__main__":
    main()
