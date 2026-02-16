# 📘 MANUAL DE USUARIO Y OPERACIONES / USER AND OPERATIONS MANUAL

**AccountExpress Next-Gen v1.0.1**

> **Versión / Version:** 1.0.1  
> **Fecha / Date:** 9 de Febrero, 2026  
> **Estado / Status:** Producción / Production  

---

## 📑 TABLA DE CONTENIDOS / TABLE OF CONTENTS

### ESPAÑOL
- [A. Gestión de Datos y Nube](#a-gestión-de-datos-y-nube)
- [B. Inteligencia Artificial (Modo Borrador)](#b-inteligencia-artificial-modo-borrador)
- [C. Integridad y Legalidad](#c-integridad-y-legalidad)
- [D. Interfaz Bilingüe](#d-interfaz-bilingüe)
- [E. Guía Técnica (Administrador)](#e-guía-técnica-administrador)

### ENGLISH
- [A. Data Management and Cloud](#a-data-management-and-cloud)
- [B. Artificial Intelligence (Draft Mode)](#b-artificial-intelligence-draft-mode)
- [C. Integrity and Legal Compliance](#c-integrity-and-legal-compliance)
- [D. Bilingual Interface](#d-bilingual-interface)
- [E. Technical Guide (Administrator)](#e-technical-guide-administrator)

---

# ESPAÑOL

## A. Gestión de Datos y Nube

### 🔐 Respaldo Híbrido

AccountExpress implementa un sistema de respaldo híbrido que permite guardar copias de seguridad cifradas en múltiples destinos:

#### Destinos Disponibles

| Destino | Descripción | Configuración Requerida |
|---------|-------------|------------------------|
| **Local** | Descarga directa al disco | Ninguna |
| **Google Drive** | Sincronización automática | API Key + Access Token |
| **AWS S3** | Almacenamiento en la nube | Access Key + Secret Key + Bucket + Region |
| **Servidor Remoto** | API REST personalizada | URL + API Key |

#### Configuración de Google Drive

1. **Obtener Credenciales:**
   - Ir a [Google Cloud Console](https://console.cloud.google.com/)
   - Crear un proyecto nuevo o seleccionar uno existente
   - Habilitar "Google Drive API"
   - Crear credenciales OAuth 2.0
   - Descargar el archivo JSON de credenciales

2. **Configurar en AccountExpress:**
   - Ir a **Configuración** → **Respaldos** → **Nube**
   - Seleccionar "Google Drive"
   - Pegar el **Access Token** (obtenido mediante OAuth)
   - Hacer clic en **Guardar**

3. **Variables de Entorno (.env):**
   ```env
   VITE_GOOGLE_DRIVE_API_KEY=tu_api_key_aqui
   ```

> **⚠️ NOTA DE SEGURIDAD:** Nunca compartas tu Access Token. Guárdalo en un lugar seguro y renuévalo cada 60 días.

#### Configuración de AWS S3

1. **Obtener Credenciales:**
   - Ir a [AWS Console](https://console.aws.amazon.com/)
   - Navegar a **IAM** → **Usuarios** → **Crear usuario**
   - Asignar permisos: `s3:PutObject`, `s3:GetObject`
   - Descargar **Access Key ID** y **Secret Access Key**

2. **Crear Bucket:**
   - Ir a **S3** → **Crear bucket**
   - Nombre: `accountexpress-backups-[tu-empresa]`
   - Región: `us-east-1` (o la más cercana)
   - Bloquear acceso público: **Activado**

3. **Configurar en AccountExpress:**
   - Ir a **Configuración** → **Respaldos** → **Nube**
   - Seleccionar "AWS S3"
   - Ingresar:
     - **Access Key ID**
     - **Secret Access Key**
     - **Bucket Name**
     - **Region** (ej: `us-east-1`)
   - Hacer clic en **Guardar**

4. **Variables de Entorno (.env):**
   ```env
   VITE_AWS_ACCESS_KEY_ID=tu_access_key_aqui
   VITE_AWS_SECRET_ACCESS_KEY=tu_secret_key_aqui
   VITE_AWS_S3_BUCKET=accountexpress-backups-tu-empresa
   VITE_AWS_S3_REGION=us-east-1
   ```

> **⚠️ NOTA DE SEGURIDAD:** Las credenciales de AWS son extremadamente sensibles. Usa IAM Roles en producción y nunca las expongas en el código fuente.

#### Crear un Respaldo

1. Ir a **Herramientas** → **Respaldo y Restauración**
2. Hacer clic en **Crear Respaldo**
3. Ingresar una **contraseña segura** (mínimo 12 caracteres)
4. Seleccionar destino(s):
   - ☑️ Local (descarga .aex)
   - ☑️ Google Drive
   - ☑️ AWS S3
5. Hacer clic en **Crear**

**Resultado:**
- Archivo cifrado con AES-256-GCM
- Timestamp RFC 3161 (si está disponible)
- Metadata preservada (logic_clock, fecha, tamaño)

#### Restaurar un Respaldo

1. Ir a **Herramientas** → **Respaldo y Restauración**
2. Hacer clic en **Restaurar**
3. Seleccionar origen:
   - **Local:** Cargar archivo .aex
   - **Google Drive:** Seleccionar de la lista
   - **AWS S3:** Seleccionar de la lista
4. Ingresar la **contraseña** usada al crear el respaldo
5. Hacer clic en **Restaurar**

> **⚠️ ADVERTENCIA:** La restauración es ATÓMICA (todo o nada). Si falla, la base de datos NO se modifica.

### 🔄 Recuperación ante Pérdida de Datos

#### Escenario: El navegador limpia el caché

**Síntomas:**
- Al abrir AccountExpress, la base de datos está vacía
- Mensaje: "No se encontraron datos. ¿Desea restaurar desde un respaldo?"

**Solución:**

1. **Si tienes respaldos en la nube:**
   - Hacer clic en **Restaurar desde la Nube**
   - Seleccionar el respaldo más reciente
   - Ingresar la contraseña
   - Esperar a que se complete la restauración

2. **Si tienes respaldos locales (.aex):**
   - Hacer clic en **Cargar Respaldo Local**
   - Seleccionar el archivo .aex
   - Ingresar la contraseña
   - Esperar a que se complete la restauración

3. **Verificar integridad:**
   - Ir a **Auditoría** → **Verificar Integridad**
   - El sistema validará:
     - ✅ Partida doble
     - ✅ Cadena de auditoría
     - ✅ Timestamp RFC 3161 (si existe)

---

## B. Inteligencia Artificial (Modo Borrador)

### 🤖 Sistema de Reparación Asistida por IA

AccountExpress incluye un sistema de IA que detecta problemas y propone soluciones **sin ejecutar nada automáticamente**.

#### Flujo de Trabajo

```
1. DETECCIÓN
   ↓
2. ANÁLISIS
   ↓
3. PROPUESTA (con preview)
   ↓
4. APROBACIÓN DEL USUARIO
   ↓
5. EJECUCIÓN
   ↓
6. VERIFICACIÓN
```

#### Detección de Anomalías

La IA monitorea continuamente:

| Tipo de Problema | Descripción | Ejemplo |
|------------------|-------------|---------|
| **Partida Doble** | Asientos descuadrados | Débito ≠ Crédito |
| **Datos Faltantes** | Campos requeridos vacíos | Cliente sin nombre |
| **Inconsistencias** | Datos contradictorios | Factura pagada con saldo > 0 |
| **Errores de Cálculo** | Totales incorrectos | Subtotal + Tax ≠ Total |

#### Interpretar Alertas de IA

**Ubicación:** Panel de Control → **Alertas de IA**

**Ejemplo de Alerta:**

```
⚠️ ANOMALÍA DETECTADA

Tipo: Partida Doble Descuadrada
Severidad: ALTA
Módulo: Asientos Contables
ID: JE-2026-001

Descripción:
El asiento contable JE-2026-001 tiene un descuadre de $50.00
- Débitos: $1,500.00
- Créditos: $1,450.00
- Diferencia: $50.00

Propuesta de IA:
Agregar un crédito de $50.00 a la cuenta "Misceláneos" (5999)

[Ver Detalles] [Aprobar] [Rechazar]
```

#### Corrección en 1-Clic

**Paso 1: Revisar Propuesta**
- Hacer clic en **Ver Detalles**
- La IA muestra:
  - ✅ Problema detectado
  - ✅ Causa raíz
  - ✅ Solución propuesta
  - ✅ Preview de los cambios

**Paso 2: Aprobar o Rechazar**
- **Aprobar:** La IA ejecuta la corrección
- **Rechazar:** La IA descarta la propuesta

**Paso 3: Ejecución Automática**
- La IA crea un **backup automático** antes de ejecutar
- Ejecuta la corrección
- Verifica que el problema se resolvió
- Si falla, hace **rollback** automático

**Paso 4: Verificación**
- Mensaje de confirmación:
  ```
  ✅ CORRECCIÓN APLICADA

  Asiento JE-2026-001 corregido exitosamente.
  - Débitos: $1,500.00
  - Créditos: $1,500.00
  - Diferencia: $0.00

  Backup creado: backup-pre-repair-2026-02-09.aex
  ```

#### Funciones Seguras de IA

La IA **solo puede ejecutar** funciones de una lista blanca (whitelist):

| Función | Descripción | Riesgo |
|---------|-------------|--------|
| `fixDoubleEntry` | Corregir partida doble | Bajo |
| `fillMissingData` | Completar datos faltantes | Bajo |
| `recalculateTotals` | Recalcular totales | Bajo |
| `fixTaxCalculation` | Corregir cálculo de impuestos | Medio |

> **🔒 SEGURIDAD:** La IA **NO puede** eliminar datos, modificar auditoría, o ejecutar código arbitrario.

---

## C. Integridad y Legalidad

### 🔏 Sello de Tiempo RFC 3161

AccountExpress implementa el estándar **RFC 3161** para generar sellos de tiempo criptográficos que prueban la existencia de un documento en un momento específico.

#### ¿Qué es RFC 3161?

RFC 3161 es un protocolo de la IETF que permite obtener **timestamps externos** de una **Autoridad de Sellado de Tiempo (TSA)** confiable.

**Características:**
- ✅ **Inmutable:** No puede modificarse después de generado
- ✅ **No Repudio:** Prueba legal de existencia
- ✅ **Independiente:** Verificable por terceros
- ✅ **Estándar:** Aceptado legalmente en muchas jurisdicciones

#### Descargar Certificado de Timestamp

**Ubicación:** Auditoría → Cadena de Auditoría → Seleccionar evento → **Descargar Certificado**

**Pasos:**

1. Ir a **Auditoría** → **Cadena de Auditoría**
2. Buscar el evento que deseas certificar
3. Verificar que tenga el estado **"Verificado"** (icono ✅)
4. Hacer clic en **Acciones** → **Descargar Certificado RFC 3161**
5. Se descargará un archivo `.tsr` (TimeStampResponse)

**Contenido del Certificado:**
- Hash SHA-256 del contenido
- Fecha y hora exacta (UTC)
- Firma digital de la TSA (FreeTSA.org)
- Certificado X.509 de la TSA
- Número de serie único

#### Verificar Certificado Externamente

**Usando OpenSSL:**

```bash
# 1. Guardar el token en un archivo
echo "BASE64_TOKEN" | base64 -d > timestamp.tsr

# 2. Verificar estructura
openssl ts -reply -in timestamp.tsr -text

# 3. Extraer certificado
openssl ts -reply -in timestamp.tsr -token_out -out token.p7s
openssl pkcs7 -in token.p7s -inform DER -print_certs -out cert.pem

# 4. Verificar firma
openssl ts -verify -in timestamp.tsr -data original_data.bin -CAfile freetsa-cacert.pem
```

**Usando AccountExpress:**

1. Ir a **Auditoría** → **Verificar Timestamp**
2. Cargar el archivo `.tsr`
3. Cargar el archivo original (backup o evento)
4. Hacer clic en **Verificar**

**Resultado:**
```
✅ TIMESTAMP VÁLIDO

Fecha: 2026-02-09 19:45:32 UTC
TSA: FreeTSA.org
Serial Number: 0x1a2b3c4d5e6f
Hash: sha256:a1b2c3d4e5f6...
Firma: VÁLIDA
Certificado: CONFIABLE
```

### 🔗 Cadena de Auditoría

#### ¿Qué es la Cadena de Auditoría?

Es un registro **inmutable** de todas las operaciones realizadas en el sistema, similar a una blockchain.

**Características:**
- ✅ **Inmutable:** No puede modificarse ni eliminarse
- ✅ **Encadenada:** Cada evento está vinculado al anterior mediante hash
- ✅ **Verificable:** Cualquier modificación rompe la cadena

#### Estado "Verificado"

**Ubicación:** Auditoría → Cadena de Auditoría → Columna "Estado"

**Posibles Estados:**

| Estado | Icono | Significado |
|--------|-------|-------------|
| **Verificado** | ✅ | Tiene timestamp RFC 3161 válido |
| **Pendiente** | ⏳ | Esperando timestamp de TSA |
| **Local** | 🔒 | Solo hash SHA-256 local |
| **Error** | ❌ | Timestamp inválido o corrupto |

#### Verificar Integridad de la Cadena

1. Ir a **Auditoría** → **Verificar Integridad**
2. Hacer clic en **Verificar Cadena Completa**
3. El sistema verifica:
   - ✅ Cada hash está correctamente calculado
   - ✅ Cada evento está vinculado al anterior
   - ✅ No hay eventos faltantes
   - ✅ Timestamps RFC 3161 son válidos

**Resultado:**
```
✅ CADENA DE AUDITORÍA ÍNTEGRA

Total de eventos: 1,234
Eventos verificados: 1,234
Eventos con RFC 3161: 856 (69%)
Eventos solo locales: 378 (31%)

Primer evento: 2025-12-01 10:00:00 UTC
Último evento: 2026-02-09 19:45:32 UTC

Hash de la cadena: sha256:a1b2c3d4e5f6...
```

---

## D. Interfaz Bilingüe

### 🌐 Selector de Idioma

AccountExpress soporta **Español** e **Inglés** de forma nativa.

#### Cambiar Idioma

**Ubicación:** Configuración → General → Idioma

**Pasos:**

1. Ir a **Configuración** (icono de engranaje)
2. Seleccionar **General**
3. En la sección **Idioma**, seleccionar:
   - 🇪🇸 **Español**
   - 🇺🇸 **English**
4. Hacer clic en **Guardar**
5. La interfaz se actualiza **inmediatamente** (sin recargar)

#### Persistencia del Idioma

El idioma seleccionado se guarda en:
- **LocalStorage:** `accountexpress_language`
- **Base de Datos:** Tabla `sys_config` → `language`

**Fallback:** Si no se encuentra configuración, el sistema usa el idioma del navegador.

#### Impacto en Reportes

| Reporte | Comportamiento |
|---------|----------------|
| **Balance General** | Nombres de cuentas en el idioma seleccionado |
| **Estado de Resultados** | Etiquetas en el idioma seleccionado |
| **DR-15 (Florida Tax)** | Siempre en inglés (requisito legal) |
| **Facturas** | Idioma seleccionado (configurable por cliente) |
| **Nómina (W-2, 941)** | Siempre en inglés (requisito legal) |

#### Terminología Contable (ES/EN)

| Español | English |
|---------|---------|
| Activos | Assets |
| Pasivos | Liabilities |
| Patrimonio | Equity |
| Ingresos | Revenue |
| Gastos | Expenses |
| Débito | Debit |
| Crédito | Credit |
| Asiento Contable | Journal Entry |
| Libro Mayor | General Ledger |
| Balance de Comprobación | Trial Balance |
| Balance General | Balance Sheet |
| Estado de Resultados | Income Statement |
| Flujo de Efectivo | Cash Flow |
| Conciliación Bancaria | Bank Reconciliation |
| Impuesto sobre Ventas | Sales Tax |
| Nómina | Payroll |
| Inventario | Inventory |
| Cuentas por Cobrar | Accounts Receivable |
| Cuentas por Pagar | Accounts Payable |

---

## E. Guía Técnica (Administrador)

### ⚙️ Web Workers

AccountExpress utiliza **Web Workers** para ejecutar tareas pesadas en segundo plano sin bloquear la interfaz.

#### Workers Activos

| Worker | Propósito | Archivo |
|--------|-----------|---------|
| **WorkerOrchestrator** | Gestión centralizada | `WorkerOrchestrator.ts` |
| **WorkerPoolManager** | Pool reutilizable | `WorkerPoolManager.ts` |
| **AsyncPDFService** | Generación de PDFs | `AsyncPDFService.ts` |
| **AsyncCSVService** | Procesamiento de CSV | `AsyncCSVService.ts` |
| **PayrollReportGenerator** | Form 941, W-2, W-3 | `PayrollReportGenerator.ts` |
| **DR15PDFGenerator** | Reportes fiscales FL | `DR15PDFGenerator.ts` |

#### Monitorear Workers

**Ubicación:** Herramientas → Diagnóstico → **Workers**

**Información Mostrada:**
- ✅ Workers activos
- ✅ Tareas en cola
- ✅ Uso de memoria
- ✅ Tiempo de ejecución

**Ejemplo:**
```
📊 WORKERS ACTIVOS

AsyncPDFService
- Estado: Ejecutando
- Tarea: Generar Balance General
- Progreso: 75%
- Tiempo: 2.3s

AsyncCSVService
- Estado: Inactivo
- Última tarea: Exportar facturas (completada)
```

### 🔄 GitHub CI/CD

AccountExpress utiliza **GitHub Actions** para automatizar el despliegue.

#### Pipeline de Despliegue

```
1. VALIDACIÓN Y TESTING
   ├─ Lint code (ESLint)
   ├─ Run tests (Vitest)
   ├─ Upload coverage (Codecov)
   └─ Build project (Vite)

2. SECURITY SCAN
   ├─ npm audit
   └─ TruffleHog (secrets detection)

3. AUTO-RELEASE (solo en main)
   ├─ Extract version from package.json
   ├─ Create release archive
   ├─ Generate release notes
   └─ Create GitHub Release

4. DEPLOY DOCUMENTATION
   └─ Deploy to GitHub Pages

5. NOTIFY SUCCESS
   └─ Pipeline completion notification
```

#### Verificar Estado del Pipeline

**Ubicación:** [GitHub Actions](https://github.com/OmarMira/Coontabilidad/actions)

**Estados Posibles:**

| Estado | Icono | Significado |
|--------|-------|-------------|
| **Success** | ✅ | Todas las pruebas pasaron |
| **Failure** | ❌ | Al menos una prueba falló |
| **In Progress** | 🔄 | Pipeline ejecutándose |
| **Cancelled** | ⚠️ | Pipeline cancelado manualmente |

#### Revisar Logs de CI/CD

1. Ir a [GitHub Actions](https://github.com/OmarMira/Coontabilidad/actions)
2. Seleccionar el workflow más reciente
3. Hacer clic en el job que deseas revisar (ej: "Validate & Test")
4. Expandir los pasos para ver logs detallados

**Ejemplo de Log:**
```
📦 Setup Node.js
✅ Node.js 18.x installed

📚 Install dependencies
✅ npm ci completed (45s)

🔍 Lint code
✅ ESLint passed (12s)

🧪 Run tests
✅ 195/227 tests passed (86% coverage)

🏗️ Build project
✅ Build completed (23s)
```

#### Pruebas de Seguridad

El pipeline ejecuta automáticamente:

1. **npm audit:** Detecta vulnerabilidades en dependencias
2. **TruffleHog:** Busca secretos expuestos (API keys, passwords)

**Si falla:**
- El pipeline se detiene
- Se envía una notificación
- El merge a `main` se bloquea

---

# ENGLISH

## A. Data Management and Cloud

### 🔐 Hybrid Backup

AccountExpress implements a hybrid backup system that allows you to save encrypted backups to multiple destinations:

#### Available Destinations

| Destination | Description | Required Configuration |
|-------------|-------------|------------------------|
| **Local** | Direct download to disk | None |
| **Google Drive** | Automatic synchronization | API Key + Access Token |
| **AWS S3** | Cloud storage | Access Key + Secret Key + Bucket + Region |
| **Remote Server** | Custom REST API | URL + API Key |

#### Google Drive Configuration

1. **Obtain Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable "Google Drive API"
   - Create OAuth 2.0 credentials
   - Download the JSON credentials file

2. **Configure in AccountExpress:**
   - Go to **Settings** → **Backups** → **Cloud**
   - Select "Google Drive"
   - Paste the **Access Token** (obtained via OAuth)
   - Click **Save**

3. **Environment Variables (.env):**
   ```env
   VITE_GOOGLE_DRIVE_API_KEY=your_api_key_here
   ```

> **⚠️ SECURITY NOTE:** Never share your Access Token. Store it securely and renew it every 60 days.

#### AWS S3 Configuration

1. **Obtain Credentials:**
   - Go to [AWS Console](https://console.aws.amazon.com/)
   - Navigate to **IAM** → **Users** → **Create user**
   - Assign permissions: `s3:PutObject`, `s3:GetObject`
   - Download **Access Key ID** and **Secret Access Key**

2. **Create Bucket:**
   - Go to **S3** → **Create bucket**
   - Name: `accountexpress-backups-[your-company]`
   - Region: `us-east-1` (or closest)
   - Block public access: **Enabled**

3. **Configure in AccountExpress:**
   - Go to **Settings** → **Backups** → **Cloud**
   - Select "AWS S3"
   - Enter:
     - **Access Key ID**
     - **Secret Access Key**
     - **Bucket Name**
     - **Region** (e.g., `us-east-1`)
   - Click **Save**

4. **Environment Variables (.env):**
   ```env
   VITE_AWS_ACCESS_KEY_ID=your_access_key_here
   VITE_AWS_SECRET_ACCESS_KEY=your_secret_key_here
   VITE_AWS_S3_BUCKET=accountexpress-backups-your-company
   VITE_AWS_S3_REGION=us-east-1
   ```

> **⚠️ SECURITY NOTE:** AWS credentials are extremely sensitive. Use IAM Roles in production and never expose them in source code.

#### Create a Backup

1. Go to **Tools** → **Backup and Restore**
2. Click **Create Backup**
3. Enter a **strong password** (minimum 12 characters)
4. Select destination(s):
   - ☑️ Local (download .aex)
   - ☑️ Google Drive
   - ☑️ AWS S3
5. Click **Create**

**Result:**
- File encrypted with AES-256-GCM
- RFC 3161 timestamp (if available)
- Preserved metadata (logic_clock, date, size)

#### Restore a Backup

1. Go to **Tools** → **Backup and Restore**
2. Click **Restore**
3. Select source:
   - **Local:** Upload .aex file
   - **Google Drive:** Select from list
   - **AWS S3:** Select from list
4. Enter the **password** used when creating the backup
5. Click **Restore**

> **⚠️ WARNING:** Restoration is ATOMIC (all or nothing). If it fails, the database is NOT modified.

### 🔄 Data Loss Recovery

#### Scenario: Browser clears cache

**Symptoms:**
- When opening AccountExpress, the database is empty
- Message: "No data found. Would you like to restore from a backup?"

**Solution:**

1. **If you have cloud backups:**
   - Click **Restore from Cloud**
   - Select the most recent backup
   - Enter the password
   - Wait for restoration to complete

2. **If you have local backups (.aex):**
   - Click **Load Local Backup**
   - Select the .aex file
   - Enter the password
   - Wait for restoration to complete

3. **Verify integrity:**
   - Go to **Audit** → **Verify Integrity**
   - The system will validate:
     - ✅ Double-entry bookkeeping
     - ✅ Audit chain
     - ✅ RFC 3161 timestamp (if exists)

---

## B. Artificial Intelligence (Draft Mode)

### 🤖 AI-Assisted Repair System

AccountExpress includes an AI system that detects problems and proposes solutions **without executing anything automatically**.

#### Workflow

```
1. DETECTION
   ↓
2. ANALYSIS
   ↓
3. PROPOSAL (with preview)
   ↓
4. USER APPROVAL
   ↓
5. EXECUTION
   ↓
6. VERIFICATION
```

#### Anomaly Detection

The AI continuously monitors:

| Problem Type | Description | Example |
|--------------|-------------|---------|
| **Double Entry** | Unbalanced entries | Debit ≠ Credit |
| **Missing Data** | Empty required fields | Customer without name |
| **Inconsistencies** | Contradictory data | Paid invoice with balance > 0 |
| **Calculation Errors** | Incorrect totals | Subtotal + Tax ≠ Total |

#### Interpreting AI Alerts

**Location:** Dashboard → **AI Alerts**

**Alert Example:**

```
⚠️ ANOMALY DETECTED

Type: Unbalanced Double Entry
Severity: HIGH
Module: Journal Entries
ID: JE-2026-001

Description:
Journal entry JE-2026-001 has an imbalance of $50.00
- Debits: $1,500.00
- Credits: $1,450.00
- Difference: $50.00

AI Proposal:
Add a $50.00 credit to "Miscellaneous" account (5999)

[View Details] [Approve] [Reject]
```

#### 1-Click Correction

**Step 1: Review Proposal**
- Click **View Details**
- The AI shows:
  - ✅ Detected problem
  - ✅ Root cause
  - ✅ Proposed solution
  - ✅ Preview of changes

**Step 2: Approve or Reject**
- **Approve:** AI executes the correction
- **Reject:** AI discards the proposal

**Step 3: Automatic Execution**
- AI creates an **automatic backup** before executing
- Executes the correction
- Verifies the problem is resolved
- If it fails, performs **automatic rollback**

**Step 4: Verification**
- Confirmation message:
  ```
  ✅ CORRECTION APPLIED

  Entry JE-2026-001 corrected successfully.
  - Debits: $1,500.00
  - Credits: $1,500.00
  - Difference: $0.00

  Backup created: backup-pre-repair-2026-02-09.aex
  ```

#### AI Safe Functions

The AI **can only execute** functions from a whitelist:

| Function | Description | Risk |
|----------|-------------|------|
| `fixDoubleEntry` | Fix double-entry bookkeeping | Low |
| `fillMissingData` | Complete missing data | Low |
| `recalculateTotals` | Recalculate totals | Low |
| `fixTaxCalculation` | Fix tax calculation | Medium |

> **🔒 SECURITY:** The AI **CANNOT** delete data, modify audit records, or execute arbitrary code.

---

## C. Integrity and Legal Compliance

### 🔏 RFC 3161 Timestamp

AccountExpress implements the **RFC 3161** standard to generate cryptographic timestamps that prove the existence of a document at a specific time.

#### What is RFC 3161?

RFC 3161 is an IETF protocol that allows obtaining **external timestamps** from a trusted **Time Stamp Authority (TSA)**.

**Features:**
- ✅ **Immutable:** Cannot be modified after generation
- ✅ **Non-Repudiation:** Legal proof of existence
- ✅ **Independent:** Verifiable by third parties
- ✅ **Standard:** Legally accepted in many jurisdictions

#### Download Timestamp Certificate

**Location:** Audit → Audit Chain → Select event → **Download Certificate**

**Steps:**

1. Go to **Audit** → **Audit Chain**
2. Find the event you want to certify
3. Verify it has **"Verified"** status (✅ icon)
4. Click **Actions** → **Download RFC 3161 Certificate**
5. A `.tsr` file (TimeStampResponse) will be downloaded

**Certificate Contents:**
- SHA-256 hash of content
- Exact date and time (UTC)
- TSA digital signature (FreeTSA.org)
- TSA X.509 certificate
- Unique serial number

#### Verify Certificate Externally

**Using OpenSSL:**

```bash
# 1. Save token to file
echo "BASE64_TOKEN" | base64 -d > timestamp.tsr

# 2. Verify structure
openssl ts -reply -in timestamp.tsr -text

# 3. Extract certificate
openssl ts -reply -in timestamp.tsr -token_out -out token.p7s
openssl pkcs7 -in token.p7s -inform DER -print_certs -out cert.pem

# 4. Verify signature
openssl ts -verify -in timestamp.tsr -data original_data.bin -CAfile freetsa-cacert.pem
```

**Using AccountExpress:**

1. Go to **Audit** → **Verify Timestamp**
2. Upload the `.tsr` file
3. Upload the original file (backup or event)
4. Click **Verify**

**Result:**
```
✅ VALID TIMESTAMP

Date: 2026-02-09 19:45:32 UTC
TSA: FreeTSA.org
Serial Number: 0x1a2b3c4d5e6f
Hash: sha256:a1b2c3d4e5f6...
Signature: VALID
Certificate: TRUSTED
```

### 🔗 Audit Chain

#### What is the Audit Chain?

It is an **immutable** record of all operations performed in the system, similar to a blockchain.

**Features:**
- ✅ **Immutable:** Cannot be modified or deleted
- ✅ **Chained:** Each event is linked to the previous one via hash
- ✅ **Verifiable:** Any modification breaks the chain

#### "Verified" Status

**Location:** Audit → Audit Chain → "Status" column

**Possible States:**

| Status | Icon | Meaning |
|--------|------|---------|
| **Verified** | ✅ | Has valid RFC 3161 timestamp |
| **Pending** | ⏳ | Waiting for TSA timestamp |
| **Local** | 🔒 | Only local SHA-256 hash |
| **Error** | ❌ | Invalid or corrupt timestamp |

#### Verify Chain Integrity

1. Go to **Audit** → **Verify Integrity**
2. Click **Verify Complete Chain**
3. The system verifies:
   - ✅ Each hash is correctly calculated
   - ✅ Each event is linked to the previous one
   - ✅ No missing events
   - ✅ RFC 3161 timestamps are valid

**Result:**
```
✅ AUDIT CHAIN INTEGRITY VERIFIED

Total events: 1,234
Verified events: 1,234
Events with RFC 3161: 856 (69%)
Local-only events: 378 (31%)

First event: 2025-12-01 10:00:00 UTC
Last event: 2026-02-09 19:45:32 UTC

Chain hash: sha256:a1b2c3d4e5f6...
```

---

## D. Bilingual Interface

### 🌐 Language Selector

AccountExpress natively supports **Spanish** and **English**.

#### Change Language

**Location:** Settings → General → Language

**Steps:**

1. Go to **Settings** (gear icon)
2. Select **General**
3. In the **Language** section, select:
   - 🇪🇸 **Español**
   - 🇺🇸 **English**
4. Click **Save**
5. The interface updates **immediately** (without reloading)

#### Language Persistence

The selected language is saved in:
- **LocalStorage:** `accountexpress_language`
- **Database:** `sys_config` table → `language`

**Fallback:** If no configuration is found, the system uses the browser language.

#### Impact on Reports

| Report | Behavior |
|--------|----------|
| **Balance Sheet** | Account names in selected language |
| **Income Statement** | Labels in selected language |
| **DR-15 (Florida Tax)** | Always in English (legal requirement) |
| **Invoices** | Selected language (configurable per customer) |
| **Payroll (W-2, 941)** | Always in English (legal requirement) |

---

## E. Technical Guide (Administrator)

### ⚙️ Web Workers

AccountExpress uses **Web Workers** to execute heavy tasks in the background without blocking the interface.

#### Active Workers

| Worker | Purpose | File |
|--------|---------|------|
| **WorkerOrchestrator** | Centralized management | `WorkerOrchestrator.ts` |
| **WorkerPoolManager** | Reusable pool | `WorkerPoolManager.ts` |
| **AsyncPDFService** | PDF generation | `AsyncPDFService.ts` |
| **AsyncCSVService** | CSV processing | `AsyncCSVService.ts` |
| **PayrollReportGenerator** | Form 941, W-2, W-3 | `PayrollReportGenerator.ts` |
| **DR15PDFGenerator** | FL tax reports | `DR15PDFGenerator.ts` |

#### Monitor Workers

**Location:** Tools → Diagnostics → **Workers**

**Information Displayed:**
- ✅ Active workers
- ✅ Queued tasks
- ✅ Memory usage
- ✅ Execution time

**Example:**
```
📊 ACTIVE WORKERS

AsyncPDFService
- Status: Running
- Task: Generate Balance Sheet
- Progress: 75%
- Time: 2.3s

AsyncCSVService
- Status: Idle
- Last task: Export invoices (completed)
```

### 🔄 GitHub CI/CD

AccountExpress uses **GitHub Actions** to automate deployment.

#### Deployment Pipeline

```
1. VALIDATION AND TESTING
   ├─ Lint code (ESLint)
   ├─ Run tests (Vitest)
   ├─ Upload coverage (Codecov)
   └─ Build project (Vite)

2. SECURITY SCAN
   ├─ npm audit
   └─ TruffleHog (secrets detection)

3. AUTO-RELEASE (main branch only)
   ├─ Extract version from package.json
   ├─ Create release archive
   ├─ Generate release notes
   └─ Create GitHub Release

4. DEPLOY DOCUMENTATION
   └─ Deploy to GitHub Pages

5. NOTIFY SUCCESS
   └─ Pipeline completion notification
```

#### Check Pipeline Status

**Location:** [GitHub Actions](https://github.com/OmarMira/Coontabilidad/actions)

**Possible States:**

| Status | Icon | Meaning |
|--------|------|---------|
| **Success** | ✅ | All tests passed |
| **Failure** | ❌ | At least one test failed |
| **In Progress** | 🔄 | Pipeline running |
| **Cancelled** | ⚠️ | Pipeline manually cancelled |

#### Review CI/CD Logs

1. Go to [GitHub Actions](https://github.com/OmarMira/Coontabilidad/actions)
2. Select the most recent workflow
3. Click on the job you want to review (e.g., "Validate & Test")
4. Expand steps to see detailed logs

**Log Example:**
```
📦 Setup Node.js
✅ Node.js 18.x installed

📚 Install dependencies
✅ npm ci completed (45s)

🔍 Lint code
✅ ESLint passed (12s)

🧪 Run tests
✅ 195/227 tests passed (86% coverage)

🏗️ Build project
✅ Build completed (23s)
```

#### Security Tests

The pipeline automatically runs:

1. **npm audit:** Detects vulnerabilities in dependencies
2. **TruffleHog:** Searches for exposed secrets (API keys, passwords)

**If it fails:**
- Pipeline stops
- Notification is sent
- Merge to `main` is blocked

---

## 📚 REFERENCIAS / REFERENCES

### Documentación Técnica / Technical Documentation
- [RFC 3161 - Time-Stamp Protocol](https://www.ietf.org/rfc/rfc3161.txt)
- [MANUAL_AUDITORIA_RFC3161.md](./MANUAL_AUDITORIA_RFC3161.md)
- [README.md](./README.md)
- [ESTADO-ACTUAL-SISTEMA.md](./ESTADO-ACTUAL-SISTEMA.md)

### Servicios Externos / External Services
- **FreeTSA:** https://freetsa.org (RFC 3161 Timestamps)
- **Google Drive API:** https://developers.google.com/drive
- **AWS S3:** https://aws.amazon.com/s3

### Soporte / Support
- 📧 Email: support@accountexpress.com
- 🐛 Issues: [GitHub Issues](https://github.com/OmarMira/Coontabilidad/issues)
- 📖 Docs: [Wiki del Proyecto](https://github.com/OmarMira/Coontabilidad/wiki)

---

**Creado por / Created by:** Antigravity AI - Senior Full-Stack Engineer  
**Fecha / Date:** 9 de Febrero, 2026  
**Versión / Version:** 1.0.1  
**Sistema / System:** AccountExpress Next-Gen
