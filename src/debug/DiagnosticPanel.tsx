import React, { useState } from 'react';
import { SQLiteEngine } from '../core/database/SQLiteEngine';
import { MigrationEngine } from '../core/migrations/MigrationEngine';
import { InvoiceService } from '../services/invoicing/InvoiceService';
import { AuditChainService } from '../core/audit/AuditChainService';
import Big from 'big.js';

export const DiagnosticPanel: React.FC = () => {
    const [status, setStatus] = useState<'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED'>('IDLE');
    const [logs, setLogs] = useState<string[]>([]);
    const [results, setResults] = useState<any>(null);

    const log = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const runMiamiDadeTest = async () => {
        setStatus('RUNNING');
        setLogs([]);
        setResults(null);

        try {
            log("🚀 Starting Miami-Dade Integration Test (Browser Mode)...");

            const engine = new SQLiteEngine();
            await engine.initialize('accountexpress.db');
            log("✅ DB Connected");

            await MigrationEngine.getInstance().migrate(engine);
            log("✅ Migrations Verified");

            // Setup Data
            log("📦 Setting up Test Data...");
            const uniqueId = Date.now().toString().slice(-4);
            await engine.run(`INSERT INTO customers (name, florida_county) VALUES (?, 'Miami-Dade')`, [`Test Client ${uniqueId}`]);
            const custRes = await engine.select("SELECT last_insert_rowid() as id");
            const customerId = custRes[0].id;

            const sku = `TEST-PROD-${uniqueId}`;
            await engine.run(`INSERT INTO products (sku, name, price, stock_quantity, taxable) VALUES (?, 'Test Widget', 100.00, 50, 1)`, [sku]);
            const prodRes = await engine.select("SELECT id FROM products WHERE sku = ?", [sku]);
            const productId = prodRes[0].id;

            log(`Data Created: CustID=${customerId}, ProdID=${productId}`);

            // Process Sale
            const invoiceService = new InvoiceService(engine);
            log("💳 Processing Sale: $100.00...");

            const startCheck = performance.now();
            await invoiceService.createInvoice({
                customerId,
                county: 'Miami-Dade',
                userId: 'TEST_AGENT',
                lines: [{
                    productId,
                    description: 'Test Widget',
                    quantity: 1,
                    unitPrice: 100.00,
                    taxable: true,
                    cost: 50.00
                }]
            });
            const duration = performance.now() - startCheck;
            log(`✅ Invoice Created in ${duration.toFixed(2)}ms`);

            // Verification
            const invoices = await engine.select("SELECT * FROM invoices ORDER BY id DESC LIMIT 1");
            const lastInv = invoices[0];

            // Get Tax Transactions (Expect 2)
            const taxTx = await engine.select("SELECT * FROM tax_transactions WHERE invoice_id = ? ORDER BY id ASC", [lastInv.id]);

            // Get Journal
            const journal = await engine.select("SELECT * FROM journal_entries WHERE description LIKE ?", [`%${lastInv.invoice_number}%`]);
            const journalLines = await engine.select("SELECT * FROM journal_details WHERE journal_id = ?", [journal[0].id]);

            // Get Audit Chain (Last 2 for continuity )
            const audits = await engine.select("SELECT * FROM audit_chain ORDER BY id DESC LIMIT 2");
            const currentAudit = audits[0];
            const prevAudit = audits[1];

            // --- CHECKS ---

            const stateTaxRow = taxTx.find((t: any) => t.county_name === 'Florida State');
            const countyTaxRow = taxTx.find((t: any) => t.county_name === 'Miami-Dade');

            let auditContinuity = false;
            if (currentAudit) {
                if (prevAudit) {
                    auditContinuity = (currentAudit.previous_hash === prevAudit.chain_hash);
                } else {
                    auditContinuity = (currentAudit.previous_hash === 'GENESIS_HASH');
                }
            }

            const checks = {
                invoiceTotal: lastInv.total_amount === 107.00,
                stateTaxAmount: stateTaxRow?.tax_collected === 6.00,
                countyTaxAmount: countyTaxRow?.tax_collected === 1.00,
                journalBalanced: false, // calc below
                auditExists: !!currentAudit,
                auditContinuity: auditContinuity
            };

            let totalDebit = 0;
            let totalCredit = 0;
            journalLines.forEach((l: any) => {
                totalDebit += l.debit;
                totalCredit += l.credit;
            });
            checks.journalBalanced = (Math.abs(totalDebit - 107.00) < 0.001 && Math.abs(totalCredit - 107.00) < 0.001);

            setResults({
                invoice: lastInv,
                taxTx,
                journalHeader: journal[0],
                journalLines: journalLines,
                audit: currentAudit,
                prevAudit,
                checks
            });

            if (Object.values(checks).every(v => v)) {
                setStatus('PASSED');
                log("🏆 GOLDEN RECORD VALIDATED!");
            } else {
                setStatus('FAILED');
                log("❌ CHECKS FAILED. See details.");
            }

        } catch (e: any) {
            log(`❌ CRITICAL ERROR: ${e.message}`);
            console.error(e);
            setStatus('FAILED');
        }
    };

    const purgeTestData = async () => {
        try {
            log("🧹 Purging Test Data...");
            const engine = new SQLiteEngine();
            await engine.initialize('accountexpress.db');

            const testCusts = await engine.select("SELECT id, name FROM customers WHERE name LIKE 'Test Client%'");
            for (const cust of testCusts) {
                log(`Deleting Customer ${cust.name}...`);
                await engine.run("DELETE FROM customers WHERE id = ?", [cust.id]);
            }
            log("⚠️ Purge limited to Customers for safety. Manual cleanup recommended for full reset.");
        } catch (e: any) {
            log(`Purge Error: ${e.message}`);
        }
    };

    return (
        <div className="p-8 bg-gray-900 text-white min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">🚀 Golden Record Validator</h1>
                <div className="space-x-4">
                    <button
                        onClick={purgeTestData}
                        className="px-4 py-2 bg-red-800 hover:bg-red-700 rounded text-sm"
                    >
                        Purge Test Data
                    </button>
                    <button
                        onClick={runMiamiDadeTest}
                        disabled={status === 'RUNNING'}
                        className={`px-6 py-3 rounded font-bold ${status === 'RUNNING' ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                    >
                        {status === 'RUNNING' ? 'Running Test...' : 'RUN MIAMI-DADE TEST'}
                    </button>
                </div>
            </div>

            {status !== 'IDLE' && (
                <div className={`p-4 rounded border mb-4 ${status === 'PASSED' ? 'border-green-500 bg-green-900/20' : status === 'FAILED' ? 'border-red-500 bg-red-900/20' : 'border-gray-500'}`}>
                    <h2 className="text-xl font-bold mb-2">Status: <span className={status === 'PASSED' ? 'text-green-400' : status === 'FAILED' ? 'text-red-400' : 'text-yellow-400'}>{status}</span></h2>

                    {results && (
                        <div className="space-y-4 font-mono text-sm">

                            {/* RESULTS GRID */}
                            <div className="grid grid-cols-2 gap-4">

                                {/* 1. INVOICE CHECK */}
                                <div className="p-3 bg-black/50 rounded border border-gray-700">
                                    <h3 className="font-bold text-gray-400 mb-2 border-b border-gray-600">1. Financial Precision</h3>
                                    <div className="flex justify-between">
                                        <span>Total:</span>
                                        <span className={results.checks.invoiceTotal ? 'text-green-400' : 'text-red-500'}>
                                            ${results.invoice.total_amount}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">Expected: $107.00 (Big.js safe)</div>
                                </div>

                                {/* 2. TAX BREAKDOWN */}
                                <div className="p-3 bg-black/50 rounded border border-gray-700">
                                    <h3 className="font-bold text-gray-400 mb-2 border-b border-gray-600">2. Tax Compliance (DR-15)</h3>
                                    {results.taxTx.map((t: any, i: number) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{t.county_name}:</span>
                                            <span className={(t.county_name === 'Florida State' ? results.checks.stateTaxAmount : results.checks.countyTaxAmount) ? 'text-green-400' : 'text-red-500'}>
                                                ${t.tax_collected}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="text-xs text-gray-500 mt-1">Expected: State $6.00 / County $1.00</div>
                                </div>
                            </div>

                            {/* 3. AUDIT CHAIN */}
                            <div className="p-3 bg-black/50 rounded border border-gray-700">
                                <h3 className="font-bold text-gray-400 mb-2 border-b border-gray-600">3. Immutable Audit Chain</h3>
                                <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                                    <span className="text-gray-500">Current Hash:</span>
                                    <span className="text-yellow-400 break-all text-xs">{results.audit?.chain_hash || 'MISSING'}</span>

                                    <span className="text-gray-500">Prev Hash:</span>
                                    <span className="text-blue-400 break-all text-xs">{results.audit?.previous_hash || 'MISSING'}</span>

                                    <span className="text-gray-500">Chain Link:</span>
                                    <span className={results.checks.auditContinuity ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                                        {results.checks.auditContinuity ? '✅ VERIFIED' : '❌ BROKEN LINK'}
                                    </span>
                                </div>
                            </div>

                            {/* 4. JOURNAL */}
                            <div className="p-3 bg-black/50 rounded border border-gray-700">
                                <h3 className="font-bold text-gray-400 mb-2 border-b border-gray-600">4. Double Entry Ledger</h3>
                                {results.journalLines.map((l: any, i: number) => (
                                    <div key={i} className="grid grid-cols-[1fr_80px_80px] text-xs">
                                        <div className="text-gray-300">{l.account_code} - {l.description}</div>
                                        <div className="text-right text-green-400">{l.debit > 0 ? `$${l.debit.toFixed(2)}` : '-'}</div>
                                        <div className="text-right text-green-400">{l.credit > 0 ? `$${l.credit.toFixed(2)}` : '-'}</div>
                                    </div>
                                ))}
                                <div className="mt-2 text-right font-bold text-white border-t border-gray-600 pt-1">
                                    Balance Verified: {results.checks.journalBalanced ? '✅ OK' : '❌ IMBALANCE'}
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            )}

            <div className="bg-black p-4 rounded font-mono text-xs h-64 overflow-y-auto border border-gray-800">
                {logs.map((l, i) => (
                    <div key={i} className="mb-1">{l}</div>
                ))}
            </div>
        </div>
    );
};
