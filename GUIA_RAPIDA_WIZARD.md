# 🚀 Guía Rápida: Initial Setup Wizard

## ¿Qué es esto?

El Initial Setup Wizard es un asistente de configuración inicial que aparece la primera vez que un usuario accede al sistema. Reemplaza las credenciales hardcodeadas (`admin/admin123`) con un flujo profesional y seguro.

## 🎯 Cómo Funciona

### Detección Automática

El sistema detecta automáticamente si necesita mostrar el wizard:

```
¿Existen usuarios en la base de datos?
│
├─ NO → Muestra Setup Wizard
│
└─ SÍ → ¿Usuario autenticado?
         │
         ├─ NO → Muestra Login
         │
         └─ SÍ → Muestra App Principal
```

### Flujo del Wizard (5 Pasos)

1. **Bienvenida** → Introducción al proceso
2. **Crear Admin** → Usuario administrador inicial
3. **Seguridad** → Master Key y cifrado
4. **Empresa** → Datos de la compañía (opcional)
5. **Confirmación** → Resumen y finalización

## 🧪 Probar el Wizard

### Método 1: Limpiar localStorage

```javascript
// En DevTools Console (F12):
localStorage.removeItem('initial_setup_completed');
location.reload();
```

### Método 2: Limpiar Base de Datos

1. F12 → Application → IndexedDB
2. Eliminar `accountexpress`
3. Recargar página (F5)

## 📝 Ejemplo de Configuración

### Paso 2: Admin Creation
```
Usuario:     admin
Email:       admin@miempresa.com
Nombre:      Administrador Principal
Contraseña:  Admin123!@#$ (mínimo 12 caracteres)
```

### Paso 3: Security
```
✓ Descargar Master Key (archivo .txt)
✓ Marcar "He guardado mi Master Key de forma segura"
```

### Paso 4: Company Info (Opcional)
```
Nombre:      Mi Empresa LLC
Tax ID:      12-3456789
Dirección:   123 Main St, Miami, FL
```

### Paso 5: Confirmation
```
✓ Revisar resumen
✓ Click "Finalizar y Acceder al Sistema"
→ Redirect automático a /login
```

## ✅ Verificación

Después de completar el wizard:

1. Serás redirigido a la pantalla de login
2. Ingresa con las credenciales creadas
3. Deberías acceder al sistema normalmente
4. El wizard NO volverá a aparecer

## 🔒 Seguridad

### Validación de Contraseña
- ✅ Mínimo 12 caracteres
- ✅ Al menos 1 mayúscula (A-Z)
- ✅ Al menos 1 minúscula (a-z)
- ✅ Al menos 1 número (0-9)
- ✅ Al menos 1 símbolo (!@#$%^&*)

### Cifrado
- ✅ PBKDF2 con 600,000 iteraciones
- ✅ Master Key de 32 bytes
- ✅ Sin credenciales hardcodeadas

## 🐛 Troubleshooting

### El wizard no aparece
```javascript
// Verificar en Console:
localStorage.getItem('initial_setup_completed')
// Si retorna 'true', el wizard está deshabilitado

// Para forzar el wizard:
localStorage.removeItem('initial_setup_completed');
location.reload();
```

### Error al crear usuario
- Verificar que la contraseña cumple los requisitos
- Verificar que el email es válido
- Verificar que el usuario no existe ya

### Wizard se muestra en loop
```javascript
// Verificar que el flag se guardó:
localStorage.getItem('initial_setup_completed')
// Debe retornar 'true'

// Si no, completar el wizard correctamente
// o forzar el flag manualmente:
localStorage.setItem('initial_setup_completed', 'true');
```

## 📂 Archivos Relacionados

```
src/
├── components/
│   ├── AppRouter.tsx              # Router principal
│   └── setup/
│       ├── InitialSetupWizard.tsx # Wizard principal
│       └── steps/
│           ├── WelcomeStep.tsx
│           ├── AdminStep.tsx
│           ├── SecurityStep.tsx
│           ├── CompanyStep.tsx
│           └── ConfirmationStep.tsx
├── database/
│   └── simple-db.ts               # hasUsers()
└── App.tsx                        # Integración
```

## 🎨 Personalización

### Cambiar colores del wizard

Editar `InitialSetupWizard.tsx`:
```typescript
// Fondo del wizard:
className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"

// Cambiar a:
className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900"
```

### Cambiar validación de contraseña

Editar `AdminStep.tsx`:
```typescript
const MIN_PASSWORD_LENGTH = 12; // Cambiar a 8, 10, 16, etc.
```

### Deshabilitar paso de empresa

Editar `InitialSetupWizard.tsx`:
```typescript
// Comentar o eliminar:
{currentStep === 3 && <CompanyStep data={formData} onNext={handleNext} />}
```

## 💡 Tips

1. **Master Key:** Guárdala en un lugar seguro (password manager, caja fuerte)
2. **Contraseña:** Usa un password manager para generar contraseñas fuertes
3. **Email:** Usa un email real para recuperación de cuenta
4. **Testing:** Usa datos de prueba en desarrollo, datos reales en producción

## 🚀 Próximos Pasos

Después de completar el wizard:

1. Configurar información de empresa en Settings
2. Crear usuarios adicionales en Admin → Users
3. Configurar roles y permisos
4. Importar datos iniciales (clientes, productos, etc.)
5. Configurar backup automático

---

**¿Necesitas ayuda?** Consulta `RESUMEN_INTEGRACION_WIZARD.md` para detalles técnicos completos.
