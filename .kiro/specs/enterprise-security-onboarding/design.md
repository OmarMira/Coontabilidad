# Enterprise Security Onboarding - Design Document

**Fecha**: 5 de febrero de 2026
**Versión**: 1.0
**Estado**: Draft

---

## 🏗️ ARQUITECTURA

### **Componentes Principales**

```
┌─────────────────────────────────────────────────────────┐
│                    LoginForm.tsx                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Traditional  │  │ Google SSO   │  │ Demo Mode    │ │
│  │ Login        │  │ Button       │  │ Button       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   AuthContext.tsx                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ login() - Removed Bypass, Uses UserService       │  │
│  │ loginWithGoogle() - OAuth Integration            │  │
│  │ loginAsGuest() - NEW: Sandbox Mode               │  │
│  │ logout() - Clear session                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  UserService.ts                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ authenticateUser() - Verify credentials          │  │
│  │ createUser() - Create new user                   │  │
│  │ getRoles() - Get available roles                 │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   simple-db.ts                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ NEW: guestModeInterceptor() - Block persistence  │  │
│  │ NEW: enforceGuestLimits() - Max 20 records       │  │
│  │ verifyPassword() - PBKDF2 verification           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```


### **Initial Setup Wizard Flow**

```
┌─────────────────────────────────────────────────────────┐
│              App.tsx (Root Component)                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Check: localStorage.initial_setup_completed?     │  │
│  │   NO  → Show InitialSetupWizard                  │  │
│  │   YES → Show LoginForm                           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│           InitialSetupWizard.tsx (NEW)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Step 1: Welcome                                  │  │
│  │ Step 2: Create Admin User                        │  │
│  │ Step 3: Security Configuration (Master Key)      │  │
│  │ Step 4: Company Information                      │  │
│  │ Step 5: Confirmation                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 SECURITY DESIGN

### **REQ-1: Eliminar Bypass Hardcodeado**

**Cambios en `AuthContext.tsx`**:

```typescript
// ❌ ANTES (INSEGURO):
const login = async (username: string, password: string): Promise<boolean> => {
    // Bypass hardcodeado (ELIMINAR)
    if (username === 'demo' && password === 'demo123') { ... }
    if (username === 'admin' && password === 'admin123') { ... }
    
    // Autenticación real
    const result = await UserService.authenticateUser(username, password);
    ...
}

// ✅ DESPUÉS (SEGURO):
const login = async (username: string, password: string): Promise<boolean> => {
    try {
        // Solo autenticación de base de datos
        const result = await UserService.authenticateUser(username, password);
        
        if (result.success && result.data) {
            const dbUser = result.data;
            const userData: User = {
                id: dbUser.id,
                username: dbUser.username,
                email: dbUser.email,
                full_name: dbUser.full_name,
                display_name: dbUser.display_name,
                role: dbUser.role_name || 'user',
                role_id: dbUser.role_id,
                role_level: dbUser.role_level,
                permissions: dbUser.permissions_json ? JSON.parse(dbUser.permissions_json) : {}
            };
            
            setUser(userData);
            localStorage.setItem('accountexpress_user', JSON.stringify(userData));
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
};
```

**Verificación**:
- Buscar en bundle de producción: `grep -r "admin123" dist/` → 0 resultados
- Test unitario: `expect(await login('admin', 'admin123')).toBe(false)`

---

### **REQ-2: Modo Sandbox (Demo Seguro)**

**Nuevo Rol GUEST**:

```sql
INSERT INTO user_roles (name, description, level, permissions_json, is_system_role)
VALUES (
    'guest',
    'Usuario de demostración con acceso limitado',
    5,
    '{
        "dashboard": ["view"],
        "customers": ["view", "create"],
        "suppliers": ["view", "create"],
        "products": ["view", "create"],
        "sales": ["view_invoices", "create_invoice"],
        "purchases": ["view_bills"],
        "accounting": ["view_chart_of_accounts", "view_reports"],
        "reports": ["view_financial", "view_tax"],
        "settings": []
    }',
    1
);
```

**Nueva Función en `AuthContext.tsx`**:

```typescript
const loginAsGuest = async (): Promise<boolean> => {
    try {
        const guestUser: User = {
            id: -1, // ID negativo para identificar sesión temporal
            username: 'guest',
            email: 'guest@demo.local',
            full_name: 'Usuario de Demostración',
            display_name: 'Demo User',
            role: 'guest',
            role_id: 0,
            role_level: 5,
            permissions: {
                dashboard: ["view"],
                customers: ["view", "create"],
                suppliers: ["view", "create"],
                products: ["view", "create"],
                sales: ["view_invoices", "create_invoice"],
                purchases: ["view_bills"],
                accounting: ["view_chart_of_accounts", "view_reports"],
                reports: ["view_financial", "view_tax"],
                settings: []
            },
            isGuest: true // Flag especial
        };
        
        setUser(guestUser);
        sessionStorage.setItem('accountexpress_guest', JSON.stringify(guestUser));
        
        // Iniciar timer de expiración (30 minutos)
        setTimeout(() => {
            if (user?.isGuest) {
                logout();
                alert('Sesión de demostración expirada. Por favor inicia sesión nuevamente.');
            }
        }, 30 * 60 * 1000);
        
        return true;
    } catch (error) {
        console.error('Guest login error:', error);
        return false;
    }
};
```


**Interceptor de Persistencia en `simple-db.ts`**:

```typescript
// Límites por entidad para modo GUEST
const GUEST_LIMITS: Record<string, number> = {
    customers: 20,
    suppliers: 20,
    products: 20,
    invoices: 10,
    bills: 10,
    journal_entries: 5,
    employees: 0,
    users: 0,
    user_roles: 0,
    payroll_settings: 0
};

/**
 * Verifica si el usuario actual es GUEST y aplica límites
 */
export function enforceGuestLimits(tableName: string): { allowed: boolean; message?: string } {
    // Obtener usuario actual de sessionStorage
    const guestData = sessionStorage.getItem('accountexpress_guest');
    if (!guestData) return { allowed: true }; // No es guest, permitir
    
    const guest = JSON.parse(guestData);
    if (!guest.isGuest) return { allowed: true };
    
    // Verificar si la tabla tiene límites
    const limit = GUEST_LIMITS[tableName];
    if (limit === undefined) return { allowed: true }; // Sin límite definido
    
    if (limit === 0) {
        return {
            allowed: false,
            message: `Modo Demo: No puedes modificar ${tableName} en modo demostración`
        };
    }
    
    // Contar registros actuales
    if (!db) return { allowed: false, message: 'Database not initialized' };
    
    try {
        const result = db.exec(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = result[0]?.values[0]?.[0] as number || 0;
        
        if (count >= limit) {
            return {
                allowed: false,
                message: `Modo Demo: Límite de ${limit} registros alcanzado para ${tableName}`
            };
        }
        
        return { allowed: true };
    } catch (error) {
        console.error('Error checking guest limits:', error);
        return { allowed: false, message: 'Error verificando límites' };
    }
}

/**
 * Wrapper para operaciones INSERT que verifica límites de GUEST
 */
export function guestSafeInsert(tableName: string, insertFn: () => any): any {
    const check = enforceGuestLimits(tableName);
    
    if (!check.allowed) {
        throw new Error(check.message || 'Operación no permitida en modo demo');
    }
    
    return insertFn();
}
```

**Uso en Funciones de Creación**:

```typescript
// Ejemplo: createCustomer()
export function createCustomer(customer: Partial<Customer>): { success: boolean; message: string; id?: number } {
    if (!db) return { success: false, message: 'Database not initialized' };
    
    try {
        // Verificar límites de GUEST
        const guestCheck = enforceGuestLimits('customers');
        if (!guestCheck.allowed) {
            return { success: false, message: guestCheck.message || 'Operación no permitida' };
        }
        
        // Continuar con la creación normal...
        db.run('BEGIN TRANSACTION');
        // ...
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
```

---

### **REQ-3: Initial Setup Wizard**

**Componente Principal**: `src/components/setup/InitialSetupWizard.tsx`

```typescript
interface SetupStep {
    id: number;
    title: string;
    description: string;
    component: React.ComponentType<StepProps>;
}

const SETUP_STEPS: SetupStep[] = [
    { id: 1, title: 'Bienvenida', description: 'Configuración inicial', component: WelcomeStep },
    { id: 2, title: 'Administrador', description: 'Crear usuario admin', component: AdminStep },
    { id: 3, title: 'Seguridad', description: 'Configurar cifrado', component: SecurityStep },
    { id: 4, title: 'Empresa', description: 'Datos de la empresa', component: CompanyStep },
    { id: 5, title: 'Confirmación', description: 'Finalizar setup', component: ConfirmationStep }
];

export const InitialSetupWizard: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [setupData, setSetupData] = useState<SetupData>({});
    
    const handleNext = (stepData: any) => {
        setSetupData({ ...setupData, ...stepData });
        setCurrentStep(currentStep + 1);
    };
    
    const handleComplete = async () => {
        // Crear admin user
        await UserService.createUser({
            username: setupData.username,
            email: setupData.email,
            full_name: setupData.fullName,
            display_name: setupData.displayName,
            password: setupData.password,
            role_id: 1 // Admin role
        });
        
        // Guardar configuración de empresa
        await saveCompanySettings(setupData.company);
        
        // Marcar setup como completado
        localStorage.setItem('initial_setup_completed', 'true');
        
        // Redirect a login
        window.location.href = '/';
    };
    
    const CurrentStepComponent = SETUP_STEPS[currentStep - 1].component;
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {SETUP_STEPS.map(step => (
                            <div key={step.id} className={`flex-1 ${step.id < currentStep ? 'text-green-600' : step.id === currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
                                <div className="text-center">
                                    <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${step.id <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                                        {step.id < currentStep ? '✓' : step.id}
                                    </div>
                                    <p className="text-xs mt-2">{step.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Current Step */}
                <CurrentStepComponent
                    data={setupData}
                    onNext={handleNext}
                    onComplete={handleComplete}
                />
            </div>
        </div>
    );
};
```

