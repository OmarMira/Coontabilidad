import re
import os

files = [
    r'c:\Account Express\src\database\simple-db.ts',
    r'c:\Account Express\src\components\JournalEntryTest.tsx',
    r'c:\Account Express\src\components\SupplierPayments.tsx',
    r'c:\Account Express\src\components\dr15\DR15PreparationWizard.tsx',
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
            "const data = result.transactions;",
            "const data = (result as any).transactions || (result as any).data;"
        )
        content = content.replace(
            "const data = (result as any).transactions || (result as any).data; || (result as any).data;",
            "const data = (result as any).transactions || (result as any).data;"
        )

    # DR15PreparationWizard
    if 'DR15PreparationWizard.tsx' in file:
        content = content.replace(
            "const [isLoading, setIsLoading] = useState(false);",
            "const [loading, setLoading] = useState(false);\n  const isLoading = loading;"
        )
        content = content.replace(
            "isLoading={isLoading}",
            "isLoading={loading}"
        )
        content = content.replace(
            "engine={explanationEngine}",
            "engine={explanationEngine}\n        onNext={() => {}}"
        )

    # pdf-parser.ts
    if 'pdf-parser.ts' in file:
        content = content.replace(
            "transactions: parsedData",
            "data: parsedData"
        )
        
    # simple-db.ts
    if 'simple-db.ts' in file:
        content = re.sub(
            r'export const generatePaymentMadeJournalEntry = \(payment: Payment, supplier: Supplier, userId\?: number\): \{ success: boolean; message: string; entryId\?: number \} => \{',
            r'export const generatePaymentMadeJournalEntry = async (payment: Payment, supplier: Supplier, userId?: number): Promise<{ success: boolean; message: string; entryId?: number }> => {',
            content
        )
        content = re.sub(
            r'export const deleteJournalEntry = \(id: number\): \{ success: boolean; message: string; entryId\?: number \} => \{',
            r'export const deleteJournalEntry = async (id: number): Promise<{ success: boolean; message: string; entryId?: number }> => {',
            content
        )
        content = re.sub(
            r'export const unblockAuditDate = async \(date: string, userId: number, reason: string\) => \{',
            r'export const unblockAuditDate = async (date: string, userId: number, reason: string): Promise<{success: boolean, message: string, id?: number}> => {',
            content
        )
        
    # JournalEntryTest.tsx
    if 'JournalEntryTest.tsx' in file:
        content = content.replace(
            "const result = generateSalesJournalEntry(invoice);",
            "const result = await generateSalesJournalEntry(invoice);"
        )
        content = content.replace(
            "const purchaseResult = generatePurchaseJournalEntry(bill);",
            "const purchaseResult = await generatePurchaseJournalEntry(bill);"
        )
        content = re.sub(
            r'const handleTestSales = \(\) => \{',
            r'const handleTestSales = async () => {',
            content
        )
        content = re.sub(
            r'const handleTestPurchase = \(\) => \{',
            r'const handleTestPurchase = async () => {',
            content
        )
        
    # SupplierPayments.tsx
    if 'SupplierPayments.tsx' in file:
        content = content.replace(
            "const result = createPayment(",
            "const result = await createPayment("
        )
        content = re.sub(
            r'const handleProcessPayment = \(\) => \{',
            r'const handleProcessPayment = async () => {',
            content
        )

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Fixed {file}")
