import { getDBEngine } from '../database/simple-db';

console.log('Verifying AI SQL Generation (DAC Dynamic Mode)...');

async function runTest() {
    try {
        const generator = new IntelligentSQLGenerator(getDBEngine());

        // Mock query objects
        const assetQuery = {
            entity: { key: 'ASSET' },
            intent: { key: 'SUM' },
            parameters: {}
        };

        const expenseQuery = {
            entity: { key: 'EXPENSE' },
            intent: { key: 'SUM' },
            parameters: {}
        };

        // @ts-ignore
        const assetSql = await generator.generateSQL(assetQuery);
        console.log('ASSET SQL:', assetSql.sql);

        // @ts-ignore
        const expenseSql = await generator.generateSQL(expenseQuery);
        console.log('EXPENSE SQL:', expenseSql.sql);

        console.log('✅ Dynamic SQL generation tested.');

    } catch (e) {
        console.error('Error executing verification:', e);
    }
}

runTest();
