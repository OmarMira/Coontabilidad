import re
import os

pdf_parser = r'c:\Account Express\src\lib\pdf-parser.ts'
wizard = r'c:\Account Express\src\components\dr15\DR15PreparationWizard.tsx'
journal_test = r'c:\Account Express\src\components\JournalEntryTest.tsx'
supplier = r'c:\Account Express\src\components\SupplierPayments.tsx'
simple_db = r'c:\Account Express\src\database\simple-db.ts'

# PDF Parser
if os.path.exists(pdf_parser):
    with open(pdf_parser, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace("transactions: parsedData", "data: parsedData")
    with open(pdf_parser, 'w', encoding='utf-8') as f:
        f.write(content)

# Wizard
if os.path.exists(wizard):
    with open(wizard, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(
        "const StepSelectPeriod: React.FC<WizardStepProps> = ({ onNext, data, updateData }) => {",
        "const StepSelectPeriod: React.FC<WizardStepProps> = ({ onNext, data, updateData, isLoading }) => {"
    )
    with open(wizard, 'w', encoding='utf-8') as f:
        f.write(content)

# Journal Test
if os.path.exists(journal_test):
    with open(journal_test, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(
        "const result = generatePurchaseJournalEntry(bill);",
        "const result = await generatePurchaseJournalEntry(bill);"
    )
    with open(journal_test, 'w', encoding='utf-8') as f:
        f.write(content)

# Supplier
if os.path.exists(supplier):
    with open(supplier, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(
        "const result = addPayment(paymentData, user?.id || 1);",
        "const result = await addPayment(paymentData, user?.id || 1);"
    )
    with open(supplier, 'w', encoding='utf-8') as f:
        f.write(content)

# Simple DB
if os.path.exists(simple_db):
    with open(simple_db, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(
        "): { success: boolean; message: string; id?: number } {",
        "): Promise<{ success: boolean; message: string; id?: number }> {"
    )
    with open(simple_db, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
