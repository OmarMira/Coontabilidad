import { db, getDBEngine } from './src/database/simple-db';
import { TRANSACTION_STATES } from './src/constants/bankingStates';

setTimeout(() => {
    try {
        console.log("DB Loaded");
        // Test bank account 0 insertion (foreign key issue) and STATUS issue
        db.run(`
          INSERT INTO bank_transactions (
            bank_account_id, transaction_date, description, amount, status, import_hash
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
            0,
            '2024-03-01',
            'Test',
            100,
            TRANSACTION_STATES.IMPORTED,
            'hash1234'
        ]);
        console.log("SUCCESS");
    } catch (e) {
        console.error("ERROR EXACTO:", e.message);
    }
}, 1000);
