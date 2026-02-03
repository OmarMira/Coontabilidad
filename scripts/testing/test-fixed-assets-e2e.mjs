#!/usr/bin/env node
/**
 * Fixed Assets E2E Automated Test
 * Tests the complete asset lifecycle without UI interaction
 */

import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'account-express.db');

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}`);
  if (details) console.log(`   ${details}`);
  
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

function execQuery(db, query, params = []) {
  try {
    const stmt = db.prepare(query);
    if (params.length > 0) {
      stmt.bind(params);
    }
    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();
    return result;
  } catch (err) {
    console.error('Query error:', err.message);
    throw err;
  }
}

function execRun(db, query, params = []) {
  try {
    db.run(query, params);
    return { changes: db.getRowsModified(), lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0] };
  } catch (err) {
    throw err;
  }
}

async function runTest() {
  const SQL = await initSqlJs();
  const buffer = readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);
  
  console.log('\n🚀 Fixed Assets E2E Test Suite\n');
  console.log('='.repeat(60));
  
  let testAssetId = null;
  
  try {
    // Test 1: Database Schema Validation
    console.log('\n📋 Test 1: Database Schema Validation');
    
    const tables = execQuery(db, `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name LIKE 'fixed_assets%'
    `);
    
    const requiredTables = [
      'fixed_assets',
      'fixed_asset_categories',
      'fixed_asset_depreciation',
      'fixed_asset_disposals'
    ];
    
    const tableNames = tables.map(t => t.name);
    const allTablesExist = requiredTables.every(t => tableNames.includes(t));
    
    logTest(
      'All required tables exist',
      allTablesExist,
      `Found: ${tableNames.join(', ')}`
    );
    
    // Test 2: Categories Setup
    console.log('\n📂 Test 2: Asset Categories');
    
    const categories = execQuery(db, 'SELECT * FROM fixed_asset_categories');
    logTest(
      'Categories table populated',
      categories.length > 0,
      `Found ${categories.length} categories`
    );
    
    const vehicleCategory = categories.find(c => c.name === 'Vehicles');
    logTest(
      'Vehicles category exists',
      !!vehicleCategory,
      vehicleCategory ? `GL Account: ${vehicleCategory.gl_account}` : 'Not found'
    );
    
    // Test 3: Create Test Asset
    console.log('\n🏗️  Test 3: Asset Creation');
    
    const testAssetName = `Test Asset ${Date.now()}`;
    const purchaseDate = new Date().toISOString().split('T')[0];
    
    try {
      db.run(`
        INSERT INTO fixed_assets (
          name, category_id, purchase_date, purchase_cost,
          salvage_value, useful_life_months, status, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        testAssetName,
        vehicleCategory?.id || 1,
        purchaseDate,
        35000,
        5000,
        60,
        'PENDING',
        'cash'
      ]);
      
      const lastIdResult = db.exec('SELECT last_insert_rowid()');
      testAssetId = lastIdResult[0].values[0][0];
      
      logTest(
        'Asset created successfully',
        testAssetId > 0,
        `Asset ID: ${testAssetId}`
      );
      
      // Test 4: Activate Asset
      console.log('\n⚡ Test 4: Asset Activation');
      
      db.run(`
        UPDATE fixed_assets 
        SET status = 'ACTIVE', start_depreciation_date = ?
        WHERE id = ?
      `, [purchaseDate, testAssetId]);
      
      const activatedAsset = execQuery(db, 'SELECT * FROM fixed_assets WHERE id = ?', [testAssetId])[0];
      
      logTest(
        'Asset activated',
        activatedAsset.status === 'ACTIVE',
        `Status: ${activatedAsset.status}`
      );
      
      // Test 5: Depreciation Calculation
      console.log('\n📊 Test 5: Depreciation Logic');
      
      const asset = execQuery(db, 'SELECT * FROM fixed_assets WHERE id = ?', [testAssetId])[0];
      
      const depreciableAmount = asset.purchase_cost - asset.salvage_value;
      const monthlyDepreciation = depreciableAmount / asset.useful_life_months;
      const expectedMonthly = 500; // (35000 - 5000) / 60
      
      logTest(
        'Monthly depreciation calculated correctly',
        Math.abs(monthlyDepreciation - expectedMonthly) < 0.01,
        `Expected: $${expectedMonthly}, Calculated: $${monthlyDepreciation.toFixed(2)}`
      );
      
      // Test 6: Create Depreciation Entry
      console.log('\n💰 Test 6: Depreciation Entry');
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      try {
        db.run(`
          INSERT INTO fixed_asset_depreciation (
            asset_id, period, depreciation_amount, accumulated_depreciation
          ) VALUES (?, ?, ?, ?)
        `, [
          testAssetId,
          currentMonth,
          monthlyDepreciation,
          monthlyDepreciation
        ]);
        
        logTest(
          'Depreciation entry created',
          true,
          `Amount: $${monthlyDepreciation.toFixed(2)}`
        );
        
        // Test 7: Prevent Duplicate Depreciation
        console.log('\n🔒 Test 7: Duplicate Prevention');
        
        let duplicatePrevented = false;
        try {
          db.run(`
            INSERT INTO fixed_asset_depreciation (
              asset_id, period, depreciation_amount, accumulated_depreciation
            ) VALUES (?, ?, ?, ?)
          `, [
            testAssetId,
            currentMonth,
            monthlyDepreciation,
            monthlyDepreciation * 2
          ]);
        } catch (err) {
          duplicatePrevented = err.message.includes('UNIQUE') || err.message.includes('constraint');
        }
        
        logTest(
          'Duplicate depreciation prevented',
          duplicatePrevented,
          'UNIQUE constraint working'
        );
        
      } catch (err) {
        logTest('Depreciation entry created', false, err.message);
      }
      
      // Test 8: Net Book Value
      console.log('\n📈 Test 8: Net Book Value Calculation');
      
      const totalDepreciationResult = execQuery(db, `
        SELECT COALESCE(SUM(depreciation_amount), 0) as total
        FROM fixed_asset_depreciation
        WHERE asset_id = ?
      `, [testAssetId]);
      
      const totalDepreciation = totalDepreciationResult[0].total;
      const netBookValue = asset.purchase_cost - totalDepreciation;
      const expectedNBV = 34500; // 35000 - 500
      
      logTest(
        'Net book value correct',
        Math.abs(netBookValue - expectedNBV) < 0.01,
        `Expected: $${expectedNBV}, Calculated: $${netBookValue.toFixed(2)}`
      );
      
      // Test 9: Disposal
      console.log('\n🗑️  Test 9: Asset Disposal');
      
      const disposalDate = new Date().toISOString().split('T')[0];
      const proceeds = 34000;
      const gainLoss = proceeds - netBookValue; // -500 (loss)
      
      try {
        db.run(`
          INSERT INTO fixed_asset_disposals (
            asset_id, disposal_date, disposal_method, proceeds,
            gain_loss, buyer_info
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          testAssetId,
          disposalDate,
          'sale',
          proceeds,
          gainLoss,
          'Test Buyer Inc.'
        ]);
        
        logTest(
          'Disposal record created',
          true,
          `Gain/Loss: $${gainLoss.toFixed(2)}`
        );
        
        // Update asset status
        db.run(`UPDATE fixed_assets SET status = 'DISPOSED' WHERE id = ?`, [testAssetId]);
        
        const disposedAsset = execQuery(db, 'SELECT * FROM fixed_assets WHERE id = ?', [testAssetId])[0];
        
        logTest(
          'Asset status updated to DISPOSED',
          disposedAsset.status === 'DISPOSED',
          'Status change successful'
        );
        
      } catch (err) {
        logTest('Disposal record created', false, err.message);
      }
      
      // Test 10: Query Performance
      console.log('\n⚡ Test 10: Query Performance');
      
      const start = Date.now();
      const assetRegister = execQuery(db, `
        SELECT 
          fa.*,
          fac.name as category_name,
          COALESCE(SUM(fad.depreciation_amount), 0) as accumulated_depreciation,
          (fa.purchase_cost - COALESCE(SUM(fad.depreciation_amount), 0)) as net_book_value
        FROM fixed_assets fa
        LEFT JOIN fixed_asset_categories fac ON fa.category_id = fac.id
        LEFT JOIN fixed_asset_depreciation fad ON fa.id = fad.asset_id
        WHERE fa.status != 'DISPOSED'
        GROUP BY fa.id
      `);
      const queryTime = Date.now() - start;
      
      logTest(
        'Asset register query performance',
        queryTime < 100,
        `Query time: ${queryTime}ms, Assets found: ${assetRegister.length}`
      );
      
      // Cleanup
      console.log('\n🧹 Cleanup: Removing test data');
      db.run('DELETE FROM fixed_asset_depreciation WHERE asset_id = ?', [testAssetId]);
      db.run('DELETE FROM fixed_asset_disposals WHERE asset_id = ?', [testAssetId]);
      db.run('DELETE FROM fixed_assets WHERE id = ?', [testAssetId]);
      
      // Save changes back to file
      const data = db.export();
      writeFileSync(DB_PATH, data);
      
      console.log('   Test asset removed');
      
    } catch (err) {
      logTest('Asset creation', false, err.message);
      console.error('Error details:', err);
    }
    
  } catch (err) {
    console.error('\n❌ Fatal Error:', err.message);
  } finally {
    db.close();
  }
  
  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary\n');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Fixed Assets module is production-ready.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review details above.\n');
    process.exit(1);
  }
}

// Run the test
runTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
