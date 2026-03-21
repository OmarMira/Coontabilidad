import re

path = 'src/components/accounting/IncomeStatement.tsx'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Check for the pattern: whitespace + digits + : + whitespace + (actual content or empty)
    # But wait, looking at the view_file output:
    # 189:                     231:
    # 190:                     232:                     <div className="p-10 space-y-4">
    # The artifact format in view_file is `line_num: content`.
    # So line 189 content is `                    231:\n`
    # Line 190 content is `                    232:                     <div className="p-10 space-y-4">\n`
    
    # I want to remove the `\s*\d+:\s*` pattern ONLY if it looks like a line number paste artifact.
    # Be careful not to match real code.
    # The pattern seems to be specifically indented line number followed by optional code.
    
    # Let's target the lines I saw corrupted (approx 189 to 308).
    # But better to just detect the pattern.
    
    # Regex: ^(\s*)\d+:\s*(.*)$
    # If match, keep \1 + \2
    
    match = re.match(r'^(\s*)\d+:(?:\s+(.*))?$', line)
    if match:
        indent = match.group(1)
        content = match.group(2) if match.group(2) else ""
        # If content matches specific tags or is empty, we keep it.
        # But wait, `231:` on line 189 has no content.
        # If I strip it, I get empty line.
        # The original code probably didn't have these line numbers.
        # If I remove `231:`, I get empty line.
        # If I remove `232: <div...`, I get `<div...`
        
        # NOTE: line 189 `231:` seems to be a phantom line or just empty line in original.
        # Let's clean it.
        cleaned = indent + content + '\n'
        new_lines.append(cleaned)
        print(f"Fixed: {line.strip()} -> {cleaned.strip()}")
    else:
        new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Finished fixing IncomeStatement.tsx")
