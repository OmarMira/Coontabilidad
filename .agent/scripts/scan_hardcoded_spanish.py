
import os
import re

def scan_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find text inside JSX tags: >Text<
    # We ignore purely whitespace strings
    # We try to exclude {expressions} generally, though simple regex is imperfect for nested braces.
    
    # This pattern looks for > followed by non-tag chars, then <
    # It captures the text group.
    pattern = re.compile(r'>\s*([^<{]+?)\s*<')
    
    matches = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        # fast check: if line has specific spanish chars, flag it high priority
        if re.search(r'[áéíóúñÁÉÍÓÚÑ]', line):
            # Try to extract the specific text if possible, or just report the line
            matches.append((i+1, LineType.SPANISH_CHARS, line.strip()))
            continue

        # Check for potential hardcoded text strings in JSX
        # This is noisy, so we'll filter for common words or length
        line_matches = pattern.findall(line)
        for m in line_matches:
            original = m.strip()
            if not original: continue
            # Ignore if it looks like a number or symbol
            if re.match(r'^[\d\.,\-\%]+$', original): continue
            
            matches.append((i+1, LineType.HARDCODED_TEXT, original))

    return matches

class LineType:
    SPANISH_CHARS = "SPANISH_CHARS"
    HARDCODED_TEXT = "HARDCODED_TEXT"

def main():
    target_dir = r"c:\Account Express\src"
    excludes = ["node_modules", ".git", "assets"]
    
    report = {}

    for root, dirs, files in os.walk(target_dir):
        # Exclude dirs
        dirs[:] = [d for d in dirs if d not in excludes]
        
        for file in files:
            if not file.endswith(".tsx"): continue
            
            filepath = os.path.join(root, file)
            results = scan_file(filepath)
            
            if results:
                report[filepath] = results

    # Print Report
    print(f"Found potential issues in {len(report)} files.")
    print("-" * 50)
    for filepath, items in report.items():
        # filter for spanish first as they are critical violations
        spanish_items = [x for x in items if x[1] == LineType.SPANISH_CHARS]
        if spanish_items:
            print(f"\nFILE: {filepath}")
            for line_num, type_, text in spanish_items:
                print(f"  [L{line_num}] {type_}: {text}")
        
        # Then print others if no spanish found (to reduce noise) or if needed
        # For now, let's focus on SPANISH characters as the user explicitly mentioned "palabra en español"
        
import sys

if __name__ == "__main__":
    if sys.stdout.encoding != 'utf-8':
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except AttributeError:
             pass # Python < 3.7
    main()
