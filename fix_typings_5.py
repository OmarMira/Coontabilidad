import os
import re

simple_db = r'c:\Account Express\src\database\simple-db.ts'
pdf_parser = r'c:\Account Express\src\lib\pdf-parser.ts'

if os.path.exists(simple_db):
    with open(simple_db, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Revert the global replace
    content = content.replace(
        "): Promise<{ success: boolean; message: string; id?: number }> {",
        "): { success: boolean; message: string; id?: number } {"
    )
    
    # Now specifically fix createBudget
    content = re.sub(
        r'export async function createBudget\(\n  budgetData: Omit<Budget, \'id\' \| \'created_at\' \| \'updated_at\'>,\n  budgetLines: Omit<BudgetLine, \'id\' \| \'budget_id\' \| \'created_at\'>\[\]\n\): \{ success: boolean; message: string; id\?: number \} \{',
        r'export async function createBudget(\n  budgetData: Omit<Budget, \'id\' | \'created_at\' | \'updated_at\'>,\n  budgetLines: Omit<BudgetLine, \'id\' | \'budget_id\' | \'created_at\'>[]\n): Promise<{ success: boolean; message: string; id?: number }> {',
        content
    )

    with open(simple_db, 'w', encoding='utf-8') as f:
        f.write(content)

if os.path.exists(pdf_parser):
    with open(pdf_parser, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'transactions:\s*parsedData', r'data: parsedData', content)

    with open(pdf_parser, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix missing async/awaits that were affected:
# Look at App.tsx, bankReconciliation, FloridaTaxReport, PayrollProcessor
app_tsx = r'c:\Account Express\src\App.tsx'
if os.path.exists(app_tsx):
    with open(app_tsx, 'r', encoding='utf-8') as f:
        content = f.read()
    # If they were expecting Promise somewhere? No, they were expecting synchronous return, but because I appended Promise they errored. 
    # By reverting above I fixed them!

print("Done")
