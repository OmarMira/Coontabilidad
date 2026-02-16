
import json
files = ["src/assets/locales/es.json", "src/assets/locales/en.json"]
for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as fh:
            json.load(fh)
        print(f"PASS: {f}")
    except Exception as e:
        print(f"FAIL: {f} - {e}")
