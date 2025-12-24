# 🚀 Setup AccountExpress Next-Gen

## Pasos de Instalación

### 1. Instalación Completa (Recomendado)
```bash
npm run setup
```

### 2. O Instalación Manual
```bash
# Instalar dependencias
npm install

# Copiar archivos SQL.js (automático con postinstall)
# Si falla, ejecutar manualmente:
node scripts/copy-sql-files.js
```

### 3. Ejecutar en Desarrollo
```bash
npm run dev
```

### 4. Abrir en el Navegador
La aplicación estará disponible en: `http://localhost:3000`

## ✅ Verificación del Setup

Después de ejecutar `npm run dev`, deberías ver:

1. **Consola del navegador**: Mensajes de inicialización de SQLite con OPFS
2. **Pantalla de carga**: "Inicializando AccountExpress..."
3. **Dashboard principal**: Con mensaje "cifrado AES-256 habilitado"
4. **Header**: Mostrando "AES-256" y "Seguro y Local"
5. **Persistencia real**: Los datos se mantienen al recargar la página

## 🔒 Características de Seguridad Implementadas

- ✅ **Cifrado AES-256-GCM**: Datos cifrados en reposo
- ✅ **OPFS**: Almacenamiento persistente del navegador
- ✅ **Auditoría**: Log inmutable de todas las operaciones
- ✅ **Auto-backup**: Guardado automático cada 30 segundos
- ✅ **Transacciones**: Operaciones atómicas con rollback

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo

# Construcción
npm run build        # Construir para producción
npm run preview      # Vista previa de producción

# Calidad de código
npm run lint         # Verificar código con ESLint
```

## 📁 Estructura del Proyecto Actualizada

```
accountexpress-nextgen/
├── public/
│   ├── calculator.svg          # Icono de la app
│   ├── sql-wasm.js            # SQLite WebAssembly
│   └── sql-wasm.wasm          # SQLite WebAssembly binario
├── src/
│   ├── components/             # Componentes React
│   ├── core/
│   │   └── security/
│   │       └── BasicEncryption.ts  # Cifrado AES-256
│   ├── database/
│   │   └── simple-db.ts        # SQLite con OPFS y cifrado
│   ├── App.tsx                 # Componente principal
│   ├── main.tsx               # Punto de entrada
│   └── index.css              # Estilos globales
├── package.json               # Dependencias
├── vite.config.ts            # Configuración Vite
└── tsconfig.json             # Configuración TypeScript
```

## 🎯 Funcionalidades Implementadas

### ✅ **Persistencia Real:**
- OPFS (Origin Private File System) como almacenamiento principal
- localStorage como fallback
- Auto-guardado cada 30 segundos
- Persistencia garantizada al recargar

### ✅ **Seguridad:**
- Cifrado AES-256-GCM con Web Crypto API
- Derivación de claves con PBKDF2 (100,000 iteraciones)
- Salt e IV únicos por sesión
- Verificación de integridad con SHA-256

### ✅ **Auditoría:**
- Log inmutable de todas las operaciones
- Transacciones atómicas con rollback
- Registro de cambios (antes/después)
- Timestamps precisos

### ✅ **Base de Datos:**
- SQLite con modo WAL habilitado
- Esquema completo con 4 tablas
- Índices optimizados
- Validaciones de integridad

## 🐛 Solución de Problemas

### Error: "sql-wasm.js not found"
```bash
# Ejecutar script de copia
node scripts/copy-sql-files.js

# O copiar manualmente
cp node_modules/sql.js/dist/sql-wasm.js public/
cp node_modules/sql.js/dist/sql-wasm.wasm public/
```

### Error: "Failed to decrypt database"
- La contraseña por defecto es: `AccountExpress2024!`
- Si cambias la contraseña, asegúrate de usar la misma

### Los datos no persisten
- Verificar que el navegador soporte OPFS
- Revisar la consola para errores de OPFS
- Fallback automático a localStorage

### Error de cifrado
- Verificar que el navegador soporte Web Crypto API
- Usar HTTPS en producción (requerido para Web Crypto)

### Errores de TypeScript
```bash
# Verificar tipos
npm run type-check

# Linting
npm run lint
```

## 📊 Verificación de Funcionalidades

### Test de Persistencia:
1. Agregar un cliente
2. Recargar la página
3. ✅ El cliente debe seguir ahí

### Test de Cifrado:
1. Abrir DevTools → Application → Storage
2. Verificar que los datos en OPFS/localStorage estén cifrados
3. ✅ No debe verse texto plano

### Test Offline:
1. Desconectar internet
2. Usar la aplicación normalmente
3. ✅ Debe funcionar completamente

## 🚀 Próximos Pasos

Una vez verificado el MVP:

1. **Agregar módulo de productos** con inventario
2. **Implementar facturación** con cálculos de Florida Tax
3. **Expandir auditoría** con reportes
4. **Agregar backup/restore** manual
5. **Implementar PWA** para instalación

---

**¡AccountExpress Next-Gen con seguridad empresarial listo!** 🔒🎉