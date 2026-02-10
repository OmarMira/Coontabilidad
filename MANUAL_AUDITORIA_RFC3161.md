# 📖 MANUAL DE AUDITORÍA - RFC 3161 Timestamp Verification

**Versión**: 1.0.1  
**Fecha**: 9 de febrero de 2026  
**Estándar**: RFC 3161 - Internet X.509 Public Key Infrastructure Time-Stamp Protocol (TSP)

---

## 🎯 OBJETIVO

Este manual documenta cómo verificar los registros de auditoría mediante el estándar RFC 3161 implementado en `TimestampService.ts`.

---

## 📋 TABLA DE CONTENIDOS

1. [Introducción a RFC 3161](#introducción-a-rfc-3161)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Proceso de Timestamping](#proceso-de-timestamping)
4. [Verificación de Timestamps](#verificación-de-timestamps)
5. [Herramientas de Verificación](#herramientas-de-verificación)
6. [Casos de Uso](#casos-de-uso)
7. [Troubleshooting](#troubleshooting)

---

## 1. INTRODUCCIÓN A RFC 3161

### ¿Qué es RFC 3161?

RFC 3161 es un estándar de la IETF que define un protocolo para obtener **timestamps criptográficos** de una **Autoridad de Sellado de Tiempo (TSA)** confiable.

### Características

- **Inmutabilidad**: Una vez generado, el timestamp no puede modificarse
- **No Repudio**: Prueba que un documento existía en un momento específico
- **Independencia**: Verificable por terceros sin acceso al sistema original
- **Estándar**: Aceptado legalmente en muchas jurisdicciones

### Componentes

1. **TSA (Time Stamp Authority)**: Servidor que genera timestamps
2. **TimeStampReq**: Solicitud de timestamp (ASN.1 DER)
3. **TimeStampResp**: Respuesta con timestamp firmado (ASN.1 DER)
4. **TimeStampToken**: Token firmado con certificado X.509

---

## 2. ARQUITECTURA DEL SISTEMA

### Archivo Principal

**Ubicación**: `src/core/timestamping/TimestampService.ts`

### Componentes

```
┌─────────────────────────────────────────────┐
│         TimestampService                    │
├─────────────────────────────────────────────┤
│ + getTimestamp(request)                     │
│ + verifyTimestamp(token, data)              │
│ - createTimeStampReq(hash, request)         │
│ - parseTimeStampResp(response)              │
│ - verifySignature(token, data)              │
└─────────────────────────────────────────────┘
           │
           ├─── FreeTSA.org (https://freetsa.org/tsr)
           │
           └─── Web Crypto API (SHA-256)
```

### Integración

| Servicio | Uso | Archivo |
|----------|-----|---------|
| BackupService | Timestamp de backups | `src/services/backup/BackupService.ts` |
| BatchAuditSystem | Timestamp de audit chain | `src/core/audit/BatchAuditSystem.ts` |
| AIRepairService | Timestamp de reparaciones | `src/services/ai/AIRepairService.ts` |

---

## 3. PROCESO DE TIMESTAMPING

### Flujo Completo

```
1. Aplicación genera datos (backup, audit event, etc.)
   │
   ├─> 2. Calcula SHA-256 hash del contenido
   │
   ├─> 3. Crea TimeStampReq (ASN.1 DER)
   │
   ├─> 4. Envía a FreeTSA.org
   │
   ├─> 5. Recibe TimeStampResp firmado
   │
   ├─> 6. Extrae timestamp y certificado
   │
   └─> 7. Almacena token con los datos
```

### Código de Ejemplo

```typescript
import { timestampService } from './core/timestamping/TimestampService';

// 1. Preparar datos
const dataToTimestamp = new TextEncoder().encode(backupData);

// 2. Solicitar timestamp
const timestampResponse = await timestampService.getTimestamp({
  data: dataToTimestamp.buffer,
  hashAlgorithm: 'SHA-256',
  nonce: true,
  certReq: true
});

// 3. Resultado
console.log('Timestamp:', timestampResponse.timestamp);
console.log('Serial Number:', timestampResponse.serialNumber);
console.log('TSA Name:', timestampResponse.tsaName);
console.log('Token:', timestampResponse.token); // Base64
```

### Estructura del TimeStampReq

```asn1
TimeStampReq ::= SEQUENCE {
  version         INTEGER { v1(1) }
  messageImprint  MessageImprint
  reqPolicy       OBJECT IDENTIFIER OPTIONAL
  nonce           INTEGER OPTIONAL
  certReq         BOOLEAN DEFAULT FALSE
}

MessageImprint ::= SEQUENCE {
  hashAlgorithm   AlgorithmIdentifier
  hashedMessage   OCTET STRING
}
```

### Estructura del TimeStampResp

```asn1
TimeStampResp ::= SEQUENCE {
  status          PKIStatusInfo
  timeStampToken  TimeStampToken OPTIONAL
}

TimeStampToken ::= ContentInfo
  -- Firmado con certificado X.509 de la TSA
```

---

## 4. VERIFICACIÓN DE TIMESTAMPS

### Proceso de Verificación

```
1. Obtener timestamp token (Base64)
   │
   ├─> 2. Decodificar token (ASN.1 DER)
   │
   ├─> 3. Extraer hash del contenido original
   │
   ├─> 4. Calcular hash de los datos actuales
   │
   ├─> 5. Comparar hashes
   │
   ├─> 6. Verificar firma del certificado TSA
   │
   └─> 7. Validar cadena de certificados
```

### Código de Verificación

```typescript
// 1. Obtener token y datos originales
const token = backup.rfc3161Timestamp.token;
const data = new TextEncoder().encode(backup.data);

// 2. Verificar timestamp
const verification = await timestampService.verifyTimestamp(
  token,
  data.buffer
);

// 3. Resultado
if (verification.valid) {
  console.log('✅ Timestamp válido');
  console.log('Fecha:', verification.timestamp);
  console.log('TSA:', verification.tsaName);
} else {
  console.log('❌ Timestamp inválido');
  console.log('Errores:', verification.errors);
}
```

### Verificaciones Realizadas

| Verificación | Descripción |
|--------------|-------------|
| **Hash Match** | El hash en el token coincide con el hash de los datos |
| **Signature** | La firma del TSA es válida |
| **Certificate** | El certificado del TSA es confiable |
| **Timestamp** | La fecha del timestamp es razonable |

---

## 5. HERRAMIENTAS DE VERIFICACIÓN

### Verificación en AccountExpress

**Ubicación**: Panel de Auditoría → Verificar Timestamp

```typescript
// En el código
import { timestampService } from './core/timestamping/TimestampService';

const result = await timestampService.verifyTimestamp(token, data);
```

### Verificación con OpenSSL

```bash
# 1. Guardar token en archivo
echo "BASE64_TOKEN" | base64 -d > timestamp.tsr

# 2. Verificar estructura
openssl ts -reply -in timestamp.tsr -text

# 3. Extraer certificado
openssl ts -reply -in timestamp.tsr -token_out -out token.p7s
openssl pkcs7 -in token.p7s -inform DER -print_certs -out cert.pem

# 4. Verificar firma
openssl ts -verify -in timestamp.tsr -data original_data.bin -CAfile freetsa-cacert.pem
```

### Verificación con Python

```python
import hashlib
import base64
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

# 1. Decodificar token
token_bytes = base64.b64decode(token_base64)

# 2. Calcular hash de datos
data_hash = hashlib.sha256(data).digest()

# 3. Parsear token (requiere pyasn1)
# ... (implementación específica)

# 4. Verificar firma
# ... (implementación específica)
```

---

## 6. CASOS DE USO

### Caso 1: Verificar Backup

```typescript
// 1. Cargar backup
const backup = await backupService.loadBackup('backup-2026-02-09.aex');

// 2. Verificar timestamp
if (backup.rfc3161Timestamp) {
  const verification = await timestampService.verifyTimestamp(
    backup.rfc3161Timestamp.token,
    new TextEncoder().encode(backup.data).buffer
  );
  
  if (verification.valid) {
    console.log(`✅ Backup creado el ${verification.timestamp}`);
    console.log(`✅ Certificado por ${verification.tsaName}`);
  } else {
    console.error('❌ Backup comprometido o modificado');
  }
}
```

### Caso 2: Verificar Audit Chain

```typescript
// 1. Obtener evento de audit chain
const event = await db.select(
  'SELECT * FROM audit_chain WHERE id = ?',
  [eventId]
);

// 2. Verificar timestamp (si existe)
if (event.rfc3161_token) {
  const verification = await timestampService.verifyTimestamp(
    event.rfc3161_token,
    new TextEncoder().encode(event.content_payload).buffer
  );
  
  if (verification.valid) {
    console.log(`✅ Evento registrado el ${verification.timestamp}`);
  }
}
```

### Caso 3: Auditoría Externa

```typescript
// 1. Exportar datos para auditoría
const auditPackage = {
  data: backup.data,
  timestamp: backup.rfc3161Timestamp.token,
  metadata: {
    logicClock: backup.logicClock,
    timestamp: backup.timestamp
  }
};

// 2. Auditor externo verifica
const verification = await timestampService.verifyTimestamp(
  auditPackage.timestamp,
  new TextEncoder().encode(auditPackage.data).buffer
);

// 3. Generar reporte de auditoría
const report = {
  valid: verification.valid,
  timestamp: verification.timestamp,
  tsa: verification.tsaName,
  serialNumber: verification.serialNumber,
  errors: verification.errors
};
```

---

## 7. TROUBLESHOOTING

### Problema: "TSA Unreachable"

**Síntoma**: Error al solicitar timestamp

**Causas**:
- FreeTSA.org está caído
- Problemas de red/firewall
- CORS bloqueado

**Solución**:
```typescript
// El sistema tiene fallback automático
// Ver logs en ProductionLogger:
ProductionLogger.warn('TimestampService', 'TSA unreachable, using fallback');

// Configurar TSA alternativa en .env:
VITE_TSA_URL=https://timestamp.digicert.com
```

### Problema: "Invalid Signature"

**Síntoma**: Verificación falla con error de firma

**Causas**:
- Datos modificados después del timestamp
- Token corrupto
- Certificado TSA expirado

**Solución**:
```typescript
// 1. Verificar integridad de datos
const currentHash = await crypto.subtle.digest('SHA-256', data);

// 2. Comparar con hash original
if (currentHash !== originalHash) {
  console.error('Datos modificados');
}

// 3. Verificar certificado TSA
const cert = extractCertificate(token);
if (cert.notAfter < new Date()) {
  console.error('Certificado TSA expirado');
}
```

### Problema: "Hash Mismatch"

**Síntoma**: Hash en token no coincide con hash de datos

**Causas**:
- Datos modificados
- Encoding incorrecto
- Timestamp aplicado a datos diferentes

**Solución**:
```typescript
// Verificar encoding
const encoder = new TextEncoder();
const data1 = encoder.encode(string); // UTF-8
const data2 = new Uint8Array(buffer); // Binary

// Asegurar mismo formato
const hash1 = await crypto.subtle.digest('SHA-256', data1);
const hash2 = await crypto.subtle.digest('SHA-256', data2);
```

---

## 📚 REFERENCIAS

### Estándares

- **RFC 3161**: Time-Stamp Protocol (TSP)
  - https://www.ietf.org/rfc/rfc3161.txt

- **RFC 5652**: Cryptographic Message Syntax (CMS)
  - https://www.ietf.org/rfc/rfc5652.txt

- **X.509**: Public Key Infrastructure
  - https://www.itu.int/rec/T-REC-X.509

### TSA Providers

- **FreeTSA**: https://freetsa.org
  - Endpoint: https://freetsa.org/tsr
  - Certificado: https://freetsa.org/files/cacert.pem

- **DigiCert**: https://timestamp.digicert.com
  - Endpoint: https://timestamp.digicert.com

### Herramientas

- **OpenSSL**: https://www.openssl.org/
- **Python cryptography**: https://cryptography.io/
- **ASN.1 JavaScript Decoder**: https://lapo.it/asn1js/

---

## ✅ CHECKLIST DE AUDITORÍA

### Pre-Auditoría

- [ ] Obtener backup o evento a auditar
- [ ] Verificar que tiene RFC 3161 timestamp
- [ ] Extraer token y datos originales
- [ ] Preparar herramientas de verificación

### Verificación

- [ ] Decodificar token ASN.1
- [ ] Calcular hash de datos actuales
- [ ] Comparar con hash en token
- [ ] Verificar firma del TSA
- [ ] Validar certificado TSA
- [ ] Verificar fecha del timestamp

### Post-Auditoría

- [ ] Documentar resultados
- [ ] Generar reporte de auditoría
- [ ] Archivar evidencias
- [ ] Notificar hallazgos (si aplica)

---

**Creado por**: Antigravity AI - Senior Full-Stack Engineer  
**Fecha**: 9 de febrero de 2026  
**Versión**: 1.0.1  
**Estándar**: RFC 3161
