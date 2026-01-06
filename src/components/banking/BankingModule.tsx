import React, { useState, useEffect } from 'react';
import { BankImportWizard } from './BankImportWizard';
import { BankTransactionMatcher } from './BankTransactionMatcher';
import { Button } from '@/components/ui/button';
import { getBankTransactions, BankTransaction, BankAccount, db } from '@/database/simple-db';
import { Upload, Scale, Building2 } from 'lucide-react';

export const BankingModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'import' | 'match'>('import');
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<BankTransaction[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Cargar cuentas al inicio
    useEffect(() => {
        if (!db) return;
        try {
            const res = db.exec("SELECT * FROM bank_accounts WHERE is_active = 1");
            if (res.length > 0 && res[0].values.length > 0) {
                const cols = res[0].columns;
                const loadedAccounts = res[0].values.map(row => {
                    const acc: any = {};
                    cols.forEach((col, i) => acc[col] = row[i]);
                    return acc as BankAccount;
                });
                setAccounts(loadedAccounts);
                if (loadedAccounts.length > 0 && !selectedAccountId) {
                    setSelectedAccountId(loadedAccounts[0].id);
                }
            }
        } catch (e) {
            console.error("Error loading accounts", e);
        }
    }, []);

    // Cargar transacciones cuando cambia la cuenta o hay refresh
    useEffect(() => {
        if (selectedAccountId) {
            const txns = getBankTransactions(selectedAccountId);
            setTransactions(txns);
        }
    }, [selectedAccountId, refreshTrigger, activeTab]);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    const handleCreateDemoData = () => {
        if (!db) return;
        try {
            // 1. Crear Cuenta
            db.run(`INSERT INTO bank_accounts (account_name, bank_name, account_number, is_active) 
                VALUES ('Cuenta Demo', 'Banco Demo', '999999', 1)`);

            const res = db.exec("SELECT id FROM bank_accounts WHERE account_number = '999999'");
            const accId = res[0].values[0][0];

            // 2. Crear Asiento (Venta $500)
            const today = new Date().toISOString().split('T')[0];
            db.run(`INSERT INTO journal_entries (entry_date, description, total_debit, total_credit)
                VALUES ('${today}', 'Venta Demo Cliente XYZ', 500.00, 500.00)`);

            const resJe = db.exec("SELECT MAX(id) FROM journal_entries");
            const jeId = resJe[0].values[0][0];

            // 3. Crear Transacción Bancaria ($500) coincidente
            db.run(`INSERT INTO bank_transactions (bank_account_id, transaction_date, description, amount, status)
                VALUES (${accId}, '${today}', 'Deposito Venta XYZ', 500.00, 'pending')`);

            // 4. Crear Asiento (Gasto $120.50) hace 2 dias
            const prevDay = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]; // -2 dias
            db.run(`INSERT INTO journal_entries (entry_date, description, total_debit, total_credit)
                VALUES ('${prevDay}', 'Compra Papeleria', 120.50, 120.50)`);

            // 5. Crear Transacción Bancaria ($120.50) hoy (Fuzzy date match)
            db.run(`INSERT INTO bank_transactions (bank_account_id, transaction_date, description, amount, status)
                VALUES (${accId}, '${today}', 'Cobro Papeleria', -120.50, 'pending')`);

            alert("Datos Demo generados: Cuenta creada, Asientos creados, Transacciones importadas.");
            window.location.reload(); // Recarga brutal para asegurar todo
        } catch (e) {
            console.error(e);
            alert("Error generando demo data");
        }
    };

    return (
        <div className="p-6 space-y-6 h-screen flex flex-col overflow-hidden">
            {/* Header + Account Selector */}
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        Conciliación Bancaria
                    </h1>
                    <p className="text-slate-400 text-sm">Tesorería Inteligente</p>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={handleCreateDemoData} className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10">
                        ⚡ Demo Data
                    </Button>
                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <select
                            className="bg-transparent text-white text-sm outline-none border-none min-w-[200px]"
                            value={selectedAccountId || ''}
                            onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                        >
                            {accounts.length === 0 && <option value="">No hay cuentas activas</option>}
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.account_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex gap-2">
                <Button
                    variant={activeTab === 'import' ? 'default' : 'ghost'}
                    className={activeTab === 'import' ? 'bg-blue-600' : 'text-slate-400'}
                    onClick={() => setActiveTab('import')}
                >
                    <Upload className="w-4 h-4 mr-2" /> Importar
                </Button>
                <Button
                    variant={activeTab === 'match' ? 'default' : 'ghost'}
                    className={activeTab === 'match' ? 'bg-purple-600 hover:bg-purple-500' : 'text-slate-400'}
                    onClick={() => setActiveTab('match')}
                >
                    <Scale className="w-4 h-4 mr-2" /> Conciliar ({transactions.filter(t => t.status === 'pending').length})
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-slate-900/30 rounded-xl border border-slate-800 p-1">
                {activeTab === 'import' && (
                    <div className="h-full overflow-y-auto p-4 scale-in-center">
                        <BankImportWizard
                            accounts={accounts}
                            onComplete={() => {
                                handleRefresh();
                                setActiveTab('match');
                            }}
                        />
                    </div>
                )}

                {activeTab === 'match' && (
                    <div className="h-full overflow-y-auto p-4 scale-in-center">
                        {selectedAccountId ? (
                            <BankTransactionMatcher
                                transactions={transactions}
                                onMatchComplete={handleRefresh}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500">
                                Selecciona una cuenta bancaria para comenzar
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
