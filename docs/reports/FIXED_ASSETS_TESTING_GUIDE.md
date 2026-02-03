# Fixed Assets Phase 8 - Manual Testing Guide

## 🎯 Goal
Validate the complete asset lifecycle in 30-45 minutes

---

## Test 1: Purchase and Activate Asset (10 min)

### Steps:
1. **Navigate** to Fixed Assets in the app (http://localhost:5173)
2. **Click** "Add Asset" button
3. **Fill form:**
   - Name: "Test Vehicle #1"
   - Category: "Vehicles"
   - Purchase Date:  Today's date
   - Purchase Cost: $35,000
   - Salvage Value: $5,000
   - Useful Life: 60 months
   - Payment: Cash
4. **Submit** and verify:
   - ✅ Asset appears in list
   - ✅ Status shows "PENDING"
   - ✅ Journal entry created (check GL 1600 debit)

5. **Activate** the asset:
   - Click asset → "Activate" button
   - ✅ Status changes to "ACTIVE"
   - ✅ Start depreciation date set

**Expected:** Asset created, journal entry logged, activation successful

---

## Test 2: Run Monthly Depreciation (10 min)

### Steps:
1. **Go to** Depreciation tab
2. **Click** "Run Monthly Batch"
3. **Select** current month
4. **Run batch**
5. **Verify:**
   - ✅ Batch summary shows 1 asset processed
   - ✅ Depreciation amount = $500 ($30,000 / 60 months)
   - ✅ Journal entry created (DR 5400, CR 1650)
   - ✅ Asset detail shows accumulated depreciation

6. **Try running again** for same month:
   - ✅ Should prevent duplicate (unique constraint)

**Expected:** Monthly depreciation entry created, can't duplicate

---

## Test 3: Check Reports (10 min)

### Step 1: Asset Register
1. **Go to** Reports tab
2. **Open** "Asset Register"
3. **Verify:**
   - ✅ Shows Test Vehicle #1
   - ✅ Original cost: $35,000
   - ✅ Accumulated depreciation: $500
   - ✅ Net book value: $34,500
   - ✅ CSV export works

### Step 2: Depreciation Schedule
1. **Open** "Depreciation Schedule"
2. **Verify:**
   - ✅ Shows next 12 months projected
   - ✅ Each month shows $500
   - ✅ Visual chart displays correctly

### Step 3: Disposal Summary
1. **Open** "Disposal Summary"
2. **Verify:**
   - ✅ Currently empty (no disposals yet)

**Expected:** All reports display correct data

---

## Test 4: Dispose Asset (15 min)

### Steps:
1. **Go to** Assets tab
2. **Click** Test Vehicle #1
3. **Click** "Dispose Asset"
4. **Fill disposal form:**
   - Disposal Date: Today
   - Method: Sale
   - Proceeds: $34,000
   - Buyer: "Test Buyer Inc."

5. **Submit** and verify:
   - ✅ Asset status → "DISPOSED"
   - ✅ Gain/Loss calculated: $34,000 - $34,500 = -$500 (loss)
   - ✅ 4-line journal entry created:
     ```
     DR: Cash (1000)            $34,000
     DR: Accumulated Depr (1650)   $500
     DR: Loss on Disposal (5900)   $500
     CR: Fixed Asset (1600)     $35,000
     ```
   - ✅ Disposal appears in Disposal Summary report

6. **Try to activate disposed asset:**
   - ✅ Should be prevented (already disposed)

**Expected:** Asset disposed correctly, gain/loss accurate, journal correct

---

## Test 5: Edge Cases (Quick Check)

1. **Create another asset** but DON'T activate
2. **Try running depreciation batch:**
   - ✅ PENDING asset should be skipped
   - ✅ Only ACTIVE assets processed

3. **Try to delete** a category with assets:
   - ✅ Should fail with error message

4. **Create asset** with purchase on day 20 (half-month convention):
   - ✅ First month depreciation should be 50% of normal

**Expected:** Edge cases handled correctly

---

## ✅ Success Criteria

Mark test PASS if:
- All 5 tests complete without errors
- Journal entries balance correctly
- Reports show accurate data
- Edge cases protected

Mark test FAIL if:
- Any calculation incorrect
- Journal entries don't balance
- UI crashes or errors
- Data integrity issues

---

## 📝 Report Format

After testing, note:
- ✅ **PASS** - Test passed
- ❌ **FAIL** - What broke?
- ⚠️ **NOTE** - Observations

**Example:**
```
Test 1: ✅ PASS - Asset created and activated successfully
Test 2: ✅ PASS - Depreciation runs correctly
Test 3: ✅ PASS - All reports accurate
Test 4: ❌ FAIL - Disposal journal entry missing CR line
Test 5: ✅ PASS - Edge cases handled
```

---

**Estimated Time:** 30-45 minutes  
**Ready to test!** 🚀
