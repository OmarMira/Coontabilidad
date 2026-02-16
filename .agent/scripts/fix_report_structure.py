
import json
import os

files = ['src/assets/locales/es.json', 'src/assets/locales/en.json']

def promote_categories(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Helper to safe get lowercased key dict
    def get_key_case_insensitive(d, key):
        for k in d.keys():
            if k.lower() == key.lower():
                return k, d[k]
        return None, None

    # Find reportsdashboard
    rd_key, rd_data = get_key_case_insensitive(data, 'reportsdashboard')
    
    if not rd_data:
        print(f"reportsdashboard not found in {file_path}")
        return

    categories_to_promote = ['analysiscategory', 'financialcategory', 'ledgercategory']
    
    dirty = False
    
    for cat_name in categories_to_promote:
        cat_key, cat_data = get_key_case_insensitive(rd_data, cat_name)
        if cat_data:
            print(f"Promoting children of {cat_key} in {file_path}")
            # Move children up
            keys_to_move = list(cat_data.keys())
            for child_key in keys_to_move:
                # specific keys like 'desc', 'title' keep in category if they describe it?
                # But in the screenshot, we see 'reportsdashboard.agingreport.title'.
                # The categories themselves might be used for the dashboard cards.
                # If we move 'agingreport', we fix the page. 
                # Does the dashboard need 'agingreport' inside category?
                # Probably not, the dashboard likely iterates categories or has hardcoded links.
                # Let's COPY/MOVE.
                
                # Actually, if I move them, I might break the dashboard if IT relies on the nesting.
                # BUT the screenshot shows broken pages.
                # The safe bet is to COPY deeply nested report keys to the `reportsdashboard` level.
                # e.g. reportsdashboard.agingreport = reportsdashboard.analysiscategory.agingreport
                
                # Let's filter out 'title' and 'desc' of the category itself.
                if child_key.lower() in ['title', 'desc', 'description']:
                    continue
                    
                print(f"  - Moving {child_key}")
                rd_data[child_key] = cat_data[child_key]
                dirty = True
                
    if dirty:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Updated {file_path}")
    else:
        print(f"No changes for {file_path}")

if __name__ == "__main__":
    for f in files:
        promote_categories(f)
