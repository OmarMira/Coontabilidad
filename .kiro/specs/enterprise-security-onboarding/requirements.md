# Enterprise Security Onboarding - Requirements

**Fecha**: 5 de febrero de 2026
**Prioridad**: P0 (Crítico para Producción)
**Estado**: Draft
**Estimación**: 3-4 días

---

## 🎯 OBJETIVO

Eliminar vulnerabilidades críticas de seguridad y crear un sistema de onboarding enterprise-grade que permita:
1. Despliegue seguro en producción (sin bypass hardcodeado)
2. Experiencia de demostración sin riesgos (Modo Sandbox)
3. Configuración inicial guiada para nuevos clientes
4. Integración completa de Google SSO

---

## 📋 REQUIREMENTS

### **REQ-1: Eliminar Bypass Hardcodeado** 🔴 P0 - CRÍTICO

**User Story**:
> Como administrador de seguridad, necesito que el sistema NO tenga credenciales hardcodeadas en el código para cumplir con estándares de seguridad enterprise (SOC 2, ISO 27001).

**Problema Actual**:
- Archivo: `src/contexts/AuthContext.tsx` líneas 66-105
- Credenciales hardcodeadas:
  - `admin / admin123`
  - `demo / demo123`
- Bypass completo de autenticación de base de datos
- No se registra en auditoría
- Contraseñas débiles y conocidas públicamente

**Acceptance Criteria**:
- [ ] Eliminar completamente el bloque de código de bypass (líneas 66-105)
- [ ] Todas las autenticaciones deben pasar por `UserService.authenticateUser()`
- [ ] Verificar que el bundle de producción NO contiene las credenciales
- [ ] Tests unitarios confirman que admin/admin123 NO funciona
- [ ] Tests confirman que solo usuarios de BD pueden autenticarse

**Impacto**:
- **Seguridad**: Elimina vector de ataque crítico
- **Auditoría**: Todos los logins quedan registrados
- **Compliance**: Cumple con SOC 2 / ISO 27001

**Riesgo si NO se implementa**:
- ❌ Acceso no autorizado en producción
- ❌ Falla de auditoría de seguridad
- ❌ Incumplimiento de compliance
- ❌ Responsabilidad legal

---

### **REQ-2: Modo Sandbox (Demo Seguro)** 🟡 P1 - ALTA

**User Story**:
> Como usuario potencial, quiero probar el sistema sin registrarme, pero sin que mis datos de prueba afecten la base de datos real.

**Funcionalidad**:
- Botón "Probar Demo" en `LoginForm.tsx`
- Crea usuario temporal con rol `GUEST` (nuevo rol)
- Sesión en memoria (no persiste en BD)
- Límite de 20 registros por entidad
- No puede UPDATE/DELETE usuarios
- No puede modificar configuración del sistema
- Sesión expira en 30 minutos de inactividad

**Acceptance Criteria**:
- [ ] Nuevo rol `GUEST` en tabla `user_roles` con level=5
- [ ] Botón "Probar Demo" en `LoginForm.tsx` (verde, con icono Zap)
- [ ] Función `loginAsGuest()` en `AuthContext.tsx`
- [ ] Interceptor en `simple-db.ts` que bloquea persistencia para GUEST
- [ ] Límite de 20 registros por entidad (customers, suppliers, products, etc.)
- [ ] UI muestra badge "MODO DEMO" en header
- [ ] Mensaje informativo al intentar operaciones bloqueadas
- [ ] Test unitario: GUEST no puede crear más de 20 clientes
- [ ] Test unitario: GUEST no puede UPDATE/DELETE usuarios
- [ ] Test unitario: GUEST no puede modificar payroll_settings

**Permisos del Rol GUEST**:
```json
{
  "dashboard": ["view"],
  "customers": ["view", "create"],
  "suppliers": ["view", "create"],
  "products": ["view", "create"],
  "sales": ["view_invoices", "create_invoice"],
  "purchases": ["view_bills"],
  "accounting": ["view_chart_of_accounts", "view_reports"],
  "reports": ["view_financial", "view_tax"],
  "settings": []
}
```

**Límites Técnicos**:
- Max 20 customers
- Max 20 suppliers
- Max 20 products
- Max 10 invoices
- Max 10 bills
- Max 5 journal entries
- No puede crear usuarios
- No puede modificar roles
- No puede cambiar configuración de empresa

---

### **REQ-3: Initial Setup Wizard** 🟡 P1 - ALTA

**User Story**:
> Como nuevo cliente, necesito un wizard guiado que me ayude a configurar el sistema por primera vez de forma segura y completa.

**Flujo del Wizard**:

#### **Step 1: Bienvenida**
- Logo y mensaje de bienvenida
- Explicación del proceso (4 pasos)
- Botón "Comenzar Configuración"

#### **Step 2: Crear Administrador**
- Formulario:
  - Username (min 3 chars)
  - Email (validación)
  - Full Name
  - Password (min 12 chars, validación de fortaleza)
  - Confirm Password
- Validaciones en tiempo real
- Indicador de fortaleza de contraseña
- Crear usuario con rol `admin`

#### **Step 3: Configuración de Seguridad**
- Generar Master Key de cifrado (BasicEncryption)
- Mostrar Master Key (solo una vez)
- Checkbox: "He guardado la Master Key en lugar seguro"
- Warning: "Si pierdes esta clave, no podrás recuperar datos cifrados"
- Opción: Descargar Master Key como archivo .txt

#### **Step 4: Datos de la Empresa**
- Formulario:
  - Nombre de la empresa
  - RUT/Tax ID
  - Dirección
  - Teléfono
  - Email
  - Logo (opcional)
- Guardar en tabla `company_settings`

#### **Step 5: Confirmación**
- Resumen de configuración
- Botón "Finalizar y Acceder al Sistema"
- Marcar flag `initial_setup_completed` en localStorage
- Redirect a Dashboard

**Acceptance Criteria**:
- [ ] Componente `InitialSetupWizard.tsx` en `src/components/setup/`
- [ ] Wizard se muestra solo si `initial_setup_completed !== 'true'`
- [ ] Validación de fortaleza de contraseña (min 12 chars, mayúsculas, números, símbolos)
- [ ] Generación de Master Key usando `BasicEncryption.generateKey()`
- [ ] Descarga de Master Key como archivo `accountexpress-master-key.txt`
- [ ] Tabla `company_settings` creada en `simple-db.ts`
- [ ] Flag `initial_setup_completed` en localStorage
- [ ] Test E2E: Completar wizard y verificar admin creado
- [ ] Test: Wizard no se muestra si flag existe

**Tabla `company_settings`**:
```sql
CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### **REQ-4: Google SSO Integration** 🟢 P2 - MEDIA

**User Story**:
> Como usuario, quiero iniciar sesión con mi cuenta de Google para evitar crear otra contraseña.

**Estado Actual**:
- ✅ `GoogleLoginButton.tsx` existe
- ✅ `loginWithGoogle()` implementado en `AuthContext.tsx`
- ✅ Auto-registro con rol `viewer`
- ⚠️ Falta configuración de entorno

**Acceptance Criteria**:
- [ ] Documentar configuración de Google Cloud Console
- [ ] Crear `.env.example` con `VITE_GOOGLE_CLIENT_ID`
- [ ] Validar que `VITE_GOOGLE_CLIENT_ID` esté configurado antes de mostrar botón
- [ ] Mensaje de error claro si Google SSO falla
- [ ] Test: Login con Google crea usuario con rol viewer
- [ ] Test: Login con Google de usuario existente funciona
- [ ] Documentación en README sobre cómo configurar Google SSO

**Configuración Requerida**:
1. Crear proyecto en Google Cloud Console
2. Habilitar Google+ API
3. Crear OAuth 2.0 Client ID
4. Configurar Authorized JavaScript origins
5. Configurar Authorized redirect URIs
6. Copiar Client ID a `.env.local`

---

## 🔒 SECURITY CONSIDERATIONS

### **Threat Model**:
1. **Bypass Hardcodeado**: Vector de ataque crítico eliminado
2. **Modo Demo**: Aislamiento de datos de prueba
3. **Setup Wizard**: Contraseñas fuertes desde el inicio
4. **Google SSO**: Delegación de autenticación a proveedor confiable

### **Compliance**:
- ✅ SOC 2 Type II: No credenciales hardcodeadas
- ✅ ISO 27001: Gestión de contraseñas seguras
- ✅ NIST SP 800-63B: Contraseñas de 12+ caracteres
- ✅ GDPR: Datos de demo no persisten

### **Audit Trail**:
- Todos los logins registrados en `SystemLogger`
- Modo demo identificable en logs
- Creación de admin registrada en auditoría
- Cambios de configuración registrados

---

## 📊 SUCCESS METRICS

### **Seguridad**:
- [ ] 0 credenciales hardcodeadas en código
- [ ] 100% de logins registrados en auditoría
- [ ] 0 vulnerabilidades críticas en scan de seguridad

### **UX**:
- [ ] Tiempo promedio de setup < 5 minutos
- [ ] 0 errores en wizard de configuración
- [ ] Modo demo funcional sin registro

### **Calidad**:
- [ ] 100% de tests pasando
- [ ] Cobertura de código > 80% en nuevos componentes
- [ ] 0 errores de TypeScript

---

## 🚀 OUT OF SCOPE (Futuras Iteraciones)

- 2FA (Two-Factor Authentication)
- SSO con Azure AD / Okta
- Políticas de rotación de contraseñas
- Gestión de sesiones activas
- IP whitelisting
- Rate limiting de login

---

## 📚 REFERENCIAS

- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) - Password Guidelines
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- `REPORTE_SISTEMA_ROLES_USUARIOS.md` - Evaluación de seguridad actual

---

**Última Actualización**: 5 de febrero de 2026
**Autor**: Kiro AI Assistant
**Revisores**: Pendiente
**Estado**: Draft - Pendiente de Aprobación
