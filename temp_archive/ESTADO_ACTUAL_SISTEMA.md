# Estado Actual del Sistema - Diagnóstico

## ❌ PROBLEMAS IDENTIFICADOS

### 1. Botón de Google Desaparecido
**Causa**: La variable `showGoogleLogin` estaba hardcodeada a `true` pero debería verificar si Google OAuth está configurado.

**Solución Aplicada**: 
```typescript
const showGoogleLogin = isGoogleConfigured(); // Ahora verifica el Client ID
```

**Resultado**: El botón de Google solo aparecerá si el Client ID en `.env.local` es válido (más de 10 caracteres y no es el placeholder).

---

### 2. Wizard de Configuración Inicial No Aparece
**Causa**: El wizard solo se muestra cuando:
- No existe el flag `initial_setup_completed` en localStorage
- Y no hay usuarios en la base de datos

**Problema**: Cuando haces clic en "ACCESO RÁPIDO DEMO", se crea un usuario `guest` en la base de datos, entonces `hasUsers()` retorna `true` y el wizard nunca se muestra.

**Flujo Actual**:
```
Usuario hace clic en "ACCESO RÁPIDO DEMO"
  ↓
Se ejecuta loginAsGuest()
  ↓
Se crea usuario "guest" en la base de datos
  ↓
hasUsers() = true
  ↓
AppRouter NO muestra el wizard
  ↓
Usuario ve el Dashboard directamente
```

---

## 🎯 LO QUE QUERÍAS

Según tu descripción original:
> "quiero que quede operativo para que lo use el dueño potencial del sistema, migrando los datos y cargandolo como administrado, al primero y a los siguientes como vendedores"

**Flujo Deseado**:
1. Usuario nuevo abre la aplicación → Ve el Wizard de Configuración Inicial
2. Completa el wizard creando el primer usuario admin
3. Usuarios subsecuentes con Google → Se crean como vendedores
4. El admin puede cambiar roles después

---

## 🔧 SOLUCIONES POSIBLES

### Opción A: Eliminar el Botón "ACCESO RÁPIDO DEMO"
- **Pros**: Fuerza a todos a pasar por el wizard o login con Google
- **Contras**: Pierdes la funcionalidad de demo rápido

### Opción B: Modificar el Wizard para que Aparezca Siempre que No Haya Admin
- **Pros**: Mantiene el botón demo pero muestra wizard si no hay admin
- **Contras**: Más complejo, necesita lógica adicional

### Opción C: Cambiar el Botón Demo para que Muestre el Wizard
- **Pros**: El botón demo inicia el proceso de configuración
- **Contras**: Cambia el propósito del botón

### Opción D: Separar "Demo" de "Configuración Inicial"
- **Pros**: Dos flujos claros y separados
- **Contras**: Más botones en la pantalla de login

---

## 📋 ESTADO ACTUAL DE ARCHIVOS MODIFICADOS

### ✅ Archivos Corregidos:
1. `src/components/auth/LoginForm.tsx` - Botón de Google ahora verifica configuración
2. `src/contexts/AuthContext.tsx` - Login con Google asigna roles automáticamente
3. `src/components/auth/GoogleLoginButton.tsx` - Desactivado popup automático

### 📄 Archivos que Necesitan Revisión:
1. `src/components/AppRouter.tsx` - Lógica del wizard vs demo
2. `src/components/setup/InitialSetupWizard.tsx` - Flujo del wizard

---

## 🤔 PREGUNTA PARA TI

**¿Qué prefieres?**

A) Eliminar el botón "ACCESO RÁPIDO DEMO" y forzar a todos a usar el wizard o Google login

B) Cambiar el botón "ACCESO RÁPIDO DEMO" para que inicie el wizard de configuración inicial

C) Mantener el demo como está pero agregar un botón separado "CONFIGURACIÓN INICIAL"

D) Otra idea que tengas en mente

---

**Fecha**: 2026-02-06  
**Estado**: Esperando decisión del usuario
