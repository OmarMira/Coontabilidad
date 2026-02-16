# 🔍 Auditoría del Sistema - Esquema Real Identificado

## ❌ PROBLEMA CRÍTICO ENCONTRADO

La auditoría estaba usando el esquema de la **Migración 010** (nuevo), pero la base de datos está usando el esquema de la **Migración 001** (viejo).

## 📊 Esquema Real de la Base de Datos

### Tablas que SÍ existen:

```sql
-- Asientos Contables (Migración 001)
journal_entries (
  id INTEGER PRIMARY KEY,  -- ❌ NO es TEXT
  entry_date DATE,
  description TEXT,
  reference TEXT,
  total DECIMAL,
  status TEXT,  -- 'posted', 'draft' (minúsculas)
  created_at DATETIME
)

-- Detalles de Asientos (Migración 001)
journal_details (  -- ❌ NO es ledger_lines
  id INTEGER PRIMARY KEY,
  journal_id INTEGER,  -- ❌ NO es journal_entry_id
  account_code TEXT,
  debit DECIMAL,
  credit DECIMAL,
  description TEXT
)

-- Facturas de Proveedores (Migración 004)
vendor_bills (
  id INTEGER PRIMARY KEY,
  supplier_id INTEGER,
  bill_number TEXT,
  date DATE,
  total_amount DECIMAL,
  status TEXT
)

-- Activos Fijos (Migración 011)
fixed_assets (
  id INTEGER PRIMARY KEY,
  asset_tag TEXT,
  asset_name TEXT,  -- ✅ SÍ existe
  category_id INTEGER,
  purchase_cost INTEGER,  -- centavos
  total_accumulated_depreciation INTEGER,
  net_book_value INTEGER,
  status TEXT
)

-- Períodos Contables (Migración 005)
accounting_periods (
  id INTEGER PRIMARY KEY,
  name TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT,  -- 'open', 'closed' (minúsculas)
  created_at DATETIME
)
```

## ✅ Correcciones Necesarias

### 1. Journal Entries
- ❌ `ledger_lines` → ✅ `journal_details`
- ❌ `ll.journal_entry_id` → ✅ `jd.journal_id`
- ❌ `je.status = 'POSTED'` → ✅ `je.status = 'posted'`

### 2. Accounting Periods
- ❌ `ap.status = 'CLOSED'` → ✅ `ap.status = 'closed'`
- ❌ `ap.closed_at` → ✅ `ap.created_at` (no existe closed_at)

### 3. Fixed Assets
- ✅ `asset_name` - Correcto (existe en migración 011)
- ✅ `purchase_cost` - Correcto
- ✅ `total_accumulated_depreciation` - Correcto
- ✅ `net_book_value` - Correcto

### 4. Vendor Bills
- ✅ `vendor_bills` - Correcto (existe en migración 004)

## 🔧 Acción Requerida

Necesito reescribir `src/utils/systemAudit.ts` para usar el esquema correcto (Migración 001 + 004 + 005 + 011).

## 📝 Notas

- La Migración 010 (ledger_lines) NO se ha aplicado
- La Migración 011 (fixed_assets) SÍ se ha aplicado
- Los estados están en minúsculas ('posted', 'closed', 'open')
- Los IDs de journal_entries son INTEGER, no TEXT

---

**Próximo paso**: Reescribir completamente `systemAudit.ts` con el esquema correcto.
