const { getDBEngine, db } = require('./src/database/simple-db');

setTimeout(() => {
    try {
        db.run("INSERT INTO bank_transactions (bank_account_id, transaction_date, description, amount, status, import_hash) VALUES (1, '2024-03-01', 'Test', 100, 'IMPORTED', 'hash123')");
        console.log("Success");
    } catch (e) {
        console.error("DB_ERROR_EXACT:", e.message);
    }
}, 1000);
