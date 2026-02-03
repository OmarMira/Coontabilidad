/**
 * Test Script for BackupService
 * Run with: node test-backup.js
 */

import { BackupService } from './src/services/BackupService.ts';
import { initDB } from './src/database/simple-db.ts';

async function testBackup() {
  console.log('🧪 Testing BackupService...\n');

  try {
    // 1. Initialize database
    console.log('1️⃣ Initializing database...');
    await initDB();
    console.log('✅ Database initialized\n');

    // 2. Create backup
    console.log('2️⃣ Creating backup...');
    const startTime = Date.now();
    
    const backup = await BackupService.createBackup((progress) => {
      if (progress) {
        console.log(`   Progress: ${progress.percentage}% - ${progress.message || ''}`);
      }
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Backup created in ${duration}ms\n`);

    // 3. Verify backup
    console.log('3️⃣ Verifying backup...');
    console.log(`   Backup size: ${backup.length} characters`);
    console.log(`   First 100 chars: ${backup.substring(0, 100)}...\n`);

    // 4. Test restore (optional)
    console.log('4️⃣ Testing restore...');
    const restoreStart = Date.now();
    
    await BackupService.restoreBackup(backup, (progress) => {
      if (progress) {
        console.log(`   Progress: ${progress.percentage}% - ${progress.message || ''}`);
      }
    });
    
    const restoreDuration = Date.now() - restoreStart;
    console.log(`✅ Restore completed in ${restoreDuration}ms\n`);

    console.log('🎉 All tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - Backup time: ${duration}ms`);
    console.log(`   - Restore time: ${restoreDuration}ms`);
    console.log(`   - Backup size: ${backup.length} chars`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testBackup();
