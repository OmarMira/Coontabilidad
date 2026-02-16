
import { IntelligentSQLGenerator } from '../services/ai/IntelligentSQLGenerator';

console.log('Verifying AI SQL Generation...');

const generator = new IntelligentSQLGenerator();

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

try {
    // @ts-ignore
    const assetSql = generator.generateSQL(assetQuery);
    console.log('ASSET SQL:', assetSql.sql);

    // @ts-ignore
    const expenseSql = generator.generateSQL(expenseQuery);
    console.log('EXPENSE SQL:', expenseSql.sql);

    if (assetSql.sql.includes('fixed_assets') && assetSql.sql.includes('acquisition_cost')) {
        console.log('✅ ASSET mapping correct.');
    } else {
        console.error('❌ ASSET mapping incorrect.');
    }

    if (expenseSql.sql.includes('bills') && expenseSql.sql.includes('total_amount')) {
        console.log('✅ EXPENSE mapping correct.');
    } else {
        console.error('❌ EXPENSE mapping incorrect.');
    }

} catch (e) {
    console.error('Error executing verification:', e);
}
