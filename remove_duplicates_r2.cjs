const fs = require('fs');
const file = 'C:/Account Express/src/database/simple-db.ts';
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

const functionsRaw = `
addCustomer, getCustomers, getCustomerById, updateCustomer, canDeleteCustomer, deleteCustomer,
getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, generateInvoiceNumber,
getQuotes, getQuoteById, createQuote, updateQuote, deleteQuote, convertQuoteToInvoice,
addSupplier, getSuppliers, getSupplierById, updateSupplier, canDeleteSupplier, deleteSupplier,
getProducts, getProductById, createProduct, updateProduct, deleteProduct, updateProductStock,
getProductsLowStock, getActiveProducts, getProductCategories, createProductCategory,
updateProductCategory, deleteProductCategory,
calculateFloridaDR15Report, saveDR15Report, getDR15Reports, getAllFloridaTaxRates,
updateFloridaTaxRate, markDR15ReportAsFiled, getAvailableDR15Periods, getFloridaTaxRate,
calculateTaxAmount, FLORIDA_COUNTIES, validateFinancialCalculation,
getPaymentMethods, getAllPaymentMethods, createPaymentMethod, updatePaymentMethod,
deletePaymentMethod, getPaymentMethodById, canDeletePaymentMethod,
getBankAccounts, getBankAccountById, createBankAccount, updateBankAccount, deleteBankAccount,
getBankAccountTransactionCount, findBankAccountsByNumber, findBankAccountByNumber,
getReconciliationStatements, getLastReconciliationStatement, createReconciliationStatement,
getUnreconciledTransactions, findSimilarJournalEntries, createReconciliationMatch,
insertBankTransactions, getBankTransactions, findPotentialMatches, confirmMatch, unmatchTransaction,
createInventoryMovement, getInventoryMovementsWithFilters,
createLocation, getLocations, updateLocation, deleteLocation, createInitialLocations,
getPayroll, getEmployeePayrolls, getAllPayrolls, getQuarterlyPayrolls, getAnnualPayrolls,
getPayrollSettings, updatePayrollSetting, getPayrolls, createPayrollPeriod, getPayrollEntries,
createPayrollEntry, getPayrollLineItems,
getAssetCategories, createAssetCategory, getFixedAssets, getFixedAssetById, createFixedAsset,
updateFixedAsset, disposeAsset, getAssetDepreciations, recordDepreciation, calculateMonthlyDepreciation,
getTaxBrackets, createTaxBracket, updateTaxBracket, deleteTaxBracket, getFiscalSettings, updateFiscalSettings,
createBudget, getARDCustomerSummary, checkAccountingDataAssociation, getStatsWithInvoices
`;

const functions = functionsRaw.split(/[, \n]+/).map(s => s.trim()).filter(Boolean);

let i = 0;
while (i < lines.length) {
    const line = lines[i];
    const isTarget = functions.some(f => 
        line.startsWith(`export const ${f} `) || 
        line.startsWith(`export const ${f}=`) || 
        line.startsWith(`export function ${f}(`) ||
        line.startsWith(`export async function ${f}(`)
    );
    
    if (isTarget) {
         let braceCount = 0;
         let started = false;
         let startIdx = i;

         // find preceding interface or comments that go with this function
         while (startIdx > 0 && (lines[startIdx - 1].trim().startsWith('//') || lines[startIdx - 1].trim().startsWith('/**') || lines[startIdx - 1].trim().startsWith('*') || lines[startIdx - 1].trim().startsWith('@') || lines[startIdx - 1].trim() === '')) {
             startIdx--;
         }

         let inTemplateLiteral = false;
         let inSingleQuote = false;
         let inDoubleQuote = false;

         while (i < lines.length) {
             const l = lines[i];
             
             let j = 0;
             while(j < l.length) {
                 const c = l[j];
                 
                 // Handle escapes
                 if (c === '\\') { j += 2; continue; }
                 
                 // Quotes toggle
                 if (c === '`' && !inSingleQuote && !inDoubleQuote) { inTemplateLiteral = !inTemplateLiteral; }
                 else if (c === "'" && !inTemplateLiteral && !inDoubleQuote) { inSingleQuote = !inSingleQuote; }
                 else if (c === '"' && !inTemplateLiteral && !inSingleQuote) { inDoubleQuote = !inDoubleQuote; }
                 
                 if (!inTemplateLiteral && !inSingleQuote && !inDoubleQuote) {
                     if (c === '{' || c === '[' || c === '(') { started = true; braceCount++; }
                     if (c === '}' || c === ']' || c === ')') { braceCount--; }
                 }
                 j++;
             }
             
             i++;
             if (started && braceCount === 0) {
                 break;
             }
         }
         
         while(i < lines.length && lines[i].trim() === '') {
             i++;
         }
         
         const removed = lines.splice(startIdx, i - startIdx);
         console.log(`Removed ${removed.length} lines for block around line ${startIdx}`);
         i = startIdx; // reset loop pointer to current index
    } else {
         i++;
    }
}

fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Finished removing duplicates.');
