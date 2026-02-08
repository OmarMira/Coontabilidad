---
name: Design System
description: Sistema de diseño unificado para AccountExpress. Define paleta de colores, tipografía, componentes base y patrones visuales del dark theme. Incluye herramientas de auditoría para detectar inconsistencias.
---

# Design System Skill

**Propósito**: Mantener consistencia visual en toda la aplicación AccountExpress mediante un sistema de diseño estandarizado.

## 🎨 PALETA DE COLORES

### Fondos (Backgrounds)

```css
/* Fondos principales */
bg-slate-950           /* Fondo más oscuro - Headers de tablas */
bg-slate-900/50        /* Fondo principal cards - Semi-transparente */
bg-slate-900/30        /* Fondo secundario - Tbody de tablas */
bg-slate-900           /* Fondo sólido - Hover states */

/* Bordes */
border-slate-800       /* Borde principal */
border-slate-700       /* Borde hover */

/* Estados especiales */
bg-slate-800/50        /* Hover en filas de tabla */
```

### Textos (Typography Colors)

```css
/* Textos principales */
text-white             /* Títulos principales, valores importantes */
text-slate-300         /* Textos secundarios, datos numéricos */
text-slate-400         /* Labels, subtítulos, datos terciarios */
text-slate-500         /* Headers de tabla (UPPERCASE) */

/* Textos de acento */
text-green-400         /* Valores positivos, ingresos */
text-red-400           /* Valores negativos, gastos */
text-blue-400/500      /* Links, acciones primarias */
text-orange-400/500    /* Advertencias */
text-emerald-400       /* Totales, confirmaciones */
```

### Componentes Especiales

```css
/* Alerts y Banners */
bg-blue-900/20 border-l-4 border-blue-500     /* Info */
bg-orange-900/20 border-l-4 border-orange-500 /* Warning */
bg-red-900/20 border-l-4 border-red-500       /* Error */
bg-green-900/20 border-l-4 border-green-500   /* Success */
```

---

## 📝 SISTEMA DE TIPOGRAFÍA

### Tamaños y Pesos

```css
/* Headers de página */
text-3xl font-black text-white tracking-tight

/* Subtítulos de página */
text-sm font-bold text-slate-400

/* Headers de secciones/cards */
text-lg font-black text-white tracking-tight

/* Headers de tabla */
text-[10px] font-black text-slate-500 uppercase tracking-widest

/* Valores principales (KPIs, stats) */
text-3xl font-black text-white tabular-nums

/* Valores en tablas */
text-sm font-bold text-white        /* Datos importantes */
text-sm font-semibold text-white    /* Nombres, labels */
text-sm font-medium text-slate-400  /* Datos secundarios */

/* Labels y subtítulos */
text-xs font-bold text-slate-500
```

### Clases Compositivas Estándar

```tsx
// Header de página
<h1 className="text-3xl font-black text-white tracking-tight">

// Subtítulo de página
<p className="text-slate-400 mt-1 text-sm font-bold">

// Header de card/sección
<h2 className="text-lg font-black text-white mb-6 tracking-tight">

// Header de columna de tabla
<th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
```

---

## 🧩 COMPONENTES BASE

### 1. StatCard (KPI Card)

```tsx
<div className="bg-slate-900/50 rounded-xl shadow-xl p-6 hover:bg-slate-900 transition-all border border-slate-800 hover:border-slate-700 group">
  {/* Header con título e icono */}
  <div className="flex items-center justify-between mb-4">
    <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
      {title}
    </div>
    <div className={`${iconColor} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
  </div>
  
  {/* Valor principal */}
  <div className="text-3xl font-black text-white mb-1 tabular-nums">
    {value}
  </div>
  
  {/* Subtítulo */}
  <div className="text-xs text-slate-500 font-bold">
    {subtitle}
  </div>
</div>
```

### 2. Card Container

```tsx
<div className="bg-slate-900/50 rounded-xl shadow-xl p-6 border border-slate-800">
  <h2 className="text-lg font-black text-white mb-6 tracking-tight">
    {title}
  </h2>
  {/* Contenido */}
</div>
```

### 3. Table Layout

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-slate-800">
    {/* Header */}
    <thead className="bg-slate-950/50">
      <tr>
        <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Columna
        </th>
      </tr>
    </thead>
    
    {/* Body */}
    <tbody className="bg-slate-900/30 divide-y divide-slate-800">
      <tr className="hover:bg-slate-800/50 transition-colors">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
          Dato
        </td>
      </tr>
    </tbody>
    
    {/* Footer (opcional) */}
    <tfoot className="bg-slate-950/70 border-t-2 border-emerald-500/30">
      <tr>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-emerald-400 uppercase">
          TOTAL
        </td>
      </tr>
    </tfoot>
  </table>
</div>
```

### 4. Button Styles

```tsx
// Botón primario
className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"

// Botón secundario
className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition-colors"

// Botón de peligro
className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"

// Botón de éxito
className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
```

### 5. Form Input

```tsx
<input
  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
  placeholder="Placeholder"
/>
```

---

## 📊 CHARTS (Recharts)

### Configuración Estándar

```tsx
// CartesianGrid
<CartesianGrid strokeDasharray="3 3" stroke="#334155" />

// Ejes
<XAxis stroke="#94a3b8" />
<YAxis stroke="#94a3b8" />

// Tooltip
<Tooltip
  contentStyle={{
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '0.5rem',
    color: '#fff'
  }}
/>

// Colores de barras/líneas
fill="#3b82f6"  // Azul
fill="#10b981"  // Verde
fill="#ef4444"  // Rojo
fill="#f59e0b"  // Naranja
stroke="#10b981" // Verde (líneas)
```

---

## 🎯 PATRONES DE DISEÑO

### Page Layout

```tsx
<div className="p-6 space-y-6">
  {/* Header */}
  <div>
    <h1 className="text-3xl font-black text-white tracking-tight">
      Título de Página
    </h1>
    <p className="text-slate-400 mt-1 text-sm font-bold">
      Descripción de la página
    </p>
  </div>

  {/* Stats Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* StatCards */}
  </div>

  {/* Content Cards */}
  <div className="bg-slate-900/50 rounded-xl shadow-xl p-6 border border-slate-800">
    {/* Contenido */}
  </div>
</div>
```

### Alert/Banner Pattern

```tsx
<div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-xl">
  <div className="flex items-center">
    <AlertCircle className="w-5 h-5 text-blue-400 mr-3" />
    <div>
      <p className="text-sm font-bold text-blue-300">Título</p>
      <p className="text-xs text-blue-400 mt-1 font-semibold">Descripción</p>
    </div>
  </div>
</div>
```

---

## 🔍 AUDITORÍA Y DETECCIÓN

### Patrones a EVITAR

```css
/* ❌ NO USAR - Tema claro */
bg-white
bg-gray-50
bg-gray-100
text-gray-900
text-gray-800
border-gray-200

/* ✅ USAR EN SU LUGAR */
bg-slate-900/50
bg-slate-950/50
bg-slate-900/30
text-white
text-slate-300
border-slate-800
```

### Script de Auditoría

Para detectar componentes con estilos inconsistentes, buscar en archivos `.tsx`:

```bash
# Buscar fondos claros
grep -r "bg-white\|bg-gray-" src/components/

# Buscar textos oscuros
grep -r "text-gray-900\|text-gray-800" src/components/

# Buscar bordes claros
grep -r "border-gray-200\|border-gray-300" src/components/
```

---

## 🚀 APLICACIÓN DEL SKILL

### Cuando crear un nuevo componente:

1. **Usar componentes base** documentados arriba
2. **Seguir la paleta de colores** establecida
3. **Aplicar tipografía estándar** según el tipo de contenido
4. **Usar clases de transición** para hover states
5. **Mantener consistencia** con componentes similares existentes

### Cuando refactorizar un componente existente:

1. **Identificar** elementos que no siguen el estándar
2. **Reemplazar** bg-white → bg-slate-900/50
3. **Reemplazar** text-gray-900 → text-white
4. **Reemplazar** border-gray-200 → border-slate-800
5. **Actualizar** tipografía según patrones documentados
6. **Verificar** charts usan colores oscuros apropiados

---

## 📋 CHECKLIST DE COMPONENTE

Antes de considerar un componente terminado, verificar:

- [ ] Usa `bg-slate-900/50` o similar para fondos de cards
- [ ] Usa `text-white` para títulos principales
- [ ] Usa `text-slate-400/500` para labels y subtítulos
- [ ] Headers de tabla usan `text-[10px] font-black text-slate-500 uppercase tracking-widest`
- [ ] Tablas usan `bg-slate-950/50` para thead y `bg-slate-900/30` para tbody
- [ ] Hover states tienen `hover:bg-slate-800/50 transition-colors`
- [ ] Charts usan `stroke="#334155"` para grid y `stroke="#94a3b8"` para ejes
- [ ] Tooltips de charts tienen fondo `#1e293b`
- [ ] Borders usan `border-slate-800` con hover `border-slate-700`
- [ ] Footers de tablas usan `bg-slate-950/70 border-t-2 border-emerald-500/30`

---

## 🎨 EJEMPLO COMPLETO

```tsx
import React from 'react';
import { Users } from 'lucide-react';

export const ExampleComponent: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Ejemplo de Componente
        </h1>
        <p className="text-slate-400 mt-1 text-sm font-bold">
          Descripción del módulo siguiendo el design system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* StatCard */}
        <div className="bg-slate-900/50 rounded-xl shadow-xl p-6 hover:bg-slate-900 transition-all border border-slate-800 hover:border-slate-700 group">
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
              Total Users
            </div>
            <div className="text-blue-500 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mb-1 tabular-nums">
            1,234
          </div>
          <div className="text-xs text-slate-500 font-bold">
            +12% vs mes anterior
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900/50 rounded-xl shadow-xl p-6 border border-slate-800">
        <h2 className="text-lg font-black text-white mb-6 tracking-tight">
          Lista de Datos
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/50">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Nombre
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Valor
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900/30 divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                  Item 1
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-400">
                  $1,000
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-950/70 border-t-2 border-emerald-500/30">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-emerald-400 uppercase">
                  TOTAL
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black text-white">
                  $1,000
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
```

---

## 🔧 HERRAMIENTAS

### Comando rápido de auditoría

Usar el comando grep para buscar componentes que no siguen el estándar:

```bash
# Encontrar todos los archivos con bg-white
grep -l "bg-white" src/components/**/*.tsx

# Encontrar todos los archivos con text-gray-900
grep -l "text-gray-900" src/components/**/*.tsx
```

---

## 📚 REFERENCIAS

- **Dashboards actualizados**: CustomerDashboard, SupplierDashboard, FinancialDashboard, InventoryDashboard, PayrollDashboard
- **Componente principal**: Dashboard.tsx (radar de cumplimiento)

**Última actualización**: 2026-02-08
