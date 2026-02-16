
import os
import re

def is_hardcoded(text):
    text = text.strip()
    if not text: return False
    if text.startswith('{') and text.endswith('}'): return False # Variable
    if text.startswith('&') and text.endswith(';'): return False # HTML Entity
    if re.match(r'^[0-9\.,\-\%\$]+$', text): return False # Numbers/Currency
    if len(text) < 2: return False # Single chars
    return True

def scan_files(root_dir):
    # Regex patterns
    # 1. Text content: >Request<
    content_pattern = re.compile(r'>([^<{]+?)<') 
    # 2. Placeholder: placeholder="Request"
    placeholder_pattern = re.compile(r'placeholder="([^"{}]+?)"')
    # 3. Title: title="Request"
    title_pattern = re.compile(r'title="([^"{}]+?)"')
    # 4. Alt: alt="Request"
    alt_pattern = re.compile(r'alt="([^"{}]+?)"')

    issues = {}

    exclude_dirs = ['node_modules', '.git', 'dist', 'build', 'assets', '.migration_backups', '.translation_backups']
    exclude_files = ['.ds_store', 'vite-env.d.ts']

    for root, dirs, files in os.walk(root_dir):
        # Filter dirs
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for file in files:
            if not file.endswith('.tsx'): continue
            if file in exclude_files: continue
            
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                file_issues = []
                
                # Check 1: Content
                for match in content_pattern.finditer(content):
                    text = match.group(1)
                    if is_hardcoded(text):
                        file_issues.append(f'[TEXT] {text}')

                # Check 2: Placeholder
                for match in placeholder_pattern.finditer(content):
                    text = match.group(1)
                    if is_hardcoded(text):
                        file_issues.append(f'[PLACEHOLDER] {text}')
                
                # Check 3: Title
                for match in title_pattern.finditer(content):
                    text = match.group(1)
                    if is_hardcoded(text):
                        file_issues.append(f'[TITLE] {text}')
                        
                # Check 4: Alt
                for match in alt_pattern.finditer(content):
                    text = match.group(1)
                    if is_hardcoded(text):
                         file_issues.append(f'[ALT] {text}')

                if file_issues:
                    issues[filepath] = file_issues

            except Exception as e:
                print(f"Error reading {filepath}: {e}")

    return issues

if __name__ == "__main__":
    import sys
    # Force UTF-8 output
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except AttributeError:
             pass 

    target_dir = r"c:\Account Express\src"
    all_issues = scan_files(target_dir)

    with open(r"c:\Account Express\REPARACION_PENDIENTE.txt", "w", encoding='utf-8') as f:
        for filepath, problems in all_issues.items():
            f.write(f"{filepath}\n")
            for p in problems:
                f.write(f"  {p}\n")
            f.write("\n")
            
    print(f"Scan complete. Found potential checks in {len(all_issues)} files.")
