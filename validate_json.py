import json

v = 'c:/Account Express/src/locales/en.json'

with open(v, 'r', encoding='utf-8') as f:
    text = f.read()

try:
    json.loads(text)
    print("Valid JSON")
except json.JSONDecodeError as e:
    print(e)
    start = max(0, e.pos - 200)
    end = min(len(text), e.pos + 200)
    print("Context around error:")
    print(text[start:end])
