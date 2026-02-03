# BackupService Worker Migration - Testing Guide

## Quick Testing Checklist (15 minutes)

### Test 1: Create Backup (5 min)

**Steps:**
1. Open app in browser (http://localhost:5173)
2. Navigate to Settings → Backup & Restore
3. Click "Create Backup" button
4. **OBSERVE**: UI should remain responsive during backup
5. **VERIFY**: Progress indicator shows up
6. **SUCCESS**: Backup file downloads without UI freeze

**What to Watch:**
- ✅ Can still click other buttons during backup
- ✅ Progress bar animates smoothly
- ✅ No spinning wheel or frozen UI
- ✅ Process completes successfully

### Test 2: Restore Backup (5 min)

**Steps:**
1. Click "Restore from Backup"
2. Select the backup file you just created
3. Enter password
4. **OBSERVE**: UI responsive during restore
5. **VERIFY**: Progress indicator works
6. **SUCCESS**: Data restored correctly

**What to Watch:**
- ✅ UI stays responsive
- ✅ Can navigate away if needed
- ✅ Progress updates smoothly
- ✅ Data integrity maintained

### Test 3: UI Responsiveness (5 min)

**Steps:**
1. Start a backup operation
2. **IMMEDIATELY** try to:
   - Click other menu items
   - Type in search boxes
   - Scroll pages
   - Open dropdowns

**Expected:**
- ✅ All UI interactions work IMMEDIATELY
- ✅ No lag or delay
- ✅ Backup continues in background

**Before Migration (Expected Behavior):**
- ❌ UI frozen for 10-15 seconds
- ❌ Can't click anything
- ❌ Spinner shows

---

## Advanced Testing (Optional - 30 min)

### Test Large Database

Create dummy data first:
```typescript
// In browser console
for (let i = 0; i < 1000; i++) {
  // Add test transactions
}
```

Then test backup - should STILL not freeze UI.

### Test Corrupted Backup

1. Open backup file in text editor
2. Delete a few characters
3. Try to restore
4. **VERIFY**: Gets proper error message (no crash)

### Test Wrong Password

1. Create backup with password "test123"
2. Try to restore with password "wrong"
3. **VERIFY**: Shows "Invalid password" error

---

## Success Criteria

✅ **PASS**: If you can click around the UI while backup is running  
✅ **PASS**: If progress indicator shows and updates  
✅ **PASS**: If backup/restore complete successfully  
❌ **FAIL**: If UI freezes at any point  
❌ **FAIL**: If no progress indicator appears  
❌ **FAIL**: If data is corrupted after restore  

---

## Troubleshooting

**If UI still freezes:**
- Check browser console for errors
- Verify WorkerOrchestrator is being used
- Check that database.worker.ts is loaded

**If progress doesn't show:**
- Check WorkerProgress component is rendered
- Verify progress callbacks are working
- Check console for worker messages

**If backup fails:**
- Check worker initialization
- Verify crypto API is available
- Check for CORS issues with sql.js

---

## Next Steps After Testing

**If all tests PASS:**
→ Proceed with DepreciationService migration

**If any test FAILS:**
→ Debug and fix before continuing
→ Worker migration pattern must be solid

---

**Estimated Time**: 15 minutes for basic testing  
**Important**: Test in actual browser, not just build validation
