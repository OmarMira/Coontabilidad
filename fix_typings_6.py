import os
import re

simple_db = r'c:\Account Express\src\database\simple-db.ts'
pdf_parser = r'c:\Account Express\src\lib\pdf-parser.ts'

if os.path.exists(simple_db):
    with open(simple_db, 'r', encoding='utf-8') as f:
        content = f.read()

    # 10084
    content = re.sub(
        r'export async function createPaymentMethod\(methodData: Omit<PaymentMethod, \'id\' \| \'created_at\'>\): \{ success: boolean; message: string; id\?: number \} \{',
        r'export async function createPaymentMethod(methodData: Omit<PaymentMethod, \'id\' | \'created_at\'>): Promise<{ success: boolean; message: string; id?: number }> {',
        content
    )
    
    # 10553
    content = re.sub(
        r'export async function createBankAccount\(data: Omit<BankAccount, \'id\' \| \'created_at\'>\): \{ success: boolean; message: string; id\?: number \} \{',
        r'export async function createBankAccount(data: Omit<BankAccount, \'id\' | \'created_at\'>): Promise<{ success: boolean; message: string; id?: number }> {',
        content
    )
    
    with open(simple_db, 'w', encoding='utf-8') as f:
        f.write(content)

if os.path.exists(pdf_parser):
    with open(pdf_parser, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Line 180
    content = content.replace(
        "transactions: results,",
        "data: results,"
    )

    with open(pdf_parser, 'w', encoding='utf-8') as f:
        f.write(content)

print("Done")
