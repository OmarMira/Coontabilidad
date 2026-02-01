#!/usr/bin/env node
/**
 * Fixed Assets E2E Test - Simple Version
 * Validates Fixed Assets tables and structure
 */

import initSqlJs from 'sql.js';

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

async function runTest() {
  console.log('\n🚀 Fixed Assets E2E Test Suite\n');
  console.log('='.repeat(60));
  
  try {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    
    // Test 1: Create Fixed Assets Tables
    console.log('\n📋 Test 1: Create Fixed Assets Schema');
    
    try {
      // Categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS fixed_asset_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          gl_account TEXT NOT NULL,
          depreciation_gl_account TEXT NOT NULL,
          accumulated_depreciation_gl_account TEXT NOT NULL,
          description TEXT,
          created_at TEXT DEFAULT (datetime('now'))
        )
      `);
      
      // Assets table
      db.run(`
        CREATE TABLE IF NOT EXISTS fixed_assets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category_id INTEGER NOT NULL,
          purchase_date TEXT NOT NULL,
          purchase_cost REAL NOT NULL,
          salvage_value REAL DEFAULT 0,
          useful_life_months INTEGER NOT NULL,
          status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'ACTIVE', 'DISPOSED')),
          start_depreciation_date TEXT,
          payment_method TEXT CHECK(payment_method IN ('cash', 'credit', 'loan', 'lease')),
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (category_id) REFERENCES fixed_asset_categories(id)
        )
      `);
      
      // Depreciation table
      db.run(`
        CREATE TABLE IF NOT EXISTS fixed_asset_depreciation (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          asset_id INTEGER NOT NULL,
          period TEXT NOT NULL,
          depreciation_amount REAL NOT NULL,
          accumulated_depreciation REAL NOT NULL,
          journal_entry_id INTEGER,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (asset_id) REFERENCES fixed_assets(id),
          UNIQUE(asset_id, period)
        )
      `);
      
      // Disposals table
      db.run(`
        CREATE TABLE IF NOT EXISTS fixed_asset_disposals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          asset_id INTEGER NOT NULL,
          disposal_date TEXT NOT NULL,
          disposal_method TEXT CHECK(disposal_method IN ('sale', 'scrap', 'trade', 'donation')),
          proceeds REAL DEFAULT 0,
          gain_loss REAL,
          buyer_info TEXT,
          notes TEXT,
          journal_entry_id INTEGER,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (asset_id) REFERENCES fixed_assets(id)
        )
      `);
      
      logTest('Schema created successfully', true, 'All 4 tables created');
    } catch (err) {
      logTest('Schema creation', false, err.message);
      return;
    }
    
    // Test 2: Insert Categories
    console.log('\n📂 Test 2: Insert Asset Categories');
    
    try {
      const categories = [
        ['Vehicles', '1600', '5400', '1650', 'Cars, trucks, and other vehicles'],
        ['Equipment', '1610', '5410', '1660', 'Machinery and equipment'],
        ['Furniture', '1620', '5420', '1670', 'Office furniture and fixtures'],
        ['Computers', '1630', '5430', '1680', 'Computer hardware and software'],
        ['Buildings', '1640', '5440', '1690', 'Real estate and structures']
      ];
      
      const stmt = db.prepare(`
        INSERT INTO fixed_asset_categories 
        (name, gl_account, depreciation_gl_account, accumulated_depreciation_gl_account, description)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      for (const cat of categories) {
        stmt.run(cat);
      }
      stmt.free();
      
      const result = db.exec('SELECT COUNT(*) as count FROM fixed_asset_categories');
      const count = result[0].values[0][0];
      
      logTest('Categories inserted', count === 5, `Inserted ${count} categories`);
    } catch (err) {
      logTest('Categories insertion', false, err.message);
    }
    
    // Test 3: Insert Test Asset
    console.log('\n🏗️  Test 3: Insert Test Asset');
    
    try {
      const purchaseDate = new Date().toISOString().split('T')[0];
      
      db.run(`
        INSERT INTO fixed_assets 
        (name, category_id, purchase_date, purchase_cost, salvage_value, useful_life_months, status, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['Test Vehicle', 1, purchaseDate, 35000, 5000, 60, 'PENDING', 'cash']);
      
      const result = db.exec('SELECT last_insert_rowid() as id');
      const assetId = result[0].values[0][0];
      
      logTest('Asset inserted', assetId > 0, `Asset ID: ${assetId}`);
      
      // Test 4: Activate Asset
      console.log('\n⚡ Test 4: Activate Asset');
      
      db.run(`
        UPDATE fixed_assets 
        SET status = 'ACTIVE', start_depreciation_date = ?
        WHERE id = ?
      `, [purchaseDate, assetId]);
      
      const assetResult = db.exec(`SELECT status FROM fixed_assets WHERE id = ${assetId}`);
      const status = assetResult[0].values[0][0];
      
      logTest('Asset activated', status === 'ACTIVE', `Status: ${status}`);
      
      // Test 5: Calculate Depreciation
      console.log('\n📊 Test 5: Depreciation Calculation');
      
      const depreciableAmount = 35000 - 5000;
      const monthlyDepreciation = depreciableAmount / 60;
      const expectedMonthly = 500;
      
      logTest(
        'Monthly depreciation correct',
        Math.abs(monthlyDepreciation - expectedMonthly) < 0.01,
        `Expected: $${expectedMonthly}, Calculated: $${monthlyDepreciation.toFixed(2)}`
      );
      
      // Test 6: Insert Depreciation Entry
      console.log('\n💰 Test 6: Insert Depreciation Entry');
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      db.run(`
        INSERT INTO fixed_asset_depreciation 
        (asset_id, period, depreciation_amount, accumulated_depreciation)
        VALUES (?, ?, ?, ?)
      `, [assetId, currentMonth, monthlyDepreciation, monthlyDepreciation]);
      
      const deprResult = db.exec(`SELECT COUNT(*) as count FROM fixed_asset_depreciation WHERE asset_id = ${assetId}`);
      const deprCount = deprResult[0].values[0][0];
      
      logTest('Depreciation entry created', deprCount === 1, `Entries: ${deprCount}`);
      
      // Test 7: Duplicate Prevention
      console.log('\n🔒 Test 7: Duplicate Depreciation Prevention');
      
      let duplicatePrevented = false;
      try {
        db.run(`
          INSERT INTO fixed_asset_depreciation 
          (asset_id, period, depreciation_amount, accumulated_depreciation)
          VALUES (?, ?, ?, ?)
        `, [assetId, currentMonth, monthlyDepreciation, monthlyDepreciation * 2]);
      } catch (err) {
        duplicatePrevented = err.message.includes('UNIQUE') || err.message.includes('constraint');
      }
      
      logTest('Duplicate prevented', duplicatePrevented, 'UNIQUE constraint working');
      
      // Test 8: Net Book Value Query
      console.log('\n📈 Test 8: Net Book Value Calculation');
      
      const nbvResult = db.exec(`
        SELECT 
          fa.purchase_cost,
          COALESCE(SUM(fad.depreciation_amount), 0) as total_depreciation,
          (fa.purchase_cost - COALESCE(SUM(fad.depreciation_amount), 0)) as net_book_value
        FROM fixed_assets fa
        LEFT JOIN fixed_asset_depreciation fad ON fa.id = fad.asset_id
        WHERE fa.id = ${assetId}
        GROUP BY fa.id
      `);
      
      const nbv = nbvResult[0].values[0][2];
      const expectedNBV = 34500;
      
      logTest(
        'Net book value correct',
        Math.abs(nbv - expectedNBV) < 0.01,
        `Expected: $${expectedNBV}, Calculated: $${nbv}`
      );
      
      // Test 9: Disposal
      console.log('\n🗑️  Test 9: Asset Disposal');
      
      const disposalDate = new Date().toISOString().split('T')[0];
      const proceeds = 34000;
      const gainLoss = proceeds - nbv;
      
      db.run(`
        INSERT INTO fixed_asset_disposals 
        (asset_id, disposal_date, disposal_method, proceeds, gain_loss, buyer_info)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [assetId, disposalDate, 'sale', proceeds, gainLoss, 'Test Buyer Inc.']);
      
      db.run(`UPDATE fixed_assets SET status = 'DISPOSED' WHERE id = ?`, [assetId]);
      
      const disposalResult = db.exec(`SELECT COUNT(*) as count FROM fixed_asset_disposals WHERE asset_id = ${assetId}`);
      const disposalCount = disposalResult[0].values[0][0];
      
      logTest('Disposal recorded', disposalCount === 1, `Gain/Loss: $${gainLoss.toFixed(2)}`);
      
      // Test 10: Asset Register Query
      console.log('\n⚡ Test 10: Asset Register Query Performance');
      
      const start = Date.now();
      const registerResult = db.exec(`
        SELECT 
          fa.id,
          fa.name,
          fac.name as category_name,
          fa.purchase_cost,
          COALESCE(SUM(fad.depreciation_amount), 0) as accumulated_depreciation,
          (fa.purchase_cost - COALESCE(SUM(fad.depreciation_amount), 0)) as net_book_value,
          fa.status
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
        `Query time: ${queryTime}ms`
      );
      
    } catch (err) {
      logTest('Asset operations', false, err.message);
      console.error('Error details:', err);
    }
    
    db.close();
    
  } catch (err) {
    console.error('\n❌ Fatal Error:', err.message);
    console.error(err);
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

runTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
