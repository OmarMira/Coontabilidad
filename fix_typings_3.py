import re
import os

files = [
    r'c:\Account Express\src\database\simple-db.ts',
    r'c:\Account Express\src\components\JournalEntryTest.tsx',
    r'c:\Account Express\src\components\dr15\DR15PreparationWizard.tsx',
    r'c:\Account Express\src\components\SupplierPayments.tsx',
    r'c:\Account Express\src\components\BankStatementImporter.tsx',
    r'c:\Account Express\src\lib\pdf-parser.ts'
]

for file in files:
    if not os.path.exists(file): continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # BankStatementImporter
    if 'BankStatementImporter.tsx' in file:
        content = content.replace(
            "const data = (result as any).transactions || (result as any).data;",
            "const data = (result as any).transactions || (result as any).data || result.data;"
        )
        content = re.sub(r'const data = result\.transactions;', r'const data = (result as any).transactions || (result as any).data;', content)

    # DR15PreparationWizard
    if 'DR15PreparationWizard.tsx' in file:
        content = content.replace(
            "setIsLoading(true);",
            "setLoading(true);"
        )
        content = content.replace(
            "setIsLoading(false);",
            "setLoading(false);"
        )
        content = content.replace(
            "isLoading={isLoading}",
            "isLoading={loading}"
        )
        # onNext error: line 346ish
        content = re.sub(
            r'engine=\{explanationEngine\}\n\s*/>',
            r'engine={explanationEngine}\n          onNext={() => {}}\n        />',
            content
        )
        content = re.sub(
            r'engine=\{explanationEngine\}\n\s*onNext=\{\(\) => \{\}\}\n\s*/>',
            r'engine={explanationEngine}\n          onNext={() => {}}\n        />',
            content
        )

    # pdf-parser.ts
    if 'pdf-parser.ts' in file:
        content = content.replace(
            "transactions: parsedData,",
            "// transactions: parsedData,\n      data: parsedData,"
        )

    # JournalEntryTest.tsx
    if 'JournalEntryTest.tsx' in file:
        content = content.replace(
            "const result = generateSalesJournalEntry(invoice);",
            "const result = await generateSalesJournalEntry(invoice);"
        )

    # SupplierPayments.tsx
    if 'SupplierPayments.tsx' in file:
        content = content.replace(
            "const result = createPayment(",
            "const result = await createPayment("
        )

    # simple-db.ts
    if 'simple-db.ts' in file:
        content = re.sub(
            r'export const unblockAuditDate = async \(date: string, userId: number, reason: string\): Promise<\{success: boolean, message: string, id\?: number\}> => \{',
            r'export const unblockAuditDate = async (date: string, userId: number, reason: string): Promise<{success: boolean, message: string, id?: number}> => {',
            content
        )
        content = re.sub(
            r'export const deleteJournalEntry = async \(id: number\): Promise<\{ success: boolean; message: string; entryId\?: number \}> => \{',
            r'export const deleteJournalEntry = async (id: number): Promise<{ success: boolean; message: string; entryId?: number }> => {',
            content
        )

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Fixed {file}")
