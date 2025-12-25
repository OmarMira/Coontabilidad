# 💼 Sistema de Coontabilidad

> **Sistema de Coontabilidad Local-First especializado para negocios en Florida, USA**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)

## 📊 Estado del Proyecto

**Progreso General: 75% Completado** 🚀

- ✅ **Arquitectura Base**: 100% (Seguridad, DB, Auditoría)
- ✅ **Módulos Core**: 15/20 módulos funcionales
- ✅ **Interfaz**: 30+ componentes React
- ✅ **Base de Datos**: 17 tablas, 45+ funciones CRUD
- ✅ **Módulos Críticos**: 3/3 implementados (IA, DR-15, Backup)

## 🚀 Características Principales

### 🔒 **Seguridad Empresarial**
- **Cifrado AES-256-GCM** con Web Crypto API
- **OPFS** (Origin Private File System) para persistencia real
- **Auditoría inmutable** con hash chaining
- **Offline-first** - Funciona sin internet

### 🏛️ **Cumplimiento Florida**
- Cálculo automático de **Sales Tax por condado**
- Base de datos de **67 condados de Florida**
- Preparado para **reportes DR-15**
- Validaciones específicas del estado

### 📊 **Contabilidad Profesional**
- **Partida doble** automática
- **Plan de cuentas** estándar para Florida
- **Balance General** y **Estado de Resultados**
- **Diagnóstico contable** integrado

## 🛠️ Tecnologías

```
Frontend:     React 18 + TypeScript + Vite
Base de Datos: SQLite (sql.js) + OPFS
UI/UX:        Tailwind CSS + Lucide Icons
Seguridad:    Web Crypto API + AES-256-GCM
Persistencia: OPFS + localStorage fallback
```

## 📦 Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/Coontabilidad.git
cd Coontabilidad

# 2. Instalar dependencias
npm install

# 3. Ejecutar en desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:3003
```

### 🔧 Comandos Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Construir para producción
npm run preview  # Vista previa de producción
npm run lint     # Verificar código
```

## 📋 Módulos Implementados

### ✅ **Completamente Funcionales**

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| 🏠 **Dashboard** | ✅ 100% | Panel principal con estadísticas |
| 👥 **Clientes** | ✅ 100% | CRUD completo + autocompletado direcciones |
| 🏢 **Proveedores** | ✅ 100% | Gestión completa de proveedores |
| 📄 **Facturas Venta** | ✅ 100% | Facturación con cálculo de impuestos FL |
| 📋 **Facturas Compra** | ✅ 100% | Gestión de facturas de proveedores |
| 📦 **Productos** | ✅ 100% | Catálogo completo + inventario |
| 🏷️ **Categorías** | ✅ 100% | Clasificación jerárquica |
| 📊 **Plan de Cuentas** | ✅ 100% | Estructura contable estándar |
| 📈 **Reportes Básicos** | ✅ 80% | Balance General + Estado Resultados |
| 🏢 **Datos Empresa** | ✅ 100% | Configuración + logo empresarial |
| 🔍 **Diagnóstico** | ✅ 100% | Herramientas de validación |
| 📝 **Logs Sistema** | ✅ 100% | Auditoría completa |
| 🤖 **IA No Intrusiva** | ✅ 100% | Sistema de análisis inteligente |
| 📊 **Reportes DR-15** | ✅ 100% | Cumplimiento fiscal Florida |
| 💾 **Backup Cifrado** | ✅ 100% | Sistema de respaldo .aex |

### 🚧 **En Desarrollo / Pendientes**

| Módulo | Prioridad | Estimación |
|--------|-----------|------------|
| ✏️ **Asientos Manuales** | 🔴 Alta | 2 días |
| 📚 **Libro Mayor** | 🔴 Alta | 2 días |
| 💰 **Pagos Clientes** | 🔴 Alta | 3 días |
| 💸 **Pagos Proveedores** | 🔴 Alta | 3 días |
| 👤 **Usuarios y Roles** | 🟢 Baja | 5 días |

## 🎯 Uso del Sistema

### 1. **Inicialización Automática**
- El sistema se inicializa automáticamente con SQLite local
- Datos de ejemplo incluidos para pruebas
- Cifrado AES-256 habilitado por defecto

### 2. **Gestión de Clientes**
```
INVENTARIO → Clientes → Nuevo Cliente
- 4 pestañas: Personal, Contacto, Dirección, Comercial
- Autocompletado de direcciones USA
- Validaciones de negocio integradas
```

### 3. **Facturación**
```
CUENTAS POR COBRAR → Facturas de Venta → Nueva Factura
- Cálculo automático de impuestos por condado FL
- Estados: draft, sent, paid, overdue, cancelled
- Integración con productos y clientes
```

### 4. **Inventario**
```
INVENTARIO → Productos y Servicios → Nuevo Producto
- Productos físicos y servicios
- Control de stock con alertas
- Categorización jerárquica
```

## 🏗️ Arquitectura

```
Coontabilidad/
├── 📁 src/
│   ├── 🎨 components/          # 25+ componentes React
│   ├── 🗄️ database/           # SQLite + OPFS (5,400+ líneas)
│   ├── 🔒 core/security/      # Cifrado AES-256-GCM
│   ├── 📝 core/logging/       # Sistema de auditoría
│   ├── 🛠️ services/           # Servicios (direcciones, etc.)
│   └── 🎛️ utils/              # Utilidades (logo, reportes)
├── 📁 public/                 # SQLite WebAssembly
├── 📄 package.json            # Dependencias
└── ⚙️ vite.config.ts          # Configuración Vite
```

## 🔒 Seguridad y Privacidad

- **🔐 Cifrado Local**: Todos los datos se cifran con AES-256-GCM
- **🚫 Sin Transmisión**: Ningún dato sensible sale del dispositivo
- **📝 Auditoría Completa**: Registro inmutable de todas las operaciones
- **💾 Persistencia Real**: OPFS garantiza que los datos persistan
- **🔄 Auto-backup**: Guardado automático cada 30 segundos

## 📊 Métricas del Proyecto

- **📝 Líneas de Código**: ~18,000
- **🧩 Componentes**: 30+ componentes React
- **🗄️ Base de Datos**: 17 tablas, 45+ funciones
- **🔧 Funcionalidades**: 15 módulos completos
- **🎯 Cobertura**: 75% del sistema total

## 🚀 Roadmap

### **Fase 1: Sistema de Pagos** (1 semana)
- [ ] Pagos de clientes
- [ ] Pagos a proveedores
- [ ] Métodos de pago

### **Fase 2: Contabilidad Avanzada** (1 semana)
- [ ] Asientos contables manuales
- [ ] Libro mayor detallado
- [ ] Balance de comprobación

### **Fase 3: Inventario Avanzado** (2-3 semanas)
- [ ] Movimientos de inventario
- [ ] Ajustes de stock
- [ ] Múltiples ubicaciones

### **Fase 4: Usuarios y Automatización** (2-3 semanas)
- [ ] Sistema de usuarios y roles
- [ ] Análisis predictivo avanzado
- [ ] Automatización de procesos

## 🤝 Contribuir

Este es un proyecto privado en desarrollo. Para contribuir:

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Crear** un Pull Request

## 📄 Licencia

**Propietario** - AccountExpress Next-Gen © 2024

---

## 📞 Contacto

Para soporte técnico o consultas sobre el proyecto, contacta al equipo de desarrollo.

**🎯 Sistema de Coontabilidad** - *El futuro de la contabilidad local-first para Florida*