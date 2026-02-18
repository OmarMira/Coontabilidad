import json
import os
import sys

files = [
    r"src\assets\locales\en.json",
    r"src\assets\locales\es.json"
]

def analyze_file(path):
    print(f"--- Analyzing {path} ---")
    if not os.path.exists(path):
        print("File not found.")
        return

    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print("Valid JSON.")
        print(f"Root keys: {list(data.keys())}")
        
        # Check for nested keys that should be root
        # The user mentioned: security, maintenance, settings, accounting, banking, payroll
        target_roots = ["security", "maintenance", "settings", "accounting", "banking", "payroll"]
        
        for root in target_roots:
            if root in data:
                print(f"'{root}' is present at root.")
            else:
                print(f"'{root}' is MISSING at root.")
                
            # Check if they are hidden inside 'setup' or 'modules'
            if "setup" in data and isinstance(data["setup"], dict):
                if root in data["setup"]:
                     print(f"Found '{root}' nested in 'setup'. Should be moved.")
            
            if "modules" in data and isinstance(data["modules"], dict):
                if root in data["modules"]:
                     print(f"Found '{root}' nested in 'modules'. Should be moved.")

    except json.JSONDecodeError as e:
        print(f"JSON Syntax Error: {e.msg} at line {e.lineno} column {e.colno}")
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            start = max(0, e.lineno - 3)
            end = min(len(lines), e.lineno + 2)
            for i in range(start, end):
                print(f"{i+1}: {lines[i].rstrip()}")

analyze_file(files[0])
analyze_file(files[1])
