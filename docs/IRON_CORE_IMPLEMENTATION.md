# Iron Core Implementation - Technical Documentation

## Overview

The "Iron Core" project brings forensic-grade accounting capabilities to Account Express, ensuring data immutability, geographic tax compliance (Florida), and military-grade backup security.

## 1. Forensic Architecture (L1-L4)

The system is built on a layered security model:

* **L1 (Storage):** SQLite with WAL mode + OPFS for high-performance persistence.
* **L2 (Hashing):** `AuditService` chains every transaction using SHA-256. Each block contains the hash of the previous block, creating an immutable ledger.
* **L3 (Triggers):** Anti-tamper SQL triggers (`prevent_journal_update`, `prevent_journal_delete`) block modification of finalized records at the engine level.
* **L4 (Encryption):** Data at rest and in backups is protected using AES-256-GCM / PBKDF2.

### Key Files

- `src/database/DatabaseService.ts`: Forensic wrapper and trigger installer.
* `src/services/AuditService.ts`: Chain verification logic.

## 2. Florida Tax Module (DOR-Compliant)

Full compliance with Florida Department of Revenue (DOR) regulations.

* **Configuration:** `florida_tax_config` table pre-populated with **67 Counties** and their 2025/2026 Surtax rates (0% - 2%).
* **Calculation:** `TaxService.ts` implements the official logic (State Base 6% + County Surtax).
* **Rounding:** Implements the modern "Standard Rounding" rule (Publication 700A effective July 2021) where tax is calculated to the 3rd decimal and rounded up if >4.
* **Validation:** Verified via Unit Tests (`src/services/__tests__/TaxService.test.ts`).

## 3. Backup System (.aex)

Secure, portable backup format for "Local-First" data sovereignty.

* **Format:** `.aex` (Account Express Encrypted).
* **Structure:**

    ```json
    {
      "version": "1.0",
      "timestamp": "ISO-8601",
      "database": "<Base64 Encrypted Blob>",
      "salt": "<Base64>",
      "iv": "<Base64>",
      "manifest": { "tables_count": 42, ... },
      "checksum/signature": "<SHA-256>"
    }
    ```

* **Encryption:** `BackupService.ts` uses Web Crypto API (AES-GCM) with a system-derived master key.
* **Restore:** Validates checksum before decryption. Automatically restores to OPFS and reloads the application.

## 4. How to Verify

### Dashboard Validation

1. Navigate to **Dashboard**.
2. Check the **"Escudo Legal Activo"** status (Traffic Light).
3. Verify the **"Último Hash Validado"** is displayed (verifies real-time integrity).
4. Check **"Pasivo Fiscal"** widget showing accurate data from `TaxService`.

### Manual Test (Developer)

1. Run `npm test` to execute TaxService unit tests.
2. Inspect `VerifyIronCore` component (if enabled) for deep diagnostic of Triggers and Schema.

## Conclusion

The Account Express "Iron Core" meets or exceeds the requirements for a forensic accounting system compliant with Florida regulations and capable of detecting data tampering.
